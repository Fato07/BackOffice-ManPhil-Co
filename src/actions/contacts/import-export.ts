'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { requirePermission } from '@/lib/auth'
import { Permission } from '@/types/auth'
import { auth } from '@clerk/nextjs/server'
import {
  ActionResult,
  Prisma,
  GlobalContactCategory,
  ContactPropertyRelationship,
  exportContactsSchema,
  importContactsSchema,
  type ExportContactsData,
  type ImportContactsData
} from './types'

/**
 * Helper function to resolve property names to property IDs
 */
async function resolvePropertyLinks(
  contactProperties: { propertyId: string; relationship: ContactPropertyRelationship }[],
  errors: { row: number; error: string }[] = [],
  rowNumber?: number
): Promise<{ propertyId: string; relationship: ContactPropertyRelationship }[]> {
  const resolved: { propertyId: string; relationship: ContactPropertyRelationship }[] = []
  
  for (const link of contactProperties) {
    if (link.propertyId.startsWith('name:')) {
      // This is a property name that needs to be resolved to an ID
      const propertyName = link.propertyId.replace('name:', '')
      const property = await prisma.property.findFirst({
        where: { 
          name: { 
            equals: propertyName.trim(), 
            mode: 'insensitive' 
          } 
        },
        select: { id: true, name: true }
      })
      
      if (property) {
        resolved.push({
          propertyId: property.id,
          relationship: link.relationship
        })
      } else {
        // Property not found - add to errors with suggestion
        const similarProperties = await prisma.property.findMany({
          where: {
            name: {
              contains: propertyName.trim(),
              mode: 'insensitive'
            }
          },
          select: { name: true },
          take: 3
        })
        
        const suggestion = similarProperties.length > 0 
          ? ` Similar properties: ${similarProperties.map(p => p.name).join(', ')}`
          : ''
        
        if (rowNumber && errors) {
          errors.push({
            row: rowNumber,
            error: `Property "${propertyName}" not found.${suggestion}`
          })
        }
      }
    } else {
      // Property ID is already valid - validate it exists
      const property = await prisma.property.findFirst({
        where: { id: link.propertyId },
        select: { id: true }
      })
      
      if (property) {
        resolved.push(link)
      } else if (rowNumber && errors) {
        errors.push({
          row: rowNumber,
          error: `Property ID "${link.propertyId}" not found`
        })
      }
    }
  }
  
  return resolved
}

/**
 * Export contacts to CSV or Excel
 * - Filters can be applied
 * - Returns base64 encoded file content
 */
export async function exportContacts(
  input: ExportContactsData
): Promise<ActionResult<{ filename: string, content: string }>> {
  try {
    // Authentication check
    const { userId } = await auth()
    if (!userId) {
      return { success: false, error: 'Unauthorized' }
    }

    // Permission check
    const hasPermission = await requirePermission(Permission.CONTACTS_VIEW)
    if (!hasPermission) {
      return { success: false, error: 'You do not have permission to export contacts' }
    }

    // Validate input
    const validated = exportContactsSchema.parse(input)
    const { contactIds, filters, format } = validated

    // Build where clause
    const where: Prisma.ContactWhereInput = {}

    if (contactIds && contactIds.length > 0) {
      where.id = { in: contactIds }
    } else if (filters) {
      if (filters.search) {
        where.OR = [
          { firstName: { contains: filters.search, mode: 'insensitive' } },
          { lastName: { contains: filters.search, mode: 'insensitive' } },
          { email: { contains: filters.search, mode: 'insensitive' } },
          { phone: { contains: filters.search, mode: 'insensitive' } },
        ]
      }

      if (filters.category && filters.category !== 'ALL') {
        where.category = filters.category as GlobalContactCategory
      }

      if (filters.language) {
        where.language = filters.language
      }

      if (filters.hasLinkedProperties !== undefined) {
        if (filters.hasLinkedProperties) {
          where.contactProperties = { some: {} }
        } else {
          where.contactProperties = { none: {} }
        }
      }
    }

    // Fetch contacts
    const contacts = await prisma.contact.findMany({
      where,
      orderBy: [
        { lastName: 'asc' },
        { firstName: 'asc' }
      ],
      include: {
        contactProperties: {
          include: {
            property: true
          }
        }
      }
    })

    // Create audit log entry
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'export',
        entityType: 'contact',
        entityId: 'export',
        changes: {
          summary: `Exported ${contacts.length} contacts as ${format.toUpperCase()}`
        },
      },
    })

    // Format data based on format type
    let content: string
    const filename = `contacts_export_${new Date().toISOString().split('T')[0]}.${format}`

    if (format === 'csv') {
      // Create CSV content using database field names to match import format
      const headers = [
        'firstName',
        'lastName',
        'email',
        'phone',
        'category',
        'language',
        'comments',
        'linkedProperties'
      ]

      const rows = contacts.map(contact => [
        contact.firstName,
        contact.lastName,
        contact.email || '',
        contact.phone || '',
        contact.category,
        contact.language,
        contact.comments || '',
        contact.contactProperties.map(cp => cp.property.name).join(', ')
      ])

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => 
          `"${String(cell).replace(/"/g, '""')}"`
        ).join(','))
      ].join('\n')

      // Convert to base64
      content = Buffer.from(csvContent).toString('base64')
    } else {
      // For Excel format, we'd need a library like xlsx
      // For now, return CSV with .xlsx extension
      return {
        success: false,
        error: 'Excel export not yet implemented. Please use CSV format.'
      }
    }

    return {
      success: true,
      data: { filename, content }
    }
  } catch (_error) {
    if (_error instanceof z.ZodError) {
      const firstError = _error.issues[0]
      return {
        success: false,
        error: `Validation error: ${firstError.path.join('.')} - ${firstError.message}`,
      }
    }

    if (_error instanceof Error) {
      return {
        success: false,
        error: _error.message,
      }
    }

    return {
      success: false,
      error: 'An unexpected error occurred while exporting contacts',
    }
  }
}

