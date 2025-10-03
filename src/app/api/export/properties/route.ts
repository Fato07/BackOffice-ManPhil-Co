import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/db"
import { formatDataForCSV, flattenPropertyForExport } from "@/lib/csv/formatter"

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get query parameters
    const { searchParams } = new URL(req.url)
    const format = searchParams.get("format") || "csv"
    const ids = searchParams.get("ids")?.split(",").filter(Boolean) || []

    // Build where clause
    const where = ids.length > 0 ? { id: { in: ids } } : undefined

    // Fetch properties with related data
    const properties = await prisma.property.findMany({
      where,
      include: {
        destination: true,
        rooms: {
          orderBy: { position: "asc" },
        },
        photos: {
          select: {
            id: true,
            url: true,
            caption: true,
            position: true,
            category: true,
            isMain: true,
          },
          orderBy: { position: "asc" },
        },
        resources: {
          select: {
            id: true,
            name: true,
            type: true,
            url: true,
          },
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { name: "asc" },
    })

    if (format === "json") {
      // Return as JSON with full nested structure
      const filename = `properties-export-${new Date().toISOString().split("T")[0]}.json`
      
      return new NextResponse(JSON.stringify(properties, null, 2), {
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      })
    } else if (format === "csv") {
      // Flatten data for CSV export
      const flattenedData = properties.map(flattenPropertyForExport)
      const csv = formatDataForCSV(flattenedData)
      
      const filename = `properties-export-${new Date().toISOString().split("T")[0]}.csv`

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
    
    return NextResponse.json(
      { error: "Failed to export properties" },
      { status: 500 }
    )
  }
}