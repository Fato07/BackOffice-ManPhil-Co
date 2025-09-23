import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { 
  ActivityProvider,
  ActivityProviderListItem, 
  CreateActivityProviderInput,
  UpdateActivityProviderInput,
  ActivityProviderFilters,
  LinkProviderToPropertyInput,
  UnlinkProviderFromPropertyInput,
  BulkImportActivityProvidersInput,
  ExportActivityProvidersInput,
  ActivityProvidersListResponse
} from "@/types/activity-provider"
import { toast } from "sonner"
import { PaginatedResponse } from "@/types/property"

// Query keys
export const activityProviderKeys = {
  all: ["activity-providers"] as const,
  lists: () => [...activityProviderKeys.all, "list"] as const,
  list: (filters?: ActivityProviderFilters, page?: number) => 
    [...activityProviderKeys.lists(), { filters, page }] as const,
  details: () => [...activityProviderKeys.all, "detail"] as const,
  detail: (id: string) => [...activityProviderKeys.details(), id] as const,
}

// Fetch activity providers list
export function useActivityProviders(filters?: ActivityProviderFilters, page = 1, pageSize = 20) {
  return useQuery({
    queryKey: activityProviderKeys.list(filters, page),
    queryFn: async () => {
      const params: any = {
        page,
        pageSize,
        search: filters?.search,
        type: filters?.category, // Map category to type for DB compatibility
        tags: filters?.tags?.join(','),
        hasWebsite: filters?.hasWebsite,
        hasPhone: filters?.hasPhone,
        hasEmail: filters?.hasEmail,
        propertyId: filters?.propertyId,
        sortBy: filters?.sortBy,
        sortOrder: filters?.sortOrder,
      }
      
      // Remove undefined values
      Object.keys(params).forEach(key => {
        if (params[key] === undefined || params[key] === null || params[key] === '') {
          delete params[key]
        }
      })
      
      return api.get<PaginatedResponse<ActivityProviderListItem>>("/api/activity-providers", { params })
    },
  })
}

// Fetch single activity provider
export function useActivityProvider(id: string) {
  return useQuery({
    queryKey: activityProviderKeys.detail(id),
    queryFn: () => api.get<ActivityProvider>(`/api/activity-providers/${id}`),
    enabled: !!id,
  })
}

// Create activity provider mutation
export function useCreateProvider() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: CreateActivityProviderInput) => 
      api.post<ActivityProvider>("/api/activity-providers", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: activityProviderKeys.lists() })
      toast.success("Activity provider created successfully")
    },
    onError: (error) => {
      toast.error("Failed to create activity provider")
    },
  })
}

// Update activity provider mutation
export function useUpdateProvider() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<UpdateActivityProviderInput> }) =>
      api.patch<ActivityProvider>(`/api/activity-providers/${id}`, data),
    onSuccess: (updatedData, variables) => {
      queryClient.invalidateQueries({ queryKey: activityProviderKeys.lists() })
      queryClient.setQueryData(activityProviderKeys.detail(variables.id), updatedData)
      toast.success("Activity provider updated successfully")
    },
    onError: (error) => {
      console.error("Activity provider update error:", error)
      if (error instanceof Error) {
        toast.error(`Failed to update activity provider: ${error.message}`)
      } else {
        toast.error("Failed to update activity provider")
      }
    },
  })
}

// Delete activity provider mutation
export function useDeleteProvider() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/activity-providers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: activityProviderKeys.lists() })
      toast.success("Activity provider deleted successfully")
    },
    onError: (error) => {
      toast.error("Failed to delete activity provider")
    },
  })
}

// Link provider to property mutation
export function useLinkProvider() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: LinkProviderToPropertyInput) =>
      api.post(`/api/activity-providers/${data.providerId}/link`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: activityProviderKeys.lists() })
      toast.success("Provider linked to property successfully")
    },
    onError: (error) => {
      toast.error("Failed to link provider to property")
    },
  })
}

