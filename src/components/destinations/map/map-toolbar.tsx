"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { motion, useMotionValue, AnimatePresence } from "framer-motion"
import {
  Search,
  Filter,
  Box,
  SquareStack,
  ZoomIn,
  ZoomOut,
  Maximize,
  Navigation,
  X,
  ChevronDown,
  Loader2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { useDebounce } from "@/hooks/use-debounce"
import { toast } from "sonner"
import type { ViewMode } from "./map-controls"

interface MapToolbarProps {
  onLocationSearch?: (coords: { longitude: number; latitude: number; name: string }) => void
  mapStyle: string
  onStyleChange: (style: string) => void
  viewMode?: ViewMode
  onViewModeChange?: (mode: ViewMode) => void
  onZoomIn?: () => void
  onZoomOut?: () => void
  onResetView?: () => void
  onFullscreen?: () => void
}

const MAP_STYLES = {
  light: { id: "mapbox://styles/mapbox/light-v11", name: "Light", icon: "☀️" },
  streets: { id: "mapbox://styles/mapbox/streets-v12", name: "Streets", icon: "🗺️" },
}

export function MapToolbar({
  onLocationSearch,
  mapStyle,
  onStyleChange,
  viewMode = "3D",
  onViewModeChange,
  onZoomIn,
  onZoomOut,
  onResetView,
  onFullscreen
}: MapToolbarProps) {
  const [searchExpanded, setSearchExpanded] = useState(false)
  const [searchValue, setSearchValue] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [autoHide, setAutoHide] = useState(false)
  const [isInteracting, setIsInteracting] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const debouncedSearch = useDebounce(searchValue, 500)
  const constraintsRef = useRef(null)

  // Motion values for smooth dragging
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  // Load saved position from localStorage
  useEffect(() => {
    const savedPosition = localStorage.getItem('map-toolbar-position')
    if (savedPosition) {
      try {
        const parsed = JSON.parse(savedPosition)
        x.set(parsed.x)
        y.set(parsed.y)
      } catch {
        
      }
    }
  }, [x, y])

  // Auto-hide toolbar after 3 seconds of inactivity
  useEffect(() => {
    let timeout: NodeJS.Timeout
    
    const handleActivity = () => {
      setIsInteracting(true)
      clearTimeout(timeout)
      timeout = setTimeout(() => {
        setIsInteracting(false)
      }, 3000)
    }

    if (autoHide) {
      window.addEventListener("mousemove", handleActivity)
      window.addEventListener("touchstart", handleActivity)
      handleActivity() // Start the timer
    }

    return () => {
      clearTimeout(timeout)
      window.removeEventListener("mousemove", handleActivity)
      window.removeEventListener("touchstart", handleActivity)
    }
  }, [autoHide])

  const searchLocation = useCallback(async (query: string) => {
    if (!query || query.length < 3) return
    if (!process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN) {
      toast.error("Mapbox token not configured")
      return
    }

    setIsSearching(true)
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}&types=place,locality,neighborhood&limit=5`
      )
      
      if (!response.ok) throw new Error("Search failed")
      
      const data = await response.json()
      
      if (data.features && data.features.length > 0) {
        const [longitude, latitude] = data.features[0].center
        const name = data.features[0].place_name
        
        if (onLocationSearch) {
          onLocationSearch({ longitude, latitude, name })
        }
        setSearchExpanded(false)
        setSearchValue("")
      } else {
        toast.info("No locations found")
      }
    } catch {
      toast.error("Failed to search location")
    } finally {
      setIsSearching(false)
    }
  }, [onLocationSearch])

  // Search on debounced value change
  useEffect(() => {
    if (debouncedSearch) {
      searchLocation(debouncedSearch)
    }
  }, [debouncedSearch, searchLocation])

  // Save position when drag ends
  const handleDragEnd = () => {
    const position = { x: x.get(), y: y.get() }
    localStorage.setItem('map-toolbar-position', JSON.stringify(position))
    setIsDragging(false)
  }

  // Handle double click to reset position
  const handleDoubleClick = () => {
    x.set(0)
    y.set(0)
    localStorage.setItem('map-toolbar-position', JSON.stringify({ x: 0, y: 0 }))
  }

  return (
    <TooltipProvider>
      <div 
        ref={constraintsRef}
        className="fixed inset-0 pointer-events-none"
        style={{ margin: '20px' }}
      />
      
      <motion.div
        drag
        dragConstraints={constraintsRef}
        dragElastic={0}
        dragMomentum={false}
        style={{ x, y }}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={handleDragEnd}
        onDoubleClick={handleDoubleClick}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ 
          opacity: autoHide && !isInteracting && !isDragging ? 0.3 : 1,
          scale: autoHide && !isInteracting && !isDragging ? 0.95 : 1
        }}
        whileHover={{ 
          opacity: 1,
          scale: 1 
        }}
        whileDrag={{ 
          scale: 1.05,
          opacity: 0.9,
          cursor: "grabbing"
        }}
        transition={{
          opacity: { duration: 0.2 },
          scale: { duration: 0.2 }
        }}
        className={cn(
          "fixed top-10 left-1/2 -translate-x-1/2",
          "flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl",
          "bg-black/80 backdrop-blur-xl border border-white/10",
          "shadow-2xl",
          "max-w-[95vw] overflow-x-auto scrollbar-hide",
          "cursor-grab active:cursor-grabbing",
          "select-none",
          "group",
          "z-50",
          "pointer-events-auto"
        )}
      >
        <motion.div 
          className={cn(
            "absolute -top-3 left-1/2 -translate-x-1/2",
            "flex gap-1 transition-opacity",
            "opacity-0 group-hover:opacity-100",
            isDragging && "opacity-100"
          )}
          animate={{ opacity: isDragging ? 1 : 0 }}
        >
          <div className="w-1 h-1 bg-white/40 rounded-full" />
          <div className="w-1 h-1 bg-white/40 rounded-full" />
          <div className="w-1 h-1 bg-white/40 rounded-full" />
        </motion.div>

        <AnimatePresence mode="wait">
          {searchExpanded ? (
            <motion.div
              key="search-expanded"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: "240px", opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-2"
            >
            <div className="relative flex-1">
              <input
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    searchLocation(searchValue)
                  }
                  if (e.key === 'Escape') {
                    setSearchExpanded(false)
                    setSearchValue("")
                  }
                }}
                placeholder="Search location..."
                autoFocus
                className={cn(
                  "w-full h-8 px-3 text-sm rounded-md",
                  "bg-white/10 border border-white/10",
                  "text-white placeholder:text-gray-400",
                  "focus:outline-none focus:border-[#B5985A]/50",
                  "transition-all"
                )}
              />
              {isSearching && (
                <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-[#B5985A] animate-spin" />
              )}
            </div>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-gray-400 hover:text-white"
              onClick={() => {
                setSearchExpanded(false)
                setSearchValue("")
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </motion.div>
          ) : (
            <Tooltip key="search-button">
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className={cn(
                    "h-8 w-8 shrink-0",
                    "text-gray-400 hover:text-white hover:bg-white/10"
                  )}
                  onClick={() => setSearchExpanded(true)}
                >
                  <Search className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Search location</TooltipContent>
            </Tooltip>
          )}
        </AnimatePresence>

        <div className="w-px h-6 bg-white/10" />

        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className={cn(
                    "h-8 w-8 shrink-0",
                    "text-gray-400 hover:text-white hover:bg-white/10"
                  )}
                >
                  <Filter className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent>Filters</TooltipContent>
          </Tooltip>
          <DropdownMenuContent
            align="start"
            className={cn(
              "w-56",
              "bg-black/90 backdrop-blur-md",
              "border-white/10",
              "text-white"
            )}
          >
            <DropdownMenuLabel className="text-[#B5985A]">Filter Destinations</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-white/10" />
            <DropdownMenuItem className="focus:bg-white/10">
              <span className="flex items-center justify-between w-full">
                Country
                <ChevronDown className="h-3 w-3 opacity-50" />
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem className="focus:bg-white/10">
              <span className="flex items-center justify-between w-full">
                Properties
                <ChevronDown className="h-3 w-3 opacity-50" />
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem className="focus:bg-white/10">
              <span className="flex items-center justify-between w-full">
                Availability
                <ChevronDown className="h-3 w-3 opacity-50" />
              </span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="w-px h-6 bg-white/10" />

        <div className="flex items-center bg-white/5 rounded-md p-0.5">
          {Object.entries(MAP_STYLES).map(([key, style]) => (
            <Tooltip key={key}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onStyleChange(style.id)}
                  className={cn(
                    "px-2 py-1 text-xs rounded transition-all",
                    mapStyle === style.id 
                      ? "bg-[#B5985A] text-white" 
                      : "text-gray-400 hover:text-white hover:bg-white/10"
                  )}
                >
                  <span>{style.icon}</span>
                </button>
              </TooltipTrigger>
              <TooltipContent>{style.name} Map</TooltipContent>
            </Tooltip>
          ))}
        </div>

        {onViewModeChange && (
          <>
            <div className="w-px h-6 bg-white/10" />
            <div className="flex items-center bg-white/5 rounded-md p-0.5">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => onViewModeChange("2D")}
                    className={cn(
                      "px-2 py-1.5 rounded transition-all",
                      viewMode === "2D" 
                        ? "bg-[#B5985A] text-white" 
                        : "text-gray-400 hover:text-white hover:bg-white/10"
                    )}
                  >
                    <SquareStack className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>2D View</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => onViewModeChange("3D")}
                    className={cn(
                      "px-2 py-1.5 rounded transition-all",
                      viewMode === "3D" 
                        ? "bg-[#B5985A] text-white" 
                        : "text-gray-400 hover:text-white hover:bg-white/10"
                    )}
                  >
                    <Box className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>3D View</TooltipContent>
              </Tooltip>
            </div>
          </>
        )}

        <div className="w-px h-6 bg-white/10" />

        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className={cn(
                  "h-8 w-8 shrink-0",
                  "text-gray-400 hover:text-white hover:bg-white/10"
                )}
                onClick={onZoomIn}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Zoom In</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className={cn(
                  "h-8 w-8 shrink-0",
                  "text-gray-400 hover:text-white hover:bg-white/10"
                )}
                onClick={onZoomOut}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Zoom Out</TooltipContent>
          </Tooltip>
        </div>

        <div className="w-px h-6 bg-white/10" />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              className={cn(
                "h-8 w-8 shrink-0",
                "text-gray-400 hover:text-white hover:bg-white/10"
              )}
              onClick={onResetView}
            >
              <Navigation className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Reset View</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              className={cn(
                "h-8 w-8 shrink-0",
                "text-gray-400 hover:text-white hover:bg-white/10"
              )}
              onClick={onFullscreen}
            >
              <Maximize className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Fullscreen</TooltipContent>
        </Tooltip>

        <div className="ml-2 w-px h-6 bg-white/10" />
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => setAutoHide(!autoHide)}
              className={cn(
                "text-xs px-2 py-1 rounded transition-all",
                autoHide 
                  ? "text-[#B5985A]" 
                  : "text-gray-400 hover:text-white"
              )}
            >
              Auto-hide
            </button>
          </TooltipTrigger>
          <TooltipContent>
            {autoHide ? "Auto-hide enabled" : "Enable auto-hide"}
          </TooltipContent>
        </Tooltip>
      </motion.div>
    </TooltipProvider>
  )
}