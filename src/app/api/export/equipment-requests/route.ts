import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/db"
import { formatDataForCSV } from "@/lib/csv/formatter"
import { hasPermission } from "@/lib/auth"
import { Permission } from "@/types/auth"
import { Prisma } from "@/generated/prisma"

type EquipmentRequestWithRelations = Prisma.EquipmentRequestGetPayload<{
  include: {
    property: {
      select: {
        id: true
        name: true
        destination: {
          select: {
            id: true
            name: true
            country: true
          }
        }
      }
    }
    room: {
      select: {
        id: true
        name: true
      }
    }
  }
}>

interface EquipmentRequestItem {
  name: string
  quantity: number
  unit: string
  notes?: string
  status?: string
}

export async function GET(req: NextRequest) {
  try {
    const authData = await auth()
    if (!authData?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check permissions
    if (!(await hasPermission(Permission.EQUIPMENT_REQUEST_VIEW))) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    // Get query parameters
    const { searchParams } = new URL(req.url)
    const format = searchParams.get("format") || "csv"
    const ids = searchParams.get("ids")?.split(",").filter(Boolean) || []

    // Build where clause
    const where = ids.length > 0 ? { id: { in: ids } } : undefined

    // Fetch equipment requests with related data
    const equipmentRequests = await prisma.equipmentRequest.findMany({
      where,
      include: {
        property: {
          select: {
            id: true,
            name: true,
            destination: {
              select: {
                id: true,
                name: true,
                country: true,
              },
            },
          },
        },
        room: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    if (format === "json") {
      // Return as JSON with full nested structure
      const filename = `equipment-requests-export-${new Date().toISOString().split("T")[0]}.json`
      
      return new NextResponse(JSON.stringify(equipmentRequests, null, 2), {
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      })
    } else if (format === "csv") {
      // Flatten data for CSV export
      const flattenedData = equipmentRequests.map(flattenEquipmentRequestForExport)
      const csv = formatDataForCSV(flattenedData)
      
      const filename = `equipment-requests-export-${new Date().toISOString().split("T")[0]}.csv`

      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      })
    } else {
      return NextResponse.json({ error: "Invalid format. Use 'csv' or 'json'" }, { status: 400 })
    }
  } catch (error) {
    console.error("Error exporting equipment requests:", error)
    return NextResponse.json(
      { error: "Failed to export equipment requests" },
      { status: 500 }
    )
  }
}

/**
 * Transform nested equipment request data to flat structure for CSV
 */
function flattenEquipmentRequestForExport(request: EquipmentRequestWithRelations): Record<string, string | number> {
  // Parse items from JSON
  const items = (request.items as EquipmentRequestItem[]) || []
  
  return {
    // Basic Information
    id: request.id,
    propertyName: request.property?.name || "",
    propertyId: request.propertyId,
    destinationName: request.property?.destination?.name || "",
    destinationCountry: request.property?.destination?.country || "",
    roomName: request.room?.name || "N/A",
    roomId: request.roomId || "",
    
    // Request Details
    status: request.status,
    priority: request.priority,
    requestedBy: request.requestedBy,
    requestedByEmail: request.requestedByEmail,
    reason: request.reason || "",
    notes: request.notes || "",
    internalNotes: request.internalNotes || "",
    
    // Status History
    approvedBy: request.approvedBy || "",
    approvedByEmail: request.approvedByEmail || "",
    approvedAt: request.approvedAt ? new Date(request.approvedAt).toISOString() : "",
    rejectedReason: request.rejectedReason || "",
    
    // Completion Details
    completedAt: request.completedAt ? new Date(request.completedAt).toISOString() : "",
    
    // Items Summary
    totalItems: items.length,
    itemsList: items.map((item: EquipmentRequestItem) => 
      `${item.name} (${item.quantity} ${item.unit})`
    ).join(" | ") || "",
    
    // Metadata
    createdAt: request.createdAt ? new Date(request.createdAt).toISOString() : "",
    updatedAt: request.updatedAt ? new Date(request.updatedAt).toISOString() : "",
  }
}