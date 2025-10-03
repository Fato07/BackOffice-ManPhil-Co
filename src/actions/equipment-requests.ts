'use server'

import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { Prisma } from "@/generated/prisma"
import {
  CreateEquipmentRequestInput,
  UpdateEquipmentRequestInput,
  UpdateEquipmentRequestStatusInput,
  EquipmentRequestListItem,
  EquipmentRequestFilters,
  EquipmentRequestItem,
  createEquipmentRequestSchema,
  updateEquipmentRequestSchema,
  updateEquipmentRequestStatusSchema,
} from "@/types/equipment-request"
import { hasPermission } from "@/lib/auth"
import { Permission } from "@/types/auth"
import { EquipmentRequestStatus } from "@/generated/prisma"

// Get list of equipment requests with filters
export async function getEquipmentRequests(
  filters: EquipmentRequestFilters,
  page: number = 1,
  limit: number = 10
): Promise<{
  data: EquipmentRequestListItem[]
  total: number
  totalPages: number
}> {
  try {
    const authData = await auth()
    if (!authData?.userId) throw new Error("Unauthorized")

    if (!(await hasPermission(Permission.EQUIPMENT_REQUEST_VIEW))) {
      throw new Error("Insufficient permissions")
    }

    const skip = (page - 1) * limit

    // Build where clause
    const where: Prisma.EquipmentRequestWhereInput = {}

    if (filters.search) {
      where.OR = [
        { property: { name: { contains: filters.search, mode: 'insensitive' } } },
        { requestedBy: { contains: filters.search, mode: 'insensitive' } },
        { reason: { contains: filters.search, mode: 'insensitive' } },
      ]
    }

    if (filters.status && filters.status !== "ALL") {
      where.status = filters.status
    }

    if (filters.priority && filters.priority !== "ALL") {
      where.priority = filters.priority
    }

    if (filters.propertyId) {
      where.propertyId = filters.propertyId
    }

    if (filters.destinationId) {
      where.property = { destinationId: filters.destinationId }
    }

    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {}
      if (filters.dateFrom) where.createdAt.gte = filters.dateFrom
      if (filters.dateTo) where.createdAt.lte = filters.dateTo
    }

    // Get total count
    const total = await prisma.equipmentRequest.count({ where })

    // Get requests with relations
    const requests = await prisma.equipmentRequest.findMany({
      where,
      include: {
        property: {
          select: {
            id: true,
            name: true,
            destination: {
              select: {
                id: true,
                name: true,
                country: true,
              },
            },
          },
        },
        room: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],
      skip,
      take: limit,
    })

    // Transform to list items
    const data: EquipmentRequestListItem[] = requests.map((request) => ({
      id: request.id,
      propertyId: request.propertyId,
      propertyName: request.property.name,
      destinationName: request.property.destination.name,
      roomId: request.roomId,
      roomName: request.room?.name || null,
      requestedBy: request.requestedBy,
      requestedByEmail: request.requestedByEmail,
      status: request.status,
      priority: request.priority,
      itemCount: (request.items as any[]).length,
      reason: request.reason,
      createdAt: request.createdAt,
      updatedAt: request.updatedAt,
      approvedAt: request.approvedAt,
      completedAt: request.completedAt,
    }))

    return {
      data,
      total,
      totalPages: Math.ceil(total / limit),
    }
  } catch (error) {
    
    throw new Error("Failed to fetch equipment requests")
  }
}

// Get single equipment request by ID
export async function getEquipmentRequestById(id: string) {
  try {
    const authData = await auth()
    if (!authData?.userId) throw new Error("Unauthorized")

    if (!(await hasPermission(Permission.EQUIPMENT_REQUEST_VIEW))) {
      throw new Error("Insufficient permissions")
    }

    const request = await prisma.equipmentRequest.findUnique({
      where: { id },
      include: {
        property: {
          select: {
            id: true,
            name: true,
            destination: {
              select: {
                id: true,
                name: true,
                country: true,
              },
            },
          },
        },
        room: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    if (!request) {
      throw new Error("Equipment request not found")
    }

    return {
      ...request,
      items: request.items as unknown as EquipmentRequestItem[]
    }
  } catch (error) {
    
    throw new Error("Failed to fetch equipment request")
  }
}

// Create equipment request
export async function createEquipmentRequest(data: CreateEquipmentRequestInput) {
  try {
    const authData = await auth()
    if (!authData?.userId) throw new Error("Unauthorized")

    const userEmail = authData?.sessionClaims?.email as string || ""
    
    if (!(await hasPermission(Permission.EQUIPMENT_REQUEST_CREATE))) {
      throw new Error("Insufficient permissions")
    }

    // Validate input
    const validatedData = createEquipmentRequestSchema.parse(data)

    // Create request
    const request = await prisma.equipmentRequest.create({
      data: {
        propertyId: validatedData.propertyId,
        roomId: validatedData.roomId,
        requestedBy: authData.userId,
        requestedByEmail: userEmail,
        priority: validatedData.priority,
        items: validatedData.items as any,
        reason: validatedData.reason,
        notes: validatedData.notes,
      },
      include: {
        property: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: authData.userId,
        action: "CREATE_EQUIPMENT_REQUEST",
        entityType: "EquipmentRequest",
        entityId: request.id,
        changes: {
          propertyId: request.propertyId,
          propertyName: request.property.name,
          itemCount: validatedData.items.length,
          priority: request.priority,
        },
      },
    })

    revalidatePath("/equipment-requests")
    revalidatePath(`/houses/${validatedData.propertyId}`)

    return { success: true, data: request }
  } catch (error) {
    
    throw new Error("Failed to create equipment request")
  }
}

// Update equipment request
export async function updateEquipmentRequest(
  id: string,
  data: UpdateEquipmentRequestInput
) {
  try {
    const authData = await auth()
    if (!authData?.userId) throw new Error("Unauthorized")

    if (!(await hasPermission(Permission.EQUIPMENT_REQUEST_EDIT))) {
      throw new Error("Insufficient permissions")
    }

    // Validate input
    const validatedData = updateEquipmentRequestSchema.parse(data)

    // Get current request
    const currentRequest = await prisma.equipmentRequest.findUnique({
      where: { id },
    })

    if (!currentRequest) {
      throw new Error("Equipment request not found")
    }

    // Check if request can be edited
    if (currentRequest.status !== EquipmentRequestStatus.PENDING) {
      throw new Error("Can only edit pending requests")
    }

    // Update request
    const request = await prisma.equipmentRequest.update({
      where: { id },
      data: {
        priority: validatedData.priority,
        items: validatedData.items as any,
        reason: validatedData.reason,
        notes: validatedData.notes,
        internalNotes: validatedData.internalNotes,
      },
    })

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: authData.userId,
        action: "UPDATE_EQUIPMENT_REQUEST",
        entityType: "EquipmentRequest",
        entityId: id,
        changes: validatedData,
      },
    })

    revalidatePath("/equipment-requests")
    revalidatePath(`/equipment-requests/${id}`)

    return { success: true, data: request }
  } catch (error) {
    
    throw new Error("Failed to update equipment request")
  }
}

