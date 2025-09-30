"use server"

import { prisma } from "@/lib/db"
import { requirePermission } from "@/lib/auth"
import { auth } from "@clerk/nextjs/server"
import { Permission } from "@/types/auth"
import { revalidatePath } from "next/cache"
import { 
  createPricingPeriodSchema, 
  updatePricingPeriodSchema,
  createMinimumStayRuleSchema,
  updateMinimumStayRuleSchema,
  createOperationalCostSchema,
  updateOperationalCostSchema,
  updatePropertyPricingSchema,
  calculatePublicPrice,
  type UpdatePropertyPricingFormData,
  type CreatePricingPeriodFormData,
  type UpdatePricingPeriodFormData,
  type CreateMinimumStayRuleFormData,
  type UpdateMinimumStayRuleFormData,
  type CreateOperationalCostFormData,
  type UpdateOperationalCostFormData
} from "@/lib/validations/pricing"

// Get all pricing data for a property
export async function getPropertyPricing(propertyId: string) {
  await requirePermission(Permission.FINANCIAL_VIEW)
  const { userId } = await auth()
  if (!userId) throw new Error("Unauthorized")

  const [property, pricing, priceRanges, minimumStayRules, operationalCosts] = await Promise.all([
    prisma.property.findUnique({
      where: { id: propertyId },
      select: { id: true, name: true }
    }),
    prisma.propertyPricing.findUnique({
      where: { propertyId }
    }),
    prisma.priceRange.findMany({
      where: { propertyId },
      orderBy: { startDate: 'asc' }
    }),
    prisma.minimumStayRule.findMany({
      where: { propertyId },
      orderBy: { startDate: 'asc' }
    }),
    prisma.operationalCost.findMany({
      where: { propertyId },
      orderBy: { createdAt: 'asc' }
    })
  ])

  if (!property) {
    throw new Error("Property not found")
  }

  // Log sensitive data access
  await prisma.sensitiveDataAccess.create({
    data: {
      userId,
      userRole: 'admin', // This should come from the auth context
      action: 'VIEW',
      dataType: 'FINANCIAL_DATA',
      propertyId,
      metadata: {
        section: 'pricing'
      }
    }
  })

  return {
    property,
    pricing,
    priceRanges,
    minimumStayRules,
    operationalCosts
  }
}

// Update general pricing settings
export async function updatePropertyPricing(
  propertyId: string, 
  data: UpdatePropertyPricingFormData
) {
  await requirePermission(Permission.FINANCIAL_EDIT)
  const { userId } = await auth()
  if (!userId) throw new Error("Unauthorized")

  const validated = updatePropertyPricingSchema.parse(data)

  // Check if pricing record exists
  const existingPricing = await prisma.propertyPricing.findUnique({
    where: { propertyId }
  })

  let result
  if (existingPricing) {
    result = await prisma.propertyPricing.update({
      where: { propertyId },
      data: {
        ...validated,
        lastPricingUpdate: new Date()
      }
    })
  } else {
    result = await prisma.propertyPricing.create({
      data: {
        propertyId,
        ...validated,
        lastPricingUpdate: new Date()
      }
    })
  }

  // Log the update
  await prisma.auditLog.create({
    data: {
      userId,
      action: 'UPDATE',
      entityType: 'PROPERTY_PRICING',
      entityId: propertyId,
      changes: {
        before: existingPricing,
        after: result
      }
    }
  })

  revalidatePath(`/houses/${propertyId}`)
  return { success: true, data: result }
}

// Create price range
export async function createPriceRange(
  propertyId: string,
  data: CreatePricingPeriodFormData
) {
  await requirePermission(Permission.FINANCIAL_EDIT)
  const { userId } = await auth()
  if (!userId) throw new Error("Unauthorized")

  const validated = createPricingPeriodSchema.parse(data)

  // Calculate public prices based on owner prices and commission
  const publicNightlyRate = calculatePublicPrice(validated.ownerNightlyRate, validated.commissionRate)
  const publicWeeklyRate = validated.ownerWeeklyRate 
    ? calculatePublicPrice(validated.ownerWeeklyRate, validated.commissionRate)
    : null

  const priceRange = await prisma.priceRange.create({
    data: {
      propertyId,
      ...validated,
      publicNightlyRate,
      publicWeeklyRate
    }
  })

  // Update lastPricingUpdate on PropertyPricing
  await prisma.propertyPricing.updateMany({
    where: { propertyId },
    data: { lastPricingUpdate: new Date() }
  })

  await prisma.auditLog.create({
    data: {
      userId,
      action: 'CREATE',
      entityType: 'PRICE_RANGE',
      entityId: priceRange.id,
      changes: { created: priceRange }
    }
  })

  revalidatePath(`/houses/${propertyId}`)
  return { success: true, data: priceRange }
}

