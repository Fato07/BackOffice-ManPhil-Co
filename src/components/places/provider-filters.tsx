"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { ActivityProviderFilters } from "@/types/activity-provider"
import { Filter, ChevronDown, X } from "lucide-react"

interface ProviderFiltersProps {
  filters: ActivityProviderFilters
  onFiltersChange: (filters: ActivityProviderFilters) => void
}

const PROVIDER_TYPES = [
  { value: "BAKERY", label: "Bakery" },
  { value: "PHARMACY", label: "Pharmacy" },
  { value: "RESTAURANTS", label: "Restaurant" },
  { value: "SUPERMARKET", label: "Supermarket" },
  { value: "MEDICAL", label: "Medical" },
  { value: "TRANSPORT", label: "Transport" },
  { value: "ENTERTAINMENT", label: "Entertainment" },
  { value: "SPORTS", label: "Sports" },
  { value: "OTHER", label: "Other" },
]

const COMMON_TAGS = [
  "family-friendly",
  "romantic",
  "luxury",
  "budget-friendly",
  "outdoor",
  "indoor",
  "accessible",
  "pet-friendly",
  "seasonal",
  "popular",
  "recommended",
  "verified"
]

export function ProviderFilters({ filters, onFiltersChange }: ProviderFiltersProps) {
  const [isOpen, setIsOpen] = useState(false)

  const updateFilters = (updates: Partial<ActivityProviderFilters>) => {
    onFiltersChange({ ...filters, ...updates })
  }

  const removeTag = (tagToRemove: string) => {
    const newTags = filters.tags?.filter(tag => tag !== tagToRemove) || []
    updateFilters({ tags: newTags.length > 0 ? newTags : undefined })
  }

  const addTag = (tag: string) => {
    const currentTags = filters.tags || []
    if (!currentTags.includes(tag)) {
      updateFilters({ tags: [...currentTags, tag] })
    }
  }

  const activeFiltersCount = Object.values(filters).filter(value => 
    value !== undefined && value !== null && value !== '' && 
    (Array.isArray(value) ? value.length > 0 : true)
  ).length - 2 // Exclude search and sorting

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Filter className="h-4 w-4" />
          Filters
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="ml-1">
              {activeFiltersCount}
            </Badge>
          )}
          <ChevronDown className="h-4 w-4" />
        </Button>
      </CollapsibleTrigger>
      
      <CollapsibleContent className="space-y-4 pt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 border rounded-lg">
          
          <div className="space-y-2">
            <Label>Type</Label>
            <Select 
              value={filters.category || "all"} 
              onValueChange={(value) => updateFilters({ category: value === "all" ? undefined : value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                {PROVIDER_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label>Contact Information</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="has-website"
                  checked={filters.hasWebsite || false}
                  onCheckedChange={(checked) => 
                    updateFilters({ hasWebsite: checked ? true : undefined })
                  }
                />
                <Label htmlFor="has-website" className="text-sm">Has website</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="has-phone"
                  checked={filters.hasPhone || false}
                  onCheckedChange={(checked) => 
                    updateFilters({ hasPhone: checked ? true : undefined })
                  }
                />
                <Label htmlFor="has-phone" className="text-sm">Has phone</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="has-email"
                  checked={filters.hasEmail || false}
                  onCheckedChange={(checked) => 
                    updateFilters({ hasEmail: checked ? true : undefined })
                  }
                />
                <Label htmlFor="has-email" className="text-sm">Has email</Label>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Sort by</Label>
            <Select 
              value={filters.sortBy || "name"} 
              onValueChange={(value) => updateFilters({ sortBy: value as any })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="category">Category</SelectItem>
                <SelectItem value="createdAt">Created Date</SelectItem>
                <SelectItem value="updatedAt">Updated Date</SelectItem>
              </SelectContent>
            </Select>
            
            <Select 
              value={filters.sortOrder || "asc"} 
              onValueChange={(value) => updateFilters({ sortOrder: value as any })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="asc">Ascending</SelectItem>
                <SelectItem value="desc">Descending</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="space-y-2">
              {filters.tags && filters.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {filters.tags.map((tag) => (
                    <Badge key={tag} variant="default" className="gap-1">
                      {tag}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 hover:bg-transparent"
                        onClick={() => removeTag(tag)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              )}
              
              <div className="flex flex-wrap gap-1">
                {COMMON_TAGS
                  .filter(tag => !filters.tags?.includes(tag))
                  .slice(0, 6)
                  .map((tag) => (
                    <Button
                      key={tag}
                      variant="outline"
                      size="sm"
                      className="h-6 text-xs"
                      onClick={() => addTag(tag)}
                    >
                      {tag}
                    </Button>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}