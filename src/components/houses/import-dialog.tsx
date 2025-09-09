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
import { useImportProperties } from "@/hooks/use-import"
import { ImportDropzone } from "./import-dropzone"
import { ImportPreview } from "./import-preview"
import { Upload, Loader2, Download, AlertCircle } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { useExportProperties } from "@/hooks/use-export"

interface ImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ImportDialog({ open, onOpenChange }: ImportDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [importMode, setImportMode] = useState<"create" | "update" | "both">("create")
  const { downloadTemplate } = useExportProperties()
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
      mode: importMode,
      mappings: validationResult.fieldMapping.mappings,
    })

    if (result.failed === 0) {
      onOpenChange(false)
      handleReset()
    }
  }

  const handleReset = () => {
    setSelectedFile(null)
    clearValidation()
    setImportMode("create")
  }

  const handleClose = () => {
    onOpenChange(false)
    handleReset()
  }

  const canImport = validationResult && validationResult.validation.valid

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Import Properties</DialogTitle>
          <DialogDescription>
            Upload a CSV file to import property data. Download the template for the correct format.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload">Upload File</TabsTrigger>
            <TabsTrigger value="preview" disabled={!validationResult}>
              Preview & Import
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-4">
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadTemplate()}
              >
                <Download className="w-4 h-4 mr-2" />
                Download Template
              </Button>
            </div>

            {!selectedFile ? (
              <ImportDropzone onFileSelect={handleFileSelect} />
            ) : (
              <div className="space-y-4">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <span className="font-medium">{selectedFile.name}</span>
                    {" "}({(selectedFile.size / 1024).toFixed(1)} KB)
                  </AlertDescription>
                </Alert>

                {isValidating && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Validating CSV file...
                    </div>
                    <Progress value={33} className="h-2" />
                  </div>
                )}

                {validationResult && (
                  <div className="space-y-4">
                    <ImportPreview validationResult={validationResult} />
                    
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={handleReset}>
                        Choose Different File
                      </Button>
                      <Button
                        onClick={() => {
                          const tabsTrigger = document.querySelector('[data-value="preview"]') as HTMLElement
                          tabsTrigger?.click()
                        }}
                        disabled={!canImport}
                      >
                        Continue to Import
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="preview" className="space-y-4">
            {validationResult && (
              <>
                {/* Import Mode */}
                <div className="space-y-3">
                  <Label>Import Mode</Label>
                  <RadioGroup value={importMode} onValueChange={(value) => setImportMode(value as any)}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="create" id="create" />
                      <Label htmlFor="create" className="cursor-pointer">
                        Create new properties only
                        <span className="text-sm text-muted-foreground block">
                          Skip properties that already exist
                        </span>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="update" id="update" />
                      <Label htmlFor="update" className="cursor-pointer">
                        Update existing properties only
                        <span className="text-sm text-muted-foreground block">
                          Skip properties that don't exist
                        </span>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="both" id="both" />
                      <Label htmlFor="both" className="cursor-pointer">
                        Create and update
                        <span className="text-sm text-muted-foreground block">
                          Create new properties and update existing ones
                        </span>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Import Summary */}
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Ready to import {validationResult.totalRows} properties in {importMode} mode.
                    {validationResult.validation.warningCount > 0 && (
                      <span className="block mt-1 text-orange-600">
                        {validationResult.validation.warningCount} warnings will be ignored during import.
                      </span>
                    )}
                  </AlertDescription>
                </Alert>

                {isImporting && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Importing properties...
                    </div>
                    <Progress value={66} className="h-2" />
                  </div>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          {validationResult && (
            <Button
              onClick={handleImport}
              disabled={!canImport || isImporting}
            >
              {isImporting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Import Properties
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}