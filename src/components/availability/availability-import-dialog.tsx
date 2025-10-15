'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Calendar, Upload, AlertCircle, CheckCircle, XCircle, Info } from 'lucide-react'
import { toast } from 'sonner'
import Papa from 'papaparse'
import { importBookings, type BookingImportData, type ImportResult } from '@/actions/availability-import'

interface AvailabilityImportDialogProps {
  onImportComplete?: () => void
}

interface ImportPreviewRow {
  data: BookingImportData
  errors: string[]
  warnings: string[]
}

export function AvailabilityImportDialog({ onImportComplete }: AvailabilityImportDialogProps) {
  const [open, setOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<ImportPreviewRow[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [activeTab, setActiveTab] = useState('upload')

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (!selectedFile) return

    if (selectedFile.type !== 'text/csv') {
      toast.error('Please select a CSV file')
      return
    }

    setFile(selectedFile)
    parseCSV(selectedFile)
  }

  const parseCSV = (file: File) => {
    setIsProcessing(true)
    
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
      transform: (value, header) => {
        // Transform numeric fields
        if (['numberOfGuests', 'totalAmount'].includes(header as string)) {
          const num = parseFloat(String(value) || '0')
          return isNaN(num) ? 0 : num
        }
        return String(value)?.trim() || ''
      },
      complete: (results) => {
        const previewData: ImportPreviewRow[] = results.data.map((row: any) => {
          const errors: string[] = []
          const warnings: string[] = []

          // Basic validation
          if (!row.propertyName?.trim()) {
            errors.push('Property name is required')
          }
          if (!row.bookingType?.trim()) {
            errors.push('Booking type is required')
          }
          if (!row.startDate?.trim()) {
            errors.push('Start date is required')
          }
          if (!row.endDate?.trim()) {
            errors.push('End date is required')
          }

          // Date validation
          if (row.startDate && row.endDate) {
            const start = new Date(row.startDate)
            const end = new Date(row.endDate)
            if (isNaN(start.getTime())) {
              errors.push('Invalid start date format')
            }
            if (isNaN(end.getTime())) {
              errors.push('Invalid end date format')
            }
            if (start >= end) {
              errors.push('End date must be after start date')
            }
          }

          // Booking type validation
          const validTypes = ['CONFIRMED', 'TENTATIVE', 'BLOCKED', 'MAINTENANCE', 'OWNER', 'OWNER_STAY', 'CONTRACT']
          if (row.bookingType && !validTypes.includes(row.bookingType)) {
            errors.push(`Invalid booking type. Must be one of: ${validTypes.join(', ')}`)
          }

          // Email validation
          if (row.guestEmail && row.guestEmail.trim() !== '' && !/\S+@\S+\.\S+/.test(row.guestEmail)) {
            errors.push('Invalid email format')
          }

          // Guest booking validation
          if (['CONFIRMED', 'TENTATIVE'].includes(row.bookingType)) {
            if (!row.guestName?.trim()) {
              warnings.push('Guest name recommended for confirmed/tentative bookings')
            }
          }

          // Blocked/maintenance validation
          if (['BLOCKED', 'MAINTENANCE', 'OWNER_STAY'].includes(row.bookingType)) {
            if (row.guestName || row.guestEmail || row.guestPhone) {
              warnings.push('Guest information not needed for blocked/maintenance periods')
            }
          }

          return {
            data: row as BookingImportData,
            errors,
            warnings,
          }
        })

        setPreview(previewData)
        setActiveTab('preview')
        setIsProcessing(false)
      },
      error: (error) => {
        toast.error(`Failed to parse CSV: ${error.message}`)
        setIsProcessing(false)
      },
    })
  }

  const handleImport = async () => {
    if (!preview.length) return

    const validRows = preview.filter(row => row.errors.length === 0)
    if (validRows.length === 0) {
      toast.error('No valid rows to import')
      return
    }

    setIsProcessing(true)
    setActiveTab('importing')

    try {
      const result = await importBookings(validRows.map(row => row.data))
      setImportResult(result)
      
      if (result.success) {
        toast.success(`Successfully imported ${result.imported} bookings`)
        onImportComplete?.()
      } else {
        toast.error(`Import completed with ${result.failed} failures`)
      }
      
      setActiveTab('results')
    } catch (error) {
      toast.error('Import failed')
      console.error('Import error:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const resetDialog = () => {
    setFile(null)
    setPreview([])
    setImportResult(null)
    setActiveTab('upload')
    setIsProcessing(false)
  }

  const handleClose = () => {
    if (!isProcessing) {
      setOpen(false)
      resetDialog()
    }
  }

  const validRows = preview.filter(row => row.errors.length === 0)
  const hasErrors = preview.some(row => row.errors.length > 0)
  const hasWarnings = preview.some(row => row.warnings.length > 0)

  // Calculate statistics
  const stats = preview.reduce((acc, row) => {
    if (row.errors.length === 0) {
      const type = row.data.bookingType
      acc[type] = (acc[type] || 0) + 1
    }
    return acc
  }, {} as Record<string, number>)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button onClick={() => setOpen(true)}>
          <Calendar className="h-4 w-4 mr-2" />
          Import Availability
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Availability & Bookings</DialogTitle>
          <DialogDescription>
            Upload a CSV file to import booking data and availability periods. Properties will be linked by name.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="upload">Upload</TabsTrigger>
            <TabsTrigger value="preview" disabled={!preview.length}>Preview</TabsTrigger>
            <TabsTrigger value="importing" disabled>Importing</TabsTrigger>
            <TabsTrigger value="results" disabled={!importResult}>Results</TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="csv-file">CSV File</Label>
                <Input
                  id="csv-file"
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  disabled={isProcessing}
                />
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>CSV Format Requirements:</strong>
                  <br />
                  Required columns: propertyName, bookingType, startDate, endDate
                  <br />
                  Optional columns: guestName, guestEmail, guestPhone, numberOfGuests, totalAmount, notes
                  <br />
                  Booking types: CONFIRMED, TENTATIVE, BLOCKED, MAINTENANCE, OWNER, OWNER_STAY, CONTRACT
                  <br />
                  Date format: YYYY-MM-DD
                </AlertDescription>
              </Alert>

              <div className="text-sm text-muted-foreground">
                Download template: 
                <Button variant="link" asChild className="p-0 h-auto ml-1">
                  <a href="/docs/availability-template.csv" download>
                    availability-template.csv
                  </a>
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="preview" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-sm">
                  <span className="font-medium">{preview.length}</span> rows found,{' '}
                  <span className="font-medium text-green-600">{validRows.length}</span> valid
                </div>
                
                {Object.keys(stats).length > 0 && (
                  <div className="flex gap-2">
                    {Object.entries(stats).map(([type, count]) => (
                      <Badge key={type} variant="outline">
                        {type}: {count}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setActiveTab('upload')}>
                  Back
                </Button>
                <Button 
                  onClick={handleImport} 
                  disabled={validRows.length === 0 || isProcessing}
                >
                  Continue to Import
                </Button>
              </div>
            </div>

            {hasErrors && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  {preview.filter(row => row.errors.length > 0).length} rows have validation errors and will be skipped.
                </AlertDescription>
              </Alert>
            )}

            {hasWarnings && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {preview.filter(row => row.warnings.length > 0).length} rows have warnings but can be imported.
                </AlertDescription>
              </Alert>
            )}

            <ScrollArea className="h-[400px] border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Property</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Guest</TableHead>
                    <TableHead>Guests</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Issues</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preview.map((row, index) => (
                    <TableRow key={index} className={row.errors.length > 0 ? 'bg-red-50' : ''}>
                      <TableCell>
                        {row.errors.length > 0 ? (
                          <XCircle className="h-4 w-4 text-red-500" />
                        ) : row.warnings.length > 0 ? (
                          <AlertCircle className="h-4 w-4 text-yellow-500" />
                        ) : (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{row.data.propertyName}</TableCell>
                      <TableCell>
                        <Badge variant={
                          ['CONFIRMED', 'TENTATIVE'].includes(row.data.bookingType) 
                            ? 'default' 
                            : 'secondary'
                        }>
                          {row.data.bookingType}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {row.data.startDate} to {row.data.endDate}
                      </TableCell>
                      <TableCell>{row.data.guestName || '-'}</TableCell>
                      <TableCell>{row.data.numberOfGuests || 0}</TableCell>
                      <TableCell>€{row.data.totalAmount || 0}</TableCell>
                      <TableCell>
                        {row.errors.length > 0 && (
                          <div className="text-xs text-red-600 space-y-1">
                            {row.errors.map((error, i) => (
                              <div key={i}>{error}</div>
                            ))}
                          </div>
                        )}
                        {row.warnings.length > 0 && (
                          <div className="text-xs text-yellow-600 space-y-1">
                            {row.warnings.map((warning, i) => (
                              <div key={i}>{warning}</div>
                            ))}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="importing" className="space-y-4">
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                <div className="text-lg font-medium">Importing bookings...</div>
                <div className="text-sm text-muted-foreground">
                  Processing {validRows.length} valid rows
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="results" className="space-y-4">
            {importResult && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{importResult.imported}</div>
                    <div className="text-sm text-green-700">Imported</div>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">{importResult.failed}</div>
                    <div className="text-sm text-red-700">Failed</div>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">{importResult.warnings.length}</div>
                    <div className="text-sm text-yellow-700">Warnings</div>
                  </div>
                </div>

                {importResult.errors.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-red-700">Import Errors</h4>
                    <div className="max-h-40 overflow-y-auto space-y-1">
                      {importResult.errors.map((error, index) => (
                        <div key={index} className="text-sm text-red-600 bg-red-50 p-2 rounded">
                          Row {error.row}: {error.message}
                          {error.field && <span className="text-xs"> (field: {error.field})</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {importResult.warnings.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-yellow-700">Import Warnings</h4>
                    <div className="max-h-40 overflow-y-auto space-y-1">
                      {importResult.warnings.map((warning, index) => (
                        <div key={index} className="text-sm text-yellow-600 bg-yellow-50 p-2 rounded">
                          Row {warning.row}: {warning.message}
                          {warning.field && <span className="text-xs"> (field: {warning.field})</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={resetDialog}>
                    Import More
                  </Button>
                  <Button onClick={handleClose}>
                    Close
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}