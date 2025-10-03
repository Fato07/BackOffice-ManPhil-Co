import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requirePermission } from '@/lib/auth'
import { Permission } from '@/types/auth'
import { createClient } from '@supabase/supabase-js'
import { Readable } from 'stream'
import archiver from 'archiver'

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    await requirePermission(Permission.LEGAL_DOCUMENT_VIEW)

    const { searchParams } = new URL(request.url)
    const idsParam = searchParams.get('ids')
    const format = searchParams.get('format') || 'zip'
    const includeVersions = searchParams.get('includeVersions') === 'true'

    if (!idsParam) {
      return NextResponse.json(
        { error: 'Document IDs are required' },
        { status: 400 }
      )
    }

    const documentIds = idsParam.split(',')

    // Get documents with their versions
    const documents = await prisma.legalDocument.findMany({
      where: {
        id: { in: documentIds }
      },
      include: {
        versions: includeVersions ? {
          orderBy: { versionNumber: 'desc' }
        } : false,
        property: {
          select: { name: true }
        }
      }
    })

    if (documents.length === 0) {
      return NextResponse.json(
        { error: 'No documents found' },
        { status: 404 }
      )
    }

    // Create ZIP archive
    const archive = archiver('zip', {
      zlib: { level: 9 } // Maximum compression
    })

    // Set response headers for ZIP download
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filename = `legal-documents-${timestamp}.zip`
    
    const headers = new Headers()
    headers.set('Content-Type', 'application/zip')
    headers.set('Content-Disposition', `attachment; filename="${filename}"`)
    headers.set('Cache-Control', 'no-cache')

    // Create a readable stream for the response
    const stream = new ReadableStream({
      start(controller) {
        archive.on('data', (chunk) => {
          controller.enqueue(new Uint8Array(chunk))
        })

        archive.on('end', () => {
          controller.close()
        })

        archive.on('error', (err) => {
          
          controller.error(err)
        })

        // Add files to archive
        processDocuments()

        async function processDocuments() {
          try {
            for (const doc of documents) {
              const folderName = doc.property?.name || 'General'
              
              // Add main document
              await addFileToArchive(doc.url, `${folderName}/${doc.name}`)

              // Add versions if requested
              if (includeVersions && doc.versions) {
                for (const version of doc.versions) {
                  const versionName = `${doc.name.replace(/\.[^/.]+$/, '')}-v${version.versionNumber}${getFileExtension(version.url)}`
                  await addFileToArchive(
                    version.url, 
                    `${folderName}/versions/${versionName}`
                  )
                }
              }
            }

            archive.finalize()
          } catch (error) {
            
            controller.error(error)
          }
        }

        async function addFileToArchive(url: string, archivePath: string) {
          try {
            // Extract the file path from the Supabase URL
            const urlParts = url.split('/storage/v1/object/public/')
            const filePath = urlParts[1]
            
            if (!filePath) {
              console.warn(`Invalid URL format: ${url}`)
              return
            }

            // Download file from Supabase
            const { data, error } = await supabase.storage
              .from('legal-documents')
              .download(filePath.replace('legal-documents/', ''))

            if (error) {
              console.warn(`Failed to download file ${filePath}:`, error)
              return
            }

            if (data) {
              // Add file to archive
              const buffer = await data.arrayBuffer()
              archive.append(Buffer.from(buffer), { name: archivePath })
            }
          } catch (error) {
            console.warn(`Error adding file to archive ${archivePath}:`, error)
          }
        }

        function getFileExtension(url: string): string {
          const match = url.match(/\.([^.]+)$/)
          return match ? `.${match[1]}` : ''
        }
      }
    })

    return new Response(stream, { headers })

  } catch (error) {
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}