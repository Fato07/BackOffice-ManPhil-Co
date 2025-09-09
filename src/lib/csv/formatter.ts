import Papa from "papaparse"

/**
 * Format data for CSV export
 */
export function formatDataForCSV(data: any[]): string {
  if (!data || data.length === 0) {
    return ""
  }

  // Add BOM for Excel UTF-8 compatibility
  const BOM = "\uFEFF"
  
  const csv = Papa.unparse(data, {
    header: true,
    delimiter: ",",
    newline: "\r\n",
    quoteChar: '"',
    escapeChar: '"',
    skipEmptyLines: false,
  })

  return BOM + csv
}

/**
 * Transform nested property data to flat structure for CSV
 */
export function flattenPropertyForExport(property: any): Record<string, any> {
  return {
    // Basic Information
    id: property.id,
    name: property.name,
    originalName: property.originalName || "",
    status: property.status,
    destinationName: property.destination?.name || "",
    destinationId: property.destinationId,
    
    // Property Details
    rooms: property.rooms?.length || 0,
    bathrooms: property.bathrooms || 0,
    licenseType: property.licenseType || "",
    licenseNumber: property.licenseNumber || "",
    conciergeService: property.conciergeService ? "Yes" : "No",
    categories: Array.isArray(property.categories) ? property.categories.join(", ") : "",
    operatedByAgency: property.operatedByAgency || "",
    
    // Location
    address: property.address || "",
    postcode: property.postcode || "",
    city: property.city || "",
    additionalDetails: property.additionalDetails || "",
    latitude: property.latitude || "",
    longitude: property.longitude || "",
    
    // Description Metrics
    houseType: property.houseType || "",
    architecturalType: property.architecturalType || "",
    floorArea: property.floorArea || "",
    plotSize: property.plotSize || "",
    furnishedFloors: property.furnishedFloors || "",
    bedrooms: property.bedrooms || "",
    guestCapacity: property.guestCapacity || "",
    adultCapacity: property.adultCapacity || "",
    adjoiningHouse: property.adjoiningHouse ? "Yes" : "No",
    
    // Promote Flags
    exclusivity: property.exclusivity ? "Yes" : "No",
    position: property.position || "",
    segment: property.segment || "",
    iconicCollection: property.iconicCollection ? "Yes" : "No",
    onlineReservation: property.onlineReservation ? "Yes" : "No",
    flexibleCancellation: property.flexibleCancellation ? "Yes" : "No",
    onboardingFees: property.onboardingFees ? "Yes" : "No",
    
    // Accessibility
    elevator: property.elevator ? "Yes" : "No",
    prmSuitability: property.prmSuitability ? "Yes" : "No",
    accessibilityNotes: property.accessibilityNotes || "",
    
    // Policies
    childrenPolicy: property.childrenPolicy || "",
    childrenAccessories: property.childrenAccessories || "",
    animalsPolicy: property.animalsPolicy || "",
    liveInStaff: property.liveInStaff ? "Yes" : "No",
    
    // Heating & AC
    heatingSystem: property.heatingSystem || "",
    heatingComments: property.heatingComments || "",
    acSystem: property.acSystem || "",
    acComments: property.acComments || "",
    
    // Events
    suitableForEvents: property.suitableForEvents ? "Yes" : "No",
    eventTypes: Array.isArray(property.eventTypes) ? property.eventTypes.join(", ") : "",
    eventNotes: property.eventNotes || "",
    eventRules: property.eventRules || "",
    eventLayoutLink: property.eventLayoutLink || "",
    eventTariffs: property.eventTariffs || "",
    eventDeposit: property.eventDeposit || "",
    eventDriveLink: property.eventDriveLink || "",
    
    // Services
    transportServices: property.transportServices || "",
    staffServices: property.staffServices || "",
    mealServices: property.mealServices || "",
    
    // Good to Know
    goodToKnow: property.goodToKnow || "",
    
    // Marketing
    listingUrl: property.listingUrl || "",
    marketingNotes: property.marketingNotes || "",
    reviews: property.reviews || "",
    
    // Metadata
    createdAt: property.createdAt ? new Date(property.createdAt).toISOString() : "",
    updatedAt: property.updatedAt ? new Date(property.updatedAt).toISOString() : "",
    
    // Room Summary (if included)
    roomCount: property.rooms?.length || 0,
    totalEquipment: property.rooms?.reduce((acc: number, room: any) => 
      acc + (room.equipment?.length || 0), 0) || 0,
    
    // Photo Summary (if included)
    photoCount: property.photos?.length || 0,
    
    // Resource Summary (if included)
    resourceCount: property.resources?.length || 0,
  }
}

/**
 * Generate CSV template with example data
 */
export function generateCSVTemplate(): string {
  const templateData = [{
    name: "Example Villa",
    originalName: "Villa Ejemplo",
    status: "HIDDEN",
    destinationName: "Mallorca",
    rooms: "5",
    bathrooms: "3",
    licenseType: "TYPE_1",
    licenseNumber: "LIC12345",
    conciergeService: "Yes",
    categories: "VILLA, LUXURY",
    operatedByAgency: "Example Agency",
    address: "123 Example Street",
    postcode: "07001",
    city: "Palma",
    additionalDetails: "Near the beach",
    latitude: "39.5696",
    longitude: "2.6502",
    houseType: "Villa",
    architecturalType: "Modern",
    floorArea: "250",
    plotSize: "1000",
    furnishedFloors: "2",
    bedrooms: "4",
    guestCapacity: "8",
    adultCapacity: "6",
    adjoiningHouse: "No",
    exclusivity: "Yes",
    position: "Beachfront",
    segment: "Luxury",
    iconicCollection: "No",
    onlineReservation: "Yes",
    flexibleCancellation: "Yes",
    onboardingFees: "No",
    elevator: "No",
    prmSuitability: "No",
    accessibilityNotes: "",
    childrenPolicy: "Allowed",
    childrenAccessories: "High chair, Cot",
    animalsPolicy: "Not allowed",
    liveInStaff: "No",
    heatingSystem: "Central heating",
    heatingComments: "Available October-April",
    acSystem: "Split AC",
    acComments: "In all bedrooms",
    suitableForEvents: "Yes",
    eventTypes: "Wedding, Birthday",
    eventNotes: "Maximum 50 guests",
    eventRules: "No loud music after 11 PM",
    eventLayoutLink: "",
    eventTariffs: "€500 per event",
    eventDeposit: "1000",
    eventDriveLink: "",
    transportServices: "Airport transfer available",
    staffServices: "Daily cleaning included",
    mealServices: "Chef on request",
    goodToKnow: "Beach is 5 minutes walk",
    listingUrl: "https://example.com/villa",
    marketingNotes: "Featured property",
    reviews: "5 stars average",
  }]

  return formatDataForCSV(templateData)
}