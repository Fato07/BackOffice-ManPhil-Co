'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { requirePermission } from '@/lib/auth'
import { Permission } from '@/types/auth'
import { auth } from '@clerk/nextjs/server'
import {
  ActionResult,
  BookingType,
  BookingStatus,
  BookingSource,
  createBookingSchema,
  updateBookingSchema,
  type CreateBookingInput,
  type UpdateBookingInput
} from './types'
import type { Booking } from '@/types/booking'

// Import checkAvailability from availability module (we'll create it)
import { checkAvailability } from './availability'

/**
 * Creates a new booking with conflict detection and audit logging
 * - Checks for booking conflicts
 * - Validates permissions based on user role
 * - Logs sensitive operations
 */
export async function createBooking(
  input: CreateBookingInput
): Promise<ActionResult<Booking>> {
  try {
    const { userId } = await auth()
    if (!userId) {
      return { success: false, error: 'Unauthorized' }
    }

    await requirePermission(Permission.PROPERTY_EDIT)

    const validated = createBookingSchema.parse(input)

    const property = await prisma.property.findUnique({
      where: { id: validated.propertyId },
      select: { id: true, name: true },
    })

    if (!property) {
      return { success: false, error: 'Property not found' }
    }

    // Check for conflicts
    const availabilityCheck = await checkAvailability({
      propertyId: validated.propertyId,
      startDate: validated.startDate,
      endDate: validated.endDate,
    })

    if (!availabilityCheck.success || !availabilityCheck.data?.available) {
      return { 
        success: false, 
        error: `Booking conflicts with existing bookings: ${availabilityCheck.data?.conflicts?.map(c => c.type).join(', ')}` 
      }
    }

    const booking = await prisma.booking.create({
      data: {
        propertyId: validated.propertyId,
        type: validated.type,
        status: validated.status,
        source: validated.source,
        startDate: validated.startDate,
        endDate: validated.endDate,
        guestName: validated.guestName,
        guestEmail: validated.guestEmail,
        guestPhone: validated.guestPhone,
        numberOfGuests: validated.numberOfGuests,
        totalAmount: validated.totalAmount,
        notes: validated.notes,
        externalId: validated.externalId,
        metadata: validated.metadata || {} as any,
        createdBy: userId,
      },
    })

    // Create audit log for sensitive data
    if (validated.type === BookingType.OWNER || validated.type === BookingType.OWNER_STAY) {
      await prisma.auditLog.create({
        data: {
          userId,
          action: 'create',
          entityType: 'booking',
          entityId: booking.id,
          changes: {
            created: booking,
            propertyName: property.name,
            summary: `Created ${validated.type} booking for ${property.name}`,
          },
        },
      })
    }

    // Revalidate the property calendar
    revalidatePath(`/houses/${validated.propertyId}`)
    revalidatePath(`/calendar`)

    return {
      success: true,
      data: booking,
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
      error: 'An unexpected error occurred while creating the booking',
    }
  }
}

/**
 * Updates an existing booking with conflict detection
 * - Validates update permissions
 * - Checks for conflicts if dates changed
 * - Logs sensitive operations
 */
export async function updateBooking(
  id: string,
  input: UpdateBookingInput
): Promise<ActionResult<Booking>> {
  try {
    const { userId } = await auth()
    if (!userId) {
      return { success: false, error: 'Unauthorized' }
    }

    await requirePermission(Permission.PROPERTY_EDIT)

    // Validate input
    const validated = updateBookingSchema.parse(input)

    // Check if booking exists
    const existingBooking = await prisma.booking.findUnique({
      where: { id },
      include: { property: { select: { id: true, name: true } } },
    })

    if (!existingBooking) {
      return { success: false, error: 'Booking not found' }
    }

    // If dates are being changed, check for conflicts
    if (validated.startDate || validated.endDate) {
      const startDate = validated.startDate || existingBooking.startDate
      const endDate = validated.endDate || existingBooking.endDate

      const availabilityCheck = await checkAvailability({
        propertyId: existingBooking.propertyId,
        startDate,
        endDate,
        excludeBookingId: id,
      })

      if (!availabilityCheck.success || !availabilityCheck.data?.available) {
        return { 
          success: false, 
          error: `Booking conflicts with existing bookings: ${availabilityCheck.data?.conflicts?.map(c => c.type).join(', ')}` 
        }
      }
    }

    // Update the booking
    const booking = await prisma.booking.update({
      where: { id },
      data: {
        ...validated,
        metadata: validated.metadata ? validated.metadata as any : undefined,
        updatedBy: userId,
      },
    })

    // Create audit log for sensitive changes
    const sensitiveTypes: BookingType[] = [BookingType.OWNER, BookingType.OWNER_STAY]
    if (sensitiveTypes.includes(existingBooking.type as BookingType) || 
        (validated.type && sensitiveTypes.includes(validated.type as BookingType))) {
      await prisma.auditLog.create({
        data: {
          userId,
          action: 'update',
          entityType: 'booking',
          entityId: booking.id,
          changes: {
            before: existingBooking,
            after: booking,
            propertyName: existingBooking.property.name,
            summary: `Updated booking for ${existingBooking.property.name}`,
          },
        },
      })
    }

    // Revalidate paths
    revalidatePath(`/houses/${existingBooking.propertyId}`)
    revalidatePath(`/calendar`)

    return {
      success: true,
      data: booking,
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
      error: 'An unexpected error occurred while updating the booking',
    }
  }
}