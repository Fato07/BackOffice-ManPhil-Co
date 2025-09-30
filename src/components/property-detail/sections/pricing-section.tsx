"use client"

import { DollarSign } from "lucide-react"
import { usePropertyPricing } from "@/hooks/use-property-pricing"
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
  const { data: pricingData, isLoading, error } = usePropertyPricing(property.id)

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
      {/* General Pricing Settings */}
      <GeneralPricingSection 
        propertyId={property.id} 
        pricing={pricing} 
      />

      {/* Price Periods */}
      <PricePeriodsSection 
        propertyId={property.id} 
        priceRanges={priceRanges || []} 
      />

      {/* Minimum Stay Rules */}
      <MinimumStaySection 
        propertyId={property.id} 
        minimumStayRules={minimumStayRules || []} 
      />

      {/* Operational Costs */}
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
      {/* General Pricing Skeleton */}
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

      {/* Price Periods Skeleton */}
      <GlassCard>
        <div className="px-8 py-6 border-b border-gray-100/50">
          <Skeleton className="h-6 w-40 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="px-8 py-6">
          <Skeleton className="h-64 w-full" />
        </div>
      </GlassCard>

      {/* Minimum Stay Skeleton */}
      <GlassCard>
        <div className="px-8 py-6 border-b border-gray-100/50">
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="px-8 py-6">
          <Skeleton className="h-48 w-full" />
        </div>
      </GlassCard>

      {/* Operational Costs Skeleton */}
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