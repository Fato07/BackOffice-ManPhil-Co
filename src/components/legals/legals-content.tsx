"use client"

import { useState, useMemo } from "react"
import { DataTable } from "@/components/data-table/data-table"
import { columns } from "@/components/legals/columns"
import { CreateDocumentDialog } from "@/components/legals/create-document-dialog"
import { EditLegalDocumentDialog } from "@/components/legals/edit-legal-document-dialog"
import { LegalDocumentFilters } from "@/components/legals/legal-document-filters"
import { ExportDialog } from "@/components/legals/export-dialog"
import { ImportDialog } from "@/components/legals/import-dialog"
import { BulkOperationsDialog } from "@/components/legals/bulk-operations-dialog"
import { useLegalDocuments, useBulkDeleteLegalDocuments, useBulkDownloadLegalDocuments } from "@/hooks/use-legal-documents"
import { 
  LegalDocumentCategory, 
  LegalDocumentStatus,
  type LegalDocumentWithRelations 
} from "@/types/legal-document"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, FilterX, Download, Upload, Plus, Trash2 } from "lucide-react"
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
  parseAsStringEnum
} from 'nuqs'

// Import the enum values from Prisma
import { LegalDocumentCategory as PrismaLegalDocumentCategory, LegalDocumentStatus as PrismaLegalDocumentStatus } from '@/generated/prisma'

// Define parsers for nuqs
const categoryParser = parseAsStringEnum<LegalDocumentCategory | 'ALL'>([
  'ALL',
  ...Object.values(PrismaLegalDocumentCategory)
] as const).withDefault('ALL')

const statusParser = parseAsStringEnum<LegalDocumentStatus | 'ALL'>([
  'ALL',
  ...Object.values(PrismaLegalDocumentStatus)
] as const).withDefault('ALL')

