import { X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { type PropertyFilters } from "@/types/property"

interface DestinationsData {
  destinations: Array<{ id: string; name: string }>
  grouped: Record<string, Array<{ id: string; name: string }>>
}

interface ActiveFilterBadgesProps {
  filters: PropertyFilters
  onRemoveFilter: (key: keyof PropertyFilters, value?: string) => void
  onClearAll: () => void
  destinationsData?: DestinationsData
  className?: string
}

const AMENITIES = [
  { value: "hasPool", label: "Pool" },
  { value: "hasBeachAccess", label: "Beach Access" },
  { value: "hasHotTub", label: "Hot Tub" },
  { value: "hasGym", label: "Gym" },
  { value: "hasGarden", label: "Garden" },
  { value: "hasParking", label: "Parking" },
] as const

const SERVICES = [
  { value: "hasChef", label: "Chef" },
  { value: "hasHousekeeper", label: "Housekeeper" },
  { value: "hasDriver", label: "Driver" },
  { value: "hasConcierge", label: "Concierge" },
  { value: "hasTransport", label: "Transport" },
] as const

const ACCESSIBILITY = [
  { value: "wheelchairAccessible", label: "Wheelchair Accessible" },
  { value: "elevatorAvailable", label: "Elevator" },
  { value: "accessibleBathroom", label: "Accessible Bathroom" },
  { value: "wideDoors", label: "Wide Doors" },
] as const

const PROPERTY_TYPES = [
  { value: "villa", label: "Villa" },
  { value: "apartment", label: "Apartment" },
  { value: "house", label: "House" },
  { value: "condo", label: "Condo" },
  { value: "castle", label: "Castle" },
  { value: "chalet", label: "Chalet" },
  { value: "lodge", label: "Lodge" },
] as const

export function ActiveFilterBadges({
  filters,
  onRemoveFilter,
  onClearAll,
  destinationsData,
  className
}: ActiveFilterBadgesProps) {
  const getActiveFilterCount = () => {
    let count = 0
    if (filters.destinationId) count++
    if (filters.destinationIds?.length) count++
    if (filters.minRooms || filters.maxRooms) count++
    if (filters.minBathrooms || filters.maxBathrooms) count++
    if (filters.maxGuests) count++
    if (filters.propertyType) count++
    if (filters.amenities?.length) count++
    if (filters.services?.length) count++
    if (filters.accessibility?.length) count++
    if (filters.policies?.petsAllowed !== undefined) count++
    if (filters.policies?.eventsAllowed !== undefined) count++
    if (filters.policies?.smokingAllowed !== undefined) count++
    if (filters.minPrice || filters.maxPrice) count++
    if (filters.promoted?.showOnWebsite !== undefined) count++
    if (filters.promoted?.highlight !== undefined) count++
    return count
  }

  const activeFilterCount = getActiveFilterCount()

  if (activeFilterCount === 0) {
    return null
  }

  const removeBadge = (onClick: () => void, children: React.ReactNode) => (
    <Badge variant="secondary" className="gap-1">
      {children}
      <button
        onClick={onClick}
        className="ml-1 hover:bg-secondary-foreground/20 rounded"
      >
        <X className="h-3 w-3" />
      </button>
    </Badge>
  )

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Active Filters ({activeFilterCount})</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearAll}
          className="h-7 px-2 text-xs"
        >
          Clear All
        </Button>
      </div>
      
      <div className="flex flex-wrap items-center gap-2">
        {/* Destinations */}
        {filters.destinationId && 
          removeBadge(
            () => onRemoveFilter("destinationId"),
            destinationsData?.destinations.find(d => d.id === filters.destinationId)?.name
          )
        }
        
        {filters.destinationIds?.map(id => {
          const dest = Object.values(destinationsData?.grouped || {})
            .flat()
            .find(d => d.id === id)
          return dest ? (
            <span key={id}>
              {removeBadge(
                () => onRemoveFilter("destinationIds", id),
                dest.name
              )}
            </span>
          ) : null
        })}

        {/* Rooms */}
        {(filters.minRooms || filters.maxRooms) && 
          removeBadge(
            () => {
              onRemoveFilter("minRooms")
              onRemoveFilter("maxRooms")
            },
            `${filters.minRooms || 1}-${filters.maxRooms || 20} rooms`
          )
        }

        {/* Bathrooms */}
        {(filters.minBathrooms || filters.maxBathrooms) && 
          removeBadge(
            () => {
              onRemoveFilter("minBathrooms")
              onRemoveFilter("maxBathrooms")
            },
            `${filters.minBathrooms || 1}-${filters.maxBathrooms || 10} bathrooms`
          )
        }

        {/* Guests */}
        {filters.maxGuests && 
          removeBadge(
            () => onRemoveFilter("maxGuests"),
            `Max ${filters.maxGuests} guests`
          )
        }

        {/* Property Type */}
        {filters.propertyType && 
          removeBadge(
            () => onRemoveFilter("propertyType"),
            PROPERTY_TYPES.find(t => t.value === filters.propertyType)?.label || filters.propertyType
          )
        }

        {/* Amenities */}
        {filters.amenities?.map(amenity => (
          <span key={amenity}>
            {removeBadge(
              () => onRemoveFilter("amenities", amenity),
              AMENITIES.find(a => a.value === amenity)?.label || amenity
            )}
          </span>
        ))}

        {/* Services */}
        {filters.services?.map(service => (
          <span key={service}>
            {removeBadge(
              () => onRemoveFilter("services", service),
              SERVICES.find(s => s.value === service)?.label || service
            )}
          </span>
        ))}

        {/* Accessibility */}
        {filters.accessibility?.map(access => (
          <span key={access}>
            {removeBadge(
              () => onRemoveFilter("accessibility", access),
              ACCESSIBILITY.find(a => a.value === access)?.label || access
            )}
          </span>
        ))}

        {/* Policies */}
        {filters.policies?.petsAllowed !== undefined && 
          removeBadge(
            () => onRemoveFilter("policies", "petsAllowed"),
            `Pets: ${filters.policies!.petsAllowed ? "Yes" : "No"}`
          )
        }

        {filters.policies?.eventsAllowed !== undefined && 
          removeBadge(
            () => onRemoveFilter("policies", "eventsAllowed"),
            `Events: ${filters.policies!.eventsAllowed ? "Yes" : "No"}`
          )
        }

        {filters.policies?.smokingAllowed !== undefined && 
          removeBadge(
            () => onRemoveFilter("policies", "smokingAllowed"),
            `Smoking: ${filters.policies!.smokingAllowed ? "Yes" : "No"}`
          )
        }

        {/* Price Range */}
        {(filters.minPrice || filters.maxPrice) && 
          removeBadge(
            () => {
              onRemoveFilter("minPrice")
              onRemoveFilter("maxPrice")
            },
            `€${filters.minPrice || 0} - €${filters.maxPrice || "∞"}`
          )
        }

        {/* Promotions */}
        {filters.promoted?.showOnWebsite !== undefined && 
          removeBadge(
            () => onRemoveFilter("promoted", "showOnWebsite"),
            `Show on Website: ${filters.promoted!.showOnWebsite ? "Yes" : "No"}`
          )
        }

        {filters.promoted?.highlight !== undefined && 
          removeBadge(
            () => onRemoveFilter("promoted", "highlight"),
            `Highlight: ${filters.promoted!.highlight ? "Yes" : "No"}`
          )
        }
      </div>
    </div>
  )
}