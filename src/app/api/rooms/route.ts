import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/db"
import { z } from "zod"
import { requirePermission } from "@/lib/auth"
import { Permission } from "@/types/auth"
import { RoomType } from "@/generated/prisma"

const createRoomSchema = z.object({
  propertyId: z.string(),
  name: z.string().min(1),
  groupName: z.string().optional(),
  type: z.enum(["INTERIOR", "OUTDOOR"]),
  generalInfo: z.any().optional(),
  view: z.string().optional(),
  equipment: z.array(z.object({
    category: z.string(),
    items: z.array(z.object({
      name: z.string(),
      quantity: z.number().int().min(1),
    })),
  })).default([]),
  position: z.number().int().min(0).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check permission to edit properties
    try {
      await requirePermission(Permission.PROPERTY_EDIT)
    } catch (error) {
      return NextResponse.json(
        { error: "Forbidden: You don't have permission to add rooms" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const data = createRoomSchema.parse(body)

    // Verify property exists
    const property = await prisma.property.findUnique({
      where: { id: data.propertyId },
      include: { rooms: true },
    })

    if (!property) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 })
    }

    // Determine position if not provided
    const position = data.position ?? property.rooms.length

    // Create room
    const room = await prisma.room.create({
      data: {
        propertyId: data.propertyId,
        name: data.name,
        groupName: data.groupName,
        type: data.type as RoomType,
        generalInfo: data.generalInfo,
        view: data.view,
        equipment: data.equipment,
        position,
      },
    })

    // Update property room count
    await prisma.property.update({
      where: { id: data.propertyId },
      data: {
        numberOfRooms: property.numberOfRooms + 1,
      },
    })

    // Log the creation
    await prisma.auditLog.create({
      data: {
        userId,
        action: "CREATE",
        entityType: "ROOM",
        entityId: room.id,
        changes: {
          propertyId: data.propertyId,
          roomName: data.name,
        },
      },
    })

    return NextResponse.json({ room })
  } catch (error) {
    console.error("Create room error:", error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    return NextResponse.json(
      { error: "Failed to create room" },
      { status: 500 }
    )
  }
}

// Bulk update room positions
export async function PATCH(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    
    const schema = z.object({
      propertyId: z.string(),
      rooms: z.array(z.object({
        id: z.string(),
        position: z.number().int().min(0),
      })),
    })

    const { propertyId, rooms } = schema.parse(body)

    // Verify property exists
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
    })

    if (!property) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 })
    }

    // Update positions in a transaction
    await prisma.$transaction(
      rooms.map(room => 
        prisma.room.update({
          where: { id: room.id },
          data: { position: room.position },
        })
      )
    )

    await prisma.auditLog.create({
      data: {
        userId,
        action: "UPDATE",
        entityType: "ROOM",
        entityId: propertyId,
        changes: {
          action: "reorder",
          count: rooms.length,
        },
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Update room positions error:", error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    return NextResponse.json(
      { error: "Failed to update room positions" },
      { status: 500 }
    )
  }
}