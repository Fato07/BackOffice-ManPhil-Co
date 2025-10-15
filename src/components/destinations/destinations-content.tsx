"use client"

import { useState } from "react"
import { PropertiesMap, MapControls as MapControlsFunctions } from "./map/properties-map"
import { MapToolbar } from "./map/map-toolbar"
import { ViewMode as MapViewMode } from "./map/map-controls"
import { DestinationSidebar } from "./ui/destination-sidebar"
import { PropertySidebar } from "./ui/property-sidebar"
import { ViewToggle } from "./views/view-toggle"
import { GridView } from "./views/grid-view"
import { StatsWidget } from "./ui/stats-widget"
import { CreateDestinationDialog } from "./dialogs/create-destination-dialog"
import { MapSkeleton } from "./map/map-skeleton"
import { motion, AnimatePresence } from "framer-motion"
import { useDestinations, DestinationWithCount } from "@/hooks/use-destinations"
import { usePropertiesMap, PropertyMapData } from "@/hooks/use-properties-map"

export type ViewMode = "map" | "grid"

const MAP_STYLES = {
  light: "mapbox://styles/mapbox/light-v11",
  streets: "mapbox://styles/mapbox/streets-v12",
}

export function DestinationsContent() {
  const [viewMode, setViewMode] = useState<ViewMode>("map")
  const [selectedProperty, setSelectedProperty] = useState<PropertyMapData | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [mapRef, setMapRef] = useState<any>(null)
  const [mapStyle, setMapStyle] = useState(MAP_STYLES.light)
  const [mapViewMode, setMapViewMode] = useState<MapViewMode>("2D")
  const [mapControls, setMapControls] = useState<MapControlsFunctions | null>(null)
  const { data: destinationsData, isLoading: destinationsLoading } = useDestinations()
  const { data: propertiesData, isLoading: propertiesLoading } = usePropertiesMap()

  const isLoading = destinationsLoading || propertiesLoading

  const handlePropertySelect = (property: PropertyMapData) => {
    setSelectedProperty(property)
    setSidebarOpen(true)
  }

  // Keep destination select for grid view compatibility
  const handleDestinationSelect = (destination: DestinationWithCount) => {
    // For now, just close sidebar - we could enhance this later
    setSidebarOpen(false)
  }

  const handleLocationSearch = (coords: { longitude: number; latitude: number; name: string }) => {
    if (mapRef && viewMode === "map") {
      mapRef.flyTo({
        center: [coords.longitude, coords.latitude],
        zoom: 10,
        duration: 2000
      })
    }
  }

  return (
    <div className="relative h-[calc(100vh-4rem)] overflow-hidden bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-full"
          >
            <MapSkeleton />
          </motion.div>
        ) : viewMode === "map" ? (
          <motion.div
            key="map"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-full"
          >
            <PropertiesMap
              properties={propertiesData?.properties || []}
              onPropertySelect={handlePropertySelect}
              selectedProperty={selectedProperty}
              onMapRef={setMapRef}
              mapStyle={mapStyle}
              onStyleChange={setMapStyle}
              viewMode={mapViewMode}
              onViewModeChange={setMapViewMode}
              onMapReady={setMapControls}
            />
          </motion.div>
        ) : null}
        
        {viewMode === "grid" && (
          <motion.div
            key="grid"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="h-full overflow-auto p-6"
          >
            <GridView
              destinations={destinationsData?.destinations || []}
              onDestinationSelect={handleDestinationSelect}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <MapToolbar 
        onLocationSearch={handleLocationSearch}
        mapStyle={mapStyle}
        onStyleChange={setMapStyle}
        viewMode={mapViewMode}
        onViewModeChange={setMapViewMode}
        onZoomIn={mapControls?.zoomIn}
        onZoomOut={mapControls?.zoomOut}
        onResetView={mapControls?.resetView}
        onFullscreen={mapControls?.toggleFullscreen}
      />

      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
        className="absolute top-4 left-4 z-10 hidden sm:block"
      >
        <ViewToggle currentView={viewMode} onViewChange={setViewMode} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
        className="absolute bottom-24 right-4 sm:top-4 sm:bottom-auto z-10"
      >
        <StatsWidget destinations={destinationsData?.destinations || []} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3 }}
        className="absolute bottom-20 right-8 z-10"
      >
        <CreateDestinationDialog />
      </motion.div>

      {/* Property sidebar for map view - shows comprehensive property details */}
      {selectedProperty && viewMode === "map" && (
        <PropertySidebar
          property={selectedProperty}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
      )}
    </div>
  )
}