// Update equipment request status
export async function updateEquipmentRequestStatus(
  id: string,
  data: UpdateEquipmentRequestStatusInput
) {
  try {
    const authData = await auth()
    if (!authData?.userId) throw new Error("Unauthorized")

    const userEmail = authData?.sessionClaims?.email as string || ""
    
    // Check permissions based on status
    if (data.status === EquipmentRequestStatus.APPROVED || 
        data.status === EquipmentRequestStatus.REJECTED) {
      if (!(await hasPermission(Permission.EQUIPMENT_REQUEST_APPROVE))) {
        throw new Error("Insufficient permissions to approve/reject requests")
      }
    } else {
      if (!(await hasPermission(Permission.EQUIPMENT_REQUEST_EDIT))) {
        throw new Error("Insufficient permissions to update request status")
      }
    }

    // Validate input
    const validatedData = updateEquipmentRequestStatusSchema.parse(data)

    // Get current request
    const currentRequest = await prisma.equipmentRequest.findUnique({
      where: { id },
    })

    if (!currentRequest) {
      throw new Error("Equipment request not found")
    }

    // Build update data
    const updateData: Prisma.EquipmentRequestUpdateInput = {
      status: validatedData.status,
    }

    if (validatedData.internalNotes) {
      updateData.internalNotes = validatedData.internalNotes
    }

    if (data.status === EquipmentRequestStatus.APPROVED) {
      updateData.approvedBy = authData.userId
      updateData.approvedByEmail = userEmail
      updateData.approvedAt = new Date()
    } else if (data.status === EquipmentRequestStatus.REJECTED) {
      updateData.rejectedReason = validatedData.rejectedReason
    } else if (data.status === EquipmentRequestStatus.DELIVERED) {
      updateData.completedAt = new Date()
    }

    // Update request
    const request = await prisma.equipmentRequest.update({
      where: { id },
      data: updateData,
    })

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: authData.userId,
        action: `UPDATE_EQUIPMENT_REQUEST_STATUS_${data.status}`,
        entityType: "EquipmentRequest",
        entityId: id,
        changes: {
          oldStatus: currentRequest.status,
          newStatus: data.status,
          rejectedReason: validatedData.rejectedReason,
        },
      },
    })

    revalidatePath("/equipment-requests")
    revalidatePath(`/equipment-requests/${id}`)
    revalidatePath(`/houses/${request.propertyId}`)

    return { success: true, data: request }
  } catch (error) {
    
    throw new Error("Failed to update equipment request status")
  }
}

// Delete equipment request
export async function deleteEquipmentRequest(id: string) {
  try {
    const authData = await auth()
    if (!authData?.userId) throw new Error("Unauthorized")

    if (!(await hasPermission(Permission.EQUIPMENT_REQUEST_DELETE))) {
      throw new Error("Insufficient permissions")
    }

    // Get request
    const request = await prisma.equipmentRequest.findUnique({
      where: { id },
      select: {
        id: true,
        propertyId: true,
        status: true,
      },
    })

    if (!request) {
      throw new Error("Equipment request not found")
    }

    // Check if request can be deleted
    if (request.status !== EquipmentRequestStatus.PENDING &&
        request.status !== EquipmentRequestStatus.CANCELLED) {
      throw new Error("Can only delete pending or cancelled requests")
    }

    // Delete request
    await prisma.equipmentRequest.delete({
      where: { id },
    })

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: authData.userId,
        action: "DELETE_EQUIPMENT_REQUEST",
        entityType: "EquipmentRequest",
        entityId: id,
      },
    })

    revalidatePath("/equipment-requests")
    revalidatePath(`/houses/${request.propertyId}`)

    return { success: true }
  } catch (error) {
    
    throw new Error("Failed to delete equipment request")
  }
}