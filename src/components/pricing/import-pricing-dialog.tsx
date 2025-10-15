"use client"

import { useState, useRef } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, XCircle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormDescription,
} from "@/components/ui/form"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ScrollArea } from "@/components/ui/scroll-area"
import { importPriceRangesSchema, type ImportPriceRangesData, type PriceRangeImportData } from "@/lib/validations/pricing"
import { useImportPriceRanges } from "@/hooks/use-pricing-import"
import { toast } from "sonner"

interface ImportPricingDialogProps {
  children?: React.ReactNode
}

interface ImportResult {
  success: number
  failed: number
  skipped: number
  errors: string[]
}

// CSV Template headers for price ranges
const CSV_TEMPLATE = [
  "Property ID*",
  "Period Name*", 
  "Start Date*",
  "End Date*",
  "Owner Nightly Rate*",
  "Owner Weekly Rate",
  "Commission Rate (%)",
  "Validated (true/false)",
  "Notes"
].join(",")

export function ImportPricingDialog({ children }: ImportPricingDialogProps) {
  const [open, setOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [previewData, setPreviewData] = useState<PriceRangeImportData[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Use the real import hook
  const importPriceRangesMutation = useImportPriceRanges()

  const form = useForm({
    resolver: zodResolver(importPriceRangesSchema),
    defaultValues: {
      priceRanges: [],
      skipConflicts: true,
      updateExisting: false,
    },
  })

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    // Validate file type
    const validTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
    if (!validTypes.includes(selectedFile.type)) {
      toast.error("Please upload a CSV or Excel file")
      return
    }

    setFile(selectedFile)
    
    // Parse file for preview
    try {
      const parsed = await parseFile(selectedFile)
      setPreviewData(parsed.slice(0, 5)) // Show first 5 rows
      form.setValue("priceRanges", parsed)
    } catch {
      toast.error("Failed to parse file. Please check the format.")
      setFile(null)
    }
  }

  const parseFile = async (file: File): Promise<PriceRangeImportData[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string
          const lines = text.split('\n')
          // Skip headers for now - could be used for field mapping in future
          lines[0].split(',').map(h => h.trim())
          
          const priceRanges: PriceRangeImportData[] = []
          
          for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim()
            if (!line) continue
            
            const values = line.split(',').map(v => v.trim().replace(/^"(.*)"$/, '$1'))
            
            const priceRange: PriceRangeImportData = {
              propertyId: values[0] || '',
              periodName: values[1] || '',
              startDate: new Date(values[2] || ''),
              endDate: new Date(values[3] || ''),
              ownerNightlyRate: parseFloat(values[4]) || 0,
              ownerWeeklyRate: values[5] ? parseFloat(values[5]) : undefined,
              commissionRate: values[6] ? parseFloat(values[6]) : 25,
              isValidated: values[7] ? values[7].toLowerCase() === 'true' : false,
              notes: values[8] || undefined,
            }
            
            priceRanges.push(priceRange)
          }
          
          resolve(priceRanges)
        } catch (_error) {
          reject(_error)
        }
      }
      
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsText(file)
    })
  }

  const onSubmit = async (data: ImportPriceRangesData) => {
    try {
      const result = await importPriceRangesMutation.mutateAsync(data)
      
      // Transform the server result to match our UI format
      const importResult: ImportResult = {
        success: result?.imported || 0,
        failed: result?.errors.length || 0,
        skipped: result?.skipped || 0,
        errors: result?.errors.map(error => `Row ${error.row}: ${error.error}`) || []
      }
      
      setImportResult(importResult)
    } catch (_error) {
      // Error handling is already done by the hook
      console.error("Import failed:", _error)
    }
  }

  const downloadTemplate = () => {
    const sampleData = [
      "prop_123,Summer 2024,2024-06-01,2024-08-31,350,2100,25,false,Peak season rates",
      "prop_123,Winter 2024,2024-12-15,2025-01-15,450,2700,25,false,Holiday premium"
    ]
    
    const csvContent = [CSV_TEMPLATE, ...sampleData].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'price-ranges-import-template.csv'
    a.click()
    window.URL.revokeObjectURL(url)
    toast.success("Template downloaded")
  }

  const resetImport = () => {
    setFile(null)
    setImportResult(null)
    setPreviewData([])
    form.reset()
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      setOpen(newOpen)
      if (!newOpen) resetImport()
    }}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline">
            <Upload className="mr-2 h-4 w-4" />
            Import Pricing
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Price Ranges</DialogTitle>
          <DialogDescription>
            Upload a CSV file to import multiple price ranges and pricing periods at once.
          </DialogDescription>
        </DialogHeader>

        {!importResult ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <FormLabel>Upload File</FormLabel>
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    onClick={downloadTemplate}
                  >
                    Download Template
                  </Button>
                </div>
                
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileChange}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer flex flex-col items-center gap-2"
                  >
                    <FileSpreadsheet className="h-10 w-10 text-muted-foreground" />
                    <div className="text-sm">
                      <span className="font-medium text-primary">Click to upload</span>
                      <span className="text-muted-foreground"> or drag and drop</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      CSV or Excel files up to 10MB
                    </p>
                  </label>
                </div>

                {file && (
                  <Alert>
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertDescription>
                      Selected file: <span className="font-medium">{file.name}</span>
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="skipConflicts"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          Skip conflicting periods
                        </FormLabel>
                        <FormDescription>
                          Skip price ranges that overlap with existing periods
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="updateExisting"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          Update existing periods
                        </FormLabel>
                        <FormDescription>
                          Update overlapping price ranges with new data
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              {previewData.length > 0 && (
                <div className="space-y-2">
                  <FormLabel>Preview (first 5 rows)</FormLabel>
                  <ScrollArea className="h-48 w-full border rounded-lg p-4">
                    <div className="space-y-2">
                      {previewData.map((priceRange, index) => (
                        <div key={index} className="text-sm p-2 bg-muted rounded-lg">
                          <div className="font-medium">
                            {priceRange.periodName} - {priceRange.propertyId}
                          </div>
                          <div className="text-muted-foreground">
                            {priceRange.startDate.toLocaleDateString()} to {priceRange.endDate.toLocaleDateString()} • €{priceRange.ownerNightlyRate}/night
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}

              {importPriceRangesMutation.isPending && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Importing price ranges...</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    <span className="text-sm text-muted-foreground">Processing price ranges...</span>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-4">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="bg-[#1E3A3A] hover:bg-[#1E3A3A]/90"
                  disabled={!file || importPriceRangesMutation.isPending || form.getValues("priceRanges").length === 0}
                >
                  {importPriceRangesMutation.isPending ? (
                    <>
                      <span className="mr-2">Importing...</span>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Import Price Ranges
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        ) : (
          // Import Results
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="font-medium">Import Summary</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-green-50 rounded-lg text-center">
                  <CheckCircle2 className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <div className="text-2xl font-semibold text-green-900">
                    {importResult.success}
                  </div>
                  <div className="text-sm text-green-700">
                    Imported
                  </div>
                </div>
                <div className="p-4 bg-yellow-50 rounded-lg text-center">
                  <AlertCircle className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                  <div className="text-2xl font-semibold text-yellow-900">
                    {importResult.skipped}
                  </div>
                  <div className="text-sm text-yellow-700">
                    Skipped
                  </div>
                </div>
                <div className="p-4 bg-red-50 rounded-lg text-center">
                  <XCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
                  <div className="text-2xl font-semibold text-red-900">
                    {importResult.failed}
                  </div>
                  <div className="text-sm text-red-700">
                    Failed
                  </div>
                </div>
              </div>
            </div>

            {importResult.errors.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">Issues Found</h4>
                <ScrollArea className="h-32 w-full border rounded-lg p-4">
                  <div className="space-y-2">
                    {importResult.errors.map((error, index) => (
                      <Alert key={index} variant="destructive" className="py-2">
                        <AlertDescription className="text-sm">{error}</AlertDescription>
                      </Alert>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            <div className="flex justify-end gap-4">
              <Button
                variant="outline"
                onClick={resetImport}
              >
                Import More
              </Button>
              <Button
                className="bg-[#1E3A3A] hover:bg-[#1E3A3A]/90"
                onClick={() => setOpen(false)}
              >
                Done
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}