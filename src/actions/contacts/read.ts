'use server'

import { z } from 'zod'
import { prisma } from '@/lib/db'
import { requirePermission } from '@/lib/auth'
import { Permission } from '@/types/auth'
import { auth } from '@clerk/nextjs/server'
import {
  ActionResult,
  Prisma,
  GlobalContactCategory,
  contactPaginationSchema,
  contactSearchSchema,
  type ContactPaginationData,
  type ContactSearchData
} from './types'

/**
 * Get a single contact by ID
 * - Includes linked properties
 */
export async function getContact(id: string): Promise<ActionResult<any>> {
  try {
    const { userId } = await auth()
    if (!userId) {
      return { success: false, error: 'Unauthorized' }
    }

    // Permission check
    const hasPermission = await requirePermission(Permission.CONTACTS_VIEW)
    if (!hasPermission) {
      return { success: false, error: 'You do not have permission to view contacts' }
    }

    const contact = await prisma.contact.findUnique({
      where: { id },
      include: {
        contactProperties: {
          include: {
            property: true
          }
        }
      }
    })

    if (!contact) {
      return { success: false, error: 'Contact not found' }
    }

    return {
      success: true,
      data: contact,
    }
  } catch (_error) {
    return {
      success: false,
      error: 'Failed to fetch contact',
    }
  }
}

/**
 * Get contacts with pagination and filtering
 */
export async function getContacts(
  input: ContactPaginationData
): Promise<ActionResult<{ 
  contacts: Prisma.ContactGetPayload<{ include: { contactProperties: { include: { property: true } } } }>[], 
  totalCount: number, 
  pageCount: number 
}>> {
  try {
    const { userId } = await auth()
    if (!userId) {
      return { success: false, error: 'Unauthorized' }
    }

    // Permission check
    const hasPermission = await requirePermission(Permission.CONTACTS_VIEW)
    if (!hasPermission) {
      return { success: false, error: 'You do not have permission to view contacts' }
    }

    // Validate input
    const validated = contactPaginationSchema.parse(input)
    const { page, pageSize, filters } = validated
    const skip = (page - 1) * pageSize

    // Build where clause
    const where: Prisma.ContactWhereInput = {}

    if (filters?.search) {
      where.OR = [
        { firstName: { contains: filters.search, mode: 'insensitive' } },
        { lastName: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { phone: { contains: filters.search, mode: 'insensitive' } },
      ]
    }

    if (filters?.category && filters.category !== 'ALL') {
      where.category = filters.category as GlobalContactCategory
    }

    if (filters?.language) {
      where.language = filters.language
    }

    if (filters?.hasLinkedProperties !== undefined) {
      if (filters.hasLinkedProperties) {
        where.contactProperties = { some: {} }
      } else {
        where.contactProperties = { none: {} }
      }
    }

    // Fetch contacts and total count
    const [contacts, totalCount] = await Promise.all([
      prisma.contact.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: [
          { lastName: 'asc' },
          { firstName: 'asc' }
        ],
        include: {
          contactProperties: {
            include: {
              property: true
            }
          },
          _count: {
            select: {
              contactProperties: true
            }
          }
        }
      }),
      prisma.contact.count({ where })
    ])

    return {
      success: true,
      data: {
        contacts,
        totalCount,
        pageCount: Math.ceil(totalCount / pageSize)
      }
    }
  } catch (_error) {
    if (_error instanceof z.ZodError) {
      const firstError = _error.issues[0]
      return {
        success: false,
        error: `Validation error: ${firstError.path.join('.')} - ${firstError.message}`,
      }
    }

    return {
      success: false,
      error: 'Failed to fetch contacts',
      data: { contacts: [], totalCount: 0, pageCount: 0 }
    }
  }
}

/**
 * Search contacts by query
 * - Quick search for autocomplete/selection
 */
export async function searchContacts(
  input: ContactSearchData
): Promise<ActionResult<any[]>> {
  try {
    const { userId } = await auth()
    if (!userId) {
      return { success: false, error: 'Unauthorized' }
    }

    // Permission check
    const hasPermission = await requirePermission(Permission.CONTACTS_VIEW)
    if (!hasPermission) {
      return { success: false, error: 'You do not have permission to view contacts' }
    }

    // Validate input
    const validated = contactSearchSchema.parse(input)
    const { query, limit } = validated

    const contacts = await prisma.contact.findMany({
      where: {
        OR: [
          { firstName: { contains: query, mode: 'insensitive' } },
          { lastName: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
          { phone: { contains: query, mode: 'insensitive' } },
        ]
      },
      take: limit,
      orderBy: [
        { lastName: 'asc' },
        { firstName: 'asc' }
      ],
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        category: true,
      }
    })

    return {
      success: true,
      data: contacts,
    }
  } catch (_error) {
    if (_error instanceof z.ZodError) {
      const firstError = _error.issues[0]
      return {
        success: false,
        error: `Validation error: ${firstError.path.join('.')} - ${firstError.message}`,
      }
    }

    return {
      success: false,
      error: 'Failed to search contacts',
      data: []
    }
  }
}

/**
 * Get contacts linked to a specific property
 */
export async function getPropertyContacts(
  propertyId: string
): Promise<ActionResult<any[]>> {
  try {
    const { userId } = await auth()
    if (!userId) {
      return { success: false, error: 'Unauthorized' }
    }

    // Permission check
    const hasPermission = await requirePermission(Permission.CONTACTS_VIEW)
    if (!hasPermission) {
      return { success: false, error: 'You do not have permission to view contacts' }
    }

    const contactProperties = await prisma.contactProperty.findMany({
      where: { propertyId },
      include: {
        contact: true
      },
      orderBy: [
        { relationship: 'asc' },
        { contact: { lastName: 'asc' } },
        { contact: { firstName: 'asc' } }
      ]
    })

    return {
      success: true,
      data: contactProperties
    }
  } catch (_error) {
    return {
      success: false,
      error: 'Failed to fetch property contacts',
      data: []
    }
  }
}