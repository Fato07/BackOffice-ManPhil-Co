'use server'

import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { Prisma } from '@/generated/prisma'
import { auth } from '@clerk/nextjs/server'
import { requirePermission } from '@/lib/auth'
import { Permission } from '@/types/auth'
import { z } from 'zod'
import { bulkDeleteProvidersSchema, type BulkDeleteProvidersData } from '@/lib/validations/activity-provider'

export async function getActivityProviders(params?: {
  page?: number
  pageSize?: number
  search?: string
  type?: string
}) {
  try {
    const page = params?.page || 1
    const pageSize = params?.pageSize || 10
    const skip = (page - 1) * pageSize

    const where: Prisma.ActivityProviderWhereInput = {}
    
    if (params?.search) {
      where.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        { address: { contains: params.search, mode: 'insensitive' } },
      ]
    }
    
    if (params?.type && params.type !== 'ALL') {
      where.type = params.type
    }

    const [providers, totalCount] = await Promise.all([
      prisma.activityProvider.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { name: 'asc' },
        include: {
          _count: {
            select: { properties: true }
          }
        }
      }),
      prisma.activityProvider.count({ where })
    ])

    return {
      success: true,
      data: providers,
      totalCount,
      pageCount: Math.ceil(totalCount / pageSize)
    }
  } catch (_error) {
    // Error handled by returning error response
    return {
      success: false,
      error: 'Failed to fetch activity providers'
    }
  }
}

export async function getActivityProvider(id: string) {
  try {
    const provider = await prisma.activityProvider.findUnique({
      where: { id },
      include: {
        properties: true,
        _count: {
          select: { properties: true }
        }
      }
    })

    if (!provider) {
      return { success: false, error: 'Activity provider not found' }
    }

    return { success: true, data: provider }
  } catch (_error) {
    // Error handled by returning error response
    return { success: false, error: 'Failed to fetch activity provider' }
  }
}

export async function createActivityProvider(data: {
  name: string
  type: string
  address: string
  phone?: string
  email?: string
  website?: string
  latitude?: number
  longitude?: number
  comments?: string
}) {
  try {
    const provider = await prisma.activityProvider.create({
      data: {
        ...data,
        type: data.type
      },
      include: {
        _count: {
          select: { properties: true }
        }
      }
    })

    revalidatePath('/places')
    return { success: true, data: provider }
  } catch (_error) {
    // Error handled by returning error response
    return { success: false, error: 'Failed to create activity provider' }
  }
}

export async function updateActivityProvider(id: string, data: {
  name?: string
  type?: string
  address?: string
  phone?: string
  email?: string
  website?: string
  latitude?: number
  longitude?: number
  comments?: string
}) {
  try {
    const updateData: Prisma.ActivityProviderUpdateInput = { ...data }
    if (data.type) {
      updateData.type = data.type
    }
    
    const provider = await prisma.activityProvider.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: { properties: true }
        }
      }
    })

    revalidatePath('/places')
    return { success: true, data: provider }
  } catch (_error) {
    // Error handled by returning error response
    return { success: false, error: 'Failed to update activity provider' }
  }
}

export async function deleteActivityProvider(id: string) {
  try {
    await prisma.activityProvider.delete({
      where: { id }
    })

    revalidatePath('/places')
    return { success: true }
  } catch (_error) {
    // Error handled by returning error response
    return { success: false, error: 'Failed to delete activity provider' }
  }
}

export async function linkProviderToProperty(providerId: string, propertyId: string) {
  try {
    const provider = await prisma.activityProvider.update({
      where: { id: providerId },
      data: {
        properties: {
          connect: { id: propertyId }
        }
      },
      include: {
        _count: {
          select: { properties: true }
        }
      }
    })

    revalidatePath('/places')
    return { success: true, data: provider }
  } catch (_error) {
    // Error handled by returning error response
    return { success: false, error: 'Failed to link provider to property' }
  }
}

export async function unlinkProviderFromProperty(providerId: string, propertyId: string) {
  try {
    const provider = await prisma.activityProvider.update({
      where: { id: providerId },
      data: {
        properties: {
          disconnect: { id: propertyId }
        }
      },
      include: {
        _count: {
          select: { properties: true }
        }
      }
    })

    revalidatePath('/places')
    return { success: true, data: provider }
  } catch (_error) {
    // Error handled by returning error response
    return { success: false, error: 'Failed to unlink provider from property' }
  }
}

export async function bulkDeleteActivityProviders(input: BulkDeleteProvidersData) {
  try {
    // Authentication check
    const { userId } = await auth()
    if (!userId) {
      return { success: false, error: 'Unauthorized' }
    }

    // Permission check
    const hasPermission = await requirePermission(Permission.ACTIVITY_PROVIDER_DELETE)
    if (!hasPermission) {
      return { success: false, error: 'You do not have permission to delete activity providers' }
    }

    // Validate input
    const validated = bulkDeleteProvidersSchema.parse(input)
    const { providerIds } = validated

    // Get providers for audit log
    const providers = await prisma.activityProvider.findMany({
      where: { id: { in: providerIds } }
    })

    // Delete providers in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Delete providers
      const deleteResult = await tx.activityProvider.deleteMany({
        where: { id: { in: providerIds } }
      })

      // Create audit log entry
      await tx.auditLog.create({
        data: {
          userId,
          action: 'bulk_delete',
          entityType: 'activity_provider',
          entityId: 'bulk',
          changes: {
            before: providers,
            summary: `Bulk deleted ${deleteResult.count} activity providers`
          },
        },
      })

      return deleteResult
    })

    // Revalidate the places page
    revalidatePath('/places')

    return {
      success: true,
      data: { deletedCount: result.count },
    }
  } catch (_error) {
    if (_error instanceof z.ZodError) {
      const firstError = _error.issues[0]
      return {
        success: false,
        error: `Validation error: ${firstError.path.join('.')} - ${firstError.message}`,
      }
    }

    if (_error instanceof Error) {
      return {
        success: false,
        error: _error.message,
      }
    }

    return {
      success: false,
      error: 'An unexpected error occurred while deleting activity providers',
    }
  }
}