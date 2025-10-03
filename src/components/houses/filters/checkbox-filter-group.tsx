import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

interface FilterItem {
  value: string
  label: string
  description?: string
}

interface CheckboxFilterGroupProps {
  label: string
  items: FilterItem[]
  selectedValues: string[]
  onSelectionChange: (values: string[]) => void
  className?: string
  gridClassName?: string
}

export function CheckboxFilterGroup({
  label,
  items,
  selectedValues,
  onSelectionChange,
  className,
  gridClassName = "grid gap-2"
}: CheckboxFilterGroupProps) {
  const handleCheckedChange = (value: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedValues, value])
    } else {
      onSelectionChange(selectedValues.filter(v => v !== value))
    }
  }

  return (
    <div className={cn("space-y-2", className)}>
      <Label className="text-sm text-muted-foreground">{label}</Label>
      <div className={gridClassName}>
        {items.map((item) => (
          <label
            key={item.value}
            htmlFor={`filter-${item.value}`}
            className="flex items-center gap-2 cursor-pointer group py-1"
          >
            <Checkbox
              id={`filter-${item.value}`}
              checked={selectedValues.includes(item.value)}
              onCheckedChange={(checked) => handleCheckedChange(item.value, !!checked)}
              className="h-4 w-4"
            />
            <div className="flex flex-col">
              <span className="text-sm group-hover:text-foreground transition-colors">
                {item.label}
              </span>
              {item.description && (
                <span className="text-xs text-muted-foreground">
                  {item.description}
                </span>
              )}
            </div>
          </label>
        ))}
      </div>
    </div>
  )
}