// Unlink provider from property mutation
export function useUnlinkProvider() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: UnlinkProviderFromPropertyInput) =>
      api.delete(`/api/activity-providers/${data.providerId}/unlink/${data.propertyId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: activityProviderKeys.lists() })
      toast.success("Provider unlinked from property successfully")
    },
    onError: (error) => {
      toast.error("Failed to unlink provider from property")
    },
  })
}

// Import providers mutation
export function useImportProviders() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: BulkImportActivityProvidersInput) =>
      api.post("/api/activity-providers/import", data),
    onSuccess: (response: any) => {
      queryClient.invalidateQueries({ queryKey: activityProviderKeys.lists() })
      if (response.data?.imported > 0) {
        toast.success(`Successfully imported ${response.data.imported} activity providers`)
      }
      if (response.data?.skipped > 0) {
        toast.warning(`Skipped ${response.data.skipped} duplicate providers`)
      }
      if (response.data?.errors?.length > 0) {
        toast.error(`${response.data.errors.length} providers failed to import`)
      }
    },
    onError: (error) => {
      toast.error("Failed to import activity providers")
    },
  })
}

// Export providers mutation
export function useExportProviders() {
  return useMutation({
    mutationFn: async (data: ExportActivityProvidersInput) => {
      // Build query parameters
      const params = new URLSearchParams({
        format: data.format || "csv",
      })
      
      // Handle filters
      if (data.filters) {
        if (data.filters.search) {
          params.append("search", data.filters.search)
        }
        if (data.filters.category) {
          params.append("category", data.filters.category)
        }
        if (data.filters.tags && data.filters.tags.length > 0) {
          params.append("tags", data.filters.tags.join(","))
        }
        if (data.filters.hasWebsite !== undefined) {
          params.append("hasWebsite", String(data.filters.hasWebsite))
        }
        if (data.filters.hasPhone !== undefined) {
          params.append("hasPhone", String(data.filters.hasPhone))
        }
        if (data.filters.hasEmail !== undefined) {
          params.append("hasEmail", String(data.filters.hasEmail))
        }
        
        // Handle ID-based filtering for selected items
        if (data.filters.search?.startsWith("id:")) {
          const ids = data.filters.search.substring(3).split(",")
          params.set("ids", ids.join(","))
          params.delete("search")
        }
      }
      
      const response = await fetch(`/api/activity-providers/export?${params}`, {
        method: "GET",
      });
      
      if (!response.ok) {
        throw new Error("Failed to export providers");
      }
      
      return response.blob();
    },
    onSuccess: (blob: Blob, variables) => {
      // Create download link
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = `activity-providers-${new Date().toISOString().split('T')[0]}.${variables.format || 'csv'}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success("Activity providers exported successfully")
    },
    onError: (error) => {
      toast.error("Failed to export activity providers")
    },
  })
}

// Update provider properties (for linking/unlinking multiple properties at once)
export function useUpdateProviderProperties() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ providerId, propertyIds }: { providerId: string, propertyIds: string[] }) => {
      // Get current provider to determine current properties
      const currentProvider = await api.get<ActivityProvider>(`/api/activity-providers/${providerId}`)
      const currentPropertyIds = currentProvider.properties?.map((p: any) => p.id) || []
      
      // Determine which properties to link and unlink
      const toLink = propertyIds.filter(id => !currentPropertyIds.includes(id))
      const toUnlink = currentPropertyIds.filter(id => !propertyIds.includes(id))
      
      // Execute link/unlink operations
      // Note: In a real implementation, this would be a single bulk endpoint
      await Promise.all([
        ...toLink.map(propertyId => 
          api.post(`/api/activity-providers/${providerId}/link`, { providerId, propertyId })
        ),
        ...toUnlink.map(propertyId =>
          api.delete(`/api/activity-providers/${providerId}/unlink/${propertyId}`)
        )
      ])
      
      return { providerId, propertyIds }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: activityProviderKeys.all })
      toast.success("Property links updated successfully")
    },
    onError: (error) => {
      toast.error("Failed to update property links")
    },
  })
}