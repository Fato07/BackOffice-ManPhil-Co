import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/db"
import Papa from "papaparse"
import { GlobalContactCategory } from "@/generated/prisma"

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
    const category = searchParams.get("category") as GlobalContactCategory | null
    const hasLinkedProperties = searchParams.get("hasLinkedProperties") === "true"

    // Build where clause
    const where: any = {}
    
    if (ids.length > 0) {
      where.id = { in: ids }
    } else {
      // Apply filters if not selecting specific IDs
      if (search) {
        where.OR = [
          { firstName: { contains: search, mode: "insensitive" } },
          { lastName: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
          { phone: { contains: search, mode: "insensitive" } }
        ]
      }
      
      if (category && category !== "ALL") {
        where.category = category
      }
      
      if (hasLinkedProperties) {
        where.contactProperties = {
          some: {}
        }
      }
    }

    // Fetch contacts with related properties
    const contacts = await prisma.contact.findMany({
      where,
      include: {
        contactProperties: {
          include: {
            property: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: [
        { lastName: "asc" },
        { firstName: "asc" },
      ],
    })

    if (format === "json") {
      // Return as JSON with full nested structure
      const filename = `contacts-export-${new Date().toISOString().split("T")[0]}.json`
      
      return new NextResponse(JSON.stringify(contacts, null, 2), {
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      })
    } else if (format === "csv" || format === "excel") {
      // Flatten data for CSV/Excel export
      const flattenedData = contacts.map(contact => ({
        id: contact.id,
        firstName: contact.firstName,
        lastName: contact.lastName,
        email: contact.email || "",
        phone: contact.phone || "",
        category: contact.category,
        language: contact.language || "",
        comments: contact.comments || "",
        linkedProperties: contact.contactProperties
          .map(cp => cp.property.name)
          .join(", "),
        createdAt: contact.createdAt.toISOString(),
        updatedAt: contact.updatedAt.toISOString(),
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
      
      const filename = format === "excel" 
        ? `contacts-export-${new Date().toISOString().split("T")[0]}.xlsx`
        : `contacts-export-${new Date().toISOString().split("T")[0]}.csv`

      return new NextResponse(BOM + csv, {
        headers: {
          "Content-Type": format === "excel" 
            ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            : "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      })
    } else {
      return NextResponse.json({ error: "Invalid format. Use 'csv', 'excel', or 'json'" }, { status: 400 })
    }
  } catch (error) {
    console.error("Error exporting contacts:", error)
    return NextResponse.json(
      { error: "Failed to export contacts" },
      { status: 500 }
    )
  }
}