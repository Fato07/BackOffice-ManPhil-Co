"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import Map, { 
  Marker, 
  ScaleControl,
  MapRef,
  GeolocateControl
} from "react-map-gl/mapbox"
import mapboxgl from "mapbox-gl"
import "mapbox-gl/dist/mapbox-gl.css"
import { motion } from "framer-motion"
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
  MapPin, 
  Search, 
  Crosshair, 
  Save, 
  X,
  Home,
  Loader2
} from "lucide-react"
import { ActivityProvider } from "@/types/activity-provider"
import { PropertyListItem } from "@/types/property"
import { cn } from "@/lib/utils"

interface MapViewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  provider: ActivityProvider
  onLocationUpdate: (latitude: number, longitude: number, address?: string) => Promise<void>
  nearbyProperties?: PropertyListItem[]
  isLoading?: boolean
}

interface MapLocation {
  latitude: number
  longitude: number
  address?: string
}

// Workaround for Mapbox GL JS in Next.js
if (typeof window !== "undefined" && !mapboxgl.workerUrl) {
  mapboxgl.workerUrl = "https://api.mapbox.com/mapbox-gl-js/v3.14.0/mapbox-gl-csp-worker.js"
}

export function MapViewDialog({
  open,
  onOpenChange,
  provider,
  onLocationUpdate,
  nearbyProperties = [],
  isLoading = false
}: MapViewDialogProps) {
  const mapRef = useRef<MapRef>(null)
  const [viewState, setViewState] = useState({
    longitude: provider.longitude || 2.3522,
    latitude: provider.latitude || 48.8566,
    zoom: provider.longitude && provider.latitude ? 15 : 5
  })
  const [selectedLocation, setSelectedLocation] = useState<MapLocation | null>(
    provider.longitude && provider.latitude 
      ? { latitude: provider.latitude, longitude: provider.longitude, address: provider.address || undefined }
      : null
  )
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isUpdating, setIsUpdating] = useState(false)

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setViewState({
        longitude: provider.longitude || 2.3522,
        latitude: provider.latitude || 48.8566,
        zoom: provider.longitude && provider.latitude ? 15 : 5
      })
      setSelectedLocation(
        provider.longitude && provider.latitude 
          ? { latitude: provider.latitude, longitude: provider.longitude, address: provider.address || undefined }
          : null
      )
      setSearchQuery("")
      setSearchResults([])
    }
  }, [open, provider])

  // Geocoding search using Mapbox Geocoding API
  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}&limit=5&language=en`
      )
      const data = await response.json()
      setSearchResults(data.features || [])
    } catch (error) {
      console.error("Geocoding search failed:", error)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }, [])

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      handleSearch(searchQuery)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchQuery, handleSearch])

  // Handle map click to set location
  const handleMapClick = useCallback((event: any) => {
    const { lng, lat } = event.lngLat
    setSelectedLocation({
      latitude: lat,
      longitude: lng
    })
    
    // Reverse geocode to get address
    reverseGeocode(lat, lng)
  }, [])

  // Reverse geocoding to get address from coordinates
  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}&limit=1`
      )
      const data = await response.json()
      if (data.features && data.features.length > 0) {
        const address = data.features[0].place_name
        setSelectedLocation(prev => prev ? { ...prev, address } : null)
      }
    } catch (error) {
      console.error("Reverse geocoding failed:", error)
    }
  }, [])

  // Handle search result selection
  const handleSearchResultSelect = useCallback((result: any) => {
    const [longitude, latitude] = result.center
    setSelectedLocation({
      latitude,
      longitude,
      address: result.place_name
    })
    setViewState(prev => ({
      ...prev,
      longitude,
      latitude,
      zoom: 15
    }))
    setSearchQuery("")
    setSearchResults([])

    // Fly to location
    mapRef.current?.flyTo({
      center: [longitude, latitude],
      zoom: 15,
      duration: 1000
    })
  }, [])

  // Center map on current location
  const centerOnCurrentLocation = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const { latitude, longitude } = position.coords
        setViewState(prev => ({
          ...prev,
          latitude,
          longitude,
          zoom: 15
        }))
        mapRef.current?.flyTo({
          center: [longitude, latitude],
          zoom: 15,
          duration: 1000
        })
      })
    }
  }, [])

  // Save location
  const handleSaveLocation = useCallback(async () => {
    if (!selectedLocation) return
    
    setIsUpdating(true)
    try {
      await onLocationUpdate(
        selectedLocation.latitude, 
        selectedLocation.longitude, 
        selectedLocation.address
      )
      onOpenChange(false)
    } catch (error) {
      console.error("Failed to update location:", error)
    } finally {
      setIsUpdating(false)
    }
  }, [selectedLocation, onLocationUpdate, onOpenChange])

  const getCurrentLocationMarker = () => {
    if (!provider.longitude || !provider.latitude) return null
    
    return (
      <Marker
        longitude={provider.longitude}
        latitude={provider.latitude}
        anchor="bottom"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.1 }}
          className="relative cursor-pointer"
          onClick={() => {
            mapRef.current?.flyTo({
              center: [provider.longitude!, provider.latitude!],
              zoom: 50,
              duration: 1000
            })
          }}
        >
          <div className="bg-blue-500 p-2 rounded-full border-2 border-white shadow-lg">
            <Home className="w-4 h-4 text-white" />
          </div>
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
            Current Location
          </div>
        </motion.div>
      </Marker>
    )
  }

  const getSelectedLocationMarker = () => {
    if (!selectedLocation) return null
    
    return (
      <Marker
        longitude={selectedLocation.longitude}
        latitude={selectedLocation.latitude}
        anchor="bottom"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.1 }}
          className="relative cursor-pointer"
          onClick={() => {
            mapRef.current?.flyTo({
              center: [selectedLocation.longitude, selectedLocation.latitude],
              zoom: 16,
              duration: 1000
            })
          }}
        >
          <div className="bg-[#B5985A] p-2 rounded-full border-2 border-white shadow-lg">
            <MapPin className="w-4 h-4 text-white" />
          </div>
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
            New Location
          </div>
        </motion.div>
      </Marker>
    )
  }

  const getNearbyPropertyMarkers = () => {
    return nearbyProperties.map((property) => {
      // Note: Properties might not have coordinates yet, so we'll need to add them
      // For now, this is a placeholder structure
      // Once properties have latitude/longitude fields, uncomment and use:
      /*
      if (!property.latitude || !property.longitude) return null
      
      return (
        <Marker
          key={property.id}
          longitude={property.longitude}
          latitude={property.latitude}
          anchor="bottom"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            whileHover={{ scale: 1.1 }}
            className="relative cursor-pointer"
            onClick={() => {
              mapRef.current?.flyTo({
                center: [property.longitude, property.latitude],
                zoom: 16,
                duration: 1000
              })
            }}
          >
            <div className="bg-green-500 p-2 rounded-full border-2 border-white shadow-lg">
              <Home className="w-3 h-3 text-white" />
            </div>
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
              {property.name}
            </div>
          </motion.div>
        </Marker>
      )
      */
      return null
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-6xl h-[80vh] p-0"
        showCloseButton={false}
      >
        <div className="flex flex-col h-full">
          <DialogHeader className="px-6 py-4 border-b">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle>Update Location - {provider.name}</DialogTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Click on the map to set a new location or search for an address
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

          {/* Search Bar */}
          <div className="px-6 py-4 border-b bg-gray-50 dark:bg-gray-900">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search for an address..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10"
              />
              {isSearching && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
              )}
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="absolute z-10 w-full left-0 px-6">
                <div className="bg-white dark:bg-gray-800 border rounded-lg shadow-lg mt-1 max-h-60 overflow-y-auto">
                  {searchResults.map((result, index) => (
                    <button
                      key={index}
                      onClick={() => handleSearchResultSelect(result)}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 border-b last:border-b-0"
                    >
                      <div className="font-medium text-sm">{result.text}</div>
                      <div className="text-xs text-muted-foreground">{result.place_name}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Map Container */}
          <div className="flex-1 relative">
            <Map
              ref={mapRef}
              mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}
              initialViewState={viewState}
              onMove={evt => setViewState(evt.viewState)}
              mapStyle="mapbox://styles/mapbox/streets-v12"
              style={{ width: "100%", height: "100%" }}
              onClick={handleMapClick}
              cursor={selectedLocation ? "crosshair" : "grab"}
            >
              <ScaleControl position="bottom-left" />
              
              <GeolocateControl
                position="top-right"
                trackUserLocation={false}
                showAccuracyCircle={false}
              />

              {/* Current location marker */}
              {getCurrentLocationMarker()}

              {/* Selected location marker */}
              {getSelectedLocationMarker()}

              {/* Nearby property markers */}
              {getNearbyPropertyMarkers()}
            </Map>

            {/* Map Instructions */}
            <div className="absolute top-4 left-4 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-lg p-3 shadow-lg max-w-xs">
              <div className="flex items-center gap-2 text-sm font-medium mb-2">
                <Crosshair className="w-4 h-4" />
                Instructions
              </div>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Click anywhere on the map to set a new location</li>
                <li>• Use the search bar to find specific addresses</li>
                <li>• Current location is marked with a blue house icon</li>
              </ul>
            </div>

            {/* Selected Location Info */}
            {selectedLocation && (
              <div className="absolute bottom-4 left-4 right-4 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm rounded-lg p-4 shadow-lg">
                <div className="flex items-start gap-3">
                  <div className="bg-[#B5985A] p-2 rounded-full">
                    <MapPin className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm">Selected Location</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      {selectedLocation.address || `${selectedLocation.latitude.toFixed(6)}, ${selectedLocation.longitude.toFixed(6)}`}
                    </p>
                    <div className="text-xs text-muted-foreground mt-1">
                      Coordinates: {selectedLocation.latitude.toFixed(6)}, {selectedLocation.longitude.toFixed(6)}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="px-6 py-4 border-t">
            <div className="flex items-center justify-between w-full">
              <Button
                variant="outline"
                onClick={centerOnCurrentLocation}
                size="sm"
              >
                <Crosshair className="w-4 h-4 mr-2" />
                My Location
              </Button>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveLocation}
                  disabled={!selectedLocation || isUpdating}
                >
                  {isUpdating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Location
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}