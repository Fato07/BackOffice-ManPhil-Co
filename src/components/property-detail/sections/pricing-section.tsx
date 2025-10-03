"use client"

import { DollarSign, Lock } from "lucide-react"
import { usePropertyPricing } from "@/hooks/use-property-pricing"
import { usePermissions } from "@/hooks/use-permissions"
import { Permission } from "@/types/auth"
import { GeneralPricingSection } from "./pricing/general-pricing-section"
import { PricePeriodsSection } from "./pricing/price-periods-section"
import { MinimumStaySection } from "./pricing/minimum-stay-section"
import { OperationalCostsSection } from "./pricing/operational-costs-section"
import { Skeleton } from "@/components/ui/skeleton"
import { GlassCard } from "@/components/ui/glass-card"

interface PricingSectionProps {
  property: {
    id: string
    name: string
  }
}

export function PricingSection({ property }: PricingSectionProps) {
  const { hasPermission } = usePermissions()
  const hasFinancialView = hasPermission(Permission.FINANCIAL_VIEW)
  const { data: pricingData, isLoading, error } = usePropertyPricing(property.id)

  // Show permission denied message if user doesn't have FINANCIAL_VIEW permission
  if (!hasFinancialView) {
    return (
      <GlassCard>
        <div className="px-8 py-6 border-b border-gray-100/50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Pricing</h2>
              <p className="text-sm text-gray-600 mt-1">Financial data access required</p>
            </div>
            <Lock className="h-5 w-5 text-gray-400" />
          </div>
        </div>
        <div className="px-8 py-6">
          <div className="text-center py-8 text-gray-500">
            <Lock className="h-8 w-8 mx-auto mb-3 text-gray-300" />
            <p className="text-sm">You don't have permission to view pricing data.</p>
            <p className="text-xs text-gray-400 mt-1">Contact an administrator for access.</p>
          </div>
        </div>
      </GlassCard>
    )
  }

  if (isLoading) {
    return <PricingSectionSkeleton />
  }

  if (error) {
    return (
      <GlassCard>
        <div className="px-8 py-6 border-b border-gray-100/50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Pricing</h2>
              <p className="text-sm text-gray-600 mt-1">Failed to load pricing data</p>
            </div>
            <DollarSign className="h-5 w-5 text-gray-400" />
          </div>
        </div>
        <div className="px-8 py-6">
          <div className="text-center py-8 text-red-600">
            <p>Error loading pricing data: {error.message}</p>
          </div>
        </div>
      </GlassCard>
    )
  }

  if (!pricingData) {
    return null
  }

  const { pricing, priceRanges, minimumStayRules, operationalCosts } = pricingData

  return (
    <div className="space-y-8">
      <GeneralPricingSection 
        propertyId={property.id} 
        pricing={pricing} 
      />

      <PricePeriodsSection 
        propertyId={property.id} 
        priceRanges={priceRanges || []} 
      />

      <MinimumStaySection 
        propertyId={property.id} 
        minimumStayRules={minimumStayRules || []} 
      />

      <OperationalCostsSection 
        propertyId={property.id} 
        operationalCosts={operationalCosts || []} 
      />
    </div>
  )
}

// Loading skeleton
function PricingSectionSkeleton() {
  return (
    <div className="space-y-8">
      <GlassCard>
        <div className="px-8 py-6 border-b border-gray-100/50">
          <div className="flex items-center justify-between">
            <div>
              <Skeleton className="h-6 w-32 mb-2" />
              <Skeleton className="h-4 w-48" />
            </div>
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        </div>
        <div className="px-8 py-6">
          <div className="grid grid-cols-3 gap-4">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i}>
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
        </div>
      </GlassCard>

      <GlassCard>
        <div className="px-8 py-6 border-b border-gray-100/50">
          <Skeleton className="h-6 w-40 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="px-8 py-6">
          <Skeleton className="h-64 w-full" />
        </div>
      </GlassCard>

      <GlassCard>
        <div className="px-8 py-6 border-b border-gray-100/50">
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="px-8 py-6">
          <Skeleton className="h-48 w-full" />
        </div>
      </GlassCard>

      <GlassCard>
        <div className="px-8 py-6 border-b border-gray-100/50">
          <Skeleton className="h-6 w-40 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="px-8 py-6">
          <Skeleton className="h-32 w-full" />
        </div>
      </GlassCard>
    </div>
  )
}