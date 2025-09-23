import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Photo } from "@/generated/prisma"
import { api } from "@/lib/api"
import { toast } from "sonner"

interface PhotoWithProperty extends Photo {
  property?: {
    id: string
    name: string
  }
}

const photoKeys = {
  all: ["photos"] as const,
  byProperty: (propertyId: string) => [...photoKeys.all, "property", propertyId] as const,
}

export function usePropertyPhotos(propertyId: string) {
  return useQuery({
    queryKey: photoKeys.byProperty(propertyId),
    queryFn: async () => {
      const response = await api.get<{ photos: Photo[] }>(`/api/properties/${propertyId}/photos`)
      return response.photos
    },
  })
}

export function useUploadPhotos(propertyId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (files: File[]) => {
      console.log(`[Frontend] Uploading ${files.length} photos for property ${propertyId}`)
      
      const formData = new FormData()
      files.forEach((file) => {
        formData.append("files", file)
        console.log(`[Frontend] Adding file: ${file.name}, size: ${file.size}, type: ${file.type}`)
      })

      const response = await fetch(`/api/properties/${propertyId}/photos`, {
        method: "POST",
        body: formData,
      })

      const data = await response.json()
      console.log("[Frontend] Upload response:", data)

      if (!response.ok) {
        // Handle detailed error response
        if (data.details) {
          if (Array.isArray(data.details)) {
            throw new Error(data.details.join('\n'))
          } else {
            throw new Error(`${data.error}: ${data.details}`)
          }
        }
        throw new Error(data.error || "Failed to upload photos")
      }

      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: photoKeys.byProperty(propertyId) })
      
      // Show detailed success/error information
      if (data.successCount > 0) {
        toast.success(`${data.successCount} photo(s) uploaded successfully`)
      }
      
      if (data.errors && data.errors.length > 0) {
        console.error("[Frontend] Upload errors:", data.errors)
        data.errors.forEach((error: string) => {
          toast.error(error)
        })
      }
    },
    onError: (error: Error) => {
      console.error("[Frontend] Upload error:", error)
      toast.error(error.message || "Failed to upload photos")
    },
  })
}

export function useUpdatePhoto() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ 
      id, 
      data 
    }: { 
      id: string
      data: {
        caption?: string
        altText?: string
        category?: string
        isMain?: boolean
      }
    }) => {
      const response = await api.patch<{ photo: Photo }>(`/api/photos/${id}`, data)
      return response.photo
    },
    onSuccess: (photo) => {
      queryClient.invalidateQueries({ queryKey: photoKeys.all })
      // Also invalidate property queries to refresh main photo in lists
      queryClient.invalidateQueries({ queryKey: ["properties"] })
      
      if (photo.isMain) {
        toast.success("Main photo set successfully")
      } else {
        toast.success("Photo updated successfully")
      }
    },
    onError: () => {
      toast.error("Failed to update photo")
    },
  })
}

export function useDeletePhoto() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (photoId: string) => {
      await api.delete(`/api/photos/${photoId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: photoKeys.all })
      toast.success("Photo deleted successfully")
    },
    onError: () => {
      toast.error("Failed to delete photo")
    },
  })
}

export function useReorderPhotos(propertyId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (photos: { id: string; position: number }[]) => {
      await api.patch(`/api/properties/${propertyId}/photos`, { photos })
    },
    onMutate: async (photos) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: photoKeys.byProperty(propertyId) })

      // Snapshot the previous value
      const previousPhotos = queryClient.getQueryData<Photo[]>(photoKeys.byProperty(propertyId))

      // Optimistically update
      if (previousPhotos) {
        const updatedPhotos = [...previousPhotos]
        photos.forEach(({ id, position }) => {
          const index = updatedPhotos.findIndex(p => p.id === id)
          if (index !== -1) {
            updatedPhotos[index] = { ...updatedPhotos[index], position }
          }
        })
        updatedPhotos.sort((a, b) => a.position - b.position)
        queryClient.setQueryData(photoKeys.byProperty(propertyId), updatedPhotos)
      }

      return { previousPhotos }
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousPhotos) {
        queryClient.setQueryData(photoKeys.byProperty(propertyId), context.previousPhotos)
      }
      toast.error("Failed to reorder photos")
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: photoKeys.byProperty(propertyId) })
    },
  })
}