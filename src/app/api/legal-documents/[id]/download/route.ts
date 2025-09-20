import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { hasPermission, getCurrentUserId } from '@/lib/auth'
import { Permission } from '@/types/auth'
import { prisma } from '@/lib/db'
import { createServerSupabaseClient } from '@/lib/supabase'

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

    // Get version parameter
    const searchParams = request.nextUrl.searchParams
    const versionNumber = searchParams.get('version') 
      ? parseInt(searchParams.get('version')!) 
      : null

    // Get document
    const document = await prisma.legalDocument.findUnique({
      where: { id },
      include: {
        versions: versionNumber ? {
          where: { versionNumber },
          take: 1
        } : false
      }
    })

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // Determine URL to download
    let downloadUrl = document.url
    if (versionNumber && document.versions && document.versions.length > 0) {
      downloadUrl = document.versions[0].url
    }

    // Extract storage path from public URL
    const urlParts = downloadUrl.split('/storage/v1/object/public/')
    const storagePath = urlParts[1]
    
    if (!storagePath) {
      return NextResponse.json({ error: 'Invalid document URL' }, { status: 400 })
    }

    // Get file from Supabase storage
    const supabase = createServerSupabaseClient()
    const bucketName = storagePath.split('/')[0]
    const filePath = storagePath.substring(bucketName.length + 1)
    
    const { data, error } = await supabase.storage
      .from(bucketName)
      .download(filePath)

    if (error) {
      console.error('Error downloading file from Supabase:', error)
      return NextResponse.json({ error: 'Failed to download file' }, { status: 500 })
    }

    // Update last accessed
    await prisma.legalDocument.update({
      where: { id },
      data: { lastAccessedAt: new Date() }
    })

    // Log sensitive data access if applicable
    const currentUserId = await getCurrentUserId()
    if (currentUserId && (
      document.category === 'TAX_DOCUMENT' || 
      document.category === 'VENDOR_CONTRACT'
    )) {
      await prisma.auditLog.create({
        data: {
          userId: currentUserId,
          action: 'DOWNLOAD_LEGAL_DOCUMENT',
          entityType: 'LegalDocument',
          entityId: id,
          changes: {
            category: document.category,
            name: document.name,
            version: versionNumber || 'latest'
          }
        }
      })
    }

    // Convert blob to buffer
    const buffer = Buffer.from(await data.arrayBuffer())

    // Set appropriate headers
    const headers = new Headers()
    headers.set('Content-Type', document.mimeType)
    headers.set('Content-Disposition', `attachment; filename="${document.name}"`)
    headers.set('Content-Length', buffer.length.toString())
    headers.set('Cache-Control', 'private, max-age=3600')

    return new NextResponse(buffer, {
      status: 200,
      headers
    })
  } catch (error) {
    console.error('Error in GET /api/legal-documents/[id]/download:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}