"use client"

import { ChevronLeft, Activity, MapPin } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PropertyStatus } from "@/types/property"
import Link from "next/link"

interface PropertyDetailHeaderProps {
  property: {
    id: string
    name: string
    status: PropertyStatus
    destination: {
      name: string
      country: string
    }
  }
}

export function PropertyDetailHeader({ property }: PropertyDetailHeaderProps) {
  const router = useRouter()
  
  const statusConfig = {
    PUBLISHED: { 
      label: "Published", 
      className: "bg-green-100 text-green-800"
    },
    HIDDEN: { 
      label: "Hidden", 
      className: "bg-red-100 text-red-800"
    },
    ONBOARDING: { 
      label: "Onboarding", 
      className: "bg-yellow-100 text-yellow-800"
    },
  }
  
  const config = statusConfig[property.status]

  return (
    <div className="space-y-4">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push("/houses")}
        className="mb-4"
      >
        <ChevronLeft className="mr-1 h-4 w-4" />
        back to the list of houses
      </Button>
      
      <div className="flex items-start justify-end">
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-sm text-gray-600">
              <MapPin className="h-3.5 w-3.5" />
              <span>{property.destination.name}, {property.destination.country}</span>
            </div>
            <Badge className={config.className}>
              {config.label}
            </Badge>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href={`/audit-logs?entityType=property&entityId=${property.id}`}>
              <Activity className="mr-2 h-4 w-4" />
              View Activity
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}