import { EquipmentRequestStatus, EquipmentRequestPriority, EquipmentRequest as PrismaEquipmentRequest } from "@/generated/prisma"
import { z } from "zod"

// Equipment request item type
export interface EquipmentRequestItem {
  name: string
  quantity: number
  description?: string
  estimatedCost?: number
  link?: string
}

// Extended equipment request type with relations
export interface EquipmentRequest extends Omit<PrismaEquipmentRequest, 'items'> {
  property: {
    id: string
    name: string
    destination: {
      id: string
      name: string
      country: string
    }
  }
  room?: {
    id: string
    name: string
  } | null
  items: EquipmentRequestItem[]
}

// List item for table display
export interface EquipmentRequestListItem {
  id: string
  propertyId: string
  propertyName: string
  destinationName: string
  roomId: string | null
  roomName: string | null
  requestedBy: string
  requestedByEmail: string
  status: EquipmentRequestStatus
  priority: EquipmentRequestPriority
  itemCount: number
  reason: string | null
  createdAt: Date
  updatedAt: Date
  approvedAt: Date | null
  completedAt: Date | null
}

// Filter options
export interface EquipmentRequestFilters {
  search?: string
  status?: EquipmentRequestStatus | "ALL"
  priority?: EquipmentRequestPriority | "ALL"
  propertyId?: string
  destinationId?: string
  dateFrom?: Date
  dateTo?: Date
}

// Validation schemas
export const equipmentRequestItemSchema = z.object({
  name: z.string().min(1, "Item name is required"),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
  description: z.string().optional(),
  estimatedCost: z.number().positive().optional(),
  link: z.string().url().optional().or(z.literal("")),
})

export const createEquipmentRequestSchema = z.object({
  propertyId: z.string().min(1, "Property is required"),
  roomId: z.string().optional(),
  priority: z.nativeEnum(EquipmentRequestPriority),
  items: z.array(equipmentRequestItemSchema).min(1, "At least one item is required"),
  reason: z.string().optional(),
  notes: z.string().optional(),
})

export const updateEquipmentRequestSchema = z.object({
  priority: z.nativeEnum(EquipmentRequestPriority).optional(),
  items: z.array(equipmentRequestItemSchema).min(1, "At least one item is required").optional(),
  reason: z.string().optional(),
  notes: z.string().optional(),
  internalNotes: z.string().optional(),
})

export const updateEquipmentRequestStatusSchema = z.object({
  status: z.nativeEnum(EquipmentRequestStatus),
  rejectedReason: z.string().optional(),
  internalNotes: z.string().optional(),
})

// Form types
export type CreateEquipmentRequestInput = z.infer<typeof createEquipmentRequestSchema>
export type UpdateEquipmentRequestInput = z.infer<typeof updateEquipmentRequestSchema>
export type UpdateEquipmentRequestStatusInput = z.infer<typeof updateEquipmentRequestStatusSchema>

// Export enums for convenience
export { EquipmentRequestStatus, EquipmentRequestPriority }