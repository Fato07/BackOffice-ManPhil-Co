import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { 
  PropertyListItem, 
  PropertyWithRelations, 
  CreatePropertyInput,
  UpdatePropertyInput,
  PropertyFilters,
  PaginatedResponse
} from "@/types/property"
import { toast } from "sonner"

// Query keys
export const propertyKeys = {
  all: ["properties"] as const,
  lists: () => [...propertyKeys.all, "list"] as const,
  list: (filters?: PropertyFilters, page?: number) => 
    [...propertyKeys.lists(), { filters, page }] as const,
  details: () => [...propertyKeys.all, "detail"] as const,
  detail: (id: string) => [...propertyKeys.details(), id] as const,
}

// Fetch properties list
export function useProperties(filters?: PropertyFilters, page = 1, pageSize = 20) {
  return useQuery({
    queryKey: propertyKeys.list(filters, page),
    queryFn: async () => {
      const params: any = {
        page,
        pageSize,
        search: filters?.search,
        status: filters?.status,
        destinationId: filters?.destinationId,
        minRooms: filters?.minRooms,
        maxRooms: filters?.maxRooms,
        minBathrooms: filters?.minBathrooms,
        maxBathrooms: filters?.maxBathrooms,
        maxGuests: filters?.maxGuests,
        propertyType: filters?.propertyType,
        amenities: filters?.amenities?.join(','),
        services: filters?.services?.join(','),
        accessibility: filters?.accessibility?.join(','),
        petsAllowed: filters?.policies?.petsAllowed,
        eventsAllowed: filters?.policies?.eventsAllowed,
        smokingAllowed: filters?.policies?.smokingAllowed,
        minPrice: filters?.minPrice,
        maxPrice: filters?.maxPrice,
        showOnWebsite: filters?.promoted?.showOnWebsite,
        highlight: filters?.promoted?.highlight,
      }
      
      // Remove undefined values
      Object.keys(params).forEach(key => {
        if (params[key] === undefined || params[key] === null || params[key] === '') {
          delete params[key]
        }
      })
      
      return api.get<PaginatedResponse<PropertyListItem>>("/api/properties", { params })
    },
  })
}

// Fetch single property
export function useProperty(id: string) {
  return useQuery({
    queryKey: propertyKeys.detail(id),
    queryFn: () => api.get<PropertyWithRelations>(`/api/properties/${id}`),
    enabled: !!id,
  })
}

// Create property mutation
export function useCreateProperty() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: CreatePropertyInput) => 
      api.post<PropertyWithRelations>("/api/properties", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: propertyKeys.lists() })
      toast.success("Property created successfully")
    },
    onError: (error) => {
      toast.error("Failed to create property")
    },
  })
}

// Update property mutation (legacy version with id parameter)
export function useUpdatePropertyById(id: string) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: UpdatePropertyInput) =>
      api.put<PropertyWithRelations>(`/api/properties/${id}`, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: propertyKeys.lists() })
      queryClient.setQueryData(propertyKeys.detail(id), data)
      toast.success("Property updated successfully")
    },
    onError: (error) => {
      toast.error("Failed to update property")
    },
  })
}

// Update property mutation (used by property sections)
export function useUpdateProperty() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePropertyInput }) =>
      api.patch<PropertyWithRelations>(`/api/properties/${id}`, data),
    onSuccess: (updatedData, variables) => {
      queryClient.invalidateQueries({ queryKey: propertyKeys.lists() })
      queryClient.setQueryData(propertyKeys.detail(variables.id), updatedData)
      toast.success("Property updated successfully")
    },
    onError: (error) => {
      console.error("Property update error:", error)
      if (error instanceof Error) {
        toast.error(`Failed to update property: ${error.message}`)
      } else {
        toast.error("Failed to update property")
      }
    },
  })
}

// Delete property mutation
export function useDeleteProperty() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/properties/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: propertyKeys.lists() })
      toast.success("Property deleted successfully")
    },
    onError: (error) => {
      toast.error("Failed to delete property")
    },
  })
}

// Toggle property status
export function useTogglePropertyStatus(id: string) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (currentStatus: string) => {
      const newStatus = currentStatus === "PUBLISHED" ? "HIDDEN" : "PUBLISHED"
      return api.put<PropertyWithRelations>(`/api/properties/${id}`, { status: newStatus })
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: propertyKeys.lists() })
      queryClient.setQueryData(propertyKeys.detail(id), data)
      toast.success("Property status updated")
    },
    onError: (error) => {
      toast.error("Failed to update property status")
    },
  })
}