import { useState } from "react"
import { toast } from "sonner"
import { saveAs } from "file-saver"

export interface ExportOptions {
  format: "csv" | "json"
  requestIds?: string[]
}

export function useExportEquipmentRequests() {
  const [isExporting, setIsExporting] = useState(false)

  const exportEquipmentRequests = async (options: ExportOptions) => {
    try {
      setIsExporting(true)

      const params = new URLSearchParams({
        format: options.format,
      })

      if (options.requestIds && options.requestIds.length > 0) {
        params.append("ids", options.requestIds.join(","))
      }

      const response = await fetch(`/api/export/equipment-requests?${params}`, {
        method: "GET",
      })

      if (!response.ok) {
        throw new Error("Export failed")
      }

      const contentDisposition = response.headers.get("Content-Disposition")
      const filename = contentDisposition
        ?.split("filename=")[1]
        ?.replace(/"/g, "") || `equipment-requests-export.${options.format}`

      const blob = await response.blob()
      saveAs(blob, filename)

      toast.success("Export completed successfully")
    } catch (error) {
      
      toast.error("Failed to export equipment requests")
    } finally {
      setIsExporting(false)
    }
  }

  return {
    exportEquipmentRequests,
    isExporting,
  }
}