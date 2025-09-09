import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/db"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const log = await prisma.auditLog.findUnique({
      where: { id },
    })

    if (!log) {
      return NextResponse.json({ error: "Audit log not found" }, { status: 404 })
    }

    // Get related entity information
    let entityDetails = null
    
    try {
      switch (log.entityType) {
        case "property":
          entityDetails = await prisma.property.findUnique({
            where: { id: log.entityId },
            select: { 
              id: true,
              name: true,
              status: true,
              destination: {
                select: {
                  name: true,
                }
              }
            },
          })
          break
          
        case "room":
          entityDetails = await prisma.room.findUnique({
            where: { id: log.entityId },
            select: { 
              id: true,
              name: true,
              type: true,
              property: { 
                select: { 
                  id: true,
                  name: true 
                } 
              },
            },
          })
          break
          
        case "photo":
          entityDetails = await prisma.photo.findUnique({
            where: { id: log.entityId },
            select: { 
              id: true,
              caption: true,
              url: true,
              property: { 
                select: { 
                  id: true,
                  name: true 
                } 
              },
            },
          })
          break
          
        case "resource":
          entityDetails = await prisma.resource.findUnique({
            where: { id: log.entityId },
            select: { 
              id: true,
              name: true,
              type: true,
              url: true,
              property: { 
                select: { 
                  id: true,
                  name: true 
                } 
              },
            },
          })
          break
      }
    } catch (error) {
      // Entity might be deleted
      entityDetails = null
    }

    return NextResponse.json({
      ...log,
      entityDetails,
    })
  } catch (error) {
    console.error("Error fetching audit log:", error)
    return NextResponse.json(
      { error: "Failed to fetch audit log" },
      { status: 500 }
    )
  }
}