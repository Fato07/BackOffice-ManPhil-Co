// Shared types and imports for contact actions
export interface ActionResult<T> {
  success: boolean
  data?: T
  error?: string
}

// Re-export commonly needed types
export {
  GlobalContactCategory,
  ContactPropertyRelationship,
  Prisma
} from '@/generated/prisma'

export {
  createContactSchema,
  updateContactSchema,
  bulkDeleteContactsSchema,
  linkContactToPropertySchema,
  unlinkContactFromPropertySchema,
  exportContactsSchema,
  importContactsSchema,
  contactPaginationSchema,
  contactSearchSchema,
  checkContactUniquenessSchema,
  type CreateContactData,
  type UpdateContactData,
  type BulkDeleteContactsData,
  type LinkContactToPropertyData,
  type UnlinkContactFromPropertyData,
  type ExportContactsData,
  type ImportContactsData,
  type ContactPaginationData,
  type ContactSearchData
} from '@/lib/validations/contact'