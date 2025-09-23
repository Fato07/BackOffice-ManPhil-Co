'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { requirePermission } from '@/lib/auth'
import { Permission } from '@/types/auth'
import { auth } from '@clerk/nextjs/server'
import { 
  GlobalContactCategory,
  ContactPropertyRelationship,
  Prisma
} from '@/generated/prisma'
import {
  createContactSchema,
  updateContactSchema,
  bulkDeleteContactsSchema,
  linkContactToPropertySchema,
  unlinkContactFromPropertySchema,
  exportContactsSchema,
  importContactsSchema,
  contactPaginationSchema,
  contactSearchSchema,
  checkContactUniquenessSchema,
  type CreateContactData,
  type UpdateContactData,
  type BulkDeleteContactsData,
  type LinkContactToPropertyData,
  type UnlinkContactFromPropertyData,
  type ExportContactsData,
  type ImportContactsData,
  type ContactPaginationData,
  type ContactSearchData
} from '@/lib/validations/contact'

// Result type for all actions
interface ActionResult<T> {
  success: boolean
  data?: T
  error?: string
}

/**
 * Creates a new global contact
 * - Validates uniqueness of email if provided
 * - Links to properties if specified
 * - Creates audit log entry
 */
export async function createContact(
  input: CreateContactData
): Promise<ActionResult<{ contact: Prisma.ContactGetPayload<{ include: { contactProperties: { include: { property: true } } } }> }>> {
  try {
    // Authentication check
    const { userId } = await auth()
    if (!userId) {
      return { success: false, error: 'Unauthorized' }
    }

    // Permission check
    const hasPermission = await requirePermission(Permission.CONTACTS_EDIT)
    if (!hasPermission) {
      return { success: false, error: 'You do not have permission to create contacts' }
    }

    // Validate input
    const validated = createContactSchema.parse(input)
    const { contactProperties, ...contactData } = validated

    // Check email uniqueness if provided
    if (contactData.email) {
      const existing = await prisma.contact.findFirst({
        where: { email: contactData.email }
      })
      
      if (existing) {
        return { success: false, error: 'A contact with this email already exists' }
      }
    }

    // Create contact with linked properties in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the contact
      const contact = await tx.contact.create({
        data: {
          ...contactData,
        },
        include: {
          contactProperties: {
            include: {
              property: true
            }
          }
        }
      })

      // Link to properties if specified
      if (contactProperties && contactProperties.length > 0) {
        await tx.contactProperty.createMany({
          data: contactProperties.map(link => ({
            contactId: contact.id,
            propertyId: link.propertyId,
            relationship: link.relationship,
          }))
        })

        // Fetch the updated contact with relationships
        const updatedContact = await tx.contact.findUnique({
          where: { id: contact.id },
          include: {
            contactProperties: {
              include: {
                property: true
              }
            }
          }
        })

        // Create audit log entry
        await tx.auditLog.create({
          data: {
            userId,
            action: 'create',
            entityType: 'contact',
            entityId: contact.id,
            changes: {
              after: updatedContact,
              summary: `Created contact: ${contact.firstName} ${contact.lastName}`
            },
          },
        })

        return updatedContact
      }

      // Create audit log entry
      await tx.auditLog.create({
        data: {
          userId,
          action: 'create',
          entityType: 'contact',
          entityId: contact.id,
          changes: {
            after: contact,
            summary: `Created contact: ${contact.firstName} ${contact.lastName}`
          },
        },
      })

      return contact
    })

    // Revalidate the contacts page
    revalidatePath('/contacts')

    if (!result) {
      return { success: false, error: 'Failed to create contact' }
    }

    return {
      success: true,
      data: { contact: result },
    }
  } catch (error) {
    console.error('Error creating contact:', error)

    if (error instanceof z.ZodError) {
      const firstError = error.issues[0]
      return {
        success: false,
        error: `Validation error: ${firstError.path.join('.')} - ${firstError.message}`,
      }
    }

    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      }
    }

    return {
      success: false,
      error: 'An unexpected error occurred while creating the contact',
    }
  }
}

