"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { ChevronUp, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Section {
  id: string
  label: string
  element?: HTMLElement | null
}

interface SectionNavigatorProps {
  sections: Section[]
  currentSection?: string
  onSectionChange?: (sectionId: string) => void
}

export function SectionNavigator({
  sections,
  currentSection,
  onSectionChange,
}: SectionNavigatorProps) {
  const [activeSection, setActiveSection] = useState(currentSection)
  const [isVisible, setIsVisible] = useState(false)
  const [isScrolling, setIsScrolling] = useState(false)
  const [showNavigator, setShowNavigator] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > 200)

      // Find current section based on scroll position
      const scrollPosition = window.scrollY + 100
      
      for (let i = sections.length - 1; i >= 0; i--) {
        const section = sections[i]
        if (section.element) {
          const rect = section.element.getBoundingClientRect()
          const absoluteTop = rect.top + window.scrollY
          
          if (scrollPosition >= absoluteTop) {
            setActiveSection(section.id)
            break
          }
        }
      }
    }

    // Set up intersection observer for better performance
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const sectionId = entry.target.id
            const section = sections.find(s => s.id === sectionId)
            if (section) {
              setActiveSection(section.id)
            }
          }
        })
      },
      {
        rootMargin: "-20% 0% -70% 0%",
      }
    )

    // Observe all sections
    sections.forEach((section) => {
      if (section.element) {
        observer.observe(section.element)
      }
    })

    window.addEventListener("scroll", handleScroll)
    handleScroll()

    return () => {
      window.removeEventListener("scroll", handleScroll)
      observer.disconnect()
    }
  }, [sections])

  // Handle responsive behavior
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1200)
    }

    handleResize() // Set initial value
    window.addEventListener("resize", handleResize)

    return () => window.removeEventListener("resize", handleResize)
  }, [])

  const scrollToSection = (sectionId: string) => {
    const section = sections.find(s => s.id === sectionId)
    if (section?.element) {
      const yOffset = -140 // Account for both headers
      const y = section.element.getBoundingClientRect().top + window.scrollY + yOffset
      window.scrollTo({ top: y, behavior: "smooth" })
      onSectionChange?.(sectionId)
    }
  }

  const scrollToAdjacent = (direction: "up" | "down") => {
    const currentIndex = sections.findIndex(s => s.id === activeSection)
    const nextIndex = direction === "down" ? currentIndex + 1 : currentIndex - 1
    
    if (nextIndex >= 0 && nextIndex < sections.length) {
      scrollToSection(sections[nextIndex].id)
    }
  }

  if (!isVisible || isMobile) return null

  return (
    <div 
      className="fixed right-0 top-1/2 -translate-y-1/2 z-50 pointer-events-none"
    >
      {/* Minimal dots indicator */}
      <div 
        className={cn(
          "absolute right-2 transition-all duration-300 pointer-events-auto",
          isHovered ? "opacity-0 pointer-events-none" : "opacity-100"
        )}
        onMouseEnter={() => setIsHovered(true)}
      >
        <div className="flex flex-col gap-2 p-2">
          {sections.map((section, index) => {
            const isActive = activeSection === section.id
            return (
              <button
                key={section.id}
                onClick={() => scrollToSection(section.id)}
                className={cn(
                  "w-2 h-2 rounded-full transition-all duration-200",
                  isActive 
                    ? "bg-[#B5985A] w-3 h-3" 
                    : "bg-gray-300 hover:bg-gray-400"
                )}
                aria-label={`Go to ${section.label}`}
              />
            )
          })}
        </div>
      </div>

      {/* Full navigator on hover */}
      <div 
        className={cn(
          "transition-all duration-300 transform origin-right",
          isHovered 
            ? "opacity-100 scale-100 translate-x-0 pointer-events-auto" 
            : "opacity-0 scale-95 translate-x-4 pointer-events-none"
        )}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg shadow-lg p-2 mr-2">
          <Button
          variant="ghost"
          size="icon"
          onClick={() => scrollToAdjacent("up")}
          disabled={activeSection === sections[0]?.id}
          className="w-full h-8 mb-2"
        >
          <ChevronUp className="h-4 w-4" />
        </Button>

        <div className="space-y-1">
          {sections.map((section, index) => {
            const isActive = activeSection === section.id
            
            return (
              <div key={section.id} className="relative">
                <button
                  onClick={() => scrollToSection(section.id)}
                  className={cn(
                    "w-full px-3 py-2 text-left text-xs rounded-md transition-all duration-200",
                    "hover:bg-gray-100 relative overflow-hidden group",
                    isActive && "bg-[#B5985A]/10 text-[#B5985A] font-medium"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "w-6 text-center text-[10px] font-medium",
                      isActive ? "text-[#B5985A]" : "text-gray-400"
                    )}>
                      {index + 1}
                    </span>
                    <span className="truncate max-w-[120px]">{section.label}</span>
                  </div>
                  
                  {/* Progress indicator */}
                  {isActive && (
                    <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-[#B5985A]" />
                  )}
                </button>
                
                {/* Connector line */}
                {index < sections.length - 1 && (
                  <div className="absolute left-[15px] top-full h-1 w-px bg-gray-200" />
                )}
              </div>
            )
          })}
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => scrollToAdjacent("down")}
          disabled={activeSection === sections[sections.length - 1]?.id}
          className="w-full h-8 mt-2"
        >
          <ChevronDown className="h-4 w-4" />
        </Button>
        </div>
      </div>
    </div>
  )
}