// Update price range
export async function updatePriceRange(
  id: string,
  data: UpdatePricingPeriodFormData
) {
  await requirePermission(Permission.FINANCIAL_EDIT)
  const { userId } = await auth()
  if (!userId) throw new Error("Unauthorized")

  const validated = updatePricingPeriodSchema.parse(data)

  // Get existing price range to calculate public prices if needed
  const existing = await prisma.priceRange.findUnique({
    where: { id }
  })

  if (!existing) {
    throw new Error("Price range not found")
  }

  // Calculate public prices if owner prices or commission changed
  let publicNightlyRate = existing.publicNightlyRate
  let publicWeeklyRate = existing.publicWeeklyRate

  if (validated.ownerNightlyRate !== undefined || validated.commissionRate !== undefined) {
    const ownerNightly = validated.ownerNightlyRate ?? existing.ownerNightlyRate ?? 0
    const commission = validated.commissionRate ?? existing.commissionRate
    publicNightlyRate = calculatePublicPrice(ownerNightly, commission)
  }

  if (validated.ownerWeeklyRate !== undefined || validated.commissionRate !== undefined) {
    const ownerWeekly = validated.ownerWeeklyRate ?? existing.ownerWeeklyRate
    const commission = validated.commissionRate ?? existing.commissionRate
    publicWeeklyRate = ownerWeekly ? calculatePublicPrice(ownerWeekly, commission) : null
  }

  const updated = await prisma.priceRange.update({
    where: { id },
    data: {
      ...validated,
      publicNightlyRate,
      publicWeeklyRate
    }
  })

  // Update lastPricingUpdate on PropertyPricing
  await prisma.propertyPricing.updateMany({
    where: { propertyId: existing.propertyId },
    data: { lastPricingUpdate: new Date() }
  })

  await prisma.auditLog.create({
    data: {
      userId,
      action: 'UPDATE',
      entityType: 'PRICE_RANGE',
      entityId: id,
      changes: {
        before: existing,
        after: updated
      }
    }
  })

  revalidatePath(`/houses/${existing.propertyId}`)
  return { success: true, data: updated }
}

// Delete price range
export async function deletePriceRange(id: string) {
  await requirePermission(Permission.FINANCIAL_EDIT)
  const { userId } = await auth()
  if (!userId) throw new Error("Unauthorized")

  const priceRange = await prisma.priceRange.findUnique({
    where: { id }
  })

  if (!priceRange) {
    throw new Error("Price range not found")
  }

  await prisma.priceRange.delete({
    where: { id }
  })

  // Update lastPricingUpdate on PropertyPricing
  await prisma.propertyPricing.updateMany({
    where: { propertyId: priceRange.propertyId },
    data: { lastPricingUpdate: new Date() }
  })

  await prisma.auditLog.create({
    data: {
      userId,
      action: 'DELETE',
      entityType: 'PRICE_RANGE',
      entityId: id,
      changes: { deleted: priceRange }
    }
  })

  revalidatePath(`/houses/${priceRange.propertyId}`)
  return { success: true }
}

// Create minimum stay rule
export async function createMinimumStayRule(
  propertyId: string,
  data: CreateMinimumStayRuleFormData
) {
  await requirePermission(Permission.FINANCIAL_EDIT)
  const { userId } = await auth()
  if (!userId) throw new Error("Unauthorized")

  const validated = createMinimumStayRuleSchema.parse(data)

  const rule = await prisma.minimumStayRule.create({
    data: {
      propertyId,
      ...validated
    }
  })

  await prisma.auditLog.create({
    data: {
      userId,
      action: 'CREATE',
      entityType: 'MINIMUM_STAY_RULE',
      entityId: rule.id,
      changes: { created: rule }
    }
  })

  revalidatePath(`/houses/${propertyId}`)
  return { success: true, data: rule }
}

// Update minimum stay rule
export async function updateMinimumStayRule(
  id: string,
  data: UpdateMinimumStayRuleFormData
) {
  await requirePermission(Permission.FINANCIAL_EDIT)
  const { userId } = await auth()
  if (!userId) throw new Error("Unauthorized")

  const validated = updateMinimumStayRuleSchema.parse(data)

  const existing = await prisma.minimumStayRule.findUnique({
    where: { id }
  })

  if (!existing) {
    throw new Error("Minimum stay rule not found")
  }

  const updated = await prisma.minimumStayRule.update({
    where: { id },
    data: validated
  })

  await prisma.auditLog.create({
    data: {
      userId,
      action: 'UPDATE',
      entityType: 'MINIMUM_STAY_RULE',
      entityId: id,
      changes: {
        before: existing,
        after: updated
      }
    }
  })

  revalidatePath(`/houses/${existing.propertyId}`)
  return { success: true, data: updated }
}

