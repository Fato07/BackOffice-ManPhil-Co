"use client"

import { useState, useCallback, useMemo } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Check, DollarSign, Plus, X, Receipt, Home, Bed, Package, User, MessageCircle, Edit2, Trash2, Coins, Settings, Briefcase } from "lucide-react"
import { PropertySection } from "../../property-section"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import {
  createOperationalCostSchema,
  updateOperationalCostSchema,
} from "@/lib/validations/pricing"
import {
  useCreateOperationalCost,
  useUpdateOperationalCost,
  useDeleteOperationalCost,
} from "@/hooks/use-property-pricing"
import { OperationalCostsTable } from "./operational-costs-table"
import { OperationalCostDetailsModal } from "./operational-cost-details-modal"
import { EditOperationalCostModal } from "./edit-operational-cost-modal"
import type { OperationalCost, OperationalCostType, PriceType } from "@/generated/prisma"
import { z } from "zod"

type CreateOperationalCostFormData = z.infer<typeof createOperationalCostSchema>
type UpdateOperationalCostFormData = z.infer<typeof updateOperationalCostSchema>

interface OperationalCostsSectionProps {
  propertyId: string
  operationalCosts: OperationalCost[]
}

const OPERATIONAL_COST_TYPES: { 
  value: OperationalCostType; 
  label: string; 
  description: string; 
  icon: React.ReactNode;
  color: string;
}[] = [
  { 
    value: "HOUSEKEEPING", 
    label: "Housekeeping",
    description: "Regular cleaning and maintenance",
    icon: <Home className="w-4 h-4" />,
    color: "bg-blue-100 text-blue-600 border-blue-200"
  },
  { 
    value: "HOUSEKEEPING_AT_CHECKOUT", 
    label: "Housekeeping at checkout",
    description: "Final cleaning after guest departure",
    icon: <Package className="w-4 h-4" />,
    color: "bg-purple-100 text-purple-600 border-purple-200"
  },
  { 
    value: "LINEN_CHANGE", 
    label: "Linen change",
    description: "Bed linens and towel replacement",
    icon: <Bed className="w-4 h-4" />,
    color: "bg-green-100 text-green-600 border-green-200"
  },
  { 
    value: "OPERATIONAL_PACKAGE", 
    label: "Operational package",
    description: "Complete operational services bundle",
    icon: <Briefcase className="w-4 h-4" />,
    color: "bg-orange-100 text-orange-600 border-orange-200"
  },
]

const PRICE_TYPES: { 
  value: PriceType; 
  label: string;
  description: string;
}[] = [
  { value: "PER_STAY", label: "Per stay", description: "Charged once per booking" },
  { value: "PER_WEEK", label: "Per week", description: "Charged weekly" },
  { value: "PER_DAY", label: "Per day", description: "Charged daily" },
  { value: "FIXED", label: "Fixed", description: "Fixed amount" },
]

