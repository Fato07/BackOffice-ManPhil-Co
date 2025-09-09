"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import {
  Home,
  Info,
  MapPin,
  FileText,
  Thermometer,
  Calendar,
  Wrench,
  AlertCircle,
  Shield,
  Megaphone,
  Camera,
  Link,
  DoorOpen,
  ChevronRight,
  CheckCircle2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"

interface Section {
  id: string
  label: string
  icon: React.ElementType
  description: string
  isInternal?: boolean
}

const sections: Section[] = [
  { id: "promote", label: "Promote", icon: Home, description: "Visibility and positioning" },
  { id: "info", label: "House Information", icon: Info, description: "Basic property details" },
  { id: "location", label: "Location", icon: MapPin, description: "Address and coordinates" },
  { id: "further-info", label: "Further Information", icon: FileText, description: "Additional details" },
  { id: "heating", label: "Heating & AC", icon: Thermometer, description: "Climate control systems" },
  { id: "events", label: "Events", icon: Calendar, description: "Special events and activities" },
  { id: "services", label: "Services", icon: Wrench, description: "Available amenities" },
  { id: "good-to-know", label: "Good to Know", icon: AlertCircle, description: "Important information" },
  { id: "internal", label: "Internal", icon: Shield, description: "Private notes and data", isInternal: true },
  { id: "marketing", label: "Automatic Offer", icon: Megaphone, description: "Marketing content" },
  { id: "photos", label: "Photos", icon: Camera, description: "Property images" },
  { id: "links", label: "Links & Resources", icon: Link, description: "External resources" },
  { id: "rooms", label: "Rooms", icon: DoorOpen, description: "Room configuration" },
]

interface PropertyNavigationProps {
  propertyId: string
  currentSection: string
  onSectionChange: (sectionId: string) => void
  completionStatus?: Record<string, boolean>
  onExpandChange?: (isExpanded: boolean) => void
}

export function PropertyNavigation({
  propertyId,
  currentSection,
  onSectionChange,
  completionStatus = {},
  onExpandChange,
}: PropertyNavigationProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [activeGroup, setActiveGroup] = useState<"essential" | "details" | "content">("essential")

  const sectionGroups = {
    essential: sections.slice(0, 4),
    details: sections.slice(4, 9),
    content: sections.slice(9),
  }

  const groupLabels = {
    essential: "Essential Information",
    details: "Property Details",
    content: "Content & Media",
  }

  const completedSections = Object.values(completionStatus).filter(Boolean).length
  const totalSections = sections.length
  const completionPercentage = (completedSections / totalSections) * 100

  useEffect(() => {
    // Auto-expand group containing current section
    const currentGroup = Object.entries(sectionGroups).find(([_, groupSections]) =>
      groupSections.some(s => s.id === currentSection)
    )
    if (currentGroup) {
      setActiveGroup(currentGroup[0] as keyof typeof sectionGroups)
    }
  }, [currentSection])

  return (
    <div
      className={cn(
        "bg-white border-r border-gray-200 transition-all duration-300 flex flex-col sticky top-14 h-[calc(100vh-3.5rem)] z-30",
        isExpanded ? "w-80" : "w-16"
      )}
    >
      {/* Header */}
      <div className={cn(
        "border-b border-gray-200",
        isExpanded ? "p-4" : "p-2"
      )}>
        <div className={cn(
          "flex items-center",
          isExpanded ? "justify-between" : "justify-center"
        )}>
          {isExpanded && (
            <div className="transition-opacity">
              <h3 className="text-sm font-semibold text-gray-900">Navigation</h3>
              <p className="text-xs text-gray-500 mt-1">
                {completedSections} of {totalSections} sections complete
              </p>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              const newExpanded = !isExpanded
              setIsExpanded(newExpanded)
              onExpandChange?.(newExpanded)
            }}
            className={cn(
              isExpanded && "ml-auto"
            )}
          >
            <ChevronRight
              className={cn(
                "h-4 w-4 transition-transform",
                isExpanded && "rotate-180"
              )}
            />
          </Button>
        </div>
        
        {isExpanded && (
          <div className="mt-4">
            <Progress value={completionPercentage} className="h-2" />
            <p className="text-xs text-gray-500 mt-2">
              {completionPercentage.toFixed(0)}% Complete
            </p>
          </div>
        )}
      </div>

      {/* Navigation Groups */}
      <div className="flex-1 overflow-y-auto">
        {Object.entries(sectionGroups).map(([groupKey, groupSections]) => (
          <div key={groupKey} className="border-b border-gray-100 last:border-0">
            {isExpanded ? (
              <>
                <button
                  onClick={() => setActiveGroup(groupKey as keyof typeof sectionGroups)}
                  className={cn(
                    "w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors",
                    "flex items-center justify-between group"
                  )}
                >
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-600">
                    {groupLabels[groupKey as keyof typeof groupLabels]}
                  </span>
                  <ChevronRight
                    className={cn(
                      "h-3 w-3 text-gray-400 transition-transform",
                      activeGroup === groupKey && "rotate-90"
                    )}
                  />
                </button>
                
                {activeGroup === groupKey && (
                  <div className="pb-2">
                    {groupSections.map((section) => {
                      const isActive = currentSection === section.id
                      const isCompleted = completionStatus[section.id]
                      const Icon = section.icon

                      return (
                        <button
                          key={section.id}
                          onClick={() => onSectionChange(section.id)}
                          className={cn(
                            "w-full px-4 py-3 text-left transition-all duration-200",
                            "hover:bg-gray-50 group relative",
                            isActive && "bg-[#B5985A]/10 border-l-4 border-[#B5985A]",
                            section.isInternal && "bg-amber-50/50"
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={cn(
                                "mt-0.5 transition-colors",
                                isActive ? "text-[#B5985A]" : "text-gray-400",
                                section.isInternal && "text-amber-600"
                              )}
                            >
                              <Icon className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span
                                  className={cn(
                                    "text-sm font-medium transition-colors",
                                    isActive ? "text-[#B5985A]" : "text-gray-700",
                                    section.isInternal && "text-amber-700"
                                  )}
                                >
                                  {section.label}
                                </span>
                                {isCompleted && (
                                  <CheckCircle2 className="h-3 w-3 text-green-600" />
                                )}
                                {section.isInternal && (
                                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                    Internal
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-gray-500 mt-0.5 pr-2">
                                {section.description}
                              </p>
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </>
            ) : (
              <div className="py-2">
                {groupSections.map((section) => {
                  const isActive = currentSection === section.id
                  const Icon = section.icon

                  return (
                    <button
                      key={section.id}
                      onClick={() => onSectionChange(section.id)}
                      className={cn(
                        "w-full p-3 flex items-center justify-center",
                        "hover:bg-gray-50 transition-colors relative group",
                        isActive && "bg-[#B5985A]/10",
                        section.isInternal && "bg-amber-50/50"
                      )}
                    >
                      <Icon
                        className={cn(
                          "h-4 w-4",
                          isActive ? "text-[#B5985A]" : "text-gray-400",
                          section.isInternal && "text-amber-600"
                        )}
                      />
                      {isActive && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#B5985A]" />
                      )}
                      <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                        {section.label}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}