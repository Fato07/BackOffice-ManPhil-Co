"use client"

import { CustomCalendar } from './custom-calendar'


interface AvailabilityCalendarProps {
  propertyId: string
  onDateSelect?: (date: Date) => void
  onSlotSelect?: (slot: { start: Date; end: Date }) => void
  currentDate: Date
  onDateChange: (date: Date) => void
  view: 'month' | 'year'
}

export function AvailabilityCalendar({ 
  propertyId, 
  onDateSelect, 
  onSlotSelect,
  currentDate,
  onDateChange,
  view
}: AvailabilityCalendarProps) {
  return (
    <CustomCalendar
      propertyId={propertyId}
      currentDate={currentDate}
      onDateChange={onDateChange}
      onDateSelect={onDateSelect}
      onSlotSelect={onSlotSelect}
      view={view}
    />
  )
}