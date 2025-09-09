import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/db"
import { parseCSV } from "@/lib/csv/parser"
import { transformCSVRowToProperty } from "@/lib/csv/parser"
import { validatePropertyData } from "@/lib/import/validator"
import { autoMapFields, applyFieldMappings } from "@/lib/import/field-mapper"
import { getAllFields } from "@/lib/import/validator"

export interface ImportResult {
  success: boolean
  imported: number
  updated: number
  failed: number
  errors: any[]
  warnings: any[]
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get("file") as File
    const mode = formData.get("mode") as string || "create" // create, update, or both
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

    // Apply field mappings
    let mappedData = parseResult.data
    if (mappingsJson) {
      try {
        const mappings = JSON.parse(mappingsJson)
        mappedData = applyFieldMappings(parseResult.data, mappings)
      } catch (error) {
        // If custom mappings fail, try auto-mapping
        const autoMapping = autoMapFields(parseResult.meta.fields || [], getAllFields())
        mappedData = applyFieldMappings(parseResult.data, autoMapping.mappings)
      }
    } else {
      // Auto-map fields
      const autoMapping = autoMapFields(parseResult.meta.fields || [], getAllFields())
      mappedData = applyFieldMappings(parseResult.data, autoMapping.mappings)
    }

    // Transform CSV data to property format
    const transformedData = mappedData.map(transformCSVRowToProperty)

    // Get existing property names for duplicate checking
    const existingProperties = await prisma.property.findMany({
      select: { id: true, name: true },
    })
    const existingPropertyMap = new Map(
      existingProperties.map(p => [p.name.toLowerCase(), p.id])
    )

    // Validate data
    const validation = validatePropertyData(
      transformedData,
      existingProperties.map(p => p.name)
    )

    if (!validation.valid && validation.errors.length > 0) {
      return NextResponse.json({
        error: "Validation failed",
        details: {
          errors: validation.errors,
          warnings: validation.warnings,
        },
      }, { status: 400 })
    }

    // Get destinations for mapping
    const destinations = await prisma.destination.findMany({
      select: { id: true, name: true },
    })
    const destinationMap = new Map(
      destinations.map(d => [d.name.toLowerCase(), d.id])
    )

    // Process imports
    const result: ImportResult = {
      success: true,
      imported: 0,
      updated: 0,
      failed: 0,
      errors: [],
      warnings: validation.warnings,
    }

    // Use transaction for atomic import
    await prisma.$transaction(async (tx) => {
      for (let i = 0; i < transformedData.length; i++) {
        const rowNumber = i + 2 // Account for header row
        const propertyData = transformedData[i]

        try {
          // Skip if no name
          if (!propertyData.name) {
            result.errors.push({
              row: rowNumber,
              message: "Property name is required",
            })
            result.failed++
            continue
          }

          // Map destination name to ID
          if (propertyData.destinationName && !propertyData.destinationId) {
            const destId = destinationMap.get(propertyData.destinationName.toLowerCase())
            if (destId) {
              propertyData.destinationId = destId
            } else {
              result.warnings.push({
                row: rowNumber,
                field: "destinationName",
                message: `Destination "${propertyData.destinationName}" not found`,
              })
            }
          }

          // Remove fields that aren't in the database schema
          delete propertyData.destinationName
          delete propertyData.roomCount
          delete propertyData.totalEquipment
          delete propertyData.photoCount
          delete propertyData.resourceCount

          const existingId = existingPropertyMap.get(propertyData.name.toLowerCase())

          if (existingId && mode === "create") {
            // Skip if property exists and mode is create only
            result.errors.push({
              row: rowNumber,
              message: `Property "${propertyData.name}" already exists`,
            })
            result.failed++
            continue
          }

          if (!existingId && mode === "update") {
            // Skip if property doesn't exist and mode is update only
            result.errors.push({
              row: rowNumber,
              message: `Property "${propertyData.name}" not found for update`,
            })
            result.failed++
            continue
          }

          if (existingId && (mode === "update" || mode === "both")) {
            // Update existing property
            const updated = await tx.property.update({
              where: { id: existingId },
              data: {
                ...propertyData,
                updatedBy: userId,
              },
            })

            await tx.auditLog.create({
              data: {
                action: "update",
                entityType: "property",
                entityId: updated.id,
                userId,
                changes: propertyData,
              },
            })

            result.updated++
          } else {
            // Create new property
            const created = await tx.property.create({
              data: {
                ...propertyData,
                createdBy: userId,
                updatedBy: userId,
              },
            })

            await tx.auditLog.create({
              data: {
                action: "create",
                entityType: "property",
                entityId: created.id,
                userId,
                changes: created,
              },
            })

            result.imported++
          }
        } catch (error: any) {
          result.errors.push({
            row: rowNumber,
            message: error.message || "Import failed for this row",
          })
          result.failed++
        }
      }
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error importing properties:", error)
    return NextResponse.json(
      { error: "Failed to import properties" },
      { status: 500 }
    )
  }
}