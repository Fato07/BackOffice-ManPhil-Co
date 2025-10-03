'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { requirePermission, getCurrentUserId, getUserEmail, getUserFullName } from '@/lib/auth'
import { Permission } from '@/types/auth'
import { createClient } from '@supabase/supabase-js'
import { 
  LegalDocumentCategory,
  LegalDocumentStatus,
  Prisma
} from '@/generated/prisma'
import {
  createLegalDocumentSchema,
  updateLegalDocumentSchema,
  uploadLegalDocumentVersionSchema,
  bulkDeleteLegalDocumentsSchema,
  bulkDownloadLegalDocumentsSchema,
  legalDocumentExportSchema,
  type CreateLegalDocumentInput,
  type UpdateLegalDocumentInput,
  type UploadLegalDocumentVersionInput,
  type LegalDocumentFiltersInput,
  type BulkDeleteLegalDocumentsInput,
  type BulkDownloadLegalDocumentsInput,
  type LegalDocumentExportInput
} from '@/lib/validations/legal-document'
import { LegalDocumentWithRelations, formatFileSize } from '@/types/legal-document'

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Result type for all actions
interface ActionResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

/**
 * Get legal documents with filters and pagination
 */
export async function getLegalDocuments(
  filters: LegalDocumentFiltersInput & { 
    page?: number
    pageSize?: number
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
  } = {}
): Promise<ActionResult<{ documents: LegalDocumentWithRelations[]; totalCount: number }>> {
  try {
    console.log('🔍 getLegalDocuments: Starting with filters:', JSON.stringify(filters, null, 2))
    
    // Permission check
    console.log('🔐 getLegalDocuments: Checking permissions...')
    await requirePermission(Permission.LEGAL_DOCUMENT_VIEW)
    console.log('✅ getLegalDocuments: Permission check passed')

    const page = filters.page || 1
    const pageSize = filters.pageSize || 20
    const skip = (page - 1) * pageSize
    const sortBy = filters.sortBy || 'createdAt'
    const sortOrder = filters.sortOrder || 'desc'

    // Build where clause
    const where: Prisma.LegalDocumentWhereInput = {}
    
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
        { tags: { has: filters.search } }
      ]
    }
    
    if (filters.category && filters.category !== 'ALL') {
      where.category = filters.category
    }
    
    if (filters.status && filters.status !== 'ALL') {
      where.status = filters.status
    }
    
    if (filters.propertyId && filters.propertyId !== 'ALL') {
      where.propertyId = filters.propertyId
    }
    
    if (filters.expiringInDays !== undefined) {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + filters.expiringInDays)
      where.expiryDate = {
        gte: new Date(),
        lte: futureDate
      }
    }
    
    if (filters.uploadedAfter) {
      where.uploadedAt = { ...where.uploadedAt as Record<string, unknown>, gte: filters.uploadedAfter }
    }
    
    if (filters.uploadedBefore) {
      where.uploadedAt = { ...where.uploadedAt as Record<string, unknown>, lte: filters.uploadedBefore }
    }
    
    if (filters.tags && filters.tags.length > 0) {
      where.tags = { hasSome: filters.tags }
    }

    console.log('📊 getLegalDocuments: Query where clause:', JSON.stringify(where, null, 2))
    console.log('📄 getLegalDocuments: Query pagination - page:', page, 'pageSize:', pageSize, 'skip:', skip)

    const [documents, totalCount] = await Promise.all([
      prisma.legalDocument.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { [sortBy]: sortOrder },
        include: {
          property: {
            select: {
              id: true,
              name: true
            }
          },
          versions: {
            orderBy: { versionNumber: 'desc' }
          }
        }
      }),
      prisma.legalDocument.count({ where })
    ])

    console.log('📈 getLegalDocuments: Query results - found', documents.length, 'documents, total count:', totalCount)
    console.log('📋 getLegalDocuments: Document IDs:', documents.map(d => ({ id: d.id, name: d.name, status: d.status })))

    // Update status based on expiry dates
    const now = new Date()
    for (const doc of documents) {
      if (doc.expiryDate && doc.status !== LegalDocumentStatus.ARCHIVED) {
        const daysUntilExpiry = Math.floor(
          (doc.expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        )
        
        if (daysUntilExpiry < 0 && doc.status !== LegalDocumentStatus.EXPIRED) {
          await prisma.legalDocument.update({
            where: { id: doc.id },
            data: { status: LegalDocumentStatus.EXPIRED }
          })
          doc.status = LegalDocumentStatus.EXPIRED
        } else if (
          doc.reminderDays && 
          daysUntilExpiry <= doc.reminderDays && 
          daysUntilExpiry >= 0 &&
          doc.status !== LegalDocumentStatus.PENDING_RENEWAL
        ) {
          await prisma.legalDocument.update({
            where: { id: doc.id },
            data: { status: LegalDocumentStatus.PENDING_RENEWAL }
          })
          doc.status = LegalDocumentStatus.PENDING_RENEWAL
        }
      }
    }

    console.log('✅ getLegalDocuments: Returning', documents.length, 'documents successfully')
    
    return {
      success: true,
      data: { documents, totalCount }
    }
  } catch (error) {
    console.error('❌ getLegalDocuments: Error occurred:', error)
    // Error getting legal documents
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to get legal documents' 
    }
  }
}

