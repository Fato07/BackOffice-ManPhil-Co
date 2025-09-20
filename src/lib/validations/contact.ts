import { z } from "zod"
import { GlobalContactCategory, ContactPropertyRelationship } from '@/generated/prisma'

// Base contact schema
export const contactSchema = z.object({
  firstName: z.string()
    .min(1, "First name is required")
    .max(100, "First name too long")
    .trim(),
  lastName: z.string()
    .min(1, "Last name is required") 
    .max(100, "Last name too long")
    .trim(),
  phone: z.string().max(50, "Phone number too long").optional(),
  email: z.string().email({ message: "Please enter a valid email address" }).max(255, "Email too long").optional(),
  language: z.string().min(1, "Language is required").default("English"),
  category: z.nativeEnum(GlobalContactCategory).describe("Please select a valid contact category"),
  comments: z.string().max(1000, "Comments too long").optional(),
})

// Contact property relationship schema
export const contactPropertySchema = z.object({
  propertyId: z.string().min(1, "Property ID is required"),
  relationship: z.nativeEnum(ContactPropertyRelationship).describe("Please select a valid relationship type"),
})

// Create contact schema
export const createContactSchema = contactSchema.extend({
  contactProperties: z.array(contactPropertySchema).optional().default([]),
})

// Update contact schema  
export const updateContactSchema = contactSchema.partial().extend({
  id: z.string().min(1, "Contact ID is required"),
  contactProperties: z.array(contactPropertySchema).optional(),
})

// Contact filters schema
export const contactFiltersSchema = z.object({
  search: z.string().optional(),
  category: z.enum(['ALL', 'CLIENT', 'OWNER', 'PROVIDER', 'ORGANIZATION', 'OTHER']).optional(),
  language: z.string().optional(),
  hasLinkedProperties: z.boolean().optional(),
})

// Bulk operations schema
export const bulkDeleteContactsSchema = z.object({
  contactIds: z.array(z.string().min(1)).min(1, "At least one contact ID is required"),
})

// Contact property link schema
export const linkContactToPropertySchema = z.object({
  contactId: z.string().min(1, "Contact ID is required"),
  propertyId: z.string().min(1, "Property ID is required"),
  relationship: z.nativeEnum(ContactPropertyRelationship).describe("Please select a valid relationship type"),
})

// Contact property unlink schema
export const unlinkContactFromPropertySchema = z.object({
  contactId: z.string().min(1, "Contact ID is required"),
  propertyId: z.string().min(1, "Property ID is required"),
})

// Export/import schemas
export const exportContactsSchema = z.object({
  contactIds: z.array(z.string()).optional(),
  filters: contactFiltersSchema.optional(),
  format: z.enum(['csv', 'excel']).default('csv'),
})

export const importContactsSchema = z.object({
  contacts: z.array(createContactSchema),
  skipDuplicates: z.boolean().default(true),
  updateExisting: z.boolean().default(false),
})

// Validation for contact uniqueness
export const checkContactUniquenessSchema = z.object({
  email: z.string().email().optional(),
  excludeId: z.string().optional(), // For updates, exclude current contact ID
})

// Pagination schema
export const contactPaginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(10),
  filters: contactFiltersSchema.optional(),
})

// Contact search schema
export const contactSearchSchema = z.object({
  query: z.string().min(1, "Search query is required"),
  limit: z.number().int().min(1).max(50).default(10),
})

// Type exports for use in components
export type ContactFormData = z.infer<typeof contactSchema>
export type CreateContactData = z.infer<typeof createContactSchema>
export type UpdateContactData = z.infer<typeof updateContactSchema>
export type ContactFilters = z.infer<typeof contactFiltersSchema>
export type ContactPropertyData = z.infer<typeof contactPropertySchema>
export type BulkDeleteContactsData = z.infer<typeof bulkDeleteContactsSchema>
export type LinkContactToPropertyData = z.infer<typeof linkContactToPropertySchema>
export type UnlinkContactFromPropertyData = z.infer<typeof unlinkContactFromPropertySchema>
export type ExportContactsData = z.infer<typeof exportContactsSchema>
export type ImportContactsData = z.infer<typeof importContactsSchema>
export type ContactPaginationData = z.infer<typeof contactPaginationSchema>
export type ContactSearchData = z.infer<typeof contactSearchSchema>