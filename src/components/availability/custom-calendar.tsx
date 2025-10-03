"use client"

import { useMemo, useState } from 'react'
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  addDays, 
  isSameMonth, 
  isSameDay, 
  isToday,
  addMonths 
} from 'date-fns'
import { useBookings } from "@/hooks/use-bookings"
import { BookingType } from "@/generated/prisma"
import { GlassCard } from "@/components/ui/glass-card"
import { BOOKING_TYPE_COLORS } from "@/lib/validations/booking"
import { EnhancedCalendarDay } from "./enhanced-calendar-day"
import { cn } from "@/lib/utils"

interface CustomCalendarProps {
  propertyId: string
  currentDate: Date
  onDateChange: (date: Date) => void
  onDateSelect?: (date: Date) => void
  onBookingSelect?: (booking: any) => void
  onSlotSelect?: (slot: { start: Date; end: Date }) => void
  view?: 'month' | 'year'
  enlarged?: boolean
}

interface CalendarDay {
  date: Date
  isCurrentMonth: boolean
  isToday: boolean
  bookings: any[]
  primaryBookingType?: BookingType
}

export function CustomCalendar({
  propertyId,
  currentDate,
  onDateChange,
  onDateSelect,
  onBookingSelect,
  onSlotSelect,
  view = 'month',
  enlarged = false
}: CustomCalendarProps) {
  
  // Calculate date range for fetching bookings
  const dateRange = useMemo(() => {
    if (view === 'year') {
      // For yearly view, get entire year's data
      const start = startOfMonth(new Date(currentDate.getFullYear(), 0, 1))
      const end = endOfMonth(new Date(currentDate.getFullYear(), 11, 31))
      return { start, end }
    } else {
      // For monthly view, get current and next month
      const start = startOfMonth(currentDate)
      const end = endOfMonth(addMonths(currentDate, 1))
      return { start, end }
    }
  }, [currentDate, view])

  const { data: bookingData, isLoading } = useBookings({
    propertyId,
    startDate: dateRange.start,
    endDate: dateRange.end,
    page: 1,
    limit: 1000,
    sortBy: 'startDate',
    sortOrder: 'asc',
  })

  const bookings = bookingData?.bookings || []

  // Generate calendar days for current month
  const currentMonthDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(currentDate)
    const startDate = startOfWeek(monthStart)
    const endDate = endOfWeek(monthEnd)

    const days: CalendarDay[] = []
    let day = startDate

    while (day <= endDate) {
      const dayBookings = bookings.filter(booking => {
        const bookingStart = new Date(booking.startDate)
        const bookingEnd = new Date(booking.endDate)
        return day >= bookingStart && day <= bookingEnd
      })

      days.push({
        date: new Date(day),
        isCurrentMonth: isSameMonth(day, monthStart),
        isToday: isToday(day),
        bookings: dayBookings,
        primaryBookingType: dayBookings[0]?.type // Use first booking's type for cell color
      })

      day = addDays(day, 1)
    }

    return days
  }, [currentDate, bookings])

  // Generate calendar days for next month
  const nextMonthDays = useMemo(() => {
    const nextMonth = addMonths(currentDate, 1)
    const monthStart = startOfMonth(nextMonth)
    const monthEnd = endOfMonth(nextMonth)
    const startDate = startOfWeek(monthStart)
    const endDate = endOfWeek(monthEnd)

    const days: CalendarDay[] = []
    let day = startDate

    while (day <= endDate) {
      const dayBookings = bookings.filter(booking => {
        const bookingStart = new Date(booking.startDate)
        const bookingEnd = new Date(booking.endDate)
        return day >= bookingStart && day <= bookingEnd
      })

      days.push({
        date: new Date(day),
        isCurrentMonth: isSameMonth(day, monthStart),
        isToday: isToday(day),
        bookings: dayBookings,
        primaryBookingType: dayBookings[0]?.type
      })

      day = addDays(day, 1)
    }

    return days
  }, [currentDate, bookings])

  // Generate calendar data for yearly view (12 months)
  const yearlyMonths = useMemo(() => {
    if (view !== 'year') return []
    
    const months = []
    for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
      const monthDate = new Date(currentDate.getFullYear(), monthIndex, 1)
      const monthStart = startOfMonth(monthDate)
      const monthEnd = endOfMonth(monthDate)
      const startDate = startOfWeek(monthStart)
      const endDate = endOfWeek(monthEnd)

      const days: CalendarDay[] = []
      let day = startDate

      while (day <= endDate) {
        const dayBookings = bookings.filter(booking => {
          const bookingStart = new Date(booking.startDate)
          const bookingEnd = new Date(booking.endDate)
          return day >= bookingStart && day <= bookingEnd
        })

        days.push({
          date: new Date(day),
          isCurrentMonth: isSameMonth(day, monthStart),
          isToday: isToday(day),
          bookings: dayBookings,
          primaryBookingType: dayBookings[0]?.type
        })

        day = addDays(day, 1)
      }

      months.push({
        monthDate,
        days
      })
    }
    
    return months
  }, [currentDate, bookings, view])

  // Get luxury styling based on booking type
  const getCellStyling = (bookingType?: BookingType) => {
    if (!bookingType) {
      return {
        bg: 'bg-white/80',
        border: 'border-gray-100/50',
        text: 'text-gray-700',
        shadow: '',
        hover: 'hover:bg-white/90 hover:shadow-sm hover:scale-[1.01]',
      }
    }
    
    const colors = BOOKING_TYPE_COLORS[bookingType]
    return {
      bg: colors.bg,
      border: colors.border,
      text: colors.text,
      shadow: colors.shadow,
      hover: colors.hover + ' hover:scale-[1.01]',
    }
  }

  // Handle date click - enhance for EnhancedCalendarDay integration
  const handleDateClick = (day: CalendarDay) => {
    if (day.bookings.length > 0) {
      onBookingSelect?.(day.bookings[0])
    } else {
      onDateSelect?.(day.date)
      onSlotSelect?.({ start: day.date, end: addDays(day.date, 1) })
    }
  }

  // Enhanced date click handler for EnhancedCalendarDay
  const handleEnhancedDateClick = (date: Date) => {
    onDateSelect?.(date)
  }

  // Render individual month with luxury styling
  const renderMonth = (days: CalendarDay[], monthDate: Date) => (
    <div className={cn(
      "flex-1",
      enlarged ? "flex flex-col h-full" : ""
    )}>
      <div className={cn(
        "text-center font-serif tracking-wide text-gray-800 border-b border-gray-100/50 bg-gradient-to-r from-gray-50/30 to-gray-50/10",
        enlarged ? "py-8 text-2xl" : "py-6 text-xl"
      )}>
        {format(monthDate, 'MMMM yyyy')}
      </div>

      <div className="grid grid-cols-7 border-b border-gray-100/30">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
          <div key={day} className={cn(
            "text-center font-medium tracking-wider text-gray-500 bg-gray-50/20",
            enlarged ? "py-4 px-3 text-sm" : "py-3 px-2 text-xs"
          )}>
            {day}
          </div>
        ))}
      </div>

      <div className={cn(
        "grid grid-cols-7 gap-px bg-gray-100/20",
        enlarged ? "grid-rows-6 flex-1" : ""
      )}>
        {days.map((day, index) => (
          <EnhancedCalendarDay
            key={index}
            date={day.date}
            propertyId={propertyId}
            isCurrentMonth={day.isCurrentMonth}
            isToday={day.isToday}
            bookings={day.bookings}
            primaryBookingType={day.primaryBookingType}
            enlarged={enlarged}
            onDateClick={handleEnhancedDateClick}
            onSlotSelect={onSlotSelect}
          />
        ))}
      </div>
    </div>
  )

  if (isLoading) {
    return (
      <GlassCard variant="luxury" className="h-96">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-amber-300 border-t-transparent mx-auto"></div>
            <p className="text-gray-600 mt-3 text-sm font-medium tracking-wide">Loading calendar...</p>
          </div>
        </div>
      </GlassCard>
    )
  }

  // Render yearly view with luxury styling
  if (view === 'year') {
    return (
      <GlassCard variant="luxury">
        <div className={cn(
          "grid gap-8 p-8",
          enlarged ? 
            "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : 
            "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        )}>
          {yearlyMonths.map(({ monthDate, days }, index) => (
            <GlassCard key={index} variant="light" className="overflow-hidden hover:scale-[1.02] transition-transform duration-300">
              <div className={cn(
                "text-center font-serif tracking-wide text-gray-800 border-b border-gray-100/50 bg-gradient-to-r from-gray-50/20 to-transparent",
                enlarged ? "py-4 text-base" : "py-3 text-sm"
              )}>
                {format(monthDate, 'MMM yyyy')}
              </div>

              <div className={cn(
                "grid grid-cols-7 text-gray-500 bg-gray-50/10 border-b border-gray-100/30",
                enlarged ? "text-sm" : "text-xs"
              )}>
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                  <div key={index} className={cn(
                    "text-center font-medium tracking-wider",
                    enlarged ? "py-2.5" : "py-1.5"
                  )}>
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-px bg-gray-100/10">
                {days.map((day, dayIndex) => (
                  <EnhancedCalendarDay
                    key={dayIndex}
                    date={day.date}
                    propertyId={propertyId}
                    isCurrentMonth={day.isCurrentMonth}
                    isToday={day.isToday}
                    bookings={day.bookings}
                    primaryBookingType={day.primaryBookingType}
                    enlarged={false} // Use compact mode for yearly view
                    onDateClick={handleEnhancedDateClick}
                    onSlotSelect={onSlotSelect}
                  />
                ))}
              </div>
            </GlassCard>
          ))}
        </div>
      </GlassCard>
    )
  }

  // Monthly view with luxury glass design
  return (
    <GlassCard variant="luxury" className={cn(
      "overflow-hidden",
      enlarged ? "h-full flex flex-col" : ""
    )}>
      <div className={cn(
        "gap-px bg-gray-100/10",
        enlarged ? 
          "grid grid-cols-1 xl:grid-cols-2 gap-8 h-full" : 
          "grid grid-cols-1 lg:grid-cols-2"
      )}>
        {renderMonth(currentMonthDays, currentDate)}
        {renderMonth(nextMonthDays, addMonths(currentDate, 1))}
      </div>
    </GlassCard>
  )
}