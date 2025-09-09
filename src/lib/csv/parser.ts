import Papa from "papaparse"

export interface ParseResult<T = any> {
  data: T[]
  errors: ParseError[]
  meta: ParseMeta
}

export interface ParseError {
  type: string
  code: string
  message: string
  row?: number
}

export interface ParseMeta {
  delimiter: string
  linebreak: string
  aborted: boolean
  truncated: boolean
  fields?: string[]
}

/**
 * Parse CSV file content
 */
export function parseCSV<T = any>(
  content: string,
  options?: Papa.ParseConfig
): Promise<ParseResult<T>> {
  return new Promise((resolve, reject) => {
    Papa.parse(content, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
      ...options,
      complete: (results) => {
        resolve({
          data: results.data as T[],
          errors: results.errors.map((error) => ({
            type: error.type,
            code: error.code,
            message: error.message,
            row: error.row,
          })),
          meta: {
            delimiter: results.meta.delimiter,
            linebreak: results.meta.linebreak,
            aborted: results.meta.aborted,
            truncated: results.meta.truncated,
            fields: results.meta.fields,
          },
        })
      },
      error: (error: any) => {
        reject(error)
      },
    })
  })
}

/**
 * Parse CSV file with automatic delimiter detection
 */
export async function parseCSVAuto<T = any>(
  file: File
): Promise<ParseResult<T>> {
  const content = await file.text()
  
  // First, detect the delimiter
  const detection = Papa.parse(content, {
    header: true,
    preview: 5,
  })
  
  // Then parse with detected delimiter
  return parseCSV<T>(content, {
    delimiter: detection.meta.delimiter,
  })
}

/**
 * Validate CSV headers against expected fields
 */
export function validateHeaders(
  headers: string[],
  requiredFields: string[]
): { valid: boolean; missing: string[]; extra: string[] } {
  const headerSet = new Set(headers.map(h => h.toLowerCase()))
  const requiredSet = new Set(requiredFields.map(f => f.toLowerCase()))
  
  const missing = requiredFields.filter(
    field => !headerSet.has(field.toLowerCase())
  )
  
  const extra = headers.filter(
    header => !requiredSet.has(header.toLowerCase())
  )
  
  return {
    valid: missing.length === 0,
    missing,
    extra,
  }
}

/**
 * Transform CSV row to property format
 */
export function transformCSVRowToProperty(row: any): any {
  // Handle boolean conversions
  const parseBoolean = (value: any): boolean => {
    if (typeof value === "boolean") return value
    if (typeof value === "string") {
      return value.toLowerCase() === "yes" || 
             value.toLowerCase() === "true" ||
             value === "1"
    }
    return false
  }
  
  // Handle array conversions
  const parseArray = (value: any): string[] => {
    if (!value) return []
    if (Array.isArray(value)) return value
    if (typeof value === "string") {
      return value.split(",").map(item => item.trim()).filter(Boolean)
    }
    return []
  }
  
  // Handle number conversions
  const parseNumber = (value: any): number | null => {
    if (value === null || value === undefined || value === "") return null
    const num = Number(value)
    return isNaN(num) ? null : num
  }
  
  return {
    name: row.name,
    originalName: row.originalName || null,
    status: row.status || "HIDDEN",
    destinationId: row.destinationId,
    
    // Numbers
    bathrooms: parseNumber(row.bathrooms),
    floorArea: parseNumber(row.floorArea),
    plotSize: parseNumber(row.plotSize),
    furnishedFloors: parseNumber(row.furnishedFloors),
    bedrooms: parseNumber(row.bedrooms),
    guestCapacity: parseNumber(row.guestCapacity),
    adultCapacity: parseNumber(row.adultCapacity),
    eventDeposit: parseNumber(row.eventDeposit),
    latitude: parseNumber(row.latitude),
    longitude: parseNumber(row.longitude),
    
    // Booleans
    conciergeService: parseBoolean(row.conciergeService),
    adjoiningHouse: parseBoolean(row.adjoiningHouse),
    exclusivity: parseBoolean(row.exclusivity),
    iconicCollection: parseBoolean(row.iconicCollection),
    onlineReservation: parseBoolean(row.onlineReservation),
    flexibleCancellation: parseBoolean(row.flexibleCancellation),
    onboardingFees: parseBoolean(row.onboardingFees),
    elevator: parseBoolean(row.elevator),
    prmSuitability: parseBoolean(row.prmSuitability),
    liveInStaff: parseBoolean(row.liveInStaff),
    suitableForEvents: parseBoolean(row.suitableForEvents),
    
    // Arrays
    categories: parseArray(row.categories),
    eventTypes: parseArray(row.eventTypes),
    
    // Strings
    licenseType: row.licenseType || null,
    licenseNumber: row.licenseNumber || null,
    operatedByAgency: row.operatedByAgency || null,
    address: row.address || null,
    postcode: row.postcode || null,
    city: row.city || null,
    additionalDetails: row.additionalDetails || null,
    houseType: row.houseType || null,
    architecturalType: row.architecturalType || null,
    position: row.position || null,
    segment: row.segment || null,
    accessibilityNotes: row.accessibilityNotes || null,
    childrenPolicy: row.childrenPolicy || null,
    childrenAccessories: row.childrenAccessories || null,
    animalsPolicy: row.animalsPolicy || null,
    heatingSystem: row.heatingSystem || null,
    heatingComments: row.heatingComments || null,
    acSystem: row.acSystem || null,
    acComments: row.acComments || null,
    eventNotes: row.eventNotes || null,
    eventRules: row.eventRules || null,
    eventLayoutLink: row.eventLayoutLink || null,
    eventTariffs: row.eventTariffs || null,
    eventDriveLink: row.eventDriveLink || null,
    transportServices: row.transportServices || null,
    staffServices: row.staffServices || null,
    mealServices: row.mealServices || null,
    goodToKnow: row.goodToKnow || null,
    listingUrl: row.listingUrl || null,
    marketingNotes: row.marketingNotes || null,
    reviews: row.reviews || null,
  }
}