import { z } from 'zod'
import { AvailabilityRequestStatus, AvailabilityRequestUrgency } from '@/generated/prisma'

// Base availability request schema
export const availabilityRequestSchema = z.object({
  propertyId: z.string().min(1, "Property ID is required"),
  startDate: z.date(),
  endDate: z.date(),
  guestName: z.string().min(1, "Guest name is required"),
  guestEmail: z.string().email("Please enter a valid email address"),
  guestPhone: z.string().min(1, "Phone number is required"),
  numberOfGuests: z.number().min(1, "Number of guests must be at least 1"),
  urgency: z.nativeEnum(AvailabilityRequestUrgency),
  message: z.string().optional(),
}).refine((data) => data.endDate > data.startDate, {
  message: "End date must be after start date",
  path: ["endDate"],
})

// Create availability request schema
export const createAvailabilityRequestSchema = availabilityRequestSchema

// Update availability request status schema
export const updateAvailabilityRequestStatusSchema = z.object({
  id: z.string().min(1, "Request ID is required"),
  status: z.nativeEnum(AvailabilityRequestStatus),
})

// Availability request filters schema
export const availabilityRequestFiltersSchema = z.object({
  propertyId: z.string().optional(),
  status: z.nativeEnum(AvailabilityRequestStatus).optional(),
  urgency: z.nativeEnum(AvailabilityRequestUrgency).optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  sortBy: z.enum(['createdAt', 'startDate', 'endDate', 'urgency']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

// Delete availability request schema
export const deleteAvailabilityRequestSchema = z.object({
  id: z.string().min(1, "Request ID is required"),
})

// Type exports
export type CreateAvailabilityRequestInput = z.infer<typeof createAvailabilityRequestSchema>
export type UpdateAvailabilityRequestStatusInput = z.infer<typeof updateAvailabilityRequestStatusSchema>
export type AvailabilityRequestFilters = z.infer<typeof availabilityRequestFiltersSchema>
export type DeleteAvailabilityRequestInput = z.infer<typeof deleteAvailabilityRequestSchema>