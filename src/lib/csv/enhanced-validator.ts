/**
 * Enhanced CSV Validator - Comprehensive validation for CSV imports
 * Detects structure issues, data alignment problems, and formatting inconsistencies
 */

export interface HeaderIssue {
  type: 'missing' | 'typo' | 'extra' | 'case'
  column: string
  suggestion?: string
  position?: number
}

export interface FieldValidation {
  row: number
  column: string
  issue: string
  value: string
  severity: 'error' | 'warning'
  suggestion?: string
}

export interface BusinessRuleViolation {
  row: number
  field: string
  message: string
  value: unknown
  relatedFields?: Record<string, unknown>
}

export interface DuplicateIssue {
  rows: number[]
  field: string
  value: string
}

export interface AutoFix {
  type: 'add_commas' | 'fix_header' | 'convert_type' | 'remove_quotes'
  description: string
  rows?: number[]
  columns?: string[]
  action: () => void
}

export interface ManualFix {
  type: 'column_mapping' | 'data_cleanup' | 'business_rule'
  description: string
  rows: number[]
  severity: 'critical' | 'warning'
}

export interface ValidationResult {
  structure: {
    valid: boolean
    expectedColumns: number
    columnCount: { expected: number; actual: number[] }
    headerIssues: HeaderIssue[]
    misalignedRows: number[]
    consistencyScore: number // 0-1 score for overall CSV consistency
  }
  data: {
    typeValidation: FieldValidation[]
    businessRules: BusinessRuleViolation[]
    duplicates: DuplicateIssue[]
    validRows: number
    totalRows: number
  }
  fixable: {
    autoFixable: AutoFix[]
    manualFixRequired: ManualFix[]
    canProceedWithWarnings: boolean
    criticalIssues: number
  }
  summary: {
    overallValid: boolean
    errorCount: number
    warningCount: number
    readyToImport: boolean
    confidence: number // 0-1 confidence in data quality
  }
}

/**
 * Simple validation - only check for essential header
 */
export const EXPECTED_HEADERS = ['propertyName'] as const

export const REQUIRED_HEADERS = ['propertyName'] as const

// Simple patterns for detecting obvious column misalignment
export const MISALIGNMENT_PATTERNS = {
  date: /^\d{4}-\d{2}-\d{2}$/,
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
} as const

/**
 * Validate CSV structure and detect common issues
 */
export function validateCSVStructure(
  headers: string[],
  rows: Record<string, string>[]
): ValidationResult {
  const result: ValidationResult = {
    structure: {
      valid: true,
      expectedColumns: headers.length,
      columnCount: { expected: headers.length, actual: [] },
      headerIssues: [],
      misalignedRows: [],
      consistencyScore: 1
    },
    data: {
      typeValidation: [],
      businessRules: [],
      duplicates: [],
      validRows: 0,
      totalRows: rows.length
    },
    fixable: {
      autoFixable: [],
      manualFixRequired: [],
      canProceedWithWarnings: true,
      criticalIssues: 0
    },
    summary: {
      overallValid: true,
      errorCount: 0,
      warningCount: 0,
      readyToImport: true,
      confidence: 1
    }
  }

  // 1. Validate headers
  const headerValidation = validateHeaders(headers)
  result.structure.headerIssues = headerValidation.issues
  
  // 2. Validate column consistency - use actual header count, not expected
  const columnValidation = validateColumnConsistency(rows, headers.length)
  result.structure.columnCount = columnValidation.columnCount
  result.structure.misalignedRows = columnValidation.misalignedRows
  result.structure.consistencyScore = columnValidation.consistencyScore

  // 3. Simple misalignment detection only
  const misalignmentIssues = detectColumnMisalignment(rows)
  result.data.typeValidation = misalignmentIssues
  result.data.validRows = rows.length - Math.floor(misalignmentIssues.length / 3) // Rough estimate

  // 4. Skip business rules - keep it simple
  result.data.businessRules = []
  result.data.duplicates = []

  // 5. Skip complex fix suggestions
  result.fixable = {
    autoFixable: [],
    manualFixRequired: [],
    criticalIssues: misalignmentIssues.filter(issue => issue.severity === 'error').length,
    canProceedWithWarnings: misalignmentIssues.every(issue => issue.severity === 'warning')
  }

  // 6. Calculate summary
  result.summary = calculateSummary(result)
  result.structure.valid = result.summary.readyToImport

  return result
}

/**
 * Validate CSV headers against expected structure
 */
function validateHeaders(headers: string[]): { issues: HeaderIssue[] } {
  const issues: HeaderIssue[] = []
  const normalizedHeaders = headers.map(h => h.toLowerCase().trim())

  // Only check for required propertyName header
  if (!normalizedHeaders.includes('propertyname')) {
    issues.push({
      type: 'missing',
      column: 'propertyName'
    })
  }

  return { issues }
}

