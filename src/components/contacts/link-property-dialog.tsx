"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Checkbox } from "@/components/ui/checkbox"
import { Skeleton } from "@/components/ui/skeleton"
import { useContact, useUpdateContact } from "@/hooks/use-contacts"
import { useProperties } from "@/hooks/use-properties"
import { PROPERTY_RELATIONSHIPS } from "@/types/contact"
import { ContactPropertyRelationship } from "@/generated/prisma"
import { toast } from "sonner"
import { 
  Search, 
  Home, 
  MapPin,
  X,
  Check,
  Loader2
} from "lucide-react"
import { cn } from "@/lib/utils"

const linkPropertiesSchema = z.object({
  properties: z.array(z.object({
    propertyId: z.string(),
    relationship: z.nativeEnum(ContactPropertyRelationship),
  })).min(1, "Select at least one property"),
})

type LinkPropertiesData = z.infer<typeof linkPropertiesSchema>

interface LinkPropertyDialogProps {
  contactId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function LinkPropertyDialog({ 
  contactId, 
  open, 
  onOpenChange 
}: LinkPropertyDialogProps) {
  const [search, setSearch] = useState("")
  const [selectedProperties, setSelectedProperties] = useState<Map<string, ContactPropertyRelationship>>(new Map())
  const { data: contact, isLoading: contactLoading } = useContact(contactId)
  const { data: propertiesData } = useProperties({ search }, 1, 100)
  const updateContact = useUpdateContact()

  // Initialize selected properties from existing links
  useEffect(() => {
    if (contact?.contactProperties) {
      const existingLinks = new Map(
        contact.contactProperties.map(cp => [cp.propertyId, cp.relationship])
      )
      setSelectedProperties(existingLinks)
    }
  }, [contact])

  const form = useForm<LinkPropertiesData>({
    resolver: zodResolver(linkPropertiesSchema),
    defaultValues: {
      properties: [],
    },
  })

  const handlePropertyToggle = (propertyId: string, checked: boolean) => {
    const newSelected = new Map(selectedProperties)
    if (checked) {
      newSelected.set(propertyId, ContactPropertyRelationship.OTHER)
    } else {
      newSelected.delete(propertyId)
    }
    setSelectedProperties(newSelected)
  }

  const handleRelationshipChange = (propertyId: string, relationship: ContactPropertyRelationship) => {
    const newSelected = new Map(selectedProperties)
    newSelected.set(propertyId, relationship)
    setSelectedProperties(newSelected)
  }

  const onSubmit = async () => {
    if (!contact) return

    const properties = Array.from(selectedProperties.entries()).map(([propertyId, relationship]) => ({
      propertyId,
      relationship,
    }))

    try {
      await updateContact.mutateAsync({
        id: contactId,
        contactProperties: properties,
      })
      toast.success("Properties linked successfully")
      onOpenChange(false)
    } catch (error) {
      toast.error("Failed to link properties")
    }
  }

  const isPropertyLinked = (propertyId: string) => {
    return contact?.contactProperties?.some(cp => cp.propertyId === propertyId) || false
  }

  const filteredProperties = propertiesData?.data || []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle>Link Properties</DialogTitle>
          <DialogDescription>
            {contact ? (
              <>Link properties to {contact.firstName} {contact.lastName}</>
            ) : (
              <>Loading contact information...</>
            )}
          </DialogDescription>
        </DialogHeader>

        {contactLoading ? (
          <div className="px-6 pb-6">
            <Skeleton className="h-10 w-full mb-4" />
            <Skeleton className="h-60 w-full" />
          </div>
        ) : (
          <>
            <div className="px-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search properties..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <ScrollArea className="max-h-[400px] px-6">
              <div className="space-y-2 py-4">
                {filteredProperties.length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground py-8">
                    No properties found
                  </p>
                ) : (
                  filteredProperties.map((property) => {
                    const isSelected = selectedProperties.has(property.id)
                    const wasLinked = isPropertyLinked(property.id)
                    const relationship = selectedProperties.get(property.id) || ContactPropertyRelationship.OTHER
                    
                    return (
                      <div
                        key={property.id}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-lg border transition-colors",
                          isSelected && "bg-muted/50 border-primary/50"
                        )}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) => 
                            handlePropertyToggle(property.id, checked as boolean)
                          }
                        />
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium truncate">
                              {property.name}
                            </p>
                            {wasLinked && (
                              <Badge variant="secondary" className="text-xs">
                                <Check className="h-3 w-3 mr-1" />
                                Linked
                              </Badge>
                            )}
                          </div>
                          {property.city && (
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {property.city}
                            </p>
                          )}
                        </div>

                        {isSelected && (
                          <Select
                            value={relationship}
                            onValueChange={(value) => 
                              handleRelationshipChange(property.id, value as ContactPropertyRelationship)
                            }
                          >
                            <SelectTrigger className="w-[140px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(PROPERTY_RELATIONSHIPS).map(([key, config]) => (
                                <SelectItem key={key} value={key}>
                                  <Badge 
                                    variant="outline" 
                                    className={cn("text-xs", config.color)}
                                  >
                                    {config.label}
                                  </Badge>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            </ScrollArea>

            <div className="px-6 pb-6 pt-4 border-t">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {selectedProperties.size} properties selected
                </p>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => onOpenChange(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={onSubmit}
                    disabled={selectedProperties.size === 0 || updateContact.isPending}
                    className="bg-[#1E3A3A] hover:bg-[#1E3A3A]/90"
                  >
                    {updateContact.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Save Links
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}