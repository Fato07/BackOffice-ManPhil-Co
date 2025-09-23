import { prisma } from "@/lib/db"
import { Prisma, PropertyStatus } from "@/generated/prisma"

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
    console.error('Error fetching properties:', error)
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
    console.error("Error fetching property:", error)
    return null
  }
}

