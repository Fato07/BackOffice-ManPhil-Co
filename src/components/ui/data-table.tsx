"use client"

import * as React from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  Row,
  Cell,
  Table as ReactTable,
} from "@tanstack/react-table"
import { 
  ArrowUpDown, 
  ChevronDown, 
  Search,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Settings2,
  Download,
  MoreHorizontal
} from "lucide-react"

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  searchable?: boolean
  searchPlaceholder?: string
  searchKey?: keyof TData
  filterable?: boolean
  filterOptions?: {
    key: keyof TData
    title: string
    options: { label: string; value: string; count?: number }[]
  }[]
  exportable?: boolean
  onExport?: (data: TData[]) => void
  selectable?: boolean
  onSelectionChange?: (selectedRows: TData[]) => void
  actions?: React.ReactNode
  emptyState?: React.ReactNode
  className?: string
  pagination?: {
    pageSize?: number
    showPageSizeSelector?: boolean
    pageSizeOptions?: number[]
  }
  groupBy?: {
    key: keyof TData
    getGroupLabel: (value: any) => string
    getGroupCount: (items: TData[]) => number
    defaultExpanded?: boolean
  }
}

interface GroupedDataTableProps<TData, TValue> extends DataTableProps<TData, TValue> {
  groupBy: {
    key: keyof TData
    getGroupLabel: (value: any) => string
    getGroupCount: (items: TData[]) => number
    defaultExpanded?: boolean
  }
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchable = true,
  searchPlaceholder = "Search...",
  searchKey,
  filterable = false,
  filterOptions = [],
  exportable = false,
  onExport,
  selectable = false,
  onSelectionChange,
  actions,
  emptyState,
  className,
  pagination = {
    pageSize: 20,
    showPageSizeSelector: true,
    pageSizeOptions: [10, 20, 50, 100]
  },
  groupBy,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = React.useState("")
  const [columnVisibility, setColumnVisibility] = React.useState({})
  const [rowSelection, setRowSelection] = React.useState({})

  // Group data if groupBy is provided
  const groupedData = React.useMemo(() => {
    if (!groupBy) return null
    
    const groups = data.reduce((acc, item) => {
      const groupValue = item[groupBy.key]
      // Use getGroupLabel to generate the grouping key for consistent grouping
      const groupKey = groupBy.getGroupLabel(groupValue)
      
      if (!acc[groupKey]) {
        acc[groupKey] = {
          label: groupKey,
          items: [],
          expanded: groupBy.defaultExpanded ?? true
        }
      }
      acc[groupKey].items.push(item)
      return acc
    }, {} as Record<string, { label: string; items: TData[]; expanded: boolean }>)
    
    return groups
  }, [data, groupBy])

  const [expandedGroups, setExpandedGroups] = React.useState<Record<string, boolean>>(
    groupedData 
      ? Object.keys(groupedData).reduce((acc, key) => ({ 
          ...acc, 
          [key]: groupedData[key].expanded 
        }), {})
      : {}
  )

  const tableData = React.useMemo(() => {
    if (groupBy && groupedData) {
      // Flatten grouped data for table display
      return Object.entries(groupedData).flatMap(([groupKey, group]) => {
        if (!expandedGroups[groupKey]) return []
        return group.items
      })
    }
    return data
  }, [data, groupBy, groupedData, expandedGroups])

