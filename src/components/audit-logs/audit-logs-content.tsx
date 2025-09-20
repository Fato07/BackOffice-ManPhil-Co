"use client"

import { useState, useMemo } from "react"
import { AuditLogTable } from "@/components/audit-logs/audit-log-table"
import { AuditLogFiltersComponent } from "@/components/audit-logs/audit-log-filters"
import { useAuditLogs, AuditLogFilters } from "@/hooks/use-audit-logs"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search, FilterX } from "lucide-react"
import { useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { useDebounce } from "@/hooks/use-debounce"

export function AuditLogsContent() {
  const searchParams = useSearchParams()
  
  // Parse initial filters from URL
  const initialFilters: AuditLogFilters = {
    entityType: searchParams.get("entityType") || undefined,
    entityId: searchParams.get("entityId") || undefined,
    action: searchParams.get("action") || undefined,
    userId: searchParams.get("userId") || undefined,
  }
  
  const [filters, setFilters] = useState<AuditLogFilters>(initialFilters)
  const [page, setPage] = useState(1)
  const [searchInput, setSearchInput] = useState("")
  
  // Debounce search
  const debouncedSearch = useDebounce(searchInput, 300)
  
  // Update filters when search changes
  useMemo(() => {
    setFilters(prev => ({ ...prev, search: debouncedSearch || undefined }))
  }, [debouncedSearch])
  
  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0
    if (filters.search) count++
    if (filters.entityType) count++
    if (filters.entityId) count++
    if (filters.action) count++
    if (filters.userId) count++
    if (filters.startDate) count++
    if (filters.endDate) count++
    return count
  }, [filters])
  
  const { data, isLoading } = useAuditLogs(filters, page)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h1 className="text-xl font-bold tracking-tight">
            Audit Trail
          </h1>
          <p className="text-muted-foreground mt-1">
            View all changes and activities across your properties
          </p>
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
              placeholder="Search audit logs..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9"
            />
          </div>
          <AuditLogFiltersComponent
            filters={filters}
            onFiltersChange={setFilters}
          />
          {activeFilterCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setFilters({})
                setSearchInput("")
              }}
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
        <div className="flex items-center gap-2">
          <p className="text-sm text-muted-foreground">
            {data?.total || 0} activities found
          </p>
          {activeFilterCount > 0 && (
            <Badge variant="secondary">
              {activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''} active
            </Badge>
          )}
        </div>

        <AuditLogTable
          logs={data?.data || []}
          isLoading={isLoading}
          page={page}
          totalPages={data?.totalPages || 1}
          onPageChange={setPage}
        />
      </motion.div>
    </div>
  )
}