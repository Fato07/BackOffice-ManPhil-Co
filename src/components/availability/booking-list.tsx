"use client"

import { useState, useMemo } from 'react'
import { format } from 'date-fns'
import { Search, Filter, Download, MoreHorizontal, Edit, Trash2, Calendar } from 'lucide-react'

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

import { BookingForm } from "./booking-form"
import { useBookings, useDeleteBooking } from "@/hooks/use-bookings"
import { BOOKING_TYPE_COLORS, formatBookingDisplay } from "@/lib/validations/booking"
import { BookingType, BookingStatus } from "@/generated/prisma"
import { toast } from "sonner"

interface BookingListProps {
  propertyId: string
}

interface Filters {
  search: string
  type: BookingType | 'all'
  status: BookingStatus | 'all'
  dateFrom: Date | undefined
  dateTo: Date | undefined
}

export function BookingList({ propertyId }: BookingListProps) {
  const [filters, setFilters] = useState<Filters>({
    search: '',
    type: 'all',
    status: 'all',
    dateFrom: undefined,
    dateTo: undefined,
  })
  const [selectedBooking, setSelectedBooking] = useState<any>(null)
  const [showBookingForm, setShowBookingForm] = useState(false)

  const { data: bookingData, isLoading } = useBookings({
    propertyId,
    search: filters.search || undefined,
    type: filters.type !== 'all' ? [filters.type] : undefined,
    status: filters.status !== 'all' ? [filters.status] : undefined,
    startDate: filters.dateFrom,
    endDate: filters.dateTo,
    page: 1,
    limit: 100, // Load more for better UX
    sortBy: 'startDate',
    sortOrder: 'desc',
  })

  const bookings = bookingData?.bookings || []

  const deleteMutation = useDeleteBooking()

  // Filter bookings client-side for better responsiveness
  const filteredBookings = useMemo(() => {
    return bookings.filter((booking) => {
      const matchesSearch = !filters.search || 
        booking.guestName?.toLowerCase().includes(filters.search.toLowerCase()) ||
        booking.guestEmail?.toLowerCase().includes(filters.search.toLowerCase()) ||
        booking.id.toLowerCase().includes(filters.search.toLowerCase())

      const matchesType = filters.type === 'all' || booking.type === filters.type
      const matchesStatus = filters.status === 'all' || booking.status === filters.status

      const bookingStart = new Date(booking.startDate)
      const bookingEnd = new Date(booking.endDate)
      const matchesDateRange = 
        (!filters.dateFrom || bookingEnd >= filters.dateFrom) &&
        (!filters.dateTo || bookingStart <= filters.dateTo)

      return matchesSearch && matchesType && matchesStatus && matchesDateRange
    })
  }, [bookings, filters])

  const handleEdit = (booking: any) => {
    setSelectedBooking(booking)
    setShowBookingForm(true)
  }

  const handleDelete = async (booking: any) => {
    if (confirm(`Are you sure you want to delete the booking for ${formatBookingDisplay(booking)}?`)) {
      try {
        await deleteMutation.mutateAsync(booking.id)
        toast.success('Booking deleted successfully')
      } catch (error) {
        toast.error('Failed to delete booking')
      }
    }
  }

  const handleExport = () => {
    // Create CSV content
    const headers = ['Date Range', 'Type', 'Status', 'Guest Name', 'Guests', 'Amount', 'Notes']
    const csvContent = [
      headers.join(','),
      ...filteredBookings.map(booking => [
        `"${format(new Date(booking.startDate), 'MMM d')} - ${format(new Date(booking.endDate), 'MMM d, yyyy')}"`,
        booking.type,
        booking.status,
        `"${booking.guestName || ''}"`,
        booking.numberOfGuests || '',
        booking.totalAmount || '',
        `"${booking.notes?.replace(/"/g, '""') || ''}"`,
      ].join(','))
    ].join('\n')

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `bookings-${format(new Date(), 'yyyy-MM-dd')}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const resetFilters = () => {
    setFilters({
      search: '',
      type: 'all',
      status: 'all',
      dateFrom: undefined,
      dateTo: undefined,
    })
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-lg border">
        <div className="flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Booking History</h3>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={resetFilters}>
                <Filter className="h-4 w-4 mr-1" />
                Clear Filters
              </Button>
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="h-4 w-4 mr-1" />
                Export CSV
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search bookings..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="pl-10"
              />
            </div>

            <Select
              value={filters.type}
              onValueChange={(value) => setFilters(prev => ({ ...prev, type: value as BookingType | 'all' }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {Object.values(BookingType).map((type) => (
                  <SelectItem key={type} value={type}>
                    {type.replace('_', ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.status}
              onValueChange={(value) => setFilters(prev => ({ ...prev, status: value as BookingStatus | 'all' }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {Object.values(BookingStatus).map((status) => (
                  <SelectItem key={status} value={status}>
                    {status.replace('_', ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="justify-start text-left font-normal">
                  <Calendar className="mr-2 h-4 w-4" />
                  {filters.dateFrom ? format(filters.dateFrom, 'MMM d, yyyy') : 'From Date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <CalendarComponent
                  mode="single"
                  selected={filters.dateFrom}
                  onSelect={(date) => setFilters(prev => ({ ...prev, dateFrom: date }))}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="justify-start text-left font-normal">
                  <Calendar className="mr-2 h-4 w-4" />
                  {filters.dateTo ? format(filters.dateTo, 'MMM d, yyyy') : 'To Date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <CalendarComponent
                  mode="single"
                  selected={filters.dateTo}
                  onSelect={(date) => setFilters(prev => ({ ...prev, dateTo: date }))}
                  initialFocus
                  disabled={(date) => filters.dateFrom ? date < filters.dateFrom : false}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            {filteredBookings.length} booking{filteredBookings.length !== 1 ? 's' : ''} found
          </p>
        </div>

        {filteredBookings.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No bookings found matching your criteria</p>
            <Button variant="outline" onClick={resetFilters} className="mt-2">
              Clear filters to see all bookings
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredBookings.map((booking) => {
              const colors = BOOKING_TYPE_COLORS[booking.type as BookingType]
              const nights = Math.ceil((new Date(booking.endDate).getTime() - new Date(booking.startDate).getTime()) / (1000 * 60 * 60 * 24))
              
              return (
                <div
                  key={booking.id}
                  className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex flex-col">
                        <div className="flex items-center space-x-2">
                          <Badge 
                            variant="outline" 
                            className={`${colors.bg} ${colors.text}`}
                          >
                            {formatBookingDisplay(booking)}
                          </Badge>
                          <Badge variant="secondary">
                            {booking.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-4 mt-2">
                          <span className="text-sm font-medium text-gray-900">
                            {format(new Date(booking.startDate), 'MMM d')} - {format(new Date(booking.endDate), 'MMM d, yyyy')}
                          </span>
                          <span className="text-sm text-gray-500">
                            {nights} night{nights !== 1 ? 's' : ''}
                          </span>
                          {booking.numberOfGuests && (
                            <span className="text-sm text-gray-500">
                              {booking.numberOfGuests} guest{booking.numberOfGuests !== 1 ? 's' : ''}
                            </span>
                          )}
                          {booking.totalAmount && (
                            <span className="text-sm font-medium text-gray-900">
                              €{booking.totalAmount.toLocaleString()}
                            </span>
                          )}
                        </div>
                        {booking.notes && (
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {booking.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(booking)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDelete(booking)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <BookingForm
        isOpen={showBookingForm}
        propertyId={propertyId}
        booking={selectedBooking}
        onClose={() => {
          setShowBookingForm(false)
          setSelectedBooking(null)
        }}
      />
    </div>
  )
}