/**
 * Get a single legal document by ID
 */
export async function getLegalDocument(
  id: string
): Promise<ActionResult<LegalDocumentWithRelations>> {
  try {
    await requirePermission(Permission.LEGAL_DOCUMENT_VIEW)
    const userId = await getCurrentUserId()
    if (!userId) {
      return { success: false, error: 'Unauthorized' }
    }

    const document = await prisma.legalDocument.findUnique({
      where: { id },
      include: {
        property: {
          select: {
            id: true,
            name: true
          }
        },
        versions: {
          orderBy: { versionNumber: 'desc' }
        }
      }
    })

    if (!document) {
      return { success: false, error: 'Document not found' }
    }

    // Update last accessed
    await prisma.legalDocument.update({
      where: { id },
      data: { lastAccessedAt: new Date() }
    })

    // Log sensitive data access if applicable
    if (document.category === LegalDocumentCategory.TAX_DOCUMENT || 
        document.category === LegalDocumentCategory.VENDOR_CONTRACT) {
      await prisma.auditLog.create({
        data: {
          userId,
          action: 'VIEW_LEGAL_DOCUMENT',
          entityType: 'LegalDocument',
          entityId: id,
          changes: {
            category: document.category,
            name: document.name
          }
        }
      })
    }

    return { success: true, data: document }
  } catch (error) {
    // Error getting legal document
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to get legal document' 
    }
  }
}

/**
 * Create a new legal document with file upload
 */
export async function createLegalDocument(
  input: Omit<CreateLegalDocumentInput, 'file'>,
  fileData: { buffer: Buffer; mimetype: string; originalname: string; size: number }
): Promise<ActionResult<{ id: string }>> {
  try {
    await requirePermission(Permission.LEGAL_DOCUMENT_CREATE)
    const userId = await getCurrentUserId()
    const userEmail = await getUserEmail()
    const userName = await getUserFullName()
    
    if (!userId) {
      return { success: false, error: 'Unauthorized' }
    }

    // Validate input (without file)
    const validated = createLegalDocumentSchema.omit({ file: true }).parse(input)

    // Upload file to Supabase
    const fileName = `${Date.now()}-${fileData.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`
    const filePath = `legal-documents/${validated.propertyId || 'global'}/${fileName}`
    
    const { error: uploadError } = await supabase.storage
      .from('legal-documents')
      .upload(filePath, fileData.buffer, {
        contentType: fileData.mimetype,
        cacheControl: '3600'
      })

    if (uploadError) {
      throw new Error(`File upload failed: ${uploadError.message}`)
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('legal-documents')
      .getPublicUrl(filePath)

    // Create document record
    const document = await prisma.legalDocument.create({
      data: {
        ...validated,
        metadata: (validated.metadata as Prisma.JsonValue) || {},
        url: publicUrl,
        fileSize: fileData.size,
        mimeType: fileData.mimetype,
        uploadedBy: userId,
        versions: {
          create: {
            versionNumber: 1,
            url: publicUrl,
            fileSize: fileData.size,
            uploadedBy: userId,
            comment: 'Initial version'
          }
        }
      }
    })

    // Log activity
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'CREATE_LEGAL_DOCUMENT',
        entityType: 'LegalDocument',
        entityId: document.id,
        changes: {
          name: document.name,
          category: document.category,
          uploadedBy: userName || userEmail || userId
        }
      }
    })

    revalidatePath('/legals')
    
    return { success: true, data: { id: document.id } }
  } catch (error) {
    // Error creating legal document
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create legal document' 
    }
  }
}

