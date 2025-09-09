"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { useExportProperties } from "@/hooks/use-export"
import { Download, FileJson, FileSpreadsheet, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

interface ExportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedPropertyIds?: string[]
  totalProperties: number
  filteredCount?: number
}

export function ExportDialog({
  open,
  onOpenChange,
  selectedPropertyIds = [],
  totalProperties,
  filteredCount,
}: ExportDialogProps) {
  const [exportFormat, setExportFormat] = useState<"csv" | "json">("csv")
  const [exportScope, setExportScope] = useState<"all" | "filtered" | "selected">(
    selectedPropertyIds.length > 0 ? "selected" : "all"
  )
  const { exportProperties, downloadTemplate, isExporting } = useExportProperties()

  const handleExport = async () => {
    let propertyIds: string[] | undefined

    if (exportScope === "selected" && selectedPropertyIds.length > 0) {
      propertyIds = selectedPropertyIds
    }

    await exportProperties({
      format: exportFormat,
      propertyIds,
    })

    onOpenChange(false)
  }

  const getExportCount = () => {
    switch (exportScope) {
      case "selected":
        return selectedPropertyIds.length
      case "filtered":
        return filteredCount || 0
      default:
        return totalProperties
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Export Properties</DialogTitle>
          <DialogDescription>
            Choose export format and scope for your property data
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Export Format */}
          <div className="space-y-3">
            <Label>Export Format</Label>
            <RadioGroup value={exportFormat} onValueChange={(value) => setExportFormat(value as any)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="csv" id="csv" />
                <Label htmlFor="csv" className="flex items-center cursor-pointer">
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  CSV File
                  <span className="text-sm text-muted-foreground ml-2">
                    (Excel compatible)
                  </span>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="json" id="json" />
                <Label htmlFor="json" className="flex items-center cursor-pointer">
                  <FileJson className="w-4 h-4 mr-2" />
                  JSON File
                  <span className="text-sm text-muted-foreground ml-2">
                    (Full data structure)
                  </span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          <Separator />

          {/* Export Scope */}
          <div className="space-y-3">
            <Label>Export Scope</Label>
            <RadioGroup value={exportScope} onValueChange={(value) => setExportScope(value as any)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="all" id="all" />
                <Label htmlFor="all" className="flex items-center cursor-pointer">
                  All Properties
                  <Badge variant="secondary" className="ml-2">
                    {totalProperties} properties
                  </Badge>
                </Label>
              </div>
              
              {filteredCount !== undefined && filteredCount !== totalProperties && (
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="filtered" id="filtered" />
                  <Label htmlFor="filtered" className="flex items-center cursor-pointer">
                    Filtered Properties
                    <Badge variant="secondary" className="ml-2">
                      {filteredCount} properties
                    </Badge>
                  </Label>
                </div>
              )}
              
              {selectedPropertyIds.length > 0 && (
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="selected" id="selected" />
                  <Label htmlFor="selected" className="flex items-center cursor-pointer">
                    Selected Properties
                    <Badge variant="secondary" className="ml-2">
                      {selectedPropertyIds.length} properties
                    </Badge>
                  </Label>
                </div>
              )}
            </RadioGroup>
          </div>

          {/* Export Summary */}
          <div className="rounded-lg bg-muted px-4 py-3">
            <p className="text-sm text-muted-foreground">
              Export will include <span className="font-medium text-foreground">{getExportCount()}</span> properties
              in <span className="font-medium text-foreground">{exportFormat.toUpperCase()}</span> format
            </p>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => downloadTemplate()}
            className="sm:mr-auto"
          >
            <Download className="w-4 h-4 mr-2" />
            Download Template
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={isExporting}>
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Export
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}