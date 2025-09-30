"use server"

import { prisma } from "@/lib/db"
import { PropertyStatus } from "@/generated/prisma"
import { PropertyFilters } from "@/types/property"

interface SearchOptions {
  search?: string
  filters?: PropertyFilters
  page?: number
  pageSize?: number
}

/**
 * Advanced property search using PostgreSQL full-text search
 * Leverages trigram indexes for fuzzy matching and better performance
 */
export async function searchProperties({
  search,
  filters,
  page = 1,
  pageSize = 20,
}: SearchOptions) {
  try {
    // If no search term, fall back to regular filtering
    if (!search || search.trim().length === 0) {
      return searchPropertiesWithFilters({ filters, page, pageSize })
    }

    const searchTerm = search.trim()
    const offset = (page - 1) * pageSize

    // Use raw SQL for advanced full-text search with trigram similarity
    const properties = await prisma.$queryRaw`
      SELECT 
        p.*,
        GREATEST(
          similarity(p.name, ${searchTerm}),
          similarity(COALESCE(p."originalName", ''), ${searchTerm}),
          similarity(COALESCE(p.address, ''), ${searchTerm}),
          similarity(COALESCE(p.city, ''), ${searchTerm})
        ) as search_score
      FROM "Property" p
      WHERE 
        (
          p.name ILIKE ${`%${searchTerm}%`} OR
          p."originalName" ILIKE ${`%${searchTerm}%`} OR
          p.address ILIKE ${`%${searchTerm}%`} OR
          p.city ILIKE ${`%${searchTerm}%`} OR
          similarity(p.name, ${searchTerm}) > 0.1 OR
          similarity(COALESCE(p."originalName", ''), ${searchTerm}) > 0.1 OR
          similarity(COALESCE(p.address, ''), ${searchTerm}) > 0.1 OR
          similarity(COALESCE(p.city, ''), ${searchTerm}) > 0.1
        )
        ${filters?.status && filters.status !== 'ALL' ? prisma.$queryRaw`AND p.status = ${filters.status}` : prisma.$queryRaw``}
        ${filters?.destinationId ? prisma.$queryRaw`AND p."destinationId" = ${filters.destinationId}` : prisma.$queryRaw``}
      ORDER BY search_score DESC, p."createdAt" DESC
      LIMIT ${pageSize}
      OFFSET ${offset}
    `

    // Get total count for pagination
    const countResult = await prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*) as count
      FROM "Property" p
      WHERE 
        (
          p.name ILIKE ${`%${searchTerm}%`} OR
          p."originalName" ILIKE ${`%${searchTerm}%`} OR
          p.address ILIKE ${`%${searchTerm}%`} OR
          p.city ILIKE ${`%${searchTerm}%`} OR
          similarity(p.name, ${searchTerm}) > 0.1 OR
          similarity(COALESCE(p."originalName", ''), ${searchTerm}) > 0.1 OR
          similarity(COALESCE(p.address, ''), ${searchTerm}) > 0.1 OR
          similarity(COALESCE(p.city, ''), ${searchTerm}) > 0.1
        )
        ${filters?.status && filters.status !== 'ALL' ? prisma.$queryRaw`AND p.status = ${filters.status}` : prisma.$queryRaw``}
        ${filters?.destinationId ? prisma.$queryRaw`AND p."destinationId" = ${filters.destinationId}` : prisma.$queryRaw``}
    `

    const total = Number(countResult[0].count)
    const totalPages = Math.ceil(total / pageSize)

    return {
      success: true,
      data: properties,
      total,
      page,
      pageSize,
      totalPages,
    }
  } catch (error) {
    console.error("Property search error:", error)
    return {
      success: false,
      error: "Failed to search properties",
      data: [],
      total: 0,
      page,
      pageSize,
      totalPages: 0,
    }
  }
}

/**
 * Standard property search with filters (no full-text search)
 */
async function searchPropertiesWithFilters({
  filters,
  page = 1,
  pageSize = 20,
}: Omit<SearchOptions, 'search'>) {
  try {
    const where: any = {}

    // Apply filters
    if (filters?.status && filters.status !== "ALL") {
      where.status = filters.status as PropertyStatus
    }

    if (filters?.destinationId) {
      where.destinationId = filters.destinationId
    }

    if (filters?.minRooms !== undefined || filters?.maxRooms !== undefined) {
      where.numberOfRooms = {}
      if (filters.minRooms !== undefined) {
        where.numberOfRooms.gte = filters.minRooms
      }
      if (filters.maxRooms !== undefined) {
        where.numberOfRooms.lte = filters.maxRooms
      }
    }

    // Add other filters as needed...

    const [properties, total] = await Promise.all([
      prisma.property.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          destination: {
            select: {
              id: true,
              name: true,
              country: true,
            }
          },
          photos: {
            where: { isMain: true },
            take: 1,
            select: {
              url: true,
              caption: true
            }
          }
        }
      }),
      prisma.property.count({ where })
    ])

    const totalPages = Math.ceil(total / pageSize)

    return {
      success: true,
      data: properties,
      total,
      page,
      pageSize,
      totalPages,
    }
  } catch (error) {
    console.error("Property filter error:", error)
    return {
      success: false,
      error: "Failed to filter properties",
      data: [],
      total: 0,
      page,
      pageSize,
      totalPages: 0,
    }
  }
}