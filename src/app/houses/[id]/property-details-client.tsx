"use client"

import React, { useRef, useState, useEffect, lazy, Suspense } from "react"
import { PropertyNavigation } from "@/components/property-detail/property-navigation"
import { SectionNavigator } from "@/components/property-detail/section-navigator"
import { CommandPalette } from "@/components/property-detail/command-palette"
import { ImageViewerModal } from "@/components/property-detail/image-viewer-modal"
import { GlassCard } from "@/components/ui/glass-card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Command, Home, Info, MapPin, FileText, Thermometer, Calendar, Wrench, AlertCircle, Shield, Megaphone, Camera, Link, DoorOpen, Users, Images, ChevronLeft, MapPinned, Book, DollarSign } from "lucide-react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import type { PropertyWithRelations, SurroundingsInfo, StayMetadata } from "@/types"
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
const SurroundingsSection = lazy(() => import("@/components/property-detail/sections/surroundings-section").then(m => ({ default: m.SurroundingsSection })))
const StaySection = lazy(() => import("@/components/property-detail/sections/stay-section").then(m => ({ default: m.StaySection })))
const PricingSection = lazy(() => import("@/components/property-detail/sections/pricing-section").then(m => ({ default: m.PricingSection })))
const AvailabilitySection = lazy(() => import("@/components/availability/availability-section").then(m => ({ default: m.AvailabilitySection })))

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

interface SectionConfig {
  id: string
  label: string
  component: React.ComponentType<any> | null
  icon: React.ComponentType
  description: string
  permission?: Permission
  isInternal?: boolean
  isContainer?: boolean
  parentSection?: string
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
  
  // Memoize rooms array to prevent re-renders
  const propertyRooms = React.useMemo(() => property.rooms || [], [property.rooms])

  const allSections: SectionConfig[] = [
    { id: "promote", label: "Promote", component: PromoteSection, icon: Home, description: "Visibility and positioning" },
    { id: "surroundings", label: "Surroundings", component: SurroundingsSection, icon: MapPinned, description: "Property environment and area" },
    { id: "pricing", label: "Pricing", component: PricingSection, icon: DollarSign, description: "Pricing and rates management", permission: Permission.FINANCIAL_VIEW },
    { id: "availability", label: "Availability", component: AvailabilitySection, icon: Calendar, description: "Booking calendar and availability management" },
    
    // Property Details container - expanded with more subsections
    { id: "property-details", label: "Property Details", component: null, icon: Info, description: "Complete property information", isContainer: true },
    { id: "info", label: "House Information", component: HouseInfoSection, icon: Info, description: "Basic property details", parentSection: "property-details" },
    { id: "location", label: "Location", component: LocationSection, icon: MapPin, description: "Address and coordinates", parentSection: "property-details" },
    { id: "further-info", label: "Further Information", component: FurtherInfoSection, icon: FileText, description: "Additional details", parentSection: "property-details" },
    { id: "rooms", label: "Rooms", component: RoomBuilder, icon: DoorOpen, description: "Room configuration", parentSection: "property-details" },
    { id: "heating", label: "Heating & AC", component: HeatingSection, icon: Thermometer, description: "Climate control systems", parentSection: "property-details" },
    { id: "services", label: "Services", component: ServicesSection, icon: Wrench, description: "Available amenities", parentSection: "property-details" },
    { id: "contacts", label: "Linked Contacts", component: ContactsSection, icon: Users, description: "Property contacts and service providers", permission: Permission.CONTACTS_VIEW, parentSection: "property-details" },
    
    // Guest Information container
    { id: "guest-info", label: "Guest Information", component: null, icon: Users, description: "Information for guests", isContainer: true },
    { id: "stay", label: "Stay", component: StaySection, icon: Book, description: "Guest stay information", parentSection: "guest-info" },
    { id: "good-to-know", label: "Good to Know", component: GoodToKnowSection, icon: AlertCircle, description: "Important information", parentSection: "guest-info" },
    { id: "events", label: "Events", component: EventsSection, icon: Calendar, description: "Special events and activities", parentSection: "guest-info" },
    
    // Marketing & Media container
    { id: "marketing-media", label: "Marketing & Media", component: null, icon: Camera, description: "Marketing content and media", isContainer: true },
    { id: "marketing", label: "Automatic Offer", component: MarketingSection, icon: Megaphone, description: "Marketing content", parentSection: "marketing-media" },
    { id: "photos", label: "Photos", component: PhotosSection, icon: Camera, description: "Property images", parentSection: "marketing-media" },
    { id: "links", label: "Links & Resources", component: LinksSection, icon: Link, description: "External resources", parentSection: "marketing-media" },
    
    // Standalone sections at the end
    { id: "internal", label: "Internal", component: InternalSection, icon: Shield, description: "Private notes and data", permission: Permission.INTERNAL_VIEW, isInternal: true },
  ]

