"use client"

import React, { useState, useMemo } from 'react'
import { format, addDays, isSameDay } from 'date-fns'
import { cn } from "@/lib/utils"
import { useAdvancedAvailability } from "@/hooks/use-bookings"
import { BOOKING_TYPE_COLORS } from "@/lib/validations/booking"
import { BookingType } from "@/generated/prisma"
import { AlertTriangle, Clock, CheckCircle2, Calendar as CalendarIcon } from 'lucide-react'
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"

interface EnhancedCalendarDayProps {
  date: Date
  propertyId: string
  isCurrentMonth: boolean
  isToday: boolean
  bookings: any[]
  primaryBookingType?: BookingType
  enlarged?: boolean
  onDateClick?: (date: Date) => void
  onSlotSelect?: (slot: { start: Date; end: Date }) => void
  selectedRange?: { start: Date; end: Date } | null
}

export function EnhancedCalendarDay({
  date,
  propertyId,
  isCurrentMonth,
  isToday,
  bookings,
  primaryBookingType,
  enlarged = false,
  onDateClick,
  onSlotSelect,
  selectedRange
}: EnhancedCalendarDayProps) {
  const [isHovered, setIsHovered] = useState(false)
  
  // Check if this day is in a potential booking range (for conflict detection)
  const isInSelectedRange = selectedRange && 
    date >= selectedRange.start && 
    date <= selectedRange.end

  // Advanced availability check for potential conflicts when hovering
  const advancedAvailabilityInput = useMemo(() => {
    if (!isHovered || !isInSelectedRange || bookings.length === 0) return null
    
    return {
      propertyId,
      startDate: date,
      endDate: addDays(date, 1), // Check single day
      includeNearbyDates: false,
      suggestAlternatives: false,
      gracePeriodHours: 2,
    }
  }, [isHovered, isInSelectedRange, propertyId, date, bookings.length])

  const { data: conflictData } = useAdvancedAvailability(advancedAvailabilityInput)

  // Determine conflict indicators
  const hasBlockingConflicts = conflictData?.conflicts?.some(c => c.severity === 'blocking') || false
  const hasWarningConflicts = conflictData?.conflicts?.some(c => c.severity === 'warning') || false
  const hasGracePeriodViolations = conflictData?.gracePeriodViolations && 
    conflictData.gracePeriodViolations.length > 0

  // Get base styling from booking type
  const getBaseStyling = () => {
    if (!primaryBookingType) {
      return {
        bg: 'bg-white/80',
        border: 'border-gray-100/50',
        text: 'text-gray-700',
        shadow: '',
        hover: 'hover:bg-white/90 hover:shadow-sm hover:scale-[1.01]',
      }
    }
    
    const colors = BOOKING_TYPE_COLORS[primaryBookingType]
    return {
      bg: colors.bg,
      border: colors.border,
      text: colors.text,
      shadow: colors.shadow,
      hover: colors.hover + ' hover:scale-[1.01]',
    }
  }

  // Get conflict overlay styling
  const getConflictOverlay = () => {
    if (!isInSelectedRange) return null
    
    if (hasBlockingConflicts) {
      return 'ring-2 ring-red-500 bg-red-100/60'
    }
    
    if (hasWarningConflicts) {
      return 'ring-2 ring-yellow-500 bg-yellow-100/60'
    }
    
    if (hasGracePeriodViolations) {
      return 'ring-2 ring-orange-500 bg-orange-100/60'
    }
    
    if (isInSelectedRange && bookings.length === 0) {
      return 'ring-2 ring-green-500 bg-green-100/60'
    }
    
    return null
  }

  // Get conflict icon
  const getConflictIcon = () => {
    if (!isInSelectedRange || !isHovered) return null
    
    if (hasBlockingConflicts) {
      return <AlertTriangle className="h-3 w-3 text-red-600" />
    }
    
    if (hasWarningConflicts) {
      return <AlertTriangle className="h-3 w-3 text-yellow-600" />
    }
    
    if (hasGracePeriodViolations) {
      return <Clock className="h-3 w-3 text-orange-600" />
    }
    
    if (bookings.length === 0) {
      return <CheckCircle2 className="h-3 w-3 text-green-600" />
    }
    
    return null
  }

  // Generate tooltip content
  const getTooltipContent = () => {
    const content = []
    
    // Date info
    content.push(
      <div key="date" className="font-semibold text-white border-b border-gray-600 pb-2 mb-2">
        {format(date, 'EEEE, MMMM d, yyyy')}
      </div>
    )
    
    // Existing bookings
    if (bookings.length > 0) {
      content.push(
        <div key="bookings" className="mb-3">
          <div className="text-sm font-medium text-gray-200 mb-2">Current Bookings:</div>
          <div className="space-y-1">
            {bookings.slice(0, 3).map((booking, idx) => (
              <div key={idx} className="text-sm text-gray-300 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                {booking.guestName || booking.type.replace('_', ' ')}
              </div>
            ))}
            {bookings.length > 3 && (
              <div className="text-xs text-gray-400 italic">+{bookings.length - 3} more bookings</div>
            )}
          </div>
        </div>
      )
    }
    
    // Conflict information
    if (isInSelectedRange && conflictData) {
      if (hasBlockingConflicts) {
        content.push(
          <div key="blocking" className="bg-red-900/30 border border-red-600 rounded-md p-2">
            <div className="flex items-center gap-2 text-red-300 font-medium">
              <AlertTriangle className="h-4 w-4" />
              BLOCKED - Conflicts Detected
            </div>
          </div>
        )
      } else if (hasWarningConflicts) {
        content.push(
          <div key="warning" className="bg-yellow-900/30 border border-yellow-600 rounded-md p-2">
            <div className="flex items-center gap-2 text-yellow-300 font-medium">
              <AlertTriangle className="h-4 w-4" />
              WARNING - Potential Conflicts
            </div>
          </div>
        )
      } else if (hasGracePeriodViolations) {
        content.push(
          <div key="grace" className="bg-orange-900/30 border border-orange-600 rounded-md p-2">
            <div className="flex items-center gap-2 text-orange-300 font-medium">
              <Clock className="h-4 w-4" />
              Grace Period Issue
            </div>
          </div>
        )
      } else if (bookings.length === 0) {
        content.push(
          <div key="available" className="bg-green-900/30 border border-green-600 rounded-md p-2">
            <div className="flex items-center gap-2 text-green-300 font-medium">
              <CheckCircle2 className="h-4 w-4" />
              Available for Booking
            </div>
          </div>
        )
      }
    }
    
    return <div className="max-w-sm min-w-[200px] space-y-2">{content}</div>
  }

  const handleClick = () => {
    if (bookings.length > 0) {
      // If there are bookings, could trigger booking selection
      onDateClick?.(date)
    } else {
      // If empty, could trigger slot selection
      onDateClick?.(date)
      onSlotSelect?.({ start: date, end: addDays(date, 1) })
    }
  }

  const baseStyling = getBaseStyling()
  const conflictOverlay = getConflictOverlay()
  const conflictIcon = getConflictIcon()

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            onClick={handleClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={cn(
              "cursor-pointer transition-all duration-300 ease-out",
              "border border-transparent backdrop-blur-sm relative overflow-hidden group",
              baseStyling.bg,
              baseStyling.border,
              baseStyling.shadow,
              baseStyling.hover,
              conflictOverlay,
              !isCurrentMonth && "opacity-40",
              isToday && "ring-1 ring-amber-400/50 ring-inset shadow-amber-200/30",
              enlarged ? "min-h-[80px] h-full" : "h-16"
            )}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-out" />
            
            {isInSelectedRange && (
              <div className="absolute top-1 right-1 z-10">
                {conflictIcon}
              </div>
            )}
            
            <div className={cn(
              "relative h-full flex flex-col justify-between",
              enlarged ? "p-4" : "p-2"
            )}>
              <div className="flex items-start justify-between">
                <span className={cn(
                  "font-medium tracking-wide",
                  baseStyling.text,
                  !isCurrentMonth && "text-gray-400",
                  isToday && "font-semibold text-amber-700",
                  enlarged ? "text-base" : "text-xs"
                )}>
                  {format(date, 'd')}
                </span>
                
                {bookings.length > 1 && (
                  <Badge 
                    variant="secondary" 
                    className={cn(
                      "text-xs opacity-80",
                      enlarged ? "px-1 py-0" : "px-0.5 py-0 text-[10px]"
                    )}
                  >
                    {bookings.length}
                  </Badge>
                )}
              </div>
              
              {bookings.length > 0 && (
                <div className="flex items-center justify-center">
                  <div className={cn(
                    "flex",
                    enlarged ? "space-x-1.5" : "space-x-0.5"
                  )}>
                    {Array.from({ length: Math.min(bookings.length, 3) }, (_, i) => (
                      <div 
                        key={i} 
                        className={cn(
                          "rounded-full bg-current opacity-70",
                          enlarged ? "w-2 h-2" : "w-1 h-1"
                        )}
                      />
                    ))}
                    {bookings.length > 3 && (
                      <span className={cn(
                        "ml-1 opacity-80",
                        enlarged ? "text-base" : "text-xs"
                      )}>+</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent 
          side="top" 
          sideOffset={8}
          className="bg-gray-900 text-white border border-gray-700 shadow-xl z-50 p-3 rounded-lg text-sm"
        >
          {getTooltipContent()}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}