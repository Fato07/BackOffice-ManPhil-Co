"use client"

import { useState, useCallback } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { FileDropzone } from "@/components/ui/file-dropzone"
import { Upload } from "lucide-react"
import { useUploadDocumentVersion } from "@/hooks/use-legal-documents"
import { 
  ALLOWED_FILE_TYPES, 
  MAX_FILE_SIZE, 
  formatFileSize 
} from "@/types/legal-document"
import { toast } from "sonner"

interface UploadVersionDialogProps {
  documentId: string
  documentName: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function UploadVersionDialog({ 
  documentId, 
  documentName,
  open, 
  onOpenChange 
}: UploadVersionDialogProps) {
  const [file, setFile] = useState<File | null>(null)
  const [comment, setComment] = useState("")
  const [error, setError] = useState<string | null>(null)
  const uploadVersion = useUploadDocumentVersion(documentId)

  const handleFileSelect = useCallback((files: File[]) => {
    setError(null)
    
    if (files.length === 0) {
      setFile(null)
      return
    }

    const selectedFile = files[0]
    
    // Validate file type
    if (!ALLOWED_FILE_TYPES.includes(selectedFile.type)) {
      setError("File type not allowed. Please upload a PDF, Word document, or image.")
      return
    }
    
    // Validate file size
    if (selectedFile.size > MAX_FILE_SIZE) {
      setError(`File size exceeds ${formatFileSize(MAX_FILE_SIZE)}. Please choose a smaller file.`)
      return
    }
    
    setFile(selectedFile)
  }, [])

  const handleRemoveFile = useCallback(() => {
    setFile(null)
    setError(null)
  }, [])

  const handleUpload = () => {
    if (!file) {
      toast.error("Please select a file to upload")
      return
    }

    uploadVersion.mutate({
      file,
      comment: comment.trim() || "New version uploaded"
    }, {
      onSuccess: () => {
        setFile(null)
        setComment("")
        setError(null)
        onOpenChange(false)
        toast.success("New version uploaded successfully")
      }
    })
  }

  const handleClose = () => {
    setFile(null)
    setComment("")
    setError(null)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-medium">Upload New Version</DialogTitle>
          <DialogDescription className="text-sm text-gray-500">
            Upload a new version of "{documentName}". The current version will be preserved in the history.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="file" className="text-sm font-medium">
              Select File
            </Label>
            <FileDropzone
              onFileSelect={handleFileSelect}
              onRemove={file ? handleRemoveFile : undefined}
              files={file ? [file] : []}
              accept={ALLOWED_FILE_TYPES.reduce((acc, type) => {
                acc[type] = []
                return acc
              }, {} as Record<string, string[]>)}
              maxFiles={1}
              maxSize={MAX_FILE_SIZE}
              multiple={false}
              error={error}
              placeholder={{
                idle: (
                  <>
                    <div className="rounded-full border border-dashed p-3">
                      <Upload className="h-5 w-5 text-muted-foreground" />
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="comment" className="text-sm font-medium">
              Version Comment (Optional)
            </Label>
            <Textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Describe the changes in this version..."
              className="min-h-[80px] resize-none"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={uploadVersion.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleUpload}
            disabled={!file || uploadVersion.isPending}
            className="bg-[#B5985A] hover:bg-[#B5985A]/90 text-white"
          >
            {uploadVersion.isPending ? (
              <>
                <div className="h-4 w-4 mr-2 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload Version
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}