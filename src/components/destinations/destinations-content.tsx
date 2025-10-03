"use client"

import { useState } from "react"
import { DestinationsMap, MapControls as MapControlsFunctions } from "./map/destinations-map"
import { MapToolbar } from "./map/map-toolbar"
import { ViewMode as MapViewMode } from "./map/map-controls"
import { DestinationSidebar } from "./ui/destination-sidebar"
import { ViewToggle } from "./views/view-toggle"
import { GridView } from "./views/grid-view"
import { StatsWidget } from "./ui/stats-widget"
import { CreateDestinationDialog } from "./dialogs/create-destination-dialog"
import { MapSkeleton } from "./map/map-skeleton"
import { motion, AnimatePresence } from "framer-motion"
import { useDestinations, DestinationWithCount } from "@/hooks/use-destinations"

export type ViewMode = "map" | "grid"

const MAP_STYLES = {
  light: "mapbox://styles/mapbox/light-v11",
  streets: "mapbox://styles/mapbox/streets-v12",
}

export function DestinationsContent() {
  const [viewMode, setViewMode] = useState<ViewMode>("map")
  const [selectedDestination, setSelectedDestination] = useState<DestinationWithCount | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [mapRef, setMapRef] = useState<any>(null)
  const [mapStyle, setMapStyle] = useState(MAP_STYLES.light)
  const [mapViewMode, setMapViewMode] = useState<MapViewMode>("3D")
  const [mapControls, setMapControls] = useState<MapControlsFunctions | null>(null)
  const { data, isLoading } = useDestinations()

  const handleDestinationSelect = (destination: DestinationWithCount) => {
    setSelectedDestination(destination)
    setSidebarOpen(true)
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
            <DestinationsMap
              destinations={data?.destinations || []}
              onDestinationSelect={handleDestinationSelect}
              selectedDestination={selectedDestination}
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
              destinations={data?.destinations || []}
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
        <StatsWidget destinations={data?.destinations || []} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3 }}
        className="absolute bottom-20 right-8 z-10"
      >
        <CreateDestinationDialog />
      </motion.div>

      <AnimatePresence>
        {sidebarOpen && selectedDestination && (
          <DestinationSidebar
            destination={selectedDestination}
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}