export function LegalsContent() {
  // Use nuqs for URL state management
  const [urlState, setUrlState] = useQueryStates(
    {
      // Search and filters
      search: parseAsString.withDefault(''),
      category: categoryParser,
      status: statusParser,
      propertyId: parseAsString,
      expiringInDays: parseAsInteger,
      tags: parseAsArrayOf(parseAsString),
      
      // Pagination
      page: parseAsInteger.withDefault(1),
      pageSize: parseAsInteger.withDefault(20),
      sortBy: parseAsString.withDefault('createdAt'),
      sortOrder: parseAsStringEnum(['asc', 'desc']).withDefault('desc'),
    },
    {
      history: 'push',
    }
  )
  
  // Local state
  const [searchInput, setSearchInput] = useState(urlState.search || '')
  const [isFilterLoading, setIsFilterLoading] = useState(false)
  const [showExportDialog, setShowExportDialog] = useState(false)
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([])
  const [editingDocumentId, setEditingDocumentId] = useState<string | null>(null)
  const [showBulkDialog, setShowBulkDialog] = useState(false)
  const [bulkOperation, setBulkOperation] = useState<'download' | 'delete' | null>(null)

  // Debounce search value
  const debouncedSearch = useDebounce(searchInput, 300)
  
  // Update URL when debounced search changes
  useMemo(() => {
    if (debouncedSearch !== urlState.search) {
      setUrlState({ search: debouncedSearch || null, page: 1 })
    }
  }, [debouncedSearch])

  // Prepare filters for API call
  const filters = useMemo(() => ({
    search: urlState.search,
    category: urlState.category,
    status: urlState.status,
    propertyId: urlState.propertyId || undefined,
    expiringInDays: urlState.expiringInDays || undefined,
    tags: urlState.tags || undefined,
    page: urlState.page,
    pageSize: urlState.pageSize,
    sortBy: urlState.sortBy,
    sortOrder: urlState.sortOrder,
  }), [urlState])

  // Fetch documents
  const { data: result, isLoading, error } = useLegalDocuments(filters)
  
  // Bulk operations
  const bulkDeleteMutation = useBulkDeleteLegalDocuments()
  const bulkDownloadMutation = useBulkDownloadLegalDocuments()

  // Calculate active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0
    if (urlState.search) count++
    if (urlState.category && urlState.category !== 'ALL') count++
    if (urlState.status && urlState.status !== 'ALL') count++
    if (urlState.propertyId) count++
    if (urlState.expiringInDays) count++
    if (urlState.tags && urlState.tags.length > 0) count++
    return count
  }, [urlState])

  // Handle filter change
  const handleFilterChange = async (filters: Partial<typeof urlState>) => {
    setIsFilterLoading(true)
    await setUrlState({ ...filters, page: 1 })
    setIsFilterLoading(false)
  }

  // Clear all filters
  const clearFilters = async () => {
    setIsFilterLoading(true)
    setSearchInput('')
    await setUrlState({
      search: null,
      category: 'ALL',
      status: 'ALL',
      propertyId: null,
      expiringInDays: null,
      tags: null,
      page: 1,
    })
    setIsFilterLoading(false)
  }

  // Handle row click
  const handleRowClick = (document: LegalDocumentWithRelations) => {
    setEditingDocumentId(document.id)
  }

  // Handle page change
  const handlePageChange = (page: number) => {
    setUrlState({ page })
  }

  // Handle sort change
  const handleSortChange = (sortBy: string, sortOrder: 'asc' | 'desc') => {
    setUrlState({ sortBy, sortOrder })
  }

  // Bulk operation handlers
  const handleBulkDownload = () => {
    setBulkOperation('download')
    setShowBulkDialog(true)
  }

  const handleBulkDelete = () => {
    setBulkOperation('delete')
    setShowBulkDialog(true)
  }

  const handleBulkOperationConfirm = async (options?: { includeVersions?: boolean; format?: 'zip' | 'individual' }) => {
    if (!bulkOperation) return

    try {
      if (bulkOperation === 'download') {
        await bulkDownloadMutation.mutateAsync({
          documentIds: selectedDocumentIds,
          format: options?.format || 'zip',
          includeVersions: options?.includeVersions || false
        })
      } else if (bulkOperation === 'delete') {
        await bulkDeleteMutation.mutateAsync({
          documentIds: selectedDocumentIds
        })
        // Clear selection after successful delete
        setSelectedDocumentIds([])
      }
      
      setShowBulkDialog(false)
      setBulkOperation(null)
    } catch (error) {
      // Error is handled by the mutation hooks
      
    }
  }

  const documents = result?.data?.documents || []
  const totalCount = result?.data?.totalCount || 0
  const totalPages = Math.ceil(totalCount / urlState.pageSize)
  
  // Get selected documents for bulk operations
  const selectedDocuments = documents.filter(doc => selectedDocumentIds.includes(doc.id))

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <motion.h1 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-xl font-bold tracking-tight"
        >
          Legal Documents
        </motion.h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowImportDialog(true)}
          >
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowExportDialog(true)}
            disabled={totalCount === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button
            size="sm"
            onClick={() => setShowCreateDialog(true)}
            className="bg-[#B5985A] hover:bg-[#B5985A]/90 text-white hover:from-[#2a4a7f] hover:to-[#1c355e] transition-all duration-300 shadow-md hover:shadow-lg"
          >
            <Plus className="h-4 w-4 mr-2" />
            Upload Document
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search documents by name, description, or tags..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9"
            />
          </div>
          <LegalDocumentFilters
            filters={filters}
            onFilterChange={handleFilterChange}
            isLoading={isFilterLoading}
          />
          {activeFiltersCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="gap-2"
            >
              <FilterX className="h-4 w-4" />
              Clear filters
              <Badge variant="secondary" className="ml-1">
                {activeFiltersCount}
              </Badge>
            </Button>
          )}
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-4"
      >
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {isLoading ? (
              <Skeleton className="h-4 w-32" />
            ) : (
              <>
                Showing {documents.length} of {totalCount} documents
                {urlState.search && (
                  <span className="ml-1">
                    for &quot;{urlState.search}&quot;
                  </span>
                )}
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            {selectedDocumentIds.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    Bulk Actions ({selectedDocumentIds.length})
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem 
                    onClick={handleBulkDownload}
                    disabled={bulkDownloadMutation.isPending}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Selected
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={handleBulkDelete}
                    disabled={bulkDeleteMutation.isPending}
                    className="text-red-600 focus:text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Selected
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        <DataTable
          columns={columns}
          data={documents}
          onRowClick={handleRowClick}
          page={urlState.page}
          pageCount={totalPages}
          onPageChange={handlePageChange}
          selectedRowIds={selectedDocumentIds}
          onSelectedRowsChange={setSelectedDocumentIds}
        />
      </motion.div>

      <CreateDocumentDialog 
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />
      <ExportDialog
        open={showExportDialog}
        onOpenChange={setShowExportDialog}
        filters={filters}
      />
      <ImportDialog
        open={showImportDialog}
        onOpenChange={setShowImportDialog}
      />
      {editingDocumentId && (
        <EditLegalDocumentDialog
          documentId={editingDocumentId}
          open={!!editingDocumentId}
          onOpenChange={(open) => {
            if (!open) {
              setEditingDocumentId(null)
            }
          }}
        />
      )}
      
      {showBulkDialog && bulkOperation && (
        <BulkOperationsDialog
          open={showBulkDialog}
          onOpenChange={(open) => {
            setShowBulkDialog(open)
            if (!open) {
              setBulkOperation(null)
            }
          }}
          operation={bulkOperation}
          selectedDocuments={selectedDocuments}
          onConfirm={handleBulkOperationConfirm}
          isLoading={bulkDownloadMutation.isPending || bulkDeleteMutation.isPending}
        />
      )}
    </div>
  )
}