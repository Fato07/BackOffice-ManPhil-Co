import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { Destination } from "@/generated/prisma"

export interface DestinationWithCount extends Destination {
  _count?: {
    properties: number
  }
}

export interface DestinationOption {
  id: string
  name: string
  region: string | null
  latitude: number | null
  longitude: number | null
  label: string
  propertyCount: number
}

interface DestinationsResponse {
  destinations: DestinationWithCount[]
  grouped: Record<string, DestinationOption[]>
}

// Query keys
export const destinationKeys = {
  all: ["destinations"] as const,
  lists: () => [...destinationKeys.all, "list"] as const,
  list: () => [...destinationKeys.lists()] as const,
}

// Fetch all destinations
export function useDestinations() {
  return useQuery({
    queryKey: destinationKeys.list(),
    queryFn: () => api.get<DestinationsResponse>("/api/destinations"),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  })
}