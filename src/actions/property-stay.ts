'use server'

import { prisma as db } from "@/lib/db"
import { requirePermission } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { auth } from "@clerk/nextjs/server"
import { Permission } from "@/types/auth"
import {
  updateSurroundingsSchema,
  updateCheckInDetailsSchema,
  updateAccessInfoSchema,
  updateMaintenanceSchedulesSchema,
  updateNetworkInfoSchema,
  updateSecurityInfoSchema,
  updateVillaBookCommentSchema
} from "@/lib/validations/property"
import { StayMetadata, SurroundingsInfo } from "@/types/property"

export async function updatePropertySurroundings(data: {
  propertyId: string
  surroundings: SurroundingsInfo
}) {
  try {
    await requirePermission(Permission.PROPERTY_EDIT)
    const { userId } = await auth()
    if (!userId) return { success: false, error: "Unauthorized" }

    const validated = updateSurroundingsSchema.parse(data)

    await db.$transaction(async (tx) => {
      await tx.property.update({
        where: { id: data.propertyId },
        data: {
          surroundings: validated.surroundings as any
        }
      })

      await tx.auditLog.create({
        data: {
          userId,
          action: "update",
          entityType: "property_surroundings",
          entityId: data.propertyId,
          changes: {
            surroundings: validated.surroundings
          }
        }
      })
    })

    revalidatePath(`/houses/${data.propertyId}`)
    return { success: true }
  } catch (error) {
    
    return { success: false, error: "Failed to update surroundings" }
  }
}

export async function updateCheckInDetails(data: {
  propertyId: string
  checkInTime?: string | null
  checkOutTime?: string | null
  checkInPerson?: string | null
}) {
  try {
    await requirePermission(Permission.PROPERTY_EDIT)
    const { userId } = await auth()
    if (!userId) return { success: false, error: "Unauthorized" }

    const validated = updateCheckInDetailsSchema.parse(data)

    await db.$transaction(async (tx) => {
      await tx.property.update({
        where: { id: data.propertyId },
        data: {
          checkInTime: validated.checkInTime,
          checkOutTime: validated.checkOutTime,
          checkInPerson: validated.checkInPerson
        }
      })

      await tx.auditLog.create({
        data: {
          userId,
          action: "update",
          entityType: "property_check_in",
          entityId: data.propertyId,
          changes: validated
        }
      })
    })

    revalidatePath(`/houses/${data.propertyId}`)
    return { success: true }
  } catch (error) {
    
    return { success: false, error: "Failed to update check-in details" }
  }
}

export async function updateAccessInfo(data: {
  propertyId: string
  stayMetadata?: StayMetadata
}) {
  try {
    await requirePermission(Permission.PROPERTY_EDIT)
    const { userId } = await auth()
    if (!userId) return { success: false, error: "Unauthorized" }

    const validated = updateAccessInfoSchema.parse(data)

    await db.$transaction(async (tx) => {
      await tx.property.update({
        where: { id: data.propertyId },
        data: {
          stayMetadata: validated.stayMetadata as any
        }
      })

      await tx.auditLog.create({
        data: {
          userId,
          action: "update",
          entityType: "property_access",
          entityId: data.propertyId,
          changes: { access: validated.stayMetadata?.access }
        }
      })
    })

    revalidatePath(`/houses/${data.propertyId}`)
    return { success: true }
  } catch (error) {
    
    return { success: false, error: "Failed to update access info" }
  }
}

export async function updateMaintenanceSchedules(data: {
  propertyId: string
  stayMetadata?: StayMetadata
}) {
  try {
    await requirePermission(Permission.PROPERTY_EDIT)
    const { userId } = await auth()
    if (!userId) return { success: false, error: "Unauthorized" }

    const validated = updateMaintenanceSchedulesSchema.parse(data)

    await db.$transaction(async (tx) => {
      await tx.property.update({
        where: { id: data.propertyId },
        data: {
          stayMetadata: validated.stayMetadata as any
        }
      })

      await tx.auditLog.create({
        data: {
          userId,
          action: "update",
          entityType: "property_maintenance",
          entityId: data.propertyId,
          changes: { maintenance: validated.stayMetadata?.maintenance }
        }
      })
    })

    revalidatePath(`/houses/${data.propertyId}`)
    return { success: true }
  } catch (error) {
    
    return { success: false, error: "Failed to update maintenance schedules" }
  }
}

