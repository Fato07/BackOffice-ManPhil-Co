"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Building2, Search, MapPin } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { Skeleton } from "@/components/ui/skeleton"
import { ActivityProvider } from "@/types/activity-provider"
import { Property } from "@/generated/prisma"
import { getProperties } from "@/actions/properties"

interface PropertySelectorModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  provider: ActivityProvider
  onSave: (selectedPropertyIds: string[]) => Promise<void>
}

interface PropertyWithSelection extends Property {
  isSelected: boolean
}

export function PropertySelectorModal({
  open,
  onOpenChange,
  provider,
  onSave,
}: PropertySelectorModalProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedProperties, setSelectedProperties] = useState<Set<string>>(new Set())
  const [isSaving, setIsSaving] = useState(false)

  // Fetch all properties
  const { data: propertiesData, isLoading } = useQuery({
    queryKey: ["properties-for-linking"],
    queryFn: async () => {
      const result = await getProperties({ pageSize: 100 }) // Get more properties
      return result.success ? result.data : []
    },
    enabled: open,
  })

  // Initialize selected properties from provider's existing properties
  useEffect(() => {
    if (provider.properties && open) {
      const existingIds = provider.properties.map((p: any) => p.id)
      setSelectedProperties(new Set(existingIds))
    }
  }, [provider.properties, open])

  // Filter properties based on search
  const filteredProperties = propertiesData?.filter((property) => {
    const searchLower = searchTerm.toLowerCase()
    return (
      property.name.toLowerCase().includes(searchLower) ||
      property.city?.toLowerCase().includes(searchLower) ||
      property.destination?.name.toLowerCase().includes(searchLower)
    )
  }) || []

  const handleToggleProperty = (propertyId: string) => {
    const newSelected = new Set(selectedProperties)
    if (newSelected.has(propertyId)) {
      newSelected.delete(propertyId)
    } else {
      newSelected.add(propertyId)
    }
    setSelectedProperties(newSelected)
  }

  const handleSelectAll = () => {
    if (selectedProperties.size === filteredProperties.length) {
      setSelectedProperties(new Set())
    } else {
      setSelectedProperties(new Set(filteredProperties.map(p => p.id)))
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onSave(Array.from(selectedProperties))
      onOpenChange(false)
    } catch (error) {
      // Error handled by parent
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Link Properties to {provider.name}</DialogTitle>
          <DialogDescription>
            Select properties that should be associated with this provider.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search properties..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center space-x-3 p-3 border rounded-lg">
                  <Skeleton className="h-5 w-5" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-6 w-16" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {filteredProperties.length > 0 && (
                <div className="sticky top-0 bg-background p-2 border-b">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {selectedProperties.size} of {filteredProperties.length} selected
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleSelectAll}
                    >
                      {selectedProperties.size === filteredProperties.length ? "Deselect All" : "Select All"}
                    </Button>
                  </div>
                </div>
              )}
              
              {filteredProperties.map((property) => (
                <div
                  key={property.id}
                  className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => handleToggleProperty(property.id)}
                >
                  <Checkbox
                    checked={selectedProperties.has(property.id)}
                    onCheckedChange={() => handleToggleProperty(property.id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{property.name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span>
                        {property.city ? `${property.city}, ` : ""}
                        {property.destination?.name}
                      </span>
                    </div>
                  </div>
                  {property.status && (
                    <Badge variant="secondary" className="text-xs">
                      {property.status}
                    </Badge>
                  )}
                </div>
              ))}
              
              {filteredProperties.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No properties found matching your search.
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Links"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}