/**
 * Update legal document metadata
 */
export async function updateLegalDocument(
  id: string,
  input: UpdateLegalDocumentInput
): Promise<ActionResult<{ id: string }>> {
  try {
    await requirePermission(Permission.LEGAL_DOCUMENT_EDIT)
    const userId = await getCurrentUserId()
    
    if (!userId) {
      return { success: false, error: 'Unauthorized' }
    }

    // Validate input
    const validated = updateLegalDocumentSchema.parse(input)

    // Get existing document
    const existing = await prisma.legalDocument.findUnique({
      where: { id }
    })

    if (!existing) {
      return { success: false, error: 'Document not found' }
    }

    // Update document
    const updated = await prisma.legalDocument.update({
      where: { id },
      data: {
        ...validated,
        metadata: (validated.metadata as Prisma.JsonValue) || undefined
      }
    })

    // Log activity
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'UPDATE_LEGAL_DOCUMENT',
        entityType: 'LegalDocument',
        entityId: id,
        changes: validated as Prisma.InputJsonValue
      }
    })

    revalidatePath('/legals')
    revalidatePath(`/legals/${id}`)
    
    return { success: true, data: { id: updated.id } }
  } catch (error) {
    // Error updating legal document
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update legal document' 
    }
  }
}

/**
 * Upload a new version of a legal document
 */
export async function uploadLegalDocumentVersion(
  input: Omit<UploadLegalDocumentVersionInput, 'file'>,
  fileData: { buffer: Buffer; mimetype: string; originalname: string; size: number }
): Promise<ActionResult<{ versionNumber: number }>> {
  try {
    await requirePermission(Permission.LEGAL_DOCUMENT_EDIT)
    const userId = await getCurrentUserId()
    const userName = await getUserFullName()
    
    if (!userId) {
      return { success: false, error: 'Unauthorized' }
    }

    const { documentId, comment } = uploadLegalDocumentVersionSchema
      .omit({ file: true })
      .parse(input)

    // Get existing document
    const document = await prisma.legalDocument.findUnique({
      where: { id: documentId },
      include: {
        versions: {
          orderBy: { versionNumber: 'desc' },
          take: 1
        }
      }
    })

    if (!document) {
      return { success: false, error: 'Document not found' }
    }

    // Get next version number
    const nextVersionNumber = (document.versions[0]?.versionNumber || 0) + 1

    // Upload file to Supabase
    const fileName = `${Date.now()}-v${nextVersionNumber}-${fileData.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`
    const filePath = `legal-documents/${document.propertyId || 'global'}/${documentId}/${fileName}`
    
    const { error: uploadError } = await supabase.storage
      .from('legal-documents')
      .upload(filePath, fileData.buffer, {
        contentType: fileData.mimetype,
        cacheControl: '3600'
      })

    if (uploadError) {
      throw new Error(`File upload failed: ${uploadError.message}`)
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('legal-documents')
      .getPublicUrl(filePath)

    // Create new version
    await prisma.$transaction(async (tx) => {
      // Create version record
      await tx.legalDocumentVersion.create({
        data: {
          documentId,
          versionNumber: nextVersionNumber,
          url: publicUrl,
          fileSize: fileData.size,
          uploadedBy: userId,
          comment
        }
      })

      // Update main document with new URL
      await tx.legalDocument.update({
        where: { id: documentId },
        data: {
          url: publicUrl,
          fileSize: fileData.size,
          mimeType: fileData.mimetype
        }
      })
    })

    // Log activity
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'UPLOAD_LEGAL_DOCUMENT_VERSION',
        entityType: 'LegalDocument',
        entityId: documentId,
        changes: {
          versionNumber: nextVersionNumber,
          uploadedBy: userName || userId,
          comment
        }
      }
    })

    revalidatePath('/legals')
    revalidatePath(`/legals/${documentId}`)
    
    return { success: true, data: { versionNumber: nextVersionNumber } }
  } catch (error) {
    // Error uploading document version
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to upload document version' 
    }
  }
}

