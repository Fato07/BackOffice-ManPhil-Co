import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"

export interface Destination {
  id: string
  name: string
  country: string
  region: string | null
}

export interface DestinationOption extends Destination {
  label: string
  propertyCount: number
}

interface DestinationsResponse {
  destinations: Destination[]
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