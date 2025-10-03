"use client"

import { useState, useEffect } from "react"
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
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { CalendarIcon, Filter, X } from "lucide-react"
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
  const [isOpen, setIsOpen] = useState(false)

  // Sync local filters with incoming filters
  useEffect(() => {
    setLocalFilters(filters)
    setStartDate(filters.startDate ? new Date(filters.startDate) : undefined)
    setEndDate(filters.endDate ? new Date(filters.endDate) : undefined)
  }, [filters])

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

  const activeFilterCount = [
    localFilters.entityType,
    localFilters.entityId,
    localFilters.action,
    localFilters.userId,
    localFilters.startDate,
    localFilters.endDate
  ].filter(Boolean).length

  const hasActiveFilters = activeFilterCount > 0

  const applyAndClose = () => {
    onFiltersChange(localFilters)
    setIsOpen(false)
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Filter className="h-4 w-4" />
          Filters
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="ml-1">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md p-0">
        <SheetHeader className="px-4 py-4 border-b">
          <SheetTitle className="text-lg">Filter Audit Logs</SheetTitle>
          <SheetDescription className="text-sm">
            Filter by entity type, action, date range, and more
          </SheetDescription>
        </SheetHeader>
        
        <ScrollArea className="h-[calc(100vh-160px)]">
          <div className="space-y-4 p-4 pb-8">

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

          <div className="space-y-2">
            <Label>Entity ID</Label>
            <Input
              placeholder="Entity ID..."
              value={localFilters.entityId || ""}
              onChange={(e) => handleFilterChange("entityId", e.target.value)}
            />
          </div>

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
        </ScrollArea>

        <div className="absolute bottom-0 left-0 right-0 p-4 bg-background border-t">
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleClearFilters}
              className="flex-1"
            >
              Clear All
            </Button>
            <Button
              onClick={applyAndClose}
              className="flex-1 bg-[#B5985A] hover:bg-[#B5985A]/90 text-white"
            >
              Apply Filters
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}