/**
 * Updates an existing global contact
 * - Validates email uniqueness if changed
 * - Updates linked properties
 * - Creates audit log entry
 */
export async function updateContact(
  input: UpdateContactData
): Promise<ActionResult<{ contact: Prisma.ContactGetPayload<{ include: { contactProperties: { include: { property: true } } } }> }>> {
  try {
    // Authentication check
    const { userId } = await auth()
    if (!userId) {
      return { success: false, error: 'Unauthorized' }
    }

    // Permission check
    const hasPermission = await requirePermission(Permission.CONTACTS_EDIT)
    if (!hasPermission) {
      return { success: false, error: 'You do not have permission to edit contacts' }
    }

    // Validate input
    const validated = updateContactSchema.parse(input)
    const { id, contactProperties, ...contactData } = validated

    // Check if contact exists
    const existingContact = await prisma.contact.findUnique({
      where: { id },
      include: {
        contactProperties: {
          include: {
            property: true
          }
        }
      }
    })

    if (!existingContact) {
      return { success: false, error: 'Contact not found' }
    }

    // Check email uniqueness if changed
    if (contactData.email && contactData.email !== existingContact.email) {
      const emailExists = await prisma.contact.findFirst({
        where: { 
          email: contactData.email,
          NOT: { id }
        }
      })
      
      if (emailExists) {
        return { success: false, error: 'A contact with this email already exists' }
      }
    }

    // Update contact and linked properties in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update the contact
      const updatedContact = await tx.contact.update({
        where: { id },
        data: contactData,
        include: {
          contactProperties: {
            include: {
              property: true
            }
          }
        }
      })

      // Update linked properties if specified
      if (contactProperties !== undefined) {
        // Delete existing relationships
        await tx.contactProperty.deleteMany({
          where: { contactId: id }
        })

        // Create new relationships
        if (contactProperties.length > 0) {
          await tx.contactProperty.createMany({
            data: contactProperties.map(link => ({
              contactId: id,
              propertyId: link.propertyId,
              relationship: link.relationship,
            }))
          })

          // Fetch the updated contact with new relationships
          const finalContact = await tx.contact.findUnique({
            where: { id },
            include: {
              contactProperties: {
                include: {
                  property: true
                }
              }
            }
          })

          // Create audit log entry
          await tx.auditLog.create({
            data: {
              userId,
              action: 'update',
              entityType: 'contact',
              entityId: id,
              changes: {
                before: existingContact,
                after: finalContact,
                summary: `Updated contact: ${finalContact!.firstName} ${finalContact!.lastName}`
              },
            },
          })

          return finalContact
        }
      }

      // Create audit log entry
      await tx.auditLog.create({
        data: {
          userId,
          action: 'update',
          entityType: 'contact',
          entityId: id,
          changes: {
            before: existingContact,
            after: updatedContact,
            summary: `Updated contact: ${updatedContact.firstName} ${updatedContact.lastName}`
          },
        },
      })

      return updatedContact
    })

    // Revalidate relevant pages
    revalidatePath('/contacts')
    revalidatePath(`/contacts/${id}`)

    if (!result) {
      return { success: false, error: 'Failed to update contact' }
    }

    return {
      success: true,
      data: { contact: result },
    }
  } catch (error) {
    console.error('Error updating contact:', error)

    if (error instanceof z.ZodError) {
      const firstError = error.issues[0]
      return {
        success: false,
        error: `Validation error: ${firstError.path.join('.')} - ${firstError.message}`,
      }
    }

    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      }
    }

    return {
      success: false,
      error: 'An unexpected error occurred while updating the contact',
    }
  }
}

/**
 * Deletes a contact
 * - Removes all property relationships
 * - Creates audit log entry
 */
