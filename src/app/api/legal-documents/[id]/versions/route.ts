import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { uploadLegalDocumentVersion } from '@/actions/legal-documents'
import { hasPermission } from '@/lib/auth'
import { Permission } from '@/types/auth'
import { uploadLegalDocumentVersionSchema } from '@/lib/validations/legal-document'
import { prisma } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
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

    // Get versions
    const versions = await prisma.legalDocumentVersion.findMany({
      where: { documentId: id },
      orderBy: { versionNumber: 'desc' }
    })

    return NextResponse.json({ versions })
  } catch (error) {
    
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    // Check authentication
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permission
    const canEdit = await hasPermission(Permission.LEGAL_DOCUMENT_EDIT)
    if (!canEdit) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    const comment = formData.get('comment') as string | null
    
    if (!file) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 })
    }

    // Validate input
    const validationResult = uploadLegalDocumentVersionSchema.omit({ file: true }).safeParse({
      documentId: id,
      comment: comment || undefined
    })
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error.issues }, 
        { status: 400 }
      )
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload new version
    const result = await uploadLegalDocumentVersion(validationResult.data, {
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
    
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}