"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { DataTable } from "@/components/data-table/data-table"
import { createColumns } from "@/components/contacts/columns"
import { ContactFilters } from "@/components/contacts/contact-filters"
import { CreateContactDialog } from "@/components/contacts/create-contact-dialog"
import { EditContactDialog } from "@/components/contacts/edit-contact-dialog"
import { ContactDetailDialog } from "@/components/contacts/contact-detail-dialog"
import { LinkPropertyDialog } from "@/components/contacts/link-property-dialog"
import { ExportContactsDialog } from "@/components/contacts/export-contacts-dialog"
import { ImportContactsDialog } from "@/components/contacts/import-contacts-dialog"
import { useContacts, useBulkDeleteContacts } from "@/hooks/use-contacts"
import { ContactFilters as IContactFilters, ContactListItem } from "@/types/contact"
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { 
  useQueryStates, 
  parseAsArrayOf, 
  parseAsString, 
  parseAsInteger, 
  parseAsBoolean,
  parseAsStringEnum 
} from 'nuqs'

// Define parsers for nuqs
const contactCategoryParser = parseAsStringEnum<'ALL' | 'CLIENT' | 'OWNER' | 'PROVIDER' | 'ORGANIZATION' | 'OTHER'>(['ALL', 'CLIENT', 'OWNER', 'PROVIDER', 'ORGANIZATION', 'OTHER']).withDefault('ALL')

export function ContactsContent() {
  const router = useRouter()
  
  // Use nuqs for URL state management
  const [urlState, setUrlState] = useQueryStates(
    {
      // Search and category
      search: parseAsString.withDefault(''),
      category: contactCategoryParser,
      
      // Additional filters
      language: parseAsString,
      hasLinkedProperties: parseAsBoolean,
      
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
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([])
  const [editingContactId, setEditingContactId] = useState<string | null>(null)
  const [viewingContactId, setViewingContactId] = useState<string | null>(null)
  const [linkingContactId, setLinkingContactId] = useState<string | null>(null)
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false)

  // Debounce search value
  const debouncedSearch = useDebounce(searchInput, 300)
  
  // Update URL when debounced search changes
  useMemo(() => {
    if (debouncedSearch !== urlState.search) {
      setUrlState({ search: debouncedSearch || null, page: 1 })
    }
  }, [debouncedSearch, urlState.search, setUrlState])

  // Convert URL state to ContactFilters format
  const filters: IContactFilters = useMemo(() => {
    const result: IContactFilters = {
      search: urlState.search,
      category: urlState.category === 'ALL' ? undefined : urlState.category,
    }
    
    // Add defined filters
    if (urlState.language) result.language = urlState.language
    if (urlState.hasLinkedProperties) result.hasLinkedProperties = urlState.hasLinkedProperties
    
    return result
  }, [urlState])

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0
    
    if (filters.search) count++
    if (filters.category) count++
    if (filters.language) count++
    if (filters.hasLinkedProperties) count++
    
    return count
  }, [filters])
  
  // Fetch contacts with filters
  const { data: contacts, isLoading } = useContacts({
    filters,
    page: urlState.page,
    pageSize: 10,
  })

  // Bulk delete mutation
  const bulkDeleteMutation = useBulkDeleteContacts()

  // Handle filter changes
  const handleFiltersChange = (newFilters: IContactFilters) => {
    setIsFilterLoading(true)
    
    // Convert ContactFilters to URL state
    const updates: any = {
      search: newFilters.search || null,
      category: newFilters.category || 'ALL',
      language: newFilters.language || null,
      hasLinkedProperties: newFilters.hasLinkedProperties ?? null,
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
      category: 'ALL',
      language: null,
      hasLinkedProperties: null,
      page: 1,
    })
  }

  const handlePageChange = (newPage: number) => {
    setUrlState({ page: newPage })
  }

  // Removed handleRowClick to prevent interference with action buttons
  // Users should use the "View Details" action instead

  const handleBulkDelete = async () => {
    if (selectedContactIds.length === 0) return
    
    try {
      await bulkDeleteMutation.mutateAsync({ contactIds: selectedContactIds })
      setSelectedContactIds([])
      setShowBulkDeleteDialog(false)
    } catch (error) {
      // Error handling is done in the mutation
      
    }
  }

  // Create columns with action handlers
  const columns = useMemo(
    () => createColumns(
      (contact) => setEditingContactId(contact.id),
      (contact) => setViewingContactId(contact.id),
      (contact) => setLinkingContactId(contact.id)
    ),
    []
  )

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <motion.h1 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-xl font-bold tracking-tight"
        >
          Contacts
        </motion.h1>
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2"
        >
          {selectedContactIds.length > 0 && (
            <Button 
              variant="destructive" 
              size="sm"
              onClick={() => setShowBulkDeleteDialog(true)}
              disabled={bulkDeleteMutation.isPending}
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Delete Selected ({selectedContactIds.length})
            </Button>
          )}
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                Actions
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <ExportContactsDialog selectedContactIds={selectedContactIds}>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  <Download className="mr-2 h-4 w-4" />
                  Export Contacts
                </DropdownMenuItem>
              </ExportContactsDialog>
              <ImportContactsDialog>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  <Upload className="mr-2 h-4 w-4" />
                  Import Contacts
                </DropdownMenuItem>
              </ImportContactsDialog>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <CreateContactDialog>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Contact
            </Button>
          </CreateContactDialog>
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
              placeholder="Search contacts..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9"
            />
          </div>
          <ContactFilters
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
                {contacts?.totalCount || 0} contacts found
              </p>
              {activeFilterCount > 0 && (
                <Badge variant="secondary">
                  {activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''} active
                </Badge>
              )}
              {selectedContactIds.length > 0 && (
                <Badge variant="outline">
                  {selectedContactIds.length} selected
                </Badge>
              )}
            </div>
            
            <DataTable
              columns={columns}
              data={contacts?.data || []}
              totalCount={contacts?.totalCount || 0}
              pageSize={10}
              pageCount={contacts?.pageCount || 0}
              page={urlState.page}
              onPageChange={handlePageChange}
              selectedRowIds={selectedContactIds}
              onSelectedRowsChange={setSelectedContactIds}
            />
          </>
        )}
      </motion.div>

      {editingContactId && (
        <EditContactDialog
          contactId={editingContactId}
          open={!!editingContactId}
          onOpenChange={(open) => !open && setEditingContactId(null)}
        />
      )}

      {viewingContactId && (
        <ContactDetailDialog
          contactId={viewingContactId}
          open={!!viewingContactId}
          onOpenChange={(open) => !open && setViewingContactId(null)}
        />
      )}

      {linkingContactId && (
        <LinkPropertyDialog
          contactId={linkingContactId}
          open={!!linkingContactId}
          onOpenChange={(open) => !open && setLinkingContactId(null)}
        />
      )}


      <AlertDialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Selected Contacts</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedContactIds.length} contact{selectedContactIds.length !== 1 ? 's' : ''}? 
              This action cannot be undone and will also remove any property relationships.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={bulkDeleteMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleBulkDelete}
              disabled={bulkDeleteMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {bulkDeleteMutation.isPending ? (
                "Deleting..."
              ) : (
                `Delete ${selectedContactIds.length} Contact${selectedContactIds.length !== 1 ? 's' : ''}`
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}