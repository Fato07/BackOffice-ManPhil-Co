import { 
  Property, 
  Destination, 
  PropertyStatus, 
  LicenseType, 
  ConciergeServiceOffer,
  Room,
  PropertyContact,
  ContactType,
  Booking,
  PriceRange,
  Resource,
  Photo,
  MarketingContent,
  AccessibilityType,
  PropertyPricing,
  MinimumStayRule,
  OperationalCost
} from "@/generated/prisma"

// Re-export Prisma types
export { 
  PropertyStatus, 
  LicenseType, 
  ConciergeServiceOffer,
  ContactType,
  BookingType 
} from "@/generated/prisma"

// Surroundings and Stay types
export interface SurroundingsInfo {
  filters?: string[]
  customNotes?: string
}

export type ServiceFrequency = 'none' | 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'custom'

export interface ServiceSchedule {
  frequency: ServiceFrequency
  customSchedule?: string
  arrivalTime?: string
}

export interface StayMetadata {
  access?: {
    airports?: string[]
    trainStations?: string[]
    cars?: string[]
    roadType?: 'asphalt' | 'winding' | 'dirt'
    specialAttention?: boolean
    specialAttentionNote?: string
    keyCount?: number
    beeperCount?: number
  }
  maintenance?: {
    linenChange?: ServiceSchedule
    towelChange?: ServiceSchedule
    gardeningService?: ServiceSchedule & { enabled?: boolean }
    poolMaintenance?: ServiceSchedule & { 
      enabled?: boolean
      includesLinen?: boolean
    }
  }
  network?: {
    fiberOptic?: boolean
    routerAccessible?: boolean
    routerLocation?: string
    supplier?: string
    wiredInternet?: boolean
    comment?: string
  }
  security?: {
    surveillance?: string[]
    nearestHospital?: { 
      name?: string
      country?: string 
      distance?: string
    }
    firstAidLocation?: string
    firstAidKit?: boolean
    fireExtinguisherLocation?: string
    smokeDetectorLocation?: string
    specificMeasures?: string
  }
  villaBookComment?: {
    [language: string]: string
  }
}

// Extended types with relations
export type PropertyWithRelations = Property & {
  destination: Destination
  rooms?: Room[]
  contacts?: PropertyContact[]
  bookings?: Booking[]
  prices?: PriceRange[]
  resources?: Resource[]
  photos?: Photo[]
  marketingContent?: MarketingContent[]
  pricing?: PropertyPricing | null
  minimumStayRules?: MinimumStayRule[]
  operationalCosts?: OperationalCost[]
}

// UI-specific types
export type PropertyListItem = Pick<Property, 
  'id' | 
  'name' | 
  'status' | 
  'destinationId' |
  'numberOfRooms' |
  'numberOfBathrooms' |
  'maxGuests' |
  'address' |
  'city' |
  'createdAt' |
  'updatedAt'
> & {
  destination: Pick<Destination, 'id' | 'name' | 'country'>
  photos?: Array<{ url: string; caption: string | null }>
}

// Form types
export type CreatePropertyInput = {
  name: string
  destinationId: string
  numberOfRooms: number
  numberOfBathrooms: number
}

export type UpdatePropertyInput = Partial<Omit<Property, 
  'id' | 
  'createdAt' | 
  'updatedAt'
>>

