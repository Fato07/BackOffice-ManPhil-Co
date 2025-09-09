"use client"

import { useProperty } from "@/hooks/use-properties"
import { PropertyDetailsClient } from "./property-details-client"
import { Skeleton } from "@/components/ui/skeleton"

interface PropertyDetailsWrapperProps {
  propertyId: string
  initialData?: any // For hydration from SSR
}

export function PropertyDetailsWrapper({ propertyId, initialData }: PropertyDetailsWrapperProps) {
  const { data: property, isLoading, error } = useProperty(propertyId)

  if (isLoading) {
    return <PropertyDetailsLoading />
  }

  if (error || !property) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900">Property not found</h2>
          <p className="text-gray-600 mt-2">The property you're looking for doesn't exist or has been removed.</p>
        </div>
      </div>
    )
  }

  return <PropertyDetailsClient property={property} />
}

function PropertyDetailsLoading() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Left Navigation Skeleton */}
      <div className="w-64 bg-white shadow-sm p-4 space-y-4">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>

      {/* Main Content Skeleton */}
      <div className="flex-1 p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header Skeleton */}
          <div className="space-y-2">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>

          {/* Section Skeletons */}
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm p-8 space-y-4">
              <Skeleton className="h-6 w-48" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}