export async function deleteContact(id: string): Promise<ActionResult<void>> {
  try {
    // Authentication check
    const { userId } = await auth()
    if (!userId) {
      return { success: false, error: 'Unauthorized' }
    }

    // Permission check
    const hasPermission = await requirePermission(Permission.CONTACTS_EDIT)
    if (!hasPermission) {
      return { success: false, error: 'You do not have permission to delete contacts' }
    }

    // Check if contact exists
    const contact = await prisma.contact.findUnique({
      where: { id },
      include: {
        contactProperties: true
      }
    })

    if (!contact) {
      return { success: false, error: 'Contact not found' }
    }

    // Delete contact in a transaction
    await prisma.$transaction(async (tx) => {
      // Delete the contact (cascade will handle relationships)
      await tx.contact.delete({
        where: { id }
      })

      // Create audit log entry
      await tx.auditLog.create({
        data: {
          userId,
          action: 'delete',
          entityType: 'contact',
          entityId: id,
          changes: {
            before: contact,
            summary: `Deleted contact: ${contact.firstName} ${contact.lastName}`
          },
        },
      })
    })

    // Revalidate the contacts page
    revalidatePath('/contacts')

    return { success: true }
  } catch (error) {
    console.error('Error deleting contact:', error)

    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      }
    }

    return {
      success: false,
      error: 'An unexpected error occurred while deleting the contact',
    }
  }
}

/**
 * Bulk delete contacts
 * - Deletes multiple contacts at once
 * - Creates audit log entries
 */
export async function bulkDeleteContacts(
  input: BulkDeleteContactsData
): Promise<ActionResult<{ deletedCount: number }>> {
  try {
    // Authentication check
    const { userId } = await auth()
    if (!userId) {
      return { success: false, error: 'Unauthorized' }
    }

    // Permission check
    const hasPermission = await requirePermission(Permission.CONTACTS_EDIT)
    if (!hasPermission) {
      return { success: false, error: 'You do not have permission to delete contacts' }
    }

    // Validate input
    const validated = bulkDeleteContactsSchema.parse(input)
    const { contactIds } = validated

    // Get contacts for audit log
    const contacts = await prisma.contact.findMany({
      where: { id: { in: contactIds } }
    })

    // Delete contacts in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Delete contacts
      const deleteResult = await tx.contact.deleteMany({
        where: { id: { in: contactIds } }
      })

      // Create audit log entry
      await tx.auditLog.create({
        data: {
          userId,
          action: 'bulk_delete',
          entityType: 'contact',
          entityId: 'bulk',
          changes: {
            before: contacts,
            summary: `Bulk deleted ${deleteResult.count} contacts`
          },
        },
      })

      return deleteResult
    })

    // Revalidate the contacts page
    revalidatePath('/contacts')

    return {
      success: true,
      data: { deletedCount: result.count },
    }
  } catch (error) {
    console.error('Error bulk deleting contacts:', error)

    if (error instanceof z.ZodError) {
      const firstError = error.issues[0]
      return {
        success: false,
        error: `Validation error: ${firstError.path.join('.')} - ${firstError.message}`,
      }
    }

    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      }
    }

    return {
      success: false,
      error: 'An unexpected error occurred while deleting contacts',
    }
  }
}

/**
 * Get a single contact by ID
 * - Includes linked properties
 */
export async function getContact(id: string): Promise<ActionResult<any>> {
  try {
    const { userId } = await auth()
    if (!userId) {
      return { success: false, error: 'Unauthorized' }
    }

    // Permission check
    const hasPermission = await requirePermission(Permission.CONTACTS_VIEW)
    if (!hasPermission) {
      return { success: false, error: 'You do not have permission to view contacts' }
    }

    const contact = await prisma.contact.findUnique({
      where: { id },
      include: {
        contactProperties: {
          include: {
            property: true
          }
        }
      }
    })

    if (!contact) {
      return { success: false, error: 'Contact not found' }
    }

    return {
      success: true,
      data: contact,
    }
  } catch (error) {
    console.error('Error fetching contact:', error)
    return {
      success: false,
      error: 'Failed to fetch contact',
    }
  }
}

