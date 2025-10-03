import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { 
  getLegalDocument, 
  updateLegalDocument, 
  deleteLegalDocument 
} from '@/actions/legal-documents'
import { hasPermission } from '@/lib/auth'
import { Permission } from '@/types/auth'
import { updateLegalDocumentSchema } from '@/lib/validations/legal-document'

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

    // Get document
    const result = await getLegalDocument(id)
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error }, 
        { status: result.error === 'Document not found' ? 404 : 400 }
      )
    }

    return NextResponse.json(result.data)
  } catch (error) {
    
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}

export async function PATCH(
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

    // Parse request body
    const body = await request.json()

    // Handle date conversions
    if (body.expiryDate) {
      body.expiryDate = new Date(body.expiryDate)
    }

    // Validate input
    const validationResult = updateLegalDocumentSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error.issues }, 
        { status: 400 }
      )
    }

    // Update document
    const result = await updateLegalDocument(id, validationResult.data)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error }, 
        { status: result.error === 'Document not found' ? 404 : 400 }
      )
    }

    return NextResponse.json(result.data)
  } catch (error) {
    
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}

export async function DELETE(
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
    const canDelete = await hasPermission(Permission.LEGAL_DOCUMENT_DELETE)
    if (!canDelete) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Delete document
    const result = await deleteLegalDocument(id)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error }, 
        { status: result.error === 'Document not found' ? 404 : 400 }
      )
    }

    return NextResponse.json({ success: true }, { status: 204 })
  } catch (error) {
    
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}