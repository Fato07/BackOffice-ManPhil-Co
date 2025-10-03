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
  createContactSchema,
  updateContactSchema,
  type CreateContactData,
  type UpdateContactData
} from './types'

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
      error: 'An unexpected error occurred while updating the contact',
    }
  }
}