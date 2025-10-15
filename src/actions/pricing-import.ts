'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { requirePermission } from '@/lib/auth'
import { Permission } from '@/types/auth'
import { auth } from '@clerk/nextjs/server'
import {
  importPriceRangesSchema,
  exportPriceRangesSchema,
  // operationalCostImportSchema,
  // minimumStayImportSchema,
  validateDateRangeOverlap,
  type ImportPriceRangesData,
  type ExportPriceRangesData,
  type OperationalCostImportData,
  type MinimumStayImportData
} from '@/lib/validations/pricing'

export interface ActionResult<T> {
  success: boolean
  data?: T
  error?: string
}

export interface ImportResult {
  imported: number
  skipped: number
  updated: number
  errors: { row: number; error: string }[]
}

/**
 * Import price ranges from CSV data
 * - Validates all price ranges before import
 * - Checks for date overlaps and property existence
 * - Returns import summary
 */
export async function importPriceRanges(
  input: ImportPriceRangesData
): Promise<ActionResult<ImportResult>> {
  try {
    // Authentication check
    const { userId } = await auth()
    if (!userId) {
      return { success: false, error: 'Unauthorized' }
    }

    // Permission check
    const hasPermission = await requirePermission(Permission.PROPERTY_EDIT)
    if (!hasPermission) {
      return { success: false, error: 'You do not have permission to import pricing data' }
    }

    // Validate input
    const validated = importPriceRangesSchema.parse(input)
    const { priceRanges, skipConflicts, updateExisting } = validated

    let imported = 0
    let skipped = 0
    let updated = 0
    const errors: { row: number; error: string }[] = []

    // Validate all properties exist
    const propertyIds = [...new Set(priceRanges.map(pr => pr.propertyId))]
    const existingProperties = await prisma.property.findMany({
      where: { id: { in: propertyIds } },
      select: { id: true, name: true }
    })
    const existingPropertyIds = new Set(existingProperties.map(p => p.id))

    // Process price ranges in batches to avoid overwhelming the database
    const batchSize = 10
    for (let i = 0; i < priceRanges.length; i += batchSize) {
      const batch = priceRanges.slice(i, i + batchSize)
      
      await Promise.all(batch.map(async (priceRange, index) => {
        const rowIndex = i + index + 1
        
        try {
          // Check if property exists
          if (!existingPropertyIds.has(priceRange.propertyId)) {
            errors.push({
              row: rowIndex,
              error: `Property with ID '${priceRange.propertyId}' not found`
            })
            return
          }

          // Check for existing price ranges in the same period
          const existingRanges = await prisma.priceRange.findMany({
            where: { propertyId: priceRange.propertyId },
            select: { id: true, startDate: true, endDate: true, name: true }
          })

          // Check for date overlaps
          const hasOverlap = !validateDateRangeOverlap(
            existingRanges,
            { startDate: priceRange.startDate, endDate: priceRange.endDate }
          )

          if (hasOverlap) {
            if (skipConflicts) {
              skipped++
              return
            } else if (updateExisting) {
              // Find the overlapping range to update
              const overlappingRange = existingRanges.find(range => {
                return (
                  (priceRange.startDate >= range.startDate && priceRange.startDate <= range.endDate) ||
                  (priceRange.endDate >= range.startDate && priceRange.endDate <= range.endDate) ||
                  (priceRange.startDate <= range.startDate && priceRange.endDate >= range.endDate)
                )
              })

              if (overlappingRange) {
                await prisma.priceRange.update({
                  where: { id: overlappingRange.id },
                  data: {
                    name: priceRange.periodName,
                    startDate: priceRange.startDate,
                    endDate: priceRange.endDate,
                    ownerNightlyRate: priceRange.ownerNightlyRate,
                    ownerWeeklyRate: priceRange.ownerWeeklyRate,
                    commissionRate: priceRange.commissionRate,
                    isValidated: priceRange.isValidated,
                  }
                })
                updated++
                return
              }
            } else {
              errors.push({
                row: rowIndex,
                error: `Date range conflicts with existing price range`
              })
              return
            }
          }

          // Create new price range
          await prisma.priceRange.create({
            data: {
              propertyId: priceRange.propertyId,
              name: priceRange.periodName,
              startDate: priceRange.startDate,
              endDate: priceRange.endDate,
              ownerNightlyRate: priceRange.ownerNightlyRate,
              ownerWeeklyRate: priceRange.ownerWeeklyRate,
              commissionRate: priceRange.commissionRate,
              isValidated: priceRange.isValidated,
            }
          })
          imported++
        } catch (error) {
          errors.push({
            row: rowIndex,
            error: error instanceof Error ? error.message : 'Unknown error'
          })
        }
      }))
    }

    // Create audit log entry
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'import',
        entityType: 'price_ranges',
        entityId: 'bulk_import',
        changes: {
          summary: `Imported price ranges: ${imported} created, ${updated} updated, ${skipped} skipped, ${errors.length} errors`
        },
      },
    })

    // Revalidate relevant paths
    propertyIds.forEach(propertyId => {
      revalidatePath(`/houses/${propertyId}`)
    })

    return {
      success: true,
      data: { imported, skipped, updated, errors }
    }
  } catch (_error) {
    if (_error instanceof z.ZodError) {
      const firstError = _error.issues[0]
      return {
        success: false,
        error: `Validation error: ${firstError.path.join('.')} - ${firstError.message}`,
      }
    }

    if (_error instanceof Error) {
      return {
        success: false,
        error: _error.message,
      }
    }

    return {
      success: false,
      error: 'An unexpected error occurred while importing price ranges',
    }
  }
}

