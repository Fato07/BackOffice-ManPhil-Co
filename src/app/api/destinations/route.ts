import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/db"

// GET /api/destinations - Get all destinations for dropdown
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const destinations = await prisma.destination.findMany({
      orderBy: [
        { country: 'asc' },
        { name: 'asc' }
      ],
      select: {
        id: true,
        name: true,
        country: true,
        region: true,
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
    const { name, country, region } = body

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
      },
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