  // Filter sections based on user permissions
  const sections = allSections.filter(section => {
    if (section.permission) {
      return canViewSection(section.id);
    }
    return true;
  })

  // Create navigation sections with the necessary properties for PropertyNavigation
  // Include both parent sections and subsections in the correct order
  const navigationSections: Section[] = (() => {
    const result: Section[] = []
    const addedIds = new Set<string>()
    
    // Process each section in order
    sections.forEach(section => {
      // Skip if already added or if it's a subsection (we'll add it with its parent)
      if (addedIds.has(section.id) || section.parentSection) {
        return
      }
      
      // Add the parent section
      result.push({
        id: section.id,
        label: section.label,
        icon: section.icon,
        description: section.description,
        isInternal: section.isInternal,
        isContainer: section.isContainer,
        parentSection: section.parentSection,
      })
      addedIds.add(section.id)
      
      // If this is a container section, immediately add its subsections
      if (section.isContainer) {
        const subsections = sections.filter(s => s.parentSection === section.id)
        subsections.forEach(subsection => {
          result.push({
            id: subsection.id,
            label: subsection.label,
            icon: subsection.icon,
            description: subsection.description,
            isInternal: subsection.isInternal,
            isContainer: subsection.isContainer,
            parentSection: subsection.parentSection,
          })
          addedIds.add(subsection.id)
        })
      }
    })
    
    return result
  })()

  const handleSectionChange = (sectionId: string) => {
    setCurrentSection(sectionId)
    // Only scroll if the section is not already visible/active to prevent conflicts
    const element = sectionRefs.current[sectionId]
    if (element && currentSection !== sectionId) {
      const yOffset = -80 // Account for dashboard header and reduced sticky header
      const y = element.getBoundingClientRect().top + window.scrollY + yOffset
      window.scrollTo({ top: y, behavior: "smooth" })
    }
  }

  // Calculate completion status (simplified for now)
  const completionStatus: Record<string, boolean> = {
    promote: !!property.exclusivity || !!property.position,
    surroundings: !!(property.surroundings && (property.surroundings as SurroundingsInfo).filters?.length),
    pricing: !!(property.pricing || (property.prices && property.prices.length > 0)),
    availability: true, // Availability section is always considered complete since it shows current bookings
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
    stay: !!(property.checkInTime || property.checkOutTime || property.stayMetadata),
  }
  
  // Calculate property-details completion based on its subsections
  completionStatus["property-details"] = !!(
    completionStatus.info &&
    completionStatus.location &&
    completionStatus["further-info"] &&
    completionStatus.rooms &&
    completionStatus.heating &&
    completionStatus.services &&
    completionStatus.contacts
  )
  
  // Calculate guest-info completion based on its subsections
  completionStatus["guest-info"] = !!(
    completionStatus.stay &&
    completionStatus["good-to-know"] &&
    completionStatus.events
  )
  
