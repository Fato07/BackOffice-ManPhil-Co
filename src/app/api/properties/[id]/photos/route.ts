import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/db"
import { createClient } from "@supabase/supabase-js"
import { StorageApiError } from "@supabase/storage-js"
import { z } from "zod"
import { Photo } from "@/generated/prisma"
import { requirePermission } from "@/lib/auth"
import { Permission } from "@/types/auth"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const BUCKET_NAME = "property-photos"
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_FILE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"]

// Upload photos
export async function POST(
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
        { error: "Forbidden: You don't have permission to upload photos" },
        { status: 403 }
      )
    }

    const { id } = await context.params
    console.log(`[Photos Upload] Starting upload for property: ${id}`)
    
    // Check if Supabase is configured
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error("[Photos Upload] Supabase environment variables not configured")
      return NextResponse.json(
        { error: "Storage service not configured. Please set up Supabase environment variables." },
        { status: 500 }
      )
    }
    
    // Verify property exists and user has access
    const property = await prisma.property.findUnique({
      where: { id },
      include: { photos: true }
    })

    if (!property) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 })
    }

    const formData = await request.formData()
    const files = formData.getAll("files") as File[]
    
    console.log(`[Photos Upload] Received ${files.length} files to upload`)
    
    if (files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 })
    }

    const uploadedPhotos: Photo[] = []
    const errors: string[] = []

    for (const file of files) {
      console.log(`[Photos Upload] Processing file: ${file.name}, size: ${file.size}, type: ${file.type}`)
      
      // Validate file type
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        const error = `File ${file.name} has invalid type ${file.type}. Allowed types: ${ALLOWED_FILE_TYPES.join(', ')}`
        console.warn(`[Photos Upload] ${error}`)
        errors.push(error)
        continue
      }
      
      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        const error = `File ${file.name} is too large (${(file.size / 1024 / 1024).toFixed(2)}MB). Maximum size is 10MB`
        console.warn(`[Photos Upload] ${error}`)
        errors.push(error)
        continue
      }

      // Generate unique filename
      const timestamp = Date.now()
      const randomString = Math.random().toString(36).substring(7)
      const fileExt = file.name.split('.').pop()
      const fileName = `${id}/${timestamp}-${randomString}.${fileExt}`
      
      console.log(`[Photos Upload] Uploading to Supabase: ${fileName}`)

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
        const errorMsg = `Failed to upload ${file.name}: ${error.message}`
        console.error(`[Photos Upload] Supabase upload error:`, error)
        errors.push(errorMsg)
        
        // Check if it's a bucket not found error
        if (error.message?.includes("bucket") || (error instanceof StorageApiError && error.statusCode === '404')) {
          errors.push(`Storage bucket "${BUCKET_NAME}" not found. Please create it in Supabase.`)
        }
        continue
      }
      
      console.log(`[Photos Upload] Successfully uploaded to Supabase: ${fileName}`)

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(fileName)

      // Create photo record in database
      const photo: Photo = await prisma.photo.create({
        data: {
          propertyId: id,
          url: publicUrl,
          position: property.photos.length + uploadedPhotos.length,
        }
      })

      uploadedPhotos.push(photo)
    }

    console.log(`[Photos Upload] Upload complete. Success: ${uploadedPhotos.length}, Failed: ${files.length - uploadedPhotos.length}`)

    // Log the upload
    if (uploadedPhotos.length > 0) {
      await prisma.auditLog.create({
        data: {
          userId,
          action: "CREATE",
          entityType: "PHOTO",
          entityId: id,
          changes: {
            count: uploadedPhotos.length,
          },
        },
      })
    }

    // Return detailed response
    const response: any = {
      photos: uploadedPhotos,
      totalFiles: files.length,
      successCount: uploadedPhotos.length,
      failedCount: files.length - uploadedPhotos.length,
    }
    
    if (errors.length > 0) {
      response.errors = errors
    }
    
    // If no photos were uploaded successfully, return error status
    if (uploadedPhotos.length === 0 && files.length > 0) {
      return NextResponse.json(
        { 
          error: "No photos were uploaded successfully",
          details: errors 
        },
        { status: 400 }
      )
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("[Photos Upload] Unexpected error:", error)
    return NextResponse.json(
      { 
        error: "Failed to upload photos",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}

// Get photos for a property
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

    const photos = await prisma.photo.findMany({
      where: { propertyId: id },
      orderBy: { position: 'asc' }
    })

    return NextResponse.json({ photos })
  } catch (error) {
    console.error("Get photos error:", error)
    return NextResponse.json(
      { error: "Failed to fetch photos" },
      { status: 500 }
    )
  }
}

// Update photo positions
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
    
    const schema = z.object({
      photos: z.array(z.object({
        id: z.string(),
        position: z.number().int().min(0)
      }))
    })

    const { photos } = schema.parse(body)

    // Update positions in a transaction
    await prisma.$transaction(
      photos.map(photo => 
        prisma.photo.update({
          where: { id: photo.id },
          data: { position: photo.position }
        })
      )
    )

    await prisma.auditLog.create({
      data: {
        userId,
        action: "UPDATE",
        entityType: "PHOTO",
        entityId: id,
        changes: {
          action: "reorder",
          count: photos.length,
        },
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Update photo positions error:", error)
    return NextResponse.json(
      { error: "Failed to update photo positions" },
      { status: 500 }
    )
  }
}