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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { MoreVertical, CheckCircle, XCircle, Package, Truck, Ban } from "lucide-react"
import { EquipmentRequest, EquipmentRequestStatus } from "@/types/equipment-request"
import { updateEquipmentRequestStatus } from "@/actions/equipment-requests"
import { usePermissions } from "@/hooks/use-permissions"
import { Permission } from "@/types/auth"

interface EquipmentRequestStatusActionsProps {
  request: EquipmentRequest
}

export function EquipmentRequestStatusActions({ request }: EquipmentRequestStatusActionsProps) {
  const router = useRouter()
  const { hasPermission } = usePermissions()
  const [isLoading, setIsLoading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogType, setDialogType] = useState<"approve" | "reject" | "cancel" | null>(null)
  const [rejectedReason, setRejectedReason] = useState("")
  const [internalNotes, setInternalNotes] = useState("")

  const canApprove = hasPermission(Permission.EQUIPMENT_REQUEST_APPROVE) && request.status === "PENDING"
  const canUpdateStatus = hasPermission(Permission.EQUIPMENT_REQUEST_EDIT)
  
  // Define available actions based on current status and permissions
  const getAvailableActions = () => {
    const actions = []

    switch (request.status) {
      case "PENDING":
        if (canApprove) {
          actions.push({ type: "approve" as const, label: "Approve", icon: CheckCircle })
          actions.push({ type: "reject" as const, label: "Reject", icon: XCircle })
        }
        if (canUpdateStatus) {
          actions.push({ type: "cancel" as const, label: "Cancel", icon: Ban })
        }
        break
      case "APPROVED":
        if (canUpdateStatus) {
          actions.push({ type: "order" as const, label: "Mark as Ordered", icon: Package })
        }
        break
      case "ORDERED":
        if (canUpdateStatus) {
          actions.push({ type: "deliver" as const, label: "Mark as Delivered", icon: Truck })
        }
        break
    }

    return actions
  }

  const availableActions = getAvailableActions()

  if (availableActions.length === 0) {
    return null
  }

  const handleStatusUpdate = async (status: EquipmentRequestStatus, reason?: string) => {
    setIsLoading(true)
    
    try {
      await updateEquipmentRequestStatus(request.id, {
        status,
        rejectedReason: reason,
        internalNotes: internalNotes || undefined,
      })
      
      toast.success(`Request ${status.toLowerCase().replace('_', ' ')} successfully`)
      router.refresh()
      setDialogOpen(false)
      setRejectedReason("")
      setInternalNotes("")
    } catch {
      toast.error("Failed to update request status")
    } finally {
      setIsLoading(false)
    }
  }

  const openDialog = (type: "approve" | "reject" | "cancel") => {
    setDialogType(type)
    setDialogOpen(true)
  }

  const handleAction = (type: string) => {
    switch (type) {
      case "approve":
      case "reject":
      case "cancel":
        openDialog(type as "approve" | "reject" | "cancel")
        break
      case "order":
        handleStatusUpdate("ORDERED")
        break
      case "deliver":
        handleStatusUpdate("DELIVERED")
        break
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <MoreVertical className="h-4 w-4" />
            Update Status
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Status Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {availableActions.map((action) => {
            const Icon = action.icon
            return (
              <DropdownMenuItem
                key={action.type}
                onClick={() => handleAction(action.type)}
                className="gap-2"
              >
                <Icon className="h-4 w-4" />
                {action.label}
              </DropdownMenuItem>
            )
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogType === "approve" && "Approve Equipment Request"}
              {dialogType === "reject" && "Reject Equipment Request"}
              {dialogType === "cancel" && "Cancel Equipment Request"}
            </DialogTitle>
            <DialogDescription>
              {dialogType === "approve" && "Are you sure you want to approve this equipment request?"}
              {dialogType === "reject" && "Please provide a reason for rejecting this request."}
              {dialogType === "cancel" && "Are you sure you want to cancel this equipment request?"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {dialogType === "reject" && (
              <div className="space-y-2">
                <Label htmlFor="reason">Rejection Reason *</Label>
                <Textarea
                  id="reason"
                  value={rejectedReason}
                  onChange={(e) => setRejectedReason(e.target.value)}
                  placeholder="Please explain why this request is being rejected..."
                  className="min-h-[100px]"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="notes">Internal Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                placeholder="Add any internal notes about this decision..."
                className="min-h-[80px]"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (dialogType === "approve") {
                  handleStatusUpdate("APPROVED")
                } else if (dialogType === "reject") {
                  if (!rejectedReason.trim()) {
                    toast.error("Please provide a rejection reason")
                    return
                  }
                  handleStatusUpdate("REJECTED", rejectedReason)
                } else if (dialogType === "cancel") {
                  handleStatusUpdate("CANCELLED")
                }
              }}
              disabled={isLoading || (dialogType === "reject" && !rejectedReason.trim())}
            >
              {isLoading ? "Processing..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}