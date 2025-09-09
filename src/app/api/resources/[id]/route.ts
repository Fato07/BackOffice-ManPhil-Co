import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/db"
import { z } from "zod"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Schema for updating a resource
const updateResourceSchema = z.object({
  type: z.string().min(1, "Type is required").optional(),
  name: z.string().min(1, "Name is required").optional(),
})

// GET /api/resources/[id] - Get a single resource
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

    const resource = await prisma.resource.findUnique({
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

    if (!resource) {
      return NextResponse.json({ error: "Resource not found" }, { status: 404 })
    }

    return NextResponse.json(resource)
  } catch (error) {
    console.error("Error fetching resource:", error)
    return NextResponse.json(
      { error: "Failed to fetch resource" },
      { status: 500 }
    )
  }
}

// PUT /api/resources/[id] - Update a resource
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
    const body = await req.json()

    // Validate request body
    const validationResult = updateResourceSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.issues },
        { status: 400 }
      )
    }

    const data = validationResult.data

    // Check if resource exists
    const existingResource = await prisma.resource.findUnique({
      where: { id },
    })

    if (!existingResource) {
      return NextResponse.json({ error: "Resource not found" }, { status: 404 })
    }

    // Update the resource
    const updatedResource = await prisma.resource.update({
      where: { id },
      data,
    })

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId,
        action: "update",
        entityType: "resource",
        entityId: id,
        changes: data,
      },
    })

    return NextResponse.json(updatedResource)
  } catch (error) {
    console.error("Error updating resource:", error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    
    return NextResponse.json(
      { error: "Failed to update resource" },
      { status: 500 }
    )
  }
}

// DELETE /api/resources/[id] - Delete a resource
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

    // Check if resource exists
    const existingResource = await prisma.resource.findUnique({
      where: { id },
    })

    if (!existingResource) {
      return NextResponse.json({ error: "Resource not found" }, { status: 404 })
    }

    // If the resource URL is from Supabase storage, delete the file
    if (existingResource.url.includes(process.env.NEXT_PUBLIC_SUPABASE_URL!)) {
      const urlParts = existingResource.url.split("/")
      const fileName = urlParts.slice(-2).join("/") // Get propertyId/filename

      await supabase.storage
        .from("resources")
        .remove([fileName])
    }

    // Delete the resource
    await prisma.resource.delete({
      where: { id },
    })

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId,
        action: "delete",
        entityType: "resource",
        entityId: id,
        changes: { resource: existingResource },
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting resource:", error)
    return NextResponse.json(
      { error: "Failed to delete resource" },
      { status: 500 }
    )
  }
}