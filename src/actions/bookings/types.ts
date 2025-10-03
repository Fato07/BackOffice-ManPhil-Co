// Shared types and imports for booking actions
export interface ActionResult<T> {
  success: boolean
  data?: T
  error?: string
}

// Re-export commonly needed types from Prisma
export {
  BookingType,
  BookingStatus,
  BookingSource
} from '@/generated/prisma'

// Re-export validation schemas and types
export {
  createBookingSchema,
  updateBookingSchema,
  bookingFiltersSchema,
  checkAvailabilitySchema,
  advancedAvailabilityCheckSchema,
  importBookingsSchema,
  type CreateBookingInput,
  type UpdateBookingInput,
  type BookingFilters,
  type CheckAvailabilityInput,
  type AdvancedAvailabilityCheckInput,
  type ImportBookingsInput,
} from '@/lib/validations/booking'