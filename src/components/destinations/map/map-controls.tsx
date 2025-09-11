"use client"

import { useState, useCallback } from "react"
import { motion } from "framer-motion"
import { Search, Filter, SlidersHorizontal, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { useDebounce } from "@/hooks/use-debounce"
import { toast } from "sonner"

interface MapControlsProps {
  onLocationSearch?: (coords: { longitude: number; latitude: number; name: string }) => void
  mapStyle: string
  onStyleChange: (style: string) => void
}

const MAP_STYLES = {
  dark: "mapbox://styles/mapbox/dark-v11",
  satellite: "mapbox://styles/mapbox/satellite-streets-v12",
}

export function MapControls({ 
  onLocationSearch, 
  mapStyle, 
  onStyleChange
}: MapControlsProps) {
  const [searchValue, setSearchValue] = useState("")
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const debouncedSearch = useDebounce(searchValue, 500)

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
      } else {
        toast.info("No locations found")
      }
    } catch (error) {
      toast.error("Failed to search location")
    } finally {
      setIsSearching(false)
    }
  }, [onLocationSearch])

  return (
    <div className="space-y-3">
      {/* Search Bar */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        className="relative"
      >
        <div className="relative group">
          {isSearching ? (
            <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#B5985A] animate-spin" />
          ) : (
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-hover:text-[#B5985A] transition-colors" />
          )}
          <Input
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                searchLocation(searchValue)
              }
            }}
            placeholder="Search any location..."
            className={cn(
              "pl-10 pr-10 h-12 w-full sm:w-64",
              "bg-black/40 backdrop-blur-md",
              "border-white/10 hover:border-[#B5985A]/50",
              "focus:border-[#B5985A] focus:ring-[#B5985A]/20",
              "text-white placeholder:text-gray-400",
              "transition-all duration-300"
            )}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {searchValue && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={() => setSearchValue("")}
                className="text-gray-400 hover:text-white p-1"
              >
                ×
              </motion.button>
            )}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => searchLocation(searchValue)}
              className="text-gray-400 hover:text-[#B5985A] p-1"
            >
              <Search className="h-3 w-3" />
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="flex gap-2"
      >
        <Popover open={filtersOpen} onOpenChange={setFiltersOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "h-10 gap-2",
                "bg-black/40 backdrop-blur-md",
                "border-white/10 hover:border-[#B5985A]/50",
                "hover:bg-[#B5985A]/10",
                "text-white",
                filtersOpen && "border-[#B5985A] bg-[#B5985A]/10"
              )}
            >
              <Filter className="h-4 w-4" />
              Filters
            </Button>
          </PopoverTrigger>
          <PopoverContent
            align="start"
            className={cn(
              "w-80",
              "bg-black/90 backdrop-blur-md",
              "border-white/10",
              "text-white"
            )}
          >
            <div className="space-y-4">
              <h4 className="font-medium text-[#B5985A]">Filter Destinations</h4>
              
              {/* Filter options */}
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-gray-400">Country</label>
                  <select className="w-full mt-1 h-9 rounded-md bg-white/10 border border-white/10 px-3 text-sm">
                    <option>All Countries</option>
                    <option>France</option>
                    <option>Italy</option>
                    <option>Spain</option>
                  </select>
                </div>
                
                <div>
                  <label className="text-sm text-gray-400">Properties</label>
                  <select className="w-full mt-1 h-9 rounded-md bg-white/10 border border-white/10 px-3 text-sm">
                    <option>Any</option>
                    <option>1-10</option>
                    <option>11-50</option>
                    <option>50+</option>
                  </select>
                </div>
              </div>
              
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 border-white/10"
                  onClick={() => setFiltersOpen(false)}
                >
                  Clear
                </Button>
                <Button
                  size="sm"
                  className="flex-1 bg-[#B5985A] hover:bg-[#B5985A]/80"
                  onClick={() => setFiltersOpen(false)}
                >
                  Apply
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <Button
          variant="outline"
          size="icon"
          className={cn(
            "h-10 w-10",
            "bg-black/40 backdrop-blur-md",
            "border-white/10 hover:border-[#B5985A]/50",
            "hover:bg-[#B5985A]/10",
            "text-white"
          )}
        >
          <SlidersHorizontal className="h-4 w-4" />
        </Button>
      </motion.div>

      {/* Style Controls */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="flex gap-2"
      >
        <div className="flex items-center bg-black/40 backdrop-blur-md rounded-lg p-1 border border-white/10">
          <button
            onClick={() => onStyleChange(MAP_STYLES.dark)}
            className={cn(
              "px-3 py-1.5 text-xs rounded transition-all",
              mapStyle === MAP_STYLES.dark 
                ? "bg-[#B5985A] text-white" 
                : "text-gray-400 hover:text-white hover:bg-white/10"
            )}
          >
            Dark
          </button>
          <button
            onClick={() => onStyleChange(MAP_STYLES.satellite)}
            className={cn(
              "px-3 py-1.5 text-xs rounded transition-all",
              mapStyle === MAP_STYLES.satellite 
                ? "bg-[#B5985A] text-white" 
                : "text-gray-400 hover:text-white hover:bg-white/10"
            )}
          >
            Satellite
          </button>
        </div>
      </motion.div>
    </div>
  )
}