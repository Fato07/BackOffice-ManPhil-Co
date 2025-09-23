"use client"

import { useState } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { deleteEquipmentRequest } from "@/actions/equipment-requests"
import { toast } from "sonner"

interface DeleteEquipmentRequestDialogProps {
  requestId: string
  onDeleted?: () => void
  children: React.ReactNode
}

export function DeleteEquipmentRequestDialog({
  requestId,
  onDeleted,
  children,
}: DeleteEquipmentRequestDialogProps) {
  const [open, setOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    
    try {
      await deleteEquipmentRequest(requestId)
      toast.success("Equipment request deleted successfully")
      setOpen(false)
      onDeleted?.()
    } catch {
      toast.error("Failed to delete equipment request")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        {children}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Equipment Request</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this equipment request? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}