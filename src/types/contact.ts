import { GlobalContactCategory, ContactPropertyRelationship } from '@/generated/prisma'

export interface ContactListItem {
  id: string
  firstName: string
  lastName: string
  phone: string | null
  email: string | null
  language: string
  category: GlobalContactCategory
  comments: string | null
  createdAt: Date
  updatedAt: Date
  contactProperties: ContactPropertyInfo[]
}

export interface ContactPropertyInfo {
  id: string
  propertyId: string
  propertyName: string
  relationship: ContactPropertyRelationship
}

export interface ContactDetail extends ContactListItem {
  contactProperties: {
    id: string
    propertyId: string
    propertyName: string
    relationship: ContactPropertyRelationship
    property?: {
      id: string
      name: string
      status: string
    }
  }[]
}

export interface ContactFilters {
  search?: string
  category?: GlobalContactCategory | 'ALL'
  language?: string
  hasLinkedProperties?: boolean
}

export interface ContactFormData {
  firstName: string
  lastName: string
  phone?: string | null
  email?: string | null
  language: string
  category: GlobalContactCategory
  comments?: string | null
  contactProperties?: {
    propertyId: string
    relationship: ContactPropertyRelationship
  }[]
}

export type CreateContactData = ContactFormData

export interface UpdateContactData extends Partial<ContactFormData> {
  id: string
}

export interface ContactsResponse {
  data: ContactListItem[]
  totalCount: number
  pageCount: number
}

// Contact category configuration for UI
export const CONTACT_CATEGORIES = {
  CLIENT: {
    label: "Client",
    description: "Property guests and potential customers",
    color: "bg-blue-100 text-blue-800 hover:bg-blue-200"
  },
  OWNER: {
    label: "Owner", 
    description: "Property owners and landlords",
    color: "bg-green-100 text-green-800 hover:bg-green-200"
  },
  PROVIDER: {
    label: "Provider",
    description: "Individual service providers",
    color: "bg-purple-100 text-purple-800 hover:bg-purple-200"
  },
  ORGANIZATION: {
    label: "Organization",
    description: "Companies and agencies",
    color: "bg-orange-100 text-orange-800 hover:bg-orange-200"
  },
  OTHER: {
    label: "Other",
    description: "Other types of contacts",
    color: "bg-gray-100 text-gray-800 hover:bg-gray-200"
  }
} as const

// Property relationship configuration for UI
export const PROPERTY_RELATIONSHIPS = {
  OWNER: {
    label: "Owner",
    description: "Property owner",
    color: "bg-green-100 text-green-800"
  },
  RENTER: {
    label: "Renter",
    description: "Current tenant or guest",
    color: "bg-blue-100 text-blue-800"
  },
  MANAGER: {
    label: "Manager",
    description: "Property manager",
    color: "bg-purple-100 text-purple-800"
  },
  STAFF: {
    label: "Staff",
    description: "Property staff member",
    color: "bg-yellow-100 text-yellow-800"
  },
  EMERGENCY: {
    label: "Emergency",
    description: "Emergency contact",
    color: "bg-red-100 text-red-800"
  },
  MAINTENANCE: {
    label: "Maintenance",
    description: "Maintenance contact",
    color: "bg-orange-100 text-orange-800"
  },
  AGENCY: {
    label: "Agency",
    description: "Agency contact",
    color: "bg-indigo-100 text-indigo-800"
  },
  OTHER: {
    label: "Other",
    description: "Other relationship",
    color: "bg-gray-100 text-gray-800"
  }
} as const

// Available languages
export const LANGUAGES = [
  'English',
  'French', 
  'Spanish',
  'German',
  'Italian',
  'Portuguese',
  'Dutch',
  'Russian',
  'Chinese',
  'Japanese',
  'Arabic'
] as const

export type Language = typeof LANGUAGES[number]