/**
 * Get contacts with pagination and filtering
 */
export async function getContacts(
  input: ContactPaginationData
): Promise<ActionResult<{ 
  contacts: Prisma.ContactGetPayload<{ include: { contactProperties: { include: { property: true } } } }>[], 
  totalCount: number, 
  pageCount: number 
}>> {
  try {
    const { userId } = await auth()
    if (!userId) {
      return { success: false, error: 'Unauthorized' }
    }

    // Permission check
    const hasPermission = await requirePermission(Permission.CONTACTS_VIEW)
    if (!hasPermission) {
      return { success: false, error: 'You do not have permission to view contacts' }
    }

    // Validate input
    const validated = contactPaginationSchema.parse(input)
    const { page, pageSize, filters } = validated
    const skip = (page - 1) * pageSize

    // Build where clause
    const where: Prisma.ContactWhereInput = {}

    if (filters?.search) {
      where.OR = [
        { firstName: { contains: filters.search, mode: 'insensitive' } },
        { lastName: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { phone: { contains: filters.search, mode: 'insensitive' } },
      ]
    }

    if (filters?.category && filters.category !== 'ALL') {
      where.category = filters.category as GlobalContactCategory
    }

    if (filters?.language) {
      where.language = filters.language
    }

    if (filters?.hasLinkedProperties !== undefined) {
      if (filters.hasLinkedProperties) {
        where.contactProperties = { some: {} }
      } else {
        where.contactProperties = { none: {} }
      }
    }

    // Fetch contacts and total count
    const [contacts, totalCount] = await Promise.all([
      prisma.contact.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: [
          { lastName: 'asc' },
          { firstName: 'asc' }
        ],
        include: {
          contactProperties: {
            include: {
              property: true
            }
          },
          _count: {
            select: {
              contactProperties: true
            }
          }
        }
      }),
      prisma.contact.count({ where })
    ])

    return {
      success: true,
      data: {
        contacts,
        totalCount,
        pageCount: Math.ceil(totalCount / pageSize)
      }
    }
  } catch (error) {
    console.error('Error fetching contacts:', error)

    if (error instanceof z.ZodError) {
      const firstError = error.issues[0]
      return {
        success: false,
        error: `Validation error: ${firstError.path.join('.')} - ${firstError.message}`,
      }
    }

    return {
      success: false,
      error: 'Failed to fetch contacts',
      data: { contacts: [], totalCount: 0, pageCount: 0 }
    }
  }
}

/**
 * Search contacts by query
 * - Quick search for autocomplete/selection
 */
export async function searchContacts(
  input: ContactSearchData
): Promise<ActionResult<any[]>> {
  try {
    const { userId } = await auth()
    if (!userId) {
      return { success: false, error: 'Unauthorized' }
    }

    // Permission check
    const hasPermission = await requirePermission(Permission.CONTACTS_VIEW)
    if (!hasPermission) {
      return { success: false, error: 'You do not have permission to view contacts' }
    }

    // Validate input
    const validated = contactSearchSchema.parse(input)
    const { query, limit } = validated

    const contacts = await prisma.contact.findMany({
      where: {
        OR: [
          { firstName: { contains: query, mode: 'insensitive' } },
          { lastName: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
          { phone: { contains: query, mode: 'insensitive' } },
        ]
      },
      take: limit,
      orderBy: [
        { lastName: 'asc' },
        { firstName: 'asc' }
      ],
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        category: true,
      }
    })

    return {
      success: true,
      data: contacts,
    }
  } catch (error) {
    console.error('Error searching contacts:', error)

    if (error instanceof z.ZodError) {
      const firstError = error.issues[0]
      return {
        success: false,
        error: `Validation error: ${firstError.path.join('.')} - ${firstError.message}`,
      }
    }

    return {
      success: false,
      error: 'Failed to search contacts',
      data: []
    }
  }
}

/**
 * Link a contact to a property
 */
