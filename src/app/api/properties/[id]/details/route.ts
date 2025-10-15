import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/db"
import { PropertySidebarData } from "@/hooks/use-property-details"

// GET /api/properties/[id]/details - Get optimized property data for sidebar display
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    // Fetch property with optimized data for sidebar
    const property = await prisma.property.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        status: true,
        numberOfRooms: true,
        numberOfBathrooms: true,
        maxGuests: true,
        propertySize: true,
        destination: {
          select: {
            id: true,
            name: true,
            country: true,
          }
        },
        photos: {
          select: {
            id: true,
            url: true,
            isMain: true,
            caption: true,
          },
          orderBy: [
            { isMain: 'desc' },
            { position: 'asc' }
          ],
          take: 5 // Limit photos for sidebar
        },
        bookings: {
          select: {
            id: true,
            type: true,
            status: true,
            startDate: true,
            endDate: true,
            guestName: true,
            numberOfGuests: true,
            totalAmount: true,
          },
          where: {
            // Only get future bookings and current ones
            endDate: {
              gte: new Date()
            },
            status: {
              in: ['CONFIRMED', 'PENDING']
            }
          },
          orderBy: {
            startDate: 'asc'
          },
          take: 10 // Limit to next 10 bookings
        },
        prices: {
          select: {
            id: true,
            name: true,
            startDate: true,
            endDate: true,
            publicNightlyRate: true,
            publicWeeklyRate: true,
            minimumStay: true,
            isValidated: true,
          },
          where: {
            isValidated: true,
            // Get current and future price ranges
            endDate: {
              gte: new Date()
            }
          },
          orderBy: {
            startDate: 'asc'
          },
          take: 5 // Limit to next 5 price periods
        },
        availabilityRequests: {
          select: {
            id: true,
            startDate: true,
            endDate: true,
            guestName: true,
            numberOfGuests: true,
            status: true,
            createdAt: true,
          },
          where: {
            // Get requests from last 30 days
            createdAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 10 // Limit to last 10 requests
        },
        contacts: {
          select: {
            id: true,
            type: true,
            name: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            isApproved: true,
            isContractSignatory: true,
          },
          where: {
            isApproved: true,
            // Focus on key contact types for sidebar
            type: {
              in: ['OWNER', 'MANAGER', 'AGENCY', 'CHECK_IN_MANAGER', 'SIGNATORY']
            }
          },
          orderBy: [
            { isContractSignatory: 'desc' },
            { type: 'asc' },
            { createdAt: 'desc' }
          ],
          take: 6 // Limit to key contacts
        },
        _count: {
          select: {
            rooms: true,
            bookings: true,
            photos: true,
          }
        }
      }
    })

    if (!property) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 })
    }

    // Transform the data to match PropertySidebarData interface
    const sidebarData: PropertySidebarData = {
      id: property.id,
      name: property.name,
      status: property.status,
      numberOfRooms: property.numberOfRooms,
      numberOfBathrooms: property.numberOfBathrooms,
      maxGuests: property.maxGuests,
      propertySize: property.propertySize || undefined,
      destination: property.destination,
      photos: property.photos.map(photo => ({
        id: photo.id,
        url: photo.url,
        isMain: photo.isMain,
        caption: photo.caption || undefined,
      })),
      bookings: property.bookings.map(booking => ({
        id: booking.id,
        type: booking.type,
        status: booking.status,
        startDate: booking.startDate.toISOString(),
        endDate: booking.endDate.toISOString(),
        guestName: booking.guestName || undefined,
        numberOfGuests: booking.numberOfGuests || undefined,
        totalAmount: booking.totalAmount || undefined,
      })),
      priceRanges: property.prices.map(price => ({
        id: price.id,
        name: price.name,
        startDate: price.startDate.toISOString(),
        endDate: price.endDate.toISOString(),
        publicNightlyRate: price.publicNightlyRate || undefined,
        publicWeeklyRate: price.publicWeeklyRate || undefined,
        minimumStay: price.minimumStay,
        isValidated: price.isValidated,
      })),
      availabilityRequests: property.availabilityRequests.map(request => ({
        id: request.id,
        startDate: request.startDate.toISOString(),
        endDate: request.endDate.toISOString(),
        guestName: request.guestName,
        numberOfGuests: request.numberOfGuests,
        status: request.status,
        createdAt: request.createdAt.toISOString(),
      })),
      contacts: property.contacts.map(contact => ({
        id: contact.id,
        type: contact.type,
        name: contact.name,
        firstName: contact.firstName || undefined,
        lastName: contact.lastName || undefined,
        email: contact.email || undefined,
        phone: contact.phone || undefined,
        isApproved: contact.isApproved,
        isContractSignatory: contact.isContractSignatory,
      })),
      _count: property._count,
    }

    return NextResponse.json(sidebarData)
  } catch (error) {
    console.error("Property details API error:", error)
    console.error("Error details:", error instanceof Error ? error.message : error)
    
    return NextResponse.json(
      { error: "Failed to fetch property details" },
      { status: 500 }
    )
  }
}