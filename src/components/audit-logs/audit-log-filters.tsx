"use client"

import { useState } from "react"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover"
import { CalendarIcon, Search, X } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { AuditLogFilters } from "@/hooks/use-audit-logs"

interface AuditLogFiltersProps {
  filters: AuditLogFilters
  onFiltersChange: (filters: AuditLogFilters) => void
}

export function AuditLogFiltersComponent({ 
  filters, 
  onFiltersChange 
}: AuditLogFiltersProps) {
  const [localFilters, setLocalFilters] = useState(filters)
  const [startDate, setStartDate] = useState<Date | undefined>(
    filters.startDate ? new Date(filters.startDate) : undefined
  )
  const [endDate, setEndDate] = useState<Date | undefined>(
    filters.endDate ? new Date(filters.endDate) : undefined
  )

  const handleFilterChange = <K extends keyof AuditLogFilters>(
    key: K, 
    value: AuditLogFilters[K]
  ) => {
    const newFilters = { ...localFilters, [key]: value }
    setLocalFilters(newFilters)
  }

  const handleDateChange = (type: "start" | "end", date: Date | undefined) => {
    if (type === "start") {
      setStartDate(date)
      handleFilterChange("startDate", date?.toISOString())
    } else {
      setEndDate(date)
      handleFilterChange("endDate", date?.toISOString())
    }
  }

  const handleApplyFilters = () => {
    onFiltersChange(localFilters)
  }

  const handleClearFilters = () => {
    const clearedFilters: AuditLogFilters = {}
    setLocalFilters(clearedFilters)
    setStartDate(undefined)
    setEndDate(undefined)
    onFiltersChange(clearedFilters)
  }

  const hasActiveFilters = Object.keys(localFilters).length > 0

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Search */}
        <div className="space-y-2">
          <Label>Search</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search..."
              value={localFilters.search || ""}
              onChange={(e) => handleFilterChange("search", e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Entity Type */}
        <div className="space-y-2">
          <Label>Entity Type</Label>
          <Select
            value={localFilters.entityType || "all"}
            onValueChange={(value) => handleFilterChange("entityType", value === "all" ? undefined : value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="property">Property</SelectItem>
              <SelectItem value="room">Room</SelectItem>
              <SelectItem value="photo">Photo</SelectItem>
              <SelectItem value="resource">Resource</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Action */}
        <div className="space-y-2">
          <Label>Action</Label>
          <Select
            value={localFilters.action || "all"}
            onValueChange={(value) => handleFilterChange("action", value === "all" ? undefined : value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All actions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All actions</SelectItem>
              <SelectItem value="create">Create</SelectItem>
              <SelectItem value="update">Update</SelectItem>
              <SelectItem value="delete">Delete</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Entity ID */}
        <div className="space-y-2">
          <Label>Entity ID</Label>
          <Input
            placeholder="Entity ID..."
            value={localFilters.entityId || ""}
            onChange={(e) => handleFilterChange("entityId", e.target.value)}
          />
        </div>

        {/* Start Date */}
        <div className="space-y-2">
          <Label>Start Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !startDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate ? format(startDate, "PPP") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={(date) => handleDateChange("start", date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* End Date */}
        <div className="space-y-2">
          <Label>End Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !endDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {endDate ? format(endDate, "PPP") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={(date) => handleDateChange("end", date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <Button onClick={handleApplyFilters}>
          Apply Filters
        </Button>
        {hasActiveFilters && (
          <Button variant="outline" onClick={handleClearFilters}>
            <X className="h-4 w-4 mr-2" />
            Clear Filters
          </Button>
        )}
      </div>
    </div>
  )
}