import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/db"
import { parseCSV } from "@/lib/csv/parser"
import { transformCSVRowToProperty } from "@/lib/csv/parser"
import { validatePropertyData } from "@/lib/import/validator"
import { autoMapFields, applyFieldMappings } from "@/lib/import/field-mapper"
import { getAllFields } from "@/lib/import/validator"

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get("file") as File
    const mappingsJson = formData.get("mappings") as string // Optional custom field mappings

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File size exceeds 10MB limit" }, { status: 400 })
    }

    // Read and parse CSV
    const content = await file.text()
    const parseResult = await parseCSV(content)

    if (parseResult.errors.length > 0) {
      return NextResponse.json({
        error: "CSV parsing failed",
        details: parseResult.errors,
      }, { status: 400 })
    }

    if (parseResult.data.length === 0) {
      return NextResponse.json({ error: "No data found in CSV" }, { status: 400 })
    }

    // Get field mapping suggestions
    const autoMapping = autoMapFields(parseResult.meta.fields || [], getAllFields())

    // Apply field mappings if provided
    let mappedData = parseResult.data
    let finalMappings = autoMapping.mappings
    
    if (mappingsJson) {
      try {
        finalMappings = JSON.parse(mappingsJson)
        mappedData = applyFieldMappings(parseResult.data, finalMappings)
      } catch (error) {
        // Fallback to auto-mapping
        mappedData = applyFieldMappings(parseResult.data, autoMapping.mappings)
      }
    } else {
      mappedData = applyFieldMappings(parseResult.data, autoMapping.mappings)
    }

    // Transform CSV data to property format
    const transformedData = mappedData.map(transformCSVRowToProperty)

    // Get existing property names for duplicate checking
    const existingProperties = await prisma.property.findMany({
      select: { name: true },
    })

    // Validate data
    const validation = validatePropertyData(
      transformedData,
      existingProperties.map(p => p.name)
    )

    // Get destinations for validation
    const destinations = await prisma.destination.findMany({
      select: { id: true, name: true },
    })

    // Prepare preview data (first 10 rows)
    const preview = transformedData.slice(0, 10).map((data, index) => ({
      row: index + 2,
      data,
      valid: !validation.errors.some(e => e.row === index + 2),
      errors: validation.errors.filter(e => e.row === index + 2),
      warnings: validation.warnings.filter(w => w.row === index + 2),
    }))

    return NextResponse.json({
      totalRows: parseResult.data.length,
      headers: parseResult.meta.fields || [],
      fieldMapping: {
        mappings: finalMappings,
        suggestions: autoMapping,
      },
      validation: {
        valid: validation.valid,
        errors: validation.errors.slice(0, 100), // Limit errors for performance
        warnings: validation.warnings.slice(0, 100),
        errorCount: validation.errors.length,
        warningCount: validation.warnings.length,
      },
      preview,
      availableDestinations: destinations,
    })
  } catch (error) {
    console.error("Error validating import:", error)
    return NextResponse.json(
      { error: "Failed to validate import" },
      { status: 500 }
    )
  }
}