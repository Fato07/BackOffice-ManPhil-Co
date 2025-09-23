"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { ActivityProviderListItem } from "@/types/activity-provider"
import { useDeleteProvider, useUpdateProviderProperties, useActivityProvider } from "@/hooks/use-activity-providers"
import { ArrowUpDown, MapPin, Phone, Mail, Pencil, Trash2, Link } from "lucide-react"
import { PropertySelectorModal } from "@/components/places/property-selector-modal"
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

function PropertiesCell({ row }: { row: any }) {
  const [showPropertyModal, setShowPropertyModal] = useState(false)
  const updateProviderProperties = useUpdateProviderProperties()
  const { data: provider } = useActivityProvider(row.original.id)
  
  const count = row.original._count.properties
  
  const handleSaveProperties = async (selectedPropertyIds: string[]) => {
    await updateProviderProperties.mutateAsync({
      providerId: row.original.id,
      propertyIds: selectedPropertyIds
    })
  }
  
  return (
    <>
      <div
        className="flex items-center justify-center cursor-pointer hover:bg-muted/50 rounded p-1"
        onClick={() => setShowPropertyModal(true)}
        title="Click to manage linked properties"
      >
        <span className={`text-xs font-medium ${count > 0 ? 'text-primary' : 'text-muted-foreground'}`}>
          {count}
        </span>
        <Link className="h-2.5 w-2.5 ml-1 opacity-50" />
      </div>
      
      {provider && (
        <PropertySelectorModal
          open={showPropertyModal}
          onOpenChange={setShowPropertyModal}
          provider={provider}
          onSave={handleSaveProperties}
        />
      )}
    </>
  )
}

