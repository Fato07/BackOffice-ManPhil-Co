"use client"

import { useState } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { EquipmentRequestFilters, EquipmentRequestStatus, EquipmentRequestPriority } from "@/types/equipment-request"
import { Badge } from "@/components/ui/badge"

interface EquipmentRequestFiltersProps {
  filters: EquipmentRequestFilters
  onFiltersChange: (filters: EquipmentRequestFilters) => void
}

export function EquipmentRequestFilters({
  filters,
  onFiltersChange,
}: EquipmentRequestFiltersProps) {
  const [localFilters, setLocalFilters] = useState<EquipmentRequestFilters>(filters)

  const handleFilterChange = (key: keyof EquipmentRequestFilters, value: any) => {
    const newFilters = { ...localFilters, [key]: value }
    setLocalFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const statusOptions: Array<{ value: EquipmentRequestStatus | "ALL"; label: string }> = [
    { value: "ALL", label: "All Status" },
    { value: "PENDING", label: "Pending" },
    { value: "APPROVED", label: "Approved" },
    { value: "REJECTED", label: "Rejected" },
    { value: "ORDERED", label: "Ordered" },
    { value: "DELIVERED", label: "Delivered" },
    { value: "CANCELLED", label: "Cancelled" },
  ]

  const priorityOptions: Array<{ value: EquipmentRequestPriority | "ALL"; label: string }> = [
    { value: "ALL", label: "All Priority" },
    { value: "LOW", label: "Low" },
    { value: "MEDIUM", label: "Medium" },
    { value: "HIGH", label: "High" },
    { value: "URGENT", label: "Urgent" },
  ]

  return (
    <div className="flex flex-wrap gap-2">
      {/* Status Filter */}
      <Select
        value={localFilters.status || "ALL"}
        onValueChange={(value) => handleFilterChange("status", value as EquipmentRequestStatus | "ALL")}
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          {statusOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Priority Filter */}
      <Select
        value={localFilters.priority || "ALL"}
        onValueChange={(value) => handleFilterChange("priority", value as EquipmentRequestPriority | "ALL")}
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Priority" />
        </SelectTrigger>
        <SelectContent>
          {priorityOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Date From Filter */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-[140px] justify-start text-left font-normal",
              !localFilters.dateFrom && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {localFilters.dateFrom ? (
              format(localFilters.dateFrom, "PPP")
            ) : (
              <span>From date</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={localFilters.dateFrom}
            onSelect={(date) => handleFilterChange("dateFrom", date)}
            initialFocus
          />
        </PopoverContent>
      </Popover>

      {/* Date To Filter */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-[140px] justify-start text-left font-normal",
              !localFilters.dateTo && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {localFilters.dateTo ? (
              format(localFilters.dateTo, "PPP")
            ) : (
              <span>To date</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={localFilters.dateTo}
            onSelect={(date) => handleFilterChange("dateTo", date)}
            initialFocus
          />
        </PopoverContent>
      </Popover>

      {/* Active filter summary */}
      {(localFilters.status && localFilters.status !== "ALL") && (
        <Badge variant="secondary" className="ml-auto text-[10px] py-0 px-1.5 h-5">
          Status: {localFilters.status}
        </Badge>
      )}
      {(localFilters.priority && localFilters.priority !== "ALL") && (
        <Badge variant="secondary" className="text-[10px] py-0 px-1.5 h-5">
          Priority: {localFilters.priority}
        </Badge>
      )}
    </div>
  )
}