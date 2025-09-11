"use client"

import { motion } from "framer-motion"
import { MapPin, Home, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"
import { AnimatedCounter } from "@/components/ui/animated-counter"

interface StatsWidgetProps {
  destinations: any[]
}

export function StatsWidget({ destinations }: StatsWidgetProps) {
  const totalProperties = destinations.reduce(
    (sum, dest) => sum + (dest._count?.properties || 0),
    0
  )
  const averageProperties = destinations.length
    ? Math.round(totalProperties / destinations.length)
    : 0

  const stats = [
    {
      icon: MapPin,
      label: "Destinations",
      value: destinations.length,
      color: "text-[#B5985A]",
    },
    {
      icon: Home,
      label: "Properties",
      value: totalProperties,
      color: "text-blue-400",
    },
    {
      icon: TrendingUp,
      label: "Avg/Destination",
      value: averageProperties,
      color: "text-green-400",
    },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "bg-black/40 backdrop-blur-md",
        "border border-white/10 rounded-lg",
        "p-3 flex items-center gap-4"
      )}
    >
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="flex items-center gap-2"
        >
          <div className={cn("p-1.5 rounded bg-white/5", stat.color)}>
            <stat.icon className="h-3.5 w-3.5" />
          </div>
          <div>
            <p className="text-gray-400 text-[10px] leading-tight">{stat.label}</p>
            <p className="text-white font-semibold text-sm leading-tight">
              <AnimatedCounter value={stat.value} />
            </p>
          </div>
        </motion.div>
      ))}
    </motion.div>
  )
}