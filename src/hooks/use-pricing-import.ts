'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { 
  importPriceRanges,
  exportPriceRanges,
  importOperationalCosts,
  importMinimumStayRules
} from '@/actions/pricing-import'
import type {
  ImportPriceRangesData,
  ExportPriceRangesData,
  OperationalCostImportData,
  MinimumStayImportData
} from '@/lib/validations/pricing'

// Import price ranges mutation
export function useImportPriceRanges() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: ImportPriceRangesData) => {
      const result = await importPriceRanges(data)
      if (!result.success) {
        throw new Error(result.error || 'Failed to import price ranges')
      }
      return result.data
    },
    onSuccess: (data) => {
      // Invalidate pricing-related queries
      queryClient.invalidateQueries({ queryKey: ['price-ranges'] })
      queryClient.invalidateQueries({ queryKey: ['property-pricing'] })
      
      if (data?.imported && data.imported > 0) {
        toast.success(`Successfully imported ${data.imported} price ranges`)
      }
      
      if (data?.updated && data.updated > 0) {
        toast.success(`Updated ${data.updated} existing price ranges`)
      }
      
      if (data?.skipped && data.skipped > 0) {
        toast.warning(`Skipped ${data.skipped} conflicting price ranges`)
      }

      if (data?.errors && data.errors.length > 0) {
        toast.error(`${data.errors.length} price ranges failed to import`)
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to import price ranges')
    },
  })
}

// Export price ranges mutation
export function useExportPriceRanges() {
  return useMutation({
    mutationFn: async (data: ExportPriceRangesData) => {
      const result = await exportPriceRanges(data)
      if (!result.success) {
        throw new Error(result.error || 'Failed to export price ranges')
      }
      return result.data
    },
    onSuccess: (data) => {
      if (data) {
        // Create download link
        const blob = new Blob([Buffer.from(data.content, 'base64')], { 
          type: 'text/csv; charset=utf-8' 
        })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.style.display = 'none'
        a.href = url
        a.download = data.filename
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
      toast.success('Price ranges exported successfully')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to export price ranges')
    },
  })
}

// Import operational costs mutation
export function useImportOperationalCosts() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (costs: OperationalCostImportData[]) => {
      const result = await importOperationalCosts(costs)
      if (!result.success) {
        throw new Error(result.error || 'Failed to import operational costs')
      }
      return result.data
    },
    onSuccess: (data) => {
      // Invalidate operational costs queries
      queryClient.invalidateQueries({ queryKey: ['operational-costs'] })
      
      if (data?.imported && data.imported > 0) {
        toast.success(`Successfully imported ${data.imported} operational costs`)
      }

      if (data?.errors && data.errors.length > 0) {
        toast.error(`${data.errors.length} operational costs failed to import`)
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to import operational costs')
    },
  })
}

// Import minimum stay rules mutation
export function useImportMinimumStayRules() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (rules: MinimumStayImportData[]) => {
      const result = await importMinimumStayRules(rules)
      if (!result.success) {
        throw new Error(result.error || 'Failed to import minimum stay rules')
      }
      return result.data
    },
    onSuccess: (data) => {
      // Invalidate minimum stay rules queries
      queryClient.invalidateQueries({ queryKey: ['minimum-stay-rules'] })
      
      if (data?.imported && data.imported > 0) {
        toast.success(`Successfully imported ${data.imported} minimum stay rules`)
      }

      if (data?.errors && data.errors.length > 0) {
        toast.error(`${data.errors.length} minimum stay rules failed to import`)
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to import minimum stay rules')
    },
  })
}