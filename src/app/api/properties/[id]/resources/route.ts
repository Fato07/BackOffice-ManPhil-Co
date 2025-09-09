import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/db"
import { z } from "zod"
import { createClient } from "@supabase/supabase-js"
import { StorageApiError } from "@supabase/storage-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Schema for creating a resource
const createResourceSchema = z.object({
  type: z.string().min(1, "Type is required"),
  name: z.string().min(1, "Name is required"),
  url: z.string().url("Invalid URL").optional(),
  file: z.string().optional(), // Base64 encoded file
  fileName: z.string().optional(),
})

// GET /api/properties/[id]/resources - List resources for a property
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: propertyId } = await params

    // Check if property exists
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
    })

    if (!property) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 })
    }

    // Get all resources for this property
    const resources = await prisma.resource.findMany({
      where: { propertyId },
      orderBy: [
        { type: "asc" },
        { createdAt: "desc" },
      ],
    })

    return NextResponse.json(resources)
  } catch (error) {
    console.error("Error fetching resources:", error)
    return NextResponse.json(
      { error: "Failed to fetch resources" },
      { status: 500 }
    )
  }
}

// POST /api/properties/[id]/resources - Create a new resource
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: propertyId } = await params
    const body = await req.json()
    
    console.log(`[Resources Upload] Starting resource creation for property: ${propertyId}`)
    console.log(`[Resources Upload] Resource type: ${body.type}, name: ${body.name}`)

    // Check if Supabase is configured
    if (body.file && (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY)) {
      console.error("[Resources Upload] Supabase environment variables not configured")
      return NextResponse.json(
        { 
          error: "Storage service not configured",
          details: "Please set up NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables." 
        },
        { status: 500 }
      )
    }

    // Validate request body
    const validationResult = createResourceSchema.safeParse(body)
    if (!validationResult.success) {
      console.error("[Resources Upload] Validation failed:", validationResult.error.issues)
      return NextResponse.json(
        { error: validationResult.error.issues },
        { status: 400 }
      )
    }

    const data = validationResult.data

    // Check if property exists
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
    })

    if (!property) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 })
    }

    let resourceUrl = data.url

    // If a file is provided, upload it to Supabase
    if (data.file && data.fileName) {
      console.log(`[Resources Upload] Uploading file: ${data.fileName}`)
      
      const fileBuffer = Buffer.from(data.file, "base64")
      const fileExt = data.fileName.split(".").pop()
      const fileName = `${propertyId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      
      console.log(`[Resources Upload] Uploading to Supabase bucket "resources": ${fileName}`)

      const { error: uploadError } = await supabase.storage
        .from("resources")
        .upload(fileName, fileBuffer, {
          contentType: `application/${fileExt}`,
        })

      if (uploadError) {
        console.error("[Resources Upload] Supabase upload error:", uploadError)
        
        let errorMessage = "Failed to upload file"
        let errorDetails = uploadError.message
        
        // Check for specific error types
        if (uploadError.message?.includes("bucket") || (uploadError instanceof StorageApiError && uploadError.statusCode === '404')) {
          errorDetails = `Storage bucket "resources" not found. Please create it in your Supabase dashboard.`
        } else if (uploadError.message?.includes("size")) {
          errorDetails = "File is too large. Maximum file size is 10MB."
        }
        
        return NextResponse.json(
          { 
            error: errorMessage,
            details: errorDetails
          },
          { status: 500 }
        )
      }
      
      console.log(`[Resources Upload] File uploaded successfully to Supabase`)

      const { data: { publicUrl } } = supabase.storage
        .from("resources")
        .getPublicUrl(fileName)

      resourceUrl = publicUrl
    }

    if (!resourceUrl) {
      console.error("[Resources Upload] No URL or file provided")
      return NextResponse.json(
        { error: "Either URL or file must be provided" },
        { status: 400 }
      )
    }

    console.log(`[Resources Upload] Creating resource with URL: ${resourceUrl}`)

    // Create the resource
    const resource = await prisma.resource.create({
      data: {
        propertyId,
        type: data.type,
        name: data.name,
        url: resourceUrl,
        uploadedBy: userId,
      },
    })
    
    console.log(`[Resources Upload] Resource created successfully with ID: ${resource.id}`)

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId,
        action: "create",
        entityType: "resource",
        entityId: resource.id,
        changes: resource,
      },
    })

    return NextResponse.json(resource, { status: 201 })
  } catch (error) {
    console.error("[Resources Upload] Unexpected error:", error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    
    return NextResponse.json(
      { 
        error: "Failed to create resource",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}