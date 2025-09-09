import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/db"
import { z } from "zod"

// Query schema for audit logs
const querySchema = z.object({
  page: z.string().optional().transform(val => parseInt(val || "1")),
  limit: z.string().optional().transform(val => parseInt(val || "20")),
  userId: z.string().optional(),
  entityType: z.string().optional(),
  entityId: z.string().optional(),
  action: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  search: z.string().optional(),
})

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Parse query parameters
    const { searchParams } = new URL(req.url)
    const params = Object.fromEntries(searchParams.entries())
    
    const query = querySchema.parse(params)
    const { page, limit, ...filters } = query

    // Build where clause
    const where: any = {}
    
    if (filters.userId) {
      where.userId = filters.userId
    }
    
    if (filters.entityType) {
      where.entityType = filters.entityType
    }
    
    if (filters.entityId) {
      where.entityId = filters.entityId
    }
    
    if (filters.action) {
      where.action = filters.action
    }
    
    if (filters.startDate || filters.endDate) {
      where.createdAt = {}
      if (filters.startDate) {
        where.createdAt.gte = new Date(filters.startDate)
      }
      if (filters.endDate) {
        where.createdAt.lte = new Date(filters.endDate)
      }
    }
    
    if (filters.search) {
      where.OR = [
        { entityType: { contains: filters.search, mode: 'insensitive' } },
        { action: { contains: filters.search, mode: 'insensitive' } },
        { entityId: { contains: filters.search, mode: 'insensitive' } },
      ]
    }

    // Execute queries
    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ])

    // Get related entity names
    const enrichedLogs = await Promise.all(
      logs.map(async (log) => {
        let entityName = log.entityId
        
        try {
          switch (log.entityType) {
            case "property":
              const property = await prisma.property.findUnique({
                where: { id: log.entityId },
                select: { name: true },
              })
              entityName = property?.name || log.entityId
              break
              
            case "room":
              const room = await prisma.room.findUnique({
                where: { id: log.entityId },
                select: { name: true, property: { select: { name: true } } },
              })
              entityName = room ? `${room.name} (${room.property.name})` : log.entityId
              break
              
            case "photo":
              const photo = await prisma.photo.findUnique({
                where: { id: log.entityId },
                select: { caption: true, property: { select: { name: true } } },
              })
              entityName = photo ? `${photo.caption || "Photo"} (${photo.property.name})` : log.entityId
              break
              
            case "resource":
              const resource = await prisma.resource.findUnique({
                where: { id: log.entityId },
                select: { name: true, type: true, property: { select: { name: true } } },
              })
              entityName = resource ? `${resource.name} (${resource.property.name})` : log.entityId
              break
          }
        } catch (error) {
          // Entity might be deleted
          entityName = `${log.entityId} (deleted)`
        }
        
        return {
          ...log,
          entityName,
        }
      })
    )

    return NextResponse.json({
      data: enrichedLogs,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error("Error fetching audit logs:", error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    
    return NextResponse.json(
      { error: "Failed to fetch audit logs" },
      { status: 500 }
    )
  }
}