/**
 * Delete a legal document
 */
export async function deleteLegalDocument(
  id: string
): Promise<ActionResult<void>> {
  try {
    await requirePermission(Permission.LEGAL_DOCUMENT_DELETE)
    const userId = await getCurrentUserId()
    
    if (!userId) {
      return { success: false, error: 'Unauthorized' }
    }

    // Get document with versions
    const document = await prisma.legalDocument.findUnique({
      where: { id },
      include: {
        versions: true
      }
    })

    if (!document) {
      return { success: false, error: 'Document not found' }
    }

    // Delete files from Supabase
    const filePaths = [
      ...document.versions.map(v => v.url),
      document.url
    ].map(url => {
      // Extract path from URL
      const urlParts = url.split('/storage/v1/object/public/')
      return urlParts[1] || ''
    }).filter(Boolean)

    if (filePaths.length > 0) {
      const { error: deleteError } = await supabase.storage
        .from('legal-documents')
        .remove(filePaths)

      if (deleteError) {
        // Error deleting files from storage
      }
    }

    // Delete from database
    await prisma.legalDocument.delete({
      where: { id }
    })

    // Log activity
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'DELETE_LEGAL_DOCUMENT',
        entityType: 'LegalDocument',
        entityId: id,
        changes: {
          name: document.name,
          category: document.category
        }
      }
    })

    revalidatePath('/legals')
    
    return { success: true }
  } catch (error) {
    // Error deleting legal document
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to delete legal document' 
    }
  }
}

/**
 * Bulk delete legal documents
 */
export async function bulkDeleteLegalDocuments(
  input: BulkDeleteLegalDocumentsInput
): Promise<ActionResult<{ deletedCount: number }>> {
  try {
    await requirePermission(Permission.LEGAL_DOCUMENT_DELETE)
    const userId = await getCurrentUserId()
    
    if (!userId) {
      return { success: false, error: 'Unauthorized' }
    }

    const validated = bulkDeleteLegalDocumentsSchema.parse(input)

    // Get documents with versions
    const documents = await prisma.legalDocument.findMany({
      where: {
        id: { in: validated.documentIds }
      },
      include: {
        versions: true
      }
    })

    // Delete files from Supabase
    const filePaths = documents.flatMap(doc => [
      ...doc.versions.map(v => v.url),
      doc.url
    ]).map(url => {
      const urlParts = url.split('/storage/v1/object/public/')
      return urlParts[1] || ''
    }).filter(Boolean)

    if (filePaths.length > 0) {
      const { error: deleteError } = await supabase.storage
        .from('legal-documents')
        .remove(filePaths)

      if (deleteError) {
        // Error deleting files from storage
      }
    }

    // Delete from database
    const result = await prisma.legalDocument.deleteMany({
      where: {
        id: { in: validated.documentIds }
      }
    })

    // Log activity
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'BULK_DELETE_LEGAL_DOCUMENTS',
        entityType: 'LegalDocument',
        entityId: 'BULK',
        changes: {
          documentIds: validated.documentIds,
          count: result.count
        }
      }
    })

    revalidatePath('/legals')
    
    return { success: true, data: { deletedCount: result.count } }
  } catch (error) {
    // Error bulk deleting legal documents
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to bulk delete legal documents' 
    }
  }
}

/**
 * Export legal documents list
 */
export async function exportLegalDocuments(
  input: LegalDocumentExportInput
): Promise<ActionResult<{ data: Array<Record<string, unknown>>; format: string }>> {
  try {
    await requirePermission(Permission.LEGAL_DOCUMENT_VIEW)

    const validated = legalDocumentExportSchema.parse(input)
    
    // Get documents with filters
    const { success, data } = await getLegalDocuments({
      ...validated.filters,
      page: 1,
      pageSize: 10000 // Export all matching documents
    })

    if (!success || !data) {
      return { success: false, error: 'Failed to get documents for export' }
    }

    // Format data for export
    const exportData = data.documents.map(doc => ({
      id: doc.id,
      name: doc.name,
      description: doc.description || '',
      category: doc.category,
      subcategory: doc.subcategory || '',
      status: doc.status,
      propertyName: doc.property?.name || '',
      expiryDate: doc.expiryDate?.toISOString() || '',
      uploadedBy: doc.uploadedBy,
      uploadedAt: doc.uploadedAt.toISOString(),
      fileSize: formatFileSize(doc.fileSize),
      tags: doc.tags.join(', ')
    }))

    return { 
      success: true, 
      data: { data: exportData, format: validated.format } 
    }
  } catch (error) {
    // Error exporting legal documents
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to export legal documents' 
    }
  }
}

