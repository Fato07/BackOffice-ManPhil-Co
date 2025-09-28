"use client"

import { useState, useOptimistic } from "react"
import { PropertySection } from "../property-section"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { PropertyWithRelations, SurroundingsInfo } from "@/types/property"
import { useUpdatePropertySurroundings } from "@/hooks/use-properties"
import { Globe, Filter, MapPin, Mountain, Trees, Waves, Building2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface SurroundingsSectionProps {
  property: PropertyWithRelations
}

// Website filter options that could be linked to the main site
const filterOptions = [
  { id: 'city', label: 'City', icon: Building2, color: 'text-gray-600' },
  { id: 'countryside', label: 'Countryside', icon: Trees, color: 'text-green-600' },
  { id: 'mountain', label: 'Mountain', icon: Mountain, color: 'text-blue-600' },
  { id: 'sea', label: 'Sea', icon: Waves, color: 'text-cyan-600' },
]

export function SurroundingsSection({ property }: SurroundingsSectionProps) {
  const [isEditing, setIsEditing] = useState(false)
  const updateSurroundings = useUpdatePropertySurroundings()
  
  // Parse existing surroundings data
  const existingSurroundings = property.surroundings as SurroundingsInfo | null
  
  // Optimistic state
  const [optimisticSurroundings, setOptimisticSurroundings] = useOptimistic(
    existingSurroundings || { filters: [], customNotes: '' },
    (_, newSurroundings: SurroundingsInfo) => newSurroundings
  )

  // Local state for editing
  const [selectedFilters, setSelectedFilters] = useState<string[]>(
    optimisticSurroundings?.filters || []
  )
  const [customNotes, setCustomNotes] = useState(
    optimisticSurroundings?.customNotes || ''
  )

  const handleSave = async () => {
    const newData: SurroundingsInfo = {
      filters: selectedFilters,
      customNotes: customNotes.trim()
    }

    // Optimistically update
    setOptimisticSurroundings(newData)
    setIsEditing(false)

    try {
      await updateSurroundings.mutateAsync({
        propertyId: property.id,
        surroundings: newData
      })
    } catch (error) {
      // Revert optimistic update on error
      setOptimisticSurroundings(existingSurroundings || { filters: [], customNotes: '' })
      setSelectedFilters(existingSurroundings?.filters || [])
      setCustomNotes(existingSurroundings?.customNotes || '')
      setIsEditing(true)
    }
  }

  const handleCancel = () => {
    setSelectedFilters(optimisticSurroundings?.filters || [])
    setCustomNotes(optimisticSurroundings?.customNotes || '')
    setIsEditing(false)
  }

  const toggleFilter = (filterId: string) => {
    setSelectedFilters(prev => 
      prev.includes(filterId) 
        ? prev.filter(id => id !== filterId)
        : [...prev, filterId]
    )
  }

  return (
    <PropertySection
      title="Surroundings"
      isEditing={isEditing}
      onEdit={() => setIsEditing(true)}
      onSave={handleSave}
      onCancel={handleCancel}
      className="border-purple-200 bg-purple-50/30"
      isSaving={updateSurroundings.isPending}
    >
      <div className="mb-4">
        <div className="flex items-center gap-2 p-3 bg-purple-100 rounded-lg border border-purple-300">
          <Globe className="w-5 h-5 text-purple-600" />
          <p className="text-sm text-purple-800">
            Define the property's surroundings to help with website filtering and guest expectations.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {isEditing ? (
          <>
            {/* Edit Mode */}
            <div>
              <Label className="text-base font-semibold mb-3 block">
                Property Surroundings
              </Label>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {filterOptions.map(option => {
                  const Icon = option.icon
                  const isSelected = selectedFilters.includes(option.id)
                  return (
                    <div
                      key={option.id}
                      className={cn(
                        "relative border rounded-lg p-4 cursor-pointer transition-all",
                        isSelected 
                          ? "border-purple-500 bg-purple-50" 
                          : "border-gray-200 hover:border-purple-300"
                      )}
                      onClick={() => toggleFilter(option.id)}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleFilter(option.id)}
                        className="absolute top-3 right-3"
                      />
                      <div className="flex flex-col items-center text-center space-y-2">
                        <Icon className={cn("h-8 w-8", option.color)} />
                        <span className="font-medium">{option.label}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
              <p className="text-sm text-gray-500 mt-2">
                <Filter className="h-3 w-3 inline mr-1" />
                These filters will be linked to the main website search
              </p>
            </div>

            <div>
              <Label>Additional Notes</Label>
              <Textarea
                value={customNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
                placeholder="Describe any unique surroundings or nearby points of interest..."
                rows={3}
              />
            </div>
          </>
        ) : (
          /* View Mode */
          <div className="space-y-4">
            {optimisticSurroundings?.filters && optimisticSurroundings.filters.length > 0 ? (
              <div>
                <Label className="text-sm text-gray-600 mb-2 block">Selected Filters</Label>
                <div className="flex flex-wrap gap-2">
                  {optimisticSurroundings.filters.map(filterId => {
                    const filter = filterOptions.find(opt => opt.id === filterId)
                    if (!filter) return null
                    const Icon = filter.icon
                    return (
                      <Badge key={filterId} variant="secondary" className="px-3 py-1.5">
                        <Icon className={cn("h-3 w-3 mr-1.5", filter.color)} />
                        {filter.label}
                      </Badge>
                    )
                  })}
                </div>
              </div>
            ) : (
              <p className="text-gray-500 italic">No surroundings filters selected</p>
            )}

            {optimisticSurroundings?.customNotes && (
              <div>
                <Label className="text-sm text-gray-600 mb-2 block">Additional Notes</Label>
                <p className="text-gray-700 whitespace-pre-wrap">
                  {optimisticSurroundings.customNotes}
                </p>
              </div>
            )}

            {!optimisticSurroundings?.filters?.length && !optimisticSurroundings?.customNotes && (
              <div className="text-center py-8 text-gray-500">
                <MapPin className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No surroundings information added yet</p>
                <p className="text-sm mt-1">Click Edit to define property surroundings</p>
              </div>
            )}
          </div>
        )}
      </div>
    </PropertySection>
  )
}