"use client"

import { motion, AnimatePresence } from "framer-motion"
import { 
  X, 
  Home, 
  MapPin, 
  Users, 
  Bath, 
  Bed, 
  Euro, 
  Phone, 
  Mail, 
  User,
  Clock,
  AlertTriangle,
  CheckCircle,
  ExternalLink,
  Image as ImageIcon
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { 
  usePropertyDetails, 
  getPropertyAvailabilityStatus, 
  getCurrentPricing, 
  formatPriceDisplay,
  PropertySidebarData 
} from "@/hooks/use-property-details"
import { PropertyMapData } from "@/hooks/use-properties-map"
import { BookingStatus, BookingType, PropertyStatus, AvailabilityRequestStatus } from "@/generated/prisma"

interface PropertySidebarProps {
  property: PropertyMapData
  isOpen: boolean
  onClose: () => void
}

export function PropertySidebar({ property, isOpen, onClose }: PropertySidebarProps) {
  const router = useRouter()
  const { data: propertyDetails, isLoading, error } = usePropertyDetails(property.id)

  const handleViewDetails = () => {
    router.push(`/houses/${property.id}`)
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-96 z-50 bg-gray-900 border-l border-gray-700 overflow-y-auto"
          >
            {/* Header */}
            <div className="sticky top-0 bg-gray-900/95 backdrop-blur-xl border-b border-gray-700 p-6 z-10">
              <div className="flex items-start justify-between">
                <div className="flex-1 pr-4">
                  <h2 className="text-xl font-bold text-white mb-1 line-clamp-2">
                    {property.name}
                  </h2>
                  <div className="flex items-center gap-2 text-gray-400 text-sm">
                    <MapPin className="h-4 w-4" />
                    <span>{property.destination.name}, {property.destination.country}</span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="text-gray-400 hover:text-white shrink-0"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {isLoading ? (
                <PropertySidebarSkeleton />
              ) : error ? (
                <PropertySidebarError onRetry={() => window.location.reload()} />
              ) : propertyDetails ? (
                <PropertySidebarContent 
                  property={propertyDetails} 
                  onViewDetails={handleViewDetails}
                />
              ) : null}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

function PropertySidebarContent({ 
  property, 
  onViewDetails 
}: { 
  property: PropertySidebarData
  onViewDetails: () => void 
}) {
  const availabilityStatus = getPropertyAvailabilityStatus(property.bookings, property.availabilityRequests)
  const currentPricing = getCurrentPricing(property.priceRanges)

  return (
    <>
      {/* Hero Image */}
      <div className="aspect-video rounded-lg overflow-hidden bg-gray-800 border border-gray-700">
        {property.photos.length > 0 ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={property.photos.find(p => p.isMain)?.url || property.photos[0].url}
            alt={property.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="h-12 w-12 text-gray-600" />
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
          <div className="flex items-center gap-2">
            <Bed className="h-4 w-4 text-[#B5985A]" />
            <span className="text-gray-400 text-sm">Rooms</span>
          </div>
          <p className="text-white font-semibold mt-1">{property.numberOfRooms}</p>
        </div>
        <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
          <div className="flex items-center gap-2">
            <Bath className="h-4 w-4 text-[#B5985A]" />
            <span className="text-gray-400 text-sm">Bathrooms</span>
          </div>
          <p className="text-white font-semibold mt-1">{property.numberOfBathrooms}</p>
        </div>
        <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-[#B5985A]" />
            <span className="text-gray-400 text-sm">Max Guests</span>
          </div>
          <p className="text-white font-semibold mt-1">{property.maxGuests}</p>
        </div>
        <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
          <div className="flex items-center gap-2">
            <Home className="h-4 w-4 text-[#B5985A]" />
            <span className="text-gray-400 text-sm">Size</span>
          </div>
          <p className="text-white font-semibold mt-1">
            {property.propertySize ? `${property.propertySize}m²` : 'N/A'}
          </p>
        </div>
      </div>

      {/* Property Status */}
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-white font-medium">Status</h3>
          <PropertyStatusBadge status={property.status} />
        </div>
        <AvailabilityStatusCard status={availabilityStatus} />
      </div>

      {/* Upcoming Bookings */}
      {property.bookings.length > 0 && (
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white font-medium">Upcoming Bookings</h3>
            <Badge variant="secondary" className="text-xs">
              {property._count.bookings} total
            </Badge>
          </div>
          <div className="space-y-3">
            {property.bookings.slice(0, 3).map((booking) => (
              <BookingCard key={booking.id} booking={booking} />
            ))}
            {property.bookings.length > 3 && (
              <p className="text-center text-sm text-gray-400 pt-2">
                +{property.bookings.length - 3} more bookings
              </p>
            )}
          </div>
        </div>
      )}

      {/* Pricing Overview */}
      {property.priceRanges.length > 0 && (
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <h3 className="text-white font-medium mb-3">Current Pricing</h3>
          <PricingCard pricing={currentPricing} />
        </div>
      )}

      {/* Availability Requests */}
      {property.availabilityRequests.length > 0 && (
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <h3 className="text-white font-medium mb-3">Recent Requests</h3>
          <div className="space-y-2">
            {property.availabilityRequests.slice(0, 3).map((request) => (
              <AvailabilityRequestCard key={request.id} request={request} />
            ))}
          </div>
        </div>
      )}

      {/* Key Contacts */}
      {property.contacts.length > 0 && (
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <h3 className="text-white font-medium mb-3">Key Contacts</h3>
          <div className="space-y-3">
            {property.contacts
              .filter(contact => ['OWNER', 'MANAGER', 'AGENCY'].includes(contact.type))
              .slice(0, 3)
              .map((contact) => (
                <ContactCard key={contact.id} contact={contact} />
              ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="sticky bottom-0 bg-gray-900/95 backdrop-blur-xl border-t border-gray-700 p-4 -mx-6 -mb-6">
        <Button 
          onClick={onViewDetails}
          className="w-full bg-[#B5985A] hover:bg-[#9A7F4A] text-black font-medium"
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          View Full Details
        </Button>
      </div>
    </>
  )
}

function PropertyStatusBadge({ status }: { status: PropertyStatus }) {
  const statusConfig = {
    [PropertyStatus.PUBLISHED]: { 
      label: 'Published', 
      className: 'bg-green-500/20 text-green-400 border-green-500/30' 
    },
    [PropertyStatus.HIDDEN]: { 
      label: 'Hidden', 
      className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' 
    },
    [PropertyStatus.ONBOARDING]: { 
      label: 'Onboarding', 
      className: 'bg-blue-500/20 text-blue-400 border-blue-500/30' 
    },
    [PropertyStatus.OFFBOARDED]: { 
      label: 'Offboarded', 
      className: 'bg-red-500/20 text-red-400 border-red-500/30' 
    },
  }

  const config = statusConfig[status]
  return (
    <Badge variant="outline" className={cn("text-xs", config.className)}>
      {config.label}
    </Badge>
  )
}

function AvailabilityStatusCard({ status }: { status: ReturnType<typeof getPropertyAvailabilityStatus> }) {
  const icons = {
    occupied: AlertTriangle,
    'booked-soon': Clock,
    'pending-requests': Clock,
    available: CheckCircle,
  }

  const colors = {
    occupied: 'text-red-400',
    'booked-soon': 'text-yellow-400',
    'pending-requests': 'text-blue-400',
    available: 'text-green-400',
  }

  const Icon = icons[status.status]

  return (
    <div className="flex items-center gap-2">
      <Icon className={cn("h-4 w-4", colors[status.status])} />
      <span className="text-gray-300 text-sm">{status.message}</span>
    </div>
  )
}

function BookingCard({ booking }: { booking: PropertySidebarData['bookings'][0] }) {
  const startDate = new Date(booking.startDate).toLocaleDateString()
  const endDate = new Date(booking.endDate).toLocaleDateString()

  const statusColors = {
    [BookingStatus.CONFIRMED]: 'bg-green-500/20 text-green-400',
    [BookingStatus.PENDING]: 'bg-yellow-500/20 text-yellow-400',
    [BookingStatus.CANCELLED]: 'bg-red-500/20 text-red-400',
    [BookingStatus.COMPLETED]: 'bg-gray-500/20 text-gray-400',
  }

  const typeColors = {
    [BookingType.CONFIRMED]: 'text-green-400',
    [BookingType.TENTATIVE]: 'text-yellow-400',
    [BookingType.BLOCKED]: 'text-red-400',
    [BookingType.MAINTENANCE]: 'text-blue-400',
    [BookingType.OWNER]: 'text-purple-400',
    [BookingType.OWNER_STAY]: 'text-purple-400',
    [BookingType.CONTRACT]: 'text-gray-400',
  }

  return (
    <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-white text-sm font-medium">
            {booking.guestName || 'Guest'}
          </span>
          <Badge variant="outline" className={cn("text-xs", statusColors[booking.status])}>
            {booking.status}
          </Badge>
        </div>
        <div className="text-gray-400 text-xs">
          {startDate} - {endDate}
        </div>
        {booking.numberOfGuests && (
          <div className="text-gray-400 text-xs mt-1">
            {booking.numberOfGuests} guests
          </div>
        )}
      </div>
      <div className="text-right">
        <div className={cn("text-xs font-medium", typeColors[booking.type])}>
          {booking.type}
        </div>
        {booking.totalAmount && (
          <div className="text-gray-300 text-sm font-medium">
            €{booking.totalAmount}
          </div>
        )}
      </div>
    </div>
  )
}

function PricingCard({ pricing }: { pricing: ReturnType<typeof getCurrentPricing> }) {
  if (!pricing.range) return null

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-white font-medium">{pricing.range.name}</h4>
          <p className="text-gray-400 text-sm">
            {new Date(pricing.range.startDate).toLocaleDateString()} - {new Date(pricing.range.endDate).toLocaleDateString()}
          </p>
        </div>
        <Badge variant={pricing.isActive ? "default" : "secondary"} className="text-xs">
          {pricing.isActive ? 'Active' : 'Upcoming'}
        </Badge>
      </div>
      <div className="bg-gray-700/50 rounded-lg p-3">
        <div className="flex items-center gap-2 mb-2">
          <Euro className="h-4 w-4 text-[#B5985A]" />
          <span className="text-white font-medium">
            {formatPriceDisplay(pricing.range.publicNightlyRate, pricing.range.publicWeeklyRate)}
          </span>
        </div>
        <div className="text-gray-400 text-sm">
          Min stay: {pricing.range.minimumStay} night{pricing.range.minimumStay !== 1 ? 's' : ''}
        </div>
      </div>
    </div>
  )
}

function AvailabilityRequestCard({ request }: { request: PropertySidebarData['availabilityRequests'][0] }) {
  const startDate = new Date(request.startDate).toLocaleDateString()
  const endDate = new Date(request.endDate).toLocaleDateString()

  const statusColors = {
    [AvailabilityRequestStatus.PENDING]: 'bg-yellow-500/20 text-yellow-400',
    [AvailabilityRequestStatus.CONFIRMED]: 'bg-green-500/20 text-green-400',
    [AvailabilityRequestStatus.REJECTED]: 'bg-red-500/20 text-red-400',
  }

  return (
    <div className="flex items-center justify-between p-2 bg-gray-700/30 rounded">
      <div className="flex-1">
        <div className="text-white text-sm">{request.guestName}</div>
        <div className="text-gray-400 text-xs">
          {startDate} - {endDate} • {request.numberOfGuests} guests
        </div>
      </div>
      <Badge variant="outline" className={cn("text-xs", statusColors[request.status])}>
        {request.status}
      </Badge>
    </div>
  )
}

function ContactCard({ contact }: { contact: PropertySidebarData['contacts'][0] }) {
  const displayName = contact.firstName && contact.lastName 
    ? `${contact.firstName} ${contact.lastName}`
    : contact.name

  return (
    <div className="flex items-center gap-3 p-3 bg-gray-700/50 rounded-lg">
      <div className="p-2 bg-[#B5985A]/20 rounded-lg">
        <User className="h-4 w-4 text-[#B5985A]" />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="text-white text-sm font-medium">{displayName}</span>
          {contact.isContractSignatory && (
            <Badge variant="outline" className="text-xs text-[#B5985A] border-[#B5985A]/30">
              Signatory
            </Badge>
          )}
        </div>
        <div className="text-gray-400 text-xs mb-1 capitalize">
          {contact.type.toLowerCase().replace('_', ' ')}
        </div>
        <div className="flex items-center gap-4 text-xs">
          {contact.email && (
            <div className="flex items-center gap-1 text-gray-400">
              <Mail className="h-3 w-3" />
              <span className="truncate max-w-[120px]">{contact.email}</span>
            </div>
          )}
          {contact.phone && (
            <div className="flex items-center gap-1 text-gray-400">
              <Phone className="h-3 w-3" />
              <span>{contact.phone}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function PropertySidebarSkeleton() {
  return (
    <div className="space-y-6">
      {/* Hero skeleton */}
      <Skeleton className="aspect-video w-full" />
      
      {/* Stats skeleton */}
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-16" />
        ))}
      </div>
      
      {/* Content sections skeleton */}
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-24 w-full" />
        </div>
      ))}
    </div>
  )
}

function PropertySidebarError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="text-center py-8">
      <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
      <p className="text-white font-medium mb-2">Failed to load property details</p>
      <p className="text-gray-400 text-sm mb-4">Something went wrong while fetching the data.</p>
      <Button onClick={onRetry} variant="outline" className="border-gray-600 text-gray-300">
        Try Again
      </Button>
    </div>
  )
}