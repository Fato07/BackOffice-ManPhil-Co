'use server'

import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { Prisma } from '@/generated/prisma'

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
  } catch (error) {
    console.error('Error fetching activity providers:', error)
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
  } catch (error) {
    console.error('Error fetching activity provider:', error)
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
  } catch (error) {
    console.error('Error creating activity provider:', error)
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
  } catch (error) {
    console.error('Error updating activity provider:', error)
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
  } catch (error) {
    console.error('Error deleting activity provider:', error)
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
  } catch (error) {
    console.error('Error linking provider to property:', error)
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
  } catch (error) {
    console.error('Error unlinking provider from property:', error)
    return { success: false, error: 'Failed to unlink provider from property' }
  }
}