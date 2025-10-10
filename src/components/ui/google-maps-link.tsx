"use client"

import { ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface GoogleMapsLinkProps {
  address?: string | null
  latitude?: number | null
  longitude?: number | null
  className?: string
  size?: "sm" | "default" | "lg"
  variant?: "ghost" | "outline" | "default"
}

export function GoogleMapsLink({ 
  address, 
  latitude, 
  longitude, 
  className,
  size = "sm",
  variant = "ghost"
}: GoogleMapsLinkProps) {
  // Generate Google Maps URL
  const getGoogleMapsUrl = () => {
    // If we have coordinates, use them for precise location
    if (latitude && longitude) {
      return `https://www.google.com/maps/place/${latitude},${longitude}`
    }
    
    // Fallback to address search if no coordinates
    if (address) {
      const encodedAddress = encodeURIComponent(address)
      return `https://www.google.com/maps/search/${encodedAddress}`
    }
    
    return null
  }

  const mapsUrl = getGoogleMapsUrl()

  // Don't render if no valid data
  if (!mapsUrl) {
    return null
  }

  return (
    <Button
      variant={variant}
      size={size}
      asChild
      className={cn("gap-1 text-blue-600 hover:text-blue-800", className)}
    >
      <a 
        href={mapsUrl} 
        target="_blank" 
        rel="noopener noreferrer"
        title={`Open location in Google Maps`}
      >
        <ExternalLink className="h-3 w-3" />
        <span className="text-xs">Maps</span>
      </a>
    </Button>
  )
}