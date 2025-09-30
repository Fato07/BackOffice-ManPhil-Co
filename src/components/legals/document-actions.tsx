"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { 
  MoreHorizontal, 
  Eye, 
  Download, 
  Upload,
  Edit, 
  Trash2,
  Copy,
  History
} from "lucide-react"
import { LegalDocumentWithRelations } from "@/types/legal-document"
import { useDeleteLegalDocument, useDownloadDocument } from "@/hooks/use-legal-documents"
import { toast } from "sonner"
import { DocumentDetailsDialog } from "./document-details-dialog"

interface DocumentActionsProps {
  document: LegalDocumentWithRelations
}

export function DocumentActions({ document }: DocumentActionsProps) {
  const router = useRouter()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  
  const { mutate: deleteDocument, isPending: isDeleting } = useDeleteLegalDocument()
  const { mutate: downloadDocument, isPending: isDownloading } = useDownloadDocument()

  const handleView = () => {
    router.push(`/legals/${document.id}`)
  }

  const handleEdit = () => {
    router.push(`/legals/${document.id}/edit`)
  }

  const handleDownload = () => {
    downloadDocument({ id: document.id })
  }

  const handleCopyLink = () => {
    const url = `${window.location.origin}/legals/${document.id}`
    navigator.clipboard.writeText(url)
    toast.success("Link copied to clipboard")
  }

  const handleDelete = () => {
    deleteDocument(document.id)
    setShowDeleteDialog(false)
  }

  return (
    <>
      <div className="relative" data-no-row-click>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              className="h-8 w-8 p-0 [&_svg]:pointer-events-auto"
              onClick={(e) => {
                e.stopPropagation()
              }}
            >
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[160px]">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleView}>
            <Eye className="mr-2 h-4 w-4" />
            View details
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setShowDetailsDialog(true)}>
            <History className="mr-2 h-4 w-4" />
            Quick view
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={handleDownload}
            disabled={isDownloading}
          >
            <Download className="mr-2 h-4 w-4" />
            Download
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleCopyLink}>
            <Copy className="mr-2 h-4 w-4" />
            Copy link
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleEdit}>
            <Edit className="mr-2 h-4 w-4" />
            Edit metadata
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push(`/legals/${document.id}/upload`)}>
            <Upload className="mr-2 h-4 w-4" />
            Upload new version
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setShowDeleteDialog(true)}
            className="text-red-600"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              document &quot;{document.name}&quot; and all its versions from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <DocumentDetailsDialog
        document={document}
        open={showDetailsDialog}
        onOpenChange={setShowDetailsDialog}
      />
    </>
  )
}