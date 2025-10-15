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
    numberOfRooms: property.numberOfRooms || 0,
    numberOfBathrooms: property.numberOfBathrooms || 0,
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
    maxGuests: property.maxGuests || "",
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
    
    // Pricing Data - Convert related records to CSV format
    priceRanges: property.pricingPeriods?.map((period: any) => 
      `${period.name}:${period.startDate}:${period.endDate}:${period.ownerNightlyRate}:${period.ownerWeeklyRate || ''}:${period.commissionRate}:${period.isValidated}:${period.notes || ''}`
    ).join('|') || '',
    
    operationalCosts: property.operationalCosts?.map((cost: any) => 
      `${cost.costType}:${cost.priceType}:${cost.estimatedPrice || ''}:${cost.publicPrice || ''}:${cost.paidBy || ''}:${cost.comment || ''}`
    ).join('|') || '',
    
    minimumStayRules: property.minimumStayRules?.map((rule: any) => 
      `${rule.bookingCondition}:${rule.minimumNights}:${rule.startDate}:${rule.endDate}`
    ).join('|') || '',
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
    numberOfRooms: "5",
    numberOfBathrooms: "3",
    maxGuests: "8",
    categories: "VILLA, LUXURY",
    address: "123 Example Street",
    postcode: "07001", 
    city: "Palma",
    additionalDetails: "Near the beach",
    latitude: "39.5696",
    longitude: "2.6502",
    exclusivity: "Yes",
    segment: "Luxury",
    iconicCollection: "No",
    onlineReservation: "Yes",
    flexibleCancellation: "Yes",
    onboardingFees: "No",
    goodToKnow: "Beach is 5 minutes walk",
    
    // Pricing Data - Multiple entries separated by pipe (|)
    // Format: "PeriodName:StartDate:EndDate:OwnerNightlyRate:OwnerWeeklyRate:CommissionRate:IsValidated:Notes|..."
    priceRanges: "Summer 2024:2024-06-01:2024-08-31:350:2100:25:false:Peak season|Winter 2024:2024-12-15:2025-01-15:450:2700:25:false:Holiday premium",
    
    // Operational Costs - Multiple entries separated by pipe (|)  
    // Format: "CostType:PriceType:EstimatedPrice:PublicPrice:PaidBy:Comment|..."
    operationalCosts: "HOUSEKEEPING:PER_STAY:100:120:Guest:Final cleaning|LINEN_CHANGE:PER_DAY:25:30:ManPhil & Co:Fresh linens",
    
    // Minimum Stay Rules - Multiple entries separated by pipe (|)
    // Format: "BookingCondition:MinimumNights:StartDate:EndDate|..."
    minimumStayRules: "GENERAL:3:2024-06-01:2024-08-31|HOLIDAY:7:2024-12-15:2025-01-15",
  }]

  return formatDataForCSV(templateData)
}