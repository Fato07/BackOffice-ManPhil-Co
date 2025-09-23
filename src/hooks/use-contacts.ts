'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { 
  getContacts,
  getContact,
  createContact,
  updateContact,
  deleteContact,
  bulkDeleteContacts,
  searchContacts,
  linkContactToProperty,
  unlinkContactFromProperty
} from '@/actions/contacts'
import type { 
  ContactsResponse,
  ContactDetail,
  ContactListItem
} from '@/types/contact'
import type {
  ContactFilters,
  CreateContactData,
  UpdateContactData,
  BulkDeleteContactsData,
  ContactSearchData,
  LinkContactToPropertyData,
  UnlinkContactFromPropertyData
} from '@/lib/validations/contact'

// Contacts list hook with pagination and filtering
export function useContacts({
  filters = {},
  page = 1,
  pageSize = 10,
}: {
  filters?: ContactFilters
  page?: number
  pageSize?: number
} = {}) {
  return useQuery({
    queryKey: ['contacts', { filters, page, pageSize }],
    queryFn: async (): Promise<ContactsResponse> => {
      const result = await getContacts({ filters, page, pageSize })
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch contacts')
      }
      if (!result.data) {
        throw new Error('No data returned')
      }
      return {
        data: result.data.contacts.map((contact: any) => ({
          ...contact,
          contactProperties: contact.contactProperties.map((cp: any) => ({
            id: cp.id,
            propertyId: cp.property.id,
            propertyName: cp.property.name || 'Unnamed Property',
            relationship: cp.relationship
          }))
        })),
        totalCount: result.data.totalCount,
        pageCount: result.data.pageCount
      }
    },
    staleTime: 1000 * 60, // 1 minute
    retry: 1,
  })
}

// Single contact hook
export function useContact(contactId: string) {
  return useQuery({
    queryKey: ['contact', contactId],
    queryFn: async (): Promise<ContactDetail> => {
      const result = await getContact(contactId)
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch contact')
      }
      return result.data
    },
    enabled: !!contactId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
  })
}

// Contact search hook for autocomplete/dropdowns
export function useContactSearch(searchData: ContactSearchData) {
  return useQuery({
    queryKey: ['contacts-search', searchData],
    queryFn: async (): Promise<ContactListItem[]> => {
      const result = await searchContacts(searchData)
      if (!result.success) {
        throw new Error(result.error || 'Failed to search contacts')
      }
      return result.data || []
    },
    enabled: !!searchData.query && searchData.query.length >= 2,
    staleTime: 1000 * 30, // 30 seconds
    retry: 1,
  })
}

// Create contact mutation
export function useCreateContact() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateContactData) => {
      const result = await createContact(data)
      if (!result.success) {
        throw new Error(result.error || 'Failed to create contact')
      }
      return result.data
    },
    onSuccess: (data) => {
      // Invalidate contacts lists
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
      // Set the new contact in cache
      if (data?.contact) {
        queryClient.setQueryData(['contact', data.contact.id], data.contact)
      }
      toast.success('Contact created successfully')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create contact')
    },
  })
}

// Update contact mutation
export function useUpdateContact() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: UpdateContactData) => {
      const result = await updateContact(data)
      if (!result.success) {
        throw new Error(result.error || 'Failed to update contact')
      }
      return result.data
    },
    onSuccess: (data) => {
      // Invalidate contacts lists
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
      // Update the contact in cache
      if (data?.contact) {
        queryClient.setQueryData(['contact', data.contact.id], data.contact)
      }
      toast.success('Contact updated successfully')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update contact')
    },
  })
}

// Delete contact mutation
export function useDeleteContact() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (contactId: string) => {
      const result = await deleteContact(contactId)
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete contact')
      }
      return result.data
    },
    onSuccess: (_, contactId) => {
      // Invalidate contacts lists
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
      // Remove the contact from cache
      queryClient.removeQueries({ queryKey: ['contact', contactId] })
      toast.success('Contact deleted successfully')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete contact')
    },
  })
}

