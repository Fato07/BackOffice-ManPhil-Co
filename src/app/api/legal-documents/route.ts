import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getLegalDocuments, createLegalDocument } from '@/actions/legal-documents'
import { hasPermission } from '@/lib/auth'
import { Permission } from '@/types/auth'
import { createLegalDocumentSchema } from '@/lib/validations/legal-document'

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permission
    const canView = await hasPermission(Permission.LEGAL_DOCUMENT_VIEW)
    if (!canView) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const filters = {
      page: parseInt(searchParams.get('page') || '1'),
      pageSize: parseInt(searchParams.get('pageSize') || '20'),
      search: searchParams.get('search') || undefined,
      category: searchParams.get('category') as any || undefined,
      status: searchParams.get('status') as any || undefined,
      propertyId: searchParams.get('propertyId') || undefined,
      expiringInDays: searchParams.get('expiringInDays') 
        ? parseInt(searchParams.get('expiringInDays')!) 
        : undefined,
      sortBy: searchParams.get('sortBy') || 'createdAt',
      sortOrder: (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc',
      tags: searchParams.get('tags')?.split(',').filter(Boolean)
    }

    // Get documents
    const result = await getLegalDocuments(filters)
    
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json(result.data)
  } catch (error) {
    console.error('Error in GET /api/legal-documents:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permission
    const canCreate = await hasPermission(Permission.LEGAL_DOCUMENT_CREATE)
    if (!canCreate) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 })
    }

    // Parse other fields
    const inputData: Record<string, unknown> = {}
    for (const [key, value] of formData.entries()) {
      if (key !== 'file') {
        if (key === 'tags' && value) {
          inputData[key] = JSON.parse(value as string)
        } else if (key === 'metadata' && value) {
          inputData[key] = JSON.parse(value as string)
        } else if (key === 'expiryDate' && value) {
          inputData[key] = new Date(value as string)
        } else if (key === 'reminderDays' && value) {
          inputData[key] = parseInt(value as string)
        } else if (key === 'propertyId' && (value === '' || value === 'null')) {
          // Don't set propertyId, leave it undefined for global documents
        } else if (value) {
          inputData[key] = value
        }
      }
    }

    // Validate input (without file)
    const validationResult = createLegalDocumentSchema.omit({ file: true }).safeParse(inputData)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error.issues }, 
        { status: 400 }
      )
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Create document
    const result = await createLegalDocument(validationResult.data, {
      buffer,
      mimetype: file.type,
      originalname: file.name,
      size: file.size
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json(result.data, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/legal-documents:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}