// Filter types
export type PropertyFilters = {
  status?: PropertyStatus | 'ALL'
  destinationId?: string
  destinationIds?: string[]
  search?: string
  
  // Room and bathroom filters
  minRooms?: number
  maxRooms?: number
  minBathrooms?: number
  maxBathrooms?: number
  
  // Guest capacity
  maxGuests?: number
  
  // Property type
  propertyType?: string
  
  // Property categories
  categories?: string[]
  
  // Accessibility options
  accessibilityOptions?: AccessibilityType[]
  
  // Amenities (boolean fields)
  amenities?: Array<'hasPool' | 'hasBeachAccess' | 'hasHotTub' | 'hasGym' | 'hasParking' | 'hasGarden'>
  
  // Services (from JSON field)
  services?: Array<'hasChef' | 'hasHousekeeper' | 'hasDriver' | 'hasConcierge' | 'hasTransport'>
  
  // Accessibility (from JSON field)
  accessibility?: Array<'wheelchairAccessible' | 'elevatorAvailable' | 'accessibleBathroom' | 'wideDoors'>
  
  // Policies (from JSON field)
  policies?: {
    petsAllowed?: boolean
    eventsAllowed?: boolean
    smokingAllowed?: boolean
  }
  
  // Price range
  minPrice?: number
  maxPrice?: number
  
  // Promotion flags
  promoted?: {
    showOnWebsite?: boolean // maps to onlineReservation
    highlight?: boolean // maps to iconicCollection or exclusivity
  }
}

// Pagination types
export type PaginationParams = {
  page: number
  pageSize: number
}

export type PaginatedResponse<T> = {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// Equipment types
export type EquipmentItem = {
  name: string
  quantity: number
  category?: string
}

export type RoomEquipment = {
  category: string
  items: EquipmentItem[]
}

// Location environment types
export type LocationEnvironment = {
  neighborhood?: string
  setting?: string
  specialAttention?: string
  locatedInCity: boolean
  beachAccess: boolean
  beachAccessibility?: string
  beachTravelTime?: string
  privateBeachAccess: boolean
  skiSlopes: boolean
  shops: boolean
  restaurants: boolean
  touristCenter: boolean
  golfCourse: boolean
}

// Services types
export type PropertyServices = {
  transport?: {
    included: boolean
    details?: string
  }
  meals?: {
    housekeeping: boolean
    chef: boolean
    details?: string
  }
  concierge?: {
    level: string
    details?: string
  }
}

// Event types
export type EventType = 'wedding' | 'corporate' | 'birthday' | 'private_dinner' | 'other'

export type EventTypeSettings = {
  allowed: boolean
  capacity?: number
  pricing?: string
  restrictions?: string
}

export type EventFacility = {
  name: string
  available: boolean
  details?: string
}

export type EventVendor = {
  id: string
  name: string
  serviceType: 'catering' | 'photography' | 'music_dj' | 'flowers' | 'event_planning' | 'other'
  contactInfo: string
  notes?: string
}

export type EventDetails = {
  eventTypes: Record<EventType, EventTypeSettings>
  facilities: {
    soundSystem: boolean
    danceFloor: boolean
    cateringKitchen: boolean
    eventFurniture: boolean
    parkingSpaces?: number
    outdoorEventSpace: boolean
    indoorEventSpace: boolean
    barArea: boolean
    bbqFacilities: boolean
    customFacilities?: EventFacility[]
  }
  restrictions: {
    noiseCurfewTime?: string
    musicAllowedUntil?: string
    minimumRentalPeriod?: number
    securityDepositRequired: boolean
    securityDepositAmount?: number
    eventInsuranceRequired: boolean
    additionalRestrictions?: string
  }
  vendors: EventVendor[]
  additionalNotes?: string
}

// Property Description types
export type PropertyDescription = {
  houseType?: 'VILLA' | 'APARTMENT' | 'CHALET' | 'PENTHOUSE' | 'TOWNHOUSE' | 'CASTLE' | 'MANOR' | 'COTTAGE'
  architecturalType?: 'CONTEMPORARY' | 'TRADITIONAL' | 'MODERN' | 'RUSTIC' | 'COLONIAL' | 'MEDITERRANEAN' | 'MINIMALIST'
  floorArea?: number // in sqm
  plotSize?: number // in sqm
  numberOfFurnishedFloors?: number
  adjoiningHouse?: boolean
  maxGuestCapacity?: number
  maxAdultCapacity?: number
  numberOfBedrooms?: number
  numberOfBedroomsForLiveInStaff?: number
  numberOfBathrooms?: number
}

// Property Parking types
export type PropertyParking = {
  hasChargingStation?: boolean
  hasIndoorParking?: boolean
  hasOutdoorParking?: boolean
  numberOfParkingSpots?: number
}