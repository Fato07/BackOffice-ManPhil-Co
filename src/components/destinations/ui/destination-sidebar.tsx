"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { X, MapPin, Home, Edit, Trash2, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Destination } from "@/generated/prisma"
import { useRouter } from "next/navigation"
import { useProperties } from "@/hooks/use-properties"
import { PropertyCard } from "@/components/houses/property-card"
import { Skeleton } from "@/components/ui/skeleton"

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
  const [showProperties, setShowProperties] = useState(false)
  
  // Fetch properties for this destination
  const { data: propertiesData, isLoading: propertiesLoading } = useProperties(
    { destinationId: destination.id },
    1,
    3 // Only fetch 3 for preview
  )

  // Handle escape key to close drawer
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        onClose()
      }
    }

    document.addEventListener("keydown", handleEscape)
    return () => document.removeEventListener("keydown", handleEscape)
  }, [isOpen, onClose])
  
  // Reset properties view when destination changes
  useEffect(() => {
    setShowProperties(false)
  }, [destination.id])

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isOpen ? 1 : 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className={cn(
          "fixed inset-0 bg-black/60 backdrop-blur-sm z-10",
          isOpen ? "pointer-events-auto" : "pointer-events-none"
        )}
        onClick={onClose}
      />

      {/* Drawer */}
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

        {/* Hero Image */}
        <div className="aspect-video rounded-lg bg-white/5 border border-white/10 overflow-hidden">
          {destination.imageUrl ? (
            <img
              src={destination.imageUrl}
              alt={destination.imageAltText || `${destination.name} hero image`}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <p className="text-gray-500 text-sm">No image available</p>
            </div>
          )}
        </div>

        {/* Description Placeholder */}
        <div className="space-y-2">
          <h3 className="text-white font-medium">Description</h3>
          <p className="text-gray-400 text-sm">
            No description available for this destination.
          </p>
        </div>

        {/* Properties Preview */}
        {destination._count?.properties && destination._count.properties > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-medium">Featured Properties</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowProperties(!showProperties)}
                className="text-gray-400 hover:text-white -mr-2"
              >
                {showProperties ? "Hide" : "Show"}
                <ChevronRight className={cn(
                  "ml-1 h-4 w-4 transition-transform",
                  showProperties && "rotate-90"
                )} />
              </Button>
            </div>
            
            {showProperties && (
              <div className="space-y-3">
                {propertiesLoading ? (
                  <>
                    <Skeleton className="h-48 w-full rounded-lg" />
                    <Skeleton className="h-48 w-full rounded-lg" />
                  </>
                ) : propertiesData?.data && propertiesData.data.length > 0 ? (
                  <>
                    {propertiesData.data.map((property) => (
                      <div 
                        key={property.id}
                        className="cursor-pointer transform transition-transform hover:scale-[1.02]"
                        onClick={() => router.push(`/houses/${property.id}`)}
                      >
                        <PropertyCard 
                          property={property} 
                          className="bg-white/5 border-white/10 hover:bg-white/10"
                        />
                      </div>
                    ))}
                    {propertiesData.total > 3 && (
                      <p className="text-center text-sm text-gray-400 pt-2">
                        +{propertiesData.total - 3} more properties
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-gray-400 text-sm">No properties available</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="space-y-2 pt-4">
          <Button
            className="w-full bg-[#B5985A] hover:bg-[#9A7F4A] transition-colors duration-200"
            onClick={() => router.push(`/houses?destinationId=${destination.id}`)}
          >
            <Home className="h-4 w-4 mr-2" />
            View Properties
          </Button>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              className="border-[#B5985A]/30 text-[#B5985A]/70 hover:bg-[#B5985A]/20 hover:border-[#B5985A]/50 hover:text-[#B5985A] transition-all duration-200"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button
              variant="destructive"
              className="transition-all duration-200"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
    </>
  )
}