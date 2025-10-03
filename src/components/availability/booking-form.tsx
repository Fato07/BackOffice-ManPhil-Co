"use client"

import React, { useEffect, useCallback, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { format, startOfDay, endOfDay, addDays } from 'date-fns'
import { CalendarIcon, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"

import { cn } from "@/lib/utils"
import { bookingFormSchema, BOOKING_TYPE_COLORS, CreateBookingInput, GUEST_BOOKING_TYPES } from "@/lib/validations/booking"
import { BookingType, BookingStatus, BookingSource } from "@/generated/prisma"
import { z } from "zod"
import { useCreateBooking, useUpdateBooking, useCheckAvailability } from "@/hooks/use-bookings"
import { useDebounce } from "@/hooks/use-debounce"
import { toast } from "sonner"

interface BookingFormProps {
  isOpen: boolean
  onClose: () => void
  propertyId: string
  dateRange?: { start: Date; end: Date } // Optional date range from calendar
  booking?: {
    id: string
    startDate: Date
    endDate: Date
    type: BookingType
    status: BookingStatus
    guestName?: string | null
    guestEmail?: string | null
    guestPhone?: string | null
    numberOfGuests?: number | null
    totalAmount?: number | null
    notes?: string | null
  } // Optional booking for edit mode
}

type BookingFormData = z.infer<typeof bookingFormSchema>

// Move helper functions outside component to prevent recreation
const getDefaultStartDate = (dateRange?: { start: Date; end: Date }) => {
  if (dateRange?.start) return dateRange.start
  return startOfDay(new Date()) // Default to today
}

const getDefaultEndDate = (dateRange?: { start: Date; end: Date }) => {
  if (dateRange?.end) return dateRange.end
  // Default to tomorrow (1-night minimum stay)
  return endOfDay(addDays(getDefaultStartDate(dateRange), 1))
}

export const BookingForm = React.memo(function BookingForm({ isOpen, onClose, propertyId, dateRange, booking }: BookingFormProps) {

  const form = useForm<BookingFormData>({
    resolver: zodResolver(bookingFormSchema) as any,
    defaultValues: {
      type: booking?.type || BookingType.TENTATIVE,
      status: booking?.status || BookingStatus.CONFIRMED,
      startDate: booking?.startDate || getDefaultStartDate(dateRange),
      endDate: booking?.endDate || getDefaultEndDate(dateRange),
      guestName: booking?.guestName || '',
      guestEmail: booking?.guestEmail || '',
      guestPhone: booking?.guestPhone || '',
      numberOfGuests: booking?.numberOfGuests || undefined,
      totalAmount: booking?.totalAmount || undefined,
      notes: booking?.notes || '',
    },
  })

  const createMutation = useCreateBooking()
  const updateMutation = useUpdateBooking()
  
  const isEditMode = !!booking

  const startDate = form.watch('startDate')
  const endDate = form.watch('endDate')
  const bookingType = form.watch('type')
  
  // Debounce date values to reduce API calls during rapid date selection
  const debouncedStartDate = useDebounce(startDate, 300)
  const debouncedEndDate = useDebounce(endDate, 300)
  
  // Simple state for clean UI
  const [isSelectingAlternative, setIsSelectingAlternative] = useState(false)
  
  // Auto-update end date when start date changes (ensure minimum 1-night stay)
  useEffect(() => {
    if (startDate && endDate && startDate >= endDate) {
      // If end date is same or before start date, set it to next day
      form.setValue('endDate', endOfDay(addDays(startDate, 1)))
    }
  }, [startDate, endDate, form])

  // Reset form when sheet opens with new data
  useEffect(() => {
    if (isOpen) {
      form.reset({
        type: booking?.type || BookingType.TENTATIVE,
        status: booking?.status || BookingStatus.CONFIRMED,
        startDate: booking?.startDate || getDefaultStartDate(dateRange),
        endDate: booking?.endDate || getDefaultEndDate(dateRange),
        guestName: booking?.guestName || '',
        guestEmail: booking?.guestEmail || '',
        guestPhone: booking?.guestPhone || '',
        numberOfGuests: booking?.numberOfGuests || undefined,
        totalAmount: booking?.totalAmount || undefined,
        notes: booking?.notes || '',
      })
    }
  }, [isOpen, dateRange?.start, dateRange?.end, booking, form])

  // Check availability when dates change - use debounced values to prevent excessive API calls
  const availabilityInput = useMemo(() => {
    return debouncedStartDate && debouncedEndDate && debouncedStartDate < debouncedEndDate ? {
      propertyId,
      startDate: debouncedStartDate,
      endDate: debouncedEndDate,
    } : null
  }, [propertyId, debouncedStartDate, debouncedEndDate])
  
  // Simple availability check only
  const excludeBookingId = isEditMode ? booking?.id : undefined
  
  const { data: availabilityCheck, isLoading: checkingAvailability } = useCheckAvailability(availabilityInput)

  const hasConflicts = availabilityCheck && !availabilityCheck.available
  const isAvailable = availabilityCheck?.available || false

  // Reset alternative selection state when dates change
  useEffect(() => {
    setIsSelectingAlternative(false)
  }, [debouncedStartDate, debouncedEndDate])

  // Simple alternative dates - just get next 3 available slots
  const alternativeDates = useMemo(() => {
    if (!hasConflicts || !startDate || !endDate) return []
    
    const duration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    const alternatives = []
    const currentStart = new Date(startDate)
    
    // Generate 3 simple alternatives: +3 days, +7 days, +14 days
    for (let i = 0; i < 3; i++) {
      const daysToAdd = (i + 1) * 7 // 7, 14, 21 days ahead
      const newStart = new Date(currentStart)
      newStart.setDate(newStart.getDate() + daysToAdd)
      const newEnd = new Date(newStart)
      newEnd.setDate(newEnd.getDate() + duration)
      
      alternatives.push({
        startDate: newStart,
        endDate: newEnd,
        label: `${format(newStart, 'MMM d')} - ${format(newEnd, 'MMM d')}`
      })
    }
    
    return alternatives
  }, [hasConflicts, startDate, endDate])
  
  // Simple function to apply alternative dates
  const applyAlternativeDate = useCallback((alternative: any) => {
    setIsSelectingAlternative(true)
    form.setValue('startDate', alternative.startDate)
    form.setValue('endDate', alternative.endDate)
    
    // Reset selection state after brief delay
    setTimeout(() => setIsSelectingAlternative(false), 300)
    
    toast.success(`Updated to: ${alternative.label}`)
  }, [form])

  const onSubmit = async (data: BookingFormData) => {
    try {
      if (isEditMode && booking) {
        // Update existing booking
        const updateData = {
          type: data.type,
          status: data.status || BookingStatus.CONFIRMED,
          startDate: data.startDate,
          endDate: data.endDate,
          guestName: data.guestName || null,
          guestEmail: data.guestEmail || null,
          guestPhone: data.guestPhone || null,
          numberOfGuests: data.numberOfGuests || null,
          totalAmount: data.totalAmount || null,
          notes: data.notes || null,
        }
        await updateMutation.mutateAsync({ id: booking.id, data: updateData })
        toast.success('Booking updated successfully')
      } else {
        // Create new booking
        const createData: CreateBookingInput = {
          propertyId,
          type: data.type,
          status: data.status || BookingStatus.CONFIRMED, // Default to CONFIRMED if not provided
          source: BookingSource.MANUAL, // Always set to MANUAL for form submissions
          startDate: data.startDate,
          endDate: data.endDate,
          guestName: data.guestName || null,
          guestEmail: data.guestEmail || null,
          guestPhone: data.guestPhone || null,
          numberOfGuests: data.numberOfGuests || null,
          totalAmount: data.totalAmount || null,
          notes: data.notes || null,
        }
        await createMutation.mutateAsync(createData)
        toast.success('Booking created successfully')
      }
      
      // Reset form and close
      form.reset()
      onClose()
    } catch (error) {
      // Show more specific error message if available
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      toast.error(`Failed to ${isEditMode ? 'update' : 'create'} booking: ${errorMessage}`)
    }
  }

  const isLoading = createMutation.isPending || updateMutation.isPending

  // Helper to check if guest fields should be shown
  const showGuestFields = (GUEST_BOOKING_TYPES as readonly BookingType[]).includes(bookingType)

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-md p-0">
        <SheetHeader className="px-4 py-4 border-b">
          <SheetTitle className="text-lg">{isEditMode ? 'Edit Booking' : 'Create New Booking'}</SheetTitle>
          <SheetDescription className="text-sm">
            {isEditMode ? 'Update the booking details below.' : 'Fill in the details to create a new booking for this property.'}
          </SheetDescription>
        </SheetHeader>
        
        <ScrollArea className="h-[calc(100vh-160px)]">
          <div className="space-y-4 p-4 pb-8">

          <Form {...form}>
            <form id="booking-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Booking Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose booking type for this reservation" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.values(BookingType).map((type) => (
                            <SelectItem key={type} value={type}>
                              <div className="flex items-center space-x-2">
                                <div 
                                  className={`w-3 h-3 rounded-full ${BOOKING_TYPE_COLORS[type].bg}`}
                                  style={{ backgroundColor: BOOKING_TYPE_COLORS[type].hex }}
                                />
                                <span>{type.replace('_', ' ')}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Set booking status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.values(BookingStatus).map((status) => (
                            <SelectItem key={status} value={status}>
                              {status.replace('_', ' ')}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            </div>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Check-in Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Select check-in date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={(date) => date && field.onChange(startOfDay(date))}
                            disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Check-out Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Select check-out date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={(date) => date && field.onChange(endOfDay(date))}
                            disabled={(date) => date < startDate}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              {startDate && endDate && startDate < endDate && (
                <div className="text-center py-2">
                  <span className="text-sm text-gray-500">
                    Duration: {Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))} night{Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) !== 1 ? 's' : ''}
                  </span>
                </div>
              )}
            </div>

            {checkingAvailability && (
              <Alert>
                <Loader2 className="h-4 w-4 animate-spin" />
                <AlertDescription>Checking availability...</AlertDescription>
              </Alert>
            )}

            {startDate && endDate && startDate >= endDate && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  End date must be after start date. Minimum stay is 1 night.
                </AlertDescription>
              </Alert>
            )}

            {availabilityCheck && startDate && endDate && startDate < endDate && (
              <div className="space-y-3">
                {isAvailable && (
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      These dates are available for booking.
                    </AlertDescription>
                  </Alert>
                )}

                {hasConflicts && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="space-y-3">
                        <div className="font-medium">Dates unavailable - booking conflict detected</div>
                        
                        {alternativeDates.length > 0 && (
                          <div className="space-y-2">
                            <div className="text-sm text-gray-700 mb-2">Try these alternative dates:</div>
                            <div className="flex flex-wrap gap-2">
                              {alternativeDates.map((alternative, idx) => (
                                <Button
                                  key={idx}
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => applyAlternativeDate(alternative)}
                                  className="text-sm"
                                  disabled={isSelectingAlternative}
                                >
                                  {alternative.label}
                                </Button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            {showGuestFields && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="guestName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Guest Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Primary guest name" {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="numberOfGuests"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Number of Guests</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="1"
                            placeholder="Total guests staying"
                            value={field.value ?? ''}
                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="guestEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input 
                            type="email"
                            placeholder="guest@example.com"
                            {...field}
                            value={field.value || ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="guestPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Guest contact phone"
                            {...field}
                            value={field.value || ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="totalAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Amount (EUR)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0"
                          step="0.01"
                          placeholder="Amount in EUR (e.g. 150.00)"
                          value={field.value ?? ''}
                          onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <div className="space-y-3">
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Any additional information about this booking..."
                        rows={3}
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

          </form>
          </Form>
          
          </div>
        </ScrollArea>

        <div className="absolute bottom-0 left-0 right-0 p-4 bg-background border-t">
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              onClick={form.handleSubmit(onSubmit)}
              disabled={isLoading || hasConflicts || (startDate && endDate && startDate >= endDate)}
              className="flex-1 bg-[#B5985A] hover:bg-[#B5985A]/90 text-white"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditMode ? 'Update Booking' : 'Create Booking'}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
})