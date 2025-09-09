import { z } from "zod"
import { PropertyStatus, LicenseType } from "@/generated/prisma"

export interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
}

export interface ValidationError {
  row: number
  field: string
  message: string
  value?: any
}

export interface ValidationWarning {
  row: number
  field: string
  message: string
  value?: any
}

// Base property import schema
export const propertyImportSchema = z.object({
  // Required fields
  name: z.string().min(1, "Name is required"),
  destinationId: z.string().optional(), // Will be validated separately
  
  // Optional fields with proper types
  originalName: z.string().nullable().optional(),
  status: z.enum([PropertyStatus.PUBLISHED, PropertyStatus.HIDDEN, PropertyStatus.ONBOARDING]).optional(),
  
  // Numbers
  bathrooms: z.number().int().min(0).nullable().optional(),
  floorArea: z.number().min(0).nullable().optional(),
  plotSize: z.number().min(0).nullable().optional(),
  furnishedFloors: z.number().int().min(0).nullable().optional(),
  bedrooms: z.number().int().min(0).nullable().optional(),
  guestCapacity: z.number().int().min(0).nullable().optional(),
  adultCapacity: z.number().int().min(0).nullable().optional(),
  eventDeposit: z.number().min(0).nullable().optional(),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
  
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
  suitableForEvents: z.boolean().optional(),
  
  // Arrays
  categories: z.array(z.string()).optional(),
  eventTypes: z.array(z.string()).optional(),
  
  // Strings
  licenseType: z.string().nullable().optional(),
  licenseNumber: z.string().nullable().optional(),
  operatedByAgency: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  postcode: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  additionalDetails: z.string().nullable().optional(),
  houseType: z.string().nullable().optional(),
  architecturalType: z.string().nullable().optional(),
  position: z.string().nullable().optional(),
  segment: z.string().nullable().optional(),
  accessibilityNotes: z.string().nullable().optional(),
  childrenPolicy: z.string().nullable().optional(),
  childrenAccessories: z.string().nullable().optional(),
  animalsPolicy: z.string().nullable().optional(),
  heatingSystem: z.string().nullable().optional(),
  heatingComments: z.string().nullable().optional(),
  acSystem: z.string().nullable().optional(),
  acComments: z.string().nullable().optional(),
  eventNotes: z.string().nullable().optional(),
  eventRules: z.string().nullable().optional(),
  eventLayoutLink: z.string().nullable().optional(),
  eventTariffs: z.string().nullable().optional(),
  eventDriveLink: z.string().nullable().optional(),
  transportServices: z.string().nullable().optional(),
  staffServices: z.string().nullable().optional(),
  mealServices: z.string().nullable().optional(),
  goodToKnow: z.string().nullable().optional(),
  listingUrl: z.string().nullable().optional(),
  marketingNotes: z.string().nullable().optional(),
  reviews: z.string().nullable().optional(),
})

export type PropertyImportData = z.infer<typeof propertyImportSchema>

/**
 * Validate a single property row
 */
export function validatePropertyRow(
  data: any,
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
          field: issue.path.join("."),
          message: issue.message,
          value: data[issue.path[0]],
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
  rows: any[],
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
      
      // Additional business rule validations
      if (data.guestCapacity && data.adultCapacity && data.adultCapacity > data.guestCapacity) {
        warnings.push({
          row: rowNumber,
          field: "adultCapacity",
          message: "Adult capacity exceeds guest capacity",
          value: data.adultCapacity,
        })
      }
      
      if (data.latitude && (data.latitude < -90 || data.latitude > 90)) {
        errors.push({
          row: rowNumber,
          field: "latitude",
          message: "Latitude must be between -90 and 90",
          value: data.latitude,
        })
      }
      
      if (data.longitude && (data.longitude < -180 || data.longitude > 180)) {
        errors.push({
          row: rowNumber,
          field: "longitude",
          message: "Longitude must be between -180 and 180",
          value: data.longitude,
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