// Bulk delete contacts mutation
export function useBulkDeleteContacts() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: BulkDeleteContactsData) => {
      const result = await bulkDeleteContacts(data)
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete contacts')
      }
      return result.data
    },
    onSuccess: (data, variables) => {
      // Invalidate contacts lists
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
      // Remove deleted contacts from cache
      variables.contactIds.forEach(id => {
        queryClient.removeQueries({ queryKey: ['contact', id] })
      })
      toast.success(`Successfully deleted ${data?.deletedCount || 0} contacts`)
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete contacts')
    },
  })
}

// Link contact to property mutation
export function useLinkContactToProperty() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: LinkContactToPropertyData) => {
      const result = await linkContactToProperty(data)
      if (!result.success) {
        throw new Error(result.error || 'Failed to link contact to property')
      }
      return result.data
    },
    onSuccess: (_, variables) => {
      // Invalidate contacts lists and specific contact
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
      queryClient.invalidateQueries({ queryKey: ['contact', variables.contactId] })
      // Also invalidate property-related queries if they exist
      queryClient.invalidateQueries({ queryKey: ['property-contacts', variables.propertyId] })
      toast.success('Contact linked to property successfully')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to link contact to property')
    },
  })
}

// Unlink contact from property mutation
export function useUnlinkContactFromProperty() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: UnlinkContactFromPropertyData) => {
      const result = await unlinkContactFromProperty(data)
      if (!result.success) {
        throw new Error(result.error || 'Failed to unlink contact from property')
      }
      return result.data
    },
    onSuccess: (_, variables) => {
      // Invalidate contacts lists and specific contact
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
      queryClient.invalidateQueries({ queryKey: ['contact', variables.contactId] })
      // Also invalidate property-related queries if they exist
      queryClient.invalidateQueries({ queryKey: ['property-contacts', variables.propertyId] })
      toast.success('Contact unlinked from property successfully')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to unlink contact from property')
    },
  })
}

// Export contacts mutation
export function useExportContacts() {
  return useMutation({
    mutationFn: async (data: { format: string; contactIds?: string[]; filters?: any }) => {
      // Build query parameters
      const params = new URLSearchParams({
        format: data.format || "csv",
      })
      
      if (data.contactIds && data.contactIds.length > 0) {
        params.append("ids", data.contactIds.join(","))
      } else if (data.filters) {
        // Apply filters
        if (data.filters.search) {
          params.append("search", data.filters.search)
        }
        if (data.filters.category && data.filters.category !== "ALL") {
          params.append("category", data.filters.category)
        }
        if (data.filters.hasLinkedProperties) {
          params.append("hasLinkedProperties", "true")
        }
      }
      
      const response = await fetch(`/api/contacts/export?${params}`, {
        method: "GET",
      })
      
      if (!response.ok) {
        throw new Error("Failed to export contacts")
      }
      
      const contentDisposition = response.headers.get("Content-Disposition")
      const filename = contentDisposition
        ?.split("filename=")[1]
        ?.replace(/"/g, "") || `contacts-export.${data.format}`
      
      const blob = await response.blob()
      
      // Create download link
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      return { success: true }
    },
    onSuccess: () => {
      toast.success("Contacts exported successfully")
    },
    onError: (error) => {
      toast.error("Failed to export contacts")
    },
  })
}

// Optimistic updates hook for better UX
export function useOptimisticContactUpdate() {
  const queryClient = useQueryClient()

  const optimisticUpdate = async (contactId: string, updatedData: Partial<ContactDetail>) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries({ queryKey: ['contact', contactId] })

    // Snapshot the previous value
    const previousContact = queryClient.getQueryData(['contact', contactId])

    // Optimistically update to the new value
    queryClient.setQueryData(['contact', contactId], (old: ContactDetail | undefined) => {
      if (!old) return old
      return { ...old, ...updatedData }
    })

    // Return a context object with the snapshotted value
    return { previousContact }
  }

  const rollback = (contactId: string, context: { previousContact: any }) => {
    queryClient.setQueryData(['contact', contactId], context.previousContact)
  }

  return { optimisticUpdate, rollback }
}