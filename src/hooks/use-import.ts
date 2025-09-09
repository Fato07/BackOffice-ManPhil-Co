import { useState } from "react"
import { toast } from "sonner"
import { useMutation, useQueryClient } from "@tanstack/react-query"

export interface ImportOptions {
  file: File
  mode: "create" | "update" | "both"
  mappings?: any[]
}

export interface ImportValidationResult {
  totalRows: number
  headers: string[]
  fieldMapping: {
    mappings: any[]
    suggestions: any
  }
  validation: {
    valid: boolean
    errors: any[]
    warnings: any[]
    errorCount: number
    warningCount: number
  }
  preview: any[]
  availableDestinations: any[]
}

export interface ImportResult {
  success: boolean
  imported: number
  updated: number
  failed: number
  errors: any[]
  warnings: any[]
}

export function useImportProperties() {
  const queryClient = useQueryClient()
  const [validationResult, setValidationResult] = useState<ImportValidationResult | null>(null)

  const validateImport = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/import/validate", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Validation failed")
      }

      return response.json() as Promise<ImportValidationResult>
    },
    onSuccess: (data) => {
      setValidationResult(data)
      if (data.validation.errorCount > 0) {
        toast.error(`Found ${data.validation.errorCount} errors in the CSV file`)
      } else if (data.validation.warningCount > 0) {
        toast.warning(`Found ${data.validation.warningCount} warnings in the CSV file`)
      } else {
        toast.success("CSV file validated successfully")
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
      formData.append("mode", options.mode)
      
      if (options.mappings) {
        formData.append("mappings", JSON.stringify(options.mappings))
      }

      const response = await fetch("/api/import/properties", {
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
      
      if (data.success) {
        const messages = []
        if (data.imported > 0) messages.push(`${data.imported} properties imported`)
        if (data.updated > 0) messages.push(`${data.updated} properties updated`)
        if (data.failed > 0) messages.push(`${data.failed} failed`)
        
        const message = messages.join(", ")
        
        if (data.failed === 0) {
          toast.success(message)
        } else {
          toast.warning(message)
        }
      } else {
        toast.error("Import failed")
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