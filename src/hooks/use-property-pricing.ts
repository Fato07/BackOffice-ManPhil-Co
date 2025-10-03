import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { usePermissions } from "@/hooks/use-permissions"
import { Permission } from "@/types/auth"
import {
  getPropertyPricing,
  updatePropertyPricing,
  createPriceRange,
  updatePriceRange,
  deletePriceRange,
  createMinimumStayRule,
  updateMinimumStayRule,
  deleteMinimumStayRule,
  createOperationalCost,
  updateOperationalCost,
  deleteOperationalCost,
  migrateLegacyPricing
} from "@/actions/property-pricing"

// Query hook for fetching all pricing data
export function usePropertyPricing(propertyId: string) {
  const { hasPermission } = usePermissions()
  const hasFinancialView = hasPermission(Permission.FINANCIAL_VIEW)
  
  return useQuery({
    queryKey: ["property-pricing", propertyId],
    queryFn: () => getPropertyPricing(propertyId),
    enabled: !!propertyId && hasFinancialView
  })
}

// Mutation hooks for general pricing
export function useUpdatePropertyPricing(propertyId: string) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: Parameters<typeof updatePropertyPricing>[1]) => 
      updatePropertyPricing(propertyId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["property-pricing", propertyId] })
      toast.success("Pricing settings updated")
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update pricing settings")
    }
  })
}

// Mutation hooks for price ranges
export function useCreatePriceRange(propertyId: string) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: Parameters<typeof createPriceRange>[1]) => 
      createPriceRange(propertyId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["property-pricing", propertyId] })
      toast.success("Price period added")
    },
    onError: (error) => {
      toast.error(error.message || "Failed to add price period")
    }
  })
}

export function useUpdatePriceRange(propertyId: string) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updatePriceRange>[1] }) => 
      updatePriceRange(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["property-pricing", propertyId] })
      toast.success("Price period updated")
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update price period")
    }
  })
}

export function useDeletePriceRange(propertyId: string) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: deletePriceRange,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["property-pricing", propertyId] })
      toast.success("Price period deleted")
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete price period")
    }
  })
}

// Mutation hooks for minimum stay rules
export function useCreateMinimumStayRule(propertyId: string) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: Parameters<typeof createMinimumStayRule>[1]) => 
      createMinimumStayRule(propertyId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["property-pricing", propertyId] })
      toast.success("Minimum stay rule added")
    },
    onError: (error) => {
      toast.error(error.message || "Failed to add minimum stay rule")
    }
  })
}

export function useUpdateMinimumStayRule(propertyId: string) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateMinimumStayRule>[1] }) => 
      updateMinimumStayRule(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["property-pricing", propertyId] })
      toast.success("Minimum stay rule updated")
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update minimum stay rule")
    }
  })
}

export function useDeleteMinimumStayRule(propertyId: string) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: deleteMinimumStayRule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["property-pricing", propertyId] })
      toast.success("Minimum stay rule deleted")
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete minimum stay rule")
    }
  })
}

// Mutation hooks for operational costs
export function useCreateOperationalCost(propertyId: string) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: Parameters<typeof createOperationalCost>[1]) => 
      createOperationalCost(propertyId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["property-pricing", propertyId] })
      toast.success("Operational cost added")
    },
    onError: (error) => {
      toast.error(error.message || "Failed to add operational cost")
    }
  })
}

export function useUpdateOperationalCost(propertyId: string) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateOperationalCost>[1] }) => 
      updateOperationalCost(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["property-pricing", propertyId] })
      toast.success("Operational cost updated")
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update operational cost")
    }
  })
}

export function useDeleteOperationalCost(propertyId: string) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: deleteOperationalCost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["property-pricing", propertyId] })
      toast.success("Operational cost deleted")
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete operational cost")
    }
  })
}

// Migration hook
export function useMigrateLegacyPricing(propertyId: string) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: () => migrateLegacyPricing(propertyId),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["property-pricing", propertyId] })
      toast.success(`Migrated ${result.migrated} price periods`)
    },
    onError: (error) => {
      toast.error(error.message || "Failed to migrate pricing data")
    }
  })
}