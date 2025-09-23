"use client"

import { useCallback, ReactNode } from "react"
import { useDropzone, Accept } from "react-dropzone"
import { 
  Upload, 
  X, 
  FileText, 
  FileImage, 
  FileType,
  FileIcon,
  AlertCircle,
  File
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface FileDropzoneProps {
  onFileSelect: (files: File[]) => void
  onRemove?: () => void
  files?: File[]
  accept?: Accept
  maxFiles?: number
  maxSize?: number
  multiple?: boolean
  className?: string
  error?: string | null
  placeholder?: {
    idle?: ReactNode | string
    active?: ReactNode | string
    reject?: ReactNode | string
  }
  showFileInfo?: boolean
  disabled?: boolean
}

const getFileIcon = (mimeType: string) => {
  if (mimeType.includes('pdf')) return FileType
  if (mimeType.includes('image')) return FileImage
  if (mimeType.includes('spreadsheet') || mimeType.includes('csv')) return FileText
  if (mimeType.includes('word') || mimeType.includes('document')) return FileText
  return FileIcon
}

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function FileDropzone({
  onFileSelect,
  onRemove,
  files = [],
  accept,
  maxFiles = 1,
  maxSize,
  multiple = false,
  className,
  error,
  placeholder = {},
  showFileInfo = true,
  disabled = false,
}: FileDropzoneProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    onFileSelect(acceptedFiles)
  }, [onFileSelect])

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept,
    maxFiles: multiple ? maxFiles : 1,
    multiple,
    maxSize,
    disabled,
  })

  // Show selected files
  if (files.length > 0 && showFileInfo) {
    return (
      <div className={cn("space-y-2", className)}>
        {files.map((file, index) => {
          const Icon = getFileIcon(file.type)
          
          return (
            <div 
              key={index} 
              className="relative rounded-lg border-2 border-dashed p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
                {onRemove && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={onRemove}
                    className="h-8 w-8 p-0"
                    disabled={disabled}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          )
        })}
        {error && (
          <p className="text-xs text-red-500">{error}</p>
        )}
      </div>
    )
  }

  // Default placeholders
  const defaultPlaceholders = {
    idle: (
      <>
        <div className="rounded-full border border-dashed p-3">
          <Upload className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium">
            Drag & drop or click to upload
          </p>
          {maxSize && (
            <p className="text-xs text-muted-foreground">
              Maximum file size: {formatFileSize(maxSize)}
            </p>
          )}
        </div>
      </>
    ),
    active: (
      <>
        <Upload className="h-8 w-8 text-primary" />
        <p className="text-sm font-medium">Drop the file{multiple ? 's' : ''} here</p>
      </>
    ),
    reject: (
      <>
        <AlertCircle className="h-8 w-8 text-destructive" />
        <div className="space-y-1">
          <p className="text-sm font-medium text-destructive">
            Invalid file
          </p>
          <p className="text-xs text-muted-foreground">
            Please check the file type and size
          </p>
        </div>
      </>
    ),
  }

  const placeholders = {
    idle: placeholder.idle || defaultPlaceholders.idle,
    active: placeholder.active || defaultPlaceholders.active,
    reject: placeholder.reject || defaultPlaceholders.reject,
  }

  return (
    <div
      {...getRootProps()}
      className={cn(
        "relative rounded-lg border-2 border-dashed p-6 transition-colors",
        !disabled && "cursor-pointer",
        isDragActive && !isDragReject && "border-primary bg-primary/5",
        isDragReject && "border-destructive bg-destructive/5",
        !isDragActive && !isDragReject && !disabled && "border-muted-foreground/25 hover:border-primary/50",
        disabled && "opacity-50 cursor-not-allowed",
        error && "border-red-500",
        className
      )}
    >
      <input {...getInputProps()} disabled={disabled} />
      <div className="flex flex-col items-center justify-center gap-2 text-center">
        {isDragReject ? placeholders.reject : isDragActive ? placeholders.active : placeholders.idle}
      </div>
      {error && (
        <p className="mt-2 text-xs text-red-500 text-center">{error}</p>
      )}
    </div>
  )
}