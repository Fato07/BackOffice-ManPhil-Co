import { z } from "zod"
import { PropertyStatus } from "@/generated/prisma"

export interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
}

export interface ValidationError {
  row: number
  field: string
  message: string
  value?: unknown
}

export interface ValidationWarning {
  row: number
  field: string
  message: string
  value?: unknown
}

// Simple property import schema - for legacy compatibility
export const propertyImportSchema = z.object({
  // Required fields
  name: z.string().min(1, "Name is required"),
  destinationId: z.string().optional(),
  destinationName: z.string().min(1, "Destination is required").optional(),
  
  // Optional fields with proper types
  originalName: z.string().nullish(),
  status: z.enum([PropertyStatus.PUBLISHED, PropertyStatus.HIDDEN, PropertyStatus.ONBOARDING])
    .describe("Invalid property status")
    .optional(),
  
  // Numbers
  numberOfBathrooms: z.number().int().min(0, "Bathrooms cannot be negative").nullish(),
  propertySize: z.number().min(0, "Property size cannot be negative").nullish(),
  numberOfRooms: z.number().int().min(0, "Rooms cannot be negative").nullish(),
  maxGuests: z.number().int().min(0, "Max guests cannot be negative").nullish(),
  eventDeposit: z.number().min(0, "Event deposit cannot be negative").nullish(),
  latitude: z.number().min(-90, "Invalid latitude").max(90, "Invalid latitude").nullish(),
  longitude: z.number().min(-180, "Invalid longitude").max(180, "Invalid longitude").nullish(),
  
  // Booleans
  conciergeService: z.boolean().optional(),
  adjoiningHouse: z.boolean().optional(),
  exclusivity: z.boolean().optional(),
  iconicCollection: z.boolean().optional(),
  onlineReservation: z.boolean().optional(),
  flexibleCancellation: z.boolean().optional(),
  onboardingFees: z.boolean().optional(),
  elevator: z.boolean().optional(),
  prmSuitability: z.boolean().optional(),
  liveInStaff: z.boolean().optional(),
  eventsAllowed: z.boolean().optional(),
  
  // Arrays
  categories: z.array(z.string()).optional(),
  
  // Strings
  licenseType: z.string().nullish(),
  licenseNumber: z.string().nullish(),
  operatedByAgency: z.string().nullish(),
  address: z.string().nullish(),
  postcode: z.string().nullish(),
  city: z.string().nullish(),
  additionalDetails: z.string().nullish(),
  houseType: z.string().nullish(),
  architecturalType: z.string().nullish(),
  position: z.string().nullish(),
  segment: z.string().nullish(),
  accessibilityNotes: z.string().nullish(),
  childrenPolicy: z.string().nullish(),
  childrenAccessories: z.string().nullish(),
  animalsPolicy: z.string().nullish(),
  heatingSystem: z.string().nullish(),
  heatingComments: z.string().nullish(),
  acSystem: z.string().nullish(),
  acComments: z.string().nullish(),
  eventNotes: z.string().nullish(),
  eventRules: z.string().nullish(),
  eventLayoutLink: z.string().url({ message: "Invalid URL format" }).nullish(),
  eventTariffs: z.string().nullish(),
  eventDriveLink: z.string().url({ message: "Invalid URL format" }).nullish(),
  transportServices: z.string().nullish(),
  staffServices: z.string().nullish(),
  mealServices: z.string().nullish(),
  goodToKnow: z.string().nullish(),
  listingUrl: z.string().url({ message: "Invalid URL format" }).nullish(),
  marketingNotes: z.string().nullish(),
  reviews: z.string().nullish(),
})

export type PropertyImportData = z.infer<typeof propertyImportSchema>

/**
 * Validate a single property row
 */
export function validatePropertyRow(
  data: Record<string, unknown>,
  rowIndex: number
): { data?: PropertyImportData; errors: ValidationError[] } {
  try {
    const validated = propertyImportSchema.parse(data)
    return { data: validated, errors: [] }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        errors: error.issues.map((issue) => ({
          row: rowIndex,
          field: String(issue.path[0] || 'unknown'),
          message: issue.message,
          value: data[String(issue.path[0] || '')],
        })),
      }
    }
    return {
      errors: [{
        row: rowIndex,
        field: "unknown",
        message: "Unknown validation error",
      }],
    }
  }
}

/**
 * Validate all property rows
 */
export function validatePropertyData(
  rows: Record<string, unknown>[],
  existingPropertyNames?: string[]
): ValidationResult {
  const errors: ValidationError[] = []
  const warnings: ValidationWarning[] = []
  const nameSet = new Set<string>()
  const existingNamesSet = new Set(existingPropertyNames?.map(n => n.toLowerCase()))
  
  rows.forEach((row, index) => {
    const rowNumber = index + 2 // Account for header row and 0-based index
    
    // Validate row data
    const { data, errors: rowErrors } = validatePropertyRow(row, rowNumber)
    errors.push(...rowErrors)
    
    if (data) {
      // Check for duplicate names within import
      const nameLower = data.name.toLowerCase()
      if (nameSet.has(nameLower)) {
        errors.push({
          row: rowNumber,
          field: "name",
          message: "Duplicate property name within import file",
          value: data.name,
        })
      }
      nameSet.add(nameLower)
      
      // Check for existing names in database
      if (existingNamesSet.has(nameLower)) {
        warnings.push({
          row: rowNumber,
          field: "name",
          message: "Property with this name already exists",
          value: data.name,
        })
      }
      
      // Validate destination requirement
      if (!data.destinationId && !data.destinationName) {
        errors.push({
          row: rowNumber,
          field: "destination",
          message: "Either destinationId or destinationName is required",
          value: null,
        })
      }
    }
  })
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * Get required fields for property import
 */
export function getRequiredFields(): string[] {
  return ["name"]
}

/**
 * Get all available fields for property import
 */
export function getAllFields(): string[] {
  return Object.keys(propertyImportSchema.shape)
}