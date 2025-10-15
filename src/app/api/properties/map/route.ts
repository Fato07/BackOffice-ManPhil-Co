import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/db"
import type { PropertyMapData, PropertiesMapResponse } from "@/hooks/use-properties-map"

// GET /api/properties/map - Get all properties with coordinates for map display
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Extract query parameters (no pagination needed)
    const searchParams = Object.fromEntries(req.nextUrl.searchParams.entries())
    
    // Build where clause for properties with coordinates
    const where: any = {
      // Only include properties with valid coordinates
      latitude: { not: null },
      longitude: { not: null }
    }

    // Optional: Add status filter if provided
    if (searchParams.status && searchParams.status !== "ALL") {
      where.status = searchParams.status
    }

    // Optional: Add destination filter if provided
    if (searchParams.destinationIds) {
      const destinationIds = searchParams.destinationIds.split(',')
      where.destinationId = { in: destinationIds }
    } else if (searchParams.destinationId) {
      where.destinationId = searchParams.destinationId
    }

    // Fetch all properties with coordinates - optimized query
    const properties = await prisma.property.findMany({
      where,
      select: {
        id: true,
        name: true,
        latitude: true,
        longitude: true,
        destination: {
          select: {
            id: true,
            name: true,
            country: true,
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    // Filter out any properties that somehow have null coordinates (extra safety)
    const validProperties = properties.filter(
      (prop): prop is PropertyMapData => 
        prop.latitude !== null && prop.longitude !== null
    )

    return NextResponse.json({
      properties: validProperties,
      total: validProperties.length
    })
  } catch (error) {
    console.error("Properties map API error:", error)
    console.error("Error details:", error instanceof Error ? error.message : error)
    
    return NextResponse.json(
      { error: "Failed to fetch map properties" },
      { status: 500 }
    )
  }
}