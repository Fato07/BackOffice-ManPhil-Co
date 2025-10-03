"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  LegalDocumentWithRelations,
  LEGAL_DOCUMENT_CATEGORY_LABELS,
  LEGAL_DOCUMENT_STATUS_LABELS,
  LEGAL_DOCUMENT_STATUS_COLORS,
  formatFileSize
} from "@/types/legal-document"
import { 
  FileText, 
  FileImage, 
  FileType,
  FileIcon,
  Building2,
  Calendar,
  Clock,
  User,
  Tag,
  Download,
  History,
  AlertCircle
} from "lucide-react"
import { format, formatDistanceToNow, differenceInDays } from "date-fns"
import { useDownloadDocument } from "@/hooks/use-legal-documents"

interface DocumentDetailsDialogProps {
  document: LegalDocumentWithRelations
  open: boolean
  onOpenChange: (open: boolean) => void
}

const getFileIcon = (mimeType: string) => {
  if (mimeType.includes('pdf')) return FileType
  if (mimeType.includes('image')) return FileImage
  if (mimeType.includes('word') || mimeType.includes('document')) return FileText
  return FileIcon
}

export function DocumentDetailsDialog({
  document,
  open,
  onOpenChange,
}: DocumentDetailsDialogProps) {
  const { mutate: downloadDocument, isPending: isDownloading } = useDownloadDocument()
  
  const Icon = getFileIcon(document.mimeType)
  const statusColor = LEGAL_DOCUMENT_STATUS_COLORS[document.status] || 'gray'
  
  // Calculate days until expiry
  let daysUntilExpiry = null
  if (document.expiryDate) {
    daysUntilExpiry = differenceInDays(new Date(document.expiryDate), new Date())
  }

  const handleDownload = (version?: number) => {
    downloadDocument({ id: document.id, version })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
              <Icon className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <div className="font-semibold">{document.name}</div>
              {document.description && (
                <div className="text-sm font-normal text-muted-foreground">
                  {document.description}
                </div>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-8rem)] pr-4">
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Badge 
                variant={
                  statusColor === 'green' ? 'default' : 
                  statusColor === 'red' ? 'destructive' : 
                  statusColor === 'yellow' ? 'secondary' : 
                  'outline'
                }
              >
                {LEGAL_DOCUMENT_STATUS_LABELS[document.status]}
              </Badge>
              <Badge variant="outline">
                {LEGAL_DOCUMENT_CATEGORY_LABELS[document.category]}
              </Badge>
              {document.subcategory && (
                <Badge variant="outline">
                  {document.subcategory}
                </Badge>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Property:</span>
                  <span className="font-medium">
                    {document.property?.name || "Global Document"}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Uploaded:</span>
                  <span className="font-medium">
                    {formatDistanceToNow(new Date(document.uploadedAt), { addSuffix: true })}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <FileIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Size:</span>
                  <span className="font-medium">{formatFileSize(document.fileSize)}</span>
                </div>
              </div>

              <div className="space-y-3">
                {document.expiryDate && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Expires:</span>
                    <span className={cn(
                      "font-medium",
                      daysUntilExpiry !== null && daysUntilExpiry < 30 && "text-orange-600"
                    )}>
                      {format(new Date(document.expiryDate), "MMM d, yyyy")}
                      {daysUntilExpiry !== null && daysUntilExpiry >= 0 && (
                        <span className="ml-1">({daysUntilExpiry}d)</span>
                      )}
                    </span>
                  </div>
                )}
                
                {document.reminderDays && (
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Reminder:</span>
                    <span className="font-medium">{document.reminderDays} days before expiry</span>
                  </div>
                )}
                
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Uploaded by:</span>
                  <span className="font-medium">{document.uploadedBy}</span>
                </div>
              </div>
            </div>

            {document.tags && document.tags.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Tags</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {document.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <Separator />

            {document.versions && document.versions.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <History className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Version History</span>
                </div>
                <div className="space-y-2">
                  {document.versions.map((version) => (
                    <div
                      key={version.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <div className="space-y-1">
                        <div className="text-sm font-medium">
                          Version {version.versionNumber}
                          {version.versionNumber === document.versions[0]?.versionNumber && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              Current
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Uploaded {formatDistanceToNow(new Date(version.uploadedAt), { addSuffix: true })}
                          {version.comment && ` • ${version.comment}`}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownload(version.versionNumber)}
                        disabled={isDownloading}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
              <Button 
                onClick={() => handleDownload()} 
                disabled={isDownloading}
              >
                <Download className="mr-2 h-4 w-4" />
                Download Current Version
              </Button>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

function cn(...inputs: Array<string | boolean | undefined>) {
  return inputs.filter(Boolean).join(' ')
}