import { NextRequest, NextResponse } from "next/server"
import { generateCSVTemplate } from "@/lib/csv/formatter"

export async function GET(req: NextRequest) {
  try {
    const csv = generateCSVTemplate()
    const filename = "property-import-template.csv"

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    
    return NextResponse.json(
      { error: "Failed to generate template" },
      { status: 500 }
    )
  }
}