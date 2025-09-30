"use client"

import * as React from "react"
import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { 
  CalendarIcon, 
  Check, 
  Edit2, 
  Trash2, 
  DollarSign,
  Percent,
  Eye,
  Calendar,
  MoreHorizontal
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { DataTable, DataTableColumnHeader } from "@/components/ui/data-table"
import { exportToCSV } from "@/components/ui/virtual-data-table"
import type { PriceRange } from "@/generated/prisma"
import { calculatePublicPrice } from "@/lib/validations/pricing"

interface PricePeriodsTableProps {
  priceRanges: PriceRange[]
  isEditing: boolean
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  onBulkDelete: (ids: string[]) => void
  onBulkValidate: (ids: string[]) => void
  onViewDetails: (priceRange: PriceRange) => void
}

// Column definitions moved outside component to prevent recreation on every render
function createColumns(
  isEditing: boolean,
  onEdit: (id: string) => void,
  onDelete: (id: string) => void,
  onViewDetails: (priceRange: PriceRange) => void
): ColumnDef<PriceRange>[] {
  return [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Period Name" />
      ),
      cell: ({ row }) => {
        const period = row.original
        return (
          <div className="flex flex-col gap-1">
            <div className="font-medium">{period.name}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <CalendarIcon className="mr-1 h-3 w-3" />
              {format(new Date(period.startDate), "MMM dd")} - {format(new Date(period.endDate), "MMM dd, yyyy")}
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "duration",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Duration" />
      ),
      cell: ({ row }) => {
        const period = row.original
        const startDate = new Date(period.startDate)
        const endDate = new Date(period.endDate)
        const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        
        return (
          <div className="text-sm">
            <div className="font-medium">{diffDays} days</div>
            {diffDays > 30 && (
              <div className="text-xs text-muted-foreground">
                ~{Math.round(diffDays / 30)} months
              </div>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: "ownerPricing",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Owner Pricing" />
      ),
      cell: ({ row }) => {
        const period = row.original
        const nightlyRate = period.ownerNightlyRate || period.nightlyRate || 0
        const weeklyRate = period.ownerWeeklyRate || period.weeklyRate || 0
        
        return (
          <div className="flex flex-col gap-1">
            <div className="flex items-center text-sm">
              <DollarSign className="mr-1 h-3 w-3 text-muted-foreground" />
              <span className="font-medium">€{nightlyRate.toLocaleString()}</span>
              <span className="text-muted-foreground ml-1">/ night</span>
            </div>
            {weeklyRate > 0 && (
              <div className="flex items-center text-xs text-muted-foreground">
                <span>€{weeklyRate.toLocaleString()} / week</span>
              </div>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: "publicPricing",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Public Pricing" />
      ),
      cell: ({ row }) => {
        const period = row.original
        const ownerNightly = period.ownerNightlyRate || period.nightlyRate || 0
        const ownerWeekly = period.ownerWeeklyRate || period.weeklyRate || 0
        const publicNightly = period.publicNightlyRate || calculatePublicPrice(ownerNightly, period.commissionRate)
        const publicWeekly = period.publicWeeklyRate || (ownerWeekly ? calculatePublicPrice(ownerWeekly, period.commissionRate) : 0)
        
        return (
          <div className="flex flex-col gap-1">
            <div className="flex items-center text-sm">
              <DollarSign className="mr-1 h-3 w-3 text-emerald-600" />
              <span className="font-medium text-emerald-600">€{publicNightly.toLocaleString()}</span>
              <span className="text-muted-foreground ml-1">/ night</span>
            </div>
            {publicWeekly > 0 && (
              <div className="flex items-center text-xs text-muted-foreground">
                <span>€{publicWeekly.toLocaleString()} / week</span>
              </div>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: "commissionRate",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Commission" />
      ),
      cell: ({ row }) => {
        const period = row.original
        return (
          <div className="flex items-center">
            <Percent className="mr-1 h-3 w-3 text-muted-foreground" />
            <span className="text-sm font-medium">{period.commissionRate}%</span>
          </div>
        )
      },
    },
    {
      accessorKey: "isValidated",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => {
        const period = row.original
        return period.isValidated ? (
          <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
            <Check className="w-3 h-3 mr-1" />
            Validated
          </Badge>
        ) : (
          <Badge variant="outline">
            Pending
          </Badge>
        )
      },
    },
    {
      accessorKey: "season",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Season" />
      ),
      cell: ({ row }) => {
        const period = row.original
        const startDate = new Date(period.startDate)
        const month = startDate.getMonth()
        
        let season: string
        let seasonColor: string
        
        if (month >= 2 && month <= 4) {
          season = "Spring"
          seasonColor = "bg-green-100 text-green-800 border-green-200"
        } else if (month >= 5 && month <= 7) {
          season = "Summer"
          seasonColor = "bg-yellow-100 text-yellow-800 border-yellow-200"
        } else if (month >= 8 && month <= 10) {
          season = "Autumn"
          seasonColor = "bg-orange-100 text-orange-800 border-orange-200"
        } else {
          season = "Winter"
          seasonColor = "bg-blue-100 text-blue-800 border-blue-200"
        }
        
        return (
          <Badge variant="secondary" className={seasonColor}>
            {season}
          </Badge>
        )
      },
    },
    {
      id: "actions",
      header: () => <span className="flex justify-end">Actions</span>,
      enableSorting: false,
      cell: ({ row }) => {
        const period = row.original

        return (
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-accent transition-colors"
              onClick={() => onViewDetails(period)}
              title="View Details"
            >
              <Eye className="h-4 w-4" />
              <span className="sr-only">View details</span>
            </Button>
            {isEditing && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 hover:bg-accent transition-colors"
                  onClick={() => onEdit(period.id)}
                  title="Edit"
                >
                  <Edit2 className="h-4 w-4" />
                  <span className="sr-only">Edit</span>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 hover:text-destructive hover:bg-destructive/10 transition-colors"
                  onClick={() => onDelete(period.id)}
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Delete</span>
                </Button>
              </>
            )}
          </div>
        )
      },
    },
  ]
}

export const PricePeriodsTable = React.memo(function PricePeriodsTable({
  priceRanges,
  isEditing,
  onEdit,
  onDelete,
  onBulkDelete,
  onBulkValidate,
  onViewDetails,
}: PricePeriodsTableProps) {
  // Memoize columns to prevent recreation unless handlers change
  const columns = React.useMemo(
    () => createColumns(isEditing, onEdit, onDelete, onViewDetails),
    [isEditing, onEdit, onDelete, onViewDetails]
  )

  const handleExport = React.useCallback((data: PriceRange[]) => {
    const exportData = data.map(range => ({
      name: range.name,
      startDate: format(new Date(range.startDate), "yyyy-MM-dd"),
      endDate: format(new Date(range.endDate), "yyyy-MM-dd"),
      ownerNightlyRate: range.ownerNightlyRate || range.nightlyRate || 0,
      ownerWeeklyRate: range.ownerWeeklyRate || range.weeklyRate || 0,
      publicNightlyRate: range.publicNightlyRate || calculatePublicPrice(
        range.ownerNightlyRate || range.nightlyRate || 0, 
        range.commissionRate
      ),
      publicWeeklyRate: range.publicWeeklyRate || (
        range.ownerWeeklyRate || range.weeklyRate ? 
        calculatePublicPrice(range.ownerWeeklyRate || range.weeklyRate || 0, range.commissionRate) : 
        0
      ),
      commissionRate: range.commissionRate,
      isValidated: range.isValidated ? "Yes" : "No",
      createdAt: format(new Date(range.createdAt), "yyyy-MM-dd HH:mm"),
    }))
    
    exportToCSV(exportData, `price-periods-${format(new Date(), "yyyy-MM-dd")}.csv`)
  }, [])

  return (
    <DataTable
      columns={columns}
      data={priceRanges}
      searchable={true}
      searchPlaceholder="Search price periods..."
      exportable={true}
      onExport={handleExport}
      emptyState={
        <div className="text-center py-12">
          <Calendar className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-2 text-sm font-medium text-muted-foreground">No pricing periods</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Get started by adding your first pricing period.
          </p>
        </div>
      }
    />
  )
})