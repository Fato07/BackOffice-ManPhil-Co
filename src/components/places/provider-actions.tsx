"use client"

import { useState } from "react"
import { MoreHorizontal, Edit, MapPin, Trash, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { ActivityProviderListItem } from "@/types/activity-provider"
import { useDeleteProvider } from "@/hooks/use-activity-providers"
import { useRouter } from "next/navigation"

interface ProviderActionsProps {
  provider: ActivityProviderListItem
}

export function ProviderActions({ provider }: ProviderActionsProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const deleteProvider = useDeleteProvider()
  const router = useRouter()

  const handleEdit = () => {
    router.push(`/places/${provider.id}/edit`)
  }

  const handleViewOnMap = () => {
    if (provider.city && provider.country) {
      const location = `${provider.city}, ${provider.country}`
      const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`
      window.open(mapsUrl, '_blank')
    }
  }

  const handleDelete = async () => {
    try {
      await deleteProvider.mutateAsync(provider.id)
      setShowDeleteDialog(false)
    } catch (error) {
      // Error is handled by the mutation
    }
  }

  const handleWebsite = () => {
    if (provider.website) {
      const url = provider.website.startsWith('http') 
        ? provider.website 
        : `https://${provider.website}`
      window.open(url, '_blank')
    }
  }

  return (
    <>
      <div className="relative" data-no-row-click>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex h-8 w-8 p-0 data-[state=open]:bg-muted [&_svg]:pointer-events-auto"
              onClick={(e) => {
                e.stopPropagation()
              }}
            >
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[160px]">
          <DropdownMenuItem onClick={handleEdit}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
          
          {(provider.city || provider.country) && (
            <DropdownMenuItem onClick={handleViewOnMap}>
              <MapPin className="mr-2 h-4 w-4" />
              View on Map
            </DropdownMenuItem>
          )}
          
          {provider.website && (
            <DropdownMenuItem onClick={handleWebsite}>
              <ExternalLink className="mr-2 h-4 w-4" />
              Visit Website
            </DropdownMenuItem>
          )}
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem
            onClick={() => setShowDeleteDialog(true)}
            className="text-destructive focus:text-destructive"
          >
            <Trash className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              activity provider "{provider.name}" and remove all associated data.
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
    </>
  )
}