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
  name: z.string().min(1, "Name must not be empty").max(255, "Name too long").optional(),
  originalName: z.string().max(255, "Original name too long").nullish(),
  status: z.nativeEnum(PropertyStatus).optional(),
  destinationId: z.string().min(1, "Destination required").optional(),
  numberOfRooms: z.number().int().min(0, "Rooms cannot be negative").optional(),
  numberOfBathrooms: z.number().int().min(0, "Bathrooms cannot be negative").optional(),
  maxGuests: z.number().int().min(0, "Guests cannot be negative").optional(),
  propertySize: z.number().positive("Property size must be positive").nullish(),
  licenseType: z.nativeEnum(LicenseType).optional(),
  conciergeServiceOffer: z.nativeEnum(ConciergeServiceOffer).optional(),
  categories: z.array(z.string()).optional(),
  operatedByExternal: z.string().nullish(),
})

// Update property location
export const updatePropertyLocationSchema = z.object({
  address: z.string().nullish(),
  postcode: z.string().nullish(),
  city: z.string().nullish(),
  latitude: z.number().min(-90, "Invalid latitude").max(90, "Invalid latitude").nullish(),
  longitude: z.number().min(-180, "Invalid longitude").max(180, "Invalid longitude").nullish(),
  additionalDetails: z.string().nullish(),
})

// Update property promotion
export const updatePropertyPromotionSchema = z.object({
  exclusivity: z.boolean().optional(),
  position: z.number().int().positive("Position must be positive").nullish(),
  segment: z.string().nullish(),
  iconicCollection: z.boolean().optional(),
  onboardingFees: z.boolean().optional(),
  onlineReservation: z.boolean().optional(),
  flexibleCancellation: z.boolean().optional(),
})

// Update property environment
export const updatePropertyEnvironmentSchema = z.object({
  neighborhood: z.string().nullish(),
  setting: z.string().nullish(),
  specialAttention: z.string().nullish(),
  locatedInCity: z.boolean().optional(),
  beachAccess: z.boolean().optional(),
  beachAccessibility: z.string().nullish(),
  beachTravelTime: z.string().nullish(),
  privateBeachAccess: z.boolean().optional(),
  skiSlopes: z.boolean().optional(),
  shops: z.boolean().optional(),
  restaurants: z.boolean().optional(),
  touristCenter: z.boolean().optional(),
  golfCourse: z.boolean().optional(),
  accessibilityOptions: z.array(z.enum(["BY_CAR", "SKI_IN_SKI_OUT", "BY_FOOT"])).optional(),
})

// Update property content
export const updatePropertyContentSchema = z.object({
  goodToKnow: z.string().nullish(),
  internalComment: z.string().nullish(),
  warning: z.string().nullish(),
  automaticOffer: z.any().nullish(), // JSON field - consider using z.record() for better type safety
})

// Update property events
export const updatePropertyEventsSchema = z.object({
  eventsAllowed: z.boolean().optional(),
  eventsCapacity: z.number().int().min(0, "Event capacity cannot be negative").nullish(),
  eventsDetails: z.any().nullish(), // JSON field - consider using z.record() for better type safety
})

// Update property description
export const updatePropertyDescriptionSchema = z.object({
  description: z.object({
    houseType: z.enum([
      "VILLA", "APARTMENT", "CHALET", "PENTHOUSE", 
      "TOWNHOUSE", "CASTLE", "MANOR", "COTTAGE"
    ]).optional(),
    architecturalType: z.enum([
      "CONTEMPORARY", "TRADITIONAL", "MODERN", "RUSTIC", 
      "COLONIAL", "MEDITERRANEAN", "MINIMALIST"
    ]).optional(),
    floorArea: z.number().positive("Floor area must be positive").nullish(),
    plotSize: z.number().positive("Plot size must be positive").nullish(),
    numberOfFurnishedFloors: z.number().int().min(0, "Number of floors cannot be negative").nullish(),
    adjoiningHouse: z.boolean().optional(),
    maxGuestCapacity: z.number().int().min(0, "Guest capacity cannot be negative").nullish(),
    maxAdultCapacity: z.number().int().min(0, "Adult capacity cannot be negative").nullish(),
    numberOfBedrooms: z.number().int().min(0, "Number of bedrooms cannot be negative").nullish(),
    numberOfBedroomsForLiveInStaff: z.number().int().min(0, "Number of staff bedrooms cannot be negative").nullish(),
    numberOfBathrooms: z.number().int().min(0, "Number of bathrooms cannot be negative").nullish(),
  }).optional(),
})

