export interface FieldMapping {
  csvField: string
  propertyField: string
  confidence: number
}

export interface MappingResult {
  mappings: FieldMapping[]
  unmappedCsvFields: string[]
  unmappedPropertyFields: string[]
}

// Common variations of field names
const fieldVariations: Record<string, string[]> = {
  name: ["name", "property_name", "propertyname", "title", "property"],
  originalName: ["originalname", "original_name", "native_name", "local_name"],
  status: ["status", "state", "visibility", "published"],
  destinationName: ["destination", "destinationname", "location", "area", "region"],
  destinationId: ["destinationid", "destination_id", "location_id"],
  rooms: ["rooms", "room_count", "roomcount", "number_of_rooms", "num_rooms"],
  bathrooms: ["bathrooms", "bathroom_count", "bathroomcount", "baths"],
  licenseType: ["licensetype", "license_type", "licence_type", "permit_type"],
  licenseNumber: ["licensenumber", "license_number", "licence_number", "permit_number"],
  conciergeService: ["conciergeservice", "concierge_service", "concierge", "butler_service"],
  categories: ["categories", "category", "tags", "types"],
  operatedByAgency: ["operatedbyagency", "operated_by_agency", "agency", "management_company"],
  address: ["address", "street", "street_address", "location"],
  postcode: ["postcode", "postalcode", "postal_code", "zip", "zipcode", "zip_code"],
  city: ["city", "town", "municipality"],
  additionalDetails: ["additionaldetails", "additional_details", "notes", "comments"],
  latitude: ["latitude", "lat", "gps_lat"],
  longitude: ["longitude", "lng", "long", "gps_lng"],
  houseType: ["housetype", "house_type", "property_type", "type"],
  architecturalType: ["architecturaltype", "architectural_type", "style", "architecture"],
  floorArea: ["floorarea", "floor_area", "size", "sqm", "square_meters"],
  plotSize: ["plotsize", "plot_size", "land_size", "lot_size"],
  furnishedFloors: ["furnishedfloors", "furnished_floors", "floors"],
  bedrooms: ["bedrooms", "bedroom_count", "beds", "num_bedrooms"],
  guestCapacity: ["guestcapacity", "guest_capacity", "max_guests", "capacity", "sleeps"],
  adultCapacity: ["adultcapacity", "adult_capacity", "max_adults", "adults"],
  adjoiningHouse: ["adjoininghouse", "adjoining_house", "attached", "semi_detached"],
  exclusivity: ["exclusivity", "exclusive", "private"],
  position: ["position", "location_type", "setting"],
  segment: ["segment", "market_segment", "category"],
  iconicCollection: ["iconiccollection", "iconic_collection", "premium", "signature"],
  onlineReservation: ["onlinereservation", "online_reservation", "online_booking", "instant_booking"],
  flexibleCancellation: ["flexiblecancellation", "flexible_cancellation", "free_cancellation"],
  onboardingFees: ["onboardingfees", "onboarding_fees", "setup_fees"],
  elevator: ["elevator", "lift", "has_elevator", "has_lift"],
  prmSuitability: ["prmsuitability", "prm_suitability", "accessible", "disability_access"],
  accessibilityNotes: ["accessibilitynotes", "accessibility_notes", "disability_notes"],
  childrenPolicy: ["childrenpolicy", "children_policy", "kids_policy", "child_policy"],
  childrenAccessories: ["childrenaccessories", "children_accessories", "kids_equipment"],
  animalsPolicy: ["animalspolicy", "animals_policy", "pet_policy", "pets"],
  liveInStaff: ["liveinstaff", "live_in_staff", "resident_staff", "onsite_staff"],
  heatingSystem: ["heatingsystem", "heating_system", "heating", "heat"],
  heatingComments: ["heatingcomments", "heating_comments", "heating_notes"],
  acSystem: ["acsystem", "ac_system", "air_conditioning", "aircon", "ac"],
  acComments: ["accomments", "ac_comments", "ac_notes", "aircon_notes"],
  suitableForEvents: ["suitableforevents", "suitable_for_events", "events_allowed", "event_venue"],
  eventTypes: ["eventtypes", "event_types", "allowed_events"],
  eventNotes: ["eventnotes", "event_notes", "event_comments"],
  eventRules: ["eventrules", "event_rules", "event_regulations"],
  eventLayoutLink: ["eventlayoutlink", "event_layout_link", "event_layout"],
  eventTariffs: ["eventtariffs", "event_tariffs", "event_pricing", "event_rates"],
  eventDeposit: ["eventdeposit", "event_deposit", "event_security"],
  eventDriveLink: ["eventdrivelink", "event_drive_link", "event_files"],
  transportServices: ["transportservices", "transport_services", "transportation"],
  staffServices: ["staffservices", "staff_services", "services"],
  mealServices: ["mealservices", "meal_services", "catering", "dining"],
  goodToKnow: ["goodtoknow", "good_to_know", "important_info", "notes"],
  listingUrl: ["listingurl", "listing_url", "url", "website", "link"],
  marketingNotes: ["marketingnotes", "marketing_notes", "marketing_comments"],
  reviews: ["reviews", "ratings", "feedback"],
}

