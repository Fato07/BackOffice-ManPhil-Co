import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/db"
import { z } from "zod"
import { requirePermission } from "@/lib/auth"
import { Permission } from "@/types/auth"
import { RoomType, Prisma } from "@/generated/prisma"

const updateRoomSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  groupName: z.string().nullish(),
  type: z.enum(["INTERIOR", "OUTDOOR"], {
    message: "Room type must be INTERIOR or OUTDOOR"
  }).optional(),
  generalInfo: z.any().optional(),
  view: z.string().nullish(),
  equipment: z.array(z.object({
    category: z.string().min(1, "Category is required"),
    items: z.array(z.object({
      name: z.string().min(1, "Item name is required"),
      quantity: z.number().int().min(1, "Quantity must be at least 1"),
    })),
  })).optional(),
})

// Get room details
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await context.params

    const room = await prisma.room.findUnique({
      where: { id },
      include: {
        property: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 })
    }

    return NextResponse.json({ room })
  } catch (error) {
    console.error("Get room error:", error)
    return NextResponse.json(
      { error: "Failed to fetch room" },
      { status: 500 }
    )
  }
}

// Update room
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
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
        { error: "Forbidden: You don't have permission to update rooms" },
        { status: 403 }
      )
    }

    const { id } = await context.params
    const body = await request.json()
    const data = updateRoomSchema.parse(body)

    const room = await prisma.room.findUnique({
      where: { id },
      include: { property: true },
    })

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 })
    }

    const updatedRoom = await prisma.room.update({
      where: { id },
      data: data as Prisma.RoomUpdateInput,
    })

    await prisma.auditLog.create({
      data: {
        userId,
        action: "UPDATE",
        entityType: "ROOM",
        entityId: id,
        changes: {
          propertyId: room.propertyId,
          changes: data,
        },
      },
    })

    return NextResponse.json({ room: updatedRoom })
  } catch (error) {
    console.error("Update room error:", error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    return NextResponse.json(
      { error: "Failed to update room" },
      { status: 500 }
    )
  }
}

// Delete room
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
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
        { error: "Forbidden: You don't have permission to delete rooms" },
        { status: 403 }
      )
    }

    const { id } = await context.params

    const room = await prisma.room.findUnique({
      where: { id },
      include: { property: true },
    })

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 })
    }

    // Delete the room
    await prisma.room.delete({
      where: { id },
    })

    // Update positions of remaining rooms
    await prisma.room.updateMany({
      where: {
        propertyId: room.propertyId,
        position: { gt: room.position },
      },
      data: {
        position: { decrement: 1 },
      },
    })

    // Update property room count
    await prisma.property.update({
      where: { id: room.propertyId },
      data: {
        numberOfRooms: { decrement: 1 },
      },
    })

    await prisma.auditLog.create({
      data: {
        userId,
        action: "DELETE",
        entityType: "ROOM",
        entityId: id,
        changes: {
          propertyId: room.propertyId,
          roomName: room.name,
        },
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete room error:", error)
    return NextResponse.json(
      { error: "Failed to delete room" },
      { status: 500 }
    )
  }
}