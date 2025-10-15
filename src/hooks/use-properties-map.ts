import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"

// Map-specific property data interface
export interface PropertyMapData {
  id: string
  name: string
  latitude: number
  longitude: number
  destination: {
    id: string
    name: string
    country: string
  }
}

// Map-specific response type
export interface PropertiesMapResponse {
  properties: PropertyMapData[]
  total: number
}

// Query keys for map properties
export const propertiesMapKeys = {
  all: ["properties-map"] as const,
  list: () => [...propertiesMapKeys.all, "list"] as const,
}

// Fetch all properties with coordinates for map display
export function usePropertiesMap() {
  return useQuery({
    queryKey: propertiesMapKeys.list(),
    queryFn: async () => {
      const params = {
        // Optional filters for map
        // status: 'PUBLISHED', // Uncomment to only show published properties
        // destinationId: 'specific-destination-id', // Uncomment to filter by destination
      }
      
      const response = await api.get<PropertiesMapResponse>("/api/properties/map", { params })
      
      return {
        properties: response.properties,
        total: response.total
      }
    },
    // Cache for 5 minutes since property coordinates don't change often
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })
}