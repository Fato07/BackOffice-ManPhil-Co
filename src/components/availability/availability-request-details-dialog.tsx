"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Mail, 
  Phone, 
  Calendar,
  Users,
  Clock,
  MessageSquare,
  CheckCircle,
  XCircle,
  AlertCircle,
  User,
  MapPin
} from "lucide-react"
import { format, formatDistanceToNow } from "date-fns"
import { AvailabilityRequestStatus, AvailabilityRequestUrgency } from "@/generated/prisma"
import { usePermissions } from "@/hooks/use-permissions"
import { toast } from "sonner"

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

interface AvailabilityRequestDetailsDialogProps {
  request: AvailabilityRequest | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm?: (request: AvailabilityRequest) => Promise<void>
  onReject?: (request: AvailabilityRequest) => Promise<void>
}

export function AvailabilityRequestDetailsDialog({ 
  request, 
  open, 
  onOpenChange,
  onConfirm,
  onReject
}: AvailabilityRequestDetailsDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { canEditSection } = usePermissions()
  
  const canManageRequests = canEditSection('bookings')
  
  if (!request) return null

  const nights = Math.ceil((request.endDate.getTime() - request.startDate.getTime()) / (1000 * 60 * 60 * 24))
  const isPending = request.status === AvailabilityRequestStatus.PENDING

  const getStatusIcon = (status: AvailabilityRequestStatus) => {
    switch (status) {
      case AvailabilityRequestStatus.CONFIRMED:
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case AvailabilityRequestStatus.REJECTED:
        return <XCircle className="h-4 w-4 text-red-600" />
      case AvailabilityRequestStatus.PENDING:
        return <AlertCircle className="h-4 w-4 text-yellow-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusStyle = (status: AvailabilityRequestStatus) => {
    switch (status) {
      case AvailabilityRequestStatus.CONFIRMED:
        return "bg-green-100/80 text-green-700 border-green-200/50"
      case AvailabilityRequestStatus.REJECTED:
        return "bg-red-100/80 text-red-700 border-red-200/50"
      case AvailabilityRequestStatus.PENDING:
        return "bg-yellow-100/80 text-yellow-700 border-yellow-200/50"
      default:
        return "bg-gray-100/80 text-gray-700 border-gray-200/50"
    }
  }

  const getUrgencyStyle = (urgency: AvailabilityRequestUrgency) => {
    switch (urgency) {
      case AvailabilityRequestUrgency.HIGH:
        return "bg-red-100/80 text-red-700 border-red-200/50"
      case AvailabilityRequestUrgency.MEDIUM:
        return "bg-yellow-100/80 text-yellow-700 border-yellow-200/50"
      case AvailabilityRequestUrgency.LOW:
        return "bg-blue-100/80 text-blue-700 border-blue-200/50"
      default:
        return "bg-gray-100/80 text-gray-700 border-gray-200/50"
    }
  }

  const handleConfirm = async () => {
    if (!onConfirm) return
    
    setIsLoading(true)
    try {
      await onConfirm(request)
      toast.success("Availability request confirmed successfully")
      onOpenChange(false)
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
      toast.success("Availability request rejected")
      onOpenChange(false)
    } catch (error) {
      toast.error("Failed to reject request")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="text-xl font-semibold">Availability Request Details</DialogTitle>
          <DialogDescription>
            Review the complete availability request information
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh]">
          <div className="px-6 py-4 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {getStatusIcon(request.status)}
                <Badge 
                  variant="outline" 
                  className={`${getStatusStyle(request.status)} font-medium`}
                >
                  {request.status === AvailabilityRequestStatus.CONFIRMED ? "Confirmed" : 
                   request.status === AvailabilityRequestStatus.REJECTED ? "Rejected" : "Pending"}
                </Badge>
                <Badge 
                  variant="outline" 
                  className={`${getUrgencyStyle(request.urgency)} font-medium`}
                >
                  {request.urgency} Priority
                </Badge>
              </div>
              {request.property && (
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin className="h-4 w-4 mr-1" />
                  {request.property.name}
                </div>
              )}
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <User className="h-5 w-5 mr-2" />
                  Guest Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center text-sm">
                      <User className="h-4 w-4 mr-2 text-gray-400" />
                      <span className="font-medium">{request.guestName}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <Mail className="h-4 w-4 mr-2 text-gray-400" />
                      <a 
                        href={`mailto:${request.guestEmail}`}
                        className="text-blue-600 hover:text-blue-800 underline"
                      >
                        {request.guestEmail}
                      </a>
                    </div>
                    <div className="flex items-center text-sm">
                      <Phone className="h-4 w-4 mr-2 text-gray-400" />
                      <a 
                        href={`tel:${request.guestPhone}`}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {request.guestPhone}
                      </a>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center text-sm">
                      <Users className="h-4 w-4 mr-2 text-gray-400" />
                      <span>{request.numberOfGuests} guest{request.numberOfGuests !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Calendar className="h-5 w-5 mr-2" />
                  Stay Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="text-sm text-gray-600">Check-in Date</div>
                    <div className="font-medium">
                      {format(request.startDate, 'EEEE, MMMM do, yyyy')}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm text-gray-600">Check-out Date</div>
                    <div className="font-medium">
                      {format(request.endDate, 'EEEE, MMMM do, yyyy')}
                    </div>
                  </div>
                </div>
                <Separator />
                <div className="text-center py-2">
                  <div className="text-lg font-semibold text-gray-900">
                    {nights} night{nights !== 1 ? 's' : ''}
                  </div>
                  <div className="text-sm text-gray-500">Total duration</div>
                </div>
              </CardContent>
            </Card>

            {request.message && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <MessageSquare className="h-5 w-5 mr-2" />
                    Guest Message
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 whitespace-pre-wrap">{request.message}</p>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Clock className="h-5 w-5 mr-2" />
                  Request Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Submitted</span>
                    <span className="font-medium">
                      {format(request.createdAt, 'MMM d, yyyy \'at\' h:mm a')}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Time ago</span>
                    <span className="text-gray-500">
                      {formatDistanceToNow(request.createdAt, { addSuffix: true })}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>

        {isPending && canManageRequests && (
          <div className="px-6 py-4 border-t bg-gray-50/50">
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={handleReject}
                disabled={isLoading}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject Request
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={isLoading}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Confirm Request
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}