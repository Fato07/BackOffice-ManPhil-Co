"use client"

import { motion } from "framer-motion"
import { X, MapPin, Home, Edit, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Destination } from "@/generated/prisma"
import { useRouter } from "next/navigation"

interface DestinationWithCount extends Destination {
  _count?: {
    properties: number
  }
}

interface DestinationSidebarProps {
  destination: DestinationWithCount
  isOpen: boolean
  onClose: () => void
}

export function DestinationSidebar({
  destination,
  isOpen,
  onClose,
}: DestinationSidebarProps) {
  const router = useRouter()

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: isOpen ? 0 : "100%" }}
      transition={{ type: "spring", damping: 30 }}
      className={cn(
        "fixed right-0 top-0 h-full w-96 z-20",
        "bg-black/90 backdrop-blur-xl",
        "border-l border-white/10",
        "overflow-y-auto"
      )}
    >
      {/* Header */}
      <div className="sticky top-0 bg-black/50 backdrop-blur-xl border-b border-white/10 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-white">
            {destination.name}
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Location Info */}
        <div className="space-y-3">
          <div className="flex items-center gap-3 text-gray-300">
            <MapPin className="h-4 w-4 text-[#B5985A]" />
            <span>{destination.country}</span>
          </div>
          {destination.region && (
            <div className="text-sm text-gray-400 ml-7">
              {destination.region}
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#B5985A]/20 rounded-lg">
              <Home className="h-5 w-5 text-[#B5985A]" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Properties</p>
              <p className="text-2xl font-semibold text-white">
                {destination._count?.properties || 0}
              </p>
            </div>
          </div>
        </div>

        {/* Hero Image Placeholder */}
        <div className="aspect-video rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
          <p className="text-gray-500 text-sm">No image available</p>
        </div>

        {/* Description Placeholder */}
        <div className="space-y-2">
          <h3 className="text-white font-medium">Description</h3>
          <p className="text-gray-400 text-sm">
            No description available for this destination.
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-2 pt-4">
          <Button
            className="w-full bg-[#B5985A] hover:bg-[#B5985A]/80"
            onClick={() => router.push(`/houses?destinationId=${destination.id}`)}
          >
            <Home className="h-4 w-4 mr-2" />
            View Properties
          </Button>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              className="border-white/10 text-white hover:bg-white/10"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button
              variant="outline"
              className="border-red-500/50 text-red-400 hover:bg-red-500/10"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}