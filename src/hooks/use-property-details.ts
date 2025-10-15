import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { PropertyStatus, BookingStatus, BookingType, AvailabilityRequestStatus } from "@/generated/prisma"

// Property sidebar data interface - optimized for sidebar display
export interface PropertySidebarData {
  id: string
  name: string
  status: PropertyStatus
  numberOfRooms: number
  numberOfBathrooms: number
  maxGuests: number
  propertySize?: number
  destination: {
    id: string
    name: string
    country: string
  }
  photos: {
    id: string
    url: string
    isMain: boolean
    caption?: string
  }[]
  bookings: BookingPreview[]
  priceRanges: PriceRangePreview[]
  availabilityRequests: AvailabilityRequestPreview[]
  contacts: PropertyContactPreview[]
  _count: {
    rooms: number
    bookings: number
    photos: number
  }
}

// Supporting interfaces for sidebar data
export interface BookingPreview {
  id: string
  type: BookingType
  status: BookingStatus
  startDate: string
  endDate: string
  guestName?: string
  numberOfGuests?: number
  totalAmount?: number
}

export interface PriceRangePreview {
  id: string
  name: string
  startDate: string
  endDate: string
  publicNightlyRate?: number
  publicWeeklyRate?: number
  minimumStay: number
  isValidated: boolean
}

export interface AvailabilityRequestPreview {
  id: string
  startDate: string
  endDate: string
  guestName: string
  numberOfGuests: number
  status: AvailabilityRequestStatus
  createdAt: string
}

export interface PropertyContactPreview {
  id: string
  type: string
  name: string
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  isApproved: boolean
  isContractSignatory: boolean
}

// Query keys for property details
export const propertyDetailsKeys = {
  all: ["property-details"] as const,
  detail: (id: string) => [...propertyDetailsKeys.all, id] as const,
}

// Fetch comprehensive property data for sidebar display
export function usePropertyDetails(propertyId: string) {
  return useQuery({
    queryKey: propertyDetailsKeys.detail(propertyId),
    queryFn: async () => {
      const response = await api.get<PropertySidebarData>(`/api/properties/${propertyId}/details`)
      return response
    },
    enabled: !!propertyId,
    // Cache for 5 minutes since property details don't change frequently
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })
}

// Helper function to get property availability status
export function getPropertyAvailabilityStatus(
  bookings: BookingPreview[],
  availabilityRequests: AvailabilityRequestPreview[]
) {
  const now = new Date()
  const today = now.toISOString().split('T')[0]
  
  // Check if property is currently occupied
  const currentBooking = bookings.find(booking => {
    const startDate = booking.startDate.split('T')[0]
    const endDate = booking.endDate.split('T')[0]
    return startDate <= today && endDate >= today && booking.status === BookingStatus.CONFIRMED
  })
  
  if (currentBooking) {
    return {
      status: 'occupied' as const,
      message: `Occupied until ${new Date(currentBooking.endDate).toLocaleDateString()}`,
      booking: currentBooking
    }
  }
  
  // Check for upcoming booking within next 7 days
  const nextBooking = bookings
    .filter(b => b.startDate > now.toISOString() && b.status === BookingStatus.CONFIRMED)
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())[0]
  
  if (nextBooking) {
    const daysUntil = Math.ceil((new Date(nextBooking.startDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    if (daysUntil <= 7) {
      return {
        status: 'booked-soon' as const,
        message: `Next booking in ${daysUntil} day${daysUntil !== 1 ? 's' : ''}`,
        booking: nextBooking
      }
    }
  }
  
  // Check for pending availability requests
  const pendingRequests = availabilityRequests.filter(
    req => req.status === AvailabilityRequestStatus.PENDING
  )
  
  if (pendingRequests.length > 0) {
    return {
      status: 'pending-requests' as const,
      message: `${pendingRequests.length} pending request${pendingRequests.length !== 1 ? 's' : ''}`,
      requests: pendingRequests
    }
  }
  
  return {
    status: 'available' as const,
    message: 'Available',
  }
}

// Helper function to get current pricing info
export function getCurrentPricing(priceRanges: PriceRangePreview[]) {
  const now = new Date()
  const today = now.toISOString().split('T')[0]
  
  // Find active price range
  const currentRange = priceRanges.find(range => {
    const startDate = range.startDate.split('T')[0]
    const endDate = range.endDate.split('T')[0]
    return startDate <= today && endDate >= today && range.isValidated
  })
  
  if (currentRange) {
    return {
      range: currentRange,
      isActive: true
    }
  }
  
  // Find next upcoming price range
  const nextRange = priceRanges
    .filter(range => range.startDate > today && range.isValidated)
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())[0]
  
  return {
    range: nextRange || priceRanges[0],
    isActive: false
  }
}

// Helper function to format price display
export function formatPriceDisplay(nightlyRate?: number, weeklyRate?: number) {
  if (nightlyRate && weeklyRate) {
    return `€${nightlyRate}/night • €${weeklyRate}/week`
  } else if (nightlyRate) {
    return `€${nightlyRate}/night`
  } else if (weeklyRate) {
    return `€${weeklyRate}/week`
  }
  return 'Price on request'
}