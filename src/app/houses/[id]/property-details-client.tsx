"use client"

import React, { useRef, useState, useEffect, lazy, Suspense } from "react"
import { PropertyNavigation } from "@/components/property-detail/property-navigation"
import { SectionNavigator } from "@/components/property-detail/section-navigator"
import { CommandPalette } from "@/components/property-detail/command-palette"
import { ImageViewerModal } from "@/components/property-detail/image-viewer-modal"
import { GlassCard } from "@/components/ui/glass-card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Command, Home, Info, MapPin, FileText, Thermometer, Calendar, Wrench, AlertCircle, Shield, Megaphone, Camera, Link, DoorOpen, Users, Images, ChevronLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import type { PropertyWithRelations } from "@/types"
import { usePermissions } from "@/hooks/use-permissions"
import { Permission } from "@/types/auth"
import { Section } from "@/components/property-detail/property-navigation"

// Lazy load all sections for better performance
const PromoteSection = lazy(() => import("@/components/property-detail/sections/promote-section").then(m => ({ default: m.PromoteSection })))
const HouseInfoSection = lazy(() => import("@/components/property-detail/sections/house-info-section").then(m => ({ default: m.HouseInfoSection })))
const LocationSection = lazy(() => import("@/components/property-detail/sections/location-section").then(m => ({ default: m.LocationSection })))
const FurtherInfoSection = lazy(() => import("@/components/property-detail/sections/further-info-section").then(m => ({ default: m.FurtherInfoSection })))
const HeatingSection = lazy(() => import("@/components/property-detail/sections/heating-section").then(m => ({ default: m.HeatingSection })))
const EventsSection = lazy(() => import("@/components/property-detail/sections/events-section").then(m => ({ default: m.EventsSection })))
const ServicesSection = lazy(() => import("@/components/property-detail/sections/services-section").then(m => ({ default: m.ServicesSection })))
const GoodToKnowSection = lazy(() => import("@/components/property-detail/sections/good-to-know-section").then(m => ({ default: m.GoodToKnowSection })))
const InternalSection = lazy(() => import("@/components/property-detail/sections/internal-section").then(m => ({ default: m.InternalSection })))
const MarketingSection = lazy(() => import("@/components/property-detail/sections/marketing-section").then(m => ({ default: m.MarketingSection })))
const PhotosSection = lazy(() => import("@/components/property-detail/sections/photos-section").then(m => ({ default: m.PhotosSection })))
const LinksSection = lazy(() => import("@/components/property-detail/sections/links-section").then(m => ({ default: m.LinksSection })))
const ContactsSection = lazy(() => import("@/components/property-detail/sections/contacts-section").then(m => ({ default: m.ContactsSection })))
const RoomBuilder = lazy(() => import("@/components/property-detail/sections/room-builder").then(m => ({ default: m.RoomBuilder })))

// Section loading skeleton
function SectionSkeleton() {
  return (
    <GlassCard className="animate-pulse">
      <div className="px-8 py-6 border-b border-gray-100/50">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      </div>
      <div className="px-8 py-6 space-y-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-32 w-full" />
      </div>
    </GlassCard>
  )
}

interface PropertyDetailsWrapperProps {
  property: PropertyWithRelations
}

