// Re-export all contact action functions
export { createContact, updateContact } from './create-update'
export { deleteContact, bulkDeleteContacts } from './delete'
export { getContact, getContacts, searchContacts, getPropertyContacts } from './read'
export { linkContactToProperty, unlinkContactFromProperty } from './property-links'
export { exportContacts, importContacts } from './import-export'
export { checkContactUniqueness } from './validation'

// Re-export types
export * from './types'