/**
 * Export price ranges to CSV
 * - Filters can be applied by property or date range
 * - Returns base64 encoded file content
 */
export async function exportPriceRanges(
  input: ExportPriceRangesData
): Promise<ActionResult<{ filename: string, content: string }>> {
  try {
    // Authentication check
    const { userId } = await auth()
    if (!userId) {
      return { success: false, error: 'Unauthorized' }
    }

    // Permission check
    const hasPermission = await requirePermission(Permission.PROPERTY_VIEW)
    if (!hasPermission) {
      return { success: false, error: 'You do not have permission to export pricing data' }
    }

    // Validate input
    const validated = exportPriceRangesSchema.parse(input)
    const { propertyIds, startDate, endDate, format } = validated

    // Build where clause
    const where: Record<string, unknown> = {}
    
    if (propertyIds && propertyIds.length > 0) {
      where.propertyId = { in: propertyIds }
    }

    if (startDate || endDate) {
      const andConditions: unknown[] = []
      if (startDate) {
        andConditions.push({ endDate: { gte: startDate } })
      }
      if (endDate) {
        andConditions.push({ startDate: { lte: endDate } })
      }
      where.AND = andConditions
    }

    // Fetch price ranges with property information
    const priceRanges = await prisma.priceRange.findMany({
      where,
      include: {
        property: {
          select: { name: true }
        }
      },
      orderBy: [
        { propertyId: 'asc' },
        { startDate: 'asc' }
      ]
    })

    // Create audit log entry
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'export',
        entityType: 'price_ranges',
        entityId: 'bulk_export',
        changes: {
          summary: `Exported ${priceRanges.length} price ranges as ${format.toUpperCase()}`
        },
      },
    })

    // Format data for CSV
    let content: string
    const filename = `price_ranges_export_${new Date().toISOString().split('T')[0]}.${format}`

    if (format === 'csv') {
      // Create CSV content
      const headers = [
        'Property ID',
        'Property Name',
        'Period Name',
        'Start Date',
        'End Date',
        'Owner Nightly Rate',
        'Owner Weekly Rate',
        'Commission Rate',
        'Validated',
        'Created At'
      ]

      const rows = priceRanges.map(range => [
        range.propertyId,
        range.property.name,
        range.name,
        range.startDate.toISOString().split('T')[0],
        range.endDate.toISOString().split('T')[0],
        (range.ownerNightlyRate ?? 0).toString(),
        range.ownerWeeklyRate?.toString() || '',
        (range.commissionRate ?? 25).toString(),
        range.isValidated ? 'true' : 'false',
        range.createdAt.toISOString().split('T')[0]
      ])

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => 
          `"${String(cell).replace(/"/g, '""')}"`
        ).join(','))
      ].join('\n')

      // Convert to base64
      content = Buffer.from(csvContent).toString('base64')
    } else {
      // For Excel format, we'd need a library like xlsx
      // For now, return CSV with .xlsx extension
      return {
        success: false,
        error: 'Excel export not yet implemented. Please use CSV format.'
      }
    }

    return {
      success: true,
      data: { filename, content }
    }
  } catch (_error) {
    if (_error instanceof z.ZodError) {
      const firstError = _error.issues[0]
      return {
        success: false,
        error: `Validation error: ${firstError.path.join('.')} - ${firstError.message}`,
      }
    }

    if (_error instanceof Error) {
      return {
        success: false,
        error: _error.message,
      }
    }

    return {
      success: false,
      error: 'An unexpected error occurred while exporting price ranges',
    }
  }
}

