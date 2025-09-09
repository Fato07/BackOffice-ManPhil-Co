"use client"

import { useCallback, useState } from "react"
import { X, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { type PropertyFilters } from "@/types/property"
import { useDestinations } from "@/hooks/use-destinations"
import { cn } from "@/lib/utils"

interface PropertyFiltersProps {
  filters: PropertyFilters
  onFiltersChange: (filters: PropertyFilters) => void
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

export function PropertyFilters({ filters, onFiltersChange, className }: PropertyFiltersProps) {
  const { data: destinationsData } = useDestinations()
  const [localFilters, setLocalFilters] = useState<PropertyFilters>(filters)
  const [isOpen, setIsOpen] = useState(false)

  // Update local filters when prop filters change
  const updateLocalFilter = useCallback((key: keyof PropertyFilters, value: any) => {
    setLocalFilters(prev => ({ ...prev, [key]: value }))
  }, [])

  // Apply filters
  const handleApplyFilters = useCallback(() => {
    onFiltersChange(localFilters)
    setIsOpen(false)
  }, [localFilters, onFiltersChange])

  // Clear all filters
  const handleClearFilters = useCallback(() => {
    const clearedFilters: PropertyFilters = {}
    setLocalFilters(clearedFilters)
    onFiltersChange(clearedFilters)
  }, [onFiltersChange])

  // Get active filter count
  const getActiveFilterCount = () => {
    let count = 0
    if (filters.destinationId) count++
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

  // Remove a specific filter
  const removeFilter = (key: keyof PropertyFilters, value?: string) => {
    const newFilters = { ...filters }
    if (key === 'amenities' || key === 'services' || key === 'accessibility') {
      if (value && newFilters[key]) {
        if (key === 'amenities') {
          newFilters.amenities = newFilters.amenities?.filter(v => v !== value) as any
          if (newFilters.amenities?.length === 0) delete newFilters.amenities
        } else if (key === 'services') {
          newFilters.services = newFilters.services?.filter(v => v !== value) as any
          if (newFilters.services?.length === 0) delete newFilters.services
        } else if (key === 'accessibility') {
          newFilters.accessibility = newFilters.accessibility?.filter(v => v !== value) as any
          if (newFilters.accessibility?.length === 0) delete newFilters.accessibility
        }
      }
    } else if (key === 'policies' && value) {
      if (newFilters.policies) {
        delete newFilters.policies[value as keyof typeof newFilters.policies]
        if (Object.keys(newFilters.policies).length === 0) delete newFilters.policies
      }
    } else if (key === 'promoted' && value) {
      if (newFilters.promoted) {
        delete newFilters.promoted[value as keyof typeof newFilters.promoted]
        if (Object.keys(newFilters.promoted).length === 0) delete newFilters.promoted
      }
    } else {
      delete newFilters[key]
    }
    onFiltersChange(newFilters)
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Filter trigger and active filters */}
      <div className="flex flex-wrap items-center gap-2">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              Filters
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </SheetTrigger>

          <SheetContent className="w-full sm:max-w-md">
            <SheetHeader>
              <SheetTitle>Property Filters</SheetTitle>
              <SheetDescription>
                Filter properties by various criteria
              </SheetDescription>
            </SheetHeader>

            <ScrollArea className="h-[calc(100vh-200px)] mt-6 pr-4">
              <div className="space-y-6">
                {/* Destination */}
                <div className="space-y-2">
                  <Label>Destination</Label>
                  <Select
                    value={localFilters.destinationId || "all"}
                    onValueChange={(value) => updateLocalFilter("destinationId", value === "all" ? undefined : value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select destination" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Destinations</SelectItem>
                      {Object.entries(destinationsData?.grouped || {}).map(([country, destinations]) => (
                        <div key={country}>
                          <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
                            {country}
                          </div>
                          {destinations.map((dest) => (
                            <SelectItem key={dest.id} value={dest.id}>
                              {dest.name} ({dest.propertyCount})
                            </SelectItem>
                          ))}
                        </div>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                {/* Rooms */}
                <div className="space-y-2">
                  <Label>Number of Rooms</Label>
                  <div className="px-1">
                    <Slider
                      min={1}
                      max={20}
                      step={1}
                      value={[localFilters.minRooms || 1, localFilters.maxRooms || 20]}
                      onValueChange={([min, max]) => {
                        updateLocalFilter("minRooms", min === 1 ? undefined : min)
                        updateLocalFilter("maxRooms", max === 20 ? undefined : max)
                      }}
                      className="mt-2"
                    />
                    <div className="flex justify-between text-sm text-muted-foreground mt-1">
                      <span>{localFilters.minRooms || 1}</span>
                      <span>{localFilters.maxRooms || 20}</span>
                    </div>
                  </div>
                </div>

                {/* Bathrooms */}
                <div className="space-y-2">
                  <Label>Number of Bathrooms</Label>
                  <div className="px-1">
                    <Slider
                      min={1}
                      max={10}
                      step={0.5}
                      value={[localFilters.minBathrooms || 1, localFilters.maxBathrooms || 10]}
                      onValueChange={([min, max]) => {
                        updateLocalFilter("minBathrooms", min === 1 ? undefined : min)
                        updateLocalFilter("maxBathrooms", max === 10 ? undefined : max)
                      }}
                      className="mt-2"
                    />
                    <div className="flex justify-between text-sm text-muted-foreground mt-1">
                      <span>{localFilters.minBathrooms || 1}</span>
                      <span>{localFilters.maxBathrooms || 10}</span>
                    </div>
                  </div>
                </div>

                {/* Max Guests */}
                <div className="space-y-2">
                  <Label>Maximum Guests</Label>
                  <Input
                    type="number"
                    min={1}
                    value={localFilters.maxGuests || ""}
                    onChange={(e) => updateLocalFilter("maxGuests", e.target.value ? parseInt(e.target.value) : undefined)}
                    placeholder="Any"
                  />
                </div>

                <Separator />

                {/* Property Type */}
                <div className="space-y-2">
                  <Label>Property Type</Label>
                  <Select
                    value={localFilters.propertyType || "all"}
                    onValueChange={(value) => updateLocalFilter("propertyType", value === "all" ? undefined : value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select property type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      {PROPERTY_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                {/* Amenities */}
                <div className="space-y-2">
                  <Label>Amenities</Label>
                  <div className="space-y-2">
                    {AMENITIES.map((amenity) => (
                      <div key={amenity.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={amenity.value}
                          checked={localFilters.amenities?.includes(amenity.value as any) || false}
                          onCheckedChange={(checked) => {
                            const current = localFilters.amenities || []
                            if (checked) {
                              updateLocalFilter("amenities", [...current, amenity.value])
                            } else {
                              updateLocalFilter("amenities", current.filter(a => a !== amenity.value))
                            }
                          }}
                        />
                        <Label
                          htmlFor={amenity.value}
                          className="text-sm font-normal cursor-pointer"
                        >
                          {amenity.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Services */}
                <div className="space-y-2">
                  <Label>Services</Label>
                  <div className="space-y-2">
                    {SERVICES.map((service) => (
                      <div key={service.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={service.value}
                          checked={localFilters.services?.includes(service.value as any) || false}
                          onCheckedChange={(checked) => {
                            const current = localFilters.services || []
                            if (checked) {
                              updateLocalFilter("services", [...current, service.value])
                            } else {
                              updateLocalFilter("services", current.filter(s => s !== service.value))
                            }
                          }}
                        />
                        <Label
                          htmlFor={service.value}
                          className="text-sm font-normal cursor-pointer"
                        >
                          {service.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Accessibility */}
                <div className="space-y-2">
                  <Label>Accessibility</Label>
                  <div className="space-y-2">
                    {ACCESSIBILITY.map((access) => (
                      <div key={access.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={access.value}
                          checked={localFilters.accessibility?.includes(access.value as any) || false}
                          onCheckedChange={(checked) => {
                            const current = localFilters.accessibility || []
                            if (checked) {
                              updateLocalFilter("accessibility", [...current, access.value])
                            } else {
                              updateLocalFilter("accessibility", current.filter(a => a !== access.value))
                            }
                          }}
                        />
                        <Label
                          htmlFor={access.value}
                          className="text-sm font-normal cursor-pointer"
                        >
                          {access.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Policies */}
                <div className="space-y-3">
                  <Label>Policies</Label>
                  
                  <div className="space-y-2">
                    <Label className="text-sm">Pets Allowed</Label>
                    <RadioGroup
                      value={
                        localFilters.policies?.petsAllowed === true ? "yes" :
                        localFilters.policies?.petsAllowed === false ? "no" : "all"
                      }
                      onValueChange={(value) => {
                        if (value === "all") {
                          const policies = { ...localFilters.policies }
                          delete policies.petsAllowed
                          updateLocalFilter("policies", Object.keys(policies).length ? policies : undefined)
                        } else {
                          updateLocalFilter("policies", {
                            ...localFilters.policies,
                            petsAllowed: value === "yes"
                          })
                        }
                      }}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="all" id="pets-all" />
                        <Label htmlFor="pets-all" className="text-sm font-normal cursor-pointer">All</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="yes" id="pets-yes" />
                        <Label htmlFor="pets-yes" className="text-sm font-normal cursor-pointer">Yes</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="no" id="pets-no" />
                        <Label htmlFor="pets-no" className="text-sm font-normal cursor-pointer">No</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm">Events Allowed</Label>
                    <RadioGroup
                      value={
                        localFilters.policies?.eventsAllowed === true ? "yes" :
                        localFilters.policies?.eventsAllowed === false ? "no" : "all"
                      }
                      onValueChange={(value) => {
                        if (value === "all") {
                          const policies = { ...localFilters.policies }
                          delete policies.eventsAllowed
                          updateLocalFilter("policies", Object.keys(policies).length ? policies : undefined)
                        } else {
                          updateLocalFilter("policies", {
                            ...localFilters.policies,
                            eventsAllowed: value === "yes"
                          })
                        }
                      }}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="all" id="events-all" />
                        <Label htmlFor="events-all" className="text-sm font-normal cursor-pointer">All</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="yes" id="events-yes" />
                        <Label htmlFor="events-yes" className="text-sm font-normal cursor-pointer">Yes</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="no" id="events-no" />
                        <Label htmlFor="events-no" className="text-sm font-normal cursor-pointer">No</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm">Smoking Allowed</Label>
                    <RadioGroup
                      value={
                        localFilters.policies?.smokingAllowed === true ? "yes" :
                        localFilters.policies?.smokingAllowed === false ? "no" : "all"
                      }
                      onValueChange={(value) => {
                        if (value === "all") {
                          const policies = { ...localFilters.policies }
                          delete policies.smokingAllowed
                          updateLocalFilter("policies", Object.keys(policies).length ? policies : undefined)
                        } else {
                          updateLocalFilter("policies", {
                            ...localFilters.policies,
                            smokingAllowed: value === "yes"
                          })
                        }
                      }}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="all" id="smoking-all" />
                        <Label htmlFor="smoking-all" className="text-sm font-normal cursor-pointer">All</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="yes" id="smoking-yes" />
                        <Label htmlFor="smoking-yes" className="text-sm font-normal cursor-pointer">Yes</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="no" id="smoking-no" />
                        <Label htmlFor="smoking-no" className="text-sm font-normal cursor-pointer">No</Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>

                <Separator />

                {/* Price Range */}
                <div className="space-y-2">
                  <Label>Price Range (per night)</Label>
                  <div className="flex gap-2 items-center">
                    <Input
                      type="number"
                      min={0}
                      value={localFilters.minPrice || ""}
                      onChange={(e) => updateLocalFilter("minPrice", e.target.value ? parseInt(e.target.value) : undefined)}
                      placeholder="Min"
                      className="w-24"
                    />
                    <span className="text-muted-foreground">-</span>
                    <Input
                      type="number"
                      min={0}
                      value={localFilters.maxPrice || ""}
                      onChange={(e) => updateLocalFilter("maxPrice", e.target.value ? parseInt(e.target.value) : undefined)}
                      placeholder="Max"
                      className="w-24"
                    />
                  </div>
                </div>

                <Separator />

                {/* Promotions */}
                <div className="space-y-2">
                  <Label>Promotions</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="showOnWebsite"
                        checked={localFilters.promoted?.showOnWebsite || false}
                        onCheckedChange={(checked) => {
                          const promoted = { ...localFilters.promoted }
                          if (checked) {
                            promoted.showOnWebsite = true
                          } else {
                            delete promoted.showOnWebsite
                          }
                          updateLocalFilter("promoted", Object.keys(promoted).length ? promoted : undefined)
                        }}
                      />
                      <Label
                        htmlFor="showOnWebsite"
                        className="text-sm font-normal cursor-pointer"
                      >
                        Show on Website
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="highlight"
                        checked={localFilters.promoted?.highlight || false}
                        onCheckedChange={(checked) => {
                          const promoted = { ...localFilters.promoted }
                          if (checked) {
                            promoted.highlight = true
                          } else {
                            delete promoted.highlight
                          }
                          updateLocalFilter("promoted", Object.keys(promoted).length ? promoted : undefined)
                        }}
                      />
                      <Label
                        htmlFor="highlight"
                        className="text-sm font-normal cursor-pointer"
                      >
                        Highlighted Property
                      </Label>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>

            {/* Actions */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-background border-t">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleClearFilters}
                  className="flex-1"
                >
                  Clear All
                </Button>
                <Button
                  onClick={handleApplyFilters}
                  className="flex-1"
                >
                  Apply Filters
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* Filter chips */}
        {activeFilterCount > 0 && (
          <>
            {filters.destinationId && (
              <Badge variant="secondary" className="gap-1">
                {destinationsData?.destinations.find(d => d.id === filters.destinationId)?.name}
                <button
                  onClick={() => removeFilter("destinationId")}
                  className="ml-1 hover:bg-secondary-foreground/20 rounded"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}

            {(filters.minRooms || filters.maxRooms) && (
              <Badge variant="secondary" className="gap-1">
                {filters.minRooms || 1}-{filters.maxRooms || 20} rooms
                <button
                  onClick={() => {
                    const newFilters = { ...filters }
                    delete newFilters.minRooms
                    delete newFilters.maxRooms
                    onFiltersChange(newFilters)
                  }}
                  className="ml-1 hover:bg-secondary-foreground/20 rounded"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}

            {(filters.minBathrooms || filters.maxBathrooms) && (
              <Badge variant="secondary" className="gap-1">
                {filters.minBathrooms || 1}-{filters.maxBathrooms || 10} bathrooms
                <button
                  onClick={() => {
                    const newFilters = { ...filters }
                    delete newFilters.minBathrooms
                    delete newFilters.maxBathrooms
                    onFiltersChange(newFilters)
                  }}
                  className="ml-1 hover:bg-secondary-foreground/20 rounded"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}

            {filters.maxGuests && (
              <Badge variant="secondary" className="gap-1">
                Max {filters.maxGuests} guests
                <button
                  onClick={() => removeFilter("maxGuests")}
                  className="ml-1 hover:bg-secondary-foreground/20 rounded"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}

            {filters.propertyType && (
              <Badge variant="secondary" className="gap-1">
                {PROPERTY_TYPES.find(t => t.value === filters.propertyType)?.label}
                <button
                  onClick={() => removeFilter("propertyType")}
                  className="ml-1 hover:bg-secondary-foreground/20 rounded"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}

            {filters.amenities?.map(amenity => (
              <Badge key={amenity} variant="secondary" className="gap-1">
                {AMENITIES.find(a => a.value === amenity)?.label}
                <button
                  onClick={() => removeFilter("amenities", amenity)}
                  className="ml-1 hover:bg-secondary-foreground/20 rounded"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}

            {filters.services?.map(service => (
              <Badge key={service} variant="secondary" className="gap-1">
                {SERVICES.find(s => s.value === service)?.label}
                <button
                  onClick={() => removeFilter("services", service)}
                  className="ml-1 hover:bg-secondary-foreground/20 rounded"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}

            {filters.accessibility?.map(access => (
              <Badge key={access} variant="secondary" className="gap-1">
                {ACCESSIBILITY.find(a => a.value === access)?.label}
                <button
                  onClick={() => removeFilter("accessibility", access)}
                  className="ml-1 hover:bg-secondary-foreground/20 rounded"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}

            {filters.policies?.petsAllowed !== undefined && (
              <Badge variant="secondary" className="gap-1">
                Pets {filters.policies.petsAllowed ? "allowed" : "not allowed"}
                <button
                  onClick={() => removeFilter("policies", "petsAllowed")}
                  className="ml-1 hover:bg-secondary-foreground/20 rounded"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}

            {filters.policies?.eventsAllowed !== undefined && (
              <Badge variant="secondary" className="gap-1">
                Events {filters.policies.eventsAllowed ? "allowed" : "not allowed"}
                <button
                  onClick={() => removeFilter("policies", "eventsAllowed")}
                  className="ml-1 hover:bg-secondary-foreground/20 rounded"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}

            {filters.policies?.smokingAllowed !== undefined && (
              <Badge variant="secondary" className="gap-1">
                Smoking {filters.policies.smokingAllowed ? "allowed" : "not allowed"}
                <button
                  onClick={() => removeFilter("policies", "smokingAllowed")}
                  className="ml-1 hover:bg-secondary-foreground/20 rounded"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}

            {(filters.minPrice || filters.maxPrice) && (
              <Badge variant="secondary" className="gap-1">
                ${filters.minPrice || 0} - ${filters.maxPrice || "∞"}/night
                <button
                  onClick={() => {
                    const newFilters = { ...filters }
                    delete newFilters.minPrice
                    delete newFilters.maxPrice
                    onFiltersChange(newFilters)
                  }}
                  className="ml-1 hover:bg-secondary-foreground/20 rounded"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}

            {filters.promoted?.showOnWebsite && (
              <Badge variant="secondary" className="gap-1">
                Show on Website
                <button
                  onClick={() => removeFilter("promoted", "showOnWebsite")}
                  className="ml-1 hover:bg-secondary-foreground/20 rounded"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}

            {filters.promoted?.highlight && (
              <Badge variant="secondary" className="gap-1">
                Highlighted
                <button
                  onClick={() => removeFilter("promoted", "highlight")}
                  className="ml-1 hover:bg-secondary-foreground/20 rounded"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              className="h-7 text-xs"
            >
              Clear all
            </Button>
          </>
        )}
      </div>
    </div>
  )
}