'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { requirePermission } from '@/lib/auth'
import { Permission } from '@/types/auth'
import { auth } from '@clerk/nextjs/server'
import {
  ActionResult,
  linkContactToPropertySchema,
  unlinkContactFromPropertySchema,
  type LinkContactToPropertyData,
  type UnlinkContactFromPropertyData
} from './types'

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
      error: 'An unexpected error occurred while unlinking contact from property',
    }
  }
}