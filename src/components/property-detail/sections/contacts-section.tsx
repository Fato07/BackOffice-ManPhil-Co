"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { PropertySection } from "../property-section"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { usePermissions } from "@/hooks/use-permissions"
import { ProtectedSection } from "@/components/auth/protected-section"
import { Permission } from "@/types/auth"
import { PropertyWithRelations } from "@/types/property"
import { ContactType } from "@/generated/prisma"
import { toast } from "sonner"
import { Plus, Trash2, User, Building, Users, Wrench, AlertTriangle, Mail, Phone } from "lucide-react"

const contactSchema = z.object({
  contacts: z.array(z.object({
    id: z.string().optional(),
    type: z.nativeEnum(ContactType),
    name: z.string().min(1, "Name is required"),
    email: z.string().email().optional().or(z.literal("")).nullable(),
    phone: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
    isApproved: z.boolean().default(false),
  })).default([]),
})

type ContactData = z.infer<typeof contactSchema>

interface ContactsSectionProps {
  property: PropertyWithRelations
}

const contactTypeIcons = {
  [ContactType.OWNER]: User,
  [ContactType.AGENCY]: Building,
  [ContactType.STAFF]: Users,
  [ContactType.MAINTENANCE]: Wrench,
  [ContactType.EMERGENCY]: AlertTriangle,
}

const contactTypeLabels = {
  [ContactType.OWNER]: "Owner",
  [ContactType.AGENCY]: "Agency",
  [ContactType.STAFF]: "Staff",
  [ContactType.MAINTENANCE]: "Maintenance",
  [ContactType.EMERGENCY]: "Emergency",
}

export function ContactsSection({ property }: ContactsSectionProps) {
  const [isEditing, setIsEditing] = useState(false)
  const { hasPermission, canEditSection } = usePermissions()

  // Check if user has permission to view this section
  if (!hasPermission(Permission.CONTACTS_VIEW)) {
    return null;
  }

  const form = useForm<z.input<typeof contactSchema>>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      contacts: property.contacts?.map(contact => ({
        ...contact,
        email: contact.email ?? "",
        phone: contact.phone ?? "",
        notes: contact.notes ?? "",
      })) || [],
    },
  })

  const contacts = form.watch("contacts")

  const addContact = () => {
    const currentContacts = form.getValues("contacts") || []
    form.setValue("contacts", [
      ...currentContacts,
      {
        type: ContactType.OWNER,
        name: "",
        email: "",
        phone: "",
        notes: "",
        isApproved: false,
      }
    ])
  }

  const removeContact = (index: number) => {
    const currentContacts = form.getValues("contacts") || []
    form.setValue("contacts", currentContacts.filter((_, i) => i !== index))
  }

  const handleSave = async (data: z.input<typeof contactSchema>) => {
    try {
      // TODO: Implement save logic with API
      console.log("Saving contacts:", data)
      toast.success("Contacts updated successfully")
      setIsEditing(false)
    } catch (error) {
      toast.error("Failed to update contacts")
    }
  }

  const handleCancel = () => {
    form.reset({
      contacts: property.contacts || [],
    })
    setIsEditing(false)
  }

  // Group contacts by type
  const groupedContacts = (contacts || []).reduce((acc, contact, index) => {
    const type = contact.type
    if (!acc[type]) {
      acc[type] = []
    }
    acc[type].push({ ...contact, index })
    return acc
  }, {} as Record<ContactType, Array<{ 
    type: ContactType;
    name: string;
    id?: string;
    email?: string | null;
    phone?: string | null;
    notes?: string | null;
    isApproved?: boolean;
    index: number;
  }>>)

  return (
    <ProtectedSection permission={Permission.CONTACTS_VIEW}>
      <PropertySection
        title="Linked Contacts"
        isEditing={isEditing}
        onEdit={() => canEditSection('contacts') && setIsEditing(true)}
        onSave={form.handleSubmit(handleSave)}
        onCancel={handleCancel}
        showEditButton={canEditSection('contacts')}
        className="border-blue-200 bg-blue-50/30"
      >
        <div className="mb-4">
          <div className="flex items-center gap-2 p-3 bg-blue-100 rounded-lg border border-blue-300">
            <Users className="w-5 h-5 text-blue-600" />
            <p className="text-sm text-blue-800">
              Manage property contacts including owners, agencies, and service providers.
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {isEditing ? (
            <>
              {/* Edit Mode - List View */}
              <div className="space-y-3">
                {(contacts || []).map((contact, index) => {
                  const Icon = contactTypeIcons[contact.type]
                  return (
                    <Card key={index} className="p-4">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Icon className="h-5 w-5 text-gray-500" />
                            <Badge variant="outline">
                              {contactTypeLabels[contact.type]}
                            </Badge>
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="text-red-600"
                            onClick={() => removeContact(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Contact Type</Label>
                            <Select
                              value={contact.type}
                              onValueChange={(value) => 
                                form.setValue(`contacts.${index}.type`, value as ContactType)
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.entries(ContactType).map(([key, value]) => (
                                  <SelectItem key={value} value={value}>
                                    {contactTypeLabels[value]}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label>Name *</Label>
                            <Input
                              {...form.register(`contacts.${index}.name`)}
                              placeholder="Contact name"
                            />
                          </div>

                          <div>
                            <Label>Email</Label>
                            <Input
                              type="email"
                              {...form.register(`contacts.${index}.email`)}
                              placeholder="email@example.com"
                            />
                          </div>

                          <div>
                            <Label>Phone</Label>
                            <Input
                              {...form.register(`contacts.${index}.phone`)}
                              placeholder="+1 234 567 8900"
                            />
                          </div>

                          <div className="col-span-2">
                            <Label>Notes</Label>
                            <Textarea
                              {...form.register(`contacts.${index}.notes`)}
                              placeholder="Additional notes about this contact..."
                              rows={2}
                            />
                          </div>
                        </div>
                      </div>
                    </Card>
                  )
                })}
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={addContact}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Contact
              </Button>
            </>
          ) : (
            /* View Mode - Grouped by Type */
            Object.entries(groupedContacts).length > 0 ? (
              <div className="space-y-6">
                {Object.entries(groupedContacts).map(([type, typeContacts]) => {
                  const Icon = contactTypeIcons[type as ContactType]
                  return (
                    <div key={type}>
                      <div className="flex items-center gap-2 mb-3">
                        <Icon className="h-5 w-5 text-gray-600" />
                        <h3 className="font-semibold">
                          {contactTypeLabels[type as ContactType]}
                        </h3>
                        <Badge variant="secondary" className="ml-auto">
                          {typeContacts.length}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2">
                        {typeContacts.map((contact) => (
                          <Card key={contact.index} className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="space-y-1">
                                <p className="font-medium">{contact.name}</p>
                                {contact.email && (
                                  <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Mail className="h-3 w-3" />
                                    {contact.email}
                                  </div>
                                )}
                                {contact.phone && (
                                  <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Phone className="h-3 w-3" />
                                    {contact.phone}
                                  </div>
                                )}
                                {contact.notes && (
                                  <p className="text-sm text-gray-600 mt-2">
                                    {contact.notes}
                                  </p>
                                )}
                              </div>
                              {contact.isApproved && (
                                <Badge className="bg-green-100 text-green-800">
                                  Approved
                                </Badge>
                              )}
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No contacts added yet</p>
                {canEditSection('contacts') && (
                  <p className="text-sm mt-1">Click Edit to add contacts</p>
                )}
              </div>
            )
          )}
        </div>
      </PropertySection>
    </ProtectedSection>
  )
}