"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { PropertyListItem, PropertyStatus } from "@/types/property"
import { HouseActions } from "./house-actions"
import { Button } from "@/components/ui/button"
import { ArrowUpDown, Lock, Unlock, Eye } from "lucide-react"

export const columns: ColumnDef<PropertyListItem>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
        className="translate-y-[2px]"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
        className="translate-y-[2px]"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      return (
        <div className="flex flex-col">
          <span className="font-medium">{row.getValue("name")}</span>
        </div>
      )
    },
  },
  {
    accessorKey: "destination",
    header: "Destination",
    cell: ({ row }) => {
      const destination = row.original.destination
      return (
        <div>
          {destination.name}, {destination.country}
        </div>
      )
    },
  },
  {
    accessorKey: "status",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Status
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const status = row.getValue("status") as PropertyStatus
      
      const statusConfig = {
        PUBLISHED: { 
          label: "Published", 
          variant: "default" as const,
          className: "bg-green-100 text-green-800 hover:bg-green-200"
        },
        HIDDEN: { 
          label: "Hidden", 
          variant: "secondary" as const,
          className: "bg-red-100 text-red-800 hover:bg-red-200"
        },
        ONBOARDING: { 
          label: "Onboarding", 
          variant: "outline" as const,
          className: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
        },
      }
      
      const config = statusConfig[status]
      
      return (
        <Badge variant={config.variant} className={config.className}>
          {config.label}
        </Badge>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },
  {
    id: "contractInfo",
    header: "Contract Information",
    cell: ({ row }) => {
      const hasContract = Math.random() > 0.5 // Placeholder logic
      return (
        <div className="flex items-center gap-2">
          <Checkbox checked disabled className="pointer-events-none" />
          {hasContract ? (
            <Lock className="h-4 w-4 text-gray-400" />
          ) : (
            <Unlock className="h-4 w-4 text-gray-400" />
          )}
        </div>
      )
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => <HouseActions property={row.original} />,
  },
]