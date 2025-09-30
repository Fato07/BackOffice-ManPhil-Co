'use server'

import { prisma } from "@/lib/db"
import { Prisma, PropertyStatus } from "@/generated/prisma"
import { revalidatePath } from 'next/cache'
import { requirePermission, getCurrentUserId } from '@/lib/auth'
import { Permission } from '@/types/auth'
import { ActionResult } from '@/types'
import { z } from 'zod'

const bulkDeletePropertiesSchema = z.object({
  propertyIds: z.array(z.string()).min(1, 'At least one property ID is required')
})

type BulkDeletePropertiesInput = z.infer<typeof bulkDeletePropertiesSchema>

export async function getProperties(params?: {
  page?: number
  pageSize?: number
  search?: string
  status?: PropertyStatus
}) {
  try {
    const page = params?.page || 1
    const pageSize = params?.pageSize || 20
    const skip = (page - 1) * pageSize

    const where: Prisma.PropertyWhereInput = {}
    
    if (params?.search) {
      where.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        { city: { contains: params.search, mode: 'insensitive' } },
      ]
    }
    
    if (params?.status) {
      where.status = params.status
    }

    const [properties, totalCount] = await Promise.all([
      prisma.property.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { name: 'asc' },
        include: {
          destination: true,
          photos: {
            where: { isMain: true },
            take: 1,
            select: {
              url: true,
              caption: true
            }
          },
          _count: {
            select: { 
              rooms: true,
              bookings: true,
              photos: true
            }
          }
        }
      }),
      prisma.property.count({ where })
    ])

    return {
      success: true,
      data: properties,
      totalCount,
      pageCount: Math.ceil(totalCount / pageSize)
    }
  } catch (error) {
    // Error handled by returning error response
    return {
      success: false,
      error: 'Failed to fetch properties',
      data: [],
      totalCount: 0,
      pageCount: 0
    }
  }
}

export async function getPropertyById(id: string) {
  try {
    const property = await prisma.property.findUnique({
      where: { id },
      include: {
        destination: true,
        photos: {
          orderBy: { position: 'asc' }
        },
        rooms: {
          orderBy: { createdAt: 'asc' }
        },
        marketingContent: true,
        resources: true
      }
    })

    if (!property) {
      return null
    }

    return property
  } catch (error) {
    // Error handled by returning error response
    return null
  }
}

/**
 * Bulk delete properties
 */
export async function bulkDeleteProperties(
  input: BulkDeletePropertiesInput
): Promise<ActionResult<{ deletedCount: number }>> {
  try {
    await requirePermission(Permission.PROPERTY_EDIT)
    const userId = await getCurrentUserId()
    
    if (!userId) {
      return { success: false, error: 'Unauthorized' }
    }

    const validated = bulkDeletePropertiesSchema.parse(input)

    // Verify properties exist before deletion
    const properties = await prisma.property.findMany({
      where: {
        id: { in: validated.propertyIds }
      },
      select: {
        id: true,
        name: true
      }
    })

    if (properties.length === 0) {
      return { success: false, error: 'No valid properties found to delete' }
    }

    // Delete properties (cascade will handle related records)
    const result = await prisma.property.deleteMany({
      where: {
        id: { in: validated.propertyIds }
      }
    })

    // Log activity
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'BULK_DELETE_PROPERTIES',
        entityType: 'Property',
        entityId: 'BULK',
        changes: {
          propertyIds: validated.propertyIds,
          propertyNames: properties.map(p => p.name),
          count: result.count
        }
      }
    })

    revalidatePath('/houses')
    
    return { success: true, data: { deletedCount: result.count } }
  } catch (error) {
    // Error handled by returning error response
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to bulk delete properties' 
    }
  }
}

