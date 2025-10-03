"use client"

import { useMemo, useState } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { format } from 'date-fns'
import { Check, X, Clock, User, Plus } from 'lucide-react'

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { GlassCard } from "@/components/ui/glass-card"
import { DataTable } from "@/components/data-table/data-table"
import { AvailabilityRequestActions } from "./availability-request-actions"
import { CreateAvailabilityRequestDialog } from "./create-availability-request-dialog"
import { AvailabilityRequestDetailsDialog } from "./availability-request-details-dialog"
import { useAvailabilityRequests, useUpdateAvailabilityRequestStatus } from "@/hooks/use-availability-requests"
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
  property?: {
    id: string
    name: string
  }
}

interface AvailabilityRequestsTableProps {
  propertyId: string
}

export function AvailabilityRequestsTable({ propertyId }: AvailabilityRequestsTableProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<AvailabilityRequest | null>(null)
  
  // Fetch availability requests for this property
  const { data: requestData, isLoading } = useAvailabilityRequests({
    propertyId,
    page: 1,
    limit: 50,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  })

  const updateStatusMutation = useUpdateAvailabilityRequestStatus()
  const requests = requestData?.requests || []

  const handleConfirm = async (request: AvailabilityRequest) => {
    await updateStatusMutation.mutateAsync({
      id: request.id,
      status: AvailabilityRequestStatus.CONFIRMED,
    })
  }

  const handleReject = async (request: AvailabilityRequest) => {
    await updateStatusMutation.mutateAsync({
      id: request.id,
      status: AvailabilityRequestStatus.REJECTED,
    })
  }

  const handleView = (request: AvailabilityRequest) => {
    setSelectedRequest(request)
    setShowDetailsDialog(true)
  }

  const columns: ColumnDef<AvailabilityRequest>[] = useMemo(() => [
    {
      accessorKey: "requestedDates",
      header: "REQUESTED DATES",
      cell: ({ row }) => {
        const request = row.original
        const nights = Math.ceil((request.endDate.getTime() - request.startDate.getTime()) / (1000 * 60 * 60 * 24))
        
        return (
          <div className="space-y-1">
            <div className="font-medium text-gray-900 text-sm">
              {format(request.startDate, 'dd/MM/yyyy')} → {format(request.endDate, 'dd/MM/yyyy')}
            </div>
            <div className="text-xs text-gray-500">
              {nights} night{nights !== 1 ? 's' : ''}
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "sentBy",
      header: "SENT BY", 
      cell: ({ row }) => {
        const request = row.original
        return (
          <div className="space-y-1">
            <div className="font-medium text-gray-900 text-sm flex items-center">
              <User className="h-3 w-3 mr-1.5 text-gray-400" />
              {request.guestName}
            </div>
            <div className="text-xs text-gray-500">
              {format(request.createdAt, 'dd/MM/yyyy \'at\' HH:mm')}
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "status",
      header: "STATE",
      cell: ({ row }) => {
        const status = row.getValue("status") as AvailabilityRequestStatus
        
        const getStatusStyle = (status: AvailabilityRequestStatus) => {
          switch (status) {
            case AvailabilityRequestStatus.CONFIRMED:
              return "bg-green-100/80 text-green-700 border-green-200/50 backdrop-blur-sm"
            case AvailabilityRequestStatus.REJECTED:
              return "bg-red-100/80 text-red-700 border-red-200/50 backdrop-blur-sm"
            case AvailabilityRequestStatus.PENDING:
              return "bg-yellow-100/80 text-yellow-700 border-yellow-200/50 backdrop-blur-sm"
            default:
              return "bg-gray-100/80 text-gray-700 border-gray-200/50 backdrop-blur-sm"
          }
        }

        return (
          <Badge 
            variant="outline" 
            className={`${getStatusStyle(status)} font-medium text-xs px-2.5 py-1`}
          >
            {status === AvailabilityRequestStatus.CONFIRMED ? "Confirmed" : 
             status === AvailabilityRequestStatus.REJECTED ? "Rejected" : "Pending"}
          </Badge>
        )
      },
    },
    {
      id: "actions",
      header: "ACTIONS",
      cell: ({ row }) => {
        const request = row.original
        
        return (
          <AvailabilityRequestActions
            request={request}
            onConfirm={handleConfirm}
            onReject={handleReject}
            onView={handleView}
          />
        )
      },
    },
  ], [handleConfirm, handleReject])

  if (isLoading) {
    return (
      <GlassCard variant="luxury" className="overflow-hidden">
        <div className="p-6">
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-100/50 rounded-lg animate-pulse backdrop-blur-sm" />
            ))}
          </div>
        </div>
      </GlassCard>
    )
  }

  return (
    <GlassCard variant="luxury" className="overflow-hidden">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <h3 className="text-lg font-semibold text-gray-900">Availability Requests</h3>
            <Badge variant="secondary" className="bg-yellow-100/80 text-yellow-700 backdrop-blur-sm">
              {requests.filter((r: AvailabilityRequest) => r.status === AvailabilityRequestStatus.PENDING).length} pending
            </Badge>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="bg-white/50 backdrop-blur-sm hover:bg-white/70"
            onClick={() => setShowCreateDialog(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Create a request
          </Button>
        </div>
        
        <DataTable
          columns={columns}
          data={requests}
          enableAnimations={true}
        />
      </div>

      <CreateAvailabilityRequestDialog
        propertyId={propertyId}
        isOpen={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
      />

      <AvailabilityRequestDetailsDialog
        request={selectedRequest}
        open={showDetailsDialog}
        onOpenChange={(open) => {
          setShowDetailsDialog(open)
          if (!open) {
            setSelectedRequest(null)
          }
        }}
        onConfirm={handleConfirm}
        onReject={handleReject}
      />
    </GlassCard>
  )
}