"use client"

import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { 
  ArrowLeft, 
  Edit, 
  Trash, 
  Package, 
  MapPin, 
  Home, 
  DoorOpen,
  Calendar,
  User,
  Mail,
  Clock,
  CheckCircle,
  XCircle,
  Truck
} from "lucide-react"
import { EquipmentRequest, EquipmentRequestStatus, EquipmentRequestPriority } from "@/types/equipment-request"
import { EquipmentRequestItemsTable } from "./equipment-request-items-table"
import { EquipmentRequestStatusActions } from "./equipment-request-status-actions"
import { DeleteEquipmentRequestDialog } from "./delete-equipment-request-dialog"
import { usePermissions } from "@/hooks/use-permissions"
import { Permission } from "@/types/auth"
import { cn } from "@/lib/utils"

// Status badge colors
const statusColors: Record<EquipmentRequestStatus, string> = {
  PENDING: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
  APPROVED: "bg-green-100 text-green-800 hover:bg-green-100",
  REJECTED: "bg-red-100 text-red-800 hover:bg-red-100",
  ORDERED: "bg-blue-100 text-blue-800 hover:bg-blue-100",
  DELIVERED: "bg-gray-100 text-gray-800 hover:bg-gray-100",
  CANCELLED: "bg-gray-100 text-gray-600 hover:bg-gray-100",
}

// Priority badge colors
const priorityColors: Record<EquipmentRequestPriority, string> = {
  LOW: "bg-gray-100 text-gray-700 hover:bg-gray-100",
  MEDIUM: "bg-blue-100 text-blue-700 hover:bg-blue-100",
  HIGH: "bg-orange-100 text-orange-700 hover:bg-orange-100",
  URGENT: "bg-red-100 text-red-700 hover:bg-red-100",
}

interface EquipmentRequestDetailProps {
  request: EquipmentRequest
}

export function EquipmentRequestDetail({ request }: EquipmentRequestDetailProps) {
  const router = useRouter()
  const { hasPermission } = usePermissions()
  
  const canEdit = hasPermission(Permission.EQUIPMENT_REQUEST_EDIT) && request.status === "PENDING"
  const canDelete = hasPermission(Permission.EQUIPMENT_REQUEST_DELETE) && 
    (request.status === "PENDING" || request.status === "CANCELLED")
  const canViewInternal = hasPermission(Permission.EQUIPMENT_REQUEST_VIEW_INTERNAL)

  const handleEdit = () => {
    router.push(`/equipment-requests/${request.id}/edit`)
  }

  const handleBack = () => {
    router.push("/equipment-requests")
  }

  const handlePropertyClick = () => {
    router.push(`/houses/${request.propertyId}`)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">Equipment Request #{request.id.slice(-8)}</h1>
        </div>
        
        <div className="flex items-center gap-2">
          {canEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleEdit}
              className="gap-2"
            >
              <Edit className="h-4 w-4" />
              Edit
            </Button>
          )}
          {canDelete && (
            <DeleteEquipmentRequestDialog
              requestId={request.id}
              onDeleted={() => router.push("/equipment-requests")}
            >
              <Button
                variant="outline"
                size="sm"
                className="gap-2 text-red-600 hover:text-red-700"
              >
                <Trash className="h-4 w-4" />
                Delete
              </Button>
            </DeleteEquipmentRequestDialog>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary" className={cn(statusColors[request.status], "text-sm py-1 px-3")}>
          {request.status.replace('_', ' ')}
        </Badge>
        <Badge variant="secondary" className={cn(priorityColors[request.priority], "text-sm py-1 px-3")}>
          {request.priority} Priority
        </Badge>
        {request.status === "APPROVED" && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <CheckCircle className="h-4 w-4" />
            Approved by {request.approvedByEmail}
          </div>
        )}
      </div>

      <Card className="p-6 space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Home className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Property</p>
                <button
                  onClick={handlePropertyClick}
                  className="text-base font-medium hover:underline text-left"
                >
                  {request.property.name}
                </button>
              </div>
            </div>

            {request.room && (
              <div className="flex items-start gap-3">
                <DoorOpen className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Room</p>
                  <p className="text-base">{request.room.name}</p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Destination</p>
                <p className="text-base">{request.property.destination.name}, {request.property.destination.country}</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <User className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Requested By</p>
                <p className="text-base">{request.requestedBy}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Email</p>
                <p className="text-base">{request.requestedByEmail}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Created</p>
                <p className="text-base">{format(new Date(request.createdAt), "PPP")}</p>
              </div>
            </div>
          </div>
        </div>

        {(request.approvedAt || request.completedAt) && (
          <>
            <Separator />
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Timeline
              </h3>
              <div className="space-y-2">
                {request.approvedAt && (
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-muted-foreground">Approved on</span>
                    <span className="font-medium">{format(new Date(request.approvedAt), "PPP")}</span>
                  </div>
                )}
                {request.completedAt && (
                  <div className="flex items-center gap-2 text-sm">
                    <Truck className="h-4 w-4 text-blue-600" />
                    <span className="text-muted-foreground">Delivered on</span>
                    <span className="font-medium">{format(new Date(request.completedAt), "PPP")}</span>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </Card>

      <Card className="p-6 space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Package className="h-5 w-5" />
          Requested Items ({request.items.length})
        </h2>
        <EquipmentRequestItemsTable items={request.items} />
      </Card>

      {(request.reason || request.notes) && (
        <Card className="p-6 space-y-4">
          <h2 className="text-lg font-semibold">Additional Information</h2>
          
          {request.reason && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">Reason for Request</h3>
              <p className="text-base whitespace-pre-wrap">{request.reason}</p>
            </div>
          )}
          
          {request.notes && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">Notes</h3>
              <p className="text-base whitespace-pre-wrap">{request.notes}</p>
            </div>
          )}
        </Card>
      )}

      {canViewInternal && request.internalNotes && (
        <Card className="p-6 space-y-4 border-orange-200 bg-orange-50/50">
          <h2 className="text-lg font-semibold text-orange-800">Internal Notes</h2>
          <p className="text-base whitespace-pre-wrap">{request.internalNotes}</p>
        </Card>
      )}

      {request.status === "REJECTED" && request.rejectedReason && (
        <Card className="p-6 space-y-4 border-red-200 bg-red-50/50">
          <h2 className="text-lg font-semibold text-red-800 flex items-center gap-2">
            <XCircle className="h-5 w-5" />
            Rejection Reason
          </h2>
          <p className="text-base whitespace-pre-wrap">{request.rejectedReason}</p>
        </Card>
      )}

      <div className="flex justify-end">
        <EquipmentRequestStatusActions request={request} />
      </div>
    </div>
  )
}