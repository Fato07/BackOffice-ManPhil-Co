import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  createBooking,
  updateBooking,
  deleteBooking,
  getBookings,
  getBookingById,
  checkAvailability,
  checkAdvancedAvailability,
  importBookings,
  getBookingStats,
} from '@/actions/bookings'
import type {
  CreateBookingInput,
  UpdateBookingInput,
  BookingFilters,
  CheckAvailabilityInput,
  AdvancedAvailabilityCheckInput,
  ImportBookingsInput,
} from '@/lib/validations/booking'
import type {
  BookingsResponse,
  BookingDetail,
  BasicAvailabilityResult,
  AdvancedAvailabilityResult,
  BookingStatistics,
  BookingImportResult,
} from '@/types/booking'

// Query keys factory
export const bookingKeys = {
  all: ['bookings'] as const,
  lists: () => [...bookingKeys.all, 'list'] as const,
  list: (filters: BookingFilters) => [...bookingKeys.lists(), filters] as const,
  details: () => [...bookingKeys.all, 'detail'] as const,
  detail: (id: string) => [...bookingKeys.details(), id] as const,
  availability: (propertyId: string) => [...bookingKeys.all, 'availability', propertyId] as const,
  advancedAvailability: (input: AdvancedAvailabilityCheckInput) => 
    [...bookingKeys.all, 'advanced-availability', input] as const,
  stats: (propertyId: string, startDate: Date, endDate: Date) => 
    [...bookingKeys.all, 'stats', propertyId, startDate, endDate] as const,
}

// Hook to fetch bookings with filters
export function useBookings(filters: BookingFilters) {
  return useQuery({
    queryKey: bookingKeys.list(filters),
    queryFn: async () => {
      const result = await getBookings(filters)
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch bookings')
      }
      return result.data
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Hook to fetch a single booking
export function useBooking(id: string | null | undefined) {
  return useQuery({
    queryKey: bookingKeys.detail(id!),
    queryFn: async () => {
      if (!id) throw new Error('Booking ID is required')
      const result = await getBookingById(id)
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch booking')
      }
      return result.data
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Hook to check availability
export function useCheckAvailability(input: CheckAvailabilityInput | null) {
  return useQuery({
    queryKey: input ? ['availability', input] : ['availability'],
    queryFn: async () => {
      if (!input) throw new Error('Availability input is required')
      const result = await checkAvailability(input)
      if (!result.success) {
        throw new Error(result.error || 'Failed to check availability')
      }
      return result.data
    },
    enabled: !!input,
    staleTime: 1 * 60 * 1000, // 1 minute
  })
}

// Hook to check advanced availability with conflict analysis and suggestions
export function useAdvancedAvailability(input: AdvancedAvailabilityCheckInput | null) {
  return useQuery({
    queryKey: input ? bookingKeys.advancedAvailability(input) : ['advanced-availability'],
    queryFn: async () => {
      if (!input) throw new Error('Advanced availability input is required')
      const result = await checkAdvancedAvailability(input)
      if (!result.success) {
        throw new Error(result.error || 'Failed to check advanced availability')
      }
      return result.data
    },
    enabled: !!input,
    staleTime: 30 * 1000, // 30 seconds - shorter cache for real-time conflict detection
  })
}

// Hook to get booking statistics
export function useBookingStats(propertyId: string, startDate: Date, endDate: Date) {
  return useQuery({
    queryKey: bookingKeys.stats(propertyId, startDate, endDate),
    queryFn: async () => {
      const result = await getBookingStats(propertyId, startDate, endDate)
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch booking statistics')
      }
      return result.data
    },
    enabled: !!propertyId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

// Hook to create a booking
export function useCreateBooking() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateBookingInput) => {
      const result = await createBooking(input)
      if (!result.success) {
        throw new Error(result.error || 'Failed to create booking')
      }
      return result.data
    },
    onSuccess: (data, variables) => {
      // Invalidate bookings list and availability
      queryClient.invalidateQueries({ queryKey: bookingKeys.lists() })
      queryClient.invalidateQueries({ queryKey: bookingKeys.availability(variables.propertyId) })
      queryClient.invalidateQueries({ queryKey: ['advanced-availability'] })
      queryClient.invalidateQueries({ queryKey: ['properties', variables.propertyId] })
      
      // Don't show toast here - let form handle it
    },
    onError: (error) => {
      // Don't show toast here - let form handle it with better error messages
    },
  })
}

// Hook to update a booking
export function useUpdateBooking() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateBookingInput }) => {
      const result = await updateBooking(id, data)
      if (!result.success) {
        throw new Error(result.error || 'Failed to update booking')
      }
      return result.data
    },
    onSuccess: (data, variables) => {
      // Invalidate specific booking and lists
      queryClient.invalidateQueries({ queryKey: bookingKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: bookingKeys.lists() })
      if (data?.propertyId) {
        queryClient.invalidateQueries({ queryKey: bookingKeys.availability(data.propertyId) })
        queryClient.invalidateQueries({ queryKey: ['properties', data.propertyId] })
      }
      queryClient.invalidateQueries({ queryKey: ['advanced-availability'] })
      
      // Don't show toast here - let form handle it
    },
    onError: (error) => {
      // Don't show toast here - let form handle it with better error messages
    },
  })
}

