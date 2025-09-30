"use client"

import * as React from "react"
import { ColumnDef } from "@tanstack/react-table"
import { 
  Check, 
  Edit2, 
  Trash2, 
  DollarSign,
  User,
  MessageCircle,
  Receipt,
  Home,
  Bed,
  Package,
  Briefcase,
  Eye,
  MoreHorizontal
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { DataTable, DataTableColumnHeader } from "@/components/ui/data-table"
import { exportToCSV } from "@/components/ui/virtual-data-table"
import { cn } from "@/lib/utils"
import type { OperationalCost, OperationalCostType, PriceType } from "@/generated/prisma"

interface OperationalCostsTableProps {
  operationalCosts: OperationalCost[]
  isEditing: boolean
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  onBulkDelete: (ids: string[]) => void
  onViewDetails: (cost: OperationalCost) => void
}

const OPERATIONAL_COST_TYPES: { 
  value: OperationalCostType; 
  label: string; 
  description: string; 
  icon: React.ReactNode;
  color: string;
}[] = [
  { 
    value: "HOUSEKEEPING", 
    label: "Housekeeping",
    description: "Regular cleaning and maintenance",
    icon: <Home className="w-4 h-4" />,
    color: "bg-blue-100 text-blue-600 border-blue-200"
  },
  { 
    value: "HOUSEKEEPING_AT_CHECKOUT", 
    label: "Housekeeping at checkout",
    description: "Final cleaning after guest departure",
    icon: <Package className="w-4 h-4" />,
    color: "bg-purple-100 text-purple-600 border-purple-200"
  },
  { 
    value: "LINEN_CHANGE", 
    label: "Linen change",
    description: "Bed linens and towel replacement",
    icon: <Bed className="w-4 h-4" />,
    color: "bg-green-100 text-green-600 border-green-200"
  },
  { 
    value: "OPERATIONAL_PACKAGE", 
    label: "Operational package",
    description: "Complete operational services bundle",
    icon: <Briefcase className="w-4 h-4" />,
    color: "bg-orange-100 text-orange-600 border-orange-200"
  },
]

const PRICE_TYPES: { 
  value: PriceType; 
  label: string;
  description: string;
}[] = [
  { value: "PER_STAY", label: "Per stay", description: "Charged once per booking" },
  { value: "PER_WEEK", label: "Per week", description: "Charged weekly" },
  { value: "PER_DAY", label: "Per day", description: "Charged daily" },
  { value: "FIXED", label: "Fixed", description: "Fixed amount" },
]

// Column definitions moved outside component to prevent recreation on every render
function createColumns(
  isEditing: boolean,
  onEdit: (id: string) => void,
  onDelete: (id: string) => void,
  onViewDetails: (cost: OperationalCost) => void
): ColumnDef<OperationalCost>[] {
  return [
    {
      accessorKey: "costType",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Cost Type" />
      ),
      cell: ({ row }) => {
        const cost = row.original
        const costType = OPERATIONAL_COST_TYPES.find(t => t.value === cost.costType)
        
        return (
          <div className="flex items-center gap-3">
            <div className={cn("p-2 rounded-lg", costType?.color || "bg-gray-100")}>
              {costType?.icon || <Receipt className="w-4 h-4" />}
            </div>
            <div>
              <div className="font-medium">{costType?.label || cost.costType}</div>
              <div className="text-xs text-muted-foreground">{costType?.description}</div>
            </div>
          </div>
        )
      },
      filterFn: (row, id, value) => {
        const cost = row.original as OperationalCost
        return value.includes(cost.costType)
      },
    },
    {
      accessorKey: "priceType",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Billing Type" />
      ),
      cell: ({ row }) => {
        const cost = row.original
        const priceType = PRICE_TYPES.find(t => t.value === cost.priceType)
        
        return (
          <div>
            <Badge variant="secondary" className="mb-1">
              {priceType?.label || cost.priceType}
            </Badge>
            <div className="text-xs text-muted-foreground">
              {priceType?.description}
            </div>
          </div>
        )
      },
      filterFn: (row, id, value) => {
        const cost = row.original as OperationalCost
        return value.includes(cost.priceType)
      },
    },
    {
      accessorKey: "estimatedPrice",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Estimated Price" />
      ),
      cell: ({ row }) => {
        const cost = row.original
        
        return (
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium">
              {cost.estimatedPrice ? `€${cost.estimatedPrice.toLocaleString()}` : "—"}
            </span>
          </div>
        )
      },
    },
    {
      accessorKey: "publicPrice",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Public Price" />
      ),
      cell: ({ row }) => {
        const cost = row.original
        
        return (
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-600" />
            <span className="font-medium text-emerald-600">
              {cost.publicPrice ? `€${cost.publicPrice.toLocaleString()}` : "—"}
            </span>
          </div>
        )
      },
    },
    {
      accessorKey: "paidBy",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Paid By" />
      ),
      cell: ({ row }) => {
        const cost = row.original
        
        if (!cost.paidBy) {
          return <span className="text-muted-foreground">—</span>
        }
        
        let badgeColor = "bg-gray-100 text-gray-800 border-gray-200"
        if (cost.paidBy === "Le Collectionist") {
          badgeColor = "bg-blue-100 text-blue-800 border-blue-200"
        } else if (cost.paidBy === "Guest") {
          badgeColor = "bg-green-100 text-green-800 border-green-200"
        } else if (cost.paidBy === "Owner") {
          badgeColor = "bg-purple-100 text-purple-800 border-purple-200"
        }
        
        return (
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-muted-foreground" />
            <Badge variant="secondary" className={badgeColor}>
              {cost.paidBy}
            </Badge>
          </div>
        )
      },
      filterFn: (row, id, value) => {
        const cost = row.original as OperationalCost
        return value.includes(cost.paidBy || "")
      },
    },
    {
      accessorKey: "comment",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Notes" />
      ),
      cell: ({ row }) => {
        const cost = row.original
        
        if (!cost.comment) {
          return <span className="text-muted-foreground">—</span>
        }
        
        return (
          <div className="flex items-center gap-2 max-w-[200px]">
            <MessageCircle className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm truncate" title={cost.comment}>
              {cost.comment}
            </span>
          </div>
        )
      },
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Created" />
      ),
      cell: ({ row }) => {
        const cost = row.original
        return (
          <div className="text-sm">
            <div>{new Date(cost.createdAt).toLocaleDateString()}</div>
            <div className="text-xs text-muted-foreground">
              {new Date(cost.createdAt).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
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
        const cost = row.original

        return (
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-accent transition-colors"
              onClick={() => onViewDetails(cost)}
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
                  onClick={() => onEdit(cost.id)}
                  title="Edit"
                >
                  <Edit2 className="h-4 w-4" />
                  <span className="sr-only">Edit</span>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 hover:text-destructive hover:bg-destructive/10 transition-colors"
                  onClick={() => onDelete(cost.id)}
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

export const OperationalCostsTable = React.memo(function OperationalCostsTable({
  operationalCosts,
  isEditing,
  onEdit,
  onDelete,
  onBulkDelete,
  onViewDetails,
}: OperationalCostsTableProps) {
  const handleExport = React.useCallback((data: OperationalCost[]) => {
    const exportData = data.map(cost => ({
      costType: cost.costType,
      priceType: cost.priceType,
      estimatedPrice: cost.estimatedPrice || 0,
      publicPrice: cost.publicPrice || 0,
      paidBy: cost.paidBy || "",
      comment: cost.comment || "",
      createdAt: new Date(cost.createdAt).toISOString(),
    }))
    
    exportToCSV(exportData, `operational-costs-${new Date().toISOString().split('T')[0]}.csv`)
  }, [])

  // Memoize columns to prevent recreation unless handlers change
  const columns = React.useMemo(
    () => createColumns(isEditing, onEdit, onDelete, onViewDetails),
    [isEditing, onEdit, onDelete, onViewDetails]
  )

  return (
    <DataTable
      columns={columns}
      data={operationalCosts}
      searchable={true}
      searchPlaceholder="Search operational costs..."
      exportable={true}
      onExport={handleExport}
      emptyState={
        <div className="text-center py-12">
          <Receipt className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-2 text-sm font-medium text-muted-foreground">No operational costs</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Get started by adding your first operational cost.
          </p>
        </div>
      }
    />
  )
})