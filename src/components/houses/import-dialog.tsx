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
import { AnimatedButton } from "@/components/ui/animated-button"
import { useImportProperties } from "@/hooks/use-import"
import { ImportDropzone } from "./import-dropzone"
import { SimpleImportPreview } from "./simple-import-preview"
import { Upload, Loader2, Download, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface ImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ImportDialog({ open, onOpenChange }: ImportDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const {
    validateImport,
    importProperties,
    validationResult,
    clearValidation,
    isValidating,
    isImporting,
  } = useImportProperties()

  const handleFileSelect = async (file: File) => {
    setSelectedFile(file)
    await validateImport.mutateAsync(file)
  }

  const handleImport = async () => {
    if (!selectedFile || !validationResult) return

    const result = await importProperties.mutateAsync({
      file: selectedFile,
      mode: "both",
    })

    if (result.success) {
      onOpenChange(false)
      handleReset()
    }
  }

  const handleReset = () => {
    setSelectedFile(null)
    clearValidation()
  }

  const handleClose = () => {
    onOpenChange(false)
    handleReset()
  }


  const canImport = validationResult && (
    validationResult.validation.valid || 
    (validationResult.enhancedValidation?.summary.readyToImport ?? false) ||
    (validationResult.enhancedValidation?.fixable.canProceedWithWarnings ?? false)
  )

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Properties & Data</DialogTitle>
          <DialogDescription>
            Upload a simple CSV file to import properties, pricing, costs, and bookings all in one file.
            Destinations will be auto-created if they don't exist. Download the template below.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Template Download */}
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              asChild
            >
              <a href="/docs/simple-import-template.csv" download>
                <Download className="w-4 h-4 mr-2" />
                Download Template
              </a>
            </Button>
          </div>

          {/* File Upload Section */}
          {!selectedFile ? (
            <ImportDropzone onFileSelect={handleFileSelect} />
          ) : (
            <div className="space-y-6">
              {/* File Info */}
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <span className="font-medium">{selectedFile.name}</span>
                  {" "}({(selectedFile.size / 1024).toFixed(1)} KB)
                </AlertDescription>
              </Alert>

              {/* Validation Loading */}
              {isValidating && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Validating CSV file...
                </div>
              )}

              {/* Luxury Preview */}
              {validationResult && (
                <div className="space-y-6">
                  <SimpleImportPreview 
                    validationResult={validationResult}
                  />
                  
                  {/* Import Progress */}
                  {isImporting && (
                    <div className="flex items-center justify-center gap-2 py-4">
                      <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
                      <span className="text-sm text-emerald-700 font-medium">Importing your data...</span>
                    </div>
                  )}
                  
                  {/* Action Buttons */}
                  <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                    <Button variant="outline" onClick={handleReset}>
                      Choose Different File
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          {validationResult && (
            <AnimatedButton
              onClick={handleImport}
              disabled={!canImport || isImporting}
              className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white shadow-lg"
            >
              {isImporting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Import Data
                </>
              )}
            </AnimatedButton>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}