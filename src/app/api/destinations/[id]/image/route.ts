import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/db"
import { createClient } from "@supabase/supabase-js"
import { StorageApiError } from "@supabase/storage-js"
import { requirePermission } from "@/lib/auth"
import { Permission } from "@/types/auth"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const BUCKET_NAME = "destination-images"
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_FILE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"]

// Upload destination image
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check permission to edit destinations
    try {
      await requirePermission(Permission.PROPERTY_EDIT) // Using property permission for now
    } catch (error) {
      return NextResponse.json(
        { error: "Forbidden: You don't have permission to upload destination images" },
        { status: 403 }
      )
    }

    const { id } = await context.params
    
    
    // Check if Supabase is configured
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      
      return NextResponse.json(
        { error: "Storage service not configured. Please set up Supabase environment variables." },
        { status: 500 }
      )
    }
    
    // Verify destination exists
    const destination = await prisma.destination.findUnique({
      where: { id }
    })

    if (!destination) {
      return NextResponse.json({ error: "Destination not found" }, { status: 404 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File
    const altText = formData.get("altText") as string | null
    
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }
    
    
    
    // Validate file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Invalid file type. Allowed types: ${ALLOWED_FILE_TYPES.join(', ')}` },
        { status: 400 }
      )
    }
    
    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size is 5MB` },
        { status: 400 }
      )
    }

    // Delete existing image if present
    if (destination.imageUrl) {
      // Extract the file path from the URL
      const urlParts = destination.imageUrl.split('/')
      const existingFileName = urlParts.slice(-2).join('/')
      
      
      
      const { error: deleteError } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([existingFileName])
      
      if (deleteError) {
        
      }
    }

    // Generate unique filename
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(7)
    const fileExt = file.name.split('.').pop()
    const fileName = `${id}/hero-${timestamp}-${randomString}.${fileExt}`
    
    

    // Upload to Supabase Storage
    const buffer = await file.arrayBuffer()
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      
      
      // Check if it's a bucket not found error
      if (error.message?.includes("bucket") || (error instanceof StorageApiError && error.statusCode === '404')) {
        return NextResponse.json(
          { error: `Storage bucket "${BUCKET_NAME}" not found. Please create it in Supabase.` },
          { status: 500 }
        )
      }
      
      return NextResponse.json(
        { error: `Failed to upload image: ${error.message}` },
        { status: 500 }
      )
    }
    
    

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(fileName)

    // Update destination in database
    const updatedDestination = await prisma.destination.update({
      where: { id },
      data: {
        imageUrl: publicUrl,
        imageAltText: altText || `${destination.name} hero image`
      }
    })

    

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId,
        action: "UPDATE",
        entityType: "DESTINATION",
        entityId: id,
        changes: {
          imageUrl: publicUrl,
          imageAltText: altText || `${destination.name} hero image`
        },
      },
    })

    return NextResponse.json({
      success: true,
      imageUrl: publicUrl,
      imageAltText: altText || `${destination.name} hero image`
    })
    
  } catch (error) {
    
    return NextResponse.json(
      { 
        error: "Failed to upload image",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}

// Delete destination image
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check permission
    try {
      await requirePermission(Permission.PROPERTY_EDIT)
    } catch (error) {
      return NextResponse.json(
        { error: "Forbidden: You don't have permission to delete destination images" },
        { status: 403 }
      )
    }

    const { id } = await context.params
    
    // Get destination
    const destination = await prisma.destination.findUnique({
      where: { id }
    })

    if (!destination) {
      return NextResponse.json({ error: "Destination not found" }, { status: 404 })
    }

    if (!destination.imageUrl) {
      return NextResponse.json({ error: "No image to delete" }, { status: 400 })
    }

    // Extract file path from URL
    const urlParts = destination.imageUrl.split('/')
    const fileName = urlParts.slice(-2).join('/')
    
    // Delete from Supabase
    const { error: deleteError } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([fileName])
    
    if (deleteError) {
      
    }

    // Update database
    const updatedDestination = await prisma.destination.update({
      where: { id },
      data: {
        imageUrl: null,
        imageAltText: null
      }
    })

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId,
        action: "DELETE",
        entityType: "DESTINATION",
        entityId: id,
        changes: {
          imageUrl: "removed",
          imageAltText: "removed"
        },
      },
    })

    return NextResponse.json({ success: true })
    
  } catch (error) {
    
    return NextResponse.json(
      { error: "Failed to delete image" },
      { status: 500 }
    )
  }
}