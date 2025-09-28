"use client"

import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { ServiceFrequency, ServiceSchedule } from "@/types/property"
import { Clock } from "lucide-react"

interface ServiceScheduleSelectorProps {
  label: string
  value?: ServiceSchedule
  onChange: (schedule: ServiceSchedule) => void
  showArrivalTime?: boolean
  disabled?: boolean
  className?: string
}

const frequencyOptions: { value: ServiceFrequency; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Bi-weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'custom', label: 'Custom' },
]

export function ServiceScheduleSelector({
  label,
  value = { frequency: 'none' },
  onChange,
  showArrivalTime = false,
  disabled = false,
  className = "",
}: ServiceScheduleSelectorProps) {
  const handleFrequencyChange = (frequency: ServiceFrequency) => {
    onChange({ ...value, frequency })
  }

  const handleCustomScheduleChange = (customSchedule: string) => {
    onChange({ ...value, customSchedule })
  }

  const handleArrivalTimeChange = (arrivalTime: string) => {
    onChange({ ...value, arrivalTime })
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div>
        <Label>{label}</Label>
        <Select
          value={value.frequency}
          onValueChange={handleFrequencyChange}
          disabled={disabled}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select frequency" />
          </SelectTrigger>
          <SelectContent>
            {frequencyOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {value.frequency === 'custom' && (
        <div>
          <Label>Custom Schedule</Label>
          <Input
            type="text"
            value={value.customSchedule || ''}
            onChange={(e) => handleCustomScheduleChange(e.target.value)}
            placeholder="e.g., Every Tuesday and Friday"
            disabled={disabled}
          />
        </div>
      )}

      {showArrivalTime && value.frequency !== 'none' && (
        <div>
          <Label className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Arrival Time
          </Label>
          <Input
            type="time"
            value={value.arrivalTime || ''}
            onChange={(e) => handleArrivalTimeChange(e.target.value)}
            disabled={disabled}
          />
        </div>
      )}
    </div>
  )
}