import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/db"
import { z } from "zod"

// Update destination schema
const updateDestinationSchema = z.object({
  name: z.string().min(2).optional(),
  country: z.string().min(2).optional(),
  region: z.string().nullable().optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
  imageAltText: z.string().nullable().optional(),
})

// GET /api/destinations/[id] - Get a single destination
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

    const destination = await prisma.destination.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            properties: true
          }
        }
      }
    })

    if (!destination) {
      return NextResponse.json(
        { error: "Destination not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(destination)
  } catch (error) {
    console.error("Error fetching destination:", error)
    return NextResponse.json(
      { error: "Failed to fetch destination" },
      { status: 500 }
    )
  }
}

// PUT /api/destinations/[id] - Update a destination
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    // TODO: Add role check for admin once RBAC is implemented
    // const user = await getUser(userId)
    // if (!hasRole(user, 'admin')) {
    //   return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    // }

    const body = await req.json()
    const validatedData = updateDestinationSchema.parse(body)

    const destination = await prisma.destination.update({
      where: { id },
      data: validatedData,
      include: {
        _count: {
          select: {
            properties: true
          }
        }
      }
    })

    return NextResponse.json(destination)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.issues },
        { status: 400 }
      )
    }
    
    // Error handled by returning error response
    return NextResponse.json(
      { error: "Failed to update destination" },
      { status: 500 }
    )
  }
}

// DELETE /api/destinations/[id] - Delete a destination
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    // TODO: Add role check for admin once RBAC is implemented
    // const user = await getUser(userId)
    // if (!hasRole(user, 'admin')) {
    //   return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    // }

    // Check if destination has properties
    const destination = await prisma.destination.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            properties: true
          }
        }
      }
    })

    if (!destination) {
      return NextResponse.json(
        { error: "Destination not found" },
        { status: 404 }
      )
    }

    if (destination._count.properties > 0) {
      return NextResponse.json(
        { 
          error: "Cannot delete destination with associated properties",
          propertyCount: destination._count.properties
        },
        { status: 400 }
      )
    }

    await prisma.destination.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting destination:", error)
    return NextResponse.json(
      { error: "Failed to delete destination" },
      { status: 500 }
    )
  }
}