"use client"

import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { CustomCalendar } from './custom-calendar'
import { CalendarLegend } from './calendar-legend'
import { ChevronLeft, ChevronRight, X } from "lucide-react"
import { format, subMonths, addMonths } from 'date-fns'
import type { PropertyWithRelations } from "@/types"

interface CalendarFullscreenModalProps {
  isOpen: boolean
  onClose: () => void
  property: PropertyWithRelations
  currentDate: Date
  onDateChange: (date: Date | ((prevDate: Date) => Date)) => void
  calendarView: 'month' | 'year'
  onSlotSelect?: (slot: { start: Date; end: Date }) => void
}

export function CalendarFullscreenModal({
  isOpen,
  onClose,
  property,
  currentDate,
  onDateChange,
  calendarView,
  onSlotSelect
}: CalendarFullscreenModalProps) {
  
  // Navigation handlers
  const handlePrevious = () => {
    onDateChange((prev: Date) => {
      switch (calendarView) {
        case 'month': return subMonths(prev, 1)
        case 'year': return new Date(prev.getFullYear() - 1, prev.getMonth(), prev.getDate())
        default: return subMonths(prev, 1)
      }
    })
  }

  const handleNext = () => {
    onDateChange((prev: Date) => {
      switch (calendarView) {
        case 'month': return addMonths(prev, 1)
        case 'year': return new Date(prev.getFullYear() + 1, prev.getMonth(), prev.getDate())
        default: return addMonths(prev, 1)
      }
    })
  }

  const handleToday = () => {
    onDateChange(new Date())
  }

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      onClose()
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault()
      handlePrevious()
    } else if (event.key === 'ArrowRight') {
      event.preventDefault()
      handleNext()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="w-screen h-screen p-0 gap-0"
        showCloseButton={false}
        onKeyDown={handleKeyDown}
      >
        <DialogHeader className="px-6 py-4 border-b border-gray-100/50 bg-gradient-to-r from-gray-50/30 to-gray-50/10">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-serif tracking-wide text-gray-800">
              Calendar - {property.name}
            </DialogTitle>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handlePrevious}
                  className="h-9 w-9 p-0"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <span className="text-lg font-medium text-gray-900 min-w-[80px] text-center">
                  {calendarView === 'year' ? format(currentDate, 'yyyy') : format(currentDate, 'MMM yyyy')}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleNext}
                  className="h-9 w-9 p-0"
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleToday}
                className="h-9 px-4 text-sm"
              >
                Today
              </Button>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-9 w-9 p-0"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 p-4 flex flex-col min-h-0">
          <div className="w-full h-full min-h-0">
            <CustomCalendar
              propertyId={property.id}
              currentDate={currentDate}
              onDateChange={onDateChange}
              view={calendarView}
              onSlotSelect={onSlotSelect}
              enlarged={true}
            />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100/50 bg-gradient-to-r from-gray-50/20 to-transparent">
          <CalendarLegend />
        </div>
      </DialogContent>
    </Dialog>
  )
}