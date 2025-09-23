"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
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
import { Button } from "@/components/ui/button"
import { useDeleteContact } from "@/hooks/use-contacts"
import { usePermissions } from "@/hooks/use-permissions"
import { ContactListItem } from "@/types/contact"
import { 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Eye, 
  Home, 
  Link,
  Loader2 
} from "lucide-react"
import { toast } from "sonner"

interface ContactActionsProps {
  contact: ContactListItem
  onEdit?: (contact: ContactListItem) => void
  onView?: (contact: ContactListItem) => void
  onLinkProperty?: (contact: ContactListItem) => void
}

export function ContactActions({ 
  contact, 
  onEdit, 
  onView, 
  onLinkProperty 
}: ContactActionsProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const router = useRouter()
  const { canEditSection } = usePermissions()
  const deleteContactMutation = useDeleteContact()

  const canEdit = canEditSection('contacts')
  const canDelete = canEditSection('contacts')

  const handleEdit = () => {
    if (onEdit) {
      onEdit(contact)
    }
  }

  const handleView = () => {
    if (onView) {
      onView(contact)
    }
  }

  const handleLinkProperty = () => {
    if (onLinkProperty) {
      onLinkProperty(contact)
    }
  }

  const handleDelete = async () => {
    try {
      await deleteContactMutation.mutateAsync(contact.id)
      setShowDeleteDialog(false)
    } catch (error) {
      // Error handling is done in the mutation
      console.error('Delete failed:', error)
    }
  }

  const handleCopyEmail = () => {
    if (contact.email) {
      navigator.clipboard.writeText(contact.email)
      toast.success("Email copied to clipboard")
    }
  }

  const handleCopyPhone = () => {
    if (contact.phone) {
      navigator.clipboard.writeText(contact.phone)
      toast.success("Phone number copied to clipboard")
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="h-6 w-6 p-0"
            disabled={deleteContactMutation.isPending}
          >
            <span className="sr-only">Open menu</span>
            {deleteContactMutation.isPending ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <MoreHorizontal className="h-3 w-3" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[200px]">
          <DropdownMenuItem onClick={handleView}>
            <Eye className="mr-2 h-3 w-3" />
            View Details
          </DropdownMenuItem>
          
          {canEdit && (
            <DropdownMenuItem onClick={handleEdit}>
              <Edit className="mr-2 h-3 w-3" />
              Edit Contact
            </DropdownMenuItem>
          )}
          
          {canEdit && (
            <DropdownMenuItem onClick={handleLinkProperty}>
              <Link className="mr-2 h-3 w-3" />
              Link to Property
            </DropdownMenuItem>
          )}
          
          <DropdownMenuSeparator />
          
          {contact.email && (
            <DropdownMenuItem onClick={handleCopyEmail}>
              <Eye className="mr-2 h-4 w-4" />
              Copy Email
            </DropdownMenuItem>
          )}
          
          {contact.phone && (
            <DropdownMenuItem onClick={handleCopyPhone}>
              <Eye className="mr-2 h-4 w-4" />
              Copy Phone
            </DropdownMenuItem>
          )}
          
          {contact.contactProperties && contact.contactProperties.length > 0 && (
            <>
              <DropdownMenuSeparator />
              {contact.contactProperties.map((property) => (
                <DropdownMenuItem 
                  key={property.propertyId}
                  onClick={() => router.push(`/houses/${property.propertyId}`)}
                >
                  <Home className="mr-2 h-3 w-3" />
                  {property.propertyName}
                </DropdownMenuItem>
              ))}
            </>
          )}
          
          {canDelete && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => setShowDeleteDialog(true)}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="mr-2 h-3 w-3" />
                Delete Contact
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Contact</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{contact.firstName} {contact.lastName}</strong>? 
              This action cannot be undone.
              {contact.contactProperties && contact.contactProperties.length > 0 && (
                <>
                  <br /><br />
                  <strong>Warning:</strong> This contact is linked to {contact.contactProperties.length} property(ies). 
                  These relationships will also be removed.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteContactMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              disabled={deleteContactMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteContactMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-3 w-3" />
                  Delete Contact
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}