/**
 * Bulk download legal documents as ZIP archive
 */
export async function bulkDownloadLegalDocuments(
  input: BulkDownloadLegalDocumentsInput
): Promise<ActionResult<{ downloadUrl: string; filename: string; totalSize: number }>> {
  try {
    await requirePermission(Permission.LEGAL_DOCUMENT_VIEW)
    const userId = await getCurrentUserId()
    
    if (!userId) {
      return { success: false, error: 'Unauthorized' }
    }

    const validated = bulkDownloadLegalDocumentsSchema.parse(input)

    // Get documents with their versions
    const documents = await prisma.legalDocument.findMany({
      where: {
        id: { in: validated.documentIds }
      },
      include: {
        versions: validated.includeVersions ? {
          orderBy: { versionNumber: 'desc' }
        } : false,
        property: {
          select: { name: true }
        }
      }
    })

    if (documents.length === 0) {
      return { success: false, error: 'No documents found' }
    }

    // Generate unique filename for the archive
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filename = `legal-documents-${timestamp}.zip`
    
    // Calculate total size (estimation)
    let totalSize = 0
    const filesToZip: Array<{ url: string; name: string; folder?: string }> = []
    
    for (const doc of documents) {
      // Add main document
      filesToZip.push({
        url: doc.url,
        name: doc.name,
        folder: doc.property?.name || 'General'
      })
      totalSize += doc.fileSize || 0

      // Add versions if requested
      if (validated.includeVersions && doc.versions) {
        for (const version of doc.versions) {
          filesToZip.push({
            url: version.url,
            name: `${doc.name}-v${version.versionNumber}`,
            folder: `${doc.property?.name || 'General'}/versions`
          })
          totalSize += version.fileSize || 0
        }
      }
    }

    // For large archives, we'll create a signed URL for background processing
    // For now, return the file list for client-side ZIP creation
    return {
      success: true,
      data: {
        downloadUrl: `/api/legal-documents/bulk-download?ids=${validated.documentIds.join(',')}&format=${validated.format}&includeVersions=${validated.includeVersions}`,
        filename,
        totalSize
      }
    }
  } catch (error) {
    // Error preparing bulk download
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to prepare bulk download' 
    }
  }
}

/**
 * Debug function to check database documents directly
 */
export async function debugCheckDatabaseDocuments(): Promise<ActionResult<any>> {
  try {
    console.log('🔍 debugCheckDatabaseDocuments: Starting database check...')
    
    // Get total count of documents
    const totalCount = await prisma.legalDocument.count()
    console.log('📊 debugCheckDatabaseDocuments: Total documents in database:', totalCount)
    
    // Get recent documents (last 10)
    const recentDocs = await prisma.legalDocument.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        status: true,
        category: true,
        createdAt: true,
        uploadedAt: true,
        url: true,
        propertyId: true
      }
    })
    
    console.log('📋 debugCheckDatabaseDocuments: Recent documents:')
    recentDocs.forEach(doc => {
      console.log(`  - ${doc.name} (${doc.status}) - ${doc.createdAt.toISOString()}`)
    })
    
    // Check for any documents without URLs (upload failures)
    const docsWithoutUrls = await prisma.legalDocument.count({
      where: { url: null }
    })
    console.log('⚠️ debugCheckDatabaseDocuments: Documents without URLs:', docsWithoutUrls)
    
    return {
      success: true,
      data: {
        totalCount,
        recentDocs,
        docsWithoutUrls
      }
    }
  } catch (error) {
    console.error('❌ debugCheckDatabaseDocuments: Error occurred:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to check database'
    }
  }
}