import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/db"
import { parseSimpleCSV, convertValue } from "@/lib/csv/simple-parser"

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
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

    // Process the data
    const result = await processImportData(parseResult.data, userId)

    return NextResponse.json(result)
  } catch (error) {
    console.error("Import error:", error)
    return NextResponse.json(
      { error: "Failed to process import" },
      { status: 500 }
    )
  }
}

async function processImportData(rows: Record<string, string>[], userId: string) {
  const result = {
    success: true,
    imported: {
      properties: 0,
      pricing: 0,
      costs: 0,
      bookings: 0,
      availabilityRequests: 0,
    },
    errors: [] as string[],
    debug: {
      totalRows: rows.length,
      rowsWithAvailabilityRequests: [] as any[],
      availabilityRequestAttempts: [] as any[],
      csvHeaders: [] as string[],
      availabilityRequestColumns: {} as Record<string, boolean>,
    },
  }

  // Add CSV structure debugging and validation
  if (rows.length > 0) {
    const firstRow = rows[0]
    result.debug.csvHeaders = Object.keys(firstRow)
    const expectedColumnCount = result.debug.csvHeaders.length
    
    // Check for AvailabilityRequest columns
    const requiredAvailabilityColumns = [
      'requestStartDate', 'requestEndDate', 'requestGuestName', 
      'requestGuestEmail', 'requestGuestPhone', 'requestNumberOfGuests',
      'requestMessage', 'requestStatus', 'requestUrgency'
    ]
    
    requiredAvailabilityColumns.forEach(col => {
      result.debug.availabilityRequestColumns[col] = col in firstRow
    })
    
    // Validate CSV structure consistency
    const inconsistentRows: any[] = []
    rows.forEach((row, index) => {
      const rowColumnCount = Object.keys(row).length
      if (rowColumnCount !== expectedColumnCount) {
        inconsistentRows.push({
          rowNumber: index + 2, // +2 for header and 0-based index
          expected: expectedColumnCount,
          actual: rowColumnCount,
          missing: expectedColumnCount - rowColumnCount,
          propertyName: row.propertyName || 'Unknown'
        })
      }
    })
    
    if (inconsistentRows.length > 0) {
      console.error('CSV Column Count Inconsistencies Detected:', inconsistentRows)
      result.errors.push(`CSV structure error: ${inconsistentRows.length} rows have incorrect column counts. Expected ${expectedColumnCount} columns.`)
    }
    
    // Log debugging information
    console.log('CSV Headers detected:', result.debug.csvHeaders)
    console.log('Expected column count:', expectedColumnCount)
    console.log('AvailabilityRequest column presence:', result.debug.availabilityRequestColumns)
    console.log('CSV inconsistencies:', inconsistentRows)
    
    // Find a row with AvailabilityRequest data for detailed debugging
    const arRow = rows.find(row => hasAvailabilityRequestData(row))
    if (arRow) {
      console.log('AvailabilityRequest row raw data:', {
        rowColumnCount: Object.keys(arRow).length,
        expectedCount: expectedColumnCount,
        requestStartDate: arRow.requestStartDate,
        requestEndDate: arRow.requestEndDate,  
        requestGuestName: arRow.requestGuestName,
        requestGuestEmail: arRow.requestGuestEmail,
        requestGuestPhone: arRow.requestGuestPhone,
        requestNumberOfGuests: arRow.requestNumberOfGuests,
        requestMessage: arRow.requestMessage,
        requestStatus: arRow.requestStatus,
        requestUrgency: arRow.requestUrgency
      })
    }
  }

  await prisma.$transaction(async (tx) => {
    // First pass: Create destinations and get property map
    const destinationMap = new Map<string, string>()
    const propertyMap = new Map<string, string>()

    // Get existing destinations
    const existingDestinations = await tx.destination.findMany({
      select: { id: true, name: true }
    })
    existingDestinations.forEach(d => destinationMap.set(d.name.toLowerCase(), d.id))

    // Get existing properties
    const existingProperties = await tx.property.findMany({
      select: { id: true, name: true }
    })
    existingProperties.forEach(p => propertyMap.set(p.name.toLowerCase(), p.id))

    // Process each row
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const rowNum = i + 2

      try {
        // Validate property name
        if (!row.propertyName || !row.propertyName.trim()) {
          result.errors.push(`Row ${rowNum}: Property name is required`)
          continue
        }

        const propertyName = row.propertyName.trim()
        const propertyKey = propertyName.toLowerCase()

        // Create destination if needed
        let destinationId: string | null = null
        if (row.destinationName && row.destinationName.trim()) {
          const destName = row.destinationName.trim()
          const destKey = destName.toLowerCase()
          
          if (!destinationMap.has(destKey)) {
            const newDestination = await tx.destination.create({
              data: {
                name: destName,
                country: "Unknown", // Default country
              }
            })
            destinationMap.set(destKey, newDestination.id)
          }
          destinationId = destinationMap.get(destKey) || null
        }

        // Create or get property
        if (!propertyMap.has(propertyKey) && hasPropertyData(row)) {
          // Create a default destination if none provided
          if (!destinationId) {
            const defaultDest = await tx.destination.create({
              data: {
                name: "Unknown",
                country: "Unknown",
              }
            })
            destinationId = defaultDest.id
            destinationMap.set("unknown", destinationId)
          }

          const propertyData = {
            name: propertyName,
            destinationId: destinationId,
            numberOfRooms: convertValue(row.numberOfRooms, 'number') as number || undefined,
            numberOfBathrooms: convertValue(row.numberOfBathrooms, 'number') as number || undefined,
            maxGuests: convertValue(row.maxGuests, 'number') as number || undefined,
            address: convertValue(row.address, 'string') as string || undefined,
            city: convertValue(row.city, 'string') as string || undefined,
            latitude: convertValue(row.latitude, 'number') as number || undefined,
            longitude: convertValue(row.longitude, 'number') as number || undefined,
            status: (row.status as any) || "HIDDEN",
            segment: convertValue(row.segment, 'string') as string || undefined,
            categories: row.categories ? row.categories.split(',').map(c => c.trim()) : [],
          }

          const newProperty = await tx.property.create({ data: propertyData })
          propertyMap.set(propertyKey, newProperty.id)
          result.imported.properties++
        }

        const propertyId = propertyMap.get(propertyKey)
        if (!propertyId) continue

        // Create pricing if data exists
        if (hasPricingData(row)) {
          const startDate = convertValue(row.priceStartDate, 'date') as Date
          const endDate = convertValue(row.priceEndDate, 'date') as Date

          if (startDate && endDate && startDate < endDate) {
            await tx.priceRange.create({
              data: {
                propertyId,
                name: row.periodName || `Period ${rowNum}`,
                startDate,
                endDate,
                ownerNightlyRate: convertValue(row.ownerNightlyRate, 'number') as number || undefined,
                ownerWeeklyRate: convertValue(row.ownerWeeklyRate, 'number') as number || undefined,
                isValidated: false,
              }
            })
            result.imported.pricing++
          }
        }

        // Create cost if data exists
        if (hasCostData(row)) {
          await tx.operationalCost.create({
            data: {
              propertyId,
              costType: (row.costType as any) || "HOUSEKEEPING",
              estimatedPrice: convertValue(row.costEstimatedPrice, 'number') as number || undefined,
              priceType: "PER_STAY",
            }
          })
          result.imported.costs++
        }

        // Create booking if data exists
        if (hasBookingData(row)) {
          const startDate = convertValue(row.bookingStartDate, 'date') as Date
          const endDate = convertValue(row.bookingEndDate, 'date') as Date

          if (startDate && endDate && startDate < endDate) {
            await tx.booking.create({
              data: {
                propertyId,
                type: (row.bookingType as any) || "CONFIRMED",
                status: "CONFIRMED",
                source: "IMPORT",
                startDate,
                endDate,
                guestName: convertValue(row.guestName, 'string') as string || undefined,
                guestEmail: convertValue(row.guestEmail, 'string') as string || undefined,
                createdBy: userId,
              }
            })
            result.imported.bookings++
          }
        }

        // Create availability request if data exists
        if (hasAvailabilityRequestData(row)) {
          // Add to debug tracking
          result.debug.rowsWithAvailabilityRequests.push({
            rowNum,
            propertyName: propertyName,
            requestStartDate: row.requestStartDate,
            requestEndDate: row.requestEndDate,
            requestGuestName: row.requestGuestName,
            requestGuestEmail: row.requestGuestEmail
          })

          try {
            // Add detailed logging for date conversion debugging
            console.log(`Row ${rowNum} - Raw AvailabilityRequest data:`, {
              requestStartDate: row.requestStartDate,
              requestEndDate: row.requestEndDate,
              requestGuestName: row.requestGuestName,
              requestGuestEmail: row.requestGuestEmail,
              requestGuestPhone: row.requestGuestPhone,
              requestNumberOfGuests: row.requestNumberOfGuests,
              requestMessage: row.requestMessage,
              requestStatus: row.requestStatus,
              requestUrgency: row.requestUrgency
            })
            
            const startDate = convertValue(row.requestStartDate, 'date') as Date
            const endDate = convertValue(row.requestEndDate, 'date') as Date
            const numberOfGuests = convertValue(row.requestNumberOfGuests, 'number') as number
            
            console.log(`Row ${rowNum} - Converted values:`, {
              startDate,
              endDate,
              numberOfGuests,
              startDateValid: startDate instanceof Date && !isNaN(startDate.getTime()),
              endDateValid: endDate instanceof Date && !isNaN(endDate.getTime())
            })

            // Validate and normalize enum values
            const validStatuses = ['PENDING', 'CONFIRMED', 'REJECTED']
            const validUrgencies = ['LOW', 'MEDIUM', 'HIGH']
            
            // Map common variations and validate status
            let status = 'PENDING' // default
            if (row.requestStatus) {
              const statusUpper = row.requestStatus.toUpperCase().trim()
              if (validStatuses.includes(statusUpper)) {
                status = statusUpper
              }
            }
            
            // Map common variations and validate urgency
            let urgency = 'MEDIUM' // default
            if (row.requestUrgency) {
              const urgencyUpper = row.requestUrgency.toUpperCase().trim()
              if (validUrgencies.includes(urgencyUpper)) {
                urgency = urgencyUpper
              } else if (urgencyUpper === 'URGENT') {
                urgency = 'HIGH' // Map URGENT → HIGH
              }
            }

            const debugInfo = {
              rowNum,
              propertyName,
              propertyId,
              rawData: {
                requestStartDate: row.requestStartDate,
                requestEndDate: row.requestEndDate,
                requestGuestName: row.requestGuestName,
                requestGuestEmail: row.requestGuestEmail,
                requestGuestPhone: row.requestGuestPhone,
                requestNumberOfGuests: row.requestNumberOfGuests
              },
              convertedData: {
                startDate,
                endDate,
                numberOfGuests
              },
              validatedData: {
                guestName: row.requestGuestName,
                guestEmail: row.requestGuestEmail,
                originalStatus: row.requestStatus,
                mappedStatus: status,
                originalUrgency: row.requestUrgency,
                mappedUrgency: urgency
              },
              validations: {
                hasValidDates: startDate && endDate && startDate < endDate,
                hasValidGuests: !!row.requestGuestName && !!row.requestGuestEmail,
                hasValidGuestCount: numberOfGuests && numberOfGuests > 0,
                hasPropertyId: !!propertyId
              }
            }

            // Relaxed validation - only require basic fields
            if (startDate && endDate && startDate < endDate && 
                row.requestGuestName && row.requestGuestEmail && propertyId) {
              
              // Ensure numberOfGuests is at least 1
              const validGuestCount = numberOfGuests && numberOfGuests > 0 ? numberOfGuests : 1
              
              // Ensure guestPhone is always a non-empty string
              const phoneValue = convertValue(row.requestGuestPhone, 'string')
              const guestPhone = (typeof phoneValue === 'string' && phoneValue.trim()) ? phoneValue.trim() : ""

              // Ensure message is string or undefined
              const messageValue = convertValue(row.requestMessage, 'string')
              const message = (typeof messageValue === 'string' && messageValue.trim()) ? messageValue.trim() : undefined

              try {
                await tx.availabilityRequest.create({
                  data: {
                    propertyId,
                    startDate,
                    endDate,
                    guestName: row.requestGuestName.trim(),
                    guestEmail: row.requestGuestEmail.trim(),
                    guestPhone,
                    numberOfGuests: validGuestCount,
                    message,
                    status: status as any,
                    urgency: urgency as any,
                    requestedBy: userId,
                  }
                })
                result.imported.availabilityRequests++
                
                result.debug.availabilityRequestAttempts.push({
                  ...debugInfo,
                  result: 'SUCCESS',
                  createdRequest: true,
                  finalData: {
                    guestPhone,
                    message,
                    status,
                    urgency,
                    numberOfGuests: validGuestCount
                  }
                })
              } catch (createError) {
                result.debug.availabilityRequestAttempts.push({
                  ...debugInfo,
                  result: 'CREATE_ERROR',
                  error: createError instanceof Error ? createError.message : 'Unknown create error',
                  prismaError: createError
                })
                // Don't add to main errors array - continue processing other rows
                console.error(`Row ${rowNum} AvailabilityRequest creation failed:`, createError)
              }
            } else {
              result.debug.availabilityRequestAttempts.push({
                ...debugInfo,
                result: 'VALIDATION_FAILED',
                validationErrors: {
                  hasValidDates: !!(startDate && endDate && startDate < endDate),
                  hasGuestName: !!row.requestGuestName,
                  hasGuestEmail: !!row.requestGuestEmail,
                  hasPropertyId: !!propertyId,
                  dateDetails: { startDate, endDate, isValidRange: startDate && endDate && startDate < endDate }
                }
              })
            }
          } catch (availabilityError) {
            result.debug.availabilityRequestAttempts.push({
              rowNum,
              propertyName,
              propertyId,
              result: 'PROCESSING_ERROR',
              error: availabilityError instanceof Error ? availabilityError.message : 'Unknown processing error'
            })
            console.error(`Row ${rowNum} AvailabilityRequest processing failed:`, availabilityError)
          }
        }

      } catch (error) {
        result.errors.push(`Row ${rowNum}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }
  })

  result.success = result.errors.length < rows.length // Success if not all rows failed
  return result
}

// Helper functions to detect what data a row contains
function hasPropertyData(row: Record<string, string>): boolean {
  return !!(row.numberOfRooms || row.maxGuests || row.address)
}

function hasPricingData(row: Record<string, string>): boolean {
  return !!(row.periodName || row.priceStartDate || row.ownerNightlyRate)
}

function hasCostData(row: Record<string, string>): boolean {
  return !!(row.costType || row.costEstimatedPrice)
}

function hasBookingData(row: Record<string, string>): boolean {
  return !!(row.bookingType || row.bookingStartDate)
}

function hasAvailabilityRequestData(row: Record<string, string>): boolean {
  return !!(row.requestStartDate || row.requestGuestName || row.requestGuestEmail)
}