'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'
import { requirePermission } from '@/lib/auth'
import { Permission } from '@/types/auth'
import { auth } from '@clerk/nextjs/server'
import {
  createAvailabilityRequestSchema,
  updateAvailabilityRequestStatusSchema,
  availabilityRequestFiltersSchema,
  deleteAvailabilityRequestSchema,
  type CreateAvailabilityRequestInput,
  type UpdateAvailabilityRequestStatusInput,
  type AvailabilityRequestFilters,
  type DeleteAvailabilityRequestInput,
} from '@/lib/validations/availability-request'

interface ActionResult<T> {
  success: boolean
  data?: T
  error?: string
}

/**
 * Creates a new availability request
 */
export async function createAvailabilityRequest(
  input: CreateAvailabilityRequestInput
): Promise<ActionResult<any>> {
  try {
    // Authentication check
    const { userId } = await auth()
    if (!userId) {
      return { success: false, error: 'Unauthorized' }
    }

    // Permission check - allow all authenticated users to create requests
    // No specific permission required as this might be used by property owners or guests

    // Validate input
    const validated = createAvailabilityRequestSchema.parse(input)

    // Check if property exists
    const property = await prisma.property.findUnique({
      where: { id: validated.propertyId },
      select: { id: true, name: true },
    })

    if (!property) {
      return { success: false, error: 'Property not found' }
    }

    // Create the availability request
    const availabilityRequest = await prisma.availabilityRequest.create({
      data: {
        propertyId: validated.propertyId,
        startDate: validated.startDate,
        endDate: validated.endDate,
        guestName: validated.guestName,
        guestEmail: validated.guestEmail,
        guestPhone: validated.guestPhone,
        numberOfGuests: validated.numberOfGuests,
        urgency: validated.urgency,
        message: validated.message,
        requestedBy: userId,
      },
      include: {
        property: {
          select: { id: true, name: true }
        }
      }
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'create',
        entityType: 'AvailabilityRequest',
        entityId: availabilityRequest.id,
        changes: {
          created: availabilityRequest,
          propertyName: property.name,
          summary: `Created availability request for ${property.name}`,
          startDate: validated.startDate.toISOString(),
          endDate: validated.endDate.toISOString(),
          numberOfGuests: validated.numberOfGuests,
        },
      },
    })

    // Revalidate paths
    revalidatePath(`/houses/${validated.propertyId}`)
    revalidatePath('/availability-requests')

    return { success: true, data: availabilityRequest }
  } catch (error) {
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create availability request' 
    }
  }
}

/**
 * Fetches availability requests with filtering and pagination
 */
export async function getAvailabilityRequests(
  filters: AvailabilityRequestFilters
): Promise<ActionResult<any>> {
  try {
    // Authentication check
    const { userId } = await auth()
    if (!userId) {
      return { success: false, error: 'Unauthorized' }
    }

    // Permission check for viewing requests
    await requirePermission(Permission.PROPERTY_VIEW)

    // Validate filters
    const validated = availabilityRequestFiltersSchema.parse(filters)

    // Build where clause
    const where: any = {}
    
    if (validated.propertyId) {
      where.propertyId = validated.propertyId
    }
    
    if (validated.status) {
      where.status = validated.status
    }
    
    if (validated.urgency) {
      where.urgency = validated.urgency
    }
    
    if (validated.startDate && validated.endDate) {
      where.AND = [
        { startDate: { gte: validated.startDate } },
        { endDate: { lte: validated.endDate } }
      ]
    } else if (validated.startDate) {
      where.startDate = { gte: validated.startDate }
    } else if (validated.endDate) {
      where.endDate = { lte: validated.endDate }
    }

    // Calculate pagination
    const skip = (validated.page - 1) * validated.limit
    const take = validated.limit

    // Fetch requests with count
    const [requests, total] = await Promise.all([
      prisma.availabilityRequest.findMany({
        where,
        orderBy: { [validated.sortBy]: validated.sortOrder },
        skip,
        take,
        include: {
          property: {
            select: { id: true, name: true }
          }
        }
      }),
      prisma.availabilityRequest.count({ where })
    ])

    const totalPages = Math.ceil(total / validated.limit)

    return {
      success: true,
      data: {
        requests,
        pagination: {
          page: validated.page,
          limit: validated.limit,
          total,
          totalPages,
        }
      }
    }
  } catch (error) {
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch availability requests' 
    }
  }
}