/**
 * Import operational costs from CSV data
 */
export async function importOperationalCosts(
  costs: OperationalCostImportData[]
): Promise<ActionResult<ImportResult>> {
  try {
    const { userId } = await auth()
    if (!userId) {
      return { success: false, error: 'Unauthorized' }
    }

    await requirePermission(Permission.PROPERTY_EDIT)

    let imported = 0
    const errors: { row: number; error: string }[] = []

    // Validate all properties exist
    const propertyIds = [...new Set(costs.map(cost => cost.propertyId))]
    const existingProperties = await prisma.property.findMany({
      where: { id: { in: propertyIds } },
      select: { id: true }
    })
    const existingPropertyIds = new Set(existingProperties.map(p => p.id))

    for (let i = 0; i < costs.length; i++) {
      const cost = costs[i]
      const rowIndex = i + 1

      try {
        if (!existingPropertyIds.has(cost.propertyId)) {
          errors.push({
            row: rowIndex,
            error: `Property with ID '${cost.propertyId}' not found`
          })
          continue
        }

        await prisma.operationalCost.create({
          data: {
            propertyId: cost.propertyId,
            costType: cost.costType,
            priceType: cost.priceType,
            estimatedPrice: cost.estimatedPrice,
            publicPrice: cost.publicPrice,
            paidBy: cost.paidBy,
            comment: cost.comment,
          }
        })
        imported++
      } catch (error) {
        errors.push({
          row: rowIndex,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'import',
        entityType: 'operational_costs',
        entityId: 'bulk_import',
        changes: {
          summary: `Imported ${imported} operational costs, ${errors.length} errors`
        },
      },
    })

    return {
      success: true,
      data: { imported, skipped: 0, updated: 0, errors }
    }
  } catch (_error) {
    return {
      success: false,
      error: _error instanceof Error ? _error.message : 'Unknown error'
    }
  }
}

/**
 * Import minimum stay rules from CSV data
 */
export async function importMinimumStayRules(
  rules: MinimumStayImportData[]
): Promise<ActionResult<ImportResult>> {
  try {
    const { userId } = await auth()
    if (!userId) {
      return { success: false, error: 'Unauthorized' }
    }

    await requirePermission(Permission.PROPERTY_EDIT)

    let imported = 0
    const errors: { row: number; error: string }[] = []

    // Validate all properties exist
    const propertyIds = [...new Set(rules.map(rule => rule.propertyId))]
    const existingProperties = await prisma.property.findMany({
      where: { id: { in: propertyIds } },
      select: { id: true }
    })
    const existingPropertyIds = new Set(existingProperties.map(p => p.id))

    for (let i = 0; i < rules.length; i++) {
      const rule = rules[i]
      const rowIndex = i + 1

      try {
        if (!existingPropertyIds.has(rule.propertyId)) {
          errors.push({
            row: rowIndex,
            error: `Property with ID '${rule.propertyId}' not found`
          })
          continue
        }

        await prisma.minimumStayRule.create({
          data: {
            propertyId: rule.propertyId,
            bookingCondition: rule.bookingCondition,
            minimumNights: rule.minimumNights,
            startDate: rule.startDate,
            endDate: rule.endDate,
          }
        })
        imported++
      } catch (error) {
        errors.push({
          row: rowIndex,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'import',
        entityType: 'minimum_stay_rules',
        entityId: 'bulk_import',
        changes: {
          summary: `Imported ${imported} minimum stay rules, ${errors.length} errors`
        },
      },
    })

    return {
      success: true,
      data: { imported, skipped: 0, updated: 0, errors }
    }
  } catch (_error) {
    return {
      success: false,
      error: _error instanceof Error ? _error.message : 'Unknown error'
    }
  }
}