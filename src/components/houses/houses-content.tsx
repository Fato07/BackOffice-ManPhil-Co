"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { DataTable } from "@/components/data-table/data-table"
import { VirtualDataTable } from "@/components/ui/virtual-data-table"
import { columns } from "@/components/houses/columns"
import { CreateHouseDialog } from "@/components/houses/create-house-dialog"
import { PropertyFilters as PropertyFiltersComponent } from "@/components/houses/property-filters"
import { ExportDialog } from "@/components/houses/export-dialog"
import { ImportDialog } from "@/components/houses/import-dialog"
import { useProperties, useBulkDeleteProperties } from "@/hooks/use-properties"
import { PropertyFilters, PropertyListItem } from "@/types/property"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, FilterX, Download, Upload, LayoutGrid, List, Trash2 } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { useDebounce } from "@/hooks/use-debounce"
import { motion } from "framer-motion"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { PropertyGrid } from "./property-grid"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { 
  useQueryStates, 
  parseAsArrayOf, 
  parseAsString, 
  parseAsInteger, 
  parseAsBoolean,
  parseAsStringEnum 
} from 'nuqs'

// Define parsers for nuqs
const propertyStatusParser = parseAsStringEnum<'ALL' | 'PUBLISHED' | 'HIDDEN'>(['ALL', 'PUBLISHED', 'HIDDEN']).withDefault('ALL')

