import { z } from "zod"
import { BookingType, BookingStatus, BookingSource } from "@/generated/prisma"

// Define which booking types require guest information
export const GUEST_BOOKING_TYPES = [BookingType.CONFIRMED, BookingType.TENTATIVE, BookingType.CONTRACT] as const
export const NON_GUEST_BOOKING_TYPES = [BookingType.MAINTENANCE, BookingType.BLOCKED, BookingType.OWNER, BookingType.OWNER_STAY] as const

// Helper function to check if booking type requires guest fields
export const requiresGuestFields = (bookingType: BookingType): boolean => {
  return (GUEST_BOOKING_TYPES as readonly BookingType[]).includes(bookingType)
}

// Base booking validation schema
const baseBookingSchema = z.object({
  type: z.nativeEnum(BookingType),
  status: z.nativeEnum(BookingStatus).default(BookingStatus.CONFIRMED),
  source: z.nativeEnum(BookingSource).default(BookingSource.MANUAL),
  startDate: z.date(),
  endDate: z.date(),
  guestName: z.string().max(255, "Guest name is too long").nullable().optional(),
  guestEmail: z.string().nullable().optional(),
  guestPhone: z.string().max(50, "Phone number is too long").nullable().optional(),
  numberOfGuests: z.coerce.number().int().min(1, "At least 1 guest is required").nullable().optional(),
  totalAmount: z.coerce.number().min(0, "Amount cannot be negative").nullable().optional(),
  notes: z.string().max(1000, "Notes are too long").nullable().optional(),
  externalId: z.string().max(255, "External ID is too long").nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).nullable().optional(),
}).refine(data => data.endDate > data.startDate, {
  message: "End date must be after start date",
  path: ["endDate"],
}).refine(data => {
  // Only validate guest fields for booking types that require them
  if (requiresGuestFields(data.type)) {
    return data.guestName && data.guestName.trim().length > 0
  }
  return true
}, {
  message: "Guest name is required for this booking type",
  path: ["guestName"],
}).refine(data => {
  // Only validate guest email for booking types that require them
  if (requiresGuestFields(data.type)) {
    return data.guestEmail && data.guestEmail.trim().length > 0
  }
  return true
}, {
  message: "Guest email is required for this booking type",
  path: ["guestEmail"],
}).refine(data => {
  // Validate email format when provided for any booking type
  if (data.guestEmail && data.guestEmail.trim().length > 0) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(data.guestEmail)
  }
  return true
}, {
  message: "Invalid email address",
  path: ["guestEmail"],
})

// Form schema for client-side validation (without propertyId and defaults)
export const bookingFormSchema = z.object({
  type: z.nativeEnum(BookingType),
  status: z.nativeEnum(BookingStatus).optional(),
  source: z.nativeEnum(BookingSource).optional(),
  startDate: z.date(),
  endDate: z.date(),
  guestName: z.string().max(255, "Guest name is too long").nullable().optional(),
  guestEmail: z.string().nullable().optional(),
  guestPhone: z.string().max(50, "Phone number is too long").nullable().optional(),
  numberOfGuests: z.coerce.number().int().min(1, "At least 1 guest is required").nullable().optional(),
  totalAmount: z.coerce.number().min(0, "Amount cannot be negative").nullable().optional(),
  notes: z.string().max(1000, "Notes are too long").nullable().optional(),
  externalId: z.string().max(255, "External ID is too long").nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).nullable().optional(),
}).refine(data => data.endDate > data.startDate, {
  message: "End date must be after start date",
  path: ["endDate"],
}).refine(data => {
  // Only validate guest fields for booking types that require them
  if (requiresGuestFields(data.type)) {
    return data.guestName && data.guestName.trim().length > 0
  }
  return true
}, {
  message: "Guest name is required for this booking type",
  path: ["guestName"],
}).refine(data => {
  // Only validate guest email for booking types that require them
  if (requiresGuestFields(data.type)) {
    return data.guestEmail && data.guestEmail.trim().length > 0
  }
  return true
}, {
  message: "Guest email is required for this booking type",
  path: ["guestEmail"],
}).refine(data => {
  // Validate email format when provided for any booking type
  if (data.guestEmail && data.guestEmail.trim().length > 0) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(data.guestEmail)
  }
  return true
}, {
  message: "Invalid email address",
  path: ["guestEmail"],
})

// Create booking schema for server-side validation (with propertyId)
export const createBookingSchema = z.object({
  propertyId: z.string().cuid("Invalid property ID"),
  ...baseBookingSchema.shape,
})

// Update booking schema (all fields optional except ID)
export const updateBookingSchema = baseBookingSchema.partial()

