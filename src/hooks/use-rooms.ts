import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Room, RoomType } from "@/generated/prisma"
import { api } from "@/lib/api"
import { toast } from "sonner"

interface CreateRoomData {
  propertyId: string
  name: string
  roomType: RoomType
  groupName?: string
  generalInfo?: any
  view?: string
  equipment?: Array<{
    category: string
    items: Array<{
      name: string
      quantity: number
    }>
  }>
}

interface UpdateRoomData {
  name?: string
  roomType?: RoomType
  groupName?: string | null
  generalInfo?: any
  view?: string | null
  equipment?: Array<{
    category: string
    items: Array<{
      name: string
      quantity: number
    }>
  }>
}

const roomKeys = {
  all: ["rooms"] as const,
  byProperty: (propertyId: string) => [...roomKeys.all, "property", propertyId] as const,
  detail: (id: string) => [...roomKeys.all, id] as const,
}

export function useCreateRoom() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateRoomData) => {
      const response = await api.post<{ room: Room }>("/api/rooms", data)
      return response.room
    },
    onSuccess: (room) => {
      queryClient.invalidateQueries({ queryKey: roomKeys.byProperty(room.propertyId) })
      queryClient.invalidateQueries({ queryKey: ["properties"] })
      toast.success("Room created successfully")
    },
    onError: () => {
      toast.error("Failed to create room")
    },
  })
}

export function useUpdateRoom() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateRoomData }) => {
      const response = await api.patch<{ room: Room }>(`/api/rooms/${id}`, data)
      return response.room
    },
    onSuccess: (room) => {
      queryClient.invalidateQueries({ queryKey: roomKeys.byProperty(room.propertyId) })
      queryClient.invalidateQueries({ queryKey: roomKeys.detail(room.id) })
      toast.success("Room updated successfully")
    },
    onError: () => {
      toast.error("Failed to update room")
    },
  })
}

export function useDeleteRoom() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, propertyId }: { id: string; propertyId: string }) => {
      await api.delete(`/api/rooms/${id}`)
      return { id, propertyId }
    },
    onSuccess: ({ propertyId }) => {
      queryClient.invalidateQueries({ queryKey: roomKeys.byProperty(propertyId) })
      queryClient.invalidateQueries({ queryKey: ["properties"] })
      toast.success("Room deleted successfully")
    },
    onError: () => {
      toast.error("Failed to delete room")
    },
  })
}

export function useReorderRooms() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ 
      propertyId, 
      rooms 
    }: { 
      propertyId: string
      rooms: Array<{ id: string; position: number }> 
    }) => {
      await api.patch("/api/rooms", { propertyId, rooms })
    },
    onMutate: async ({ propertyId, rooms }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: roomKeys.byProperty(propertyId) })

      // Snapshot the previous value
      const previousRooms = queryClient.getQueryData<Room[]>(roomKeys.byProperty(propertyId))

      // Optimistically update
      if (previousRooms) {
        const updatedRooms = [...previousRooms]
        rooms.forEach(({ id, position }) => {
          const index = updatedRooms.findIndex(r => r.id === id)
          if (index !== -1) {
            updatedRooms[index] = { ...updatedRooms[index], position }
          }
        })
        updatedRooms.sort((a, b) => a.position - b.position)
        queryClient.setQueryData(roomKeys.byProperty(propertyId), updatedRooms)
      }

      return { previousRooms, propertyId }
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousRooms && context.propertyId) {
        queryClient.setQueryData(
          roomKeys.byProperty(context.propertyId), 
          context.previousRooms
        )
      }
      toast.error("Failed to reorder rooms")
    },
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: roomKeys.byProperty(variables.propertyId) 
      })
    },
  })
}

export function useRoom(id: string) {
  return useQuery({
    queryKey: roomKeys.detail(id),
    queryFn: async () => {
      const response = await api.get<{ room: Room }>(`/api/rooms/${id}`)
      return response.room
    },
    enabled: !!id,
  })
}