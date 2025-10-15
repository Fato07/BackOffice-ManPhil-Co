"use client"

import { useRef, useState, useEffect, useMemo } from "react"
import Map, { 
  Marker, 
  Popup, 
  ScaleControl,
  MapRef
} from "react-map-gl/mapbox"
import mapboxgl from "mapbox-gl"
import "mapbox-gl/dist/mapbox-gl.css"
import { motion, AnimatePresence } from "framer-motion"
import { Home } from "lucide-react"
import type { ViewMode } from "../map/map-controls"
import type { PropertyMapData } from "@/hooks/use-properties-map"

interface PropertiesMapProps {
  properties: PropertyMapData[]
  onPropertySelect: (property: PropertyMapData) => void
  selectedProperty: PropertyMapData | null
  onMapRef?: (map: MapRef | null) => void
  mapStyle: string
  onStyleChange: (style: string) => void
  viewMode?: ViewMode
  onViewModeChange?: (mode: ViewMode) => void
  onMapReady?: (controls: MapControls) => void
}

export interface MapControls {
  zoomIn: () => void
  zoomOut: () => void
  resetView: () => void
  toggleFullscreen: () => void
}

// Mapbox styles
const MAP_STYLES = {
  light: "mapbox://styles/mapbox/light-v11",
  streets: "mapbox://styles/mapbox/streets-v12"
}

// Workaround for Mapbox GL JS in Next.js
if (typeof window !== "undefined" && !mapboxgl.workerUrl) {
  mapboxgl.workerUrl = "https://api.mapbox.com/mapbox-gl-js/v3.14.0/mapbox-gl-csp-worker.js"
}

// Type for individual property points on the map
interface PointProperties {
  property: PropertyMapData
}

type PointFeature = GeoJSON.Feature<GeoJSON.Point, PointProperties>

