'use server'

import { z } from 'zod'
import { prisma } from '@/lib/db'
import {
  ActionResult,
  BookingType,
  BookingStatus,
  checkAvailabilitySchema,
  advancedAvailabilityCheckSchema,
  type CheckAvailabilityInput,
  type AdvancedAvailabilityCheckInput
} from './types'
import type { BasicAvailabilityResult, AdvancedAvailabilityResult } from '@/types/booking'

/**
 * Checks availability for a date range
 * - Returns conflicting bookings if any
 * - Excludes a specific booking ID for updates
 */
export async function checkAvailability(
  input: CheckAvailabilityInput
): Promise<ActionResult<BasicAvailabilityResult>> {
  try {
    // Validate input
    const validated = checkAvailabilitySchema.parse(input)

    // Build where clause for conflicts
    const where: any = {
      propertyId: validated.propertyId,
      status: { not: BookingStatus.CANCELLED },
      OR: [
        // Booking starts during the requested period
        {
          startDate: {
            gte: validated.startDate,
            lt: validated.endDate,
          },
        },
        // Booking ends during the requested period
        {
          endDate: {
            gt: validated.startDate,
            lte: validated.endDate,
          },
        },
        // Booking encompasses the requested period
        {
          AND: [
            { startDate: { lte: validated.startDate } },
            { endDate: { gte: validated.endDate } },
          ],
        },
      ],
    }

    // Exclude specific booking if provided (for updates)
    if (validated.excludeBookingId) {
      where.id = { not: validated.excludeBookingId }
    }

    // Find conflicting bookings
    const conflicts = await prisma.booking.findMany({
      where,
      select: {
        id: true,
        type: true,
        startDate: true,
        endDate: true,
        guestName: true,
      },
    })

    return {
      success: true,
      data: {
        available: conflicts.length === 0,
        conflicts: conflicts.length > 0 ? conflicts : undefined,
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
      error: 'An unexpected error occurred while checking availability',
    }
  }
}

/**
 * Advanced availability check with conflict resolution suggestions
 */
export async function checkAdvancedAvailability(
  input: AdvancedAvailabilityCheckInput
): Promise<ActionResult<AdvancedAvailabilityResult>> {
  try {
    const validated = advancedAvailabilityCheckSchema.parse(input)
    
    // Get all bookings in a wider time range for analysis
    const searchStartDate = new Date(validated.startDate.getTime() - (7 * 24 * 60 * 60 * 1000)) // 7 days before
    const searchEndDate = new Date(validated.endDate.getTime() + (7 * 24 * 60 * 60 * 1000)) // 7 days after
    
    const allBookings = await prisma.booking.findMany({
      where: {
        propertyId: validated.propertyId,
        status: { not: BookingStatus.CANCELLED },
        id: validated.excludeBookingId ? { not: validated.excludeBookingId } : undefined,
        OR: [
          {
            startDate: {
              gte: searchStartDate,
              lte: searchEndDate,
            },
          },
          {
            endDate: {
              gte: searchStartDate,
              lte: searchEndDate,
            },
          },
          {
            AND: [
              { startDate: { lte: searchStartDate } },
              { endDate: { gte: searchEndDate } },
            ],
          },
        ],
      },
      select: {
        id: true,
        type: true,
        startDate: true,
        endDate: true,
        guestName: true,
      },
      orderBy: { startDate: 'asc' },
    })

    // Analyze conflicts
    const conflicts: any[] = []
    const gracePeriodViolations: any[] = []
    const gracePeriodMs = validated.gracePeriodHours * 60 * 60 * 1000

    for (const booking of allBookings) {
      const conflictInfo = analyzeConflict(validated.startDate, validated.endDate, booking.startDate, booking.endDate)
      
      if (conflictInfo.hasConflict) {
        conflicts.push({
          ...booking,
          severity: conflictInfo.severity,
          conflictType: conflictInfo.type,
        })
      }

      // Check grace period violations
      const beforeGap = validated.startDate.getTime() - booking.endDate.getTime()
      const afterGap = booking.startDate.getTime() - validated.endDate.getTime()

      if (beforeGap > 0 && beforeGap < gracePeriodMs) {
        gracePeriodViolations.push({
          bookingId: booking.id,
          hours: Math.round(beforeGap / (60 * 60 * 1000) * 10) / 10,
          type: 'after',
        })
      }

      if (afterGap > 0 && afterGap < gracePeriodMs) {
        gracePeriodViolations.push({
          bookingId: booking.id,
          hours: Math.round(afterGap / (60 * 60 * 1000) * 10) / 10,
          type: 'before',
        })
      }
    }

    // Generate alternative date suggestions
    const suggestions: any[] = []
    if (validated.suggestAlternatives && conflicts.length > 0) {
      const duration = validated.endDate.getTime() - validated.startDate.getTime()
      
      // Find gaps between bookings
      for (let i = 0; i < allBookings.length - 1; i++) {
        const current = allBookings[i]
        const next = allBookings[i + 1]
        
        const gapStart = new Date(current.endDate.getTime() + gracePeriodMs)
        const gapEnd = new Date(next.startDate.getTime() - gracePeriodMs)
        
        if (gapEnd.getTime() - gapStart.getTime() >= duration) {
          suggestions.push({
            startDate: gapStart,
            endDate: new Date(gapStart.getTime() + duration),
            reason: `Available between ${current.guestName || current.type} and ${next.guestName || next.type}`,
            confidence: 'high' as const,
          })
        }
      }

      // Suggest dates before the first booking
      if (allBookings.length > 0) {
        const firstBooking = allBookings[0]
        const beforeEnd = new Date(firstBooking.startDate.getTime() - gracePeriodMs)
        const beforeStart = new Date(beforeEnd.getTime() - duration)
        
        if (beforeStart >= searchStartDate) {
          suggestions.push({
            startDate: beforeStart,
            endDate: beforeEnd,
            reason: `Available before ${firstBooking.guestName || firstBooking.type}`,
            confidence: 'medium' as const,
          })
        }
      }

      // Suggest dates after the last booking
      if (allBookings.length > 0) {
        const lastBooking = allBookings[allBookings.length - 1]
        const afterStart = new Date(lastBooking.endDate.getTime() + gracePeriodMs)
        const afterEnd = new Date(afterStart.getTime() + duration)
        
        if (afterEnd <= searchEndDate) {
          suggestions.push({
            startDate: afterStart,
            endDate: afterEnd,
            reason: `Available after ${lastBooking.guestName || lastBooking.type}`,
            confidence: 'medium' as const,
          })
        }
      }
    }

    const hasBlockingConflicts = conflicts.some(c => c.severity === 'blocking')

    return {
      success: true,
      data: {
        available: !hasBlockingConflicts,
        conflicts: conflicts.length > 0 ? conflicts : undefined,
        suggestions: suggestions.length > 0 ? suggestions.slice(0, 5) : undefined, // Limit to 5 suggestions
        gracePeriodViolations: gracePeriodViolations.length > 0 ? gracePeriodViolations : undefined,
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
      error: 'An unexpected error occurred while checking availability',
    }
  }
}

/**
 * Analyze conflict between two date ranges
 */
function analyzeConflict(
  requestStart: Date,
  requestEnd: Date,
  bookingStart: Date,
  bookingEnd: Date
): {
  hasConflict: boolean
  severity: 'blocking' | 'warning' | 'info'
  type: 'overlap' | 'adjacent' | 'encompassing' | 'encompassed'
} {
  // No conflict if dates don't overlap
  if (requestEnd <= bookingStart || requestStart >= bookingEnd) {
    return { hasConflict: false, severity: 'info', type: 'adjacent' }
  }

  // Request encompasses the booking
  if (requestStart <= bookingStart && requestEnd >= bookingEnd) {
    return { hasConflict: true, severity: 'blocking', type: 'encompassing' }
  }

  // Booking encompasses the request
  if (bookingStart <= requestStart && bookingEnd >= requestEnd) {
    return { hasConflict: true, severity: 'blocking', type: 'encompassed' }
  }

  // Partial overlap
  return { hasConflict: true, severity: 'blocking', type: 'overlap' }
}