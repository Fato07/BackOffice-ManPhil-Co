import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/utils"

interface RangeFilterProps {
  label: string
  min: number
  max: number
  step?: number
  value: [number, number]
  onValueChange: (values: [number, number]) => void
  defaultMin: number
  defaultMax: number
  className?: string
}

export function RangeFilter({
  label,
  min,
  max,
  step = 1,
  value,
  onValueChange,
  defaultMin,
  defaultMax,
  className
}: RangeFilterProps) {
  const handleValueChange = ([minVal, maxVal]: number[]) => {
    onValueChange([
      minVal === defaultMin ? defaultMin : minVal,
      maxVal === defaultMax ? defaultMax : maxVal
    ])
  }

  return (
    <div className={cn("space-y-2", className)}>
      <Label className="text-sm text-muted-foreground">{label}</Label>
      <div className="space-y-3">
        <Slider
          min={min}
          max={max}
          step={step}
          value={value}
          onValueChange={handleValueChange}
          className="[&_[role=slider]]:h-3.5 [&_[role=slider]]:w-3.5 [&_[role=slider]]:border-[#B5985A]/20 [&_[role=slider]]:bg-white [&_[role=slider]]:shadow-sm [&_[role=slider]:focus-visible]:ring-[#B5985A]/20 [&_[role=slider]:focus-visible]:ring-offset-0 [&_[role=slider]:hover]:border-[#B5985A] [&_.range]:bg-[#B5985A]"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{value[0]}</span>
          <span>{value[1]}</span>
        </div>
      </div>
    </div>
  )
}