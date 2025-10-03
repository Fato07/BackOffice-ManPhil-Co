'use server'

import { z } from 'zod'
import { prisma } from '@/lib/db'
import { requirePermission } from '@/lib/auth'
import { Permission } from '@/types/auth'
import { auth } from '@clerk/nextjs/server'
import {
  ActionResult,
  BookingStatus,
  bookingFiltersSchema,
  type BookingFilters
} from './types'
import type { BookingsResponse, BookingDetail, BookingStatistics } from '@/types/booking'

/**
 * Fetches bookings with filters and pagination
 * - Supports search, date range, type, and status filters
 * - Includes property information
 * - Respects view permissions
 */
export async function getBookings(
  filters: BookingFilters
): Promise<ActionResult<BookingsResponse>> {
  try {
    const { userId } = await auth()
    if (!userId) {
      return { success: false, error: 'Unauthorized' }
    }

    // Permission check
    await requirePermission(Permission.PROPERTY_VIEW)

    // Validate filters
    const validated = bookingFiltersSchema.parse(filters)

    // Build where clause
    const where: any = {
      propertyId: validated.propertyId,
    }

    // Date range filter
    if (validated.startDate || validated.endDate) {
      where.OR = [
        {
          startDate: {
            gte: validated.startDate,
            lte: validated.endDate,
          },
        },
        {
          endDate: {
            gte: validated.startDate,
            lte: validated.endDate,
          },
        },
        {
          AND: [
            { startDate: { lte: validated.startDate } },
            { endDate: { gte: validated.endDate } },
          ],
        },
      ]
    }

    // Type filter
    if (validated.type && validated.type.length > 0) {
      where.type = { in: validated.type }
    }

    // Status filter
    if (validated.status && validated.status.length > 0) {
      where.status = { in: validated.status }
    }

    // Search filter
    if (validated.search) {
      where.AND = [
        ...(where.AND || []),
        {
          OR: [
            { guestName: { contains: validated.search, mode: 'insensitive' } },
            { guestEmail: { contains: validated.search, mode: 'insensitive' } },
            { guestPhone: { contains: validated.search, mode: 'insensitive' } },
            { notes: { contains: validated.search, mode: 'insensitive' } },
            { externalId: { contains: validated.search, mode: 'insensitive' } },
          ],
        },
      ]
    }

    // Count total records
    const total = await prisma.booking.count({ where })

    // Fetch bookings with pagination
    const bookings = await prisma.booking.findMany({
      where,
      include: {
        property: {
          select: {
            id: true,
            name: true,
            address: true,
          },
        },
      },
      orderBy: { [validated.sortBy]: validated.sortOrder },
      skip: (validated.page - 1) * validated.limit,
      take: validated.limit,
    })

    const pages = Math.ceil(total / validated.limit)

    return {
      success: true,
      data: { bookings, total, pages },
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
      error: 'An unexpected error occurred while fetching bookings',
    }
  }
}

/**
 * Gets a single booking by ID
 * - Includes property information
 * - Validates view permissions
 */
export async function getBookingById(id: string): Promise<ActionResult<BookingDetail>> {
  try {
    const { userId } = await auth()
    if (!userId) {
      return { success: false, error: 'Unauthorized' }
    }

    // Permission check
    await requirePermission(Permission.PROPERTY_VIEW)

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        property: {
          select: {
            id: true,
            name: true,
            address: true,
          },
        },
      },
    })

    if (!booking) {
      return { success: false, error: 'Booking not found' }
    }

    return {
      success: true,
      data: booking,
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
      error: 'An unexpected error occurred while fetching the booking',
    }
  }
}

/**
 * Gets booking statistics for a property
 * - Calculates occupancy rates
 * - Breaks down by booking type
 * - Provides revenue summaries
 */
export async function getBookingStats(
  propertyId: string,
  startDate: Date,
  endDate: Date
): Promise<ActionResult<BookingStatistics>> {
  try {
    const { userId } = await auth()
    if (!userId) {
      return { success: false, error: 'Unauthorized' }
    }

    // Permission check
    await requirePermission(Permission.PROPERTY_VIEW)

    // Fetch bookings in date range
    const bookings = await prisma.booking.findMany({
      where: {
        propertyId,
        status: BookingStatus.CONFIRMED,
        OR: [
          {
            startDate: {
              gte: startDate,
              lte: endDate,
            },
          },
          {
            endDate: {
              gte: startDate,
              lte: endDate,
            },
          },
          {
            AND: [
              { startDate: { lte: startDate } },
              { endDate: { gte: endDate } },
            ],
          },
        ],
      },
    })

    // Calculate statistics
    let totalNights = 0
    let totalRevenue = 0
    const bookingsByType: Record<string, number> = {}

    for (const booking of bookings) {
      // Calculate nights for this booking within the date range
      const bookingStart = booking.startDate > startDate ? booking.startDate : startDate
      const bookingEnd = booking.endDate < endDate ? booking.endDate : endDate
      const nights = Math.ceil((bookingEnd.getTime() - bookingStart.getTime()) / (1000 * 60 * 60 * 24))
      
      totalNights += nights
      totalRevenue += booking.totalAmount || 0

      // Count by type
      bookingsByType[booking.type] = (bookingsByType[booking.type] || 0) + 1
    }

    // Calculate total possible nights
    const totalPossibleNights = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    const occupancyRate = totalPossibleNights > 0 ? (totalNights / totalPossibleNights) * 100 : 0

    // Calculate average stay length
    const averageStayLength = bookings.length > 0 
      ? bookings.reduce((sum, b) => {
          const nights = Math.ceil((b.endDate.getTime() - b.startDate.getTime()) / (1000 * 60 * 60 * 24))
          return sum + nights
        }, 0) / bookings.length
      : 0

    return {
      success: true,
      data: {
        totalBookings: bookings.length,
        totalNights,
        occupancyRate: Math.round(occupancyRate * 100) / 100,
        bookingsByType,
        totalRevenue,
        averageStayLength: Math.round(averageStayLength * 100) / 100,
      },
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
      error: 'An unexpected error occurred while calculating booking statistics',
    }
  }
}