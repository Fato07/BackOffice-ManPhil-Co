"use client"

import { useCallback } from "react"
import { FileDropzone } from "@/components/ui/file-dropzone"
import { FileSpreadsheet, Upload, AlertCircle } from "lucide-react"

interface ImportDropzoneProps {
  onFileSelect: (file: File) => void
  className?: string
}

export function ImportDropzone({ onFileSelect, className }: ImportDropzoneProps) {
  const handleFileSelect = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onFileSelect(acceptedFiles[0])
    }
  }, [onFileSelect])

  return (
    <FileDropzone
      onFileSelect={handleFileSelect}
      accept={{
        'text/csv': ['.csv'],
        'application/vnd.ms-excel': ['.csv'],
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      }}
      maxFiles={1}
      maxSize={10 * 1024 * 1024} // 10MB
      multiple={false}
      className={className}
      showFileInfo={false}
      placeholder={{
        idle: (
          <>
            <div className="rounded-full bg-muted p-3">
              <FileSpreadsheet className="w-8 h-8 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">
                Drag & drop your CSV file here
              </p>
              <p className="text-xs text-muted-foreground">
                or click to browse. Maximum file size: 10MB
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <FileSpreadsheet className="w-4 h-4" />
              <span>Supported format: CSV</span>
            </div>
          </>
        ),
        active: (
          <>
            <Upload className="w-8 h-8 text-primary" />
            <p className="text-sm font-medium">Drop your CSV file here</p>
          </>
        ),
        reject: (
          <>
            <AlertCircle className="w-12 h-12 text-destructive" />
            <div className="space-y-2">
              <p className="text-sm font-medium text-destructive">
                Invalid file type
              </p>
              <p className="text-xs text-muted-foreground">
                Please upload a CSV file
              </p>
            </div>
          </>
        ),
      }}
    />
  )
}