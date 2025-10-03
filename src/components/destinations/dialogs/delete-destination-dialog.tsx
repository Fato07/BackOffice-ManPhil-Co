"use client"

import { useState } from "react"
import { AlertTriangle, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { api, ApiError } from "@/lib/api"
import { useQueryClient } from "@tanstack/react-query"
import { destinationKeys } from "@/hooks/use-destinations"
import { DestinationWithCount } from "@/hooks/use-destinations"

interface DeleteDestinationDialogProps {
  destination: DestinationWithCount
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function DeleteDestinationDialog({
  destination,
  open,
  onOpenChange,
  onSuccess,
}: DeleteDestinationDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const queryClient = useQueryClient()

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await api.delete(`/api/destinations/${destination.id}`)
      
      toast.success("Destination deleted successfully")
      queryClient.invalidateQueries({ queryKey: destinationKeys.all })
      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      
      
      if (error instanceof ApiError && error.status === 400) {
        // Handle the case where destination has associated properties
        const errorData = error.response?.data
        if (errorData?.propertyCount) {
          toast.error(errorData.error || "Cannot delete destination with associated properties", {
            description: `This destination has ${errorData.propertyCount} associated properties. Please reassign or delete them first.`,
            duration: 5000,
          })
        } else {
          toast.error(error.message || "Cannot delete destination")
        }
      } else if (error instanceof ApiError) {
        toast.error(error.message || "Failed to delete destination")
      } else {
        toast.error("Failed to delete destination")
      }
      onOpenChange(false)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-black/90 backdrop-blur-xl border-white/10">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Delete Destination
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Are you sure you want to delete this destination?
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
            <p className="text-sm text-gray-300">
              You are about to delete:
            </p>
            <p className="font-semibold text-white mt-1">
              {destination.name}, {destination.country}
            </p>
          </div>

          {destination._count?.properties && destination._count.properties > 0 ? (
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
              <p className="text-sm text-yellow-200">
                <strong>Warning:</strong> This destination has {destination._count.properties} associated {destination._count.properties === 1 ? 'property' : 'properties'}.
                You cannot delete it until all properties are reassigned or deleted.
              </p>
            </div>
          ) : (
            <p className="text-sm text-gray-400">
              This action cannot be undone. The destination will be permanently removed.
            </p>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
            className="border-white/10 text-white hover:bg-white/10"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting || (destination._count?.properties ?? 0) > 0}
            className="bg-red-500 hover:bg-red-600"
          >
            {isDeleting ? (
              "Deleting..."
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Destination
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}