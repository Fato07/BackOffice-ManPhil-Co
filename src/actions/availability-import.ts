'use server'

import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { z } from "zod"

// Booking import schema
export const bookingImportSchema = z.object({
  propertyName: z.string().min(1, "Property name is required"),
  bookingType: z.enum(["CONFIRMED", "TENTATIVE", "BLOCKED", "MAINTENANCE", "OWNER", "OWNER_STAY", "CONTRACT"]),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  guestName: z.string().nullish(),
  guestEmail: z.string().email().nullish().or(z.literal("")),
  guestPhone: z.string().nullish(),
  numberOfGuests: z.number().int().min(0).nullish(),
  totalAmount: z.number().min(0).nullish(),
  notes: z.string().nullish(),
})

export type BookingImportData = z.infer<typeof bookingImportSchema>

export interface ImportResult {
  success: boolean
  imported: number
  failed: number
  errors: Array<{
    row: number
    message: string
    field?: string
    value?: unknown
  }>
  warnings: Array<{
    row: number
    message: string
    field?: string
    value?: unknown
  }>
}

/**
 * Import bookings/availability data from CSV
 */
export async function importBookings(
  bookingsData: BookingImportData[],
  mode: "create" | "update" | "both" = "create"
): Promise<ImportResult> {
  try {
    const { userId } = await auth()
    if (!userId) {
      throw new Error("Unauthorized")
    }

    const result: ImportResult = {
      success: false,
      imported: 0,
      failed: 0,
      errors: [],
      warnings: [],
    }

    // Get all properties to create name-to-ID mapping
    const properties = await prisma.property.findMany({
      select: { id: true, name: true },
    })
    const propertyMap = new Map(
      properties.map(p => [p.name.toLowerCase(), p.id])
    )

    // Get existing bookings for duplicate checking
    const existingBookings = await prisma.booking.findMany({
      select: { 
        id: true, 
        propertyId: true, 
        startDate: true, 
        endDate: true,
        type: true
      },
    })

    await prisma.$transaction(async (tx) => {
      for (let i = 0; i < bookingsData.length; i++) {
        const rowNumber = i + 2 // CSV row number (accounting for header)
        const bookingData = bookingsData[i]
        
        try {
          // Validate the booking data
          const validation = bookingImportSchema.safeParse(bookingData)
          if (!validation.success) {
            result.errors.push({
              row: rowNumber,
              message: validation.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join('; '),
            })
            result.failed++
            continue
          }

          const validData = validation.data

          // Parse dates
          const startDate = new Date(validData.startDate)
          const endDate = new Date(validData.endDate)

          if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            result.errors.push({
              row: rowNumber,
              message: "Invalid date format. Use YYYY-MM-DD",
              field: "dates",
            })
            result.failed++
            continue
          }

          if (endDate <= startDate) {
            result.errors.push({
              row: rowNumber,
              message: "End date must be after start date",
              field: "dates",
            })
            result.failed++
            continue
          }

          // Find property ID by name
          const propertyId = propertyMap.get(validData.propertyName.toLowerCase())
          if (!propertyId) {
            result.errors.push({
              row: rowNumber,
              message: `Property "${validData.propertyName}" not found. Please import properties first.`,
              field: "propertyName",
              value: validData.propertyName,
            })
            result.failed++
            continue
          }

          // Check for overlapping bookings
          const hasOverlap = existingBookings.some(existing => 
            existing.propertyId === propertyId &&
            ((startDate >= existing.startDate && startDate < existing.endDate) ||
             (endDate > existing.startDate && endDate <= existing.endDate) ||
             (startDate <= existing.startDate && endDate >= existing.endDate))
          )

          if (hasOverlap && mode === "create") {
            result.warnings.push({
              row: rowNumber,
              message: `Booking overlaps with existing booking for "${validData.propertyName}"`,
              field: "dates",
            })
          }

          // Prepare booking data
          const newBooking = {
            propertyId,
            type: validData.bookingType,
            status: "CONFIRMED" as const,
            source: "IMPORT" as const,
            startDate,
            endDate,
            guestName: validData.guestName || null,
            guestEmail: validData.guestEmail || null,
            guestPhone: validData.guestPhone || null,
            numberOfGuests: validData.numberOfGuests || null,
            totalAmount: validData.totalAmount || null,
            notes: validData.notes || null,
            createdBy: userId,
          }

          // Create the booking
          const createdBooking = await tx.booking.create({
            data: newBooking,
          })

          // Create audit log
          await tx.auditLog.create({
            data: {
              action: "create",
              entityType: "booking",
              entityId: createdBooking.id,
              userId,
              changes: {
                ...newBooking,
                importedFromCSV: true,
              },
            },
          })

          result.imported++

        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : String(error)
          result.errors.push({
            row: rowNumber,
            message: `Failed to import booking: ${errorMessage}`,
          })
          result.failed++
        }
      }

      return result
    })

    result.success = result.imported > 0
    revalidatePath("/availability")
    
    return result

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    return {
      success: false,
      imported: 0,
      failed: bookingsData.length,
      errors: [
        {
          row: 0,
          message: `Import failed: ${errorMessage}`,
        },
      ],
      warnings: [],
    }
  }
}