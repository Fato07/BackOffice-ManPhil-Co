"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import type { ContactFilters } from "@/types/contact"
import { CONTACT_CATEGORIES, LANGUAGES } from "@/types/contact"
import { 
  Filter, 
  X, 
  Search,
  Users,
  Globe,
  Home,
  Settings2
} from "lucide-react"
import { useState } from "react"

interface ContactFiltersProps {
  filters: ContactFilters
  onFiltersChange: (filters: ContactFilters) => void
}

export function ContactFilters({ filters, onFiltersChange }: ContactFiltersProps) {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)

  const handleCategoryChange = (category: ContactFilters['category']) => {
    onFiltersChange({
      ...filters,
      category: category === filters.category ? undefined : category,
    })
  }

  const handleLanguageChange = (language: string) => {
    onFiltersChange({
      ...filters,
      language: language === "all" ? undefined : language,
    })
  }

  const handleLinkedPropertiesChange = (checked: boolean) => {
    onFiltersChange({
      ...filters,
      hasLinkedProperties: checked ? true : undefined,
    })
  }

  const clearFilters = () => {
    onFiltersChange({})
  }

  const activeFilterCount = Object.values(filters).filter(Boolean).length

  // Category filter buttons
  const categories = [
    { key: 'ALL' as const, label: 'All', count: 0 },
    { key: 'CLIENT' as const, label: CONTACT_CATEGORIES.CLIENT.label, count: 0 },
    { key: 'OWNER' as const, label: CONTACT_CATEGORIES.OWNER.label, count: 0 },
    { key: 'PROVIDER' as const, label: CONTACT_CATEGORIES.PROVIDER.label, count: 0 },
    { key: 'ORGANIZATION' as const, label: CONTACT_CATEGORIES.ORGANIZATION.label, count: 0 },
    { key: 'OTHER' as const, label: CONTACT_CATEGORIES.OTHER.label, count: 0 },
  ]

  return (
    <>
      <Popover open={showAdvancedFilters} onOpenChange={setShowAdvancedFilters}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="default" className="gap-2">
            <Filter className="h-4 w-4" />
            Filters
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-1">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[600px]" align="start">
          <div className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium">Filters</h4>
              <p className="text-xs text-muted-foreground">
                Filter contacts by category and other criteria
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <div className="flex flex-wrap gap-2">
        {categories.map((category) => {
          const isActive = filters.category === category.key || (category.key === 'ALL' && !filters.category)
          const categoryConfig = category.key !== 'ALL' ? CONTACT_CATEGORIES[category.key] : null
          
          return (
            <Button
              key={category.key}
              variant={isActive ? "default" : "outline"}
              size="sm"
              onClick={() => handleCategoryChange(category.key === 'ALL' ? undefined : category.key)}
              className={`gap-2 ${isActive && categoryConfig ? categoryConfig.color : ''}`}
            >
              <Users className="h-4 w-4" />
              {category.label}
              {/* {category.count > 0 && (
                <Badge variant="secondary" className="ml-1 px-1 py-0 text-xs">
                  {category.count}
                </Badge>
              )} */}
            </Button>
          )
                })}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Language
              </label>
              <Select
                value={filters.language || "all"}
                onValueChange={handleLanguageChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All languages" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All languages</SelectItem>
                  {LANGUAGES.map((language) => (
                    <SelectItem key={language} value={language}>
                      {language}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Home className="h-4 w-4" />
                Property Links
              </label>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hasLinkedProperties"
                  checked={filters.hasLinkedProperties || false}
                  onCheckedChange={handleLinkedPropertiesChange}
                />
                <label
                  htmlFor="hasLinkedProperties"
                  className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Only contacts with linked properties
                </label>
              </div>
            </div>

            {activeFilterCount > 0 && (
              <div className="pt-2 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearFilters}
                  className="w-full gap-2"
                >
                  <X className="h-4 w-4" />
                  Clear All Filters
                </Button>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {activeFilterCount > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          {filters.category && filters.category !== 'ALL' && (
            <Badge variant="secondary" className="gap-1">
              Category: {CONTACT_CATEGORIES[filters.category].label}
              <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 ml-1"
                  onClick={() => handleCategoryChange(undefined)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}
            
            {filters.language && (
              <Badge variant="secondary" className="gap-1">
                Language: {filters.language}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 ml-1"
                  onClick={() => handleLanguageChange("all")}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}

            {filters.hasLinkedProperties && (
              <Badge variant="secondary" className="gap-1">
                Has Properties
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 ml-1"
                  onClick={() => handleLinkedPropertiesChange(false)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}
        </div>
      )}
    </>
  )
}