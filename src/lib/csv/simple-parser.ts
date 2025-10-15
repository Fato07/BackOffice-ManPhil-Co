/**
 * Simple CSV Parser - KISS Approach
 * No dynamic typing, no complex transformations
 */

export interface SimpleParseResult {
  success: boolean
  data: Record<string, string>[]
  headers: string[]
  error?: string
}

/**
 * Parse CSV content with minimal processing
 * Everything stays as strings - we handle conversions later
 */
export function parseSimpleCSV(content: string): SimpleParseResult {
  try {
    const lines = content.trim().split('\n')
    
    if (lines.length < 2) {
      return {
        success: false,
        data: [],
        headers: [],
        error: "CSV must have at least 2 lines (header + data)"
      }
    }

    // Parse header - simple comma split and trim
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
    
    // Parse data rows
    const data: Record<string, string>[] = []
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue // Skip empty lines
      
      const values = parseCSVLine(line)
      
      // Create row object
      const row: Record<string, string> = {}
      headers.forEach((header, index) => {
        row[header] = values[index] || ''
      })
      
      data.push(row)
    }

    return {
      success: true,
      data,
      headers
    }
  } catch (error) {
    return {
      success: false,
      data: [],
      headers: [],
      error: error instanceof Error ? error.message : 'Unknown parsing error'
    }
  }
}

/**
 * Parse a single CSV line handling quoted values
 */
function parseCSVLine(line: string): string[] {
  const values: string[] = []
  let current = ''
  let inQuotes = false
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  
  // Add the last value
  values.push(current.trim())
  
  return values
}

/**
 * Parse CSV file with automatic delimiter detection
 */
export async function parseCSVAuto(file: File): Promise<SimpleParseResult> {
  const content = await file.text()
  return parseSimpleCSV(content)
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
 * Convert string values to appropriate types
 */
export function convertValue(value: string, type: 'string' | 'number' | 'boolean' | 'date'): unknown {
  if (!value || value.trim() === '') return null
  
  const trimmed = value.trim()
  
  switch (type) {
    case 'number':
      const num = Number(trimmed)
      return isNaN(num) ? null : num
      
    case 'boolean':
      return trimmed.toLowerCase() === 'true' || trimmed === '1'
      
    case 'date':
      const date = new Date(trimmed)
      return isNaN(date.getTime()) ? null : date
      
    default:
      return trimmed || null
  }
}