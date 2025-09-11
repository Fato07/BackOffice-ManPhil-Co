"use client"

import { useRef, useState, useEffect, useMemo } from "react"
import Map, { 
  Marker, 
  Popup, 
  NavigationControl, 
  ScaleControl,
  FullscreenControl,
  GeolocateControl,
  MapRef,
  Source,
  Layer
} from "react-map-gl/mapbox"
import mapboxgl from "mapbox-gl"
import "mapbox-gl/dist/mapbox-gl.css"
import { motion, AnimatePresence } from "framer-motion"
import { Destination } from "@/generated/prisma"
import { MapPin } from "lucide-react"
import Supercluster from "supercluster"

interface DestinationWithCount extends Destination {
  _count?: {
    properties: number
  }
}

interface DestinationsMapProps {
  destinations: DestinationWithCount[]
  onDestinationSelect: (destination: DestinationWithCount) => void
  selectedDestination: DestinationWithCount | null
  onMapRef?: (map: MapRef | null) => void
  mapStyle: string
  onStyleChange: (style: string) => void
}

// Mapbox styles
const MAP_STYLES = {
  dark: "mapbox://styles/mapbox/dark-v11",
  satellite: "mapbox://styles/mapbox/satellite-streets-v12",
  light: "mapbox://styles/mapbox/light-v11",
  streets: "mapbox://styles/mapbox/streets-v12"
}

// Workaround for Mapbox GL JS in Next.js
if (typeof window !== "undefined" && !mapboxgl.workerUrl) {
  mapboxgl.workerUrl = "https://api.mapbox.com/mapbox-gl-js/v3.14.0/mapbox-gl-csp-worker.js"
}

// Types for clustering
interface ClusterProperties {
  cluster: boolean
  cluster_id: number
  point_count: number
  point_count_abbreviated: string
}

interface PointProperties {
  cluster: boolean
  destination: DestinationWithCount
}

type ClusterFeature = GeoJSON.Feature<GeoJSON.Point, ClusterProperties>
type PointFeature = GeoJSON.Feature<GeoJSON.Point, PointProperties>

