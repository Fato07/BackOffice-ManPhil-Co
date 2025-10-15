import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/db"
import { parseSimpleCSV } from "@/lib/csv/simple-parser"
import { validatePropertyData, validatePropertyRow, getAllFields } from "@/lib/import/validator"

export interface ImportResult {
  success: boolean
  imported: number
  updated: number
  failed: number
  errors: any[]
  warnings: any[]
}

// Note: Pricing, operational costs, and minimum stay rules are now handled
// by separate import dialogs for better UX and maintainability

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
    const parseResult = parseSimpleCSV(content)

    if (!parseResult.success) {
      return NextResponse.json({
        error: "CSV parsing failed",
        details: parseResult.error,
      }, { status: 400 })
    }

    if (parseResult.data.length === 0) {
      return NextResponse.json({ error: "No data found in CSV" }, { status: 400 })
    }

    // Use the parsed data directly (simple approach)
    const transformedData = parseResult.data

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

    // Only block imports if there are no valid rows at all
    const hasValidRows = transformedData.some((_, index) => {
      const { errors } = validatePropertyRow(transformedData[index], index + 2)
      return errors.length === 0
    })
    
    if (!hasValidRows) {
      return NextResponse.json({
        error: "No valid rows to import",
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
        const rawData = transformedData[i]

        // Convert string values to appropriate types for Prisma (create structure for both create and update)
        let propertyData: any = {
          name: String(rawData.name || '').trim(),
          numberOfRooms: rawData.numberOfRooms ? Number(rawData.numberOfRooms) : undefined,
          numberOfBathrooms: rawData.numberOfBathrooms ? Number(rawData.numberOfBathrooms) : undefined,
          maxGuests: rawData.maxGuests ? Number(rawData.maxGuests) : undefined,
          address: rawData.address ? String(rawData.address).trim() : undefined,
          city: rawData.city ? String(rawData.city).trim() : undefined,
          latitude: rawData.latitude ? Number(rawData.latitude) : undefined,
          longitude: rawData.longitude ? Number(rawData.longitude) : undefined,
          status: rawData.status || 'PUBLISHED',
          segment: rawData.segment ? String(rawData.segment).trim() : undefined,
          categories: rawData.categories ? String(rawData.categories).split(',').map(c => c.trim()).filter(Boolean) : [],
        }
        
        // For property creation, we need destination relation
        let destinationId = rawData.destinationId

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

          // Map destination name to ID or auto-create
          if (rawData.destinationName && !destinationId) {
            let destId = destinationMap.get(String(rawData.destinationName).toLowerCase())
            
            if (!destId) {
              // Auto-create missing destination
              try {
                // Normalize destination name
                const normalizedName = String(rawData.destinationName).trim()
                
                // Extract country from common destination names or use a default
                let country = "Unknown"
                const commonCountries = {
                  "mallorca": "Spain", "palma": "Spain", "ibiza": "Spain", "barcelona": "Spain",
                  "marbella": "Spain", "valencia": "Spain", "madrid": "Spain", "seville": "Spain",
                  "cannes": "France", "nice": "France", "paris": "France", "monaco": "Monaco",
                  "london": "United Kingdom", "edinburgh": "United Kingdom", "dublin": "Ireland",
                  "rome": "Italy", "florence": "Italy", "venice": "Italy", "milan": "Italy",
                  "athens": "Greece", "mykonos": "Greece", "santorini": "Greece", "crete": "Greece",
                  "lisbon": "Portugal", "porto": "Portugal", "algarve": "Portugal"
                }
                
                const lowerName = normalizedName.toLowerCase()
                for (const [city, countryName] of Object.entries(commonCountries)) {
                  if (lowerName.includes(city)) {
                    country = countryName
                    break
                  }
                }
                
                const newDestination = await tx.destination.create({
                  data: {
                    name: normalizedName,
                    country: country,
                  }
                })
                
                destId = newDestination.id
                // Update cache to prevent duplicates within same import
                destinationMap.set(String(rawData.destinationName).toLowerCase(), destId)
                
                // Add audit log for created destination
                await tx.auditLog.create({
                  data: {
                    action: "create",
                    entityType: "destination",
                    entityId: newDestination.id,
                    userId,
                    changes: {
                      name: normalizedName,
                      country: country,
                      autoCreated: true,
                      createdDuringImport: true,
                    },
                  },
                })
                
                result.warnings.push({
                  row: rowNumber,
                  field: "destinationName",
                  message: `Auto-created destination: "${normalizedName}" (${country})`,
                })
              } catch (createError: any) {
                result.errors.push({
                  row: rowNumber,
                  message: `Failed to create destination "${rawData.destinationName}": ${createError.message}`,
                })
                result.failed++
                continue
              }
            }
            
            destinationId = destId
          }

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
            const updateData = {
              ...propertyData,
              ...(destinationId && { destination: { connect: { id: destinationId } } }),
            }
            
            const updated = await tx.property.update({
              where: { id: existingId },
              data: updateData,
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

            // Note: Pricing data now handled by separate import dialogs

            result.updated++
          } else {
            // Create new property
            const created = await tx.property.create({
              data: {
                ...propertyData,
                destination: destinationId ? { connect: { id: destinationId } } : undefined,
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

            // Note: Pricing data now handled by separate import dialogs

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
    console.error("Import failed:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    console.error("Error details:", errorMessage)
    
    return NextResponse.json(
      { error: "Failed to import properties", details: errorMessage },
      { status: 500 }
    )
  }
}