"use client"

import { useState, useEffect, useMemo } from "react"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter 
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Search, 
  MapPin, 
  Home, 
  Link, 
  Unlink,
  Clock,
  Route,
  Plus,
  Minus,
  Save,
  X,
  Loader2,
  Filter
} from "lucide-react"
import { ActivityProvider } from "@/types/activity-provider"
import { PropertyListItem } from "@/types/property"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"

interface PropertyLinkingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  provider: ActivityProvider
  allProperties: PropertyListItem[]
  linkedPropertyIds: string[]
  onLinkProperty: (propertyId: string, distance?: number, walkingTime?: number, drivingTime?: number, notes?: string) => Promise<void>
  onUnlinkProperty: (propertyId: string) => Promise<void>
  onBulkLink: (propertyIds: string[]) => Promise<void>
  onBulkUnlink: (propertyIds: string[]) => Promise<void>
  isLoading?: boolean
}

interface PropertyWithDistance extends PropertyListItem {
  distance?: number
  walkingTime?: number
  drivingTime?: number
  notes?: string
  isLinked: boolean
}

interface LinkingData {
  distance?: number
  walkingTime?: number
  drivingTime?: number
  notes?: string
}

// Calculate distance between two coordinates using Haversine formula
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371 // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * (Math.PI / 180)
  const dLon = (lon2 - lon1) * (Math.PI / 180)
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export function PropertyLinkingDialog({
  open,
  onOpenChange,
  provider,
  allProperties,
  linkedPropertyIds,
  onLinkProperty,
  onUnlinkProperty,
  onBulkLink,
  onBulkUnlink,
  isLoading = false
}: PropertyLinkingDialogProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedProperties, setSelectedProperties] = useState<Set<string>>(new Set())
  const [linkingData, setLinkingData] = useState<Record<string, LinkingData>>({})
  const [editingProperty, setEditingProperty] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'linked' | 'unlinked'>('all')
  const [isUpdating, setIsUpdating] = useState(false)

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setSearchQuery("")
      setSelectedProperties(new Set())
      setLinkingData({})
      setEditingProperty(null)
      setFilter('all')
    }
  }, [open])

  // Prepare properties with distance and linking status
  const propertiesWithDistance = useMemo<PropertyWithDistance[]>(() => {
    return allProperties.map(property => {
      const isLinked = linkedPropertyIds.includes(property.id)
      let distance: number | undefined
      
      // Calculate distance if both provider and property have coordinates
      // Note: Properties might not have coordinates yet, this is a placeholder
      // You'll need to add latitude/longitude fields to the Property model
      if (provider.latitude && provider.longitude) {
        // Placeholder: assuming properties will have coordinates
        // distance = calculateDistance(
        //   provider.latitude,
        //   provider.longitude,
        //   property.latitude || 0,
        //   property.longitude || 0
        // )
      }

      return {
        ...property,
        distance,
        isLinked,
        ...linkingData[property.id]
      }
    })
  }, [allProperties, linkedPropertyIds, provider, linkingData])

  // Filter and search properties
  const filteredProperties = useMemo(() => {
    let filtered = propertiesWithDistance

    // Apply filter
    if (filter === 'linked') {
      filtered = filtered.filter(p => p.isLinked)
    } else if (filter === 'unlinked') {
      filtered = filtered.filter(p => !p.isLinked)
    }

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(property => 
        property.name.toLowerCase().includes(query) ||
        property.city?.toLowerCase().includes(query) ||
        property.destination.name.toLowerCase().includes(query) ||
        property.destination.country.toLowerCase().includes(query)
      )
    }

    // Sort by distance if available, then by name
    return filtered.sort((a, b) => {
      if (a.distance !== undefined && b.distance !== undefined) {
        return a.distance - b.distance
      }
      if (a.distance !== undefined) return -1
      if (b.distance !== undefined) return 1
      return a.name.localeCompare(b.name)
    })
  }, [propertiesWithDistance, searchQuery, filter])

  // Handle property selection for bulk operations
  const handlePropertySelect = (propertyId: string) => {
    const newSelected = new Set(selectedProperties)
    if (newSelected.has(propertyId)) {
      newSelected.delete(propertyId)
    } else {
      newSelected.add(propertyId)
    }
    setSelectedProperties(newSelected)
  }

  // Handle select all
  const handleSelectAll = () => {
    if (selectedProperties.size === filteredProperties.length) {
      setSelectedProperties(new Set())
    } else {
      setSelectedProperties(new Set(filteredProperties.map(p => p.id)))
    }
  }

  // Handle individual link/unlink
  const handleToggleLink = async (property: PropertyWithDistance) => {
    setIsUpdating(true)
    try {
      if (property.isLinked) {
        await onUnlinkProperty(property.id)
      } else {
        const data = linkingData[property.id]
        await onLinkProperty(
          property.id,
          data?.distance,
          data?.walkingTime,
          data?.drivingTime,
          data?.notes
        )
      }
    } catch (error) {
      console.error("Failed to toggle property link:", error)
    } finally {
      setIsUpdating(false)
    }
  }

  // Handle bulk operations
  const handleBulkLink = async () => {
    const unlinkedSelected = Array.from(selectedProperties).filter(id => 
      !linkedPropertyIds.includes(id)
    )
    if (unlinkedSelected.length === 0) return

    setIsUpdating(true)
    try {
      await onBulkLink(unlinkedSelected)
      setSelectedProperties(new Set())
    } catch (error) {
      console.error("Failed to bulk link properties:", error)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleBulkUnlink = async () => {
    const linkedSelected = Array.from(selectedProperties).filter(id => 
      linkedPropertyIds.includes(id)
    )
    if (linkedSelected.length === 0) return

    setIsUpdating(true)
    try {
      await onBulkUnlink(linkedSelected)
      setSelectedProperties(new Set())
    } catch (error) {
      console.error("Failed to bulk unlink properties:", error)
    } finally {
      setIsUpdating(false)
    }
  }

  // Update linking data
  const updateLinkingData = (propertyId: string, data: Partial<LinkingData>) => {
    setLinkingData(prev => ({
      ...prev,
      [propertyId]: { ...prev[propertyId], ...data }
    }))
  }

  const formatDistance = (distance: number) => {
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m`
    }
    return `${distance.toFixed(1)}km`
  }

  const linkedCount = filteredProperties.filter(p => p.isLinked).length
  const selectedLinked = Array.from(selectedProperties).filter(id => linkedPropertyIds.includes(id)).length
  const selectedUnlinked = selectedProperties.size - selectedLinked

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-4xl h-[80vh] p-0"
        showCloseButton={false}
      >
        <div className="flex flex-col h-full">
          <DialogHeader className="px-6 py-4 border-b">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle>Manage Property Links - {provider.name}</DialogTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Link properties to this activity provider and manage distances
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onOpenChange(false)}
                className="rounded-full"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </DialogHeader>

          {/* Search and Filters */}
          <div className="px-6 py-4 border-b bg-gray-50 dark:bg-gray-900">
            <div className="flex gap-4 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search properties..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              {/* Filter buttons */}
              <div className="flex gap-1 bg-white dark:bg-gray-800 border rounded-lg p-1">
                {['all', 'linked', 'unlinked'].map((filterOption) => (
                  <Button
                    key={filterOption}
                    variant={filter === filterOption ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setFilter(filterOption as any)}
                    className="capitalize"
                  >
                    <Filter className="w-3 h-3 mr-1" />
                    {filterOption}
                  </Button>
                ))}
              </div>
            </div>

            {/* Stats and bulk actions */}
            <div className="flex items-center justify-between mt-4">
              <div className="flex gap-4 text-sm text-muted-foreground">
                <span>{filteredProperties.length} properties</span>
                <span>{linkedCount} linked</span>
                {selectedProperties.size > 0 && (
                  <span className="text-foreground font-medium">
                    {selectedProperties.size} selected
                  </span>
                )}
              </div>

              {selectedProperties.size > 0 && (
                <div className="flex gap-2">
                  {selectedUnlinked > 0 && (
                    <Button
                      size="sm"
                      onClick={handleBulkLink}
                      disabled={isUpdating}
                    >
                      <Link className="w-3 h-3 mr-1" />
                      Link {selectedUnlinked}
                    </Button>
                  )}
                  {selectedLinked > 0 && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleBulkUnlink}
                      disabled={isUpdating}
                    >
                      <Unlink className="w-3 h-3 mr-1" />
                      Unlink {selectedLinked}
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Properties List */}
          <div className="flex-1 overflow-hidden">
            <div className="h-full overflow-y-auto">
              {/* Select All Header */}
              <div className="sticky top-0 bg-gray-50 dark:bg-gray-900 border-b px-6 py-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedProperties.size === filteredProperties.length && filteredProperties.length > 0}
                    onChange={handleSelectAll}
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-medium">
                    Select All ({filteredProperties.length})
                  </span>
                </label>
              </div>

              {/* Properties */}
              <div className="space-y-2 p-4">
                <AnimatePresence>
                  {filteredProperties.map((property) => (
                    <motion.div
                      key={property.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className={cn(
                        "border rounded-lg p-4 transition-all hover:shadow-md",
                        property.isLinked ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800" : "bg-white dark:bg-gray-800",
                        selectedProperties.has(property.id) && "ring-2 ring-primary"
                      )}
                    >
                      <div className="flex items-start gap-4">
                        {/* Checkbox */}
                        <input
                          type="checkbox"
                          checked={selectedProperties.has(property.id)}
                          onChange={() => handlePropertySelect(property.id)}
                          className="w-4 h-4 mt-1"
                        />

                        {/* Property Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <Home className="w-4 h-4 text-muted-foreground" />
                            <h3 className="font-medium text-sm">{property.name}</h3>
                            {property.isLinked && (
                              <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-1 rounded-full text-xs font-medium">
                                Linked
                              </span>
                            )}
                          </div>
                          
                          <div className="text-sm text-muted-foreground space-y-1">
                            <div className="flex items-center gap-4">
                              <span>{property.destination.name}, {property.destination.country}</span>
                              {property.city && <span>{property.city}</span>}
                            </div>
                            <div className="flex items-center gap-4">
                              <span>{property.numberOfRooms} rooms • {property.numberOfBathrooms} baths • {property.maxGuests} guests</span>
                              {property.distance && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {formatDistance(property.distance)}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Distance and Time Inputs */}
                          {(property.isLinked || editingProperty === property.id) && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="mt-3 pt-3 border-t"
                            >
                              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                <div>
                                  <label className="text-xs text-muted-foreground">Distance (km)</label>
                                  <Input
                                    type="number"
                                    step="0.1"
                                    placeholder="0.0"
                                    value={linkingData[property.id]?.distance || ""}
                                    onChange={(e) => updateLinkingData(property.id, {
                                      distance: e.target.value ? parseFloat(e.target.value) : undefined
                                    })}
                                    className="h-8 text-xs"
                                  />
                                </div>
                                <div>
                                  <label className="text-xs text-muted-foreground">Walking (min)</label>
                                  <Input
                                    type="number"
                                    placeholder="0"
                                    value={linkingData[property.id]?.walkingTime || ""}
                                    onChange={(e) => updateLinkingData(property.id, {
                                      walkingTime: e.target.value ? parseInt(e.target.value) : undefined
                                    })}
                                    className="h-8 text-xs"
                                  />
                                </div>
                                <div>
                                  <label className="text-xs text-muted-foreground">Driving (min)</label>
                                  <Input
                                    type="number"
                                    placeholder="0"
                                    value={linkingData[property.id]?.drivingTime || ""}
                                    onChange={(e) => updateLinkingData(property.id, {
                                      drivingTime: e.target.value ? parseInt(e.target.value) : undefined
                                    })}
                                    className="h-8 text-xs"
                                  />
                                </div>
                                <div>
                                  <label className="text-xs text-muted-foreground">Notes</label>
                                  <Input
                                    placeholder="Optional notes..."
                                    value={linkingData[property.id]?.notes || ""}
                                    onChange={(e) => updateLinkingData(property.id, {
                                      notes: e.target.value
                                    })}
                                    className="h-8 text-xs"
                                  />
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          {!property.isLinked && editingProperty !== property.id && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingProperty(property.id)}
                            >
                              <Plus className="w-3 h-3 mr-1" />
                              Add Details
                            </Button>
                          )}
                          
                          <Button
                            size="sm"
                            variant={property.isLinked ? "outline" : "default"}
                            onClick={() => handleToggleLink(property)}
                            disabled={isUpdating}
                          >
                            {property.isLinked ? (
                              <>
                                <Unlink className="w-3 h-3 mr-1" />
                                Unlink
                              </>
                            ) : (
                              <>
                                <Link className="w-3 h-3 mr-1" />
                                Link
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {filteredProperties.length === 0 && (
                  <div className="text-center py-12">
                    <Home className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-muted-foreground mb-2">No properties found</h3>
                    <p className="text-sm text-muted-foreground">
                      Try adjusting your search or filter criteria
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="px-6 py-4 border-t">
            <div className="flex items-center justify-between w-full">
              <div className="text-sm text-muted-foreground">
                {linkedPropertyIds.length} properties linked to {provider.name}
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}