/**
 * Updates the status of an availability request (confirm/reject)
 */
export async function updateAvailabilityRequestStatus(
  input: UpdateAvailabilityRequestStatusInput
): Promise<ActionResult<any>> {
  try {
    // Authentication check
    const { userId } = await auth()
    if (!userId) {
      return { success: false, error: 'Unauthorized' }
    }

    // Permission check
    await requirePermission(Permission.PROPERTY_EDIT)

    // Validate input
    const validated = updateAvailabilityRequestStatusSchema.parse(input)

    // Check if request exists
    const existingRequest = await prisma.availabilityRequest.findUnique({
      where: { id: validated.id },
      include: {
        property: {
          select: { id: true, name: true }
        }
      }
    })

    if (!existingRequest) {
      return { success: false, error: 'Availability request not found' }
    }

    // Update the request
    const updatedRequest = await prisma.availabilityRequest.update({
      where: { id: validated.id },
      data: { status: validated.status },
      include: {
        property: {
          select: { id: true, name: true }
        }
      }
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'update',
        entityType: 'AvailabilityRequest',
        entityId: validated.id,
        changes: {
          updated: updatedRequest,
          propertyName: existingRequest.property.name,
          summary: `${validated.status.toLowerCase()} availability request for ${existingRequest.property.name}`,
          previousStatus: existingRequest.status,
          newStatus: validated.status,
          guestName: existingRequest.guestName,
          startDate: existingRequest.startDate.toISOString(),
          endDate: existingRequest.endDate.toISOString(),
        },
      },
    })

    // Revalidate paths
    revalidatePath(`/houses/${existingRequest.propertyId}`)
    revalidatePath('/availability-requests')

    return { success: true, data: updatedRequest }
  } catch (error) {
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update availability request status' 
    }
  }
}

/**
 * Deletes an availability request
 */
export async function deleteAvailabilityRequest(
  input: DeleteAvailabilityRequestInput
): Promise<ActionResult<void>> {
  try {
    // Authentication check
    const { userId } = await auth()
    if (!userId) {
      return { success: false, error: 'Unauthorized' }
    }

    // Permission check
    await requirePermission(Permission.PROPERTY_EDIT)

    // Validate input
    const validated = deleteAvailabilityRequestSchema.parse(input)

    // Check if request exists
    const existingRequest = await prisma.availabilityRequest.findUnique({
      where: { id: validated.id },
      include: {
        property: {
          select: { id: true, name: true }
        }
      }
    })

    if (!existingRequest) {
      return { success: false, error: 'Availability request not found' }
    }

    // Delete the request
    await prisma.availabilityRequest.delete({
      where: { id: validated.id }
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'delete',
        entityType: 'AvailabilityRequest',
        entityId: validated.id,
        changes: {
          deleted: existingRequest,
          propertyName: existingRequest.property.name,
          summary: `Deleted availability request for ${existingRequest.property.name}`,
          guestName: existingRequest.guestName,
          startDate: existingRequest.startDate.toISOString(),
          endDate: existingRequest.endDate.toISOString(),
          status: existingRequest.status,
        },
      },
    })

    // Revalidate paths
    revalidatePath(`/houses/${existingRequest.propertyId}`)
    revalidatePath('/availability-requests')

    return { success: true }
  } catch (error) {
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to delete availability request' 
    }
  }
}

/**
 * Gets a single availability request by ID
 */
export async function getAvailabilityRequestById(
  id: string
): Promise<ActionResult<any>> {
  try {
    // Authentication check
    const { userId } = await auth()
    if (!userId) {
      return { success: false, error: 'Unauthorized' }
    }

    // Permission check
    await requirePermission(Permission.PROPERTY_VIEW)

    const request = await prisma.availabilityRequest.findUnique({
      where: { id },
      include: {
        property: {
          select: { id: true, name: true }
        }
      }
    })

    if (!request) {
      return { success: false, error: 'Availability request not found' }
    }

    return { success: true, data: request }
  } catch (error) {
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch availability request' 
    }
  }
}