  const table = useReactTable({
    data: tableData,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      columnVisibility,
      rowSelection,
    },
    initialState: {
      pagination: {
        pageSize: pagination.pageSize || 20,
      },
    },
    enableRowSelection: selectable,
  })

  React.useEffect(() => {
    if (onSelectionChange && selectable) {
      const selectedRows = table.getFilteredSelectedRowModel().rows.map(row => row.original)
      onSelectionChange(selectedRows)
    }
  }, [rowSelection, onSelectionChange, selectable, table])

  const toggleGroup = (groupKey: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupKey]: !prev[groupKey]
    }))
  }

  const handleExport = () => {
    if (onExport) {
      const filteredData = table.getFilteredRowModel().rows.map(row => row.original)
      onExport(filteredData)
    }
  }

  if (groupBy && groupedData) {
    return <GroupedDataTable 
      {...{
        columns,
        data,
        searchable,
        searchPlaceholder,
        searchKey,
        filterable,
        filterOptions,
        exportable,
        onExport,
        selectable,
        onSelectionChange,
        actions,
        emptyState,
        className,
        pagination,
        groupBy
      }}
      groupedData={groupedData}
      expandedGroups={expandedGroups}
      toggleGroup={toggleGroup}
      table={table}
      globalFilter={globalFilter}
      setGlobalFilter={setGlobalFilter}
      handleExport={handleExport}
    />
  }

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
                                ? { ...filter, value: [...(filter.value as string[]), option.value] }
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
                          const newValue = (existingFilter.value as string[])?.filter(
                            (v: string) => v !== option.value
                          )
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

      {/* Table */}
      <div className="w-full">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
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
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  {emptyState || "No results."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <p className="text-sm font-medium">Rows per page</p>
          {pagination.showPageSizeSelector && (
            <Select
              value={`${table.getState().pagination.pageSize}`}
              onValueChange={(value) => {
                table.setPageSize(Number(value))
              }}
            >
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue placeholder={table.getState().pagination.pageSize} />
              </SelectTrigger>
              <SelectContent side="top">
                {(pagination.pageSizeOptions || [10, 20, 50, 100]).map((pageSize) => (
                  <SelectItem key={pageSize} value={`${pageSize}`}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <div className="flex items-center space-x-6 lg:space-x-8">
          <div className="flex items-center space-x-2">
            <p className="text-sm text-muted-foreground">
              {table.getFilteredSelectedRowModel().rows.length} of{" "}
              {table.getFilteredRowModel().rows.length} row(s) selected
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium">
              Page {table.getState().pagination.pageIndex + 1} of{" "}
              {table.getPageCount()}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Go to first page</span>
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Go to previous page</span>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Go to next page</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Go to last page</span>
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Helper component for sortable column headers
export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  className,
}: {
  column: any
  title: string
  className?: string
}) {
  if (!column.getCanSort()) {
    return <div className={cn(className)}>{title}</div>
  }

  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8 data-[state=open]:bg-accent"
          >
            <span>{title}</span>
            {column.getIsSorted() === "desc" ? (
              <ArrowUpDown className="ml-2 h-4 w-4" />
            ) : column.getIsSorted() === "asc" ? (
              <ArrowUpDown className="ml-2 h-4 w-4" />
            ) : (
              <ArrowUpDown className="ml-2 h-4 w-4" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onClick={() => column.toggleSorting(false)}>
            <ArrowUpDown className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
            Asc
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => column.toggleSorting(true)}>
            <ArrowUpDown className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
            Desc
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => column.clearSorting()}>
            <X className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
            Clear
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

interface GroupedDataTableInternalProps<TData, TValue> extends DataTableProps<TData, TValue> {
  groupedData: Record<string, { label: string; items: TData[]; expanded: boolean }>
  expandedGroups: Record<string, boolean>
  toggleGroup: (groupKey: string) => void
  table: ReactTable<TData>
  globalFilter: string
  setGlobalFilter: (value: string) => void
  handleExport: () => void
}

// Grouped data table component
function GroupedDataTable<TData, TValue>({
  groupedData,
  expandedGroups,
  toggleGroup,
  table,
  globalFilter,
  setGlobalFilter,
  handleExport,
  searchable,
  searchPlaceholder,
  filterable,
  filterOptions,
  exportable,
  actions,
  emptyState,
  className,
  columns,
}: GroupedDataTableInternalProps<TData, TValue>) {
  return (
    <div className={cn("space-y-4", className)}>
      {/* Toolbar - Same as regular table */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
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
        </div>

        <div className="flex items-center space-x-2">
          {actions}
          {exportable && (
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          )}
        </div>
      </div>

      {/* Grouped content */}
      <div className="space-y-6">
        {Object.entries(groupedData).map(([groupKey, group]: [string, any]) => (
          <div key={groupKey} className="w-full">
            {/* Group header */}
            <div 
              className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50"
              onClick={() => toggleGroup(groupKey)}
            >
              <div className="flex items-center space-x-2">
                <ChevronDown 
                  className={cn(
                    "h-4 w-4 transition-transform",
                    !expandedGroups[groupKey] && "-rotate-90"
                  )}
                />
                <h3 className="font-medium">{group.label}</h3>
                <Badge variant="secondary">
                  {group.items.length}
                </Badge>
              </div>
            </div>

            {/* Group content */}
            {expandedGroups[groupKey] && (
              <div>
                <Table>
                  <TableHeader>
                    {table.getHeaderGroups().map((headerGroup: any) => (
                      <TableRow key={headerGroup.id}>
                        {headerGroup.headers.map((header: any) => (
                          <TableHead key={header.id}>
                            {header.isPlaceholder
                              ? null
                              : flexRender(
                                  header.column.columnDef.header,
                                  header.getContext()
                                )}
                          </TableHead>
                        ))}
                      </TableRow>
                    ))}
                  </TableHeader>
                  <TableBody>
                    {table.getRowModel().rows
                      .filter((row: Row<TData>) => group.items.includes(row.original))
                      .map((row: Row<TData>) => (
                        <TableRow
                          key={row.id}
                          data-state={row.getIsSelected() && "selected"}
                        >
                          {row.getVisibleCells().map((cell: Cell<TData, unknown>) => (
                            <TableCell key={cell.id}>
                              {flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext()
                              )}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    {group.items.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={columns.length} className="text-center py-8">
                          {emptyState || "No items in this group."}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}