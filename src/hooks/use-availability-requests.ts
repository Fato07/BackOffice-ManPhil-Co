import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  createAvailabilityRequest,
  updateAvailabilityRequestStatus,
  deleteAvailabilityRequest,
  getAvailabilityRequests,
  getAvailabilityRequestById,
} from '@/actions/availability-requests'
import type {
  CreateAvailabilityRequestInput,
  UpdateAvailabilityRequestStatusInput,
  AvailabilityRequestFilters,
  DeleteAvailabilityRequestInput,
} from '@/lib/validations/availability-request'

// Query keys factory
export const availabilityRequestKeys = {
  all: ['availability-requests'] as const,
  lists: () => [...availabilityRequestKeys.all, 'list'] as const,
  list: (filters: AvailabilityRequestFilters) => [...availabilityRequestKeys.lists(), filters] as const,
  details: () => [...availabilityRequestKeys.all, 'detail'] as const,
  detail: (id: string) => [...availabilityRequestKeys.details(), id] as const,
}

// Hook to fetch availability requests with filters
export function useAvailabilityRequests(filters: AvailabilityRequestFilters) {
  return useQuery({
    queryKey: availabilityRequestKeys.list(filters),
    queryFn: async () => {
      const result = await getAvailabilityRequests(filters)
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch availability requests')
      }
      return result.data
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Hook to fetch a single availability request
export function useAvailabilityRequest(id: string | null | undefined) {
  return useQuery({
    queryKey: availabilityRequestKeys.detail(id!),
    queryFn: async () => {
      const result = await getAvailabilityRequestById(id!)
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch availability request')
      }
      return result.data
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Hook to create a new availability request
export function useCreateAvailabilityRequest() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateAvailabilityRequestInput) => {
      const result = await createAvailabilityRequest(input)
      if (!result.success) {
        throw new Error(result.error || 'Failed to create availability request')
      }
      return result.data
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch relevant queries
      queryClient.invalidateQueries({ queryKey: availabilityRequestKeys.all })
      
      // Show success message
      toast.success('Availability request created successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create availability request')
    },
  })
}

// Hook to update availability request status (confirm/reject)
export function useUpdateAvailabilityRequestStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: UpdateAvailabilityRequestStatusInput) => {
      const result = await updateAvailabilityRequestStatus(input)
      if (!result.success) {
        throw new Error(result.error || 'Failed to update request status')
      }
      return result.data
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch relevant queries
      queryClient.invalidateQueries({ queryKey: availabilityRequestKeys.all })
      
      // Show success message based on status
      const action = variables.status === 'CONFIRMED' ? 'confirmed' : 'rejected'
      toast.success(`Availability request ${action} successfully`)
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update request status')
    },
  })
}

// Hook to delete an availability request
export function useDeleteAvailabilityRequest() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: DeleteAvailabilityRequestInput) => {
      const result = await deleteAvailabilityRequest(input)
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete availability request')
      }
      return result.data
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch relevant queries
      queryClient.invalidateQueries({ queryKey: availabilityRequestKeys.all })
      
      // Show success message
      toast.success('Availability request deleted successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete availability request')
    },
  })
}