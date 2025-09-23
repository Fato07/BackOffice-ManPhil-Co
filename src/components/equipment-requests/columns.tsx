"use client"

import { useState } from "react"
import { ColumnDef } from "@tanstack/react-table"
import { EquipmentRequestListItem, EquipmentRequestStatus, EquipmentRequestPriority } from "@/types/equipment-request"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Eye, Edit, Trash, Package } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { format } from "date-fns"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowUpDown } from "lucide-react"
import { DeleteEquipmentRequestDialog } from "./delete-equipment-request-dialog"
import { useRouter } from "next/navigation"

// Actions cell component
function ActionsCell({ request }: { request: EquipmentRequestListItem }) {
  const router = useRouter()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-6 w-6 p-0"
        >
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel className="text-xs">Actions</DropdownMenuLabel>
        <DropdownMenuItem asChild className="text-xs">
          <a href={`/equipment-requests/${request.id}`}>
            <Eye className="mr-2 h-3 w-3" />
            View details
          </a>
        </DropdownMenuItem>
        {request.status === "PENDING" && (
          <>
            <DropdownMenuItem asChild className="text-xs">
              <a href={`/equipment-requests/${request.id}/edit`}>
                <Edit className="mr-2 h-3 w-3" />
                Edit
              </a>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DeleteEquipmentRequestDialog
              requestId={request.id}
              onDeleted={() => router.refresh()}
            >
              <DropdownMenuItem
                onSelect={(e) => e.preventDefault()}
                className="text-red-600 text-xs"
              >
                <Trash className="mr-2 h-3 w-3" />
                Delete
              </DropdownMenuItem>
            </DeleteEquipmentRequestDialog>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// Status badge colors
const statusColors: Record<EquipmentRequestStatus, string> = {
  PENDING: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
  APPROVED: "bg-green-100 text-green-800 hover:bg-green-100",
  REJECTED: "bg-red-100 text-red-800 hover:bg-red-100",
  ORDERED: "bg-blue-100 text-blue-800 hover:bg-blue-100",
  DELIVERED: "bg-gray-100 text-gray-800 hover:bg-gray-100",
  CANCELLED: "bg-gray-100 text-gray-600 hover:bg-gray-100",
}

// Priority badge colors
const priorityColors: Record<EquipmentRequestPriority, string> = {
  LOW: "bg-gray-100 text-gray-700 hover:bg-gray-100",
  MEDIUM: "bg-blue-100 text-blue-700 hover:bg-blue-100",
  HIGH: "bg-orange-100 text-orange-700 hover:bg-orange-100",
  URGENT: "bg-red-100 text-red-700 hover:bg-red-100",
}

export const columns: ColumnDef<EquipmentRequestListItem>[] = [
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
    accessorKey: "requestedBy",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="hover:bg-transparent p-0 font-semibold text-xs h-auto"
        >
          Requester
          <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      )
    },
    cell: ({ row }) => {
      return (
        <div className="flex flex-col gap-1 min-w-0">
          <span className="font-medium truncate text-xs">{row.original.requestedBy}</span>
          <span className="text-[10px] text-muted-foreground">
            {format(new Date(row.original.createdAt), "dd/MM/yyyy")}
          </span>
        </div>
      )
    },
    size: 140,
  },
  {
    accessorKey: "propertyName",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="hover:bg-transparent p-0 font-semibold text-xs h-auto"
        >
          House Name
          <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      )
    },
    cell: ({ row }) => {
      return (
        <div className="flex flex-col gap-1 min-w-0">
          <span className="font-medium truncate text-xs">{row.original.propertyName}</span>
          {row.original.roomName && (
            <span className="text-[10px] text-muted-foreground truncate">
              Room: {row.original.roomName}
            </span>
          )}
        </div>
      )
    },
    size: 160,
  },
  {
    accessorKey: "destinationName",
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
    meta: {
      className: "hidden lg:table-cell",
    },
    cell: ({ row }) => (
      <span className="text-xs text-muted-foreground truncate">
        {row.original.destinationName}
      </span>
    ),
    size: 120,
  },
  {
    accessorKey: "itemCount",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="hover:bg-transparent p-0 font-semibold text-xs h-auto"
        >
          Items
          <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      )
    },
    meta: {
      className: "hidden sm:table-cell",
    },
    cell: ({ row }) => {
      return (
        <div className="flex items-center gap-1">
          <Package className="h-2.5 w-2.5 text-muted-foreground" />
          <span className="text-xs">{row.original.itemCount}</span>
        </div>
      )
    },
    size: 70,
  },
  {
    accessorKey: "reason",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="hover:bg-transparent p-0 font-semibold text-xs h-auto"
        >
          Request
          <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      )
    },
    meta: {
      className: "hidden md:table-cell",
    },
    cell: ({ row }) => {
      const reason = row.original.reason
      if (!reason) {
        return <span className="text-[10px] text-muted-foreground">No reason provided</span>
      }
      
      const truncated = reason.length > 40 ? reason.substring(0, 40) + "..." : reason
      return (
        <span 
          className="text-xs text-muted-foreground cursor-help block truncate max-w-[200px]"
          title={reason}
        >
          {truncated}
        </span>
      )
    },
    size: 200,
  },
  {
    accessorKey: "priority",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="hover:bg-transparent p-0 font-semibold text-xs h-auto"
        >
          Priority
          <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const priority = row.original.priority
      return (
        <Badge variant="secondary" className={`${priorityColors[priority]} text-[10px] py-0 px-1.5 h-5`}>
          {priority}
        </Badge>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
    size: 80,
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
          State
          <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const status = row.original.status
      return (
        <Badge variant="secondary" className={`${statusColors[status]} text-[10px] py-0 px-1.5 h-5`}>
          {status.replace('_', ' ')}
        </Badge>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
    size: 90,
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => <ActionsCell request={row.original} />,
    enableSorting: false,
    enableHiding: false,
    size: 40,
  },
]