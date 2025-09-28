"use client"

import { useState, useTransition, useOptimistic } from "react"
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
import { updatePropertyContacts } from "@/actions/property-contacts"
import { Plus, Trash2, User, Building, Users, Wrench, AlertTriangle, Mail, Phone, Loader2, UserCheck, CheckCircle, Shield, FileSignature, Home, Trees, Waves, UserPlus } from "lucide-react"

const contactSchema = z.object({
  contacts: z.array(z.object({
    id: z.string().optional(),
    type: z.nativeEnum(ContactType).describe("Please select a valid contact type"),
    name: z.string().min(1, "Name is required").max(255, "Name too long"),
    email: z.string().email({ message: "Please enter a valid email address" }).nullish(),
    phone: z.string().max(50, "Phone number too long").nullish(),
    notes: z.string().max(1000, "Notes too long").nullish(),
    isApproved: z.boolean().default(false),
  })).default([]),
})

type ContactData = z.infer<typeof contactSchema>

interface ContactsSectionProps {
  property: PropertyWithRelations
}

const contactTypeIcons = {
  [ContactType.OWNER]: User,
  [ContactType.MANAGER]: UserCheck,
  [ContactType.AGENCY]: Building,
  [ContactType.STAFF]: Users,
  [ContactType.MAINTENANCE]: Wrench,
  [ContactType.EMERGENCY]: AlertTriangle,
  [ContactType.CHECK_IN_MANAGER]: CheckCircle,
  [ContactType.SECURITY_DEPOSIT_MANAGER]: Shield,
  [ContactType.SIGNATORY]: FileSignature,
  [ContactType.HOUSEKEEPING]: Home,
  [ContactType.GARDENING]: Trees,
  [ContactType.POOL_MAINTENANCE]: Waves,
  [ContactType.CHECK_IN_STAFF]: UserPlus,
}

const contactTypeLabels = {
  [ContactType.OWNER]: "Owner",
  [ContactType.MANAGER]: "Manager",
  [ContactType.AGENCY]: "Agency",
  [ContactType.STAFF]: "Staff",
  [ContactType.MAINTENANCE]: "Maintenance",
  [ContactType.EMERGENCY]: "Emergency",
  [ContactType.CHECK_IN_MANAGER]: "Check-in Manager",
  [ContactType.SECURITY_DEPOSIT_MANAGER]: "Security Deposit Manager",
  [ContactType.SIGNATORY]: "Signatory",
  [ContactType.HOUSEKEEPING]: "Housekeeping",
  [ContactType.GARDENING]: "Gardening",
  [ContactType.POOL_MAINTENANCE]: "Pool Maintenance",
  [ContactType.CHECK_IN_STAFF]: "Check-in Staff",
}

export function ContactsSection({ property }: ContactsSectionProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isPending, startTransition] = useTransition()
  const { hasPermission, canEditSection } = usePermissions()
  
  // Optimistic state for contacts
  const [optimisticContacts, setOptimisticContacts] = useOptimistic(
    property.contacts || [],
    (_, newContacts: any[]) => newContacts
  )

  // Check if user has permission to view this section
  if (!hasPermission(Permission.CONTACTS_VIEW)) {
    return null;
  }

  const form = useForm<z.input<typeof contactSchema>>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      contacts: optimisticContacts?.map(contact => ({
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
    // Optimistically update the UI
    setOptimisticContacts(data.contacts || [])
    setIsEditing(false)

    startTransition(async () => {
      try {
        const result = await updatePropertyContacts({
          propertyId: property.id,
          contacts: (data.contacts || []).map(contact => ({
            type: contact.type,
            name: contact.name,
            email: contact.email || null,
            phone: contact.phone || null,
            notes: contact.notes || null,
            isApproved: contact.isApproved || false,
          })),
        })

        if (!result.success) {
          throw new Error(result.error || 'Failed to update contacts')
        }

        toast.success("Contacts updated successfully")
      } catch (error) {
        // Revert optimistic update on error
        setOptimisticContacts(property.contacts || [])
        form.reset({
          contacts: property.contacts?.map(contact => ({
            ...contact,
            email: contact.email ?? "",
            phone: contact.phone ?? "",
            notes: contact.notes ?? "",
          })) || [],
        })
        setIsEditing(true)
        
        toast.error(error instanceof Error ? error.message : "Failed to update contacts")
      }
    })
  }

  const handleCancel = () => {
    form.reset({
      contacts: optimisticContacts?.map(contact => ({
        ...contact,
        email: contact.email ?? "",
        phone: contact.phone ?? "",
        notes: contact.notes ?? "",
      })) || [],
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
        isSaving={isPending}
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