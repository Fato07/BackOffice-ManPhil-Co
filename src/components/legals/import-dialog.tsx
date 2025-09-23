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
import { Label } from "@/components/ui/label"
import { Upload, FileText, AlertCircle, CheckCircle2 } from "lucide-react"
import { DocumentUploadZone } from "./document-upload-zone"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"

interface ImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface ImportResult {
  success: number
  failed: number
  errors: string[]
}

export function ImportDialog({
  open,
  onOpenChange,
}: ImportDialogProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<ImportResult | null>(null)

  const handleImport = async () => {
    if (!file) return

    setIsImporting(true)
    setProgress(0)
    setResult(null)

    try {
      // Import logic - currently mock implementation for UI development
      // Production implementation requires file parsing and validation
      
      // Simulate progress
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval)
            return 100
          }
          return prev + 10
        })
      }, 200)

      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 2500))
      
      clearInterval(interval)
      setProgress(100)

      // Mock result
      const mockResult: ImportResult = {
        success: 8,
        failed: 2,
        errors: [
          "Row 5: Invalid category 'UNKNOWN'",
          "Row 12: Missing required field 'name'"
        ]
      }
      
      setResult(mockResult)
      
      if (mockResult.success > 0) {
        toast.success(`Successfully imported ${mockResult.success} documents`)
      }
      
      if (mockResult.failed > 0) {
        toast.error(`Failed to import ${mockResult.failed} documents`)
      }
    } catch (error) {
      toast.error("Import failed. Please check your file and try again.")
    } finally {
      setIsImporting(false)
    }
  }

  const handleClose = () => {
    if (isImporting) return
    setFile(null)
    setResult(null)
    setProgress(0)
    onOpenChange(false)
  }

  const resetImport = () => {
    setFile(null)
    setResult(null)
    setProgress(0)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import Legal Documents</DialogTitle>
          <DialogDescription>
            Upload a CSV file to import multiple legal documents at once.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!result ? (
            <>
              {/* File upload */}
              <div className="space-y-2">
                <Label>Select File</Label>
                <DocumentUploadZone
                  onFileSelect={(f) => setFile(f || null)}
                  file={file || undefined}
                  onRemove={() => setFile(null)}
                />
              </div>

              {/* Import progress */}
              {isImporting && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Importing documents...</span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} />
                </div>
              )}

              {/* Instructions */}
              <Alert>
                <FileText className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-medium">CSV Format Requirements:</p>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>First row must contain column headers</li>
                      <li>Required columns: name, category, file_url</li>
                      <li>Optional columns: description, property_id, expiry_date, tags</li>
                      <li>Date format: YYYY-MM-DD</li>
                      <li>Tags should be comma-separated within quotes</li>
                    </ul>
                    <p className="text-sm mt-2">
                      <a href="/templates/legal-documents-import.csv" className="text-primary hover:underline">
                        Download sample CSV template
                      </a>
                    </p>
                  </div>
                </AlertDescription>
              </Alert>
            </>
          ) : (
            <>
              {/* Import results */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg border p-4">
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle2 className="h-5 w-5" />
                      <span className="font-medium">Successfully Imported</span>
                    </div>
                    <p className="text-2xl font-bold mt-2">{result.success}</p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <div className="flex items-center gap-2 text-red-600">
                      <AlertCircle className="h-5 w-5" />
                      <span className="font-medium">Failed</span>
                    </div>
                    <p className="text-2xl font-bold mt-2">{result.failed}</p>
                  </div>
                </div>

                {result.errors.length > 0 && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="space-y-1">
                        <p className="font-medium">Import Errors:</p>
                        <ul className="list-disc list-inside space-y-1 text-sm">
                          {result.errors.map((error, index) => (
                            <li key={index}>{error}</li>
                          ))}
                        </ul>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          {!result ? (
            <>
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={isImporting}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleImport} 
                disabled={!file || isImporting}
              >
                {isImporting ? (
                  <>
                    <Upload className="mr-2 h-4 w-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Import
                  </>
                )}
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={resetImport}
              >
                Import More
              </Button>
              <Button onClick={handleClose}>
                Done
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}