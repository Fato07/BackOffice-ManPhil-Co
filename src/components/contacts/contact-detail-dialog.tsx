"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useContact } from "@/hooks/use-contacts"
import { CONTACT_CATEGORIES, PROPERTY_RELATIONSHIPS } from "@/types/contact"
import { formatDistanceToNow } from "date-fns"
import { 
  Mail, 
  Phone, 
  Globe,
  Calendar,
  Home,
  Edit,
  Link,
  ExternalLink,
  User,
  Building,
  Users,
  Archive
} from "lucide-react"
import { EditContactDialog } from "./edit-contact-dialog"
import { LinkPropertyDialog } from "./link-property-dialog"

interface ContactDetailDialogProps {
  contactId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ContactDetailDialog({ 
  contactId, 
  open, 
  onOpenChange 
}: ContactDetailDialogProps) {
  const router = useRouter()
  const { data: contact, isLoading } = useContact(contactId)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showLinkDialog, setShowLinkDialog] = useState(false)

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'CLIENT':
        return <User className="h-4 w-4" />
      case 'OWNER':
        return <Home className="h-4 w-4" />
      case 'PROVIDER':
        return <Users className="h-4 w-4" />
      case 'ORGANIZATION':
        return <Building className="h-4 w-4" />
      default:
        return <Archive className="h-4 w-4" />
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] p-0">
          <DialogHeader className="px-6 pt-6">
            <DialogTitle className="text-xl">Contact Details</DialogTitle>
            <DialogDescription>
              View and manage contact information
            </DialogDescription>
          </DialogHeader>

          {isLoading ? (
            <div className="px-6 pb-6 space-y-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-60 w-full" />
            </div>
          ) : contact ? (
            <ScrollArea className="max-h-[calc(90vh-120px)]">
              <div className="px-6 pb-6 space-y-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-2xl font-semibold">
                      {contact.firstName} {contact.lastName}
                    </h3>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="secondary" className={CONTACT_CATEGORIES[contact.category].color}>
                        {getCategoryIcon(contact.category)}
                        <span className="ml-1">{CONTACT_CATEGORIES[contact.category].label}</span>
                      </Badge>
                      <Badge variant="outline">
                        <Globe className="h-3 w-3 mr-1" />
                        {contact.language}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowEditDialog(true)}
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowLinkDialog(true)}
                    >
                      <Link className="h-3 w-3 mr-1" />
                      Link Property
                    </Button>
                  </div>
                </div>

                <Separator />

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Contact Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {contact.email && (
                      <div className="flex items-center gap-3 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <a 
                          href={`mailto:${contact.email}`}
                          className="hover:underline"
                        >
                          {contact.email}
                        </a>
                      </div>
                    )}
                    {contact.phone && (
                      <div className="flex items-center gap-3 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <a 
                          href={`tel:${contact.phone}`}
                          className="hover:underline"
                        >
                          {contact.phone}
                        </a>
                      </div>
                    )}
                    <div className="flex items-center gap-3 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        Created {formatDistanceToNow(new Date(contact.createdAt))} ago
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {contact.comments && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Notes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {contact.comments}
                      </p>
                    </CardContent>
                  </Card>
                )}

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-sm">
                      Linked Properties ({contact.contactProperties?.length || 0})
                    </CardTitle>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowLinkDialog(true)}
                    >
                      <Link className="h-3 w-3 mr-1" />
                      Add
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {contact.contactProperties && contact.contactProperties.length > 0 ? (
                      <div className="space-y-2">
                        {contact.contactProperties.map((link) => {
                          const relationshipConfig = PROPERTY_RELATIONSHIPS[link.relationship]
                          return (
                            <div 
                              key={link.id} 
                              className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <Home className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <p className="font-medium text-sm">
                                    {link.property?.name || 'Unnamed Property'}
                                  </p>
                                  <Badge 
                                    variant="outline" 
                                    className={`${relationshipConfig.color} text-xs mt-1`}
                                  >
                                    {relationshipConfig.label}
                                  </Badge>
                                </div>
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  router.push(`/houses/${link.propertyId}`)
                                  onOpenChange(false)
                                }}
                              >
                                <ExternalLink className="h-3 w-3" />
                              </Button>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground text-sm">
                        <Home className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No properties linked</p>
                        <Button
                          size="sm"
                          variant="link"
                          onClick={() => setShowLinkDialog(true)}
                          className="mt-2"
                        >
                          Link a property
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>
          ) : (
            <div className="px-6 pb-6">
              <p className="text-center text-muted-foreground">Contact not found</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {showEditDialog && contact && (
        <EditContactDialog
          contactId={contactId}
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
        />
      )}

      {showLinkDialog && (
        <LinkPropertyDialog
          contactId={contactId}
          open={showLinkDialog}
          onOpenChange={setShowLinkDialog}
        />
      )}
    </>
  )
}