// Booking filters schema
export const bookingFiltersSchema = z.object({
  propertyId: z.string().cuid("Invalid property ID"),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  type: z.array(z.nativeEnum(BookingType)).optional(),
  status: z.array(z.nativeEnum(BookingStatus)).optional(),
  search: z.string().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(1000).default(50),
  sortBy: z.enum(["startDate", "endDate", "createdAt", "guestName"]).default("startDate"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
})

// Availability check schema
export const checkAvailabilitySchema = z.object({
  propertyId: z.string().cuid("Invalid property ID"),
  startDate: z.date(),
  endDate: z.date(),
  excludeBookingId: z.string().cuid().optional(), // For updates, exclude current booking
}).refine(data => data.endDate > data.startDate, {
  message: "End date must be after start date",
  path: ["endDate"],
})

// Advanced availability check schema with suggestions
export const advancedAvailabilityCheckSchema = z.object({
  propertyId: z.string().cuid("Invalid property ID"),
  startDate: z.date(),
  endDate: z.date(),
  excludeBookingId: z.string().cuid().optional(),
  includeNearbyDates: z.boolean().default(true),
  suggestAlternatives: z.boolean().default(true),
  gracePeriodHours: z.number().min(0).max(48).default(2), // Hours between bookings
}).refine(data => data.endDate > data.startDate, {
  message: "End date must be after start date",
  path: ["endDate"],
})

// Bulk import schema
export const importBookingsSchema = z.object({
  propertyId: z.string().cuid("Invalid property ID"),
  bookings: z.array(z.object({
    type: z.nativeEnum(BookingType),
    startDate: z.date(),
    endDate: z.date(),
    guestName: z.string().optional(),
    guestEmail: z.string().email().optional(),
    guestPhone: z.string().optional(),
    numberOfGuests: z.coerce.number().int().min(1).optional(),
    notes: z.string().optional(),
    externalId: z.string().optional(),
  })).min(1, "At least one booking is required").max(100, "Maximum 100 bookings per import"),
})

// Type exports
export type CreateBookingInput = z.infer<typeof createBookingSchema>
export type UpdateBookingInput = z.infer<typeof updateBookingSchema>
export type BookingFilters = z.infer<typeof bookingFiltersSchema>
export type CheckAvailabilityInput = z.infer<typeof checkAvailabilitySchema>
export type AdvancedAvailabilityCheckInput = z.infer<typeof advancedAvailabilityCheckSchema>
export type ImportBookingsInput = z.infer<typeof importBookingsSchema>

// Helper function to format booking display name
export function formatBookingDisplay(booking: { type: BookingType; guestName?: string | null }): string {
  switch (booking.type) {
    case BookingType.CONTRACT:
      return booking.guestName || "Contract Booking"
    case BookingType.OWNER:
      return "Owner"
    case BookingType.OWNER_STAY:
      return "Owner Stay"
    case BookingType.MAINTENANCE:
      return "Property Maintenance"
    case BookingType.BLOCKED:
      return "Blocked"
    case BookingType.CONFIRMED:
      return booking.guestName || "Confirmed Booking"
    case BookingType.TENTATIVE:
      return booking.guestName || "Tentative Booking"
    default:
      return booking.guestName || "Booking"
  }
}

// Luxury color configuration for calendar display with prominent visibility
export const BOOKING_TYPE_COLORS = {
  [BookingType.CONTRACT]: {
    bg: "bg-gradient-to-br from-amber-200 to-orange-300",
    border: "border-amber-400/80",
    text: "text-amber-900",
    hex: "#B5985A", // Luxury gold
    light: "#FEFCF3",
    gradient: "from-amber-200/90 to-orange-300/80",
    shadow: "shadow-amber-300/60",
    hover: "hover:from-amber-300 hover:to-orange-400 hover:shadow-amber-400/70",
  },
  [BookingType.OWNER]: {
    bg: "bg-gradient-to-br from-violet-200 to-purple-300",
    border: "border-violet-400/80",
    text: "text-violet-900",
    hex: "#8B5A96",
    light: "#FDFBFF",
    gradient: "from-violet-200/90 to-purple-300/80",
    shadow: "shadow-violet-300/60",
    hover: "hover:from-violet-300 hover:to-purple-400 hover:shadow-violet-400/70",
  },
  [BookingType.OWNER_STAY]: {
    bg: "bg-gradient-to-br from-indigo-200 to-blue-300",
    border: "border-indigo-400/80",
    text: "text-indigo-900",
    hex: "#4C63B6",
    light: "#FAFBFF",
    gradient: "from-indigo-200/90 to-blue-300/80",
    shadow: "shadow-indigo-300/60",
    hover: "hover:from-indigo-300 hover:to-blue-400 hover:shadow-indigo-400/70",
  },
  [BookingType.MAINTENANCE]: {
    bg: "bg-gradient-to-br from-yellow-200 to-amber-300",
    border: "border-yellow-400/80",
    text: "text-yellow-900",
    hex: "#E6B800",
    light: "#FFFEF7",
    gradient: "from-yellow-200/90 to-amber-300/80",
    shadow: "shadow-yellow-300/60",
    hover: "hover:from-yellow-300 hover:to-amber-400 hover:shadow-yellow-400/70",
  },
  [BookingType.BLOCKED]: {
    bg: "bg-gradient-to-br from-slate-200 to-gray-300",
    border: "border-slate-400/80",
    text: "text-slate-800",
    hex: "#7C8B9E",
    light: "#FEFEFE",
    gradient: "from-slate-200/90 to-gray-300/80",
    shadow: "shadow-slate-300/60",
    hover: "hover:from-slate-300 hover:to-gray-400 hover:shadow-slate-400/70",
  },
  [BookingType.CONFIRMED]: {
    bg: "bg-gradient-to-br from-emerald-200 to-green-300",
    border: "border-emerald-400/80",
    text: "text-emerald-900",
    hex: "#059669",
    light: "#F0FDF4",
    gradient: "from-emerald-200/90 to-green-300/80",
    shadow: "shadow-emerald-300/60",
    hover: "hover:from-emerald-300 hover:to-green-400 hover:shadow-emerald-400/70",
  },
  [BookingType.TENTATIVE]: {
    bg: "bg-gradient-to-br from-sky-200 to-blue-300",
    border: "border-sky-400/80",
    text: "text-sky-900",
    hex: "#0EA5E9",
    light: "#F0F9FF",
    gradient: "from-sky-200/90 to-blue-300/80",
    shadow: "shadow-sky-300/60",
    hover: "hover:from-sky-300 hover:to-blue-400 hover:shadow-sky-400/70",
  },
} as const