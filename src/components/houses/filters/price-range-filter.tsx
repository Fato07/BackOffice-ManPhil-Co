import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

interface PriceRangeFilterProps {
  minPrice?: number
  maxPrice?: number
  onPriceChange: (min?: number, max?: number) => void
  className?: string
}

export function PriceRangeFilter({
  minPrice,
  maxPrice,
  onPriceChange,
  className
}: PriceRangeFilterProps) {
  const handleMinPriceChange = (value: string) => {
    const numValue = value ? parseInt(value) : undefined
    onPriceChange(numValue, maxPrice)
  }

  const handleMaxPriceChange = (value: string) => {
    const numValue = value ? parseInt(value) : undefined
    onPriceChange(minPrice, numValue)
  }

  return (
    <div className={cn("space-y-2", className)}>
      <Label className="text-sm text-muted-foreground">Price Range (€)</Label>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Min</Label>
          <Input
            type="number"
            min={0}
            value={minPrice || ""}
            onChange={(e) => handleMinPriceChange(e.target.value)}
            placeholder="Any"
            className="h-8 text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Max</Label>
          <Input
            type="number"
            min={0}
            value={maxPrice || ""}
            onChange={(e) => handleMaxPriceChange(e.target.value)}
            placeholder="Any"
            className="h-8 text-sm"
          />
        </div>
      </div>
    </div>
  )
}