export function HousesContent() {
  const router = useRouter()
  
  // Use nuqs for URL state management
  const [urlState, setUrlState] = useQueryStates(
    {
      // Search and status
      search: parseAsString.withDefault(''),
      status: propertyStatusParser,
      
      // Destinations
      destinationId: parseAsString,
      destinationIds: parseAsArrayOf(parseAsString),
      
      // Property details
      propertyType: parseAsString,
      minRooms: parseAsInteger,
      maxRooms: parseAsInteger,
      minBathrooms: parseAsInteger,
      maxBathrooms: parseAsInteger,
      maxGuests: parseAsInteger,
      
      // Pricing
      minPrice: parseAsInteger,
      maxPrice: parseAsInteger,
      
      // Arrays
      amenities: parseAsArrayOf(parseAsString),
      services: parseAsArrayOf(parseAsString),
      accessibility: parseAsArrayOf(parseAsString),
      
      // Policies
      petsAllowed: parseAsBoolean,
      eventsAllowed: parseAsBoolean,
      smokingAllowed: parseAsBoolean,
      
      // Promoted
      showOnWebsite: parseAsBoolean,
      highlight: parseAsBoolean,
      
      // Pagination
      page: parseAsInteger.withDefault(1),
    },
    {
      history: 'push',
    }
  )
  
  // Local state for search input (before debouncing)
  const [searchInput, setSearchInput] = useState(urlState.search || '')
  const [isFilterLoading, setIsFilterLoading] = useState(false)
  const [showExportDialog, setShowExportDialog] = useState(false)
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [selectedPropertyIds, setSelectedPropertyIds] = useState<string[]>([])
  const [viewMode, setViewMode] = useState<"table" | "grid">("table")
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  
  // Bulk delete mutation
  const bulkDeleteMutation = useBulkDeleteProperties()

  // Debounce search value
  const debouncedSearch = useDebounce(searchInput, 300)
  
  // Update URL when debounced search changes
  useMemo(() => {
    if (debouncedSearch !== urlState.search) {
      setUrlState({ search: debouncedSearch || null, page: 1 })
    }
  }, [debouncedSearch, urlState.search, setUrlState])

  // Convert URL state to PropertyFilters format
  const filters: PropertyFilters = useMemo(() => {
    const result: PropertyFilters = {
      search: urlState.search,
      status: urlState.status,
    }
    
    // Add defined filters
    if (urlState.destinationId) result.destinationId = urlState.destinationId
    if (urlState.destinationIds?.length) result.destinationIds = urlState.destinationIds
    if (urlState.propertyType) result.propertyType = urlState.propertyType
    if (urlState.minRooms) result.minRooms = urlState.minRooms
    if (urlState.maxRooms) result.maxRooms = urlState.maxRooms
    if (urlState.minBathrooms) result.minBathrooms = urlState.minBathrooms
    if (urlState.maxBathrooms) result.maxBathrooms = urlState.maxBathrooms
    if (urlState.maxGuests) result.maxGuests = urlState.maxGuests
    if (urlState.minPrice) result.minPrice = urlState.minPrice
    if (urlState.maxPrice) result.maxPrice = urlState.maxPrice
    if (urlState.amenities?.length) result.amenities = urlState.amenities as any
    if (urlState.services?.length) result.services = urlState.services as any
    if (urlState.accessibility?.length) result.accessibility = urlState.accessibility as any
    
    // Policies
    if (urlState.petsAllowed !== null || urlState.eventsAllowed !== null || urlState.smokingAllowed !== null) {
      result.policies = {}
      if (urlState.petsAllowed !== null) result.policies.petsAllowed = urlState.petsAllowed
      if (urlState.eventsAllowed !== null) result.policies.eventsAllowed = urlState.eventsAllowed
      if (urlState.smokingAllowed !== null) result.policies.smokingAllowed = urlState.smokingAllowed
    }
    
    // Promoted
    if (urlState.showOnWebsite !== null || urlState.highlight !== null) {
      result.promoted = {}
      if (urlState.showOnWebsite !== null) result.promoted.showOnWebsite = urlState.showOnWebsite
      if (urlState.highlight !== null) result.promoted.highlight = urlState.highlight
    }
    
    return result
  }, [urlState])

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0
    
    if (filters.search) count++
    if (filters.status && filters.status !== 'ALL') count++
    if (filters.destinationId) count++
    if (filters.destinationIds?.length) count++
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
  
  // Fetch properties with filters
  const { data: properties, isLoading } = useProperties(
    filters,
    urlState.page,
    10
  )

  // Handle filter changes
  const handleFiltersChange = (newFilters: PropertyFilters) => {
    setIsFilterLoading(true)
    
    // Convert PropertyFilters to URL state
    const updates: any = {
      search: newFilters.search || null,
      status: newFilters.status || 'ALL',
      destinationId: newFilters.destinationId || null,
      destinationIds: newFilters.destinationIds?.length ? newFilters.destinationIds : null,
      propertyType: newFilters.propertyType || null,
      minRooms: newFilters.minRooms || null,
      maxRooms: newFilters.maxRooms || null,
      minBathrooms: newFilters.minBathrooms || null,
      maxBathrooms: newFilters.maxBathrooms || null,
      maxGuests: newFilters.maxGuests || null,
      minPrice: newFilters.minPrice || null,
      maxPrice: newFilters.maxPrice || null,
      amenities: newFilters.amenities?.length ? newFilters.amenities : null,
      services: newFilters.services?.length ? newFilters.services : null,
      accessibility: newFilters.accessibility?.length ? newFilters.accessibility : null,
      petsAllowed: newFilters.policies?.petsAllowed ?? null,
      eventsAllowed: newFilters.policies?.eventsAllowed ?? null,
      smokingAllowed: newFilters.policies?.smokingAllowed ?? null,
      showOnWebsite: newFilters.promoted?.showOnWebsite ?? null,
      highlight: newFilters.promoted?.highlight ?? null,
      page: 1, // Reset page when filters change
    }
    
    // Update search input if search changed
    if (newFilters.search !== searchInput) {
      setSearchInput(newFilters.search || '')
    }
    
    setUrlState(updates)
    
    // Visual feedback
    setTimeout(() => setIsFilterLoading(false), 300)
  }

  const clearAllFilters = () => {
    setSearchInput('')
    setUrlState({
      search: null,
      status: 'ALL',
      destinationId: null,
      destinationIds: null,
      propertyType: null,
      minRooms: null,
      maxRooms: null,
      minBathrooms: null,
      maxBathrooms: null,
      maxGuests: null,
      minPrice: null,
      maxPrice: null,
      amenities: null,
      services: null,
      accessibility: null,
      petsAllowed: null,
      eventsAllowed: null,
      smokingAllowed: null,
      showOnWebsite: null,
      highlight: null,
      page: 1,
    })
  }

  const handlePageChange = (newPage: number) => {
    setUrlState({ page: newPage })
  }

  const handleRowClick = (property: PropertyListItem) => {
    router.push(`/houses/${property.id}`)
  }
  
  const handleBulkDelete = async () => {
    bulkDeleteMutation.mutate(selectedPropertyIds, {
      onSuccess: () => {
        setShowDeleteDialog(false)
        setSelectedPropertyIds([])
      }
    })
  }
  
  // Get selected properties data for display in delete dialog
  const selectedProperties = useMemo(() => {
    if (!properties?.data || selectedPropertyIds.length === 0) return []
    return properties.data.filter(p => selectedPropertyIds.includes(p.id))
  }, [properties?.data, selectedPropertyIds])

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <motion.h1 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-xl font-bold tracking-tight"
        >
          Houses
        </motion.h1>
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2"
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                Actions
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setShowExportDialog(true)}>
                <Download className="mr-2 h-4 w-4" />
                Export Properties
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowImportDialog(true)}>
                <Upload className="mr-2 h-4 w-4" />
                Import Properties
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <CreateHouseDialog />
        </motion.div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-4"
      >
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search properties..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9"
            />
          </div>
          <PropertyFiltersComponent
            filters={filters}
            onFiltersChange={handleFiltersChange}
          />
          {activeFilterCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearAllFilters}
              className="gap-2"
            >
              <FilterX className="h-4 w-4" />
              Clear all ({activeFilterCount})
            </Button>
          )}
          <ToggleGroup type="single" value={viewMode} onValueChange={(value) => value && setViewMode(value as "table" | "grid")}>
            <ToggleGroupItem value="table" aria-label="Table view">
              <List className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="grid" aria-label="Grid view">
              <LayoutGrid className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-4"
      >
        {isLoading || isFilterLoading ? (
          <>
            <Skeleton className="h-4 w-24" />
            <div className="rounded-md border">
              <div className="p-4 space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-12 w-12" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-[250px]" />
                      <Skeleton className="h-4 w-[200px]" />
                    </div>
                    <Skeleton className="h-8 w-[100px]" />
                    <Skeleton className="h-8 w-8" />
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <p className="text-sm text-muted-foreground">
                  {properties?.total || 0} properties found
                </p>
                {activeFilterCount > 0 && (
                  <Badge variant="secondary">
                    {activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''} active
                  </Badge>
                )}
              </div>
              {selectedPropertyIds.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      Bulk Actions ({selectedPropertyIds.length})
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem 
                      onClick={() => setShowExportDialog(true)}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Export Selected
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => setShowDeleteDialog(true)}
                      className="text-red-600"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Selected
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
            
            {viewMode === "table" ? (
              // Use virtual scrolling for large datasets (>100 items)
              properties && properties.total > 100 ? (
                <VirtualDataTable
                  columns={columns}
                  data={properties.data || []}
                  height={600}
                  itemHeight={53}
                  searchable={false} // Search is handled by the parent component
                  onRowClick={handleRowClick}
                  className="border-0"
                />
              ) : (
                <DataTable
                  columns={columns}
                  data={properties?.data || []}
                  totalCount={properties?.total || 0}
                  pageSize={10}
                  pageCount={properties?.totalPages || 0}
                  page={urlState.page}
                  onPageChange={handlePageChange}
                  onRowClick={handleRowClick}
                  selectedRowIds={selectedPropertyIds}
                  onSelectedRowsChange={setSelectedPropertyIds}
                  enableAnimations={false} // Disable animations for better performance
                />
              )
            ) : (
              <PropertyGrid
                properties={properties?.data || []}
                isLoading={false}
                selectedPropertyIds={selectedPropertyIds}
                onSelectionChange={setSelectedPropertyIds}
              />
            )}
          </>
        )}
      </motion.div>

      <ExportDialog
        open={showExportDialog}
        onOpenChange={setShowExportDialog}
        selectedPropertyIds={selectedPropertyIds}
        totalProperties={properties?.total || 0}
      />

      <ImportDialog
        open={showImportDialog}
        onOpenChange={setShowImportDialog}
      />

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedPropertyIds.length} properties?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              This action cannot be undone. This will permanently delete the following properties and all associated data:
              <div className="mt-2 max-h-40 overflow-y-auto rounded border p-2">
                <ul className="space-y-1 text-sm">
                  {selectedProperties.slice(0, 5).map((property) => (
                    <li key={property.id} className="text-muted-foreground">
                      • {property.name}
                    </li>
                  ))}
                  {selectedProperties.length > 5 && (
                    <li className="text-muted-foreground font-medium">
                      ... and {selectedProperties.length - 5} more
                    </li>
                  )}
                </ul>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={bulkDeleteMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={bulkDeleteMutation.isPending}
            >
              {bulkDeleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}