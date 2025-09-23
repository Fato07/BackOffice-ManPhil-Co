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
        className="translate-y-[2px] h-3.5 w-3.5"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
        className="translate-y-[2px] h-3.5 w-3.5"
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
          className="hover:bg-transparent p-0 font-semibold text-xs h-auto"
        >
          Name
          <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const mainPhoto = row.original.photos?.[0]
      return (
        <div className="flex items-center gap-3">
          {mainPhoto ? (
            <div className="relative h-10 w-10 overflow-hidden rounded-md bg-gray-100 flex-shrink-0">
              <img
                src={mainPhoto.url}
                alt={mainPhoto.caption || row.getValue("name")}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>
          ) : (
            <div className="h-10 w-10 rounded-md bg-gray-100 flex items-center justify-center flex-shrink-0">
              <Eye className="h-4 w-4 text-gray-400" />
            </div>
          )}
          <div className="flex flex-col">
            <span className="font-medium text-xs">{row.getValue("name")}</span>
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "destination",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="hover:bg-transparent p-0 font-semibold text-xs h-auto"
        >
          Destination
          <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const destination = row.original.destination
      return (
        <div className="text-xs text-muted-foreground">
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
          className="hover:bg-transparent p-0 font-semibold text-xs h-auto"
        >
          Status
          <ArrowUpDown className="ml-1 h-3 w-3" />
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
        OFFBOARDED: { 
          label: "Offboarded", 
          variant: "secondary" as const,
          className: "bg-gray-100 text-gray-600 hover:bg-gray-200"
        },
      }
      
      const config = statusConfig[status]
      
      return (
        <Badge variant={config.variant} className={`${config.className} text-[10px] py-0 px-1.5 h-5`}>
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
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="hover:bg-transparent p-0 font-semibold text-xs h-auto"
        >
          Contract Information
          <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const hasContract = Math.random() > 0.5 // Placeholder logic
      return (
        <div className="flex items-center gap-2">
          <Checkbox checked disabled className="pointer-events-none h-3.5 w-3.5" />
          {hasContract ? (
            <Lock className="h-2.5 w-2.5 text-gray-400" />
          ) : (
            <Unlock className="h-2.5 w-2.5 text-gray-400" />
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