export function PropertiesMap({
  properties,
  onPropertySelect,
  selectedProperty,
  onMapRef,
  mapStyle,
  onStyleChange,
  viewMode = "2D",
  onViewModeChange,
  onMapReady
}: PropertiesMapProps) {
  const mapRef = useRef<MapRef>(null)
  const [popupInfo, setPopupInfo] = useState<PropertyMapData | null>(null)
  const [hoveredProperty, setHoveredProperty] = useState<PropertyMapData | null>(null)
  const [viewState, setViewState] = useState({
    longitude: 2.3522,
    latitude: 48.8566,
    zoom: 5,
    pitch: viewMode === "3D" ? 45 : 0,
    bearing: 0
  })
  const [isMobile, setIsMobile] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Map control functions
  const mapControls: MapControls = {
    zoomIn: () => {
      const currentZoom = mapRef.current?.getZoom() || 5
      mapRef.current?.flyTo({
        zoom: Math.min(currentZoom + 1, 18),
        duration: 300
      })
    },
    zoomOut: () => {
      const currentZoom = mapRef.current?.getZoom() || 5
      mapRef.current?.flyTo({
        zoom: Math.max(currentZoom - 1, 2),
        duration: 300
      })
    },
    resetView: () => {
      mapRef.current?.flyTo({
        center: [2.3522, 48.8566],
        zoom: 5,
        pitch: viewMode === "3D" ? 45 : 0,
        bearing: 0,
        duration: 1000
      })
    },
    toggleFullscreen: () => {
      if (!document.fullscreenElement) {
        const mapContainer = mapRef.current?.getContainer()?.parentElement
        if (mapContainer) {
          mapContainer.requestFullscreen()
          setIsFullscreen(true)
        }
      } else {
        document.exitFullscreen()
        setIsFullscreen(false)
      }
    }
  }

  // Handle responsive behavior
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Handle view mode changes
  useEffect(() => {
    const map = mapRef.current?.getMap()
    if (!map) return

    if (viewMode === "2D") {
      // Transition to 2D mode
      mapRef.current?.flyTo({
        pitch: 0,
        bearing: 0,
        duration: 1000
      })
      
      // Remove 3D features after transition
      setTimeout(() => {
        remove3DFeatures(map)
      }, 1100)
    } else {
      // Transition to 3D mode
      mapRef.current?.flyTo({
        pitch: 45,
        bearing: -20,
        duration: 1000
      })
      
      // Add 3D features after transition starts
      setTimeout(() => {
        add3DFeatures(map)
      }, 500)
    }
  }, [viewMode])

  // Convert properties to map points for flat display
  const mapPoints = useMemo(() => {
    const points: PointFeature[] = properties
      .filter(property => property.latitude && property.longitude)
      .map(property => ({
        type: "Feature" as const,
        properties: {
          property
        },
        geometry: {
          type: "Point" as const,
          coordinates: [property.longitude!, property.latitude!]
        }
      }))

    return points
  }, [properties])

  useEffect(() => {
    if (selectedProperty && selectedProperty.longitude && selectedProperty.latitude) {
      mapRef.current?.flyTo({
        center: [selectedProperty.longitude, selectedProperty.latitude],
        zoom: 12,
        pitch: viewMode === "3D" ? 60 : 0,
        bearing: viewMode === "3D" ? -20 : 0,
        duration: 2000
      })
    }
  }, [selectedProperty, viewMode])

  // Re-apply 3D features when map style changes
  useEffect(() => {
    const map = mapRef.current?.getMap()
    if (map && map.isStyleLoaded() && viewMode === "3D") {
      // Wait a bit for the new style to fully load
      setTimeout(() => {
        add3DFeatures(map)
      }, 100)
    }
  }, [mapStyle, viewMode])

  const handleMarkerClick = (property: PropertyMapData) => {
    // Clear hover state when clicking
    setHoveredProperty(null)
    
    // Zoom to property location with smooth animation
    mapRef.current?.flyTo({
      center: [property.longitude, property.latitude],
      zoom: 15, // Close zoom level for property detail
      pitch: viewMode === "3D" ? 60 : 0,
      bearing: viewMode === "3D" ? -20 : 0,
      duration: 1500 // Smooth 1.5s animation
    })
    
    // Show popup after a brief delay to let zoom start
    setTimeout(() => {
      setPopupInfo(property)
    }, 300)
  }

  const handleMarkerHover = (property: PropertyMapData) => {
    // Only show hover if no popup is currently displayed
    if (!popupInfo) {
      setHoveredProperty(property)
    }
  }

  const handleMarkerLeave = () => {
    setHoveredProperty(null)
  }

  const onMapLoad = () => {
    const map = mapRef.current?.getMap()
    if (!map) return
    
    // Expose map reference to parent
    if (onMapRef) {
      onMapRef(mapRef.current)
    }

    // Expose map controls to parent
    if (onMapReady) {
      onMapReady(mapControls)
    }

    // Only add 3D features if in 3D mode
    if (viewMode === "3D") {
      // Wait for style to load before adding 3D features
      if (map.isStyleLoaded()) {
        add3DFeatures(map)
      } else {
        map.once('style.load', () => {
          add3DFeatures(map)
        })
      }
    }
  }

  const add3DFeatures = (map: any) => {
    try {
      // Add terrain source
      if (!map.getSource('mapbox-dem')) {
        map.addSource('mapbox-dem', {
          type: 'raster-dem',
          url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
          tileSize: 512,
          maxzoom: 14
        })
        map.setTerrain({ source: 'mapbox-dem', exaggeration: 1.5 })
      }

      // Add sky atmosphere
      map.setFog({
        color: 'rgb(186, 210, 235)',
        'high-color': 'rgb(36, 92, 223)',
        'horizon-blend': 0.02,
        'space-color': 'rgb(11, 11, 25)',
        'star-intensity': 0.6
      })

      // Add 3D buildings
      const layers = map.getStyle()?.layers
      if (!layers) return

      // Find the label layer to insert buildings before it
      const labelLayerId = layers.find(
        (layer: any) => layer.type === 'symbol' && layer.layout?.['text-field']
      )?.id

      // Check if 3D buildings layer already exists
      if (!map.getLayer('add-3d-buildings')) {
        map.addLayer(
          {
            id: 'add-3d-buildings',
            source: 'composite',
            'source-layer': 'building',
            filter: ['==', 'extrude', 'true'],
            type: 'fill-extrusion',
            minzoom: 15,
            paint: {
              'fill-extrusion-color': '#1a1a1a',
              'fill-extrusion-height': [
                'interpolate',
                ['linear'],
                ['zoom'],
                15,
                0,
                15.05,
                ['get', 'height']
              ],
              'fill-extrusion-base': [
                'interpolate',
                ['linear'],
                ['zoom'],
                15,
                0,
                15.05,
                ['get', 'min_height']
              ],
              'fill-extrusion-opacity': 0.8
            }
          },
          labelLayerId
        )
      }
    } catch (error) {
      console.warn('Failed to add 3D features to map:', error)
    }
  }

  const remove3DFeatures = (map: any) => {
    try {
      // Remove terrain
      map.setTerrain(null)
      
      // Remove fog
      map.setFog(null)
      
      // Remove 3D buildings layer
      if (map.getLayer('add-3d-buildings')) {
        map.removeLayer('add-3d-buildings')
      }
    } catch (error) {
      console.warn('Failed to remove 3D features from map:', error)
    }
  }

  return (
    <div className="relative h-full w-full">
      <Map
        ref={mapRef}
        mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}
        initialViewState={{
          longitude: 2.3522,
          latitude: 48.8566,
          zoom: 5,
          pitch: viewMode === "3D" ? 45 : 0,
          bearing: 0
        }}
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        onClick={() => {
          // Clear popup when clicking on empty map area
          setPopupInfo(null)
          setHoveredProperty(null)
        }}
        mapStyle={mapStyle}
        style={{ width: "100%", height: "100%" }}
        maxZoom={18}
        minZoom={2}
        onLoad={onMapLoad}
        maxPitch={viewMode === "3D" ? 85 : 0}
      >
        <ScaleControl 
          position="bottom-left" 
          style={{ 
            marginBottom: 20, 
            marginLeft: isMobile ? 8 : 16 
          }} 
        />

        {mapPoints.map((point) => {
          const [longitude, latitude] = point.geometry.coordinates
          const property = point.properties.property
          
          return (
            <Marker
              key={property.id}
              longitude={longitude}
              latitude={latitude}
              anchor="bottom"
              onClick={() => handleMarkerClick(property)}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="relative cursor-pointer"
                onMouseEnter={() => handleMarkerHover(property)}
                onMouseLeave={handleMarkerLeave}
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-[#B5985A] rounded-full blur-md opacity-50 animate-pulse" />
                  <div className="relative bg-gradient-to-br from-[#B5985A] to-[#d4af37] rounded-full p-3 shadow-2xl border border-white/20">
                    <Home className="w-5 h-5 text-white" />
                  </div>
                  {/* Property marker indicator */}
                  <div className="absolute -top-2 -right-2 bg-white text-black text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-lg">
                    <Home className="w-3 h-3" />
                  </div>
                </div>
              </motion.div>
            </Marker>
          )
        })}

        {/* Hover Property Card - Lightweight preview */}
        <AnimatePresence>
          {hoveredProperty && (
            <Popup
              anchor="top"
              longitude={Number(hoveredProperty.longitude)}
              latitude={Number(hoveredProperty.latitude)}
              closeButton={false}
              className="!p-0 pointer-events-none"
              maxWidth="240px"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 5 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 5 }}
                transition={{ duration: 0.15 }}
                className="bg-gradient-to-b from-gray-900/95 to-black/95 backdrop-blur-lg rounded-lg overflow-hidden border border-[#B5985A]/30 shadow-xl"
              >
                <div className="p-3">
                  <h4 className="text-white font-semibold text-sm mb-1 line-clamp-1">
                    {hoveredProperty.name}
                  </h4>
                  <p className="text-gray-300 text-xs mb-2">
                    {hoveredProperty.destination.name}, {hoveredProperty.destination.country}
                  </p>
                  <p className="text-gray-400 text-xs">
                    Click to zoom in & view details
                  </p>
                </div>
              </motion.div>
            </Popup>
          )}
        </AnimatePresence>

        {/* Click Property Popup - Detailed view */}
        {popupInfo && (
          <Popup
            anchor="top"
            longitude={Number(popupInfo.longitude)}
            latitude={Number(popupInfo.latitude)}
            onClose={() => setPopupInfo(null)}
            closeButton={false}
            className="!p-0"
            maxWidth={isMobile ? "280px" : "320px"}
          >
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-b from-gray-950 to-black backdrop-blur-xl rounded-xl overflow-hidden border border-[#B5985A]/20 shadow-2xl"
            >
              <div className="relative h-32 bg-gradient-to-br from-[#B5985A]/20 to-[#d4af37]/20">
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                <div className="absolute bottom-3 left-4 right-4">
                  <h3 className="text-white font-bold text-xl">{popupInfo.name}</h3>
                  <p className="text-gray-300 text-sm">
                    {popupInfo.destination.name}, {popupInfo.destination.country}
                  </p>
                </div>
              </div>
              
              <div className="p-4 space-y-4">
                <div className="bg-white/5 rounded-lg p-3">
                  <p className="text-gray-400 text-xs">Location</p>
                  <p className="text-white text-sm">{popupInfo.latitude?.toFixed(4)}, {popupInfo.longitude?.toFixed(4)}</p>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      onPropertySelect(popupInfo)
                      setPopupInfo(null)
                    }}
                    className="flex-1 bg-[#B5985A] hover:bg-[#d4af37] text-black font-medium py-2 px-4 rounded-lg transition-colors"
                  >
                    View Details
                  </button>
                  <button
                    onClick={() => setPopupInfo(null)}
                    className="px-4 py-2 rounded-lg border border-white/10 text-white hover:bg-white/5 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </Popup>
        )}
      </Map>

      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-transparent" />
      </div>
    </div>
  )
}