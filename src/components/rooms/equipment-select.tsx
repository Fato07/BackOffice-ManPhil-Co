"use client"

import { useState } from "react"
import { Check, ChevronsUpDown, Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { EquipmentType } from "@/generated/prisma"
import { EQUIPMENT_CATEGORIES, getEquipmentLabel } from "@/lib/constants/equipment"

interface EquipmentItem {
  name: string
  quantity: number
}

interface EquipmentCategory {
  category: string
  items: EquipmentItem[]
}

interface EquipmentSelectProps {
  value: EquipmentCategory[]
  onValueChange: (value: EquipmentCategory[]) => void
  className?: string
  roomType?: string
}

export function EquipmentSelect({
  value,
  onValueChange,
  className
}: EquipmentSelectProps) {
  const [open, setOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedEquipment, setSelectedEquipment] = useState<EquipmentType | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [search, setSearch] = useState("")

  const handleAddEquipment = () => {
    if (!selectedCategory || !selectedEquipment) return

    const newValue = [...value]
    const categoryIndex = newValue.findIndex(c => c.category === selectedCategory)
    
    if (categoryIndex === -1) {
      // Create new category
      newValue.push({
        category: selectedCategory,
        items: [{
          name: getEquipmentLabel(selectedEquipment),
          quantity
        }]
      })
    } else {
      // Add to existing category
      const existingItemIndex = newValue[categoryIndex].items.findIndex(
        item => item.name === getEquipmentLabel(selectedEquipment)
      )
      
      if (existingItemIndex === -1) {
        newValue[categoryIndex].items.push({
          name: getEquipmentLabel(selectedEquipment),
          quantity
        })
      } else {
        // Update quantity if item already exists
        newValue[categoryIndex].items[existingItemIndex].quantity += quantity
      }
    }
    
    onValueChange(newValue)
    setSelectedEquipment(null)
    setQuantity(1)
    setOpen(false)
  }

  const handleRemoveItem = (categoryIndex: number, itemIndex: number) => {
    const newValue = [...value]
    newValue[categoryIndex].items.splice(itemIndex, 1)
    
    // Remove category if no items left
    if (newValue[categoryIndex].items.length === 0) {
      newValue.splice(categoryIndex, 1)
    }
    
    onValueChange(newValue)
  }

  const getAllSelectedEquipment = () => {
    const selected = new Set<string>()
    value.forEach(cat => {
      cat.items.forEach(item => {
        selected.add(item.name)
      })
    })
    return selected
  }

  const selectedEquipmentSet = getAllSelectedEquipment()

  // Filter equipment based on search
  const getFilteredCategories = () => {
    if (!search) return EQUIPMENT_CATEGORIES
    
    const searchLower = search.toLowerCase()
    const filtered: typeof EQUIPMENT_CATEGORIES = {} as any
    
    Object.entries(EQUIPMENT_CATEGORIES).forEach(([categoryKey, category]) => {
      const filteredItems = category.items.filter(item => {
        const label = getEquipmentLabel(item).toLowerCase()
        return label.includes(searchLower) || item.toLowerCase().includes(searchLower)
      })
      
      if (filteredItems.length > 0) {
        filtered[categoryKey as keyof typeof EQUIPMENT_CATEGORIES] = {
          label: category.label,
          items: filteredItems as any
        }
      }
    })
    
    return filtered
  }

  const filteredCategories = getFilteredCategories()

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="justify-between"
            >
              Add equipment
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[500px] max-h-[500px] p-0 z-[100]" align="start" side="bottom" avoidCollisions={true} sideOffset={5}>
            <Command className="max-h-full overflow-hidden rounded-md border" shouldFilter={false}>
              <CommandInput 
                placeholder="Search equipment..." 
                value={search}
                onValueChange={setSearch}
              />
              <CommandList className="max-h-[calc(500px-3rem)] overflow-y-auto">
                <CommandEmpty>No equipment found.</CommandEmpty>
                {Object.entries(filteredCategories).map(([categoryKey, category]) => (
                  <CommandGroup key={categoryKey} heading={category.label}>
                    {category.items.map((equipment) => {
                      const isSelected = selectedEquipmentSet.has(getEquipmentLabel(equipment))
                      return (
                        <CommandItem
                          key={equipment}
                          value={equipment}
                          onSelect={() => {
                            setSelectedCategory(category.label)
                            setSelectedEquipment(equipment)
                            setOpen(false)
                            setSearch("")
                          }}
                          disabled={isSelected}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedEquipment === equipment ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <span className={cn(isSelected && "text-muted-foreground line-through")}>
                            {getEquipmentLabel(equipment)}
                          </span>
                          {isSelected && (
                            <Badge variant="secondary" className="ml-auto">
                              Added
                            </Badge>
                          )}
                        </CommandItem>
                      )
                    })}
                  </CommandGroup>
                ))}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {selectedEquipment && (
          <div className="flex items-center gap-2">
            <Badge variant="outline">{getEquipmentLabel(selectedEquipment)}</Badge>
            <Input
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              className="w-20"
              placeholder="Qty"
            />
            <Button size="sm" onClick={handleAddEquipment}>
              <Plus className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setSelectedEquipment(null)
                setQuantity(1)
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      <div className="space-y-3">
        {value.map((category, catIndex) => (
          <div key={catIndex} className="border rounded-lg p-3">
            <h4 className="font-medium text-sm mb-2">{category.category}</h4>
            <div className="flex flex-wrap gap-2">
              {category.items.map((item, itemIndex) => (
                <Badge
                  key={itemIndex}
                  variant="secondary"
                  className="flex items-center gap-1"
                >
                  {item.name} ({item.quantity})
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-4 w-4 p-0 hover:bg-transparent"
                    onClick={() => handleRemoveItem(catIndex, itemIndex)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          </div>
        ))}
        
        {value.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No equipment added yet
          </p>
        )}
      </div>
    </div>
  )
}