export function DestinationsMap({
  destinations,
  onDestinationSelect,
  selectedDestination,
  onMapRef,
  mapStyle,
  onStyleChange
}: DestinationsMapProps) {
  const mapRef = useRef<MapRef>(null)
  const [popupInfo, setPopupInfo] = useState<DestinationWithCount | null>(null)
  const [viewState, setViewState] = useState({
    longitude: 2.3522,
    latitude: 48.8566,
    zoom: 5,
    pitch: 45, // Always 3D
    bearing: 0
  })
  const [isMobile, setIsMobile] = useState(false)

  // Handle responsive behavior
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Create clusters using Supercluster
  const { clusters, supercluster } = useMemo(() => {
    const cluster = new Supercluster<PointProperties>({
      radius: 75,
      maxZoom: 16,
      map: (props) => ({ point_count: props.destination._count?.properties || 0 }),
      reduce: (accumulated, props) => {
        accumulated.point_count += props.point_count
      }
    })

    const points: PointFeature[] = destinations
      .filter(dest => dest.latitude && dest.longitude)
      .map(destination => ({
        type: "Feature" as const,
        properties: {
          cluster: false,
          destination
        },
        geometry: {
          type: "Point" as const,
          coordinates: [destination.longitude!, destination.latitude!]
        }
      }))

    cluster.load(points)

    const bounds = mapRef.current?.getBounds()
    const zoom = mapRef.current?.getZoom()

    if (!bounds || zoom === undefined) {
      return { clusters: points, supercluster: cluster }
    }

    const clusters = cluster.getClusters(
      [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()],
      Math.floor(zoom)
    )

    return { clusters, supercluster: cluster }
  }, [destinations, viewState.zoom, viewState.longitude, viewState.latitude])

  useEffect(() => {
    if (selectedDestination && selectedDestination.longitude && selectedDestination.latitude) {
      mapRef.current?.flyTo({
        center: [selectedDestination.longitude, selectedDestination.latitude],
        zoom: 12,
        pitch: 60,
        bearing: -20,
        duration: 2000
      })
    }
  }, [selectedDestination])

  // Re-apply 3D features when map style changes
  useEffect(() => {
    const map = mapRef.current?.getMap()
    if (map && map.isStyleLoaded()) {
      // Wait a bit for the new style to fully load
      setTimeout(() => {
        add3DFeatures(map)
      }, 100)
    }
  }, [mapStyle])

  const handleMarkerClick = (destination: DestinationWithCount) => {
    setPopupInfo(destination)
  }

  const handleClusterClick = (cluster: ClusterFeature) => {
    const clusterId = cluster.properties.cluster_id
    const zoom = supercluster.getClusterExpansionZoom(clusterId)
    const [longitude, latitude] = cluster.geometry.coordinates
    
    mapRef.current?.flyTo({
      center: [longitude, latitude],
      zoom,
      duration: 1000
    })
  }

  const onMapLoad = () => {
    const map = mapRef.current?.getMap()
    if (!map) return
    
    // Expose map reference to parent
    if (onMapRef) {
      onMapRef(mapRef.current)
    }

    // Wait for style to load before adding 3D features
    if (map.isStyleLoaded()) {
      add3DFeatures(map)
    } else {
      map.once('style.load', () => {
        add3DFeatures(map)
      })
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
      console.error('Error adding 3D features:', error)
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
          pitch: 45,
          bearing: 0
        }}
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        mapStyle={mapStyle}
        style={{ width: "100%", height: "100%" }}
        maxZoom={18}
        minZoom={2}
        onLoad={onMapLoad}
      >
        {/* Navigation controls - mobile optimized */}
        <NavigationControl 
          position="bottom-right" 
          style={{ 
            marginBottom: isMobile ? 80 : 100, 
            marginRight: isMobile ? 8 : 16 
          }} 
        />
        <ScaleControl 
          position="bottom-left" 
          style={{ 
            marginBottom: 30, 
            marginLeft: isMobile ? 8 : 16 
          }} 
        />
        <FullscreenControl 
          position="bottom-right" 
          style={{ 
            marginBottom: isMobile ? 140 : 160, 
            marginRight: isMobile ? 8 : 16 
          }} 
        />
        <GeolocateControl 
          position="bottom-right" 
          style={{ 
            marginBottom: isMobile ? 200 : 220, 
            marginRight: isMobile ? 8 : 16 
          }} 
        />

        {clusters.map((cluster) => {
          const [longitude, latitude] = cluster.geometry.coordinates
          const { cluster: isCluster } = cluster.properties
          
          if (isCluster) {
            const { point_count } = cluster.properties as ClusterProperties
            const size = 40 + (point_count / destinations.length) * 40
            
            return (
              <Marker
                key={`cluster-${(cluster.properties as ClusterProperties).cluster_id}`}
                longitude={longitude}
                latitude={latitude}
                anchor="center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  whileHover={{ scale: 1.1 }}
                  onClick={() => handleClusterClick(cluster as ClusterFeature)}
                  className="relative cursor-pointer"
                  style={{ width: size, height: size }}
                >
                  {/* Cluster marker */}
                  <div className="absolute inset-0 bg-[#B5985A]/30 rounded-full animate-pulse" />
                  <div className="relative w-full h-full bg-gradient-to-br from-[#B5985A] to-[#d4af37] rounded-full flex items-center justify-center shadow-2xl border-2 border-white/40">
                    <span className="text-white font-bold text-lg">{point_count}</span>
                  </div>
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded-full whitespace-nowrap">
                    {point_count} destinations
                  </div>
                </motion.div>
              </Marker>
            )
          }

          const destination = (cluster.properties as PointProperties).destination
          
          return (
            <Marker
              key={destination.id}
              longitude={longitude}
              latitude={latitude}
              anchor="bottom"
              onClick={() => handleMarkerClick(destination)}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="relative cursor-pointer"
              >
                {/* Custom marker */}
                <div className="relative">
                  <div className="absolute inset-0 bg-[#B5985A] rounded-full blur-md opacity-50 animate-pulse" />
                  <div className="relative bg-gradient-to-br from-[#B5985A] to-[#d4af37] rounded-full p-3 shadow-2xl border border-white/20">
                    <MapPin className="w-5 h-5 text-white" />
                  </div>
                  {/* Property count badge */}
                  <div className="absolute -top-2 -right-2 bg-white text-black text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-lg">
                    {destination._count?.properties || 0}
                  </div>
                </div>
              </motion.div>
            </Marker>
          )
        })}

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
              {/* Header with image placeholder */}
              <div className="relative h-32 bg-gradient-to-br from-[#B5985A]/20 to-[#d4af37]/20">
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                <div className="absolute bottom-3 left-4 right-4">
                  <h3 className="text-white font-bold text-xl">{popupInfo.name}</h3>
                  <p className="text-gray-300 text-sm">
                    {popupInfo.region ? `${popupInfo.region}, ` : ''}{popupInfo.country}
                  </p>
                </div>
              </div>
              
              {/* Content */}
              <div className="p-4 space-y-4">
                {/* Stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/5 rounded-lg p-3">
                    <p className="text-gray-400 text-xs">Properties</p>
                    <p className="text-white text-lg font-bold">{popupInfo._count?.properties || 0}</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-3">
                    <p className="text-gray-400 text-xs">Avg. Price</p>
                    <p className="text-white text-lg font-bold">€850</p>
                  </div>
                </div>
                
                
                {/* Action buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      onDestinationSelect(popupInfo)
                      setPopupInfo(null)
                    }}
                    className="flex-1 bg-[#B5985A] hover:bg-[#d4af37] text-black font-medium py-2 px-4 rounded-lg transition-colors"
                  >
                    View Properties
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

      {/* Map overlay gradient for luxury effect */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-transparent" />
      </div>
    </div>
  )
}