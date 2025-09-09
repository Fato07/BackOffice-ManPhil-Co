import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/db"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const BUCKET_NAME = "property-photos"

// Update photo details
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await context.params
    const body = await request.json()

    const photo = await prisma.photo.findUnique({
      where: { id }
    })

    if (!photo) {
      return NextResponse.json({ error: "Photo not found" }, { status: 404 })
    }

    const updatedPhoto = await prisma.photo.update({
      where: { id },
      data: {
        caption: body.caption,
      }
    })

    await prisma.auditLog.create({
      data: {
        userId,
        action: "UPDATE",
        entityType: "PHOTO",
        entityId: id,
        changes: body,
      },
    })

    return NextResponse.json({ photo: updatedPhoto })
  } catch (error) {
    console.error("Update photo error:", error)
    return NextResponse.json(
      { error: "Failed to update photo" },
      { status: 500 }
    )
  }
}

// Delete photo
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await context.params

    const photo = await prisma.photo.findUnique({
      where: { id },
      include: { property: true }
    })

    if (!photo) {
      return NextResponse.json({ error: "Photo not found" }, { status: 404 })
    }

    // Extract file path from URL
    const url = new URL(photo.url)
    const filePath = url.pathname.split(`/${BUCKET_NAME}/`)[1]

    // Delete from Supabase Storage
    const { error: storageError } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filePath])

    if (storageError) {
      console.error("Storage delete error:", storageError)
    }

    // Delete from database
    await prisma.photo.delete({
      where: { id }
    })

    // Update positions of remaining photos
    await prisma.photo.updateMany({
      where: {
        propertyId: photo.propertyId,
        position: { gt: photo.position }
      },
      data: {
        position: { decrement: 1 }
      }
    })

    await prisma.auditLog.create({
      data: {
        userId,
        action: "DELETE",
        entityType: "PHOTO",
        entityId: id,
        changes: {
          propertyId: photo.propertyId,
          url: photo.url,
        },
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete photo error:", error)
    return NextResponse.json(
      { error: "Failed to delete photo" },
      { status: 500 }
    )
  }
}