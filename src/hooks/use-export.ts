import { useState } from "react"
import { toast } from "sonner"
import { saveAs } from "file-saver"

export interface ExportOptions {
  format: "csv" | "json"
  propertyIds?: string[]
}

export function useExportProperties() {
  const [isExporting, setIsExporting] = useState(false)

  const exportProperties = async (options: ExportOptions) => {
    try {
      setIsExporting(true)

      const params = new URLSearchParams({
        format: options.format,
      })

      if (options.propertyIds && options.propertyIds.length > 0) {
        params.append("ids", options.propertyIds.join(","))
      }

      const response = await fetch(`/api/export/properties?${params}`, {
        method: "GET",
      })

      if (!response.ok) {
        throw new Error("Export failed")
      }

      const contentDisposition = response.headers.get("Content-Disposition")
      const filename = contentDisposition
        ?.split("filename=")[1]
        ?.replace(/"/g, "") || `properties-export.${options.format}`

      const blob = await response.blob()
      saveAs(blob, filename)

      toast.success("Export completed successfully")
    } catch (error) {
      console.error("Export error:", error)
      toast.error("Failed to export properties")
    } finally {
      setIsExporting(false)
    }
  }

  const downloadTemplate = async () => {
    try {
      const response = await fetch("/api/export/template", {
        method: "GET",
      })

      if (!response.ok) {
        throw new Error("Template download failed")
      }

      const contentDisposition = response.headers.get("Content-Disposition")
      const filename = contentDisposition
        ?.split("filename=")[1]
        ?.replace(/"/g, "") || "property-import-template.csv"

      const blob = await response.blob()
      saveAs(blob, filename)

      toast.success("Template downloaded successfully")
    } catch (error) {
      console.error("Template download error:", error)
      toast.error("Failed to download template")
    }
  }

  return {
    exportProperties,
    downloadTemplate,
    isExporting,
  }
}