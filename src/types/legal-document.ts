import { 
  LegalDocument as PrismaLegalDocument, 
  LegalDocumentVersion as PrismaLegalDocumentVersion, 
  LegalDocumentCategory, 
  LegalDocumentStatus 
} from '@/generated/prisma'

export type LegalDocument = PrismaLegalDocument
export type LegalDocumentVersion = PrismaLegalDocumentVersion

export { LegalDocumentCategory, LegalDocumentStatus }

export interface LegalDocumentWithRelations extends LegalDocument {
  property?: {
    id: string
    name: string
  } | null
  versions: LegalDocumentVersion[]
}

export interface LegalDocumentFilters {
  search?: string
  category?: LegalDocumentCategory | 'ALL'
  status?: LegalDocumentStatus | 'ALL'
  propertyId?: string | 'ALL'
  expiringInDays?: number
  uploadedAfter?: Date
  uploadedBefore?: Date
  tags?: string[]
}

export interface CreateLegalDocumentInput {
  name: string
  description?: string
  category: LegalDocumentCategory
  subcategory?: string
  propertyId?: string
  expiryDate?: Date
  reminderDays?: number
  tags?: string[]
  metadata?: Record<string, unknown>
  file: File
}

export interface UpdateLegalDocumentInput {
  name?: string
  description?: string
  category?: LegalDocumentCategory
  subcategory?: string
  status?: LegalDocumentStatus
  propertyId?: string | null
  expiryDate?: Date | null
  reminderDays?: number | null
  tags?: string[]
  metadata?: Record<string, unknown>
}

export interface UploadLegalDocumentVersionInput {
  documentId: string
  file: File
  comment?: string
}

export interface LegalDocumentListResponse {
  documents: LegalDocumentWithRelations[]
  totalCount: number
  hasMore: boolean
}

export interface LegalDocumentExportData {
  id: string
  name: string
  description: string | null
  category: LegalDocumentCategory
  subcategory: string | null
  status: LegalDocumentStatus
  propertyName: string | null
  expiryDate: string | null
  uploadedBy: string
  uploadedAt: string
  fileSize: number
  tags: string[]
}

export const isLegalDocumentCategory = (value: unknown): value is LegalDocumentCategory => {
  return Object.values(LegalDocumentCategory).includes(value as LegalDocumentCategory)
}

export const isLegalDocumentStatus = (value: unknown): value is LegalDocumentStatus => {
  return Object.values(LegalDocumentStatus).includes(value as LegalDocumentStatus)
}

export const LEGAL_DOCUMENT_CATEGORY_LABELS: Record<LegalDocumentCategory, string> = {
  [LegalDocumentCategory.PROPERTY_DEED]: 'Property Deed',
  [LegalDocumentCategory.LEASE_AGREEMENT]: 'Lease Agreement',
  [LegalDocumentCategory.VENDOR_CONTRACT]: 'Vendor Contract',
  [LegalDocumentCategory.INSURANCE_POLICY]: 'Insurance Policy',
  [LegalDocumentCategory.PERMIT_LICENSE]: 'Permit/License',
  [LegalDocumentCategory.TAX_DOCUMENT]: 'Tax Document',
  [LegalDocumentCategory.COMPLIANCE_CERTIFICATE]: 'Compliance Certificate',
  [LegalDocumentCategory.OTHER]: 'Other',
}

export const LEGAL_DOCUMENT_STATUS_LABELS: Record<LegalDocumentStatus, string> = {
  [LegalDocumentStatus.ACTIVE]: 'Active',
  [LegalDocumentStatus.EXPIRED]: 'Expired',
  [LegalDocumentStatus.PENDING_RENEWAL]: 'Pending Renewal',
  [LegalDocumentStatus.ARCHIVED]: 'Archived',
}

export const LEGAL_DOCUMENT_STATUS_COLORS: Record<LegalDocumentStatus, string> = {
  [LegalDocumentStatus.ACTIVE]: 'green',
  [LegalDocumentStatus.EXPIRED]: 'red',
  [LegalDocumentStatus.PENDING_RENEWAL]: 'yellow',
  [LegalDocumentStatus.ARCHIVED]: 'gray',
}

export const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
]

export const ALLOWED_FILE_EXTENSIONS = [
  '.pdf',
  '.doc',
  '.docx',
  '.jpg',
  '.jpeg',
  '.png',
  '.gif',
  '.webp',
]

export const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}