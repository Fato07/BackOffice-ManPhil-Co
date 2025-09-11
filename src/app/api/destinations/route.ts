import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/db"

// GET /api/destinations - Get all destinations with optional filtering
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const searchParams = req.nextUrl.searchParams
    const search = searchParams.get('search')
    const country = searchParams.get('country')
    const withCoordinates = searchParams.get('withCoordinates') === 'true'

    const where: any = {}
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { country: { contains: search, mode: 'insensitive' } },
        { region: { contains: search, mode: 'insensitive' } },
      ]
    }
    
    if (country && country !== 'all') {
      where.country = country
    }
    
    if (withCoordinates) {
      where.AND = [
        { latitude: { not: null } },
        { longitude: { not: null } }
      ]
    }

    const destinations = await prisma.destination.findMany({
      where,
      orderBy: [
        { country: 'asc' },
        { name: 'asc' }
      ],
      include: {
        _count: {
          select: {
            properties: true
          }
        }
      }
    })

    // Group by country for better UX
    const groupedDestinations = destinations.reduce((acc, dest) => {
      const country = dest.country
      if (!acc[country]) {
        acc[country] = []
      }
      acc[country].push({
        id: dest.id,
        name: dest.name,
        region: dest.region,
        latitude: dest.latitude,
        longitude: dest.longitude,
        propertyCount: dest._count.properties,
        label: dest.region ? `${dest.name}, ${dest.region}` : dest.name,
      })
      return acc
    }, {} as Record<string, any[]>)

    return NextResponse.json({
      destinations,
      grouped: groupedDestinations,
    })
  } catch (error) {
    console.error("Error fetching destinations:", error)
    return NextResponse.json(
      { error: "Failed to fetch destinations" },
      { status: 500 }
    )
  }
}

// POST /api/destinations - Create a new destination (admin only)
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { name, country, region, latitude, longitude } = body

    if (!name || !country) {
      return NextResponse.json(
        { error: "Name and country are required" },
        { status: 400 }
      )
    }

    const destination = await prisma.destination.create({
      data: {
        name,
        country,
        region,
        latitude: latitude ? parseFloat(latitude) : undefined,
        longitude: longitude ? parseFloat(longitude) : undefined,
      },
      include: {
        _count: {
          select: {
            properties: true
          }
        }
      }
    })

    return NextResponse.json(destination, { status: 201 })
  } catch (error) {
    console.error("Error creating destination:", error)
    return NextResponse.json(
      { error: "Failed to create destination" },
      { status: 500 }
    )
  }
}