function ActionsCell({ row }: { row: any }) {
  const router = useRouter()
  const deleteProvider = useDeleteProvider()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  
  const handleEdit = () => {
    router.push(`/places/${row.original.id}/edit`)
  }
  
  const handleViewOnMap = () => {
    if (row.original.latitude && row.original.longitude) {
      const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${row.original.latitude},${row.original.longitude}`
      window.open(mapsUrl, '_blank')
    } else if (row.original.address) {
      const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(row.original.address)}`
      window.open(mapsUrl, '_blank')
    }
  }
  
  const handleDelete = async () => {
    try {
      await deleteProvider.mutateAsync(row.original.id)
      setShowDeleteDialog(false)
    } catch (error) {
      // Error is handled by the mutation
    }
  }
  
  return (
    <div className="flex items-center gap-0.5" data-no-row-click>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6"
        onClick={handleEdit}
        title="Edit provider"
      >
        <Pencil className="h-3 w-3" />
      </Button>
      
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6"
        onClick={handleViewOnMap}
        title="View on map"
      >
        <MapPin className="h-3 w-3" />
      </Button>
      
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 text-destructive hover:text-destructive"
        onClick={() => setShowDeleteDialog(true)}
        title="Delete provider"
      >
        <Trash2 className="h-3 w-3" />
      </Button>
      
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              activity provider "{row.original.name}" and remove all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteProvider.isPending}
            >
              {deleteProvider.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export const columns: ColumnDef<ActivityProviderListItem>[] = [
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
      const name = row.getValue("name") as string
      return (
        <div className="max-w-[150px]">
          <div className="font-medium truncate text-xs" title={name}>
            {name}
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "type",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="hover:bg-transparent p-0 font-semibold text-left text-xs h-auto"
        >
          Type
          <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const type = row.getValue("type") as string
      
      const typeColors: Record<string, string> = {
        'BAKERY': 'bg-orange-100 text-orange-800 border-orange-300',
        'PHARMACY': 'bg-blue-100 text-blue-800 border-blue-300',
        'RESTAURANTS': 'bg-green-100 text-green-800 border-green-300',
        'SUPERMARKET': 'bg-purple-100 text-purple-800 border-purple-300',
        'MEDICAL': 'bg-red-100 text-red-800 border-red-300',
        'TRANSPORT': 'bg-yellow-100 text-yellow-800 border-yellow-300',
        'ENTERTAINMENT': 'bg-pink-100 text-pink-800 border-pink-300',
        'SPORTS': 'bg-indigo-100 text-indigo-800 border-indigo-300',
        'OTHER': 'bg-gray-100 text-gray-800 border-gray-300'
      }
      
      const typeLabels: Record<string, string> = {
        'BAKERY': 'Bakery',
        'PHARMACY': 'Pharmacy',
        'RESTAURANTS': 'Restaurant',
        'SUPERMARKET': 'Supermarket',
        'MEDICAL': 'Medical',
        'TRANSPORT': 'Transport',
        'ENTERTAINMENT': 'Entertainment',
        'SPORTS': 'Sports',
        'OTHER': 'Other'
      }
      
      const colorClass = typeColors[type] || typeColors['OTHER']
      const label = typeLabels[type] || type
      
      return (
        <Badge variant="outline" className={`${colorClass} font-medium text-[10px] py-0 px-1.5 h-5`}>
          {label}
        </Badge>
      )
    },
  },
  {
    accessorKey: "address",
    header: "Address",
    cell: ({ row }) => {
      const address = row.getValue("address") as string
      
      return (
        <div className="max-w-[180px] flex items-center gap-0.5">
          {address ? (
            <>
              <MapPin className="h-2.5 w-2.5 text-muted-foreground flex-shrink-0" />
              <span className="text-xs text-muted-foreground truncate" title={address}>
                {address.length > 35 ? address.substring(0, 35) + '...' : address}
              </span>
            </>
          ) : (
            <span className="text-[10px] text-muted-foreground">No address</span>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: "contact",
    header: "Contact",
    cell: ({ row }) => {
      const phone = row.original.phone
      const email = row.original.email
      
      return (
        <div className="text-xs">
          {phone && email ? (
            // Both phone and email - show inline
            <div className="flex items-center gap-1 flex-wrap">
              <span className="flex items-center gap-0.5">
                <Phone className="h-2.5 w-2.5 text-muted-foreground" />
                <span className="truncate" title={phone}>{phone}</span>
              </span>
              <span className="text-muted-foreground">|</span>
              <span className="flex items-center gap-0.5">
                <Mail className="h-2.5 w-2.5 text-muted-foreground" />
                <span className="truncate" title={email}>
                  {email.length > 20 ? email.substring(0, 20) + '...' : email}
                </span>
              </span>
            </div>
          ) : phone ? (
            // Only phone
            <div className="flex items-center gap-0.5">
              <Phone className="h-2.5 w-2.5 text-muted-foreground" />
              <span className="truncate" title={phone}>
                {phone}
              </span>
            </div>
          ) : email ? (
            // Only email
            <div className="flex items-center gap-0.5">
              <Mail className="h-2.5 w-2.5 text-muted-foreground" />
              <span className="truncate" title={email}>
                {email.length > 25 ? email.substring(0, 25) + '...' : email}
              </span>
            </div>
          ) : (
            <span className="text-[10px] text-muted-foreground">No contact</span>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: "comments",
    header: "Comments",
    cell: ({ row }) => {
      const comments = row.getValue("comments") as string
      
      return (
        <div className="max-w-[150px]">
          {comments ? (
            <span className="text-xs text-muted-foreground" title={comments}>
              {comments.length > 40 ? comments.substring(0, 40) + '...' : comments}
            </span>
          ) : (
            <span className="text-[10px] text-muted-foreground">No comments</span>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: "_count.properties",
    header: "Properties",
    cell: ({ row }) => <PropertiesCell row={row} />,
  },
  {
    id: "actions",
    header: "Actions",
    enableHiding: false,
    cell: ({ row }) => <ActionsCell row={row} />,
  },
]