export function OperationalCostsSection({ propertyId, operationalCosts }: OperationalCostsSectionProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [selectedCost, setSelectedCost] = useState<OperationalCost | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [editingCost, setEditingCost] = useState<OperationalCost | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)

  const createOperationalCost = useCreateOperationalCost(propertyId)
  const updateOperationalCost = useUpdateOperationalCost(propertyId)
  const deleteOperationalCost = useDeleteOperationalCost(propertyId)

  // Simple memoization of statistics to prevent recalculation
  const stats = useMemo(() => {
    if (operationalCosts.length === 0) return null
    
    const totalEstimatedCost = operationalCosts.reduce((sum, cost) => sum + (cost.estimatedPrice || 0), 0)
    const totalPublicCost = operationalCosts.reduce((sum, cost) => sum + (cost.publicPrice || 0), 0)
    const costsByPaidBy = operationalCosts.reduce((acc, cost) => {
      const paidBy = cost.paidBy || "Unknown"
      acc[paidBy] = (acc[paidBy] || 0) + (cost.publicPrice || 0)
      return acc
    }, {} as Record<string, number>)
    
    return {
      total: operationalCosts.length,
      totalEstimatedCost,
      totalPublicCost,
      costsByPaidBy
    }
  }, [operationalCosts])

  const handleSave = async () => {
    setIsEditing(false)
  }

  const handleCancel = () => {
    setIsEditing(false)
    setIsAddingNew(false)
    setEditingId(null)
  }

  const handleEdit = useCallback((id: string) => {
    const cost = operationalCosts.find(c => c.id === id)
    if (cost) {
      setEditingCost(cost)
      setShowEditModal(true)
    }
  }, [operationalCosts])

  const handleDelete = useCallback((id: string) => {
    setDeletingId(id)
  }, [])

  const handleBulkDelete = async (ids: string[]) => {
    // Delete multiple costs
    for (const id of ids) {
      await deleteOperationalCost.mutateAsync(id)
    }
  }

  const handleViewDetails = useCallback((cost: OperationalCost) => {
    setSelectedCost(cost)
    setShowDetailsModal(true)
  }, [])


  return (
    <div className="space-y-6">
      <PropertySection
        title="Operational Costs"
        isEditing={isEditing}
        onEdit={() => setIsEditing(true)}
        onSave={handleSave}
        onCancel={handleCancel}
        className="border-rose-200 bg-rose-50/30"
        isSaving={createOperationalCost.isPending || updateOperationalCost.isPending || deleteOperationalCost.isPending}
      >
        <div className="mb-4">
          <div className="flex items-center gap-2 p-3 bg-rose-100 rounded-lg border border-rose-300">
            <Receipt className="w-5 h-5 text-rose-600" />
            <p className="text-sm text-rose-800">
              Define additional operational costs and fees to ensure transparent pricing.
            </p>
          </div>
        </div>

        {isEditing && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button
                variant="outline"
                className="border-2 border-dashed hover:border-rose-300 hover:bg-rose-50 transition-all"
                onClick={() => setIsAddingNew(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add New Cost
              </Button>
            </div>
            
            <p className="text-sm text-gray-600">
              Use the table below to manage your operational costs. You can add, edit, or delete costs as needed.
            </p>
          </div>
        )}
      </PropertySection>

      <div className="bg-white rounded-lg shadow-sm">
        <div className="px-6 py-6 space-y-6">
        {stats && !isEditing && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-4 bg-gradient-to-br from-white to-rose-50 border-rose-200 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-rose-100 rounded-lg">
                  <Receipt className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Costs</p>
                  <p className="text-2xl font-light text-gray-900">{stats.total}</p>
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-gradient-to-br from-white to-amber-50 border-amber-200 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <Coins className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Est. Total</p>
                  <p className="text-2xl font-light text-gray-900">€{stats.totalEstimatedCost.toLocaleString()}</p>
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-gradient-to-br from-white to-green-50 border-green-200 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <DollarSign className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Public Total</p>
                  <p className="text-2xl font-light text-gray-900">€{stats.totalPublicCost.toLocaleString()}</p>
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-gradient-to-br from-white to-blue-50 border-blue-200 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Payers</p>
                  <p className="text-2xl font-light text-gray-900">{Object.keys(stats.costsByPaidBy).length}</p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {stats && Object.keys(stats.costsByPaidBy).length > 0 && !isEditing && (
          <Card className="p-4 bg-gradient-to-br from-white to-gray-50">
            <h4 className="text-sm font-medium text-gray-600 mb-3">Cost Distribution by Payer</h4>
            <div className="flex flex-wrap gap-3">
              {Object.entries(stats.costsByPaidBy).map(([payer, amount]) => (
                <Badge key={payer} variant="secondary" className="px-4 py-2 text-sm">
                  <User className="w-3 h-3 mr-1" />
                  {payer}: €{amount.toLocaleString()}
                </Badge>
              ))}
            </div>
          </Card>
        )}

        <OperationalCostsTable
          operationalCosts={operationalCosts}
          isEditing={isEditing}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onBulkDelete={handleBulkDelete}
          onViewDetails={handleViewDetails}
        />
        </div>
      </div>

      <Dialog open={isAddingNew} onOpenChange={setIsAddingNew}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Operational Cost</DialogTitle>
            <DialogDescription>
              Define additional operational costs and fees to ensure transparent pricing.
            </DialogDescription>
          </DialogHeader>
          <AddOperationalCostForm
            onSave={async (data) => {
              await createOperationalCost.mutateAsync(data)
              setIsAddingNew(false)
            }}
            isSubmitting={createOperationalCost.isPending}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Operational Cost</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this operational cost? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                if (deletingId) {
                  await deleteOperationalCost.mutateAsync(deletingId)
                  setDeletingId(null)
                }
              }}
              disabled={deleteOperationalCost.isPending}
            >
              {deleteOperationalCost.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <OperationalCostDetailsModal
        cost={selectedCost}
        open={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false)
          setSelectedCost(null)
        }}
        onEdit={handleEdit}
      />

      <EditOperationalCostModal
        operationalCost={editingCost}
        open={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setEditingCost(null)
        }}
        propertyId={propertyId}
      />
    </div>
  )
}

