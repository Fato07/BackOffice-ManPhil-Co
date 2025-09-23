import { ActivityProvider as PrismaActivityProvider, Property, Prisma } from '@/generated/prisma'

// Extended types with relations
export interface ActivityProvider extends PrismaActivityProvider {
  properties?: Property[]
  _count?: {
    properties: number
  }
}

// Filter types for searching/filtering
export interface ActivityProviderFilters {
  search?: string
  category?: string
  tags?: string[]
  hasWebsite?: boolean
  hasPhone?: boolean
  hasEmail?: boolean
  propertyId?: string
  sortBy?: 'name' | 'category' | 'createdAt' | 'updatedAt'
  sortOrder?: 'asc' | 'desc'
  page?: number
  limit?: number
}

// Form input types
export interface CreateActivityProviderInput {
  name: string
  type: string
  description?: string
  address?: string
  city?: string
  country?: string
  postalCode?: string
  latitude?: number
  longitude?: number
  phone?: string
  email?: string
  website?: string
  openingHours?: string
  priceRange?: string
  amenities?: string[]
  tags?: string[]
  rating?: number
  imageUrls?: string[]
  comments?: string
  internalNotes?: string
  propertyIds?: string[]
}

export interface UpdateActivityProviderInput extends Partial<CreateActivityProviderInput> {
  id: string
}

// List item type with minimal relations
export interface ActivityProviderListItem {
  id: string
  name: string
  type: string
  description?: string | null
  address?: string | null
  city?: string | null
  country?: string | null
  phone?: string | null
  email?: string | null
  website?: string | null
  comments?: string | null
  tags?: string[]
  rating?: number | null
  imageUrls?: string[]
  _count: {
    properties: number
  }
  createdAt: Date
  updatedAt: Date
}

// Property link types
export interface LinkProviderToPropertyInput {
  providerId: string
  propertyId: string
  notes?: string
  distance?: number
  walkingTime?: number
  drivingTime?: number
}

export interface UnlinkProviderFromPropertyInput {
  providerId: string
  propertyId: string
}

// Bulk import types
export interface BulkImportActivityProvidersInput {
  providers: CreateActivityProviderInput[]
  skipDuplicates?: boolean
}

export interface ExportActivityProvidersInput {
  filters?: ActivityProviderFilters
  format?: 'csv' | 'json'
  fields?: (keyof ActivityProvider)[]
}

// Response types
export interface ActivityProviderResponse {
  success: boolean
  data?: ActivityProvider
  error?: string
}

export interface ActivityProvidersListResponse {
  success: boolean
  data?: {
    providers: ActivityProviderListItem[]
    total: number
    page: number
    totalPages: number
  }
  error?: string
}

export interface BulkImportResponse {
  success: boolean
  data?: {
    imported: number
    skipped: number
    errors: Array<{
      row: number
      error: string
    }>
  }
  error?: string
}

// Audit log types
export interface ActivityProviderAuditLogEntry {
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LINK' | 'UNLINK'
  providerId: string
  providerName: string
  changes?: Record<string, { old: any; new: any }>
  metadata?: Record<string, any>
}