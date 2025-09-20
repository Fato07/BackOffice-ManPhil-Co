"use client"

import { Car, Mountain, FootprintsIcon } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { AccessibilityType } from "@/generated/prisma"
import { ACCESSIBILITY_OPTIONS, getAccessibilityLabel } from "@/lib/constants/equipment"
import { cn } from "@/lib/utils"

interface AccessibilitySelectProps {
  value: AccessibilityType[]
  onValueChange: (value: AccessibilityType[]) => void
  className?: string
}

const AccessibilityIcons = {
  BY_CAR: Car,
  SKI_IN_SKI_OUT: Mountain,
  BY_FOOT: FootprintsIcon
}

export function AccessibilitySelect({ value, onValueChange, className }: AccessibilitySelectProps) {
  const handleToggle = (accessibilityType: AccessibilityType) => {
    if (value.includes(accessibilityType)) {
      onValueChange(value.filter(type => type !== accessibilityType))
    } else {
      onValueChange([...value, accessibilityType])
    }
  }

  return (
    <div className={cn("space-y-3", className)}>
      <Label className="text-sm font-medium">Accessibility Options</Label>
      <div className="grid gap-3">
        {ACCESSIBILITY_OPTIONS.map((option) => {
          const Icon = AccessibilityIcons[option.value]
          const isSelected = value.includes(option.value)
          
          return (
            <label
              key={option.value}
              htmlFor={`accessibility-${option.value}`}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                isSelected 
                  ? "border-primary bg-primary/5" 
                  : "border-border hover:bg-muted/50"
              )}
            >
              <Checkbox
                id={`accessibility-${option.value}`}
                checked={isSelected}
                onCheckedChange={() => handleToggle(option.value)}
                className="h-4 w-4"
              />
              <Icon className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <div className="font-medium text-sm">{option.label}</div>
                <div className="text-xs text-muted-foreground">{option.description}</div>
              </div>
            </label>
          )
        })}
      </div>
    </div>
  )
}

interface AccessibilityDisplayProps {
  accessibilityOptions: AccessibilityType[]
  className?: string
  variant?: "badges" | "icons" | "list"
}

export function AccessibilityDisplay({ 
  accessibilityOptions, 
  className,
  variant = "badges" 
}: AccessibilityDisplayProps) {
  if (!accessibilityOptions.length) {
    return <span className="text-muted-foreground text-sm">No accessibility options</span>
  }

  if (variant === "icons") {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        {accessibilityOptions.map((option) => {
          const Icon = AccessibilityIcons[option]
          return (
            <span key={option} title={getAccessibilityLabel(option)}>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </span>
          )
        })}
      </div>
    )
  }

  if (variant === "list") {
    return (
      <div className={cn("space-y-1", className)}>
        {accessibilityOptions.map((option) => (
          <div key={option} className="text-sm">
            {getAccessibilityLabel(option)}
          </div>
        ))}
      </div>
    )
  }

  // Default badges variant
  return (
    <div className={cn("flex flex-wrap gap-1", className)}>
      {accessibilityOptions.map((option) => (
        <Badge key={option} variant="secondary" className="text-xs">
          {getAccessibilityLabel(option)}
        </Badge>
      ))}
    </div>
  )
}