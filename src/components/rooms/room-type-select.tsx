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
}

export function RoomTypeSelect({
  value,
  onValueChange,
  placeholder = "Select room type",
  className
}: RoomTypeSelectProps) {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
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
      <PopoverContent className="w-[400px] p-0">
        <Command>
          <CommandInput placeholder="Search room types..." />
          <CommandList>
            <CommandEmpty>No room type found.</CommandEmpty>
            {Object.entries(ROOM_CATEGORIES).map(([categoryKey, category]) => (
              <CommandGroup key={categoryKey} heading={category.label}>
                {category.items.map((roomType) => (
                  <CommandItem
                    key={roomType}
                    value={roomType}
                    onSelect={() => {
                      onValueChange(roomType)
                      setOpen(false)
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