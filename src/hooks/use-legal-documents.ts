'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { 
  getLegalDocuments,
  getLegalDocument,
  createLegalDocument,
  updateLegalDocument,
  deleteLegalDocument,
  uploadLegalDocumentVersion,
  bulkDeleteLegalDocuments,
  exportLegalDocuments
} from '@/actions/legal-documents'
import type { 
  LegalDocumentFiltersInput,
  CreateLegalDocumentInput,
  UpdateLegalDocumentInput,
  UploadLegalDocumentVersionInput,
  BulkDeleteLegalDocumentsInput,
  LegalDocumentExportInput
} from '@/lib/validations/legal-document'

interface UseLegalDocumentsOptions extends LegalDocumentFiltersInput {
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

// Fetch legal documents with filters
export function useLegalDocuments(options: UseLegalDocumentsOptions = {}) {
  return useQuery({
    queryKey: ['legal-documents', options],
    queryFn: () => getLegalDocuments(options),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Fetch single legal document
export function useLegalDocument(id: string, enabled = true) {
  return useQuery({
    queryKey: ['legal-document', id],
    queryFn: () => getLegalDocument(id),
    enabled: enabled && !!id,
    staleTime: 5 * 60 * 1000,
  })
}

// Create legal document mutation
export function useCreateLegalDocument() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ file, ...data }: CreateLegalDocumentInput) => {
      // Convert file to form data
      const formData = new FormData()
      formData.append('file', file)
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (key === 'tags' || key === 'metadata') {
            formData.append(key, JSON.stringify(value))
          } else if (value instanceof Date) {
            formData.append(key, value.toISOString())
          } else {
            formData.append(key, String(value))
          }
        } else if (key === 'propertyId' && value === null) {
          // Explicitly send null for propertyId to indicate global document
          formData.append(key, 'null')
        }
      })

      const response = await fetch('/api/legal-documents', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create document')
      }

      return response.json()
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['legal-documents'] })
      toast.success('Legal document uploaded successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create legal document')
    },
  })
}

// Update legal document mutation
export function useUpdateLegalDocument(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: UpdateLegalDocumentInput) => 
      updateLegalDocument(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['legal-documents'] })
      queryClient.invalidateQueries({ queryKey: ['legal-document', id] })
      toast.success('Legal document updated successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update legal document')
    },
  })
}

// Delete legal document mutation
export function useDeleteLegalDocument() {
  const queryClient = useQueryClient()
  const router = useRouter()

  return useMutation({
    mutationFn: deleteLegalDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['legal-documents'] })
      toast.success('Legal document deleted successfully')
      router.push('/legals')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete legal document')
    },
  })
}

// Upload document version mutation
export function useUploadDocumentVersion(documentId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ file, comment }: { file: File; comment?: string }) => {
      const formData = new FormData()
      formData.append('file', file)
      if (comment) {
        formData.append('comment', comment)
      }

      const response = await fetch(`/api/legal-documents/${documentId}/versions`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to upload version')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['legal-document', documentId] })
      queryClient.invalidateQueries({ queryKey: ['legal-documents'] })
      toast.success('New version uploaded successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to upload new version')
    },
  })
}

// Bulk delete documents mutation
export function useBulkDeleteLegalDocuments() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: bulkDeleteLegalDocuments,
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['legal-documents'] })
      toast.success(`${result.data?.deletedCount || 0} documents deleted successfully`)
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete documents')
    },
  })
}

// Export documents mutation
export function useExportLegalDocuments() {
  return useMutation({
    mutationFn: exportLegalDocuments,
    onSuccess: (result) => {
      if (result.success && result.data) {
        // Handle different export formats
        const { data, format } = result.data
        
        if (format === 'json') {
          const blob = new Blob([JSON.stringify(data, null, 2)], { 
            type: 'application/json' 
          })
          downloadFile(blob, 'legal-documents.json')
        } else if (format === 'csv') {
          const csv = convertToCSV(data)
          const blob = new Blob([csv], { type: 'text/csv' })
          downloadFile(blob, 'legal-documents.csv')
        }
        // Add xlsx export if needed
        
        toast.success('Documents exported successfully')
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to export documents')
    },
  })
}

// Helper function to download file
function downloadFile(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  window.URL.revokeObjectURL(url)
  document.body.removeChild(a)
}

// Helper function to convert data to CSV
function convertToCSV(data: Array<Record<string, unknown>>): string {
  if (data.length === 0) return ''
  
  const headers = Object.keys(data[0])
  const csvHeaders = headers.join(',')
  
  const csvRows = data.map(row => 
    headers.map(header => {
      const value = row[header]
      // Escape commas and quotes in values
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`
      }
      return value ?? ''
    }).join(',')
  )
  
  return [csvHeaders, ...csvRows].join('\n')
}

// Download document helper
export function useDownloadDocument() {
  return useMutation({
    mutationFn: async ({ 
      id, 
      version 
    }: { 
      id: string
      version?: number 
    }) => {
      const url = version 
        ? `/api/legal-documents/${id}/download?version=${version}`
        : `/api/legal-documents/${id}/download`
        
      const response = await fetch(url)
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to download document')
      }
      
      const blob = await response.blob()
      const filename = response.headers
        .get('Content-Disposition')
        ?.split('filename=')[1]
        ?.replace(/"/g, '') || 'document'
        
      return { blob, filename }
    },
    onSuccess: ({ blob, filename }) => {
      downloadFile(blob, filename)
      toast.success('Document downloaded successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to download document')
    },
  })
}