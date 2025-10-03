"use client"

import { useState, useEffect } from "react"
import { Filter, Building2, Tag, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  LegalDocumentCategory, 
  LegalDocumentStatus,
  LEGAL_DOCUMENT_CATEGORY_LABELS,
  LEGAL_DOCUMENT_STATUS_LABELS 
} from "@/types/legal-document"
import { useProperties } from "@/hooks/use-properties"
import { Skeleton } from "@/components/ui/skeleton"

interface LegalDocumentFiltersProps {
  filters: {
    category?: LegalDocumentCategory | 'ALL'
    status?: LegalDocumentStatus | 'ALL'
    propertyId?: string
    expiringInDays?: number
    tags?: string[]
  }
  onFilterChange: (filters: Partial<LegalDocumentFiltersProps['filters']>) => void
  isLoading?: boolean
}

export function LegalDocumentFilters({ 
  filters, 
  onFilterChange, 
  isLoading 
}: LegalDocumentFiltersProps) {
  const [open, setOpen] = useState(false)
  const [localFilters, setLocalFilters] = useState(filters)
  const [tagInput, setTagInput] = useState("")
  
  // Fetch properties for property filter
  const { data: propertiesResult } = useProperties(undefined, 1, 1000)
  const properties = propertiesResult?.data || []

  // Update local filters when prop filters change
  useEffect(() => {
    setLocalFilters(filters)
  }, [filters])

  const handleApplyFilters = () => {
    onFilterChange(localFilters)
    setOpen(false)
  }

  const handleReset = () => {
    const resetFilters = {
      category: 'ALL' as const,
      status: 'ALL' as const,
      propertyId: undefined,
      expiringInDays: undefined,
      tags: undefined,
    }
    setLocalFilters(resetFilters)
    onFilterChange(resetFilters)
    setTagInput("")
  }

  const handleAddTag = () => {
    if (tagInput.trim()) {
      const newTags = [...(localFilters.tags || []), tagInput.trim()]
      setLocalFilters({ ...localFilters, tags: newTags })
      setTagInput("")
    }
  }

  const handleRemoveTag = (tag: string) => {
    const newTags = (localFilters.tags || []).filter(t => t !== tag)
    setLocalFilters({ 
      ...localFilters, 
      tags: newTags.length > 0 ? newTags : undefined 
    })
  }

  const activeCount = [
    localFilters.category && localFilters.category !== 'ALL',
    localFilters.status && localFilters.status !== 'ALL',
    localFilters.propertyId,
    localFilters.expiringInDays,
    localFilters.tags && localFilters.tags.length > 0,
  ].filter(Boolean).length

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          className="gap-2"
          disabled={isLoading}
        >
          <Filter className="h-4 w-4" />
          Filters
          {activeCount > 0 && (
            <Badge variant="secondary" className="ml-1">
              {activeCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-6 bg-gradient-to-br from-white to-[#FAFAF8] border-[#B5985A]/20 shadow-xl" align="end">
        <div className="relative">
          <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.02] pointer-events-none" />
          <div className="space-y-4 relative">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-serif text-[#1c355e]">Filter Documents</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="text-xs hover:bg-[#B5985A]/10 text-[#B5985A]"
              >
                Reset
              </Button>
            </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-[#1c355e]">Category</Label>
            <Select
              value={localFilters.category || 'ALL'}
              onValueChange={(value) => 
                setLocalFilters({ ...localFilters, category: value as LegalDocumentCategory | 'ALL' })
              }
            >
              <SelectTrigger className="border-[#B5985A]/20 focus:border-[#B5985A]/40 focus:ring-[#B5985A]/20 transition-colors duration-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Categories</SelectItem>
                {Object.entries(LEGAL_DOCUMENT_CATEGORY_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-[#1c355e]">Status</Label>
            <Select
              value={localFilters.status || 'ALL'}
              onValueChange={(value) => 
                setLocalFilters({ ...localFilters, status: value as LegalDocumentStatus | 'ALL' })
              }
            >
              <SelectTrigger className="border-[#B5985A]/20 focus:border-[#B5985A]/40 focus:ring-[#B5985A]/20 transition-colors duration-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                {Object.entries(LEGAL_DOCUMENT_STATUS_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-medium text-[#1c355e]">
              <Building2 className="h-4 w-4 text-[#B5985A]" />
              Property
            </Label>
            <Select
              value={localFilters.propertyId || 'ALL'}
              onValueChange={(value) => 
                setLocalFilters({ 
                  ...localFilters, 
                  propertyId: value === 'ALL' ? undefined : value 
                })
              }
            >
              <SelectTrigger className="border-[#B5985A]/20 focus:border-[#B5985A]/40 focus:ring-[#B5985A]/20 transition-colors duration-200">
                <SelectValue placeholder="All Properties" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Properties</SelectItem>
                <SelectItem value="GLOBAL">Global Documents</SelectItem>
                {properties.map((property) => (
                  <SelectItem key={property.id} value={property.id}>
                    {property.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-medium text-[#1c355e]">
              <Calendar className="h-4 w-4 text-[#B5985A]" />
              Expiring in days
            </Label>
            <Select
              value={localFilters.expiringInDays?.toString() || 'ALL'}
              onValueChange={(value) => 
                setLocalFilters({ 
                  ...localFilters, 
                  expiringInDays: value === 'ALL' ? undefined : parseInt(value) 
                })
              }
            >
              <SelectTrigger className="border-[#B5985A]/20 focus:border-[#B5985A]/40 focus:ring-[#B5985A]/20 transition-colors duration-200">
                <SelectValue placeholder="No filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">No filter</SelectItem>
                <SelectItem value="7">Next 7 days</SelectItem>
                <SelectItem value="30">Next 30 days</SelectItem>
                <SelectItem value="60">Next 60 days</SelectItem>
                <SelectItem value="90">Next 90 days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-medium text-[#1c355e]">
              <Tag className="h-4 w-4 text-[#B5985A]" />
              Tags
            </Label>
            <div className="flex gap-2">
              <Input
                placeholder="Add tag..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddTag()
                  }
                }}
                className="border-[#B5985A]/20 focus:border-[#B5985A]/40 focus:ring-[#B5985A]/20 transition-colors duration-200"
              />
              <Button
                size="sm"
                variant="secondary"
                onClick={handleAddTag}
                disabled={!tagInput.trim()}
                className="bg-gradient-to-r from-[#B5985A] to-[#D4AF37] text-white hover:from-[#D4AF37] hover:to-[#B5985A] transition-all duration-300"
              >
                Add
              </Button>
            </div>
            {localFilters.tags && localFilters.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {localFilters.tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="cursor-pointer bg-[#FAFAF8] border border-[#B5985A]/20 text-[#1c355e] hover:bg-[#B5985A]/10 transition-colors duration-200"
                    onClick={() => handleRemoveTag(tag)}
                  >
                    {tag}
                    <span className="ml-1 hover:text-rose-600 transition-colors">×</span>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-[#B5985A]/10">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOpen(false)}
              className="border-[#B5985A]/20 hover:bg-gray-50 transition-all duration-200"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleApplyFilters}
              className="bg-gradient-to-r from-[#1c355e] to-[#2a4a7f] text-white hover:from-[#2a4a7f] hover:to-[#1c355e] transition-all duration-300 shadow-sm hover:shadow-md"
            >
              Apply Filters
            </Button>
          </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}