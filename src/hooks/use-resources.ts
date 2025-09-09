import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { toast } from "sonner"
import { Resource } from "@/generated/prisma"

interface CreateResourceInput {
  type: string
  name: string
  url?: string
  file?: string
  fileName?: string
}

interface UpdateResourceInput {
  type?: string
  name?: string
}

// Fetch resources for a property
export function usePropertyResources(propertyId: string) {
  return useQuery<Resource[]>({
    queryKey: ["property-resources", propertyId],
    queryFn: () => api.get(`/api/properties/${propertyId}/resources`),
    enabled: !!propertyId,
  })
}

// Create a new resource
export function useCreateResource(propertyId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateResourceInput) => {
      console.log(`[Frontend] Creating resource for property ${propertyId}`, data)
      
      // If a file is provided, convert it to base64
      let fileData = data.file
      if (data.file && data.file.startsWith("blob:")) {
        console.log(`[Frontend] Converting blob to base64 for file: ${data.fileName}`)
        const response = await fetch(data.file)
        const blob = await response.blob()
        console.log(`[Frontend] Blob size: ${blob.size}, type: ${blob.type}`)
        const buffer = await blob.arrayBuffer()
        fileData = btoa(String.fromCharCode(...new Uint8Array(buffer)))
        console.log(`[Frontend] Base64 data length: ${fileData.length}`)
      }

      const response = await api.post<Resource>(`/api/properties/${propertyId}/resources`, {
        ...data,
        file: fileData,
      })
      
      console.log("[Frontend] Resource creation response:", response)
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["property-resources", propertyId] })
      toast.success("Resource added successfully")
    },
    onError: (error: any) => {
      console.error("[Frontend] Resource creation error:", error)
      
      // Handle detailed error response
      if (error.response?.data) {
        const data = error.response.data
        if (data.details) {
          // Show specific error details
          if (Array.isArray(data.details)) {
            data.details.forEach((detail: string) => {
              toast.error(detail)
            })
          } else {
            toast.error(`${data.error}: ${data.details}`)
          }
        } else {
          toast.error(data.error || "Failed to add resource")
        }
      } else if (error.message) {
        toast.error(error.message)
      } else {
        toast.error("Failed to add resource")
      }
    },
  })
}

// Update a resource
export function useUpdateResource() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateResourceInput }) =>
      api.put<Resource>(`/api/resources/${id}`, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["property-resources"] })
      queryClient.invalidateQueries({ queryKey: ["resource", variables.id] })
      toast.success("Resource updated successfully")
    },
    onError: (error: Error) => {
      console.error("Error updating resource:", error)
      toast.error("Failed to update resource")
    },
  })
}

// Delete a resource
export function useDeleteResource() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/resources/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["property-resources"] })
      toast.success("Resource deleted successfully")
    },
    onError: (error: Error) => {
      console.error("Error deleting resource:", error)
      toast.error("Failed to delete resource")
    },
  })
}