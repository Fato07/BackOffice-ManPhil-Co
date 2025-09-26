"use client"

import { useState } from "react"
import { Check, ChevronsUpDown, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { RoomType } from "@/generated/prisma"
import { ROOM_CATEGORIES, getRoomTypeLabel } from "@/lib/constants/equipment"

interface RoomTypeSelectProps {
  value?: RoomType
  onValueChange: (value: RoomType) => void
  placeholder?: string
  className?: string
  filterTypes?: RoomType[]
}

export function RoomTypeSelect({
  value,
  onValueChange,
  placeholder = "Select room type",
  className,
  filterTypes
}: RoomTypeSelectProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")

  // Filter categories to only show relevant room types
  const getFilteredCategories = () => {
    if (!filterTypes) return ROOM_CATEGORIES
    
    const filtered: typeof ROOM_CATEGORIES = {} as any
    
    Object.entries(ROOM_CATEGORIES).forEach(([categoryKey, category]) => {
      const filteredItems = category.items.filter(item => filterTypes.includes(item))
      if (filteredItems.length > 0) {
        filtered[categoryKey as keyof typeof ROOM_CATEGORIES] = {
          label: category.label,
          items: filteredItems as any
        }
      }
    })
    
    return filtered
  }

  const filteredCategories = getFilteredCategories()

  // Filter categories based on search
  const getSearchFilteredCategories = () => {
    if (!search) return filteredCategories
    
    const searchLower = search.toLowerCase()
    const filtered: typeof ROOM_CATEGORIES = {} as any
    
    Object.entries(filteredCategories).forEach(([categoryKey, category]) => {
      const filteredItems = category.items.filter(item => {
        const label = getRoomTypeLabel(item).toLowerCase()
        return label.includes(searchLower) || item.toLowerCase().includes(searchLower)
      })
      
      if (filteredItems.length > 0) {
        filtered[categoryKey as keyof typeof ROOM_CATEGORIES] = {
          label: category.label,
          items: filteredItems as any
        }
      }
    })
    
    return filtered
  }

  const searchFilteredCategories = getSearchFilteredCategories()

  return (
    <Popover open={open} onOpenChange={setOpen} modal={true}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("justify-between", className)}
        >
          {value ? getRoomTypeLabel(value) : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] max-h-[400px] p-0 z-[100]" align="start" side="bottom" avoidCollisions={true} sideOffset={5}>
        <Command className="max-h-full overflow-hidden rounded-md border" shouldFilter={false}>
          <CommandInput 
            placeholder="Search room types..." 
            value={search}
            onValueChange={setSearch}
          />
          <CommandList className="max-h-[calc(400px-3rem)] overflow-y-auto">
            <CommandEmpty>No room type found.</CommandEmpty>
            {Object.entries(searchFilteredCategories).map(([categoryKey, category]) => (
              <CommandGroup key={categoryKey} heading={category.label}>
                {category.items.map((roomType) => (
                  <CommandItem
                    key={roomType}
                    value={roomType}
                    onSelect={() => {
                      onValueChange(roomType)
                      setOpen(false)
                      setSearch("")
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === roomType ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {getRoomTypeLabel(roomType)}
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

interface RoomTypeDisplayProps {
  roomType: RoomType
  className?: string
}

export function RoomTypeDisplay({ roomType, className }: RoomTypeDisplayProps) {
  // Find which category this room type belongs to
  const category = Object.entries(ROOM_CATEGORIES).find(([_, cat]) => 
    cat.items.includes(roomType)
  )?.[1]

  const categoryColors = {
    "Living Spaces": "bg-blue-100 text-blue-800",
    "Bedrooms": "bg-green-100 text-green-800", 
    "Bathrooms": "bg-cyan-100 text-cyan-800",
    "Entertainment": "bg-purple-100 text-purple-800",
    "Wellness & Spa": "bg-pink-100 text-pink-800",
    "Outdoor Spaces": "bg-emerald-100 text-emerald-800",
    "Sports Facilities": "bg-orange-100 text-orange-800",
    "Utility Rooms": "bg-gray-100 text-gray-800"
  }

  const colorClass = category ? categoryColors[category.label as keyof typeof categoryColors] : "bg-gray-100 text-gray-800"

  return (
    <Badge variant="secondary" className={cn(colorClass, "text-xs", className)}>
      {getRoomTypeLabel(roomType)}
    </Badge>
  )
}