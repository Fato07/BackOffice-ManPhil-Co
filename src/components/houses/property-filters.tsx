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
import { DestinationTreeMinimal } from "@/components/houses/destination-tree-minimal"
import { cn } from "@/lib/utils"
import { PROPERTY_CATEGORIES, ACCESSIBILITY_OPTIONS } from "@/lib/constants/equipment"

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
    <>
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

          <SheetContent className="w-full sm:max-w-md p-0">
            <SheetHeader className="px-4 py-4 border-b">
              <SheetTitle className="text-lg">Property Filters</SheetTitle>
              <SheetDescription className="text-sm">
                Filter properties by various criteria
              </SheetDescription>
            </SheetHeader>

            <ScrollArea className="h-[calc(100vh-160px)]">
              <div className="space-y-4 p-4 pb-8">
                {/* Destination */}
                <div className="space-y-2">
                  <Label>Destinations</Label>
                  {destinationsData?.grouped && (
                    <DestinationTreeMinimal
                      destinations={destinationsData.grouped}
                      selectedDestinations={localFilters.destinationIds || []}
                      onSelectionChange={(destinations) => {
                        updateLocalFilter("destinationIds", destinations.length > 0 ? destinations : undefined)
                        if (destinations.length > 0 && localFilters.destinationId) {
                          updateLocalFilter("destinationId", undefined)
                        }
                      }}
                    />
                  )}
                </div>

                <div className="h-px bg-border" />

                {/* Rooms */}
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Rooms</Label>
                  <div className="space-y-3">
                    <Slider
                      min={1}
                      max={20}
                      step={1}
                      value={[localFilters.minRooms || 1, localFilters.maxRooms || 20]}
                      onValueChange={([min, max]) => {
                        updateLocalFilter("minRooms", min === 1 ? undefined : min)
                        updateLocalFilter("maxRooms", max === 20 ? undefined : max)
                      }}
                      className="[&_[role=slider]]:h-3.5 [&_[role=slider]]:w-3.5 [&_[role=slider]]:border-[#B5985A]/20 [&_[role=slider]]:bg-white [&_[role=slider]]:shadow-sm [&_[role=slider]:focus-visible]:ring-[#B5985A]/20 [&_[role=slider]:focus-visible]:ring-offset-0 [&_[role=slider]:hover]:border-[#B5985A] [&_.range]:bg-[#B5985A]"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{localFilters.minRooms || 1}</span>
                      <span>{localFilters.maxRooms || 20}</span>
                    </div>
                  </div>
                </div>

                {/* Bathrooms */}
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Bathrooms</Label>
                  <div className="space-y-3">
                    <Slider
                      min={1}
                      max={10}
                      step={0.5}
                      value={[localFilters.minBathrooms || 1, localFilters.maxBathrooms || 10]}
                      onValueChange={([min, max]) => {
                        updateLocalFilter("minBathrooms", min === 1 ? undefined : min)
                        updateLocalFilter("maxBathrooms", max === 10 ? undefined : max)
                      }}
                      className="[&_[role=slider]]:h-3.5 [&_[role=slider]]:w-3.5 [&_[role=slider]]:border-[#B5985A]/20 [&_[role=slider]]:bg-white [&_[role=slider]]:shadow-sm [&_[role=slider]:focus-visible]:ring-[#B5985A]/20 [&_[role=slider]:focus-visible]:ring-offset-0 [&_[role=slider]:hover]:border-[#B5985A] [&_.range]:bg-[#B5985A]"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{localFilters.minBathrooms || 1}</span>
                      <span>{localFilters.maxBathrooms || 10}</span>
                    </div>
                  </div>
                </div>

                {/* Max Guests */}
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Maximum Guests</Label>
                  <Input
                    type="number"
                    min={1}
                    value={localFilters.maxGuests || ""}
                    onChange={(e) => updateLocalFilter("maxGuests", e.target.value ? parseInt(e.target.value) : undefined)}
                    placeholder="Any"
                    className="h-8 text-sm"
                  />
                </div>

                <div className="h-px bg-border" />

                {/* Property Type */}
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Property Type</Label>
                  <Select
                    value={localFilters.propertyType || "all"}
                    onValueChange={(value) => updateLocalFilter("propertyType", value === "all" ? undefined : value)}
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder="Select property type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all" className="text-sm">All Types</SelectItem>
                      {PROPERTY_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value} className="text-sm">
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="h-px bg-border" />

                {/* Amenities */}
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Amenities</Label>
                  <div className="grid gap-2">
                    {AMENITIES.map((amenity) => (
                      <label
                        key={amenity.value}
                        htmlFor={amenity.value}
                        className="flex items-center gap-2 cursor-pointer group py-1"
                      >
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
                          className="h-4 w-4"
                        />
                        <span className="text-sm group-hover:text-foreground transition-colors">
                          {amenity.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="h-px bg-border" />

                {/* Services */}
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Services</Label>
                  <div className="grid gap-2">
                    {SERVICES.map((service) => (
                      <label
                        key={service.value}
                        htmlFor={service.value}
                        className="flex items-center gap-2 cursor-pointer group py-1"
                      >
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
                          className="h-4 w-4"
                        />
                        <span className="text-sm group-hover:text-foreground transition-colors">
                          {service.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="h-px bg-border" />

                {/* Accessibility */}
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Accessibility</Label>
                  <div className="grid gap-2">
                    {ACCESSIBILITY.map((access) => (
                      <label
                        key={access.value}
                        htmlFor={access.value}
                        className="flex items-center gap-2 cursor-pointer group py-1"
                      >
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
                          className="h-4 w-4"
                        />
                        <span className="text-sm group-hover:text-foreground transition-colors">
                          {access.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="h-px bg-border" />

                {/* Policies */}
                <div className="space-y-3">
                  <Label className="text-sm text-muted-foreground">Policies</Label>
                  
                  <div className="space-y-2">
                    <span className="text-xs text-muted-foreground">Pets Allowed</span>
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
                      <label htmlFor="pets-all" className="flex items-center gap-2 cursor-pointer py-1">
                        <RadioGroupItem value="all" id="pets-all" className="h-4 w-4" />
                        <span className="text-sm">All</span>
                      </label>
                      <label htmlFor="pets-yes" className="flex items-center gap-2 cursor-pointer py-1">
                        <RadioGroupItem value="yes" id="pets-yes" className="h-4 w-4" />
                        <span className="text-sm">Yes</span>
                      </label>
                      <label htmlFor="pets-no" className="flex items-center gap-2 cursor-pointer py-1">
                        <RadioGroupItem value="no" id="pets-no" className="h-4 w-4" />
                        <span className="text-sm">No</span>
                      </label>
                    </RadioGroup>
                  </div>

                  <div className="space-y-2">
                    <span className="text-xs text-muted-foreground">Events Allowed</span>
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
                      <label htmlFor="events-all" className="flex items-center gap-2 cursor-pointer py-1">
                        <RadioGroupItem value="all" id="events-all" className="h-4 w-4" />
                        <span className="text-sm">All</span>
                      </label>
                      <label htmlFor="events-yes" className="flex items-center gap-2 cursor-pointer py-1">
                        <RadioGroupItem value="yes" id="events-yes" className="h-4 w-4" />
                        <span className="text-sm">Yes</span>
                      </label>
                      <label htmlFor="events-no" className="flex items-center gap-2 cursor-pointer py-1">
                        <RadioGroupItem value="no" id="events-no" className="h-4 w-4" />
                        <span className="text-sm">No</span>
                      </label>
                    </RadioGroup>
                  </div>

                  <div className="space-y-2">
                    <span className="text-xs text-muted-foreground">Smoking Allowed</span>
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
                      <label htmlFor="smoking-all" className="flex items-center gap-2 cursor-pointer py-1">
                        <RadioGroupItem value="all" id="smoking-all" className="h-4 w-4" />
                        <span className="text-sm">All</span>
                      </label>
                      <label htmlFor="smoking-yes" className="flex items-center gap-2 cursor-pointer py-1">
                        <RadioGroupItem value="yes" id="smoking-yes" className="h-4 w-4" />
                        <span className="text-sm">Yes</span>
                      </label>
                      <label htmlFor="smoking-no" className="flex items-center gap-2 cursor-pointer py-1">
                        <RadioGroupItem value="no" id="smoking-no" className="h-4 w-4" />
                        <span className="text-sm">No</span>
                      </label>
                    </RadioGroup>
                  </div>
                </div>

                <div className="h-px bg-border" />

                {/* Price Range */}
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Price per night (€)</Label>
                  <div className="flex gap-2 items-center">
                    <Input
                      type="number"
                      min={0}
                      value={localFilters.minPrice || ""}
                      onChange={(e) => updateLocalFilter("minPrice", e.target.value ? parseInt(e.target.value) : undefined)}
                      placeholder="Min"
                      className="h-8 text-sm"
                    />
                    <span className="text-xs text-muted-foreground">–</span>
                    <Input
                      type="number"
                      min={0}
                      value={localFilters.maxPrice || ""}
                      onChange={(e) => updateLocalFilter("maxPrice", e.target.value ? parseInt(e.target.value) : undefined)}
                      placeholder="Max"
                      className="h-8 text-sm"
                    />
                  </div>
                </div>

                <div className="h-px bg-border" />

                {/* Property Categories */}
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Property Categories</Label>
                  <div className="grid gap-2">
                    {PROPERTY_CATEGORIES.map((category) => (
                      <label
                        key={category.value}
                        htmlFor={`category-${category.value}`}
                        className="flex items-center gap-2 cursor-pointer group py-1"
                      >
                        <Checkbox
                          id={`category-${category.value}`}
                          checked={localFilters.categories?.includes(category.value) || false}
                          onCheckedChange={(checked) => {
                            const current = localFilters.categories || []
                            if (checked) {
                              updateLocalFilter("categories", [...current, category.value])
                            } else {
                              updateLocalFilter("categories", current.filter(c => c !== category.value))
                            }
                          }}
                          className="h-4 w-4"
                        />
                        <div>
                          <span className="text-sm group-hover:text-foreground transition-colors">
                            {category.label}
                          </span>
                          <div className="text-xs text-muted-foreground">{category.description}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="h-px bg-border" />

                {/* Accessibility */}
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Accessibility</Label>
                  <div className="grid gap-2">
                    {ACCESSIBILITY_OPTIONS.map((option) => (
                      <label
                        key={option.value}
                        htmlFor={`accessibility-${option.value}`}
                        className="flex items-center gap-2 cursor-pointer group py-1"
                      >
                        <Checkbox
                          id={`accessibility-${option.value}`}
                          checked={localFilters.accessibilityOptions?.includes(option.value) || false}
                          onCheckedChange={(checked) => {
                            const current = localFilters.accessibilityOptions || []
                            if (checked) {
                              updateLocalFilter("accessibilityOptions", [...current, option.value])
                            } else {
                              updateLocalFilter("accessibilityOptions", current.filter(a => a !== option.value))
                            }
                          }}
                          className="h-4 w-4"
                        />
                        <div>
                          <span className="text-sm group-hover:text-foreground transition-colors">
                            {option.label}
                          </span>
                          <div className="text-xs text-muted-foreground">{option.description}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="h-px bg-border" />

                {/* Promotions */}
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Promotions</Label>
                  <div className="grid gap-2">
                    <label
                      htmlFor="showOnWebsite"
                      className="flex items-center gap-2 cursor-pointer group py-1"
                    >
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
                        className="h-4 w-4"
                      />
                      <span className="text-sm group-hover:text-foreground transition-colors">
                        Show on Website
                      </span>
                    </label>
                    <label
                      htmlFor="highlight"
                      className="flex items-center gap-2 cursor-pointer group py-1"
                    >
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
                        className="h-4 w-4"
                      />
                      <span className="text-sm group-hover:text-foreground transition-colors">
                        Highlighted Property
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            </ScrollArea>

            {/* Actions */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-background border-t">
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  onClick={handleClearFilters}
                  className="flex-1 h-9 text-sm hover:bg-muted"
                >
                  Clear All
                </Button>
                <Button
                  onClick={handleApplyFilters}
                  className="flex-1 h-9 text-sm bg-[#B5985A] hover:bg-[#B5985A]/90 text-white"
                >
                  Apply Filters
                </Button>
              </div>
            </div>
          </SheetContent>
      </Sheet>

      {/* Filter chips */}
      {activeFilterCount > 0 && (
        <div className={cn("flex flex-wrap items-center gap-2", className)}>
          <>
            {(filters.destinationId || filters.destinationIds?.length) && (
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
                {filters.destinationIds?.map(id => {
                  const dest = Object.values(destinationsData?.grouped || {})
                    .flat()
                    .find(d => d.id === id)
                  return dest ? (
                    <Badge key={id} variant="secondary" className="gap-1">
                      {dest.name}
                      <button
                        onClick={() => {
                          const newIds = filters.destinationIds?.filter(did => did !== id) || []
                          const newFilters = { ...filters }
                          if (newIds.length > 0) {
                            newFilters.destinationIds = newIds
                          } else {
                            delete newFilters.destinationIds
                          }
                          onFiltersChange(newFilters)
                        }}
                        className="ml-1 hover:bg-secondary-foreground/20 rounded"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ) : null
                })}
              </>
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
        </div>
      )}
    </>
  )
}