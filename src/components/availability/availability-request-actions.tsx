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
  Check, 
  X, 
  Eye, 
  Loader2 
} from "lucide-react"
import { toast } from "sonner"

import { AvailabilityRequestStatus, AvailabilityRequestUrgency } from "@/generated/prisma"

interface AvailabilityRequest {
  id: string
  propertyId: string
  startDate: Date
  endDate: Date
  guestName: string
  guestEmail: string
  guestPhone: string
  numberOfGuests: number
  message?: string | null
  status: AvailabilityRequestStatus
  createdAt: Date
  urgency: AvailabilityRequestUrgency
  requestedBy: string
}

interface AvailabilityRequestActionsProps {
  request: AvailabilityRequest
  onConfirm?: (request: AvailabilityRequest) => void
  onReject?: (request: AvailabilityRequest) => void
  onView?: (request: AvailabilityRequest) => void
}

export function AvailabilityRequestActions({ 
  request, 
  onConfirm, 
  onReject, 
  onView 
}: AvailabilityRequestActionsProps) {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { canEditSection } = usePermissions()

  const canManageRequests = canEditSection('bookings')

  const handleView = () => {
    if (onView) {
      onView(request)
    }
  }

  const handleConfirm = async () => {
    if (!onConfirm) return

    setIsLoading(true)
    try {
      await onConfirm(request)
      setShowConfirmDialog(false)
      toast.success("Availability request confirmed successfully")
    } catch (error) {
      toast.error("Failed to confirm request")
    } finally {
      setIsLoading(false)
    }
  }

  const handleReject = async () => {
    if (!onReject) return

    setIsLoading(true)
    try {
      await onReject(request)
      setShowRejectDialog(false)
      toast.success("Availability request rejected")
    } catch (error) {
      toast.error("Failed to reject request")
    } finally {
      setIsLoading(false)
    }
  }

  const isPending = request.status === AvailabilityRequestStatus.PENDING

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
            
            {isPending && canManageRequests && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => setShowConfirmDialog(true)}
                  className="text-green-600 focus:text-green-600"
                >
                  <Check className="mr-2 h-3 w-3" />
                  Confirm Request
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setShowRejectDialog(true)}
                  className="text-red-600 focus:text-red-600"
                >
                  <X className="mr-2 h-3 w-3" />
                  Reject Request
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Availability Request</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to confirm the availability request from <strong>{request.guestName}</strong>?
              <br /><br />
              <strong>Dates:</strong> {request.startDate.toLocaleDateString()} - {request.endDate.toLocaleDateString()}
              <br />
              <strong>Guests:</strong> {request.numberOfGuests}
              {request.message && (
                <>
                  <br />
                  <strong>Message:</strong> {request.message}
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirm}
              disabled={isLoading}
              className="bg-green-600 hover:bg-green-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  Confirming...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-3 w-3" />
                  Confirm Request
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Availability Request</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reject the availability request from <strong>{request.guestName}</strong>?
              <br /><br />
              This action cannot be undone and the guest will need to submit a new request.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleReject}
              disabled={isLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  Rejecting...
                </>
              ) : (
                <>
                  <X className="mr-2 h-3 w-3" />
                  Reject Request
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}