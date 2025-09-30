"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Edit, Trash2, MoreHorizontal, Eye, EyeOff } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
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
import { PropertyListItem } from "@/types/property"
import { useDeleteProperty, useTogglePropertyStatus } from "@/hooks/use-properties"

interface HouseActionsProps {
  property: PropertyListItem
}

export function HouseActions({ property }: HouseActionsProps) {
  const router = useRouter()
  const [showDeleteAlert, setShowDeleteAlert] = useState(false)
  const deleteProperty = useDeleteProperty()
  const toggleStatus = useTogglePropertyStatus(property.id)

  const handleEdit = () => {
    router.push(`/houses/${property.id}`)
  }

  const handleDelete = () => {
    deleteProperty.mutate(property.id, {
      onSuccess: () => {
        setShowDeleteAlert(false)
      },
    })
  }

  const handleToggleStatus = () => {
    toggleStatus.mutate(property.status)
  }

  return (
    <>
      <div className="relative" data-no-row-click>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              className="h-6 w-6 p-0 [&_svg]:pointer-events-auto"
              onClick={(e) => {
                e.stopPropagation()
              }}
            >
              <span className="sr-only">Open menu</span>
              <Edit className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[160px]">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem onClick={handleEdit}>
            <Edit className="mr-2 h-3 w-3" />
            Edit property
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleToggleStatus}>
            {property.status === "PUBLISHED" ? (
              <>
                <EyeOff className="mr-2 h-3 w-3" />
                Hide property
              </>
            ) : (
              <>
                <Eye className="mr-2 h-3 w-3" />
                Publish property
              </>
            )}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setShowDeleteAlert(true)}
            className="text-red-600"
          >
            <Trash2 className="mr-2 h-3 w-3" />
            Delete property
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      </div>

      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              property "{property.name}" and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteProperty.isPending}
            >
              {deleteProperty.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}