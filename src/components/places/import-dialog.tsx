"use client"

import { useState, useRef } from "react"
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
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { useImportProviders } from "@/hooks/use-activity-providers"
import { BulkImportActivityProvidersInput, CreateActivityProviderInput } from "@/types/activity-provider"
import { Upload, FileText, AlertCircle, CheckCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface ImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ImportDialog({ open, onOpenChange }: ImportDialogProps) {
  const [file, setFile] = useState<File | null>(null)
  const [skipDuplicates, setSkipDuplicates] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingProgress, setProcessingProgress] = useState(0)
  const [importResult, setImportResult] = useState<any>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const importProviders = useImportProviders()

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setImportResult(null)
    }
  }

  const parseCSV = (csvText: string): CreateActivityProviderInput[] => {
    const lines = csvText.split('\n').filter(line => line.trim())
    if (lines.length < 2) return []

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
    const providers: CreateActivityProviderInput[] = []

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''))
      const provider: any = {}

      headers.forEach((header, index) => {
        const value = values[index]
        if (value && value !== '') {
          // Map CSV headers to provider fields
          switch (header.toLowerCase()) {
            case 'name':
              provider.name = value
              break
            case 'category':
              provider.category = value
              break
            case 'description':
              provider.description = value
              break
            case 'address':
              provider.address = value
              break
            case 'city':
              provider.city = value
              break
            case 'country':
              provider.country = value
              break
            case 'phone':
              provider.phone = value
              break
            case 'email':
              provider.email = value
              break
            case 'website':
              provider.website = value
              break
            case 'tags':
              provider.tags = value.split(';').map(tag => tag.trim()).filter(Boolean)
              break
            case 'rating':
              const rating = parseFloat(value)
              if (!isNaN(rating)) provider.rating = rating
              break
          }
        }
      })

      if (provider.name && provider.category) {
        providers.push(provider)
      }
    }

    return providers
  }

  const handleImport = async () => {
    if (!file) return

    setIsProcessing(true)
    setProcessingProgress(10)

    try {
      const fileText = await file.text()
      setProcessingProgress(30)

      let providers: CreateActivityProviderInput[] = []

      if (file.name.endsWith('.csv')) {
        providers = parseCSV(fileText)
      } else if (file.name.endsWith('.json')) {
        const jsonData = JSON.parse(fileText)
        providers = Array.isArray(jsonData) ? jsonData : [jsonData]
      }

      setProcessingProgress(60)

      if (providers.length === 0) {
        throw new Error('No valid provider data found in file')
      }

      const importData: BulkImportActivityProvidersInput = {
        providers,
        skipDuplicates,
      }

      setProcessingProgress(80)
      const result = await importProviders.mutateAsync(importData)
      setProcessingProgress(100)
      setImportResult(result)

    } catch (error) {
      
      setImportResult({
        success: false,
        error: error instanceof Error ? error.message : 'Import failed'
      })
    } finally {
      setIsProcessing(false)
      setProcessingProgress(0)
    }
  }

  const resetDialog = () => {
    setFile(null)
    setImportResult(null)
    setIsProcessing(false)
    setProcessingProgress(0)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleClose = () => {
    resetDialog()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Import Activity Providers
          </DialogTitle>
          <DialogDescription>
            Upload a CSV or JSON file to import multiple activity providers.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {!importResult && (
            <>
              <div className="space-y-3">
                <Label>Select File</Label>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="gap-2"
                  >
                    <FileText className="h-4 w-4" />
                    Choose File
                  </Button>
                  {file && (
                    <span className="text-sm text-muted-foreground">
                      {file.name}
                    </span>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.json"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <p className="text-xs text-muted-foreground">
                  Supported formats: CSV, JSON. Maximum file size: 10MB.
                </p>
              </div>

              <div className="space-y-3">
                <Label>Import Options</Label>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="skip-duplicates"
                    checked={skipDuplicates}
                    onCheckedChange={(checked) => setSkipDuplicates(checked as boolean)}
                  />
                  <Label htmlFor="skip-duplicates" className="text-sm">
                    Skip duplicate providers (based on name and category)
                  </Label>
                </div>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  For CSV files, use headers: name, category, description, address, city, country, 
                  phone, email, website, tags (semicolon-separated), rating
                </AlertDescription>
              </Alert>

              {isProcessing && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Processing...</Label>
                    <span className="text-sm text-muted-foreground">{processingProgress}%</span>
                  </div>
                  <Progress value={processingProgress} />
                </div>
              )}
            </>
          )}

          {importResult && (
            <div className="space-y-3">
              {importResult.success ? (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Import completed successfully!
                    {importResult.data && (
                      <div className="mt-2 text-sm">
                        <div>• Imported: {importResult.data.imported} providers</div>
                        {importResult.data.skipped > 0 && (
                          <div>• Skipped: {importResult.data.skipped} duplicates</div>
                        )}
                        {importResult.data.errors?.length > 0 && (
                          <div>• Errors: {importResult.data.errors.length} providers failed</div>
                        )}
                      </div>
                    )}
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Import failed: {importResult.error}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          {importResult ? (
            <Button onClick={handleClose}>Close</Button>
          ) : (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={handleImport}
                disabled={!file || isProcessing}
              >
                {isProcessing ? "Processing..." : "Import"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}