// Update property parking
export const updatePropertyParkingSchema = z.object({
  parking: z.object({
    hasChargingStation: z.boolean().optional(),
    hasIndoorParking: z.boolean().optional(),
    hasOutdoorParking: z.boolean().optional(),
    numberOfParkingSpots: z.number().int().min(0, "Number of parking spots cannot be negative").nullish(),
  }).optional(),
})

// Room validation
export const createRoomSchema = z.object({
  propertyId: z.string().min(1, "Property ID is required"),
  name: z.string().min(1, "Room name is required"),
  type: z.enum([
    "BADMINTON_COURT", "BAR", "BASKETBALL_COURT", "BATHROOM", "BEDROOM", 
    "BEDROOM_FOR_CHILDREN", "BEDROOM_FOR_STAFF", "BILLBOARD_ROOM", "CIGAR_CELL",
    "COLD_CHAMBER", "CONFERENCE_ROOM", "COURTYARD", "COVERED_TERRACE", "DINING_ROOM",
    "DORMITORY", "DRESSING_ROOM", "FITNESS_ROOM", "FOOTBALL_COURT", "GAMING_ROOM",
    "GARDEN", "KITCHEN", "LAUNDRY_ROOM", "LIVING_ROOM", "MASSAGE_ROOM", "MEDITATION_ROOM",
    "MOVIE_ROOM", "MUSIC_ROOM", "OFFICE_ROOM", "PADEL_COURT", "PETANQUE", "POOL_AREA",
    "POOLHOUSE", "RELAXATION_ROOM", "RESTROOM", "ROOFTOP", "SKIROOM", "SLEEPING_SLUG",
    "SMOKEHOUSE", "SPA", "SUITE", "TENNIS_COURT", "TERRACE", "TV_ROOM", "VIP",
    "VERANDA", "VOLLEYBALL_COURT", "WINDOWLESS_BEDROOM", "WINE_CELLAR"
  ], {
    message: "Invalid room type"
  }),
  groupName: z.string().nullish(),
  position: z.number().int().min(0, "Position cannot be negative").default(0),
  generalInfo: z.any().nullish(), // Consider using z.record() for better type safety
  view: z.string().nullish(),
  equipment: z.any().nullish(), // Consider using z.record() for better type safety
})

export const updateRoomSchema = createRoomSchema.partial().omit({ propertyId: true })

// Contact validation
export const createContactSchema = z.object({
  propertyId: z.string().min(1, "Property ID is required"),
  type: z.enum([
    "OWNER", "MANAGER", "AGENCY", "STAFF", "MAINTENANCE", "EMERGENCY", 
    "CHECK_IN_MANAGER", "SECURITY_DEPOSIT_MANAGER", "SIGNATORY"
  ], {
    message: "Invalid contact type"
  }),
  name: z.string().min(1, "Contact name is required").max(255, "Name too long"),
  email: z.string().email({ message: "Invalid email format" }).nullish(),
  phone: z.string().max(50, "Phone number too long").nullish(),
  notes: z.string().max(1000, "Notes too long").nullish(),
  isApproved: z.boolean().default(false),
})

// Price range validation
export const createPriceRangeSchema = z.object({
  propertyId: z.string().min(1, "Property ID is required"),
  name: z.string().min(1, "Price range name is required").max(255, "Name too long"),
  startDate: z.date({
    message: "Valid start date is required"
  }),
  endDate: z.date({
    message: "Valid end date is required"
  }),
  nightlyRate: z.number().positive("Nightly rate must be positive"),
  weeklyRate: z.number().positive("Weekly rate must be positive").nullish(),
  monthlyRate: z.number().positive("Monthly rate must be positive").nullish(),
  minimumStay: z.number().int().positive("Minimum stay must be positive").default(1),
}).refine((data) => data.endDate > data.startDate, {
  message: "End date must be after start date",
  path: ["endDate"],
})

// Search and filter validation
export const propertySearchSchema = z.object({
  search: z.string().optional(),
  status: z.enum(["ALL", "PUBLISHED", "HIDDEN", "ONBOARDING", "OFFBOARDED"]).optional(),
  destinationId: z.string().optional(),
  destinationIds: z.array(z.string()).optional(),
  
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