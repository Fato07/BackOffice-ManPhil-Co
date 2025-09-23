import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/db"
import { 
  updatePropertyBasicSchema, 
  updatePropertyLocationSchema,
  updatePropertyPromotionSchema,
  updatePropertyEnvironmentSchema,
  updatePropertyContentSchema,
  updatePropertyEventsSchema
} from "@/lib/validations"
import { requirePermission, getUserRole, getCurrentUserId } from "@/lib/auth"
import { Permission } from "@/types/auth"

// GET /api/properties/[id] - Get a single property
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

    const property = await prisma.property.findUnique({
      where: { id },
      include: {
        destination: true,
        rooms: {
          orderBy: { position: 'asc' }
        },
        contacts: {
          orderBy: { createdAt: 'desc' }
        },
        bookings: {
          orderBy: { startDate: 'asc' }
        },
        prices: {
          orderBy: { startDate: 'asc' }
        },
        resources: {
          orderBy: { createdAt: 'desc' }
        },
        photos: {
          orderBy: { position: 'asc' }
        },
        marketingContent: true,
      },
    })

    if (!property) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 })
    }

    return NextResponse.json(property)
  } catch (error) {
    console.error("Error fetching property:", error)
    return NextResponse.json(
      { error: "Failed to fetch property" },
      { status: 500 }
    )
  }
}

// PUT /api/properties/[id] - Update a property
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Extract id early for use in audit logs
    const { id } = await params

    // Check permission to edit properties
    try {
      await requirePermission(Permission.PROPERTY_EDIT)
    } catch (error) {
      // Log denied attempt
      const userRole = await getUserRole()
      const currentUserId = await getCurrentUserId()
      
      if (currentUserId) {
        await prisma.auditLog.create({
          data: {
            userId: currentUserId,
            action: "update_denied",
            entityType: "property",
            entityId: id,
            changes: {
              reason: "insufficient_permissions",
              role: userRole,
              requiredPermission: Permission.PROPERTY_EDIT,
            },
          },
        })
      }
      
      return NextResponse.json(
        { error: "Forbidden: You don't have permission to edit properties" },
        { status: 403 }
      )
    }

    const body = await req.json()

    // Check if property exists
    const existingProperty = await prisma.property.findUnique({
      where: { id },
    })

    if (!existingProperty) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 })
    }

    // Validate based on the section being updated
    let validatedData: any = {}
    
    // Merge all schemas for full update support
    const schemas = [
      updatePropertyBasicSchema,
      updatePropertyLocationSchema,
      updatePropertyPromotionSchema,
      updatePropertyEnvironmentSchema,
      updatePropertyContentSchema,
      updatePropertyEventsSchema,
    ]

    for (const schema of schemas) {
      try {
        const parsed = schema.parse(body)
        validatedData = { ...validatedData, ...parsed }
      } catch {
        // Schema doesn't match, continue to next
      }
    }

    // Update property
    const updatedProperty = await prisma.property.update({
      where: { id },
      data: validatedData,
      include: {
        destination: true,
      },
    })

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId,
        action: "update",
        entityType: "property",
        entityId: id,
        changes: validatedData,
      },
    })

    return NextResponse.json(updatedProperty)
  } catch (error) {
    console.error("Error updating property:", error)
    
    if (error instanceof Error && error.message.includes("validation")) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: "Failed to update property" },
      { status: 500 }
    )
  }
}