// Delete minimum stay rule
export async function deleteMinimumStayRule(id: string) {
  await requirePermission(Permission.FINANCIAL_EDIT)
  const { userId } = await auth()
  if (!userId) throw new Error("Unauthorized")

  const rule = await prisma.minimumStayRule.findUnique({
    where: { id }
  })

  if (!rule) {
    throw new Error("Minimum stay rule not found")
  }

  await prisma.minimumStayRule.delete({
    where: { id }
  })

  await prisma.auditLog.create({
    data: {
      userId,
      action: 'DELETE',
      entityType: 'MINIMUM_STAY_RULE',
      entityId: id,
      changes: { deleted: rule }
    }
  })

  revalidatePath(`/houses/${rule.propertyId}`)
  return { success: true }
}

// Create operational cost
export async function createOperationalCost(
  propertyId: string,
  data: CreateOperationalCostFormData
) {
  await requirePermission(Permission.FINANCIAL_EDIT)
  const { userId } = await auth()
  if (!userId) throw new Error("Unauthorized")

  const validated = createOperationalCostSchema.parse(data)

  const cost = await prisma.operationalCost.create({
    data: {
      propertyId,
      ...validated
    }
  })

  await prisma.auditLog.create({
    data: {
      userId,
      action: 'CREATE',
      entityType: 'OPERATIONAL_COST',
      entityId: cost.id,
      changes: { created: cost }
    }
  })

  revalidatePath(`/houses/${propertyId}`)
  return { success: true, data: cost }
}

// Update operational cost
export async function updateOperationalCost(
  id: string,
  data: UpdateOperationalCostFormData
) {
  await requirePermission(Permission.FINANCIAL_EDIT)
  const { userId } = await auth()
  if (!userId) throw new Error("Unauthorized")

  const validated = updateOperationalCostSchema.parse(data)

  const existing = await prisma.operationalCost.findUnique({
    where: { id }
  })

  if (!existing) {
    throw new Error("Operational cost not found")
  }

  const updated = await prisma.operationalCost.update({
    where: { id },
    data: validated
  })

  await prisma.auditLog.create({
    data: {
      userId,
      action: 'UPDATE',
      entityType: 'OPERATIONAL_COST',
      entityId: id,
      changes: {
        before: existing,
        after: updated
      }
    }
  })

  revalidatePath(`/houses/${existing.propertyId}`)
  return { success: true, data: updated }
}

// Delete operational cost
export async function deleteOperationalCost(id: string) {
  await requirePermission(Permission.FINANCIAL_EDIT)
  const { userId } = await auth()
  if (!userId) throw new Error("Unauthorized")

  const cost = await prisma.operationalCost.findUnique({
    where: { id }
  })

  if (!cost) {
    throw new Error("Operational cost not found")
  }

  await prisma.operationalCost.delete({
    where: { id }
  })

  await prisma.auditLog.create({
    data: {
      userId,
      action: 'DELETE',
      entityType: 'OPERATIONAL_COST',
      entityId: id,
      changes: { deleted: cost }
    }
  })

  revalidatePath(`/houses/${cost.propertyId}`)
  return { success: true }
}

// Migrate legacy pricing data
export async function migrateLegacyPricing(propertyId: string) {
  await requirePermission(Permission.FINANCIAL_EDIT)

  // Get price ranges with legacy data
  const legacyPriceRanges = await prisma.priceRange.findMany({
    where: {
      propertyId,
      nightlyRate: { not: null }
    }
  })

  // Update each price range
  for (const range of legacyPriceRanges) {
    if (range.nightlyRate) {
      await prisma.priceRange.update({
        where: { id: range.id },
        data: {
          ownerNightlyRate: range.nightlyRate,
          ownerWeeklyRate: range.weeklyRate,
          publicNightlyRate: calculatePublicPrice(range.nightlyRate, range.commissionRate),
          publicWeeklyRate: range.weeklyRate ? calculatePublicPrice(range.weeklyRate, range.commissionRate) : null,
          // Clear legacy fields
          nightlyRate: null,
          weeklyRate: null,
          monthlyRate: null
        }
      })
    }
  }

  revalidatePath(`/houses/${propertyId}`)
  return { success: true, migrated: legacyPriceRanges.length }
}