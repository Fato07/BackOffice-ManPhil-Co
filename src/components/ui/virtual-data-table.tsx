"use client"

import * as React from "react"
import { List } from "react-window"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { Search, Filter, X, Download, Settings2, ChevronDown } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

interface VirtualDataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  height?: number
  itemHeight?: number
  searchable?: boolean
  searchPlaceholder?: string
  filterable?: boolean
  filterOptions?: {
    key: keyof TData
    title: string
    options: { label: string; value: string; count?: number }[]
  }[]
  exportable?: boolean
  onExport?: (data: TData[]) => void
  onRowClick?: (row: TData) => void
  actions?: React.ReactNode
  emptyState?: React.ReactNode
  className?: string
}

export function VirtualDataTable<TData, TValue>({
  columns,
  data,
  height = 400,
  itemHeight = 53,
  searchable = true,
  searchPlaceholder = "Search...",
  filterable = false,
  filterOptions = [],
  exportable = false,
  onExport,
  onRowClick,
  actions,
  emptyState,
  className,
}: VirtualDataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = React.useState("")
  const [columnVisibility, setColumnVisibility] = React.useState({})

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      columnVisibility,
    },
  })

  const filteredRows = table.getRowModel().rows

  const handleExport = () => {
    if (onExport) {
      const filteredData = filteredRows.map(row => row.original)
      onExport(filteredData)
    }
  }

  // Row renderer for react-window v2
  const Row = React.memo(({ index, style }: { index: number; style?: React.CSSProperties }) => {
    const row = filteredRows[index]
    
    return (
      <div 
        style={style} 
        className={cn(
          "flex items-center border-b border-border hover:bg-muted/50 transition-colors",
          onRowClick && "cursor-pointer"
        )}
        onClick={() => onRowClick && onRowClick(row.original)}
      >
        {row.getVisibleCells().map((cell, cellIndex) => {
          const width = cellIndex === 0 ? "200px" : "150px" // Simple width allocation
          return (
            <div
              key={cell.id}
              className="px-4 py-2 text-sm border-r border-border last:border-r-0"
              style={{ width, minWidth: width, maxWidth: width }}
            >
              {flexRender(cell.column.columnDef.cell, cell.getContext())}
            </div>
          )
        })}
      </div>
    )
  })

  Row.displayName = "VirtualTableRow"

  return (
    <div className={cn("space-y-4", className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {/* Search */}
          {searchable && (
            <div className="relative max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={searchPlaceholder}
                value={globalFilter}
                onChange={(event) => setGlobalFilter(event.target.value)}
                className="pl-8"
              />
              {globalFilter && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1 h-6 w-6 p-0"
                  onClick={() => setGlobalFilter("")}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          )}

          {/* Filters */}
          {filterable && filterOptions.map((filterOption) => (
            <DropdownMenu key={String(filterOption.key)}>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8">
                  <Filter className="mr-2 h-4 w-4" />
                  {filterOption.title}
                  {columnFilters.find(filter => filter.id === String(filterOption.key)) && (
                    <Badge variant="secondary" className="ml-2 px-1">
                      1
                    </Badge>
                  )}
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-[200px]">
                <DropdownMenuLabel>{filterOption.title}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {filterOption.options.map((option) => (
                  <DropdownMenuCheckboxItem
                    key={option.value}
                    checked={
                      columnFilters
                        .find(filter => filter.id === String(filterOption.key))
                        ?.value && Array.isArray(columnFilters.find(filter => filter.id === String(filterOption.key))?.value) 
                        ? (columnFilters.find(filter => filter.id === String(filterOption.key))?.value as string[]).includes(option.value) 
                        : false
                    }
                    onCheckedChange={(checked) => {
                      const existingFilter = columnFilters.find(
                        filter => filter.id === String(filterOption.key)
                      )
                      
                      if (checked) {
                        if (existingFilter) {
                          setColumnFilters(
                            columnFilters.map(filter =>
                              filter.id === String(filterOption.key)
                                ? { ...filter, value: [...(Array.isArray(filter.value) ? filter.value : []), option.value] }
                                : filter
                            )
                          )
                        } else {
                          setColumnFilters([
                            ...columnFilters,
                            { id: String(filterOption.key), value: [option.value] }
                          ])
                        }
                      } else {
                        if (existingFilter) {
                          const newValue = Array.isArray(existingFilter.value)
                            ? existingFilter.value.filter((v: string) => v !== option.value)
                            : []
                          if (newValue?.length === 0) {
                            setColumnFilters(
                              columnFilters.filter(
                                filter => filter.id !== String(filterOption.key)
                              )
                            )
                          } else {
                            setColumnFilters(
                              columnFilters.map(filter =>
                                filter.id === String(filterOption.key)
                                  ? { ...filter, value: newValue }
                                  : filter
                              )
                            )
                          }
                        }
                      }
                    }}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span>{option.label}</span>
                      {option.count !== undefined && (
                        <Badge variant="secondary" className="ml-2">
                          {option.count}
                        </Badge>
                      )}
                    </div>
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          ))}

          {/* Results count */}
          <div className="text-sm text-muted-foreground">
            {filteredRows.length} of {data.length} items
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {actions}
          
          {/* Export */}
          {exportable && (
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          )}

          {/* Column visibility */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="ml-auto">
                <Settings2 className="mr-2 h-4 w-4" />
                View
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[150px]">
              <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  )
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Virtual Table */}
      <div className="rounded-md border">
        {/* Header */}
        <div className="border-b border-border bg-muted/50">
          {table.getHeaderGroups().map((headerGroup) => (
            <div key={headerGroup.id} className="flex">
              {headerGroup.headers.map((header, headerIndex) => {
                const width = headerIndex === 0 ? "200px" : "150px" // Simple width allocation
                return (
                  <div
                    key={header.id}
                    className="px-4 py-3 text-sm font-medium border-r border-border last:border-r-0"
                    style={{ width, minWidth: width, maxWidth: width }}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </div>
                )
              })}
            </div>
          ))}
        </div>

        {/* Virtual Body */}
        {filteredRows.length > 0 ? (
          <List
            className="border-t"
            defaultHeight={height}
            rowCount={filteredRows.length}
            rowHeight={itemHeight}
            rowComponent={Row as any}
            rowProps={{} as any}
            overscanCount={5}
          />
        ) : (
          <div className="flex items-center justify-center py-12">
            {emptyState || (
              <div className="text-center">
                <p className="text-lg font-medium text-gray-900">No results found</p>
                <p className="text-sm text-gray-600 mt-1">
                  Try adjusting your search or filter criteria
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// Export utilities for data tables
export const exportToCSV = <T extends Record<string, any>>(
  data: T[],
  filename: string = "export.csv"
) => {
  if (data.length === 0) return

  const headers = Object.keys(data[0])
  const csvContent = [
    headers.join(","),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header]
        // Handle values that might contain commas
        if (typeof value === 'string' && value.includes(',')) {
          return `"${value}"`
        }
        return value
      }).join(",")
    )
  ].join("\n")

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
  const link = document.createElement("a")
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", filename)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}

export const exportToJSON = <T extends Record<string, any>>(
  data: T[],
  filename: string = "export.json"
) => {
  const jsonContent = JSON.stringify(data, null, 2)
  const blob = new Blob([jsonContent], { type: "application/json;charset=utf-8;" })
  const link = document.createElement("a")
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", filename)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}