"use client"

import { useMemo, useState } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { format } from 'date-fns'

import { Badge } from "@/components/ui/badge"
import { GlassCard } from "@/components/ui/glass-card"
import { DataTable } from "@/components/data-table/data-table"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { BookingForm } from "./booking-form"
import { BookingActions } from "./booking-actions"
import { useBookings, useDeleteBooking } from "@/hooks/use-bookings"
import { useUser } from "@/hooks/use-user"
import { BOOKING_TYPE_COLORS } from "@/lib/validations/booking"
import { BookingType, BookingStatus } from "@/generated/prisma"
import { toast } from "sonner"

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

// Component to display user information
function UserDisplay({ userId }: { userId?: string | null }) {
  const { data: user, isLoading } = useUser(userId || undefined)
  
  if (isLoading) {
    return <div className="text-sm text-gray-400">Loading...</div>
  }
  
  if (!user) {
    return <div className="text-sm text-gray-400">Unknown user</div>
  }
  
  return (
    <div className="font-medium text-gray-900 text-sm">
      {user.fullName}
    </div>
  )
}

interface BookingHistoryTableProps {
  propertyId: string
}

export function BookingHistoryTable({ propertyId }: BookingHistoryTableProps) {
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [showEditForm, setShowEditForm] = useState(false)
  
  const { data: bookingData, isLoading } = useBookings({
    propertyId,
    page: 1,
    limit: 50,
    sortBy: 'startDate',
    sortOrder: 'desc',
  })

  const deleteMutation = useDeleteBooking()
  const bookings = bookingData?.bookings || []

  const handleEdit = (booking: Booking) => {
    setSelectedBooking(booking)
    setShowEditForm(true)
  }

  const handleDelete = async (booking: Booking) => {
    try {
      await deleteMutation.mutateAsync(booking.id)
      toast.success('Booking deleted successfully')
    } catch (error) {
      toast.error('Failed to delete booking')
    }
  }

  const handleView = (booking: Booking) => {
    // For now, just open edit mode for viewing
    handleEdit(booking)
  }

  const columns: ColumnDef<Booking>[] = useMemo(() => [
    {
      accessorKey: "checkIn",
      header: "CHECK-IN",
      cell: ({ row }) => {
        const booking = row.original
        return (
          <div className="font-medium text-gray-900 text-sm">
            {format(new Date(booking.startDate), 'dd/MM/yyyy')}
          </div>
        )
      },
    },
    {
      accessorKey: "checkOut", 
      header: "CHECK-OUT",
      cell: ({ row }) => {
        const booking = row.original
        return (
          <div className="font-medium text-gray-900 text-sm">
            {format(new Date(booking.endDate), 'dd/MM/yyyy')}
          </div>
        )
      },
    },
    {
      accessorKey: "type",
      header: "TYPE",
      cell: ({ row }) => {
        const type = row.getValue("type") as BookingType
        const colors = BOOKING_TYPE_COLORS[type]
        
        return (
          <Badge 
            variant="outline" 
            className={`${colors.bg} ${colors.text} ${colors.border} font-medium text-xs px-2.5 py-1 backdrop-blur-sm`}
          >
            {type === "OWNER_STAY" ? "Owner Stay" : type.replace('_', ' ')}
          </Badge>
        )
      },
    },
    {
      accessorKey: "client",
      header: "CLIENT",
      cell: ({ row }) => {
        const booking = row.original
        
        if (!booking.guestName) {
          return <span className="text-gray-400 text-sm">/</span>
        }
        
        return (
          <div className="space-y-1">
            <div className="font-medium text-gray-900 text-sm">
              {booking.guestName}
            </div>
            {booking.numberOfGuests && (
              <div className="text-xs text-gray-500">
                {booking.numberOfGuests} guest{booking.numberOfGuests !== 1 ? 's' : ''}
              </div>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: "updatedBy",
      header: "UPDATED BY",
      cell: ({ row }) => {
        const booking = row.original
        return (
          <div className="space-y-1">
            <UserDisplay userId={booking.updatedBy || booking.createdBy} />
            <div className="text-xs text-gray-500">
              {format(new Date(booking.updatedAt), 'dd/MM/yyyy \'at\' HH:mm')}
            </div>
          </div>
        )
      },
    },
    {
      id: "actions",
      header: "ACTIONS",
      cell: ({ row }) => {
        const booking = row.original
        
        return (
          <BookingActions
            booking={booking}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onView={handleView}
          />
        )
      },
    },
  ], [handleEdit, handleDelete, handleView])

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
            <h3 className="text-lg font-semibold text-gray-900">Booking History</h3>
            <Badge variant="secondary" className="bg-blue-100/80 text-blue-700 backdrop-blur-sm">
              {bookings.length} booking{bookings.length !== 1 ? 's' : ''}
            </Badge>
          </div>
        </div>
        
        <DataTable
          columns={columns}
          data={bookings}
          enableAnimations={true}
        />
      </div>

      <Sheet open={showEditForm} onOpenChange={setShowEditForm}>
        <SheetContent className="w-full sm:max-w-md">
          {selectedBooking && (
            <BookingForm
              propertyId={propertyId}
              booking={selectedBooking}
              isOpen={showEditForm}
              onClose={() => {
                setShowEditForm(false)
                setSelectedBooking(null)
              }}
            />
          )}
        </SheetContent>
      </Sheet>
    </GlassCard>
  )
}