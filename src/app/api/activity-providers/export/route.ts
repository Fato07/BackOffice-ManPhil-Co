import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/db"
import Papa from "papaparse"

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
    const search = searchParams.get("search")
    const category = searchParams.get("category")
    const tags = searchParams.get("tags")?.split(",").filter(Boolean)
    const hasWebsite = searchParams.get("hasWebsite") === "true"
    const hasPhone = searchParams.get("hasPhone") === "true"
    const hasEmail = searchParams.get("hasEmail") === "true"

    // Build where clause
    const where: any = {}
    
    if (ids.length > 0) {
      where.id = { in: ids }
    } else {
      // Apply filters if not selecting specific IDs
      if (search) {
        where.OR = [
          { name: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
          { tags: { has: search } }
        ]
      }
      
      if (category) {
        where.category = category
      }
      
      if (tags && tags.length > 0) {
        where.tags = { hasSome: tags }
      }
      
      if (hasWebsite) {
        where.website = { not: null }
      }
      
      if (hasPhone) {
        where.phone = { not: null }
      }
      
      if (hasEmail) {
        where.email = { not: null }
      }
    }

    // Fetch activity providers with related properties
    const providers = await prisma.activityProvider.findMany({
      where,
      include: {
        properties: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { name: "asc" },
    })

    if (format === "json") {
      // Return as JSON with full nested structure
      const filename = `activity-providers-${new Date().toISOString().split("T")[0]}.json`
      
      return new NextResponse(JSON.stringify(providers, null, 2), {
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      })
    } else if (format === "csv") {
      // Flatten data for CSV export
      const flattenedData = providers.map(provider => ({
        id: provider.id,
        name: provider.name,
        category: provider.category,
        description: provider.description || "",
        address: provider.address || "",
        city: provider.city || "",
        country: provider.country || "",
        phone: provider.phone || "",
        email: provider.email || "",
        website: provider.website || "",
        tags: provider.tags.join(", "),
        rating: provider.rating || "",
        properties: provider.properties.map(p => p.name).join(", "),
        createdAt: provider.createdAt.toISOString(),
        updatedAt: provider.updatedAt.toISOString(),
      }))

      // Add BOM for Excel UTF-8 compatibility
      const BOM = "\uFEFF"
      const csv = Papa.unparse(flattenedData, {
        header: true,
        delimiter: ",",
        newline: "\r\n",
        quoteChar: '"',
        escapeChar: '"',
        skipEmptyLines: false,
      })
      
      const filename = `activity-providers-${new Date().toISOString().split("T")[0]}.csv`

      return new NextResponse(BOM + csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      })
    } else {
      return NextResponse.json({ error: "Invalid format. Use 'csv' or 'json'" }, { status: 400 })
    }
  } catch (error) {
    console.error("Error exporting activity providers:", error)
    return NextResponse.json(
      { error: "Failed to export activity providers" },
      { status: 500 }
    )
  }
}