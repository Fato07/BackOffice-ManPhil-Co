'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { requirePermission } from '@/lib/auth'
import { Permission } from '@/types/auth'
import { auth } from '@clerk/nextjs/server'
import { ActionResult } from './types'

/**
 * Deletes a booking with audit logging
 * - Validates deletion permissions
 * - Logs sensitive operations
 */
export async function deleteBooking(id: string): Promise<ActionResult<{ deleted: boolean }>> {
  try {
    const { userId } = await auth()
    if (!userId) {
      return { success: false, error: 'Unauthorized' }
    }

    await requirePermission(Permission.PROPERTY_EDIT)

    // Check if booking exists
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { property: { select: { id: true, name: true } } },
    })

    if (!booking) {
      return { success: false, error: 'Booking not found' }
    }

    // Delete the booking
    await prisma.booking.delete({
      where: { id },
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'delete',
        entityType: 'booking',
        entityId: id,
        changes: {
          deleted: booking,
          propertyName: booking.property.name,
          summary: `Deleted ${booking.type} booking for ${booking.property.name}`,
        },
      },
    })

    // Revalidate paths
    revalidatePath(`/houses/${booking.propertyId}`)
    revalidatePath(`/calendar`)

    return {
      success: true,
      data: { deleted: true },
    }
  } catch (_error) {
    if (_error instanceof Error) {
      return {
        success: false,
        error: _error.message,
      }
    }

    return {
      success: false,
      error: 'An unexpected error occurred while deleting the booking',
    }
  }
}