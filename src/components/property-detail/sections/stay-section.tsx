"use client"

import { useState, useEffect } from "react"
import { PropertyWithRelations, StayMetadata } from "@/types/property"
import { GlassCard } from "@/components/ui/glass-card"
import { CompletionBadge } from "../shared/completion-indicator"
import { ChevronDown, Home, Clock, MapPin, Sparkles, Wifi, Shield, MessageSquare } from "lucide-react"
import { cn } from "@/lib/utils"

// Lazy load subsections
import dynamic from 'next/dynamic'

const CheckInDetails = dynamic(() => import('./stay/check-in-details').then(m => ({ default: m.CheckInDetails })), {
  loading: () => <div className="p-8 text-center text-gray-500">Loading...</div>
})

const AccessDetails = dynamic(() => import('./stay/access-details').then(m => ({ default: m.AccessDetails })), {
  loading: () => <div className="p-8 text-center text-gray-500">Loading...</div>
})

const MaintenanceHousekeeping = dynamic(() => import('./stay/maintenance-housekeeping').then(m => ({ default: m.MaintenanceHousekeeping })), {
  loading: () => <div className="p-8 text-center text-gray-500">Loading...</div>
})

const NetworkConnection = dynamic(() => import('./stay/network-connection').then(m => ({ default: m.NetworkConnection })), {
  loading: () => <div className="p-8 text-center text-gray-500">Loading...</div>
})

const SecurityDetails = dynamic(() => import('./stay/security-details').then(m => ({ default: m.SecurityDetails })), {
  loading: () => <div className="p-8 text-center text-gray-500">Loading...</div>
})

const VillaBookComment = dynamic(() => import('./stay/villa-book-comment').then(m => ({ default: m.VillaBookComment })), {
  loading: () => <div className="p-8 text-center text-gray-500">Loading...</div>
})

interface StaySectionProps {
  property: PropertyWithRelations
}

interface SubsectionConfig {
  id: string
  title: string
  icon: React.ComponentType<{ className?: string }>
  component: React.ComponentType<{ property: PropertyWithRelations }>
  checkCompletion: (property: PropertyWithRelations) => boolean
}

const subsections: SubsectionConfig[] = [
  {
    id: 'check-in',
    title: 'Check-in Details',
    icon: Clock,
    component: CheckInDetails,
    checkCompletion: (property) => !!(property.checkInTime && property.checkOutTime)
  },
  {
    id: 'access',
    title: 'Access',
    icon: MapPin,
    component: AccessDetails,
    checkCompletion: (property) => {
      const metadata = property.stayMetadata as StayMetadata | null
      return !!(metadata?.access?.airports?.length || metadata?.access?.trainStations?.length)
    }
  },
  {
    id: 'maintenance',
    title: 'Maintenance & Housekeeping',
    icon: Sparkles,
    component: MaintenanceHousekeeping,
    checkCompletion: (property) => {
      const metadata = property.stayMetadata as StayMetadata | null
      return !!(metadata?.maintenance?.linenChange || metadata?.maintenance?.towelChange)
    }
  },
  {
    id: 'network',
    title: 'Network & Connection',
    icon: Wifi,
    component: NetworkConnection,
    checkCompletion: (property) => !!(property.wifiName && property.wifiPassword)
  },
  {
    id: 'security',
    title: 'Security',
    icon: Shield,
    component: SecurityDetails,
    checkCompletion: (property) => {
      const metadata = property.stayMetadata as StayMetadata | null
      return !!(property.hasFireExtinguisher || property.hasFireAlarm || metadata?.security?.nearestHospital?.name)
    }
  },
  {
    id: 'villa-book',
    title: 'Comment for Villa Book',
    icon: MessageSquare,
    component: VillaBookComment,
    checkCompletion: (property) => {
      const metadata = property.stayMetadata as StayMetadata | null
      return !!(metadata?.villaBookComment && Object.keys(metadata.villaBookComment).length > 0)
    }
  }
]

export function StaySection({ property }: StaySectionProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())
  const [hasAutoExpanded, setHasAutoExpanded] = useState(false)

  // Calculate completion status for each subsection
  const completionStatus = subsections.map(subsection => ({
    id: subsection.id,
    completed: subsection.checkCompletion(property)
  }))

  const completedCount = completionStatus.filter(s => s.completed).length
  const totalCount = subsections.length

  // Auto-expand incomplete sections on first load
  useEffect(() => {
    if (!hasAutoExpanded) {
      const incompleteSections = completionStatus
        .filter(s => !s.completed)
        .map(s => s.id)
      
      if (incompleteSections.length > 0 && incompleteSections.length <= 3) {
        setExpandedSections(new Set(incompleteSections))
      } else if (incompleteSections.length === 0) {
        // If all complete, show first section
        setExpandedSections(new Set(['check-in']))
      }
      setHasAutoExpanded(true)
    }
  }, [completionStatus, hasAutoExpanded])

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev)
      if (next.has(sectionId)) {
        next.delete(sectionId)
      } else {
        next.add(sectionId)
      }
      return next
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Home className="h-6 w-6 text-indigo-600" />
          <div>
            <h2 className="text-xl font-light text-gray-900 tracking-tight">Stay Information</h2>
            <p className="text-sm text-gray-600 mt-1">
              Comprehensive details for guest stays
            </p>
          </div>
        </div>
        <CompletionBadge completedCount={completedCount} totalCount={totalCount} />
      </div>

      <div className="space-y-3">
        {subsections.map(subsection => {
          const Icon = subsection.icon
          const Component = subsection.component
          const isExpanded = expandedSections.has(subsection.id)
          const isCompleted = completionStatus.find(s => s.id === subsection.id)?.completed || false

          return (
            <GlassCard key={subsection.id} variant="luxury" className="overflow-hidden">
              <button
                onClick={() => toggleSection(subsection.id)}
                className={cn(
                  "w-full px-6 py-4 flex items-center justify-between",
                  "hover:bg-gray-50 transition-colors",
                  isCompleted && "bg-green-50/30"
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon className={cn(
                    "h-5 w-5",
                    isCompleted ? "text-green-600" : "text-gray-500"
                  )} />
                  <h3 className="font-medium text-gray-900">{subsection.title}</h3>
                  {isCompleted && (
                    <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
                      Complete
                    </span>
                  )}
                </div>
                <ChevronDown className={cn(
                  "h-5 w-5 text-gray-400 transition-transform duration-200",
                  isExpanded && "rotate-180"
                )} />
              </button>

              {isExpanded && (
                <div className="border-t">
                  <Component property={property} />
                </div>
              )}
            </GlassCard>
          )
        })}
      </div>
    </div>
  )
}