"use client"

import { motion } from "framer-motion"
import { MapPin, Home, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { DestinationWithCount } from "@/hooks/use-destinations"

interface ListViewProps {
  destinations: DestinationWithCount[]
  onDestinationSelect: (destination: DestinationWithCount) => void
}

export function ListView({ destinations, onDestinationSelect }: ListViewProps) {
  return (
    <div className="space-y-3">
      {destinations.map((destination, index) => (
        <motion.div
          key={destination.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.03 }}
          whileHover={{ x: 10 }}
          onClick={() => onDestinationSelect(destination)}
          className={cn(
            "group cursor-pointer",
            "bg-black/40 backdrop-blur-md",
            "border border-white/10 rounded-lg",
            "p-6 transition-all duration-300",
            "hover:border-[#B5985A]/50",
            "hover:bg-[#B5985A]/5"
          )}
        >
          <div className="flex items-center justify-between">
            {/* Left Side */}
            <div className="flex items-center gap-4">
              {/* Icon */}
              <div className="p-3 bg-[#B5985A]/10 rounded-lg border border-[#B5985A]/20">
                <MapPin className="h-5 w-5 text-[#B5985A]" />
              </div>

              {/* Info */}
              <div>
                <h3 className="text-lg font-semibold text-white group-hover:text-[#B5985A] transition-colors">
                  {destination.name}
                </h3>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-gray-400">{destination.country}</span>
                  {destination.region && (
                    <>
                      <span className="text-gray-600">•</span>
                      <span className="text-gray-500 text-sm">{destination.region}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Right Side */}
            <div className="flex items-center gap-6">
              {/* Stats */}
              <div className="text-right">
                <div className="flex items-center gap-2">
                  <Home className="h-4 w-4 text-gray-400" />
                  <span className="text-2xl font-semibold text-white">
                    {destination._count?.properties || 0}
                  </span>
                </div>
                <p className="text-xs text-gray-400">Properties</p>
              </div>

              {/* Coordinates Badge */}
              {destination.latitude && destination.longitude && (
                <Badge
                  variant="outline"
                  className="border-[#B5985A]/30 text-[#B5985A] bg-[#B5985A]/5"
                >
                  {destination.latitude.toFixed(2)}, {destination.longitude.toFixed(2)}
                </Badge>
              )}

              {/* Arrow */}
              <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-[#B5985A] transition-colors" />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}