/**
 * Normalize field name for comparison
 */
function normalizeFieldName(field: string): string {
  return field
    .toLowerCase()
    .replace(/[\s-_]/g, "")
    .replace(/[^a-z0-9]/g, "")
}

/**
 * Calculate similarity between two strings
 */
function calculateSimilarity(str1: string, str2: string): number {
  const s1 = normalizeFieldName(str1)
  const s2 = normalizeFieldName(str2)
  
  if (s1 === s2) return 1
  
  // Check if one contains the other
  if (s1.includes(s2) || s2.includes(s1)) return 0.8
  
  // Levenshtein distance for partial matches
  const distance = levenshteinDistance(s1, s2)
  const maxLength = Math.max(s1.length, s2.length)
  return Math.max(0, 1 - distance / maxLength)
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length
  const n = str2.length
  const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0))
  
  for (let i = 0; i <= m; i++) dp[i][0] = i
  for (let j = 0; j <= n; j++) dp[0][j] = j
  
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1]
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,    // deletion
          dp[i][j - 1] + 1,    // insertion
          dp[i - 1][j - 1] + 1 // substitution
        )
      }
    }
  }
  
  return dp[m][n]
}

/**
 * Auto-map CSV fields to property fields
 */
export function autoMapFields(
  csvHeaders: string[],
  propertyFields: string[]
): MappingResult {
  const mappings: FieldMapping[] = []
  const mappedCsvFields = new Set<string>()
  const mappedPropertyFields = new Set<string>()
  
  // First pass: exact matches using variations
  for (const propertyField of propertyFields) {
    const variations = fieldVariations[propertyField] || [propertyField]
    
    for (const csvField of csvHeaders) {
      const normalizedCsv = normalizeFieldName(csvField)
      
      for (const variation of variations) {
        if (normalizeFieldName(variation) === normalizedCsv) {
          mappings.push({
            csvField,
            propertyField,
            confidence: 1,
          })
          mappedCsvFields.add(csvField)
          mappedPropertyFields.add(propertyField)
          break
        }
      }
      
      if (mappedPropertyFields.has(propertyField)) break
    }
  }
  
  // Second pass: fuzzy matching for remaining fields
  const unmappedCsvHeaders = csvHeaders.filter(h => !mappedCsvFields.has(h))
  const unmappedPropertyFields = propertyFields.filter(f => !mappedPropertyFields.has(f))
  
  for (const propertyField of unmappedPropertyFields) {
    let bestMatch: { field: string; similarity: number } | null = null
    
    for (const csvField of unmappedCsvHeaders) {
      const similarity = calculateSimilarity(csvField, propertyField)
      
      if (similarity > 0.6 && (!bestMatch || similarity > bestMatch.similarity)) {
        bestMatch = { field: csvField, similarity }
      }
    }
    
    if (bestMatch) {
      mappings.push({
        csvField: bestMatch.field,
        propertyField,
        confidence: bestMatch.similarity,
      })
      mappedCsvFields.add(bestMatch.field)
      mappedPropertyFields.add(propertyField)
    }
  }
  
  return {
    mappings: mappings.sort((a, b) => b.confidence - a.confidence),
    unmappedCsvFields: csvHeaders.filter(h => !mappedCsvFields.has(h)),
    unmappedPropertyFields: propertyFields.filter(f => !mappedPropertyFields.has(f)),
  }
}

/**
 * Apply field mappings to transform CSV data
 */
export function applyFieldMappings(
  data: any[],
  mappings: FieldMapping[]
): any[] {
  return data.map(row => {
    const mappedRow: any = {}
    
    for (const mapping of mappings) {
      if (row.hasOwnProperty(mapping.csvField)) {
        mappedRow[mapping.propertyField] = row[mapping.csvField]
      }
    }
    
    return mappedRow
  })
}