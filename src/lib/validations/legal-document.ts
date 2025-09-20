import { z } from 'zod'
import { LegalDocumentCategory, LegalDocumentStatus } from '@/generated/prisma'
import { MAX_FILE_SIZE, ALLOWED_FILE_TYPES } from '@/types/legal-document'

// Base validation schemas
export const legalDocumentCategorySchema = z.nativeEnum(LegalDocumentCategory)
export const legalDocumentStatusSchema = z.nativeEnum(LegalDocumentStatus)

// File validation schema
export const fileSchema = z
  .instanceof(File)
  .refine((file) => file.size <= MAX_FILE_SIZE, {
    message: `File size must be less than ${MAX_FILE_SIZE / 1024 / 1024}MB`,
  })
  .refine((file) => ALLOWED_FILE_TYPES.includes(file.type), {
    message: 'File must be a PDF, Word document, or image',
  })

// Create legal document schema
export const createLegalDocumentSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name must be less than 255 characters'),
  description: z.string().max(1000, 'Description must be less than 1000 characters').optional(),
  category: legalDocumentCategorySchema,
  subcategory: z.string().max(100, 'Subcategory must be less than 100 characters').optional(),
  propertyId: z.string().cuid('Invalid property ID').optional(),
  expiryDate: z.date().optional(),
  reminderDays: z.number().int().min(0).max(365).optional(),
  tags: z.array(z.string().max(50, 'Tag must be less than 50 characters')).optional().default([]),
  metadata: z.record(z.unknown()).optional(),
  file: fileSchema,
})

// Update legal document schema
export const updateLegalDocumentSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).nullish(),
  category: legalDocumentCategorySchema.optional(),
  subcategory: z.string().max(100).nullish(),
  status: legalDocumentStatusSchema.optional(),
  propertyId: z.string().cuid().nullish(),
  expiryDate: z.date().nullish(),
  reminderDays: z.number().int().min(0).max(365).nullish(),
  tags: z.array(z.string().max(50)).optional(),
  metadata: z.record(z.unknown()).optional(),
})

// Upload version schema
export const uploadLegalDocumentVersionSchema = z.object({
  documentId: z.string().cuid('Invalid document ID'),
  file: fileSchema,
  comment: z.string().max(500, 'Comment must be less than 500 characters').optional(),
})

// Filter schema
export const legalDocumentFiltersSchema = z.object({
  search: z.string().optional(),
  category: z.union([legalDocumentCategorySchema, z.literal('ALL')]).optional(),
  status: z.union([legalDocumentStatusSchema, z.literal('ALL')]).optional(),
  propertyId: z.union([z.string().cuid(), z.literal('ALL')]).optional(),
  expiringInDays: z.number().int().min(0).max(365).optional(),
  uploadedAfter: z.date().optional(),
  uploadedBefore: z.date().optional(),
  tags: z.array(z.string()).optional(),
})

// Export data schema
export const legalDocumentExportSchema = z.object({
  format: z.enum(['csv', 'json', 'xlsx']),
  filters: legalDocumentFiltersSchema.optional(),
})

// Bulk operations schema
export const bulkDeleteLegalDocumentsSchema = z.object({
  documentIds: z.array(z.string().cuid()).min(1, 'At least one document must be selected'),
})

export const bulkUpdateLegalDocumentsSchema = z.object({
  documentIds: z.array(z.string().cuid()).min(1, 'At least one document must be selected'),
  updates: updateLegalDocumentSchema,
})

// Type exports
export type CreateLegalDocumentInput = z.infer<typeof createLegalDocumentSchema>
export type UpdateLegalDocumentInput = z.infer<typeof updateLegalDocumentSchema>
export type UploadLegalDocumentVersionInput = z.infer<typeof uploadLegalDocumentVersionSchema>
export type LegalDocumentFiltersInput = z.infer<typeof legalDocumentFiltersSchema>
export type LegalDocumentExportInput = z.infer<typeof legalDocumentExportSchema>
export type BulkDeleteLegalDocumentsInput = z.infer<typeof bulkDeleteLegalDocumentsSchema>
export type BulkUpdateLegalDocumentsInput = z.infer<typeof bulkUpdateLegalDocumentsSchema>