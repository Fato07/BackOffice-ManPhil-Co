"use client"

import { useState, useTransition, useOptimistic, useMemo, useCallback, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { PropertySection } from "../property-section"
import { Button } from "@/components/ui/button"
import { usePermissions } from "@/hooks/use-permissions"
import { ProtectedSection } from "@/components/auth/protected-section"
import { Permission } from "@/types/auth"
import { PropertyWithRelations } from "@/types/property"
import { ContactType } from "@/generated/prisma"
import { toast } from "sonner"
import { updatePropertyContacts } from "@/actions/property-contacts"
import { Plus, Users } from "lucide-react"
import { ContactsTable } from "./contacts/contacts-table"
import { ContactDetailsModal, type ContactFormData } from "./contacts/contact-details-modal"

const contactSchema = z.object({
  contacts: z.array(z.object({
    id: z.string().optional(),
    type: z.nativeEnum(ContactType),
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    name: z.string().optional(), // Legacy field
    email: z.string().nullish(),
    phone: z.string().nullish(),
    notes: z.string().nullish(),
    spokenLanguage: z.string().optional(),
    isContractSignatory: z.boolean().default(false),
    isApproved: z.boolean().default(false),
  })).default([]),
})

interface ContactsSectionProps {
  property: PropertyWithRelations
}


export function ContactsSection({ property }: ContactsSectionProps) {
  const [isPending, startTransition] = useTransition()
  const { canEditSection } = usePermissions()
  
  const [modalOpen, setModalOpen] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [modalMode, setModalMode] = useState<"create" | "edit">("create")
  
  const [optimisticContacts, setOptimisticContacts] = useOptimistic(
    property.contacts || [],
    (_, newContacts: typeof property.contacts) => newContacts || []
  )

  const form = useForm<z.input<typeof contactSchema>>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      contacts: optimisticContacts?.map(contact => {
        // Handle backward compatibility: split existing name if firstName/lastName don't exist
        const firstName = contact.firstName || contact.name?.split(' ')[0] || ""
        const lastName = contact.lastName || contact.name?.split(' ').slice(1).join(' ') || ""
        
        return {
          ...contact,
          firstName,
          lastName,
          name: contact.name || `${firstName} ${lastName}`.trim(),
          email: contact.email ?? "",
          phone: contact.phone ?? "",
          notes: contact.notes ?? "",
          spokenLanguage: contact.spokenLanguage ?? "English",
          isContractSignatory: contact.isContractSignatory ?? false,
        }
      }) || [],
    },
  })

  const [, setContacts] = useState(() => form.getValues("contacts") || [])

  const handleSave = useCallback(async () => {
    const contactsData = form.getValues("contacts") || []

    startTransition(async () => {
      // Cast contactsData to the proper type for optimistic update
      const optimisticData = contactsData.map(contact => ({
        ...contact,
        id: contact.id || 'temp-id',
        createdAt: new Date(),
        updatedAt: new Date(),
        propertyId: property.id,
        metadata: {},
        spokenLanguage: contact.spokenLanguage || "English",
        isContractSignatory: contact.isContractSignatory || false,
        isApproved: contact.isApproved || false,
      }))
      setOptimisticContacts(optimisticData as typeof property.contacts)
      
      try {
        const result = await updatePropertyContacts({
          propertyId: property.id,
          contacts: contactsData.map(contact => ({
            type: contact.type,
            firstName: contact.firstName,
            lastName: contact.lastName,
            email: contact.email || null,
            phone: contact.phone || null,
            notes: contact.notes || null,
            spokenLanguage: contact.spokenLanguage || "English",
            isContractSignatory: contact.isContractSignatory || false,
            isApproved: contact.isApproved || false,
          })),
        })

        if (!result.success) {
          throw new Error(result.error || 'Failed to update contacts')
        }

        toast.success("Contacts updated successfully")
      } catch (error) {
        setOptimisticContacts(property.contacts || [])
        form.reset({
          contacts: property.contacts?.map(contact => {
            const firstName = contact.firstName || contact.name?.split(' ')[0] || ""
            const lastName = contact.lastName || contact.name?.split(' ').slice(1).join(' ') || ""
            
            return {
              ...contact,
              firstName,
              lastName,
              name: contact.name || `${firstName} ${lastName}`.trim(),
              email: contact.email ?? "",
              phone: contact.phone ?? "",
              notes: contact.notes ?? "",
              spokenLanguage: contact.spokenLanguage ?? "English",
              isContractSignatory: contact.isContractSignatory ?? false,
            }
          }) || [],
        })
        
        toast.error(error instanceof Error ? error.message : "Failed to update contacts")
      }
    })
  }, [form, property.id, property.contacts, setOptimisticContacts, startTransition])

  const handleAddContact = useCallback(() => {
    setModalMode("create")
    setEditingIndex(null)
    setModalOpen(true)
  }, [])

  const handleEditContact = useCallback((index: number) => {
    setModalMode("edit")
    setEditingIndex(index)
    setModalOpen(true)
  }, [])

  const handleDeleteContact = useCallback((index: number) => {
    const currentContacts = form.getValues("contacts") || []
    const updatedContacts = currentContacts.filter((_, i) => i !== index)
    form.setValue("contacts", updatedContacts)
    setContacts(updatedContacts)
    handleSave()
  }, [form, handleSave])

  const handleModalSave = useCallback((data: ContactFormData) => {
    const currentContacts = form.getValues("contacts") || []
    let updatedContacts: typeof currentContacts
    
    if (modalMode === "create") {
      updatedContacts = [
        ...currentContacts,
        {
          type: data.type,
          firstName: data.firstName,
          lastName: data.lastName,
          name: `${data.firstName} ${data.lastName}`.trim(),
          email: data.email || "",
          phone: data.phone || "",
          notes: data.notes || "",
          spokenLanguage: data.spokenLanguage || "English",
          isContractSignatory: data.isContractSignatory || false,
          isApproved: data.isApproved,
        }
      ]
    } else if (modalMode === "edit" && editingIndex !== null) {
      updatedContacts = [...currentContacts]
      updatedContacts[editingIndex] = {
        ...updatedContacts[editingIndex],
        type: data.type,
        firstName: data.firstName,
        lastName: data.lastName,
        name: `${data.firstName} ${data.lastName}`.trim(),
        email: data.email || "",
        phone: data.phone || "",
        notes: data.notes || "",
        spokenLanguage: data.spokenLanguage || "English",
        isContractSignatory: data.isContractSignatory || false,
        isApproved: data.isApproved,
      }
    } else {
      updatedContacts = currentContacts
    }
    
    form.setValue("contacts", updatedContacts)
    setContacts(updatedContacts)
    
    setModalOpen(false)
    setEditingIndex(null)
    
    handleSave()
  }, [modalMode, editingIndex, form, handleSave])

  const handleModalClose = useCallback(() => {
    setModalOpen(false)
    setEditingIndex(null)
  }, [])

  const getModalInitialData = useCallback((): Partial<ContactFormData> | undefined => {
    if (modalMode === "edit" && editingIndex !== null) {
      const currentContacts = form.getValues("contacts") || []
      const contact = currentContacts[editingIndex]
      if (contact) {
        return {
          type: contact.type,
          firstName: contact.firstName,
          lastName: contact.lastName,
          email: contact.email || "",
          phone: contact.phone || "",
          notes: contact.notes || "",
          spokenLanguage: contact.spokenLanguage || "English",
          isContractSignatory: contact.isContractSignatory || false,
          isApproved: contact.isApproved || false,
        }
      }
    }
    return undefined
  }, [modalMode, editingIndex, form])

  // Watch form data for reactive updates
  const watchedContacts = form.watch("contacts")
  
  const tableData = useMemo(() => {
    return (watchedContacts || []).map((contact, index) => ({
      ...contact,
      index,
      isApproved: contact.isApproved || false,
    }))
  }, [watchedContacts])

  // Update local contacts state when form changes
  useEffect(() => {
    setContacts(watchedContacts || [])
  }, [watchedContacts])

  return (
    <ProtectedSection permission={Permission.CONTACTS_VIEW}>
      <PropertySection
        title="Linked Contacts"
        isEditing={false}
        showEditButton={false}
        className="border-blue-200 bg-blue-50/30"
        onEdit={() => {}}
        onSave={() => {}}
        onCancel={() => {}}
      >
        <div className="mb-4">
          <div className="flex items-center gap-2 p-3 bg-blue-100 rounded-lg border border-blue-300">
            <Users className="w-5 h-5 text-blue-600" />
            <p className="text-sm text-blue-800">
              Manage property contacts including owners, agencies, and service providers.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {canEditSection('contacts') && (
            <div className="flex justify-end">
              <Button
                onClick={handleAddContact}
                size="sm"
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Contact
              </Button>
            </div>
          )}
          
          <ContactsTable
            contacts={tableData}
            isEditing={canEditSection('contacts')}
            onEdit={handleEditContact}
            onDelete={handleDeleteContact}
          />
        </div>
      </PropertySection>
      
      <ContactDetailsModal
        key={`${modalMode}-${editingIndex}`}
        open={modalOpen}
        onClose={handleModalClose}
        onSave={handleModalSave}
        initialData={getModalInitialData()}
        mode={modalMode}
        isLoading={isPending}
      />
    </ProtectedSection>
  )
}