/**
 * Import contacts from CSV data
 * - Validates all contacts before import
 * - Can skip duplicates or update existing
 * - Returns import summary
 */
export async function importContacts(
  input: ImportContactsData
): Promise<ActionResult<{ 
  imported: number, 
  skipped: number, 
  updated: number, 
  errors: { row: number; error: string }[] 
}>> {
  try {
    // Authentication check
    const { userId } = await auth()
    if (!userId) {
      return { success: false, error: 'Unauthorized' }
    }

    // Permission check
    const hasPermission = await requirePermission(Permission.CONTACTS_EDIT)
    if (!hasPermission) {
      return { success: false, error: 'You do not have permission to import contacts' }
    }

    // Validate input
    const validated = importContactsSchema.parse(input)
    const { contacts, skipDuplicates, updateExisting } = validated

    let imported = 0
    let skipped = 0
    let updated = 0
    const errors: { row: number; error: string }[] = []

    // Process contacts in batches to avoid overwhelming the database
    const batchSize = 10
    for (let i = 0; i < contacts.length; i += batchSize) {
      const batch = contacts.slice(i, i + batchSize)
      
      await Promise.all(batch.map(async (contact, index) => {
        try {
          // Check if contact exists by email
          let existingContact = null
          if (contact.email) {
            existingContact = await prisma.contact.findFirst({
              where: { email: contact.email }
            })
          }

          if (existingContact) {
            if (skipDuplicates) {
              skipped++
              return
            } else if (updateExisting) {
              // Update existing contact
              await prisma.contact.update({
                where: { id: existingContact.id },
                data: {
                  firstName: contact.firstName,
                  lastName: contact.lastName,
                  phone: contact.phone,
                  language: contact.language,
                  category: contact.category,
                  comments: contact.comments,
                }
              })
              updated++
              return
            }
          }

          // Create new contact
          const { contactProperties, ...contactData } = contact
          
          // Resolve property names to IDs if needed
          const resolvedContactProperties = await resolvePropertyLinks(
            contactProperties || [], 
            errors, 
            i + index + 1
          )
          
          await prisma.contact.create({
            data: {
              ...contactData,
              contactProperties: {
                create: resolvedContactProperties
              }
            }
          })
          imported++
        } catch (error) {
          errors.push({
            row: i + index + 1,
            error: error instanceof Error ? error.message : 'Unknown error'
          })
        }
      }))
    }

    // Create audit log entry
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'import',
        entityType: 'contact',
        entityId: 'import',
        changes: {
          summary: `Imported contacts: ${imported} created, ${updated} updated, ${skipped} skipped, ${errors.length} errors`
        },
      },
    })

    // Revalidate the contacts page
    revalidatePath('/contacts')

    return {
      success: true,
      data: { imported, skipped, updated, errors }
    }
  } catch (_error) {
    if (_error instanceof z.ZodError) {
      const firstError = _error.issues[0]
      return {
        success: false,
        error: `Validation error: ${firstError.path.join('.')} - ${firstError.message}`,
      }
    }

    if (_error instanceof Error) {
      return {
        success: false,
        error: _error.message,
      }
    }

    return {
      success: false,
      error: 'An unexpected error occurred while importing contacts',
    }
  }
}