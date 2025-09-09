import { z } from "zod"
import { PropertyStatus, LicenseType, ConciergeServiceOffer } from "@/types/property"

// Create property validation
export const createPropertySchema = z.object({
  name: z.string().min(1, "Property name is required").max(255),
  destinationId: z.string().min(1, "Destination is required"),
  numberOfRooms: z.number().int().min(0).default(0),
  numberOfBathrooms: z.number().int().min(0).default(0),
})

export type CreatePropertyFormData = z.infer<typeof createPropertySchema>

// Update property basic info
export const updatePropertyBasicSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  originalName: z.string().max(255).nullable().optional(),
  status: z.nativeEnum(PropertyStatus).optional(),
  destinationId: z.string().min(1).optional(),
  numberOfRooms: z.number().int().min(0).optional(),
  numberOfBathrooms: z.number().int().min(0).optional(),
  maxGuests: z.number().int().min(0).optional(),
  propertySize: z.number().positive().nullable().optional(),
  licenseType: z.nativeEnum(LicenseType).optional(),
  conciergeServiceOffer: z.nativeEnum(ConciergeServiceOffer).optional(),
  categories: z.array(z.string()).optional(),
  operatedByExternal: z.string().nullable().optional(),
})

// Update property location
export const updatePropertyLocationSchema = z.object({
  address: z.string().nullable().optional(),
  postcode: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
  additionalDetails: z.string().nullable().optional(),
})

// Update property promotion
export const updatePropertyPromotionSchema = z.object({
  exclusivity: z.boolean().optional(),
  position: z.number().int().positive().nullable().optional(),
  segment: z.string().nullable().optional(),
  iconicCollection: z.boolean().optional(),
  onboardingFees: z.boolean().optional(),
  onlineReservation: z.boolean().optional(),
  flexibleCancellation: z.boolean().optional(),
})

// Update property environment
export const updatePropertyEnvironmentSchema = z.object({
  neighborhood: z.string().nullable().optional(),
  setting: z.string().nullable().optional(),
  specialAttention: z.string().nullable().optional(),
  locatedInCity: z.boolean().optional(),
  beachAccess: z.boolean().optional(),
  beachAccessibility: z.string().nullable().optional(),
  beachTravelTime: z.string().nullable().optional(),
  privateBeachAccess: z.boolean().optional(),
  skiSlopes: z.boolean().optional(),
  shops: z.boolean().optional(),
  restaurants: z.boolean().optional(),
  touristCenter: z.boolean().optional(),
  golfCourse: z.boolean().optional(),
})

// Update property content
export const updatePropertyContentSchema = z.object({
  goodToKnow: z.string().nullable().optional(),
  internalComment: z.string().nullable().optional(),
  warning: z.string().nullable().optional(),
  automaticOffer: z.any().nullable().optional(), // JSON field
})

// Update property events
export const updatePropertyEventsSchema = z.object({
  eventsAllowed: z.boolean().optional(),
  eventsCapacity: z.number().int().min(0).nullable().optional(),
  eventsDetails: z.any().nullable().optional(), // JSON field
})

// Room validation
export const createRoomSchema = z.object({
  propertyId: z.string().min(1),
  name: z.string().min(1, "Room name is required"),
  type: z.enum(["OUTDOOR", "INTERIOR"]),
  groupName: z.string().nullable().optional(),
  position: z.number().int().min(0).default(0),
  generalInfo: z.any().nullable().optional(),
  view: z.string().nullable().optional(),
  equipment: z.any().nullable().optional(), // JSON field
})

export const updateRoomSchema = createRoomSchema.partial().omit({ propertyId: true })

// Contact validation
export const createContactSchema = z.object({
  propertyId: z.string().min(1),
  type: z.enum(["OWNER", "AGENCY", "STAFF", "MAINTENANCE", "EMERGENCY"]),
  name: z.string().min(1, "Contact name is required"),
  email: z.string().email("Invalid email").nullable().optional(),
  phone: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  isApproved: z.boolean().default(false),
})

// Price range validation
export const createPriceRangeSchema = z.object({
  propertyId: z.string().min(1),
  name: z.string().min(1, "Price range name is required"),
  startDate: z.date(),
  endDate: z.date(),
  nightlyRate: z.number().positive("Nightly rate must be positive"),
  weeklyRate: z.number().positive().nullable().optional(),
  monthlyRate: z.number().positive().nullable().optional(),
  minimumStay: z.number().int().positive().default(1),
}).refine((data) => data.endDate > data.startDate, {
  message: "End date must be after start date",
  path: ["endDate"],
})

// Search and filter validation
export const propertySearchSchema = z.object({
  search: z.string().optional(),
  status: z.enum(["ALL", "PUBLISHED", "HIDDEN", "ONBOARDING"]).optional(),
  destinationId: z.string().optional(),
  
  // Room and bathroom filters
  minRooms: z.number().int().min(0).optional(),
  maxRooms: z.number().int().min(0).optional(),
  minBathrooms: z.number().int().min(0).optional(),
  maxBathrooms: z.number().int().min(0).optional(),
  
  // Guest capacity
  maxGuests: z.number().int().min(0).optional(),
  
  // Property type
  propertyType: z.string().optional(),
  
  // Amenities
  amenities: z.array(z.enum([
    "hasPool", "hasBeachAccess", "hasHotTub", 
    "hasGym", "hasParking", "hasGarden"
  ])).optional(),
  
  // Services
  services: z.array(z.enum([
    "hasChef", "hasHousekeeper", "hasDriver", 
    "hasConcierge", "hasTransport"
  ])).optional(),
  
  // Accessibility
  accessibility: z.array(z.enum([
    "wheelchairAccessible", "elevatorAvailable", 
    "accessibleBathroom", "wideDoors"
  ])).optional(),
  
  // Policies
  petsAllowed: z.boolean().optional(),
  eventsAllowed: z.boolean().optional(),
  smokingAllowed: z.boolean().optional(),
  
  // Price range
  minPrice: z.number().min(0).optional(),
  maxPrice: z.number().min(0).optional(),
  
  // Promotion flags
  showOnWebsite: z.boolean().optional(),
  highlight: z.boolean().optional(),
  
  // Pagination
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(100).default(20),
  sortBy: z.string().optional(),
  sortDirection: z.enum(["asc", "desc"]).optional(),
})