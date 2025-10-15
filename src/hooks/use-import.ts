import { useState } from "react"
import { toast } from "sonner"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { parseSimpleCSV } from "@/lib/csv/simple-parser"
import { validateCSVStructure, ValidationResult } from "@/lib/csv/enhanced-validator"

export interface ImportOptions {
  file: File
  mode: "create" | "update" | "both"
  mappings?: Record<string, string>[]
}

export interface ImportValidationResult {
  totalRows: number
  headers: string[]
  isUnifiedImport?: boolean
  entityStats?: Record<string, number>
  fieldMapping: {
    mappings: Record<string, string>[]
    suggestions: Record<string, unknown>
  }
  validation: {
    valid: boolean
    errors: unknown[]
    warnings: unknown[]
    errorCount: number
    warningCount: number
    validRows?: number
  }
  preview: unknown[]
  availableDestinations: unknown[]
  // Enhanced validation results
  enhancedValidation?: ValidationResult
  parsedData?: Record<string, string>[]
}

export interface ImportResult {
  success: boolean
  imported: {
    properties: number
    pricing: number
    costs: number
    bookings: number
    availabilityRequests: number
  }
  errors: string[]
  debug?: {
    totalRows: number
    rowsWithAvailabilityRequests: any[]
    availabilityRequestAttempts: any[]
    csvHeaders: string[]
    availabilityRequestColumns: Record<string, boolean>
  }
}

export function useImportProperties() {
  const queryClient = useQueryClient()
  const [validationResult, setValidationResult] = useState<ImportValidationResult | null>(null)

  const validateImport = useMutation({
    mutationFn: async (file: File) => {
      // Parse CSV with enhanced validation
      const content = await file.text()
      
      // Basic validation - check if file has content
      if (!content.trim()) {
        throw new Error("File is empty")
      }
      
      // Parse CSV using simple parser
      const parseResult = parseSimpleCSV(content)
      
      if (!parseResult.success) {
        throw new Error(parseResult.error || "Failed to parse CSV file")
      }

      // Check minimum requirements
      if (parseResult.data.length === 0) {
        throw new Error("CSV must have at least one data row")
      }
      
      if (!parseResult.headers.includes('propertyName')) {
        throw new Error("CSV must include 'propertyName' column")
      }

      // Run enhanced validation
      const enhancedValidation = validateCSVStructure(parseResult.headers, parseResult.data)
      
      // Convert enhanced validation to legacy format
      const legacyValidation = {
        valid: enhancedValidation.summary.readyToImport,
        errors: [
          ...enhancedValidation.structure.headerIssues.map(issue => ({
            type: 'header',
            message: `Header issue: ${issue.type} - ${issue.column}`,
            suggestion: issue.suggestion
          })),
          ...enhancedValidation.data.typeValidation
            .filter(v => v.severity === 'error')
            .map(v => ({
              type: 'data',
              row: v.row,
              column: v.column,
              message: v.issue,
              value: v.value
            }))
        ],
        warnings: [
          ...enhancedValidation.data.typeValidation
            .filter(v => v.severity === 'warning')
            .map(v => ({
              type: 'data',
              row: v.row,
              column: v.column,
              message: v.issue,
              value: v.value
            })),
          ...enhancedValidation.data.businessRules.map(violation => ({
            type: 'business_rule',
            row: violation.row,
            field: violation.field,
            message: violation.message
          }))
        ],
        errorCount: enhancedValidation.summary.errorCount,
        warningCount: enhancedValidation.summary.warningCount,
        validRows: enhancedValidation.data.validRows,
      }

      // Generate preview data (first 5 rows)
      const preview = parseResult.data.slice(0, 5).map((row, index) => ({
        row: index + 2,
        data: row,
        valid: !enhancedValidation.data.typeValidation.some(v => v.row === index + 2 && v.severity === 'error')
      }))

      return {
        totalRows: parseResult.data.length,
        headers: parseResult.headers,
        isUnifiedImport: true,
        fieldMapping: {
          mappings: [],
          suggestions: {},
        },
        validation: legacyValidation,
        preview,
        availableDestinations: [],
        enhancedValidation,
        parsedData: parseResult.data,
      } as ImportValidationResult
    },
    onSuccess: (data) => {
      setValidationResult(data)
      
      // Show appropriate toast based on validation results
      if (data.enhancedValidation?.summary.readyToImport) {
        const confidence = Math.round((data.enhancedValidation.summary.confidence || 0) * 100)
        toast.success(`CSV validated - ${data.totalRows} rows ready to import (${confidence}% confidence)`)
      } else if (data.enhancedValidation?.fixable.canProceedWithWarnings) {
        toast.warning(`CSV has ${data.validation.warningCount} warnings but can proceed`)
      } else {
        toast.error(`CSV has ${data.validation.errorCount} critical errors that must be fixed`)
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to validate CSV file")
    },
  })

  const importProperties = useMutation({
    mutationFn: async (options: ImportOptions) => {
      const formData = new FormData()
      formData.append("file", options.file)

      const response = await fetch("/api/import/simple", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Import failed")
      }

      return response.json() as Promise<ImportResult>
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["properties"] })
      queryClient.invalidateQueries({ queryKey: ["pricing"] })
      queryClient.invalidateQueries({ queryKey: ["bookings"] })
      queryClient.invalidateQueries({ queryKey: ["operational-costs"] })
      queryClient.invalidateQueries({ queryKey: ["availability-requests"] })
      
      if (data.success) {
        const messages: string[] = []
        const { imported } = data
        
        if (imported.properties > 0) messages.push(`${imported.properties} properties`)
        if (imported.pricing > 0) messages.push(`${imported.pricing} pricing periods`)
        if (imported.costs > 0) messages.push(`${imported.costs} costs`)
        if (imported.bookings > 0) messages.push(`${imported.bookings} bookings`)
        if (imported.availabilityRequests > 0) messages.push(`${imported.availabilityRequests} availability requests`)
        
        if (data.errors.length > 0) messages.push(`${data.errors.length} errors`)
        
        const message = messages.length > 0 ? `Imported: ${messages.join(", ")}` : "Import completed"
        
        // Debug logging for development
        if (data.debug && process.env.NODE_ENV === 'development') {
          console.log('Import Debug Info:', {
            totalRows: data.debug.totalRows,
            availabilityRequestRows: data.debug.rowsWithAvailabilityRequests.length,
            csvHeaders: data.debug.csvHeaders,
            availabilityRequestColumns: data.debug.availabilityRequestColumns,
            attemptDetails: data.debug.availabilityRequestAttempts
          })
        }
        
        if (data.errors.length === 0) {
          toast.success(message)
        } else {
          toast.warning(message)
        }
      } else {
        toast.error(`Import failed: ${data.errors.join(", ")}`)
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to import properties")
    },
  })

  const clearValidation = () => {
    setValidationResult(null)
  }

  return {
    validateImport,
    importProperties,
    validationResult,
    clearValidation,
    isValidating: validateImport.isPending,
    isImporting: importProperties.isPending,
  }
}