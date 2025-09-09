"use client"

import { useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Upload, FileSpreadsheet, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface ImportDropzoneProps {
  onFileSelect: (file: File) => void
  className?: string
}

export function ImportDropzone({ onFileSelect, className }: ImportDropzoneProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onFileSelect(acceptedFiles[0])
    }
  }, [onFileSelect])

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
  })

  return (
    <div
      {...getRootProps()}
      className={cn(
        "relative rounded-lg border-2 border-dashed p-6 transition-all cursor-pointer",
        isDragActive && !isDragReject && "border-primary bg-primary/5",
        isDragReject && "border-destructive bg-destructive/5",
        !isDragActive && !isDragReject && "border-muted-foreground/25 hover:border-primary/50",
        className
      )}
    >
      <input {...getInputProps()} />
      
      <div className="flex flex-col items-center justify-center gap-4 text-center">
        {isDragReject ? (
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
        ) : (
          <>
            <div className="rounded-full bg-muted p-3">
              {isDragActive ? (
                <Upload className="w-8 h-8 text-primary" />
              ) : (
                <FileSpreadsheet className="w-8 h-8 text-muted-foreground" />
              )}
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">
                {isDragActive ? "Drop your CSV file here" : "Drag & drop your CSV file here"}
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
        )}
      </div>
    </div>
  )
}