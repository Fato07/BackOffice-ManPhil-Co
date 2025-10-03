'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { requirePermission } from '@/lib/auth'
import { Permission } from '@/types/auth'
import { auth } from '@clerk/nextjs/server'
import {
  ActionResult,
  BookingStatus,
  BookingSource,
  importBookingsSchema,
  type ImportBookingsInput
} from './types'
import type { BookingImportResult } from '@/types/booking'
import { checkAvailability } from './availability'

/**
 * Bulk imports bookings
 * - Validates all bookings before importing
 * - Checks for conflicts across all bookings
 * - Creates bookings in a transaction
 */
export async function importBookings(
  input: ImportBookingsInput
): Promise<ActionResult<BookingImportResult>> {
  try {
    const { userId } = await auth()
    if (!userId) {
      return { success: false, error: 'Unauthorized' }
    }

    await requirePermission(Permission.PROPERTY_EDIT)

    // Validate input
    const validated = importBookingsSchema.parse(input)

    const property = await prisma.property.findUnique({
      where: { id: validated.propertyId },
      select: { id: true, name: true },
    })

    if (!property) {
      return { success: false, error: 'Property not found' }
    }

    const errors: string[] = []
    const validBookings: any[] = []

    // Validate each booking and check for conflicts
    for (let i = 0; i < validated.bookings.length; i++) {
      const bookingData = validated.bookings[i]

      // Check availability
      const availabilityCheck = await checkAvailability({
        propertyId: validated.propertyId,
        startDate: bookingData.startDate,
        endDate: bookingData.endDate,
      })

      if (!availabilityCheck.success || !availabilityCheck.data?.available) {
        errors.push(
          `Booking ${i + 1}: Conflicts with existing bookings (${bookingData.startDate.toISOString().split('T')[0]} to ${bookingData.endDate.toISOString().split('T')[0]})`
        )
        continue
      }

      validBookings.push({
        ...bookingData,
        propertyId: validated.propertyId,
        status: BookingStatus.CONFIRMED,
        source: BookingSource.IMPORT,
      })
    }

    // Import valid bookings in a transaction
    let imported = 0
    if (validBookings.length > 0) {
      await prisma.$transaction(async (tx) => {
        for (const bookingData of validBookings) {
          await tx.booking.create({
            data: bookingData,
          })
          imported++
        }

        // Create audit log
        await tx.auditLog.create({
          data: {
            userId,
            action: 'import',
            entityType: 'bookings',
            entityId: property.id,
            changes: {
              imported,
              failed: errors.length,
              propertyName: property.name,
              summary: `Imported ${imported} bookings for ${property.name}`,
            },
          },
        })
      })
    }

    // Revalidate paths
    revalidatePath(`/houses/${validated.propertyId}`)
    revalidatePath(`/calendar`)

    return {
      success: true,
      data: {
        imported,
        failed: errors.length,
        errors: errors.length > 0 ? errors : undefined,
      },
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
      error: 'An unexpected error occurred while importing bookings',
    }
  }
}