export function PropertyDetailsClient({ property }: PropertyDetailsWrapperProps) {
  const [currentSection, setCurrentSection] = useState("promote")
  const [navigationExpanded, setNavigationExpanded] = useState(true)
  const [navigatorSections, setNavigatorSections] = useState<{ id: string; label: string; element?: HTMLElement | null }[]>([])
  const [visibleSections, setVisibleSections] = useState(new Set<string>())
  const [showPhotoViewer, setShowPhotoViewer] = useState(false)
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const observerRef = useRef<IntersectionObserver | null>(null)
  const { canViewSection } = usePermissions()
  const router = useRouter()

  const allSections = [
    { id: "promote", label: "Promote", component: PromoteSection, icon: Home, description: "Visibility and positioning" },
    { id: "info", label: "House Information", component: HouseInfoSection, icon: Info, description: "Basic property details" },
    { id: "location", label: "Location", component: LocationSection, icon: MapPin, description: "Address and coordinates" },
    { id: "further-info", label: "Further Information", component: FurtherInfoSection, icon: FileText, description: "Additional details" },
    { id: "heating", label: "Heating & AC", component: HeatingSection, icon: Thermometer, description: "Climate control systems" },
    { id: "events", label: "Events", component: EventsSection, icon: Calendar, description: "Special events and activities" },
    { id: "services", label: "Services", component: ServicesSection, icon: Wrench, description: "Available amenities" },
    { id: "good-to-know", label: "Good to Know", component: GoodToKnowSection, icon: AlertCircle, description: "Important information" },
    { id: "internal", label: "Internal", component: InternalSection, icon: Shield, description: "Private notes and data", permission: Permission.INTERNAL_VIEW, isInternal: true },
    { id: "contacts", label: "Linked Contacts", component: ContactsSection, icon: Users, description: "Property contacts and service providers", permission: Permission.CONTACTS_VIEW },
    { id: "marketing", label: "Automatic Offer", component: MarketingSection, icon: Megaphone, description: "Marketing content" },
    { id: "photos", label: "Photos", component: PhotosSection, icon: Camera, description: "Property images" },
    { id: "links", label: "Links & Resources", component: LinksSection, icon: Link, description: "External resources" },
    { id: "rooms", label: "Rooms", component: RoomBuilder, icon: DoorOpen, description: "Room configuration" },
  ]

  // Filter sections based on user permissions
  const sections = allSections.filter(section => {
    if (section.permission) {
      return canViewSection(section.id);
    }
    return true;
  })

  // Create navigation sections with the necessary properties for PropertyNavigation
  const navigationSections: Section[] = sections.map(section => ({
    id: section.id,
    label: section.label,
    icon: section.icon,
    description: section.description,
    isInternal: section.isInternal,
  }))

  const handleSectionChange = (sectionId: string) => {
    setCurrentSection(sectionId)
    const element = sectionRefs.current[sectionId]
    if (element) {
      const yOffset = -120 // Account for dashboard header and sticky header
      const y = element.getBoundingClientRect().top + window.scrollY + yOffset
      window.scrollTo({ top: y, behavior: "smooth" })
    }
  }

  // Calculate completion status (simplified for now)
  const completionStatus = {
    promote: !!property.exclusivity || !!property.position,
    info: !!property.name && !!property.numberOfRooms,
    location: !!(property.address || property.city || property.postcode || property.neighborhood || (property.latitude && property.longitude)),
    "further-info": !!property.accessibility || !!property.policies,
    heating: !!property.heatingAC,
    events: !!property.eventsAllowed || !!property.eventsCapacity,
    services: !!property.services,
    "good-to-know": !!property.goodToKnow,
    internal: !!property.internalComment || !!property.warning,
    contacts: (property.contacts?.length ?? 0) > 0,
    marketing: !!property.automaticOffer,
    photos: (property.photos?.length ?? 0) > 0,
    links: (property.resources?.length ?? 0) > 0,
    rooms: (property.rooms?.length ?? 0) > 0,
  }

  // Setup intersection observer for virtualization
  useEffect(() => {
    // Create observer to track which sections are visible
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const sectionId = entry.target.getAttribute('data-section-id')
          if (sectionId) {
            setVisibleSections((prev) => {
              const next = new Set(prev)
              if (entry.isIntersecting) {
                next.add(sectionId)
              } else {
                // Keep a buffer of 1 section above and below
                const sectionIndex = sections.findIndex(s => s.id === sectionId)
                const hasAdjacentVisible = 
                  (sectionIndex > 0 && prev.has(sections[sectionIndex - 1].id)) ||
                  (sectionIndex < sections.length - 1 && prev.has(sections[sectionIndex + 1].id))
                
                if (!hasAdjacentVisible) {
                  next.delete(sectionId)
                }
              }
              return next
            })
          }
        })
      },
      {
        rootMargin: '100px 0px', // Load sections 100px before they come into view
        threshold: 0,
      }
    )

    // Observe all section containers
    Object.values(sectionRefs.current).forEach((ref) => {
      if (ref && observerRef.current) {
        observerRef.current.observe(ref)
      }
    })

    return () => {
      observerRef.current?.disconnect()
    }
  }, [sections])

  // Update navigatorSections when refs are populated
  useEffect(() => {
    // Create a small delay to ensure refs are populated
    const timer = setTimeout(() => {
      setNavigatorSections(
        sections.map(section => ({
          id: section.id,
          label: section.label,
          element: sectionRefs.current[section.id],
        }))
      )
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="relative flex -mx-6 -my-6 min-h-[calc(100vh-3.5rem)] luxury-gradient-bg">
      {/* Floating luxury particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className="luxury-particle"
            style={{
              left: `${10 + i * 9}%`,
              animationDelay: `${-i * 1.5}s`,
              animationDuration: `${12 + Math.random() * 6}s`
            }}
          />
        ))}
      </div>

      {/* Left Navigation with enhanced glass effect */}
      <div className="relative z-40">
        <PropertyNavigation
          propertyId={property.id}
          currentSection={currentSection}
          onSectionChange={handleSectionChange}
          completionStatus={completionStatus}
          onExpandChange={setNavigationExpanded}
          sections={navigationSections}
        />
      </div>

      {/* Main Content - flush with navigation */}
      <div className="relative z-20 flex-1 flex flex-col bg-transparent">
        {/* Sticky Header with enhanced glass effect - seamlessly connected to navigation */}
        <div className="sticky top-14 z-30 bg-gradient-to-b from-white/85 to-white/75 backdrop-blur-2xl pl-8 pr-8 pb-6 pt-6 border-b border-white/40 shadow-lg flex-shrink-0">
            {/* Back button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/houses")}
              className="mb-4 -ml-2"
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Back to Houses
            </Button>
            
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-extralight text-gray-900 tracking-tight">
                  {property.name}
                </h1>
                <p className="text-sm text-gray-600 mt-2 font-light">
                  Complete all sections to publish this luxury property
                </p>
              </div>
              <div className="flex items-center gap-4">
                {/* View All Photos Button */}
                {property.photos && property.photos.length > 0 && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="gap-2"
                    onClick={() => setShowPhotoViewer(true)}
                  >
                    <Images className="h-4 w-4" />
                    <span className="text-sm">View All Photos</span>
                  </Button>
                )}
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-2"
                  onClick={() => {
                    const e = new KeyboardEvent("keydown", {
                      key: "k",
                      metaKey: true
                    })
                    document.dispatchEvent(e)
                  }}
                >
                  <Command className="h-4 w-4" />
                  <span className="text-xs text-gray-500">⌘K</span>
                </Button>
                <div className={cn(
                  "ml-4 flex items-center gap-4",
                  !navigationExpanded && "hidden lg:flex"
                )}>
                  <div className="text-right">
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Progress</p>
                    <p className="text-2xl font-light text-[#B5985A]">
                      {Math.round((Object.values(completionStatus).filter(Boolean).length / sections.length) * 100)}%
                    </p>
                  </div>
                  <div className="h-16 w-16">
                    <svg className="transform -rotate-90 w-16 h-16">
                      <circle
                        cx="32"
                        cy="32"
                        r="28"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                        className="text-gray-200"
                      />
                      <circle
                        cx="32"
                        cy="32"
                        r="28"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                        strokeDasharray={`${2 * Math.PI * 28}`}
                        strokeDashoffset={`${2 * Math.PI * 28 * (1 - Object.values(completionStatus).filter(Boolean).length / sections.length)}`}
                        className="text-[#B5985A] transition-all duration-500"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>

        {/* Scrollable sections container */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-8 py-8">
            <div className="max-w-7xl mx-auto space-y-12">
            {sections.map((section, index) => {
              const isInitiallyVisible = index < 3 // Always show first 3 sections
              const shouldRender = isInitiallyVisible || visibleSections.has(section.id)
              
              return (
                <div
                  key={section.id}
                  id={section.id}
                  data-section-id={section.id}
                  ref={(el) => {
                    if (el && sectionRefs.current[section.id] !== el) {
                      sectionRefs.current[section.id] = el
                      // Observe this section
                      if (observerRef.current) {
                        observerRef.current.observe(el)
                      }
                      // Update navigatorSections when a new ref is set
                      setNavigatorSections(prev => 
                        prev.map(navSection => 
                          navSection.id === section.id 
                            ? { ...navSection, element: el }
                            : navSection
                        )
                      )
                    }
                  }}
                  className={cn(
                    "scroll-mt-36 transition-all duration-500 mb-6",
                    currentSection === section.id ? "opacity-100" : "opacity-80"
                  )}
                >
                  <GlassCard variant="luxury" className="animate-in fade-in-0 slide-in-from-bottom-4 duration-700" style={{ animationDelay: `${index * 100}ms` }}>
                    {/* Section Header */}
                    <div className={cn(
                      "px-8 py-6 border-b border-gray-100/50",
                      section.id === "internal" && "bg-amber-50/30"
                    )}>
                      <div className="flex items-center justify-between">
                        <div>
                          <h2 className="text-xl font-light text-gray-900 tracking-tight">
                            <span className="text-[#B5985A] font-normal">{index + 1}.</span> {section.label}
                          </h2>
                          <p className="text-sm text-gray-600 mt-1">
                            {section.id === "promote" && "Control visibility and positioning"}
                            {section.id === "info" && "Basic property information"}
                            {section.id === "location" && "Property location details"}
                            {section.id === "further-info" && "Additional property details"}
                            {section.id === "heating" && "Climate control information"}
                            {section.id === "events" && "Special events and activities"}
                            {section.id === "services" && "Available services and amenities"}
                            {section.id === "good-to-know" && "Important guest information"}
                            {section.id === "internal" && "Private notes and configuration"}
                            {section.id === "contacts" && "Property contacts and service providers"}
                            {section.id === "marketing" && "Marketing content and offers"}
                            {section.id === "photos" && "Property images and galleries"}
                            {section.id === "links" && "External links and resources"}
                            {section.id === "rooms" && "Room configuration and details"}
                          </p>
                        </div>
                        {completionStatus[section.id as keyof typeof completionStatus] && (
                          <div className="flex items-center gap-2 text-emerald-600">
                            <div className="h-8 w-8 rounded-full bg-emerald-50 flex items-center justify-center">
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                            <span className="text-sm font-light">Complete</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Section Content */}
                    <div className="px-8 py-6">
                      {shouldRender ? (
                        <Suspense fallback={
                          <div className="space-y-4">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-32 w-full" />
                          </div>
                        }>
                          {(() => {
                            switch (section.id) {
                              case "photos":
                                return <PhotosSection propertyId={property.id} />
                              case "links":
                                return <LinksSection propertyId={property.id} />
                              case "rooms":
                                return <RoomBuilder propertyId={property.id} rooms={property.rooms || []} />
                              default:
                                const Component = section.component as React.ComponentType<{ property: PropertyWithRelations }>
                                return <Component property={property} />
                            }
                          })()}
                        </Suspense>
                      ) : (
                        <div className="h-64 flex items-center justify-center">
                          <div className="text-center">
                            <Skeleton className="h-8 w-48 mx-auto mb-4" />
                            <Skeleton className="h-4 w-64 mx-auto" />
                          </div>
                        </div>
                      )}
                    </div>
                  </GlassCard>
                </div>
              )
            })}
            </div>
          </div>

          {/* Bottom Padding */}
          <div className="h-16" />
        </div>
      </div>

      {/* Section Navigator */}
      <SectionNavigator
        sections={navigatorSections}
        currentSection={currentSection}
        onSectionChange={handleSectionChange}
      />

      {/* Command Palette */}
      <CommandPalette propertyId={property.id} />
      
      {/* Image Viewer Modal */}
      {property.photos && (
        <ImageViewerModal
          isOpen={showPhotoViewer}
          onClose={() => setShowPhotoViewer(false)}
          photos={property.photos}
          initialIndex={0}
        />
      )}
    </div>
  )
}