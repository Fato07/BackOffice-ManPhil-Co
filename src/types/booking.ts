import { Prisma } from '@/generated/prisma'

// Base booking from Prisma
export type Booking = Prisma.BookingGetPayload<{}>

// Booking with property information
export type BookingWithProperty = Prisma.BookingGetPayload<{
  include: {
    property: {
      select: {
        id: true
        name: true
        address: true
      }
    }
  }
}>

// Booking list item for tables
export interface BookingListItem extends BookingWithProperty {}

// Booking details for forms and detailed views
export interface BookingDetail extends BookingWithProperty {}

// Booking statistics interface
export interface BookingStatistics {
  totalBookings: number
  totalNights: number
  occupancyRate: number
  bookingsByType: Record<string, number>
  totalRevenue: number
  averageStayLength: number
}

// Conflict analysis interface for advanced availability check
export interface BookingConflict {
  id: string
  type: import('@/generated/prisma').BookingType
  startDate: Date
  endDate: Date
  guestName?: string | null
  severity: 'blocking' | 'warning' | 'info'
  conflictType: 'overlap' | 'adjacent' | 'encompassing' | 'encompassed'
}

// Alternative suggestion interface
export interface BookingAlternative {
  startDate: Date
  endDate: Date
  reason: string
  confidence: 'high' | 'medium' | 'low'
}

// Grace period violation interface
export interface GracePeriodViolation {
  bookingId: string
  hours: number
  type: 'before' | 'after'
}

// Advanced availability check result
export interface AdvancedAvailabilityResult {
  available: boolean
  conflicts?: BookingConflict[]
  suggestions?: BookingAlternative[]
  gracePeriodViolations?: GracePeriodViolation[]
}

// Basic availability check result
export interface BasicAvailabilityResult {
  available: boolean
  conflicts?: Pick<Booking, 'id' | 'type' | 'startDate' | 'endDate' | 'guestName'>[]
}

// Booking list response
export interface BookingsResponse {
  bookings: BookingListItem[]
  total: number
  pages: number
}

// Import result interface
export interface BookingImportResult {
  imported: number
  failed: number
  errors?: string[]
}