  // Calculate marketing-media completion based on its subsections
  completionStatus["marketing-media"] = !!(
    completionStatus.marketing &&
    completionStatus.photos &&
    completionStatus.links
  )

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
        navigationSections.map(section => ({
          id: section.id,
          label: section.label,
          element: sectionRefs.current[section.id],
        }))
      )
    }, 100)

    return () => clearTimeout(timer)
  }, [navigationSections])

  return (
    <div className="relative flex min-h-[calc(100vh-3.5rem)] luxury-gradient-bg">
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

      <div className="relative z-20 flex-1 flex flex-col bg-transparent">
        <div className="sticky top-14 z-30 bg-white/90 backdrop-blur-md pl-8 pr-8 pb-3 pt-3 border-b border-gray-200/60 flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/houses")}
              className="mb-2 -ml-2 h-7 px-2 text-sm"
            >
              <ChevronLeft className="mr-1 h-3 w-3" />
              Back to Houses
            </Button>
            
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-lg font-medium text-gray-900">
                  {property.name}
                </h1>
                <p className="text-xs text-gray-500 mt-1">
                  Complete all sections to publish this luxury property
                </p>
              </div>
              <div className="flex items-center gap-2">
                {property.photos && property.photos.length > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="gap-1 h-7 px-2 text-xs"
                    onClick={() => setShowPhotoViewer(true)}
                  >
                    <Images className="h-3 w-3" />
                    Photos
                  </Button>
                )}
                
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="gap-1 h-7 px-2"
                  onClick={() => {
                    const e = new KeyboardEvent("keydown", {
                      key: "k",
                      metaKey: true
                    })
                    document.dispatchEvent(e)
                  }}
                >
                  <Command className="h-3 w-3" />
                  <span className="text-xs text-gray-400">⌘K</span>
                </Button>
                <div className={cn(
                  "ml-2 flex items-center gap-2",
                  !navigationExpanded && "hidden lg:flex"
                )}>
                  <div className="text-right">
                    <p className="text-xs text-[#B5985A] font-medium">
                      {Math.round((Object.values(completionStatus).filter(Boolean).length / sections.length) * 100)}%
                    </p>
                  </div>
                  <div className="h-8 w-8">
                    <svg className="transform -rotate-90 w-8 h-8">
                      <circle
                        cx="16"
                        cy="16"
                        r="12"
                        stroke="currentColor"
                        strokeWidth="2"
                        fill="none"
                        className="text-gray-200"
                      />
                      <circle
                        cx="16"
                        cy="16"
                        r="12"
                        stroke="currentColor"
                        strokeWidth="2"
                        fill="none"
                        strokeDasharray={`${2 * Math.PI * 12}`}
                        strokeDashoffset={`${2 * Math.PI * 12 * (1 - Object.values(completionStatus).filter(Boolean).length / sections.length)}`}
                        className="text-[#B5985A] transition-all duration-500"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>

        <div className="flex-1">
          <div className="px-4 sm:px-6 lg:px-8 py-8">
            <div className="space-y-12">
            {(() => {
              // Group sections by parent
              const topLevelSections = sections.filter(s => !s.parentSection)
              const sectionsByParent = sections.reduce((acc, section) => {
                if (section.parentSection) {
                  if (!acc[section.parentSection]) {
                    acc[section.parentSection] = []
                  }
                  acc[section.parentSection].push(section)
                }
                return acc
              }, {} as Record<string, typeof sections>)
              
              let sectionIndex = 0
              
              return topLevelSections.map((section) => {
                const isInitiallyVisible = sectionIndex < 3 // Always show first 3 sections
                const shouldRender = isInitiallyVisible || visibleSections.has(section.id)
                const currentIndex = sectionIndex++
                
                if (section.isContainer && sectionsByParent[section.id]) {
                  // Render container with subsections
                  const subsections = sectionsByParent[section.id]
                  
                  return (
                    <div
                      key={section.id}
                      id={section.id}
                      data-section-id={section.id}
                      ref={(el) => {
                        if (el && sectionRefs.current[section.id] !== el) {
                          sectionRefs.current[section.id] = el
                          if (observerRef.current) {
                            observerRef.current.observe(el)
                          }
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
                        "scroll-mt-24 transition-all duration-500 mb-6"
                      )}
                    >
                      <GlassCard variant="luxury" className={cn(
                        "animate-in fade-in-0 slide-in-from-bottom-4 duration-700",
                        section.id === "property-details" && "border-dashed"
                      )} style={{ animationDelay: `${currentIndex * 100}ms` }}>
                        <div className="px-8 py-6 border-b border-gray-100/50">
                          <div className="flex items-center justify-between">
                            <div>
                              <h2 className="text-xl font-light text-gray-900 tracking-tight">
                                <span className="text-[#B5985A] font-normal">{currentIndex + 1}.</span> {section.label}
                              </h2>
                              <p className="text-sm text-gray-600 mt-1">
                                {section.description}
                              </p>
                            </div>
                            {completionStatus[section.id] && (
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

                        <div className="divide-y divide-gray-100">
                          {subsections.map((subsection, subIndex) => (
                            <div 
                              key={subsection.id}
                              id={subsection.id}
                              data-section-id={subsection.id}
                              ref={(el) => {
                                if (el && sectionRefs.current[subsection.id] !== el) {
                                  sectionRefs.current[subsection.id] = el
                                  if (observerRef.current) {
                                    observerRef.current.observe(el)
                                  }
                                  setNavigatorSections(prev => 
                                    prev.map(navSection => 
                                      navSection.id === subsection.id 
                                        ? { ...navSection, element: el }
                                        : navSection
                                    )
                                  )
                                }
                              }}
                              className="px-8 py-6 scroll-mt-24"
                            >
                              <h3 className="text-lg font-medium text-gray-900 mb-4">
                                {subsection.label}
                              </h3>
                              {shouldRender ? (
                                <Suspense fallback={
                                  <div className="space-y-4">
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-4 w-3/4" />
                                    <Skeleton className="h-32 w-full" />
                                  </div>
                                }>
                                  {(() => {
                                    switch (subsection.id) {
                                      case "photos":
                                        return <PhotosSection propertyId={property.id} />
                                      case "links":
                                        return <LinksSection propertyId={property.id} />
                                      case "rooms":
                                        return <RoomBuilder propertyId={property.id} rooms={propertyRooms} />
                                      default:
                                        const Component = subsection.component as React.ComponentType<{ property: PropertyWithRelations }>
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
                          ))}
                        </div>
                      </GlassCard>
                    </div>
                  )
                } else {
                  // Render regular section
                  return (
                    <div
                      key={section.id}
                      id={section.id}
                      data-section-id={section.id}
                      ref={(el) => {
                        if (el && sectionRefs.current[section.id] !== el) {
                          sectionRefs.current[section.id] = el
                          if (observerRef.current) {
                            observerRef.current.observe(el)
                          }
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
                        "scroll-mt-24 transition-all duration-500 mb-6"
                      )}
                    >
                      <GlassCard variant="luxury" className="animate-in fade-in-0 slide-in-from-bottom-4 duration-700" style={{ animationDelay: `${currentIndex * 100}ms` }}>
                        <div className={cn(
                          "px-8 py-6 border-b border-gray-100/50",
                          section.id === "internal" && "bg-amber-50/30"
                        )}>
                          <div className="flex items-center justify-between">
                            <div>
                              <h2 className="text-xl font-light text-gray-900 tracking-tight">
                                <span className="text-[#B5985A] font-normal">{currentIndex + 1}.</span> {section.label}
                              </h2>
                              <p className="text-sm text-gray-600 mt-1">
                                {section.id === "promote" && "Control visibility and positioning"}
                                {section.id === "availability" && "Booking calendar and availability management"}
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
                                {section.id === "property-details" && section.description}
                              </p>
                            </div>
                            {completionStatus[section.id] && (
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

                        <div className="">
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
                                    return <RoomBuilder propertyId={property.id} rooms={propertyRooms} />
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
                }
              })
            })()}
            </div>
          </div>

          <div className="h-16" />
        </div>
      </div>

      <SectionNavigator
        sections={navigatorSections}
        currentSection={currentSection}
        onSectionChange={handleSectionChange}
      />

      <CommandPalette propertyId={property.id} />
      
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