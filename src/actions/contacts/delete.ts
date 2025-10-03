'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { requirePermission } from '@/lib/auth'
import { Permission } from '@/types/auth'
import { auth } from '@clerk/nextjs/server'
import {
  ActionResult,
  bulkDeleteContactsSchema,
  type BulkDeleteContactsData
} from './types'

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
  } catch (_error) {
    if (_error instanceof Error) {
      return {
        success: false,
        error: _error.message,
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
      error: 'An unexpected error occurred while deleting contacts',
    }
  }
}