// PATCH /api/properties/[id] - Partially update a property
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Extract id outside try block to ensure it's accessible in all scopes
  const { id } = await params
  
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check permission to edit properties
    try {
      await requirePermission(Permission.PROPERTY_EDIT)
    } catch (error) {
      // Log denied attempt
      const userRole = await getUserRole()
      const currentUserId = await getCurrentUserId()
      
      if (currentUserId) {
        await prisma.auditLog.create({
          data: {
            userId: currentUserId,
            action: "update_denied",
            entityType: "property",
            entityId: id,
            changes: {
              reason: "insufficient_permissions",
              role: userRole,
              requiredPermission: Permission.PROPERTY_EDIT,
            },
          },
        })
      }
      
      return NextResponse.json(
        { error: "Forbidden: You don't have permission to edit properties" },
        { status: 403 }
      )
    }

    const body = await req.json()

    // Check if property exists
    const existingProperty = await prisma.property.findUnique({
      where: { id },
    })

    if (!existingProperty) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 })
    }

    // Prepare update data - ensure JSON fields are properly formatted
    const updateData: any = {}
    
    // List of JSON fields in the Property model
    const jsonFields = ['accessibility', 'policies', 'arrivalDeparture', 'staff', 'heatingAC', 'eventsDetails', 'services', 'automaticOffer']
    
    // Process each field in the body
    for (const [key, value] of Object.entries(body)) {
      if (jsonFields.includes(key)) {
        // For JSON fields, ensure we're passing the complete object
        // This prevents Prisma from trying to parse nested properties as field updates
        updateData[key] = value === null ? null : JSON.parse(JSON.stringify(value))
      } else {
        // For non-JSON fields, pass as-is
        updateData[key] = value
      }
    }
    
    // For PATCH, we don't validate against schemas - we accept any valid fields
    // This allows for flexible partial updates from different sections
    const updatedProperty = await prisma.property.update({
      where: { id },
      data: updateData,
      include: {
        destination: true,
        rooms: {
          orderBy: { position: 'asc' }
        },
        contacts: {
          orderBy: { createdAt: 'desc' }
        },
        bookings: {
          orderBy: { startDate: 'asc' }
        },
        prices: {
          orderBy: { startDate: 'asc' }
        },
        resources: {
          orderBy: { createdAt: 'desc' }
        },
        photos: {
          orderBy: { position: 'asc' }
        },
        marketingContent: true,
      },
    })

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId,
        action: "update",
        entityType: "property",
        entityId: id,
        changes: body,
      },
    })

    return NextResponse.json(updatedProperty)
  } catch (error) {
    console.error("Error updating property:", error)
    
    // Provide more detailed error information for debugging
    if (error instanceof Error) {
      console.error("Error details:", {
        name: error.name,
        message: error.message,
        stack: error.stack
      })
      
      
      // Check for Prisma-specific errors
      if (error.message.includes("Unknown field") || error.message.includes("Invalid")) {
        return NextResponse.json(
          { error: `Database error: ${error.message}` },
          { status: 400 }
        )
      }
      
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: "Failed to update property" },
      { status: 500 }
    )
  }
}

// DELETE /api/properties/[id] - Delete a property
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Extract id early for use in audit logs
    const { id } = await params

    // Check permission to delete properties (using PROPERTY_EDIT permission)
    try {
      await requirePermission(Permission.PROPERTY_EDIT)
    } catch (error) {
      // Log denied attempt
      const userRole = await getUserRole()
      const currentUserId = await getCurrentUserId()
      
      if (currentUserId) {
        await prisma.auditLog.create({
          data: {
            userId: currentUserId,
            action: "delete_denied",
            entityType: "property",
            entityId: id,
            changes: {
              reason: "insufficient_permissions",
              role: userRole,
              requiredPermission: Permission.PROPERTY_EDIT,
            },
          },
        })
      }
      
      return NextResponse.json(
        { error: "Forbidden: You don't have permission to delete properties" },
        { status: 403 }
      )
    }

    // Check if property exists
    const existingProperty = await prisma.property.findUnique({
      where: { id },
    })

    if (!existingProperty) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 })
    }

    // Delete property (cascade will handle related records)
    await prisma.property.delete({
      where: { id },
    })

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId,
        action: "delete",
        entityType: "property",
        entityId: id,
      },
    })

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error("Error deleting property:", error)
    return NextResponse.json(
      { error: "Failed to delete property" },
      { status: 500 }
    )
  }
}