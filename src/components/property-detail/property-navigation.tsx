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
  ChevronDown,
  CheckCircle2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"

export interface Section {
  id: string
  label: string
  icon: React.ElementType
  description: string
  isInternal?: boolean
  isContainer?: boolean
  parentSection?: string
}

interface PropertyNavigationProps {
  propertyId: string
  currentSection: string
  onSectionChange: (sectionId: string) => void
  completionStatus?: Record<string, boolean>
  onExpandChange?: (isExpanded: boolean) => void
  sections: Section[]
}

export function PropertyNavigation({
  propertyId,
  currentSection,
  onSectionChange,
  completionStatus = {},
  onExpandChange,
  sections,
}: PropertyNavigationProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  
  const [expandedContainers, setExpandedContainers] = useState<Set<string>>(() => {
    const containerSections = sections.filter(s => s.isContainer).map(s => s.id)
    return new Set(containerSections)
  })

  // Filter to get only top-level sections (no parent)
  const topLevelSections = sections.filter(s => !s.parentSection)
  
  // Group subsections by their parent
  const subsectionsByParent = sections.reduce((acc, section) => {
    if (section.parentSection) {
      if (!acc[section.parentSection]) {
        acc[section.parentSection] = []
      }
      acc[section.parentSection].push(section)
    }
    return acc
  }, {} as Record<string, Section[]>)

  const countableSections = sections.filter(s => !s.isContainer)
  const completedSections = countableSections.filter(s => completionStatus[s.id]).length
  const totalSections = countableSections.length
  const completionPercentage = (completedSections / totalSections) * 100

  useEffect(() => {
    const currentSectionData = sections.find(s => s.id === currentSection)
    if (currentSectionData?.parentSection) {
      setExpandedContainers(prev => new Set(prev).add(currentSectionData.parentSection!))
    }
  }, [currentSection])

  const toggleContainer = (containerId: string) => {
    setExpandedContainers(prev => {
      const newSet = new Set(prev)
      if (newSet.has(containerId)) {
        newSet.delete(containerId)
      } else {
        newSet.add(containerId)
      }
      return newSet
    })
  }

  return (
    <div
      className={cn(
        "bg-white/90 backdrop-blur-xl border-r border-white/30 transition-all duration-300 flex flex-col sticky top-14 h-[calc(100vh-3.5rem)] z-30 shadow-xl",
        isExpanded ? "w-80" : "w-16"
      )}
    >
      <div className={cn(
        "border-b border-white/20",
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

      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        {isExpanded ? (
          <div className="py-2">
            {topLevelSections.map((section) => {
              const isActive = currentSection === section.id
              const isCompleted = completionStatus[section.id]
              const Icon = section.icon
              const subsections = subsectionsByParent[section.id] || []
              const isExpanded = expandedContainers.has(section.id)

              if (section.isContainer) {
                // Render container section with subsections
                return (
                  <div key={section.id} className="mb-1">
                    <button
                      onClick={() => toggleContainer(section.id)}
                      className={cn(
                        "w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors",
                        "flex items-center justify-between group"
                      )}
                    >
                      <div className="flex items-start gap-3 flex-1">
                        <Icon className="h-4 w-4 text-gray-400 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-700">
                              {section.label}
                            </span>
                            {isCompleted && (
                              <CheckCircle2 className="h-3 w-3 text-green-600" />
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {section.description}
                          </p>
                        </div>
                      </div>
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 text-gray-400 transition-transform",
                          !isExpanded && "-rotate-90"
                        )}
                      />
                    </button>
                    
                    {isExpanded && (
                      <div className="ml-4 border-l border-gray-200">
                        {subsections.map((subsection) => {
                          const isSubActive = currentSection === subsection.id
                          const isSubCompleted = completionStatus[subsection.id]
                          const SubIcon = subsection.icon

                          return (
                            <button
                              key={subsection.id}
                              onClick={() => onSectionChange(subsection.id)}
                              className={cn(
                                "w-full px-4 py-2.5 text-left transition-all duration-200",
                                "hover:bg-gray-50 group relative",
                                isSubActive && "bg-[#B5985A]/10 border-l-4 border-[#B5985A] -ml-1"
                              )}
                            >
                              <div className="flex items-start gap-3">
                                <SubIcon
                                  className={cn(
                                    "h-3.5 w-3.5 mt-0.5",
                                    isSubActive ? "text-[#B5985A]" : "text-gray-400"
                                  )}
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span
                                      className={cn(
                                        "text-sm",
                                        isSubActive ? "text-[#B5985A] font-medium" : "text-gray-600"
                                      )}
                                    >
                                      {subsection.label}
                                    </span>
                                    {isSubCompleted && (
                                      <CheckCircle2 className="h-3 w-3 text-green-600" />
                                    )}
                                  </div>
                                  <p className="text-xs text-gray-500 mt-0.5">
                                    {subsection.description}
                                  </p>
                                </div>
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              } else {
                // Render regular section
                return (
                  <button
                    key={section.id}
                    onClick={() => onSectionChange(section.id)}
                    className={cn(
                      "w-full px-4 py-3 text-left transition-all duration-200 mb-1",
                      "hover:bg-gray-50 group relative",
                      isActive && "bg-[#B5985A]/10 border-l-4 border-[#B5985A]",
                      section.isInternal && "bg-amber-50/50"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <Icon
                        className={cn(
                          "h-4 w-4 mt-0.5",
                          isActive ? "text-[#B5985A]" : "text-gray-400",
                          section.isInternal && "text-amber-600"
                        )}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "text-sm font-medium",
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
                        <p className="text-xs text-gray-500 mt-0.5">
                          {section.description}
                        </p>
                      </div>
                    </div>
                  </button>
                )
              }
            })}
          </div>
        ) : (
          // Collapsed view
          <div className="py-2">
            {topLevelSections.map((section) => {
              const isActive = currentSection === section.id || 
                (section.isContainer && subsectionsByParent[section.id]?.some(s => s.id === currentSection))
              const Icon = section.icon

              return (
                <button
                  key={section.id}
                  onClick={() => {
                    if (section.isContainer) {
                      // If it's a container, expand navigation and container
                      setIsExpanded(true)
                      onExpandChange?.(true)
                      setExpandedContainers(new Set([section.id]))
                    } else {
                      onSectionChange(section.id)
                    }
                  }}
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
                  {isActive && !section.isContainer && (
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
    </div>
  )
}