// Component for displaying an operational cost in view mode
function OperationalCostViewCard({ cost }: { cost: OperationalCost }) {
  const costType = OPERATIONAL_COST_TYPES.find(t => t.value === cost.costType)
  const priceType = PRICE_TYPES.find(t => t.value === cost.priceType)

  return (
    <Card className="p-6 hover:shadow-md transition-shadow">
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={cn("p-2 rounded-lg", costType?.color || "bg-gray-100")}>
              {costType?.icon || <Receipt className="w-4 h-4" />}
            </div>
            <div>
              <h4 className="font-medium text-gray-900">{costType?.label || cost.costType}</h4>
              <p className="text-sm text-gray-600">{costType?.description}</p>
            </div>
          </div>
          <Badge variant="secondary" className="text-xs">
            {priceType?.label || cost.priceType}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-600">Estimated price</p>
            <p className="text-lg font-light text-gray-900">
              {cost.estimatedPrice ? `€${cost.estimatedPrice.toLocaleString()}` : "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-600">Public price</p>
            <p className="text-lg font-light text-emerald-600">
              {cost.publicPrice ? `€${cost.publicPrice.toLocaleString()}` : "—"}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-gray-400" />
            <p className="text-sm text-gray-600">
              Paid by <span className="font-medium text-gray-900">{cost.paidBy || "—"}</span>
            </p>
          </div>
          {cost.comment && (
            <div className="flex items-center gap-1 text-gray-500">
              <MessageCircle className="w-3 h-3" />
              <span className="text-xs">Note</span>
            </div>
          )}
        </div>

        {cost.comment && (
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">{cost.comment}</p>
          </div>
        )}
      </div>
    </Card>
  )
}

// Component for editing/displaying operational cost with inline editing
function OperationalCostCard({
  cost,
  isEditing,
  onEdit,
  onSave,
  onCancel,
  onDelete,
}: {
  cost: OperationalCost
  isEditing: boolean
  onEdit: () => void
  onSave: (data: UpdateOperationalCostFormData) => Promise<void>
  onCancel: () => void
  onDelete: () => void
}) {
  const form = useForm<UpdateOperationalCostFormData>({
    resolver: zodResolver(updateOperationalCostSchema),
    defaultValues: {
      costType: cost.costType,
      priceType: cost.priceType,
      estimatedPrice: cost.estimatedPrice,
      publicPrice: cost.publicPrice,
      paidBy: cost.paidBy,
      comment: cost.comment,
    },
  })

  const handleSubmit = form.handleSubmit(async (data) => {
    await onSave(data)
  })

  const costType = OPERATIONAL_COST_TYPES.find(t => t.value === cost.costType)

  if (isEditing) {
    return (
      <Card className="p-6 border-2 border-rose-300 bg-rose-50/30">
        <div className="space-y-6">
          <div className="flex items-start justify-between">
            <h4 className="text-lg font-medium text-gray-900">Edit Operational Cost</h4>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="gap-2 hover:bg-green-50 hover:text-green-700 hover:border-green-300"
                onClick={handleSubmit}
                disabled={form.formState.isSubmitting}
              >
                <Check className="w-4 h-4" />
                Save
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={onCancel}
              >
                Cancel
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label>Cost Type</Label>
              <Select
                value={form.watch("costType")}
                onValueChange={(value) => form.setValue("costType", value as OperationalCostType)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {OPERATIONAL_COST_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        {type.icon}
                        <span>{type.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Price Type</Label>
              <Select
                value={form.watch("priceType")}
                onValueChange={(value) => form.setValue("priceType", value as PriceType)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRICE_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Estimated Price</Label>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-lg font-light text-gray-500">€</span>
                <Input
                  type="number"
                  {...form.register("estimatedPrice", { valueAsNumber: true })}
                  placeholder="0"
                  className="text-lg font-light"
                />
              </div>
            </div>

            <div>
              <Label>Public Price</Label>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-lg font-light text-gray-500">€</span>
                <Input
                  type="number"
                  {...form.register("publicPrice", { valueAsNumber: true })}
                  placeholder="0"
                  className="text-lg font-light"
                />
              </div>
            </div>

            <div>
              <Label>Paid By</Label>
              <Select
                value={form.watch("paidBy") || ""}
                onValueChange={(value) => form.setValue("paidBy", value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select who pays" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ManPhil & Co">ManPhil & Co</SelectItem>
                  <SelectItem value="Guest">Guest</SelectItem>
                  <SelectItem value="Owner">Owner</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2">
              <Label>Comment (optional)</Label>
              <Textarea
                {...form.register("comment")}
                placeholder="Additional notes or details..."
                className="mt-1"
                rows={3}
              />
            </div>
          </div>
        </div>
      </Card>
    )
  }

  // Non-editing view
  const priceType = PRICE_TYPES.find(t => t.value === cost.priceType)

  return (
    <Card className="p-6 hover:shadow-md transition-shadow">
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={cn("p-2 rounded-lg", costType?.color || "bg-gray-100")}>
              {costType?.icon || <Receipt className="w-4 h-4" />}
            </div>
            <div>
              <h4 className="font-medium text-gray-900">{costType?.label || cost.costType}</h4>
              <p className="text-sm text-gray-600">{costType?.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {priceType?.label || cost.priceType}
            </Badge>
            <div className="flex gap-1">
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                onClick={onEdit}
              >
                <Edit2 className="w-4 h-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-red-600 hover:text-red-700"
                onClick={onDelete}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-600">Estimated price</p>
            <p className="text-lg font-light text-gray-900">
              {cost.estimatedPrice ? `€${cost.estimatedPrice.toLocaleString()}` : "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-600">Public price</p>
            <p className="text-lg font-light text-emerald-600">
              {cost.publicPrice ? `€${cost.publicPrice.toLocaleString()}` : "—"}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-gray-400" />
            <p className="text-sm text-gray-600">
              Paid by <span className="font-medium text-gray-900">{cost.paidBy || "—"}</span>
            </p>
          </div>
          {cost.comment && (
            <div className="flex items-center gap-1 text-gray-500">
              <MessageCircle className="w-3 h-3" />
              <span className="text-xs">Note</span>
            </div>
          )}
        </div>

        {cost.comment && (
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">{cost.comment}</p>
          </div>
        )}
      </div>
    </Card>
  )
}

// Component for adding a new operational cost (modal-friendly)
function AddOperationalCostForm({
  onSave,
  isSubmitting = false,
}: {
  onSave: (data: CreateOperationalCostFormData) => Promise<void>
  isSubmitting?: boolean
}) {
  const form = useForm<CreateOperationalCostFormData>({
    resolver: zodResolver(createOperationalCostSchema),
    defaultValues: {
      priceType: "PER_STAY",
    },
  })

  const handleSubmit = form.handleSubmit(async (data) => {
    await onSave(data)
  })

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6" id="add-operational-cost-form">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label>Cost Type</Label>
            <Select
              value={form.watch("costType")}
              onValueChange={(value) => form.setValue("costType", value as OperationalCostType)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select cost type" />
              </SelectTrigger>
              <SelectContent>
                {OPERATIONAL_COST_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex items-center gap-2">
                      {type.icon}
                      <span>{type.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Price Type</Label>
            <Select
              value={form.watch("priceType")}
              onValueChange={(value) => form.setValue("priceType", value as PriceType)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRICE_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Estimated Price (optional)</Label>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-lg font-light text-gray-500">€</span>
              <Input
                type="number"
                {...form.register("estimatedPrice", { valueAsNumber: true })}
                placeholder="0"
                className="text-lg font-light"
              />
            </div>
          </div>

          <div>
            <Label>Public Price</Label>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-lg font-light text-gray-500">€</span>
              <Input
                type="number"
                {...form.register("publicPrice", { valueAsNumber: true })}
                placeholder="0"
                className="text-lg font-light"
              />
            </div>
          </div>

          <div>
            <Label>Paid By</Label>
            <Select
              value={form.watch("paidBy") || ""}
              onValueChange={(value) => form.setValue("paidBy", value)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select who pays" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ManPhil & Co">ManPhil & Co</SelectItem>
                <SelectItem value="Guest">Guest</SelectItem>
                <SelectItem value="Owner">Owner</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="md:col-span-2">
            <Label>Comment (optional)</Label>
            <Textarea
              {...form.register("comment")}
              placeholder="Additional notes or details..."
              className="mt-1"
              rows={3}
            />
          </div>
        </div>

      </form>
      <DialogFooter>
        <Button
          type="submit"
          form="add-operational-cost-form"
          className="gap-2"
          disabled={isSubmitting}
        >
          <Check className="w-4 h-4" />
          {isSubmitting ? "Adding..." : "Add Cost"}
        </Button>
      </DialogFooter>
    </>
  )
}