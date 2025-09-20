"use client"

import { PropertyListItem } from "@/types/property"
import { PropertyCard } from "./property-card"
import { Skeleton } from "@/components/ui/skeleton"
import { Card } from "@/components/ui/card"

interface PropertyGridProps {
  properties: PropertyListItem[]
  isLoading?: boolean
  onEdit?: (property: PropertyListItem) => void
  onDelete?: (property: PropertyListItem) => void
}

function PropertyCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <Skeleton className="aspect-[16/10] w-full" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <div className="flex gap-4">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-12" />
        </div>
      </div>
    </Card>
  )
}

export function PropertyGrid({ properties, isLoading, onEdit, onDelete }: PropertyGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <PropertyCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (properties.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No properties found</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {properties.map((property) => (
        <PropertyCard
          key={property.id}
          property={property}
          onEdit={onEdit ? () => onEdit(property) : undefined}
          onDelete={onDelete ? () => onDelete(property) : undefined}
        />
      ))}
    </div>
  )
}