export async function linkContactToProperty(
  input: LinkContactToPropertyData
): Promise<ActionResult<void>> {
  try {
    // Authentication check
    const { userId } = await auth()
    if (!userId) {
      return { success: false, error: 'Unauthorized' }
    }

    // Permission check
    const hasPermission = await requirePermission(Permission.CONTACTS_EDIT)
    if (!hasPermission) {
      return { success: false, error: 'You do not have permission to edit contacts' }
    }

    // Validate input
    const validated = linkContactToPropertySchema.parse(input)
    const { contactId, propertyId, relationship } = validated

    // Check if contact and property exist
    const [contact, property] = await Promise.all([
      prisma.contact.findUnique({ where: { id: contactId } }),
      prisma.property.findUnique({ where: { id: propertyId } })
    ])

    if (!contact) {
      return { success: false, error: 'Contact not found' }
    }

    if (!property) {
      return { success: false, error: 'Property not found' }
    }

    // Check if relationship already exists
    const existingLink = await prisma.contactProperty.findUnique({
      where: {
        contactId_propertyId: {
          contactId,
          propertyId
        }
      }
    })

    if (existingLink) {
      return { success: false, error: 'Contact is already linked to this property' }
    }

    // Create the link in a transaction
    await prisma.$transaction(async (tx) => {
      await tx.contactProperty.create({
        data: {
          contactId,
          propertyId,
          relationship
        }
      })

      // Create audit log entry
      await tx.auditLog.create({
        data: {
          userId,
          action: 'create',
          entityType: 'contact_property_link',
          entityId: `${contactId}_${propertyId}`,
          changes: {
            after: { contactId, propertyId, relationship },
            summary: `Linked contact ${contact.firstName} ${contact.lastName} to property ${property.name} as ${relationship}`
          },
        },
      })
    })

    // Revalidate relevant pages
    revalidatePath('/contacts')
    revalidatePath(`/contacts/${contactId}`)
    revalidatePath(`/houses/${propertyId}`)

    return { success: true }
  } catch (error) {
    console.error('Error linking contact to property:', error)

    if (error instanceof z.ZodError) {
      const firstError = error.issues[0]
      return {
        success: false,
        error: `Validation error: ${firstError.path.join('.')} - ${firstError.message}`,
      }
    }

    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      }
    }

    return {
      success: false,
      error: 'An unexpected error occurred while linking contact to property',
    }
  }
}

/**
 * Unlink a contact from a property
 */