// Hook to delete a booking
export function useDeleteBooking() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteBooking(id)
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete booking')
      }
      return result.data
    },
    onSuccess: (data, bookingId) => {
      // Invalidate bookings and availability
      queryClient.invalidateQueries({ queryKey: bookingKeys.lists() })
      queryClient.invalidateQueries({ queryKey: bookingKeys.detail(bookingId) })
      // We need to invalidate all availability queries since we don't have propertyId here
      queryClient.invalidateQueries({ queryKey: ['availability'] })
      queryClient.invalidateQueries({ queryKey: ['advanced-availability'] })
      queryClient.invalidateQueries({ queryKey: ['properties'] })
      
      // Don't show toast here - let form handle it
    },
    onError: (error) => {
      // Don't show toast here - let form handle it with better error messages
    },
  })
}

// Hook to import bookings
export function useImportBookings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: ImportBookingsInput) => {
      const result = await importBookings(input)
      if (!result.success) {
        throw new Error(result.error || 'Failed to import bookings')
      }
      return result.data
    },
    onSuccess: (data, variables) => {
      // Invalidate bookings and availability for the property
      queryClient.invalidateQueries({ queryKey: bookingKeys.lists() })
      queryClient.invalidateQueries({ queryKey: bookingKeys.availability(variables.propertyId) })
      queryClient.invalidateQueries({ queryKey: ['advanced-availability'] })
      queryClient.invalidateQueries({ queryKey: ['properties', variables.propertyId] })
      
      const message = data?.failed 
        ? `Imported ${data.imported} bookings. ${data.failed} failed.`
        : `Successfully imported ${data?.imported || 0} bookings`
      
      if (data?.failed && data.errors) {
        toast.error(message, {
          description: data.errors.join('\n'),
        })
      } else {
        toast.success(message)
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to import bookings')
    },
  })
}

// Optimistic update helper for bookings
export function useOptimisticBookingUpdate() {
  const queryClient = useQueryClient()

  const optimisticUpdate = (bookingId: string, updates: Partial<BookingDetail>) => {
    // Update the specific booking
    queryClient.setQueryData(bookingKeys.detail(bookingId), (old: BookingDetail | undefined) => {
      if (!old) return old
      return { ...old, ...updates }
    })

    // Update in lists
    queryClient.setQueriesData(
      { queryKey: bookingKeys.lists(), exact: false },
      (old: BookingsResponse | undefined) => {
        if (!old?.bookings) return old
        return {
          ...old,
          bookings: old.bookings.map((booking) =>
            booking.id === bookingId ? { ...booking, ...updates } : booking
          ),
        }
      }
    )
  }

  return optimisticUpdate
}