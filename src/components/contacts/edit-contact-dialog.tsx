"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Plus, X } from "lucide-react"
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
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Skeleton } from "@/components/ui/skeleton"
import { updateContactSchema, type UpdateContactData } from "@/lib/validations/contact"
import { useContact, useUpdateContact } from "@/hooks/use-contacts"
import { useProperties } from "@/hooks/use-properties"
import { CONTACT_CATEGORIES, PROPERTY_RELATIONSHIPS, LANGUAGES } from "@/types/contact"
import { GlobalContactCategory, ContactPropertyRelationship } from "@/generated/prisma"
import { cn } from "@/lib/utils"

interface EditContactDialogProps {
  contactId: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function EditContactDialog({ contactId, open: controlledOpen, onOpenChange }: EditContactDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const open = controlledOpen ?? internalOpen
  const setOpen = onOpenChange ?? setInternalOpen
  const [propertySearchOpen, setPropertySearchOpen] = useState(false)
  const [propertySearch, setPropertySearch] = useState("")
  const { data: contact, isLoading: contactLoading } = useContact(contactId)
  const updateContact = useUpdateContact()
  const { data: propertiesData } = useProperties({ search: propertySearch }, 1, 50)

  const form = useForm<UpdateContactData>({
    resolver: zodResolver(updateContactSchema),
    defaultValues: {
      id: contactId,
      firstName: "",
      lastName: "",
      phone: "",
      email: "",
      language: "English",
      category: GlobalContactCategory.CLIENT,
      comments: "",
      contactProperties: [],
    },
  })

  // Update form when contact data is loaded
  useEffect(() => {
    if (contact) {
      form.reset({
        id: contact.id,
        firstName: contact.firstName,
        lastName: contact.lastName,
        phone: contact.phone || "",
        email: contact.email || "",
        language: contact.language,
        category: contact.category,
        comments: contact.comments || "",
        contactProperties: contact.contactProperties?.map(cp => ({
          propertyId: cp.propertyId,
          relationship: cp.relationship,
        })) || [],
      })
    }
  }, [contact, form])

  const contactProperties = form.watch("contactProperties") || []

  const onSubmit = async (data: UpdateContactData) => {
    updateContact.mutate(data, {
      onSuccess: () => {
        setOpen(false)
      },
    })
  }

  const addPropertyLink = (propertyId: string, propertyName: string) => {
    const currentLinks = form.getValues("contactProperties") || []
    if (!currentLinks.some(link => link.propertyId === propertyId)) {
      form.setValue("contactProperties", [
        ...currentLinks,
        {
          propertyId,
          relationship: ContactPropertyRelationship.OTHER,
        }
      ])
    }
    setPropertySearchOpen(false)
    setPropertySearch("")
  }

  const removePropertyLink = (propertyId: string) => {
    const currentLinks = form.getValues("contactProperties") || []
    form.setValue(
      "contactProperties",
      currentLinks.filter(link => link.propertyId !== propertyId)
    )
  }

  const updatePropertyRelationship = (propertyId: string, relationship: ContactPropertyRelationship) => {
    const currentLinks = form.getValues("contactProperties") || []
    form.setValue(
      "contactProperties",
      currentLinks.map(link =>
        link.propertyId === propertyId
          ? { ...link, relationship }
          : link
      )
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Contact</DialogTitle>
          <DialogDescription>
            Update the contact information below.
          </DialogDescription>
        </DialogHeader>
        {contactLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="John" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input 
                          type="email" 
                          placeholder="john.doe@example.com" 
                          {...field} 
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="+1 234 567 8900" 
                          {...field} 
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(CONTACT_CATEGORIES).map(([key, config]) => (
                            <SelectItem key={key} value={key}>
                              {config.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="language"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Language *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a language" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {LANGUAGES.map((language) => (
                            <SelectItem key={language} value={language}>
                              {language}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="comments"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Comments</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Additional notes about this contact..."
                        className="resize-none"
                        rows={3}
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <FormLabel>Linked Properties</FormLabel>
                  <Popover open={propertySearchOpen} onOpenChange={setPropertySearchOpen}>
                    <PopoverTrigger asChild>
                      <Button type="button" variant="outline" size="sm">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Property
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-0" align="end">
                      <Command>
                        <CommandInput 
                          placeholder="Search properties..." 
                          value={propertySearch}
                          onValueChange={setPropertySearch}
                        />
                        <CommandEmpty>No properties found.</CommandEmpty>
                        <CommandGroup className="max-h-64 overflow-y-auto">
                          {propertiesData?.data.map((property) => (
                            <CommandItem
                              key={property.id}
                              onSelect={() => addPropertyLink(property.id, property.name)}
                            >
                              {property.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                {contactProperties.length > 0 && (
                  <div className="space-y-2">
                    {contactProperties.map((link) => {
                      const property = propertiesData?.data.find(p => p.id === link.propertyId) || 
                                       contact?.contactProperties?.find(cp => cp.propertyId === link.propertyId)?.property
                      return (
                        <div key={link.propertyId} className="flex items-center gap-2 p-2 border rounded-lg">
                          <div className="flex-1">
                            <span className="font-medium">
                              {property?.name || "Unknown Property"}
                            </span>
                          </div>
                          <Select
                            value={link.relationship}
                            onValueChange={(value) => updatePropertyRelationship(link.propertyId, value as ContactPropertyRelationship)}
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
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removePropertyLink(link.propertyId)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-4">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="bg-[#1E3A3A] hover:bg-[#1E3A3A]/90"
                  disabled={updateContact.isPending}
                >
                  {updateContact.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  )
}