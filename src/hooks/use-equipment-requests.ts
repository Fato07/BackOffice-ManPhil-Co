import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  getEquipmentRequests,
  getEquipmentRequestById,
  createEquipmentRequest,
  updateEquipmentRequest,
  updateEquipmentRequestStatus,
  deleteEquipmentRequest,
} from "@/actions/equipment-requests"
import {
  EquipmentRequestFilters,
  CreateEquipmentRequestInput,
  UpdateEquipmentRequestInput,
  UpdateEquipmentRequestStatusInput,
} from "@/types/equipment-request"

// Hook for fetching equipment requests list
export function useEquipmentRequests(
  filters: EquipmentRequestFilters,
  page: number = 1,
  limit: number = 10
) {
  return useQuery({
    queryKey: ["equipment-requests", filters, page, limit],
    queryFn: () => getEquipmentRequests(filters, page, limit),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Hook for fetching single equipment request
export function useEquipmentRequest(id: string | undefined) {
  return useQuery({
    queryKey: ["equipment-request", id],
    queryFn: () => id ? getEquipmentRequestById(id) : null,
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  })
}

// Hook for creating equipment request
export function useCreateEquipmentRequest() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateEquipmentRequestInput) => createEquipmentRequest(data),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["equipment-requests"] })
      queryClient.invalidateQueries({ queryKey: ["property", result.data.propertyId] })
      toast.success("Equipment request created successfully")
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create equipment request")
    },
  })
}

// Hook for updating equipment request
export function useUpdateEquipmentRequest() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateEquipmentRequestInput }) =>
      updateEquipmentRequest(id, data),
    onSuccess: (result, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["equipment-requests"] })
      queryClient.invalidateQueries({ queryKey: ["equipment-request", id] })
      toast.success("Equipment request updated successfully")
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update equipment request")
    },
  })
}

// Hook for updating equipment request status
export function useUpdateEquipmentRequestStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateEquipmentRequestStatusInput }) =>
      updateEquipmentRequestStatus(id, data),
    onSuccess: (result, { id, data }) => {
      queryClient.invalidateQueries({ queryKey: ["equipment-requests"] })
      queryClient.invalidateQueries({ queryKey: ["equipment-request", id] })
      queryClient.invalidateQueries({ queryKey: ["property", result.data.propertyId] })
      
      // Show appropriate message based on status
      switch (data.status) {
        case "APPROVED":
          toast.success("Equipment request approved")
          break
        case "REJECTED":
          toast.success("Equipment request rejected")
          break
        case "ORDERED":
          toast.success("Equipment marked as ordered")
          break
        case "DELIVERED":
          toast.success("Equipment marked as delivered")
          break
        case "CANCELLED":
          toast.success("Equipment request cancelled")
          break
        default:
          toast.success("Equipment request status updated")
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update equipment request status")
    },
  })
}

// Hook for deleting equipment request
export function useDeleteEquipmentRequest() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteEquipmentRequest(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["equipment-requests"] })
      toast.success("Equipment request deleted successfully")
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete equipment request")
    },
  })
}