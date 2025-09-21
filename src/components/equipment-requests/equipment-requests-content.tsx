"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { DataTable } from "@/components/data-table/data-table"
import { columns } from "@/components/equipment-requests/columns"
import { CreateEquipmentRequestDialog } from "@/components/equipment-requests/create-equipment-request-dialog"
import { ExportDialog } from "@/components/equipment-requests/export-dialog"
import { EquipmentRequestFiltersPanel } from "@/components/equipment-requests/equipment-request-filters"
import { useEquipmentRequests } from "@/hooks/use-equipment-requests"
import { EquipmentRequestFilters, EquipmentRequestListItem } from "@/types/equipment-request"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, FilterX, Download } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { useDebounce } from "@/hooks/use-debounce"
import { motion } from "framer-motion"
import {
  useQueryStates,
  parseAsString,
  parseAsInteger,
  parseAsStringEnum,
  parseAsIsoDateTime,
} from 'nuqs'
import { EquipmentRequestStatus, EquipmentRequestPriority } from "@/types/equipment-request"

// Define parsers for nuqs
const statusParser = parseAsStringEnum<EquipmentRequestStatus | 'ALL'>([
  'ALL',
  'PENDING',
  'APPROVED',
  'REJECTED',
  'ORDERED',
  'DELIVERED',
  'CANCELLED',
]).withDefault('ALL')

const priorityParser = parseAsStringEnum<EquipmentRequestPriority | 'ALL'>([
  'ALL',
  'LOW',
  'MEDIUM',
  'HIGH',
  'URGENT',
]).withDefault('ALL')

export function EquipmentRequestsContent() {
  const router = useRouter()

  // Use nuqs for URL state management
  const [urlState, setUrlState] = useQueryStates(
    {
      search: parseAsString.withDefault(''),
      status: statusParser,
      priority: priorityParser,
      propertyId: parseAsString,
      destinationId: parseAsString,
      dateFrom: parseAsIsoDateTime,
      dateTo: parseAsIsoDateTime,
      page: parseAsInteger.withDefault(1),
    },
    {
      history: 'push',
    }
  )

  // Local state for search input (before debouncing)
  const [searchInput, setSearchInput] = useState(urlState.search || '')
  const [isFilterLoading, setIsFilterLoading] = useState(false)
  const [selectedRequestIds, setSelectedRequestIds] = useState<string[]>([])
  const [exportDialogOpen, setExportDialogOpen] = useState(false)

  // Debounce search value
  const debouncedSearch = useDebounce(searchInput, 300)

  // Update URL when debounced search changes
  useMemo(() => {
    if (debouncedSearch !== urlState.search) {
      setUrlState({ search: debouncedSearch || null, page: 1 })
    }
  }, [debouncedSearch, urlState.search, setUrlState])

  // Convert URL state to EquipmentRequestFilters format
  const filters: EquipmentRequestFilters = useMemo(() => {
    const result: EquipmentRequestFilters = {
      search: urlState.search,
      status: urlState.status,
      priority: urlState.priority,
    }

    if (urlState.propertyId) result.propertyId = urlState.propertyId
    if (urlState.destinationId) result.destinationId = urlState.destinationId
    if (urlState.dateFrom) result.dateFrom = urlState.dateFrom
    if (urlState.dateTo) result.dateTo = urlState.dateTo

    return result
  }, [urlState])

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0

    if (filters.search) count++
    if (filters.status && filters.status !== 'ALL') count++
    if (filters.priority && filters.priority !== 'ALL') count++
    if (filters.propertyId) count++
    if (filters.destinationId) count++
    if (filters.dateFrom) count++
    if (filters.dateTo) count++

    return count
  }, [filters])

  // Fetch equipment requests with filters
  const { data: requests, isLoading } = useEquipmentRequests(
    filters,
    urlState.page,
    10
  )

  // Handle filter changes
  const handleFiltersChange = (newFilters: EquipmentRequestFilters) => {
    setIsFilterLoading(true)

    // Convert EquipmentRequestFilters to URL state
    const updates = {
      search: newFilters.search || null,
      status: newFilters.status || 'ALL' as const,
      priority: newFilters.priority || 'ALL' as const,
      propertyId: newFilters.propertyId || null,
      destinationId: newFilters.destinationId || null,
      dateFrom: newFilters.dateFrom || null,
      dateTo: newFilters.dateTo || null,
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
      priority: 'ALL',
      propertyId: null,
      destinationId: null,
      dateFrom: null,
      dateTo: null,
      page: 1,
    })
  }

  const handlePageChange = (newPage: number) => {
    setUrlState({ page: newPage })
  }

  const handleRowClick = (request: EquipmentRequestListItem) => {
    router.push(`/equipment-requests/${request.id}`)
  }

  const handleExport = () => {
    setExportDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <motion.h1
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-xl font-bold tracking-tight"
        >
          Requests
        </motion.h1>
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2"
        >
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={handleExport}
          >
            <Download className="h-3.5 w-3.5" />
            Export
          </Button>
          <CreateEquipmentRequestDialog />
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
              placeholder="Search requests..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9"
            />
          </div>
          <EquipmentRequestFiltersPanel
            filters={filters}
            onFiltersChange={handleFiltersChange}
          />
          {activeFilterCount > 0 && (
            <Button
              variant="outline"
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
                {requests?.total || 0} requests found
              </p>
              {activeFilterCount > 0 && (
                <Badge variant="secondary">
                  {activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''} active
                </Badge>
              )}
            </div>

            <DataTable
              columns={columns}
              data={requests?.data || []}
              totalCount={requests?.total || 0}
              pageSize={10}
              pageCount={requests?.totalPages || 0}
              page={urlState.page}
              onPageChange={handlePageChange}
              onRowClick={handleRowClick}
              selectedRowIds={selectedRequestIds}
              onSelectedRowsChange={setSelectedRequestIds}
            />
          </>
        )}
      </motion.div>

      {/* Export Dialog */}
      <ExportDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        selectedRequestIds={selectedRequestIds}
        totalRequests={requests?.total || 0}
        filteredCount={requests?.total}
      />
    </div>
  )
}