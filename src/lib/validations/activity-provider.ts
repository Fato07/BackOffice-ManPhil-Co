import { z } from 'zod'

// Base schema for activity provider data
const activityProviderBaseSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  category: z.string().min(1, 'Category is required').max(100),
  description: z.string().max(1000).optional(),
  address: z.string().max(255).optional(),
  city: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
  postalCode: z.string().max(20).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  phone: z.string().max(50).optional(),
  email: z.string().email({ message: 'Invalid email format' }).nullish(),
  website: z.string().url({ message: 'Invalid URL format' }).nullish(),
  openingHours: z.string().max(500).optional(),
  priceRange: z.string().max(50).optional(),
  amenities: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  rating: z.number().min(0).max(5).optional(),
  imageUrls: z.array(z.string().url()).optional(),
  notes: z.string().max(2000).optional(),
  internalNotes: z.string().max(2000).optional(),
})

// Create provider schema
export const createActivityProviderSchema = activityProviderBaseSchema.extend({
  propertyIds: z.array(z.string()).optional(),
})

// Update provider schema
export const updateActivityProviderSchema = activityProviderBaseSchema.partial().extend({
  id: z.string().min(1, 'Provider ID is required'),
})

// Filter validation schema
export const activityProviderFiltersSchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  hasWebsite: z.boolean().optional(),
  hasPhone: z.boolean().optional(),
  hasEmail: z.boolean().optional(),
  propertyId: z.string().optional(),
  sortBy: z.enum(['name', 'category', 'createdAt', 'updatedAt']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive().max(100).optional(),
})

// Link provider to property schema
export const linkProviderToPropertySchema = z.object({
  providerId: z.string().min(1, 'Provider ID is required'),
  propertyId: z.string().min(1, 'Property ID is required'),
  notes: z.string().max(500).optional(),
  distance: z.number().positive().optional(),
  walkingTime: z.number().int().positive().optional(),
  drivingTime: z.number().int().positive().optional(),
})

// Unlink provider from property schema
export const unlinkProviderFromPropertySchema = z.object({
  providerId: z.string().min(1, 'Provider ID is required'),
  propertyId: z.string().min(1, 'Property ID is required'),
})

// Bulk import schema
export const bulkImportActivityProvidersSchema = z.object({
  providers: z.array(createActivityProviderSchema),
  skipDuplicates: z.boolean().optional(),
})

// Export schema
export const exportActivityProvidersSchema = z.object({
  filters: activityProviderFiltersSchema.optional(),
  format: z.enum(['csv', 'json']).optional(),
  fields: z.array(z.string()).optional(),
})

// Bulk delete schema
export const bulkDeleteProvidersSchema = z.object({
  providerIds: z.array(z.string().min(1)).min(1, 'At least one provider ID is required'),
})

// Type exports
export type CreateActivityProviderInput = z.infer<typeof createActivityProviderSchema>
export type UpdateActivityProviderInput = z.infer<typeof updateActivityProviderSchema>
export type ActivityProviderFilters = z.infer<typeof activityProviderFiltersSchema>
export type LinkProviderToPropertyInput = z.infer<typeof linkProviderToPropertySchema>
export type UnlinkProviderFromPropertyInput = z.infer<typeof unlinkProviderFromPropertySchema>
export type BulkImportActivityProvidersInput = z.infer<typeof bulkImportActivityProvidersSchema>
export type ExportActivityProvidersInput = z.infer<typeof exportActivityProvidersSchema>
export type BulkDeleteProvidersData = z.infer<typeof bulkDeleteProvidersSchema>