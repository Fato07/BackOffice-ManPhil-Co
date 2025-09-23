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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Download } from "lucide-react"
import { useExportLegalDocuments } from "@/hooks/use-legal-documents"

interface ExportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  filters?: Record<string, unknown>
}

export function ExportDialog({
  open,
  onOpenChange,
  filters,
}: ExportDialogProps) {
  const [format, setFormat] = useState<'csv' | 'json' | 'xlsx'>('csv')
  const [scope, setScope] = useState<'filtered' | 'all'>('filtered')
  
  const { mutate: exportDocuments, isPending } = useExportLegalDocuments()

  const handleExport = () => {
    exportDocuments({
      format,
      filters: scope === 'filtered' ? filters : undefined,
    }, {
      onSuccess: () => {
        onOpenChange(false)
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Export Legal Documents</DialogTitle>
          <DialogDescription>
            Choose how you want to export your legal documents data.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Export scope */}
          <div className="space-y-3">
            <Label>Export Scope</Label>
            <RadioGroup value={scope} onValueChange={(v) => setScope(v as 'filtered' | 'all')}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="filtered" id="filtered" />
                <Label htmlFor="filtered" className="font-normal cursor-pointer">
                  Export filtered results only
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="all" id="all" />
                <Label htmlFor="all" className="font-normal cursor-pointer">
                  Export all documents
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Export format */}
          <div className="space-y-2">
            <Label htmlFor="format">Export Format</Label>
            <Select value={format} onValueChange={(v) => setFormat(v as 'csv' | 'json' | 'xlsx')}>
              <SelectTrigger id="format">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">CSV (.csv)</SelectItem>
                <SelectItem value="json">JSON (.json)</SelectItem>
                <SelectItem value="xlsx" disabled>
                  Excel (.xlsx) - Coming soon
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={isPending}>
            {isPending ? (
              <>
                <Download className="mr-2 h-4 w-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Export
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}