/**
 * Validate column count consistency across rows
 */
function validateColumnConsistency(
  rows: Record<string, string>[],
  expectedColumns: number
): {
  columnCount: { expected: number; actual: number[] }
  misalignedRows: number[]
  consistencyScore: number
} {
  const actualCounts = rows.map(row => Object.keys(row).length)
  const misalignedRows: number[] = []
  
  actualCounts.forEach((count, index) => {
    if (count !== expectedColumns) {
      misalignedRows.push(index + 2) // +2 for header row and 0-based index
    }
  })

  const consistentRows = actualCounts.filter(count => count === expectedColumns).length
  const consistencyScore = rows.length > 0 ? consistentRows / rows.length : 1

  return {
    columnCount: { expected: expectedColumns, actual: actualCounts },
    misalignedRows,
    consistencyScore
  }
}

/**
 * Simple detection of column misalignment issues (KISS approach)
 */
function detectColumnMisalignment(rows: Record<string, string>[]): FieldValidation[] {
  const issues: FieldValidation[] = []
  
  // Check for obvious misalignment patterns
  const nameFields = ['propertyName', 'guestName', 'requestGuestName']
  const dateFields = ['priceStartDate', 'priceEndDate', 'bookingStartDate', 'bookingEndDate', 'requestStartDate', 'requestEndDate']

  rows.forEach((row, rowIndex) => {
    const rowNumber = rowIndex + 2

    Object.entries(row).forEach(([column, value]) => {
      if (!value) return

      // Date in name field suggests misalignment - make it a warning only
      if (nameFields.includes(column) && MISALIGNMENT_PATTERNS.date.test(value)) {
        issues.push({
          row: rowNumber,
          column,
          issue: 'Date value found in name field - possible column misalignment',
          value,
          severity: 'warning',
          suggestion: 'Check if data is shifted to wrong columns'
        })
      }

      // Email in name field suggests misalignment  
      if (nameFields.includes(column) && MISALIGNMENT_PATTERNS.email.test(value)) {
        issues.push({
          row: rowNumber,
          column,
          issue: 'Email address found in name field - possible column misalignment',
          value,
          severity: 'warning',
          suggestion: 'Verify data is in correct column'
        })
      }
    })
  })

  return issues
}

/**
 * Legacy function - now simplified
 */
function validateDataTypes(
  rows: Record<string, string>[],
  headers: string[]
): {
  fieldValidation: FieldValidation[]
  validRows: number
} {
  // Now just delegate to simple misalignment detection
  const fieldValidation = detectColumnMisalignment(rows)
  const validRows = rows.length - Math.floor(fieldValidation.length / 3)
  
  return { fieldValidation, validRows }
}

/**
 * Calculate simple validation summary (KISS approach)
 */
function calculateSummary(result: ValidationResult): {
  overallValid: boolean
  errorCount: number
  warningCount: number
  readyToImport: boolean
  confidence: number
} {
  const errorCount = result.fixable.criticalIssues
  const warningCount = result.data.typeValidation.filter(v => v.severity === 'warning').length
  
  // Simple logic: ready if no critical errors
  const readyToImport = errorCount === 0
  
  // Simple confidence: high if no errors, medium if warnings only
  const confidence = errorCount === 0 ? (warningCount === 0 ? 1.0 : 0.8) : 0.3

  return {
    overallValid: readyToImport,
    errorCount,
    warningCount,
    readyToImport,
    confidence
  }
}

/**
 * Detect common column alignment patterns
 */
function detectCommonColumnIssue(
  actualCounts: number[],
  expectedCount: number
): { missingColumns: number; fixable: boolean } | null {
  if (actualCounts.length === 0) return null

  const differences = actualCounts.map(count => expectedCount - count)
  const commonDifference = mode(differences)

  // If most rows are missing the same number of columns, it's likely fixable
  const sameIssueCount = differences.filter(diff => diff === commonDifference).length
  const fixable = sameIssueCount >= actualCounts.length * 0.8 && commonDifference > 0

  return {
    missingColumns: commonDifference,
    fixable
  }
}

/**
 * Helper functions
 */
function findClosestMatch(target: string, options: string[]): string | undefined {
  let bestMatch = undefined
  let bestDistance = Infinity

  for (const option of options) {
    const distance = levenshteinDistance(target, option)
    if (distance < bestDistance && distance <= 3) {
      bestDistance = distance
      bestMatch = option
    }
  }

  return bestMatch
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null))

  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j

  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + indicator
      )
    }
  }

  return matrix[str2.length][str1.length]
}

function mode(arr: number[]): number {
  const frequency: Record<number, number> = {}
  let maxFreq = 0
  let modeValue = arr[0]

  for (const num of arr) {
    frequency[num] = (frequency[num] || 0) + 1
    if (frequency[num] > maxFreq) {
      maxFreq = frequency[num]
      modeValue = num
    }
  }

  return modeValue
}