export async function unlinkContactFromProperty(
  input: UnlinkContactFromPropertyData
): Promise<ActionResult<void>> {
  try {
    // Authentication check
    const { userId } = await auth()
    if (!userId) {
      return { success: false, error: 'Unauthorized' }
    }

    // Permission check
    const hasPermission = await requirePermission(Permission.CONTACTS_EDIT)
    if (!hasPermission) {
      return { success: false, error: 'You do not have permission to edit contacts' }
    }

    // Validate input
    const validated = unlinkContactFromPropertySchema.parse(input)
    const { contactId, propertyId } = validated

    // Get the link for audit log
    const link = await prisma.contactProperty.findUnique({
      where: {
        contactId_propertyId: {
          contactId,
          propertyId
        }
      },
      include: {
        contact: true,
        property: true
      }
    })

    if (!link) {
      return { success: false, error: 'Contact is not linked to this property' }
    }

    // Delete the link in a transaction
    await prisma.$transaction(async (tx) => {
      await tx.contactProperty.delete({
        where: {
          contactId_propertyId: {
            contactId,
            propertyId
          }
        }
      })

      // Create audit log entry
      await tx.auditLog.create({
        data: {
          userId,
          action: 'delete',
          entityType: 'contact_property_link',
          entityId: `${contactId}_${propertyId}`,
          changes: {
            before: link,
            summary: `Unlinked contact ${link.contact.firstName} ${link.contact.lastName} from property ${link.property.name}`
          },
        },
      })
    })

    // Revalidate relevant pages
    revalidatePath('/contacts')
    revalidatePath(`/contacts/${contactId}`)
    revalidatePath(`/houses/${propertyId}`)

    return { success: true }
  } catch (error) {
    console.error('Error unlinking contact from property:', error)

    if (error instanceof z.ZodError) {
      const firstError = error.issues[0]
      return {
        success: false,
        error: `Validation error: ${firstError.path.join('.')} - ${firstError.message}`,
      }
    }

    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      }
    }

    return {
      success: false,
      error: 'An unexpected error occurred while unlinking contact from property',
    }
  }
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
      // Create CSV content
      const headers = [
        'First Name',
        'Last Name',
        'Email',
        'Phone',
        'Language',
        'Category',
        'Comments',
        'Linked Properties'
      ]

      const rows = contacts.map(contact => [
        contact.firstName,
        contact.lastName,
        contact.email || '',
        contact.phone || '',
        contact.language,
        contact.category,
        contact.comments || '',
        contact.contactProperties.map(cp => 
          `${cp.property.name} (${cp.relationship})`
        ).join('; ')
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
  } catch (error) {
    console.error('Error exporting contacts:', error)

    if (error instanceof z.ZodError) {
      const firstError = error.issues[0]
      return {
        success: false,
        error: `Validation error: ${firstError.path.join('.')} - ${firstError.message}`,
      }
    }

    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
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
          await prisma.contact.create({
            data: {
              ...contactData,
              contactProperties: {
                create: contactProperties
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
  } catch (error) {
    console.error('Error importing contacts:', error)

    if (error instanceof z.ZodError) {
      const firstError = error.issues[0]
      return {
        success: false,
        error: `Validation error: ${firstError.path.join('.')} - ${firstError.message}`,
      }
    }

    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      }
    }

    return {
      success: false,
      error: 'An unexpected error occurred while importing contacts',
    }
  }
}

/**
 * Check if an email is already in use
 * - Used for form validation
 */
export async function checkContactUniqueness(
  input: z.infer<typeof checkContactUniquenessSchema>
): Promise<ActionResult<{ isUnique: boolean }>> {
  try {
    const { userId } = await auth()
    if (!userId) {
      return { success: false, error: 'Unauthorized' }
    }

    // Validate input
    const validated = checkContactUniquenessSchema.parse(input)
    const { email, excludeId } = validated

    if (!email) {
      return { success: true, data: { isUnique: true } }
    }

    const where: Prisma.ContactWhereInput = { email }
    if (excludeId) {
      where.NOT = { id: excludeId }
    }

    const existing = await prisma.contact.findFirst({ where })

    return {
      success: true,
      data: { isUnique: !existing }
    }
  } catch (error) {
    console.error('Error checking contact uniqueness:', error)

    if (error instanceof z.ZodError) {
      const firstError = error.issues[0]
      return {
        success: false,
        error: `Validation error: ${firstError.path.join('.')} - ${firstError.message}`,
      }
    }

    return {
      success: false,
      error: 'Failed to check contact uniqueness',
    }
  }
}

/**
 * Get contacts for a specific property
 * - Used in property detail views
 */
export async function getPropertyContacts(
  propertyId: string
): Promise<ActionResult<any[]>> {
  try {
    const { userId } = await auth()
    if (!userId) {
      return { success: false, error: 'Unauthorized' }
    }

    // Permission check
    const hasPermission = await requirePermission(Permission.CONTACTS_VIEW)
    if (!hasPermission) {
      return { success: false, error: 'You do not have permission to view contacts' }
    }

    const contactProperties = await prisma.contactProperty.findMany({
      where: { propertyId },
      include: {
        contact: true
      },
      orderBy: [
        { relationship: 'asc' },
        { contact: { lastName: 'asc' } },
        { contact: { firstName: 'asc' } }
      ]
    })

    return {
      success: true,
      data: contactProperties
    }
  } catch (error) {
    console.error('Error fetching property contacts:', error)
    return {
      success: false,
      error: 'Failed to fetch property contacts',
      data: []
    }
  }
}