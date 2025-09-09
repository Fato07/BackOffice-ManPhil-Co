import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"

export interface User {
  id: string
  firstName?: string | null
  lastName?: string | null
  username?: string | null
  imageUrl?: string
  emailAddress?: string
  fullName: string
}

export function useUser(userId: string | undefined) {
  return useQuery<User>({
    queryKey: ["user", userId],
    queryFn: () => api.get(`/api/users/${userId}`),
    enabled: !!userId,
    staleTime: 60 * 60 * 1000, // Cache for 1 hour
  })
}