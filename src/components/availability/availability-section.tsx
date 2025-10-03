"use client"

import React from 'react'
import { AvailabilityCalendar } from './availability-calendar'
import { BookingForm } from './booking-form'
import { CalendarFullscreenModal } from './calendar-fullscreen-modal'
import { CalendarLegend } from './calendar-legend'
import { AvailabilityRequestsTable } from './availability-requests-table'
import { BookingHistoryTable } from './booking-history-table'
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Plus, Maximize2 } from "lucide-react"
import { format, subMonths, addMonths } from 'date-fns'
import type { PropertyWithRelations } from "@/types"

interface AvailabilitySectionProps {
  property: PropertyWithRelations
}

interface BookingFormState {
  isOpen: boolean
  dateRange?: { start: Date; end: Date }
}

export const AvailabilitySection = React.memo(function AvailabilitySection({ property }: AvailabilitySectionProps) {
  const [currentDate, setCurrentDate] = React.useState(new Date())
  const [calendarView, setCalendarView] = React.useState<'month' | 'year'>('month')
  const [formState, setFormState] = React.useState<BookingFormState>({ isOpen: false })
  const [isFullscreenOpen, setIsFullscreenOpen] = React.useState(false)

  // Navigation handlers
  const handlePrevious = () => {
    setCurrentDate(prev => {
      switch (calendarView) {
        case 'month': return subMonths(prev, 1)
        case 'year': return new Date(prev.getFullYear() - 1, prev.getMonth(), prev.getDate())
        default: return subMonths(prev, 1)
      }
    })
  }

  const handleNext = () => {
    setCurrentDate(prev => {
      switch (calendarView) {
        case 'month': return addMonths(prev, 1)
        case 'year': return new Date(prev.getFullYear() + 1, prev.getMonth(), prev.getDate())
        default: return addMonths(prev, 1)
      }
    })
  }

  const handleToday = () => {
    setCurrentDate(new Date())
  }

  const handleSlotSelect = (dateRange: { start: Date; end: Date }) => {
    setFormState({ isOpen: true, dateRange })
  }

  const handleFormClose = () => {
    setFormState({ isOpen: false })
  }


  return (
    <div className="px-6 py-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-medium text-gray-900">1. Calendar</h1>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePrevious}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-lg font-medium text-gray-900 min-w-[60px] text-center">
              {calendarView === 'year' ? format(currentDate, 'yyyy') : format(currentDate, 'MMM yyyy')}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleNext}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleToday}
            className="h-8 px-3 text-sm"
          >
            Today
          </Button>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-3 text-sm"
            onClick={() => setFormState({ isOpen: true })}
          >
            <Plus className="h-4 w-4 mr-1" />
            New Booking
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => setIsFullscreenOpen(true)}
            title="Expand calendar"
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
          <div className="flex bg-gray-100 rounded border">
            <Button
              variant={calendarView === 'month' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setCalendarView('month')}
              className="rounded-r-none h-8 px-3 text-sm"
            >
              Monthly view
            </Button>
            <Button
              variant={calendarView === 'year' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setCalendarView('year')}
              className="rounded-l-none border-l h-8 px-3 text-sm"
            >
              Yearly view
            </Button>
          </div>
        </div>
      </div>

      <div className="bg-white">
        <AvailabilityCalendar 
          propertyId={property.id} 
          currentDate={currentDate}
          onDateChange={setCurrentDate}
          view={calendarView}
          onSlotSelect={handleSlotSelect}
        />
      </div>

      <BookingForm
        isOpen={formState.isOpen}
        onClose={handleFormClose}
        propertyId={property.id}
        dateRange={formState.dateRange}
      />

      <CalendarFullscreenModal
        isOpen={isFullscreenOpen}
        onClose={() => setIsFullscreenOpen(false)}
        property={property}
        currentDate={currentDate}
        onDateChange={setCurrentDate}
        calendarView={calendarView}
        onSlotSelect={handleSlotSelect}
      />

      <div className="mt-6">
        <CalendarLegend />
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-medium text-gray-900 mb-4">2. Availability request</h2>
        <AvailabilityRequestsTable propertyId={property.id} />
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-medium text-gray-900 mb-4">3. Bookings</h2>
        <BookingHistoryTable propertyId={property.id} />
      </div>
    </div>
  )
})