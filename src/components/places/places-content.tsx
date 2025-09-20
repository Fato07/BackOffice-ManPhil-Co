"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { DataTableCompact } from "@/components/data-table/data-table-compact"
import { columns } from "@/components/places/columns"
import { CreateProviderDialog } from "@/components/places/create-provider-dialog"
import { ProviderFilters as ProviderFiltersComponent } from "@/components/places/provider-filters"
import { ExportDialog } from "@/components/places/export-dialog"
import { ImportDialog } from "@/components/places/import-dialog"
import { useActivityProviders } from "@/hooks/use-activity-providers"
import { ActivityProviderFilters, ActivityProviderListItem } from "@/types/activity-provider"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, FilterX, Download, Upload } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { useDebounce } from "@/hooks/use-debounce"
import { motion } from "framer-motion"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  useQueryStates, 
  parseAsArrayOf, 
  parseAsString, 
  parseAsInteger, 
  parseAsBoolean,
  parseAsStringEnum 
} from 'nuqs'

// Define parsers for nuqs
const sortByParser = parseAsStringEnum<'name' | 'category' | 'createdAt' | 'updatedAt'>(['name', 'category', 'createdAt', 'updatedAt']).withDefault('name')
const sortOrderParser = parseAsStringEnum<'asc' | 'desc'>(['asc', 'desc']).withDefault('asc')

export function PlacesContent() {
  const router = useRouter()
  
  // Use nuqs for URL state management
  const [urlState, setUrlState] = useQueryStates(
    {
      // Search and filters
      search: parseAsString.withDefault(''),
      category: parseAsString,
      tags: parseAsArrayOf(parseAsString),
      hasWebsite: parseAsBoolean,
      hasPhone: parseAsBoolean,
      hasEmail: parseAsBoolean,
      propertyId: parseAsString,
      
      // Sorting
      sortBy: sortByParser,
      sortOrder: sortOrderParser,
      
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
  const [selectedProviderIds, setSelectedProviderIds] = useState<string[]>([])

  // Debounce search value
  const debouncedSearch = useDebounce(searchInput, 300)
  
  // Update URL when debounced search changes
  useMemo(() => {
    if (debouncedSearch !== urlState.search) {
      setUrlState({ search: debouncedSearch || null, page: 1 })
    }
  }, [debouncedSearch, urlState.search, setUrlState])

  // Convert URL state to ActivityProviderFilters format
  const filters: ActivityProviderFilters = useMemo(() => {
    const result: ActivityProviderFilters = {
      search: urlState.search,
      sortBy: urlState.sortBy,
      sortOrder: urlState.sortOrder,
    }
    
    // Add defined filters
    if (urlState.category) result.category = urlState.category
    if (urlState.tags?.length) result.tags = urlState.tags
    if (urlState.hasWebsite !== null) result.hasWebsite = urlState.hasWebsite
    if (urlState.hasPhone !== null) result.hasPhone = urlState.hasPhone
    if (urlState.hasEmail !== null) result.hasEmail = urlState.hasEmail
    if (urlState.propertyId) result.propertyId = urlState.propertyId
    
    return result
  }, [urlState])

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0
    
    if (filters.search) count++
    if (filters.category) count++
    if (filters.tags?.length) count += filters.tags.length
    if (filters.hasWebsite !== undefined) count++
    if (filters.hasPhone !== undefined) count++
    if (filters.hasEmail !== undefined) count++
    if (filters.propertyId) count++
    
    return count
  }, [filters])
  
  // Fetch activity providers with filters
  const { data: providers, isLoading } = useActivityProviders(
    filters,
    urlState.page,
    10
  )

  // Handle filter changes
  const handleFiltersChange = (newFilters: ActivityProviderFilters) => {
    setIsFilterLoading(true)
    
    // Convert ActivityProviderFilters to URL state
    const updates: any = {
      search: newFilters.search || null,
      category: newFilters.category || null,
      tags: newFilters.tags?.length ? newFilters.tags : null,
      hasWebsite: newFilters.hasWebsite ?? null,
      hasPhone: newFilters.hasPhone ?? null,
      hasEmail: newFilters.hasEmail ?? null,
      propertyId: newFilters.propertyId || null,
      sortBy: newFilters.sortBy || 'name',
      sortOrder: newFilters.sortOrder || 'asc',
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
      category: null,
      tags: null,
      hasWebsite: null,
      hasPhone: null,
      hasEmail: null,
      propertyId: null,
      sortBy: 'name',
      sortOrder: 'asc',
      page: 1,
    })
  }

  const handlePageChange = (newPage: number) => {
    setUrlState({ page: newPage })
  }

  // Removed row click handler to prevent conflicts with inline editing
  // Users should use the edit button in the actions column instead

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <motion.h1 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-xl font-bold tracking-tight"
        >
          Places & Activities
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
                Export Providers
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowImportDialog(true)}>
                <Upload className="mr-2 h-4 w-4" />
                Import Providers
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <CreateProviderDialog />
        </motion.div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-4"
      >
        {/* Search bar and Filters */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search activity providers..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9"
            />
          </div>
          <ProviderFiltersComponent
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
        </div>
      </motion.div>

      {/* Results */}
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
            <div className="flex items-center gap-2">
              <p className="text-sm text-muted-foreground">
                {providers?.total || 0} activity providers found
              </p>
              {activeFilterCount > 0 && (
                <Badge variant="secondary">
                  {activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''} active
                </Badge>
              )}
            </div>
            
            <DataTableCompact
              columns={columns}
              data={providers?.data || []}
              totalCount={providers?.total || 0}
              pageSize={10}
              pageCount={providers?.totalPages || 0}
              page={urlState.page}
              onPageChange={handlePageChange}
              selectedRowIds={selectedProviderIds}
              onSelectedRowsChange={setSelectedProviderIds}
            />
          </>
        )}
      </motion.div>

      {/* Export Dialog */}
      <ExportDialog
        open={showExportDialog}
        onOpenChange={setShowExportDialog}
        selectedIds={selectedProviderIds}
        filters={filters}
      />

      {/* Import Dialog */}
      <ImportDialog
        open={showImportDialog}
        onOpenChange={setShowImportDialog}
      />
    </div>
  )
}