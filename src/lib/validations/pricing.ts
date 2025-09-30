import { z } from "zod"
import { BookingCondition, OperationalCostType, PriceType } from "@/generated/prisma"

// General property pricing validation
export const updatePropertyPricingSchema = z.object({
  currency: z.string().length(3, "Currency must be a 3-letter code").optional(),
  displayOnWebsite: z.boolean().optional(),
  retroCommission: z.boolean().optional(),
  lastPricingUpdate: z.date().optional(),
  securityDeposit: z.number().min(0, "Security deposit cannot be negative").nullable().optional(),
  paymentSchedule: z.string().regex(/^\d+\s*-\s*\d+\s*-\s*\d+$/, "Payment schedule must be in format: XX - XX - XX").nullable().optional(),
  minOwnerAcceptedPrice: z.number().positive("Minimum price must be positive").nullable().optional(),
  minLCAcceptedPrice: z.number().positive("Minimum price must be positive").nullable().optional(),
  publicMinimumPrice: z.number().positive("Minimum price must be positive").nullable().optional(),
  netOwnerCommission: z.number().min(0).max(100, "Commission must be between 0-100%").nullable().optional(),
  publicPriceCommission: z.number().min(0).max(100, "Commission must be between 0-100%").nullable().optional(),
  b2b2cPartnerCommission: z.number().min(0).max(100, "Commission must be between 0-100%").nullable().optional(),
  publicTaxes: z.number().min(0).max(100, "Tax rate must be between 0-100%").nullable().optional(),
  clientFees: z.number().min(0).max(100, "Fee must be between 0-100%").nullable().optional(),
})

export type UpdatePropertyPricingFormData = z.infer<typeof updatePropertyPricingSchema>

// Price range validation
const basePriceRangeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  startDate: z.date(),
  endDate: z.date(),
  ownerNightlyRate: z.number().positive("Owner nightly rate must be positive"),
  ownerWeeklyRate: z.number().positive("Owner weekly rate must be positive").nullable().optional(),
  commissionRate: z.number().min(0).max(100, "Commission must be between 0-100%"),
  isValidated: z.boolean(),
}).refine(data => data.endDate > data.startDate, {
  message: "End date must be after start date",
  path: ["endDate"],
})

export const createPricingPeriodSchema = basePriceRangeSchema

export const updatePricingPeriodSchema = basePriceRangeSchema.partial()

export type CreatePricingPeriodFormData = z.infer<typeof createPricingPeriodSchema>
export type UpdatePricingPeriodFormData = z.infer<typeof updatePricingPeriodSchema>

// Minimum stay rule validation
const baseMinimumStayRuleSchema = z.object({
  bookingCondition: z.nativeEnum(BookingCondition),
  minimumNights: z.number().int().min(1, "Minimum nights must be at least 1"),
  startDate: z.date().nullable().optional(),
  endDate: z.date().nullable().optional(),
}).refine(data => {
  if (data.startDate && data.endDate) {
    return data.endDate > data.startDate
  }
  return true
}, {
  message: "End date must be after start date",
  path: ["endDate"],
})

export const createMinimumStayRuleSchema = baseMinimumStayRuleSchema

export const updateMinimumStayRuleSchema = baseMinimumStayRuleSchema.partial()

export type CreateMinimumStayRuleFormData = z.infer<typeof createMinimumStayRuleSchema>
export type UpdateMinimumStayRuleFormData = z.infer<typeof updateMinimumStayRuleSchema>

// Operational cost validation
const baseOperationalCostSchema = z.object({
  costType: z.nativeEnum(OperationalCostType),
  priceType: z.nativeEnum(PriceType),
  estimatedPrice: z.number().min(0, "Price cannot be negative").nullable().optional(),
  publicPrice: z.number().min(0, "Price cannot be negative").nullable().optional(),
  paidBy: z.string().nullable().optional(),
  comment: z.string().nullable().optional(),
})

export const createOperationalCostSchema = baseOperationalCostSchema.extend({
  costType: z.nativeEnum(OperationalCostType),
  priceType: z.nativeEnum(PriceType),
})

export const updateOperationalCostSchema = baseOperationalCostSchema.partial()

export type CreateOperationalCostFormData = z.infer<typeof createOperationalCostSchema>
export type UpdateOperationalCostFormData = z.infer<typeof updateOperationalCostSchema>

// Helper function to calculate public price from owner price and commission
export function calculatePublicPrice(ownerPrice: number, commissionRate: number): number {
  return Math.round(ownerPrice / (1 - commissionRate / 100))
}

// Helper function to calculate commission amount
export function calculateCommissionAmount(ownerPrice: number, publicPrice: number): number {
  return publicPrice - ownerPrice
}

// Helper function to validate date ranges don't overlap
export function validateDateRangeOverlap(
  ranges: { id?: string; startDate: Date; endDate: Date }[], 
  newRange: { startDate: Date; endDate: Date },
  excludeId?: string
): boolean {
  return !ranges.some(range => {
    // Skip the range being updated
    if (excludeId && range.id === excludeId) return false
    
    // Check for overlap
    return (
      (newRange.startDate >= range.startDate && newRange.startDate <= range.endDate) ||
      (newRange.endDate >= range.startDate && newRange.endDate <= range.endDate) ||
      (newRange.startDate <= range.startDate && newRange.endDate >= range.endDate)
    )
  })
}