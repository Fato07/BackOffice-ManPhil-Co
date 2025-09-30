"use client"

import * as React from "react"
import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { 
  CalendarIcon, 
  Edit2, 
  Trash2, 
  Clock,
  Moon,
  Calendar,
  Eye} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DataTable, DataTableColumnHeader } from "@/components/ui/data-table"
import { exportToCSV } from "@/components/ui/virtual-data-table"
import type { MinimumStayRule, BookingCondition } from "@/generated/prisma"

interface MinimumStayTableProps {
  minimumStayRules: MinimumStayRule[]
  isEditing: boolean
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  onBulkDelete: (ids: string[]) => void
  onViewDetails: (rule: MinimumStayRule) => void
}

const BOOKING_CONDITIONS: { value: BookingCondition; label: string; description: string; icon: React.ReactNode }[] = [
  { 
    value: "PER_NIGHT", 
    label: "Per night",
    description: "Flexible daily bookings",
    icon: <Moon className="w-4 h-4" />
  },
  { 
    value: "WEEKLY_SATURDAY_TO_SATURDAY", 
    label: "Weekly - Saturday to Saturday",
    description: "Saturday check-in/out only",
    icon: <Calendar className="w-4 h-4" />
  },
  { 
    value: "WEEKLY_SUNDAY_TO_SUNDAY", 
    label: "Weekly - Sunday to Sunday",
    description: "Sunday check-in/out only",
    icon: <Calendar className="w-4 h-4" />
  },
  { 
    value: "WEEKLY_MONDAY_TO_MONDAY", 
    label: "Weekly - Monday to Monday",
    description: "Monday check-in/out only",
    icon: <Calendar className="w-4 h-4" />
  },
]

// Column definitions moved outside component to prevent recreation on every render
function createColumns(
  isEditing: boolean,
  onEdit: (id: string) => void,
  onDelete: (id: string) => void,
  onViewDetails: (rule: MinimumStayRule) => void
): ColumnDef<MinimumStayRule>[] {
  return [
    {
      accessorKey: "bookingCondition",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Booking Condition" />
      ),
      cell: ({ row }) => {
        const rule = row.original
        const condition = BOOKING_CONDITIONS.find(c => c.value === rule.bookingCondition)
        
        return (
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              {condition?.icon || <Calendar className="w-4 h-4 text-indigo-600" />}
            </div>
            <div>
              <div className="font-medium">{condition?.label || rule.bookingCondition}</div>
              <div className="text-xs text-muted-foreground">{condition?.description}</div>
            </div>
          </div>
        )
      },
      filterFn: (row, id, value) => {
        const rule = row.original as MinimumStayRule
        return value.includes(rule.bookingCondition)
      },
    },
    {
      accessorKey: "minimumNights",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Minimum Stay" />
      ),
      cell: ({ row }) => {
        const rule = row.original
        
        return (
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium">{rule.minimumNights}</span>
            <span className="text-sm text-muted-foreground">
              night{rule.minimumNights > 1 ? 's' : ''}
            </span>
          </div>
        )
      },
    },
    {
      accessorKey: "applicablePeriod",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Applicable Period" />
      ),
      cell: ({ row }) => {
        const rule = row.original
        
        if (!rule.startDate || !rule.endDate) {
          return (
            <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
              All year round
            </Badge>
          )
        }
        
        return (
          <div className="flex flex-col gap-1">
            <div className="flex items-center text-sm">
              <CalendarIcon className="mr-1 h-3 w-3 text-muted-foreground" />
              <span>{format(new Date(rule.startDate), "MMM dd")} - {format(new Date(rule.endDate), "MMM dd, yyyy")}</span>
            </div>
            <Badge variant="secondary" className="text-xs">
              Seasonal
            </Badge>
          </div>
        )
      },
      filterFn: (row, id, value) => {
        const rule = row.original as MinimumStayRule
        const isYearRound = !rule.startDate && !rule.endDate
        return value.includes(isYearRound ? "year-round" : "seasonal")
      },
    },
    {
      accessorKey: "duration",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Duration" />
      ),
      cell: ({ row }) => {
        const rule = row.original
        
        if (!rule.startDate || !rule.endDate) {
          return (
            <span className="text-sm text-muted-foreground">Permanent</span>
          )
        }
        
        const startDate = new Date(rule.startDate)
        const endDate = new Date(rule.endDate)
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
      accessorKey: "ruleType",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Type" />
      ),
      cell: ({ row }) => {
        const rule = row.original
        const isWeekly = rule.bookingCondition.includes("WEEKLY")
        
        return (
          <Badge 
            variant="secondary" 
            className={isWeekly ? "bg-purple-100 text-purple-800 border-purple-200" : "bg-green-100 text-green-800 border-green-200"}
          >
            {isWeekly ? "Weekly" : "Flexible"}
          </Badge>
        )
      },
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Created" />
      ),
      cell: ({ row }) => {
        const rule = row.original
        return (
          <div className="text-sm">
            <div>{format(new Date(rule.createdAt), "MMM dd, yyyy")}</div>
            <div className="text-xs text-muted-foreground">
              {format(new Date(rule.createdAt), "HH:mm")}
            </div>
          </div>
        )
      },
    },
    {
      id: "actions",
      header: () => <span className="flex justify-end">Actions</span>,
      enableSorting: false,
      cell: ({ row }) => {
        const rule = row.original

        return (
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-accent transition-colors"
              onClick={() => onViewDetails(rule)}
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
                  onClick={() => onEdit(rule.id)}
                  title="Edit"
                >
                  <Edit2 className="h-4 w-4" />
                  <span className="sr-only">Edit</span>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 hover:text-destructive hover:bg-destructive/10 transition-colors"
                  onClick={() => onDelete(rule.id)}
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

export const MinimumStayTable = React.memo(function MinimumStayTable({
  minimumStayRules,
  isEditing,
  onEdit,
  onDelete,
  onBulkDelete,
  onViewDetails,
}: MinimumStayTableProps) {
  const handleExport = React.useCallback((data: MinimumStayRule[]) => {
    const exportData = data.map(rule => ({
      bookingCondition: rule.bookingCondition,
      minimumNights: rule.minimumNights,
      startDate: rule.startDate ? format(new Date(rule.startDate), "yyyy-MM-dd") : "All year",
      endDate: rule.endDate ? format(new Date(rule.endDate), "yyyy-MM-dd") : "All year",
      isYearRound: (!rule.startDate && !rule.endDate) ? "Yes" : "No",
      createdAt: format(new Date(rule.createdAt), "yyyy-MM-dd HH:mm"),
    }))
    
    exportToCSV(exportData, `minimum-stay-rules-${format(new Date(), "yyyy-MM-dd")}.csv`)
  }, [])

  // Memoize columns to prevent recreation unless handlers change
  const columns = React.useMemo(
    () => createColumns(isEditing, onEdit, onDelete, onViewDetails),
    [isEditing, onEdit, onDelete, onViewDetails]
  )

  return (
    <DataTable
      columns={columns}
      data={minimumStayRules}
      searchable={true}
      searchPlaceholder="Search minimum stay rules..."
      exportable={true}
      onExport={handleExport}
      emptyState={
        <div className="text-center py-12">
          <Clock className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-2 text-sm font-medium text-muted-foreground">No minimum stay rules</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Get started by adding your first minimum stay rule.
          </p>
        </div>
      }
    />
  )
})