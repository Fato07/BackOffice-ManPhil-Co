'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { requirePermission } from '@/lib/auth'
import { Permission } from '@/types/auth'
import { ContactType } from '@/generated/prisma'
import { auth } from '@clerk/nextjs/server'

// Schema for contact validation - using modern Zod patterns
const contactSchema = z.object({
  id: z.string().optional(),
  type: z.nativeEnum(ContactType).describe("Please select a valid contact type"),
  name: z.string().min(1, "Name is required").max(255, "Name too long"),
  email: z.string().email({ message: "Please enter a valid email address" }).nullish(),
  phone: z.string().max(50, "Phone number too long").nullish(),
  notes: z.string().max(1000, "Notes too long").nullish(),
  isApproved: z.boolean().default(false),
})

const updateContactsSchema = z.object({
  propertyId: z.string().cuid("Invalid property ID format"),
  contacts: z.array(contactSchema).max(50, "Too many contacts - maximum 50 allowed"),
})

export type UpdateContactsInput = z.infer<typeof updateContactsSchema>

interface ActionResult<T> {
  success: boolean
  data?: T
  error?: string
}

/**
 * Updates property contacts - follows modern server action patterns
 * - Permission-based access control
 * - Audit logging for compliance
 * - Optimistic update support
 * - Proper error handling
 */
export async function updatePropertyContacts(
  input: UpdateContactsInput
): Promise<ActionResult<{ contacts: any[] }>> {
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
    const validated = updateContactsSchema.parse(input)
    const { propertyId, contacts } = validated

    // Check if property exists
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: { id: true },
    })

    if (!property) {
      return { success: false, error: 'Property not found' }
    }

    // Get existing contacts for comparison (audit purposes)
    const existingContacts = await prisma.propertyContact.findMany({
      where: { propertyId },
    })

    // Perform the update in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Delete all existing contacts
      await tx.propertyContact.deleteMany({
        where: { propertyId },
      })

      // Create new contacts
      const newContacts = await Promise.all(
        contacts.map((contact) =>
          tx.propertyContact.create({
            data: {
              propertyId,
              type: contact.type,
              name: contact.name,
              email: contact.email || null,
              phone: contact.phone || null,
              notes: contact.notes || null,
              isApproved: contact.isApproved,
            },
          })
        )
      )

      // Create audit log entry
      await tx.auditLog.create({
        data: {
          userId,
          action: 'update',
          entityType: 'property_contacts',
          entityId: propertyId,
          changes: {
            before: existingContacts,
            after: newContacts,
            summary: `Updated contacts: ${newContacts.length} contact(s)`,
          },
        },
      })

      return newContacts
    })

    // Revalidate the property page
    revalidatePath(`/houses/${propertyId}`)

    return {
      success: true,
      data: { contacts: result },
    }
  } catch (error) {
    

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
      error: 'An unexpected error occurred while updating contacts',
    }
  }
}

/**
 * Fetches property contacts with proper permissions
 */
export async function getPropertyContacts(propertyId: string): Promise<ActionResult<any[]>> {
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

    const contacts = await prisma.propertyContact.findMany({
      where: { propertyId },
      orderBy: [
        { type: 'asc' },
        { name: 'asc' },
      ],
    })

    return {
      success: true,
      data: contacts,
    }
  } catch (error) {
    
    return {
      success: false,
      error: 'Failed to fetch contacts',
    }
  }
}