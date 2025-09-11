"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { DataTable } from "@/components/data-table/data-table"
import { columns } from "@/components/houses/columns"
import { CreateHouseDialog } from "@/components/houses/create-house-dialog"
import { PropertyFilters as PropertyFiltersComponent } from "@/components/houses/property-filters"
import { ExportDialog } from "@/components/houses/export-dialog"
import { ImportDialog } from "@/components/houses/import-dialog"
import { useProperties } from "@/hooks/use-properties"
import { PropertyFilters } from "@/types/property"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, FilterX, Download, Upload } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { useDebounce } from "@/hooks/use-debounce"
import { motion } from "framer-motion"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Helper function to parse URL params to filters
function parseFiltersFromParams(params: URLSearchParams): PropertyFilters {
  const filters: PropertyFilters = {}
  
  // Basic filters
  if (params.has('search')) filters.search = params.get('search')!
  if (params.has('status')) filters.status = params.get('status') as any
  if (params.has('destinationId')) filters.destinationId = params.get('destinationId')!
  if (params.has('propertyType')) filters.propertyType = params.get('propertyType')!
  
  // Numeric filters
  if (params.has('minRooms')) filters.minRooms = parseInt(params.get('minRooms')!)
  if (params.has('maxRooms')) filters.maxRooms = parseInt(params.get('maxRooms')!)
  if (params.has('minBathrooms')) filters.minBathrooms = parseInt(params.get('minBathrooms')!)
  if (params.has('maxBathrooms')) filters.maxBathrooms = parseInt(params.get('maxBathrooms')!)
  if (params.has('maxGuests')) filters.maxGuests = parseInt(params.get('maxGuests')!)
  if (params.has('minPrice')) filters.minPrice = parseInt(params.get('minPrice')!)
  if (params.has('maxPrice')) filters.maxPrice = parseInt(params.get('maxPrice')!)
  
  // Array filters
  if (params.has('amenities')) filters.amenities = params.get('amenities')!.split(',') as any
  if (params.has('services')) filters.services = params.get('services')!.split(',') as any
  if (params.has('accessibility')) filters.accessibility = params.get('accessibility')!.split(',') as any
  
  // Boolean filters
  if (params.has('petsAllowed')) {
    filters.policies = filters.policies || {}
    filters.policies.petsAllowed = params.get('petsAllowed') === 'true'
  }
  if (params.has('eventsAllowed')) {
    filters.policies = filters.policies || {}
    filters.policies.eventsAllowed = params.get('eventsAllowed') === 'true'
  }
  if (params.has('smokingAllowed')) {
    filters.policies = filters.policies || {}
    filters.policies.smokingAllowed = params.get('smokingAllowed') === 'true'
  }
  
  // Promotion flags
  if (params.has('showOnWebsite')) {
    filters.promoted = filters.promoted || {}
    filters.promoted.showOnWebsite = params.get('showOnWebsite') === 'true'
  }
  if (params.has('highlight')) {
    filters.promoted = filters.promoted || {}
    filters.promoted.highlight = params.get('highlight') === 'true'
  }
  
  return filters
}

// Helper function to convert filters to URL params
function filtersToParams(filters: PropertyFilters): Record<string, string> {
  const params: Record<string, string> = {}
  
  // Basic filters
  if (filters.search) params.search = filters.search
  if (filters.status && filters.status !== 'ALL') params.status = filters.status
  if (filters.destinationId) params.destinationId = filters.destinationId
  if (filters.propertyType) params.propertyType = filters.propertyType
  
  // Numeric filters
  if (filters.minRooms) params.minRooms = filters.minRooms.toString()
  if (filters.maxRooms) params.maxRooms = filters.maxRooms.toString()
  if (filters.minBathrooms) params.minBathrooms = filters.minBathrooms.toString()
  if (filters.maxBathrooms) params.maxBathrooms = filters.maxBathrooms.toString()
  if (filters.maxGuests) params.maxGuests = filters.maxGuests.toString()
  if (filters.minPrice) params.minPrice = filters.minPrice.toString()
  if (filters.maxPrice) params.maxPrice = filters.maxPrice.toString()
  
  // Array filters
  if (filters.amenities?.length) params.amenities = filters.amenities.join(',')
  if (filters.services?.length) params.services = filters.services.join(',')
  if (filters.accessibility?.length) params.accessibility = filters.accessibility.join(',')
  
  // Boolean filters
  if (filters.policies?.petsAllowed !== undefined) params.petsAllowed = filters.policies.petsAllowed.toString()
  if (filters.policies?.eventsAllowed !== undefined) params.eventsAllowed = filters.policies.eventsAllowed.toString()
  if (filters.policies?.smokingAllowed !== undefined) params.smokingAllowed = filters.policies.smokingAllowed.toString()
  
  // Promotion flags
  if (filters.promoted?.showOnWebsite !== undefined) params.showOnWebsite = filters.promoted.showOnWebsite.toString()
  if (filters.promoted?.highlight !== undefined) params.highlight = filters.promoted.highlight.toString()
  
  return params
}

const FILTER_STORAGE_KEY = 'property-filters-preferences'