export async function updateNetworkInfo(data: {
  propertyId: string
  wifiName?: string | null
  wifiPassword?: string | null
  wifiInAllRooms?: boolean
  wifiSpeed?: string | null
  mobileNetworkCoverage?: string | null
  stayMetadata?: StayMetadata
}) {
  try {
    await requirePermission(Permission.PROPERTY_EDIT)
    const { userId } = await auth()
    if (!userId) return { success: false, error: "Unauthorized" }

    const validated = updateNetworkInfoSchema.parse(data)

    await db.$transaction(async (tx) => {
      await tx.property.update({
        where: { id: data.propertyId },
        data: {
          wifiName: validated.wifiName,
          wifiPassword: validated.wifiPassword,
          wifiInAllRooms: validated.wifiInAllRooms,
          wifiSpeed: validated.wifiSpeed,
          mobileNetworkCoverage: validated.mobileNetworkCoverage,
          stayMetadata: validated.stayMetadata as any
        }
      })

      await tx.auditLog.create({
        data: {
          userId,
          action: "update",
          entityType: "property_network",
          entityId: data.propertyId,
          changes: {
            wifi: {
              name: validated.wifiName,
              speed: validated.wifiSpeed,
              coverage: validated.mobileNetworkCoverage
            },
            network: validated.stayMetadata?.network
          }
        }
      })
    })

    revalidatePath(`/houses/${data.propertyId}`)
    return { success: true }
  } catch (error) {
    
    return { success: false, error: "Failed to update network info" }
  }
}

export async function updateSecurityInfo(data: {
  propertyId: string
  hasFireExtinguisher?: boolean
  hasFireAlarm?: boolean
  electricMeterAccessible?: boolean
  electricMeterLocation?: string | null
  stayMetadata?: StayMetadata
}) {
  try {
    await requirePermission(Permission.PROPERTY_EDIT)
    const { userId } = await auth()
    if (!userId) return { success: false, error: "Unauthorized" }

    const validated = updateSecurityInfoSchema.parse(data)

    await db.$transaction(async (tx) => {
      await tx.property.update({
        where: { id: data.propertyId },
        data: {
          hasFireExtinguisher: validated.hasFireExtinguisher,
          hasFireAlarm: validated.hasFireAlarm,
          electricMeterAccessible: validated.electricMeterAccessible,
          electricMeterLocation: validated.electricMeterLocation,
          stayMetadata: validated.stayMetadata as any
        }
      })

      await tx.auditLog.create({
        data: {
          userId,
          action: "update",
          entityType: "property_security",
          entityId: data.propertyId,
          changes: {
            fireSafety: {
              hasExtinguisher: validated.hasFireExtinguisher,
              hasAlarm: validated.hasFireAlarm
            },
            electricMeter: {
              accessible: validated.electricMeterAccessible,
              location: validated.electricMeterLocation
            },
            security: validated.stayMetadata?.security
          }
        }
      })
    })

    revalidatePath(`/houses/${data.propertyId}`)
    return { success: true }
  } catch (error) {
    
    return { success: false, error: "Failed to update security info" }
  }
}

export async function updateVillaBookComment(data: {
  propertyId: string
  language: string
  content: string
}) {
  try {
    await requirePermission(Permission.PROPERTY_EDIT)
    const { userId } = await auth()
    if (!userId) return { success: false, error: "Unauthorized" }

    const validated = updateVillaBookCommentSchema.parse(data)
    
    await db.$transaction(async (tx) => {
      // Get existing property data
      const property = await tx.property.findUnique({
        where: { id: data.propertyId },
        select: { stayMetadata: true }
      })
      
      const existingMetadata = property?.stayMetadata as StayMetadata | null || {}
      const existingComments = existingMetadata.villaBookComment || {}
      
      // Update the specific language
      const updatedComments = {
        ...existingComments,
        [validated.language]: validated.content
      }

      await tx.property.update({
        where: { id: data.propertyId },
        data: {
          stayMetadata: {
            ...existingMetadata,
            villaBookComment: updatedComments
          } as any
        }
      })

      await tx.auditLog.create({
        data: {
          userId,
          action: "update",
          entityType: "property_villa_book",
          entityId: data.propertyId,
          changes: { 
            language: validated.language,
            contentLength: validated.content.length 
          }
        }
      })
    })

    revalidatePath(`/houses/${data.propertyId}`)
    return { success: true }
  } catch (error) {
    
    return { success: false, error: "Failed to update villa book comment" }
  }
}