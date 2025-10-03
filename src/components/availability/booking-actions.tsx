"use client"

import { useState } from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { Button } from "@/components/ui/button"
import { usePermissions } from "@/hooks/use-permissions"
import { 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Eye,
  Loader2 
} from "lucide-react"
import { toast } from "sonner"
import { BookingType, BookingStatus } from "@/generated/prisma"

interface Booking {
  id: string
  startDate: Date
  endDate: Date
  type: BookingType
  status: BookingStatus
  guestName?: string | null
  guestEmail?: string | null
  numberOfGuests?: number | null
  totalAmount?: number | null
  notes?: string | null
  updatedAt: Date
  updatedBy?: string | null
  createdBy?: string | null
}

interface BookingActionsProps {
  booking: Booking
  onEdit?: (booking: Booking) => void
  onDelete?: (booking: Booking) => Promise<void>
  onView?: (booking: Booking) => void
}

export function BookingActions({ 
  booking, 
  onEdit, 
  onDelete,
  onView 
}: BookingActionsProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { canEditSection } = usePermissions()

  const canEdit = canEditSection('bookings')
  const canDelete = canEditSection('bookings')

  const handleEdit = () => {
    if (onEdit) {
      onEdit(booking)
    }
  }

  const handleView = () => {
    if (onView) {
      onView(booking)
    }
  }

  const handleDelete = async () => {
    if (!onDelete) return

    setIsLoading(true)
    try {
      await onDelete(booking)
      setShowDeleteDialog(false)
      toast.success("Booking deleted successfully")
    } catch (error) {
      toast.error("Failed to delete booking")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <div className="relative" data-no-row-click>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="h-6 w-6 p-0 [&_svg]:pointer-events-auto"
              disabled={isLoading}
              onClick={(e) => {
                e.stopPropagation()
              }}
            >
              <span className="sr-only">Open menu</span>
              {isLoading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <MoreHorizontal className="h-3 w-3" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[200px]">
            <DropdownMenuItem onClick={handleView}>
              <Eye className="mr-2 h-3 w-3" />
              View Details
            </DropdownMenuItem>
            
            {canEdit && (
              <DropdownMenuItem onClick={handleEdit}>
                <Edit className="mr-2 h-3 w-3" />
                Edit Booking
              </DropdownMenuItem>
            )}
            
            {canDelete && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-red-600 focus:text-red-600"
                >
                  <Trash2 className="mr-2 h-3 w-3" />
                  Delete Booking
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Booking</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this booking?
              <br /><br />
              <strong>Type:</strong> {booking.type.replace('_', ' ')}
              <br />
              <strong>Dates:</strong> {booking.startDate.toLocaleDateString()} - {booking.endDate.toLocaleDateString()}
              {booking.guestName && (
                <>
                  <br />
                  <strong>Guest:</strong> {booking.guestName}
                </>
              )}
              <br /><br />
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              disabled={isLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-3 w-3" />
                  Delete Booking
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}