export function HousesContent() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  
  // Initialize filters from URL or localStorage
  const [filters, setFilters] = useState<PropertyFilters>(() => {
    // First priority: URL params
    const urlFilters = parseFiltersFromParams(searchParams)
    if (Object.keys(urlFilters).length > 0) {
      return urlFilters
    }
    
    // Second priority: localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(FILTER_STORAGE_KEY)
      if (saved) {
        try {
          return JSON.parse(saved)
        } catch (e) {
          console.error('Failed to parse saved filters:', e)
        }
      }
    }
    
    // Default
    return {
      search: "",
      status: "ALL",
    }
  })
  
  const [search, setSearch] = useState(filters.search || "")
  const [page, setPage] = useState(() => {
    const pageParam = searchParams.get('page')
    return pageParam ? parseInt(pageParam) : 1
  })
  const [isFilterLoading, setIsFilterLoading] = useState(false)
  const [showExportDialog, setShowExportDialog] = useState(false)
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [selectedPropertyIds, setSelectedPropertyIds] = useState<string[]>([])

  // Debounce search value
  const debouncedSearch = useDebounce(search, 300)
  
  // Update filters when debounced search changes
  useEffect(() => {
    if (debouncedSearch !== filters.search) {
      setFilters(prev => ({ ...prev, search: debouncedSearch }))
      setPage(1)
    }
  }, [debouncedSearch])
  
  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0
    
    if (filters.search) count++
    if (filters.status && filters.status !== 'ALL') count++
    if (filters.destinationId) count++
    if (filters.propertyType) count++
    if (filters.minRooms || filters.maxRooms) count++
    if (filters.minBathrooms || filters.maxBathrooms) count++
    if (filters.maxGuests) count++
    if (filters.minPrice || filters.maxPrice) count++
    if (filters.amenities?.length) count += filters.amenities.length
    if (filters.services?.length) count += filters.services.length
    if (filters.accessibility?.length) count += filters.accessibility.length
    if (filters.policies?.petsAllowed !== undefined) count++
    if (filters.policies?.eventsAllowed !== undefined) count++
    if (filters.policies?.smokingAllowed !== undefined) count++
    if (filters.promoted?.showOnWebsite !== undefined) count++
    if (filters.promoted?.highlight !== undefined) count++
    
    return count
  }, [filters])
  
  // Update URL when filters or page change
  useEffect(() => {
    const params = new URLSearchParams()
    
    // Add filter params
    const filterParams = filtersToParams(filters)
    Object.entries(filterParams).forEach(([key, value]) => {
      params.set(key, value)
    })
    
    // Add page param if not 1
    if (page > 1) {
      params.set('page', page.toString())
    }
    
    // Update URL without triggering navigation
    const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname
    window.history.replaceState(null, '', newUrl)
  }, [filters, page, pathname])
  
  // Save filters to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Don't save default filters
      if (Object.keys(filters).length > 2 || filters.status !== 'ALL' || filters.search) {
        localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(filters))
      } else {
        localStorage.removeItem(FILTER_STORAGE_KEY)
      }
    }
  }, [filters])
  
  // Handle filter changes
  const handleFiltersChange = useCallback((newFilters: PropertyFilters) => {
    setIsFilterLoading(true)
    setFilters(newFilters)
    setPage(1)
    
    // Clear loading state after a short delay
    setTimeout(() => setIsFilterLoading(false), 100)
  }, [])
  
  // Clear all filters
  const clearAllFilters = useCallback(() => {
    const clearedFilters = {
      search: "",
      status: "ALL" as const,
    }
    setFilters(clearedFilters)
    setSearch("")
    setPage(1)
    localStorage.removeItem(FILTER_STORAGE_KEY)
  }, [])

  const { data, isLoading } = useProperties(filters, page)
  
  // Show loading overlay when filters change
  const showLoading = isLoading || isFilterLoading

  const handleRowClick = (property: any) => {
    router.push(`/houses/${property.id}`)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Houses</h1>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setShowExportDialog(true)}>
                Export Properties
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowImportDialog(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Import Properties
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <CreateHouseDialog />
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search houses by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {activeFilterCount > 0 && (
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="font-normal">
                {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''} active
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="h-8 text-xs"
              >
                <FilterX className="h-3 w-3 mr-1" />
                Clear all
              </Button>
            </div>
          )}
        </div>
        
        <PropertyFiltersComponent
          filters={filters}
          onFiltersChange={handleFiltersChange}
        />
      </div>

      {showLoading ? (
        <div className="space-y-4">
          <div className="text-sm text-gray-500">
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="border rounded-lg overflow-hidden">
            <div className="p-4 space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <motion.div 
                  key={i} 
                  className="flex items-center space-x-4"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                >
                  <Skeleton className="h-12 w-12 rounded-lg" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                  </div>
                  <Skeleton className="h-8 w-[100px]" />
                  <Skeleton className="h-8 w-8" />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>Results: {data?.total || 0}</span>
            {activeFilterCount > 0 && data?.total === 0 && (
              <Button
                variant="link"
                size="sm"
                onClick={clearAllFilters}
                className="text-xs"
              >
                Clear filters to see all properties
              </Button>
            )}
          </div>

          {data && data.data.length > 0 ? (
            <DataTable 
              columns={columns} 
              data={data.data}
              pageSize={20}
              onRowClick={handleRowClick}
            />
          ) : (
            <div className="border rounded-lg">
              <div className="p-8 text-center text-gray-500">
                {activeFilterCount > 0
                  ? "No houses found matching your filters. Try adjusting your search criteria." 
                  : "No houses found. Create your first house to get started."}
              </div>
            </div>
          )}
        </>
      )}

      <ExportDialog
        open={showExportDialog}
        onOpenChange={setShowExportDialog}
        selectedPropertyIds={selectedPropertyIds}
        totalProperties={data?.total || 0}
        filteredCount={data?.total}
      />

      <ImportDialog
        open={showImportDialog}
        onOpenChange={setShowImportDialog}
      />
    </div>
  )
}