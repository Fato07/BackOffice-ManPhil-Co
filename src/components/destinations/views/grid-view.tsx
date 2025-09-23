"use client"

import { motion } from "framer-motion"
import { MapPin, Home } from "lucide-react"
import { cn } from "@/lib/utils"
import { DestinationWithCount } from "@/hooks/use-destinations"

interface GridViewProps {
  destinations: DestinationWithCount[]
  onDestinationSelect: (destination: DestinationWithCount) => void
}

export function GridView({ destinations, onDestinationSelect }: GridViewProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {destinations.map((destination, index) => (
        <motion.div
          key={destination.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          whileHover={{ y: -10 }}
          onClick={() => onDestinationSelect(destination)}
          className="cursor-pointer group"
        >
          <div
            className={cn(
              "relative overflow-hidden rounded-2xl",
              "bg-gradient-to-br from-gray-900 to-black",
              "border border-white/10",
              "transition-all duration-300",
              "group-hover:border-[#B5985A]/50",
              "group-hover:shadow-2xl group-hover:shadow-[#B5985A]/10"
            )}
          >
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0 bg-gradient-to-br from-[#B5985A]/20 to-transparent" />
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#B5985A]/10 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-40 h-40 bg-[#B5985A]/5 rounded-full blur-3xl" />
            </div>

            {/* Content */}
            <div className="relative p-6 space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="p-3 bg-[#B5985A]/10 rounded-xl border border-[#B5985A]/20">
                  <MapPin className="h-6 w-6 text-[#B5985A]" />
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-white">
                    {destination._count?.properties || 0}
                  </p>
                  <p className="text-xs text-gray-400">Properties</p>
                </div>
              </div>

              {/* Destination Info */}
              <div className="space-y-1">
                <h3 className="text-xl font-semibold text-white group-hover:text-[#B5985A] transition-colors">
                  {destination.name}
                </h3>
                <p className="text-gray-400">{destination.country}</p>
                {destination.region && (
                  <p className="text-sm text-gray-500">{destination.region}</p>
                )}
              </div>

              {/* Destination Image */}
              <div className="aspect-video rounded-lg bg-white/5 border border-white/10 overflow-hidden">
                {destination.imageUrl ? (
                  <img
                    src={destination.imageUrl}
                    alt={destination.imageAltText || `${destination.name} image`}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Home className="h-8 w-8 text-gray-600" />
                  </div>
                )}
              </div>

              {/* Hover Effect */}
              <motion.div
                initial={{ opacity: 0 }}
                whileHover={{ opacity: 1 }}
                className="absolute inset-0 bg-gradient-to-t from-[#B5985A]/20 to-transparent pointer-events-none"
              />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}