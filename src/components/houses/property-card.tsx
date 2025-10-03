"use client"

import { PropertyListItem } from "@/types/property"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { 
  MapPin, 
  Bed, 
  Bath, 
  Users, 
  MoreVertical,
  Eye,
  Edit,
  Trash2
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

interface PropertyCardProps {
  property: PropertyListItem
  onEdit?: () => void
  onDelete?: () => void
  className?: string
  isSelected?: boolean
  onSelectChange?: (selected: boolean) => void
}

export function PropertyCard({ 
  property, 
  onEdit, 
  onDelete, 
  className,
  isSelected = false,
  onSelectChange 
}: PropertyCardProps) {
  const router = useRouter()
  const mainPhoto = property.photos?.[0]

  const statusConfig = {
    PUBLISHED: { 
      label: "Published", 
      className: "bg-green-100 text-green-800 border-green-200"
    },
    HIDDEN: { 
      label: "Hidden", 
      className: "bg-red-100 text-red-800 border-red-200"
    },
    ONBOARDING: { 
      label: "Onboarding", 
      className: "bg-yellow-100 text-yellow-800 border-yellow-200"
    },
    OFFBOARDED: { 
      label: "Offboarded", 
      className: "bg-gray-100 text-gray-800 border-gray-200"
    },
  }

  const config = statusConfig[property.status]

  return (
    <Card 
      className={cn(
        "group relative overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer",
        className
      )}
      onClick={() => router.push(`/houses/${property.id}`)}
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-gray-100">
        {mainPhoto ? (
          <img
            src={mainPhoto.url}
            alt={mainPhoto.caption || property.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center bg-gray-50">
            <Eye className="h-12 w-12 text-gray-300" />
          </div>
        )}
        
        <div className="absolute top-3 left-3 flex items-center gap-2">
          {onSelectChange && (
            <div 
              onClick={(e) => e.stopPropagation()}
              className="bg-white/90 backdrop-blur-sm rounded p-1"
            >
              <Checkbox 
                checked={isSelected}
                onCheckedChange={onSelectChange}
                className="h-4 w-4"
              />
            </div>
          )}
          <Badge variant="outline" className={cn("backdrop-blur-sm", config.className)}>
            {config.label}
          </Badge>
        </div>

        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button size="icon" variant="secondary" className="h-8 w-8 bg-white/90 backdrop-blur-sm hover:bg-white">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation()
                router.push(`/houses/${property.id}`)
              }}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              {onEdit && (
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation()
                  onEdit()
                }}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
              )}
              {onDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={(e) => {
                      e.stopPropagation()
                      onDelete()
                    }}
                    className="text-red-600"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <CardContent className="p-4">
        <h3 className="font-semibold text-lg mb-2 line-clamp-1">{property.name}</h3>
        
        <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
          <MapPin className="h-3.5 w-3.5" />
          <span className="line-clamp-1">
            {property.city && `${property.city}, `}{property.destination.name}, {property.destination.country}
          </span>
        </div>

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Bed className="h-3.5 w-3.5" />
            <span>{property.numberOfRooms}</span>
          </div>
          <div className="flex items-center gap-1">
            <Bath className="h-3.5 w-3.5" />
            <span>{property.numberOfBathrooms}</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            <span>{property.maxGuests}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}