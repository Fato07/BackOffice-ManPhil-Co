"use client"

import * as React from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { DataTablePagination } from "./data-table-pagination"
import { motion } from "framer-motion"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  toolbar?: React.ComponentType<{ table: ReturnType<typeof useReactTable<TData>> }>
  onRowClick?: (row: TData) => void
  pageSize?: number
  totalCount?: number
  pageCount?: number
  page?: number
  onPageChange?: (page: number) => void
  selectedRowIds?: string[]
  onSelectedRowsChange?: (selectedIds: string[]) => void
  enableAnimations?: boolean // New prop to control animations
}

export function DataTable<TData, TValue>({
  columns,
  data,
  toolbar: Toolbar,
  onRowClick,
  pageSize = 10,
  totalCount,
  pageCount,
  page,
  onPageChange,
  selectedRowIds,
  onSelectedRowsChange,
  enableAnimations = false, // Default to false for better performance
}: DataTableProps<TData, TValue>) {
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [sorting, setSorting] = React.useState<SortingState>([])

  // Convert selectedRowIds prop to TanStack Table format
  const rowSelection = React.useMemo(() => {
    if (!selectedRowIds) return {}
    const selection: Record<string, boolean> = {}
    selectedRowIds.forEach((id) => {
      selection[id] = true
    })
    return selection
  }, [selectedRowIds])

  // Handle selection changes and notify parent
  const handleRowSelectionChange = React.useCallback((updater: any) => {
    if (!onSelectedRowsChange) return
    
    const newSelection = typeof updater === 'function' ? updater(rowSelection) : updater
    const selectedIds = Object.keys(newSelection)
      .filter(key => newSelection[key])
    
    onSelectedRowsChange(selectedIds)
  }, [rowSelection, onSelectedRowsChange])

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
    },
    enableRowSelection: true,
    onRowSelectionChange: handleRowSelectionChange,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getRowId: (row: any) => row.id,
    initialState: {
      pagination: {
        pageSize,
      },
    },
  })

  return (
    <div className="space-y-4">
      {Toolbar && <Toolbar table={table} />}
      <div className="rounded-md border">
        <Table className="w-full">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead 
                      key={header.id} 
                      colSpan={header.colSpan}
                      className={(header.column.columnDef.meta as any)?.className}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => {
                const RowComponent = enableAnimations ? motion.tr : 'tr'
                const { key, ...rowProps } = enableAnimations
                  ? {
                      key: row.id,
                      initial: { opacity: 0 },
                      animate: { opacity: 1 },
                      transition: { duration: 0.15 },
                      "data-state": row.getIsSelected() && "selected",
                      onClick: (e: React.MouseEvent) => {
                        // Don't trigger row click if clicking on a checkbox, button, or link
                        const target = e.target as HTMLElement
                        const isInteractiveElement = 
                          target.tagName === 'INPUT' ||
                          target.tagName === 'BUTTON' ||
                          target.tagName === 'A' ||
                          target.closest('button') ||
                          target.closest('a') ||
                          target.closest('[role="checkbox"]') ||
                          target.closest('[data-no-row-click]')
                        
                        if (!isInteractiveElement && onRowClick) {
                          onRowClick(row.original)
                        }
                      },
                      className: `border-b transition-colors ${onRowClick ? "cursor-pointer hover:bg-gray-50/50" : ""}`
                    }
                  : {
                      key: row.id,
                      "data-state": row.getIsSelected() && "selected",
                      onClick: (e: React.MouseEvent) => {
                        // Don't trigger row click if clicking on a checkbox, button, or link
                        const target = e.target as HTMLElement
                        const isInteractiveElement = 
                          target.tagName === 'INPUT' ||
                          target.tagName === 'BUTTON' ||
                          target.tagName === 'A' ||
                          target.closest('button') ||
                          target.closest('a') ||
                          target.closest('[role="checkbox"]') ||
                          target.closest('[data-no-row-click]')
                        
                        if (!isInteractiveElement && onRowClick) {
                          onRowClick(row.original)
                        }
                      },
                      className: `border-b transition-colors ${onRowClick ? "cursor-pointer hover:bg-gray-50/50" : ""}`
                    }
                
                return (
                  <RowComponent key={key} {...rowProps}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell 
                      key={cell.id}
                      className={(cell.column.columnDef.meta as any)?.className}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                  </RowComponent>
                )
              })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {pageCount && onPageChange && page ? (
        <div className="flex items-center justify-between px-2">
          <div className="flex-1 text-sm text-muted-foreground">
            {selectedRowIds?.length || 0} of {totalCount || data.length} row(s) selected.
          </div>
          <div className="flex items-center space-x-6 lg:space-x-8">
            <div className="flex w-[100px] items-center justify-center text-sm font-medium">
              Page {page} of {pageCount}
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                className="h-8 w-8 p-0"
                onClick={() => onPageChange(1)}
                disabled={page <= 1}
              >
                <span className="sr-only">Go to first page</span>
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="h-8 w-8 p-0"
                onClick={() => onPageChange(page - 1)}
                disabled={page <= 1}
              >
                <span className="sr-only">Go to previous page</span>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="h-8 w-8 p-0"
                onClick={() => onPageChange(page + 1)}
                disabled={page >= pageCount}
              >
                <span className="sr-only">Go to next page</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="h-8 w-8 p-0"
                onClick={() => onPageChange(pageCount)}
                disabled={page >= pageCount}
              >
                <span className="sr-only">Go to last page</span>
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <DataTablePagination table={table} />
      )}
    </div>
  )
}