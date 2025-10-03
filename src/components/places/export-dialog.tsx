"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { useExportProviders } from "@/hooks/use-activity-providers"
import { ActivityProviderFilters, ExportActivityProvidersInput } from "@/types/activity-provider"
import { Download } from "lucide-react"

interface ExportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedIds: string[]
  filters: ActivityProviderFilters
}

const EXPORT_FIELDS = [
  { key: "name", label: "Name" },
  { key: "category", label: "Category" },
  { key: "description", label: "Description" },
  { key: "address", label: "Address" },
  { key: "city", label: "City" },
  { key: "country", label: "Country" },
  { key: "phone", label: "Phone" },
  { key: "email", label: "Email" },
  { key: "website", label: "Website" },
  { key: "tags", label: "Tags" },
  { key: "rating", label: "Rating" },
  { key: "createdAt", label: "Created Date" },
  { key: "updatedAt", label: "Updated Date" },
] as const

export function ExportDialog({ open, onOpenChange, selectedIds, filters }: ExportDialogProps) {
  const [format, setFormat] = useState<"csv" | "json">("csv")
  const [selectedFields, setSelectedFields] = useState<string[]>([
    "name", "category", "city", "country", "phone", "email", "website"
  ])
  const [exportType, setExportType] = useState<"all" | "filtered" | "selected">(
    selectedIds.length > 0 ? "selected" : "filtered"
  )
  
  const exportProviders = useExportProviders()

  const handleFieldToggle = (fieldKey: string, checked: boolean) => {
    if (checked) {
      setSelectedFields(prev => [...prev, fieldKey])
    } else {
      setSelectedFields(prev => prev.filter(f => f !== fieldKey))
    }
  }

  const handleExport = async () => {
    try {
      const exportData: ExportActivityProvidersInput = {
        format,
        fields: selectedFields as any,
      }

      // Apply filters based on export type
      if (exportType === "filtered") {
        exportData.filters = filters
      } else if (exportType === "selected") {
        exportData.filters = { 
          // Create a filter that only includes selected IDs
          search: `id:${selectedIds.join(',')}` 
        }
      }
      // For "all", we don't add any filters

      await exportProviders.mutateAsync(exportData)
      onOpenChange(false)
    } catch (error) {
      // Error handled by mutation
    }
  }

  const getExportCount = () => {
    if (exportType === "selected") return selectedIds.length
    if (exportType === "filtered") return "filtered"
    return "all"
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Activity Providers
          </DialogTitle>
          <DialogDescription>
            Export activity provider data in your preferred format.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-3">
            <Label className="text-base font-medium">What to export</Label>
            <RadioGroup value={exportType} onValueChange={setExportType as any}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="all" id="all" />
                <Label htmlFor="all">All providers</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="filtered" id="filtered" />
                <Label htmlFor="filtered">Current filtered results</Label>
              </div>
              {selectedIds.length > 0 && (
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="selected" id="selected" />
                  <Label htmlFor="selected">
                    Selected providers ({selectedIds.length})
                  </Label>
                </div>
              )}
            </RadioGroup>
          </div>

          <div className="space-y-3">
            <Label className="text-base font-medium">Format</Label>
            <RadioGroup value={format} onValueChange={setFormat as any}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="csv" id="csv" />
                <Label htmlFor="csv">CSV (Excel compatible)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="json" id="json" />
                <Label htmlFor="json">JSON</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Fields to include</Label>
              <div className="space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedFields(EXPORT_FIELDS.map(f => f.key))}
                >
                  Select All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedFields([])}
                >
                  Clear All
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
              {EXPORT_FIELDS.map((field) => (
                <div key={field.key} className="flex items-center space-x-2">
                  <Checkbox
                    id={field.key}
                    checked={selectedFields.includes(field.key)}
                    onCheckedChange={(checked) => handleFieldToggle(field.key, !!checked)}
                  />
                  <Label htmlFor={field.key} className="text-sm">
                    {field.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            disabled={exportProviders.isPending || selectedFields.length === 0}
          >
            {exportProviders.isPending 
              ? "Exporting..." 
              : `Export ${getExportCount()} provider${getExportCount() !== 1 ? 's' : ''}`
            }
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}