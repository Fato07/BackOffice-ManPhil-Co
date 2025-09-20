"use client"

import { useCallback, useState } from "react"
import { FileDropzone } from "@/components/ui/file-dropzone"
import { 
  ALLOWED_FILE_TYPES, 
  MAX_FILE_SIZE, 
  formatFileSize 
} from "@/types/legal-document"

interface DocumentUploadZoneProps {
  onFileSelect: (file: File | undefined) => void
  file?: File
  onRemove?: () => void
  className?: string
}

export function DocumentUploadZone({
  onFileSelect,
  file,
  onRemove,
  className,
}: DocumentUploadZoneProps) {
  const [error, setError] = useState<string | null>(null)

  const handleFileSelect = useCallback((acceptedFiles: File[]) => {
    setError(null)
    
    if (acceptedFiles.length === 0) {
      return
    }

    const file = acceptedFiles[0]
    
    // Validate file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      setError("File type not allowed. Please upload a PDF, Word document, or image.")
      return
    }
    
    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setError(`File size exceeds ${formatFileSize(MAX_FILE_SIZE)}. Please choose a smaller file.`)
      return
    }
    
    onFileSelect(file)
  }, [onFileSelect])

  const handleRemove = useCallback(() => {
    setError(null)
    onFileSelect(undefined)
    onRemove?.()
  }, [onFileSelect, onRemove])

  return (
    <FileDropzone
      onFileSelect={handleFileSelect}
      onRemove={file ? handleRemove : undefined}
      files={file ? [file] : []}
      accept={ALLOWED_FILE_TYPES.reduce((acc, type) => {
        acc[type] = []
        return acc
      }, {} as Record<string, string[]>)}
      maxFiles={1}
      maxSize={MAX_FILE_SIZE}
      multiple={false}
      error={error}
      className={className}
      placeholder={{
        idle: (
          <>
            <div className="rounded-full border border-dashed p-3">
              <svg className="h-5 w-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">
                Drag & drop or click to upload
              </p>
              <p className="text-xs text-muted-foreground">
                PDF, Word documents, or images up to {formatFileSize(MAX_FILE_SIZE)}
              </p>
            </div>
          </>
        ),
      }}
    />
  )
}