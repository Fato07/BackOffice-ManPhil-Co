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
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { 
  Download, 
  Trash2, 
  AlertTriangle, 
  FileText,
  Loader2
} from "lucide-react"
import { LegalDocumentWithRelations } from "@/types/legal-document"

interface BulkOperationsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  operation: 'download' | 'delete'
  selectedDocuments: LegalDocumentWithRelations[]
  onConfirm: (options?: BulkOperationOptions) => Promise<void>
  isLoading?: boolean
}

interface BulkOperationOptions {
  includeVersions?: boolean
  format?: 'zip' | 'individual'
}

export function BulkOperationsDialog({
  open,
  onOpenChange,
  operation,
  selectedDocuments,
  onConfirm,
  isLoading = false
}: BulkOperationsDialogProps) {
  const [includeVersions, setIncludeVersions] = useState(false)
  const [format, setFormat] = useState<'zip' | 'individual'>('zip')

  const handleConfirm = async () => {
    const options: BulkOperationOptions = {}
    
    if (operation === 'download') {
      options.includeVersions = includeVersions
      options.format = format
    }
    
    await onConfirm(options)
  }

  const totalSize = selectedDocuments.reduce((sum, doc) => sum + (doc.fileSize || 0), 0)
  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  const getOperationIcon = () => {
    if (operation === 'download') return <Download className="h-5 w-5 text-blue-600" />
    if (operation === 'delete') return <Trash2 className="h-5 w-5 text-red-600" />
    return <FileText className="h-5 w-5" />
  }

  const getOperationTitle = () => {
    if (operation === 'download') return 'Download Documents'
    if (operation === 'delete') return 'Delete Documents'
    return 'Bulk Operation'
  }

  const getOperationDescription = () => {
    const count = selectedDocuments.length
    if (operation === 'download') {
      return `Download ${count} document${count !== 1 ? 's' : ''} (${formatSize(totalSize)}) as a ZIP archive.`
    }
    if (operation === 'delete') {
      return `Permanently delete ${count} document${count !== 1 ? 's' : ''}. This action cannot be undone.`
    }
    return ''
  }

  const getConfirmButtonText = () => {
    if (isLoading) {
      return operation === 'download' ? 'Preparing Download...' : 'Deleting...'
    }
    return operation === 'download' ? 'Download' : 'Delete'
  }

  const getConfirmButtonVariant = () => {
    return operation === 'delete' ? 'destructive' : 'default'
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getOperationIcon()}
            {getOperationTitle()}
          </DialogTitle>
          <DialogDescription>
            {getOperationDescription()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="max-h-32 overflow-y-auto space-y-1">
            {selectedDocuments.slice(0, 5).map((doc) => (
              <div key={doc.id} className="flex items-center gap-2 text-sm">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="truncate">{doc.name}</span>
                <Badge variant="outline" className="text-xs">
                  {formatSize(doc.fileSize || 0)}
                </Badge>
              </div>
            ))}
            {selectedDocuments.length > 5 && (
              <div className="text-sm text-muted-foreground">
                ... and {selectedDocuments.length - 5} more documents
              </div>
            )}
          </div>

          {operation === 'download' && (
            <div className="space-y-3 pt-3 border-t">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-versions"
                  checked={includeVersions}
                  onCheckedChange={(checked) => setIncludeVersions(!!checked)}
                />
                <Label 
                  htmlFor="include-versions" 
                  className="text-sm cursor-pointer"
                >
                  Include document versions
                </Label>
              </div>
              
              <div className="text-xs text-muted-foreground">
                {includeVersions 
                  ? 'All versions of each document will be included in separate folders'
                  : 'Only the latest version of each document will be downloaded'
                }
              </div>
            </div>
          )}

          {operation === 'delete' && (
            <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-950/20 rounded-md border border-red-200 dark:border-red-800">
              <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm text-red-800 dark:text-red-200 font-medium">
                  This action cannot be undone
                </p>
                <p className="text-xs text-red-700 dark:text-red-300">
                  All selected documents and their versions will be permanently deleted from both the database and file storage.
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            variant={getConfirmButtonVariant()}
            onClick={handleConfirm}
            disabled={isLoading}
            className="min-w-24"
          >
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {getConfirmButtonText()}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}