"use client"

import { BOOKING_TYPE_COLORS } from "@/lib/validations/booking"
import { BookingType } from "@/generated/prisma"
import { GlassCard } from "@/components/ui/glass-card"
import { cn } from "@/lib/utils"

export function CalendarLegend() {
  const legendItems = [
    { type: BookingType.CONTRACT, label: "Contract" },
    { type: BookingType.OWNER, label: "Owner" },
    { type: BookingType.OWNER_STAY, label: "Owner Stay" },
    { type: BookingType.MAINTENANCE, label: "Maintenance" },
    { type: BookingType.BLOCKED, label: "Blocked" },
    { type: BookingType.CONFIRMED, label: "Confirmed" },
    { type: BookingType.TENTATIVE, label: "Tentative" },
  ]

  return (
    <GlassCard variant="light" className="p-4">
      <div className="flex flex-wrap items-center gap-6">
        <span className="text-sm font-serif font-medium text-gray-700 tracking-wide">Legend:</span>
        {legendItems.map(({ type, label }) => {
          const colors = BOOKING_TYPE_COLORS[type]
          return (
            <div key={type} className="flex items-center space-x-3 group">
              <div 
                className={cn(
                  "w-5 h-5 rounded-lg border transition-all duration-300 shadow-sm",
                  colors.bg,
                  colors.border,
                  colors.shadow,
                  "group-hover:scale-110 group-hover:shadow-md"
                )}
              />
              <span className="text-sm text-gray-700 font-medium tracking-wide group-hover:text-gray-900 transition-colors duration-200">
                {label}
              </span>
            </div>
          )
        })}
      </div>
    </GlassCard>
  )
}