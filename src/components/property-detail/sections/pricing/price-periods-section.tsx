"use client"

import { useState, useCallback, useMemo } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
import { CalendarIcon, Check, Edit2, Info, Plus, Trash2, X, DollarSign, Calendar as CalendarLucideIcon, TrendingUp, Percent, Shield, MoreHorizontal } from "lucide-react"
import { PropertySection } from "../../property-section"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  createPricingPeriodSchema,
  updatePricingPeriodSchema,
  calculatePublicPrice,
  calculateCommissionAmount,
} from "@/lib/validations/pricing"
import {
  useCreatePriceRange,
  useUpdatePriceRange,
  useDeletePriceRange,
  useMigrateLegacyPricing,
} from "@/hooks/use-property-pricing"
import { PricePeriodsTable } from "./price-periods-table"
import { PricePeriodDetailsModal } from "./price-period-details-modal"
import type { PriceRange } from "@/generated/prisma"
import { z } from "zod"

type CreatePriceRangeFormData = z.infer<typeof createPricingPeriodSchema>
type UpdatePriceRangeFormData = z.infer<typeof updatePricingPeriodSchema>

interface PricePeriodsSectionProps {
  propertyId: string
  priceRanges: PriceRange[]
  hasLegacyData?: boolean
}

export function PricePeriodsSection({ propertyId, priceRanges, hasLegacyData }: PricePeriodsSectionProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState<PriceRange | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)

  const createPriceRange = useCreatePriceRange(propertyId)
  const updatePriceRange = useUpdatePriceRange(propertyId)
  const deletePriceRange = useDeletePriceRange(propertyId)
  const migrateLegacy = useMigrateLegacyPricing(propertyId)

  // Check if any price ranges have legacy data
  const hasLegacy = priceRanges.some(pr => pr.nightlyRate !== null)
  
  // Simple memoization of statistics to prevent recalculation
  const stats = useMemo(() => {
    if (priceRanges.length === 0) return null
    
    const avgRate = Math.round(
      priceRanges.reduce((sum, pr) => sum + (pr.ownerNightlyRate || pr.nightlyRate || 0), 0) / priceRanges.length || 0
    )
    const peakRate = Math.max(...priceRanges.map(pr => pr.ownerNightlyRate || pr.nightlyRate || 0))
    const validatedCount = priceRanges.filter(pr => pr.isValidated).length
    
    return {
      total: priceRanges.length,
      avgRate,
      peakRate,
      validatedCount
    }
  }, [priceRanges])

  const handleSave = async () => {
    setIsEditing(false)
  }

  const handleCancel = () => {
    setIsEditing(false)
    setIsAddingNew(false)
    setEditingId(null)
  }

  const handleEdit = useCallback((id: string) => {
    const priceRange = priceRanges.find(range => range.id === id)
    if (priceRange) {
      setSelectedPeriod(priceRange)
      setShowDetailsModal(true)
    }
  }, [priceRanges])

  const handleDelete = useCallback((id: string) => {
    setDeletingId(id)
  }, [])

  const handleBulkDelete = async (ids: string[]) => {
    // Delete multiple price ranges
    for (const id of ids) {
      await deletePriceRange.mutateAsync(id)
    }
  }

  const handleBulkValidate = async (ids: string[]) => {
    // Validate multiple price ranges
    for (const id of ids) {
      const priceRange = priceRanges.find(pr => pr.id === id)
      if (priceRange && !priceRange.isValidated) {
        await updatePriceRange.mutateAsync({ 
          id, 
          data: { 
            name: priceRange.name,
            startDate: priceRange.startDate,
            endDate: priceRange.endDate,
            ownerNightlyRate: priceRange.ownerNightlyRate || priceRange.nightlyRate || 0,
            ownerWeeklyRate: priceRange.ownerWeeklyRate || priceRange.weeklyRate || 0,
            commissionRate: priceRange.commissionRate,
            isValidated: true 
          } 
        })
      }
    }
  }

  const handleViewDetails = useCallback((priceRange: PriceRange) => {
    setSelectedPeriod(priceRange)
    setShowDetailsModal(true)
  }, [])

  return (
    <div className="space-y-6">
      <PropertySection
        title="Pricing Periods"
        isEditing={isEditing}
        onEdit={() => setIsEditing(true)}
        onSave={handleSave}
        onCancel={handleCancel}
        className="border-emerald-200 bg-emerald-50/30"
        isSaving={createPriceRange.isPending || updatePriceRange.isPending || deletePriceRange.isPending}
      >
        <div className="mb-4">
          <div className="flex items-center gap-2 p-3 bg-emerald-100 rounded-lg border border-emerald-300">
            <CalendarIcon className="w-5 h-5 text-emerald-600" />
            <p className="text-sm text-emerald-800">
              Set seasonal pricing periods to optimize revenue throughout the year. Prices update within 2 hours.
            </p>
          </div>
        </div>

        {isEditing && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button
                variant="outline"
                className="border-2 border-dashed hover:border-emerald-300 hover:bg-emerald-50 transition-all"
                onClick={() => setIsAddingNew(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add New Period
              </Button>
            </div>
            
            <p className="text-sm text-gray-600">
              Use the table below to manage your pricing periods. You can add, edit, or delete periods as needed.
            </p>
          </div>
        )}
      </PropertySection>

      <div className="bg-white rounded-lg shadow-sm">
        <div className="px-6 py-6 space-y-6">
        {hasLegacy && (
          <Card className="p-4 bg-amber-50 border-amber-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  <Info className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-amber-900">Legacy Data Migration Required</p>
                  <p className="text-xs text-amber-700">Some pricing data needs to be migrated to the new format</p>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => migrateLegacy.mutate()}
                disabled={migrateLegacy.isPending}
                className="hover:bg-amber-100 hover:text-amber-700 hover:border-amber-300"
              >
                Migrate Data
              </Button>
            </div>
          </Card>
        )}

        {stats && !isEditing && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-4 bg-gradient-to-br from-white to-emerald-50 border-emerald-200 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <CalendarLucideIcon className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Periods</p>
                  <p className="text-2xl font-light text-gray-900">{stats.total}</p>
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-gradient-to-br from-white to-blue-50 border-blue-200 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <DollarSign className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Avg. Nightly Rate</p>
                  <p className="text-2xl font-light text-gray-900">
                    €{stats.avgRate.toLocaleString()}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-gradient-to-br from-white to-purple-50 border-purple-200 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Peak Rate</p>
                  <p className="text-2xl font-light text-gray-900">
                    €{stats.peakRate.toLocaleString()}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-gradient-to-br from-white to-orange-50 border-orange-200 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Shield className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Validated</p>
                  <p className="text-2xl font-light text-[#B5985A]">
                    {stats.validatedCount}/{stats.total}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        )}

        <PricePeriodsTable
          priceRanges={priceRanges}
          isEditing={isEditing}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onBulkDelete={handleBulkDelete}
          onBulkValidate={handleBulkValidate}
          onViewDetails={handleViewDetails}
        />
        </div>
      </div>

      <Dialog open={isAddingNew} onOpenChange={setIsAddingNew}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Pricing Period</DialogTitle>
            <DialogDescription>
              Define seasonal pricing to optimize your revenue throughout the year.
            </DialogDescription>
          </DialogHeader>
          <AddPricePeriodForm
            onSave={async (data) => {
              await createPriceRange.mutateAsync(data)
              setIsAddingNew(false)
            }}
            isSubmitting={createPriceRange.isPending}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Price Period</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this price period? This action cannot be undone.
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
                  await deletePriceRange.mutateAsync(deletingId)
                  setDeletingId(null)
                }
              }}
              disabled={deletePriceRange.isPending}
            >
              {deletePriceRange.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PricePeriodDetailsModal
        priceRange={selectedPeriod}
        open={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false)
          setSelectedPeriod(null)
        }}
        onEdit={handleEdit}
      />
    </div>
  )
}

// Component for displaying a price range in view mode
function PriceRangeViewCard({ priceRange }: { priceRange: PriceRange }) {
  const ownerNightly = priceRange.ownerNightlyRate || priceRange.nightlyRate || 0
  const ownerWeekly = priceRange.ownerWeeklyRate || priceRange.weeklyRate || 0
  const publicNightly = priceRange.publicNightlyRate || calculatePublicPrice(ownerNightly, priceRange.commissionRate)
  const publicWeekly = priceRange.publicWeeklyRate || (ownerWeekly ? calculatePublicPrice(ownerWeekly, priceRange.commissionRate) : 0)

  return (
    <Card className="p-6 hover:shadow-md transition-shadow">
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h4 className="text-lg font-medium text-gray-900">{priceRange.name}</h4>
              {priceRange.isValidated && (
                <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                  <Check className="w-3 h-3 mr-1" />
                  Validated
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <CalendarIcon className="w-4 h-4 text-gray-400" />
              <p className="text-sm text-gray-600">
                {format(new Date(priceRange.startDate), "dd MMM yyyy")} → {format(new Date(priceRange.endDate), "dd MMM yyyy")}
              </p>
            </div>
          </div>
          <Badge variant="secondary" className="text-[#B5985A] bg-amber-50 border-amber-200">
            {priceRange.commissionRate}% commission
          </Badge>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-gray-600">Owner price/night</p>
            <p className="text-xl font-light text-gray-900">€{ownerNightly.toLocaleString()}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-gray-600">Owner price/week</p>
            <p className="text-xl font-light text-gray-900">€{ownerWeekly.toLocaleString()}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-gray-600">Public price/night</p>
            <p className="text-xl font-light text-emerald-600">€{publicNightly.toLocaleString()}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-gray-600">Public price/week</p>
            <p className="text-xl font-light text-emerald-600">€{publicWeekly.toLocaleString()}</p>
          </div>
        </div>
      </div>
    </Card>
  )
}

// Component for editing/displaying price range with inline editing
function PriceRangeCard({
  priceRange,
  isEditing,
  onEdit,
  onSave,
  onCancel,
  onDelete,
}: {
  priceRange: PriceRange
  isEditing: boolean
  onEdit: () => void
  onSave: (data: UpdatePriceRangeFormData) => Promise<void>
  onCancel: () => void
  onDelete: () => void
}) {
  const form = useForm<UpdatePriceRangeFormData>({
    resolver: zodResolver(updatePricingPeriodSchema),
    defaultValues: {
      name: priceRange.name,
      startDate: new Date(priceRange.startDate),
      endDate: new Date(priceRange.endDate),
      ownerNightlyRate: priceRange.ownerNightlyRate || priceRange.nightlyRate || 0,
      ownerWeeklyRate: priceRange.ownerWeeklyRate || priceRange.weeklyRate || 0,
      commissionRate: priceRange.commissionRate,
      isValidated: priceRange.isValidated,
    },
  })

  const handleSubmit = form.handleSubmit(async (data) => {
    await onSave(data)
  })

  if (isEditing) {
    return (
      <Form {...form}>
        <Card className="p-6 border-2 border-emerald-300 bg-emerald-50/30">
          <div className="space-y-6">
          <div className="flex items-start justify-between">
            <div className="flex-1 space-y-4">
              <div>
                <Label htmlFor={`name-${priceRange.id}`}>Period Name</Label>
                <Input
                  id={`name-${priceRange.id}`}
                  {...form.register("name")}
                  className="max-w-sm mt-1"
                />
              </div>
              <div className="flex items-center space-x-3">
                <Checkbox
                  id={`validated-${priceRange.id}`}
                  checked={form.watch("isValidated")}
                  onCheckedChange={(checked) => form.setValue("isValidated", checked as boolean)}
                  className="data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                />
                <Label htmlFor={`validated-${priceRange.id}`} className="text-sm font-normal cursor-pointer">
                  Validated by owner
                </Label>
              </div>
            </div>
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

          <div className="space-y-4">
            <Label>Date Period</Label>
            <div className="flex items-center gap-3">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <Input
                      type="date"
                      value={field.value ? format(field.value, 'yyyy-MM-dd') : ''}
                      onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : undefined)}
                      className="w-[140px]"
                      min="1900-01-01"
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
              <span className="text-gray-500 mt-2">→</span>
              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <Input
                      type="date"
                      value={field.value ? format(field.value, 'yyyy-MM-dd') : ''}
                      onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : undefined)}
                      className="w-[140px]"
                      min={form.watch("startDate") ? format(form.watch("startDate")!, 'yyyy-MM-dd') : '1900-01-01'}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                Owner Prices
              </Label>
              <div className="grid grid-cols-2 gap-4 mt-3">
                <div>
                  <Label className="text-sm text-gray-600">Per night</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-lg font-light text-gray-500">€</span>
                    <Input
                      type="number"
                      {...form.register("ownerNightlyRate", { valueAsNumber: true })}
                      className="text-lg font-light"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Per week</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-lg font-light text-gray-500">€</span>
                    <Input
                      type="number"
                      {...form.register("ownerWeeklyRate", { valueAsNumber: true })}
                      className="text-lg font-light"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <Label className="flex items-center gap-2">
                <Percent className="w-4 h-4 text-emerald-600" />
                Commission Rate
              </Label>
              <div className="mt-3">
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    step="0.01"
                    {...form.register("commissionRate", { valueAsNumber: true })}
                    className="w-24 text-lg font-light"
                  />
                  <span className="text-lg font-light text-gray-500">%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 bg-white rounded-lg border border-emerald-200">
            <p className="text-sm font-medium text-gray-600 mb-3">Calculated Public Prices</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-600">Public price/night</p>
                <p className="text-xl font-light text-emerald-600">
                  €{calculatePublicPrice(form.watch("ownerNightlyRate") || 0, form.watch("commissionRate") || 25).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Public price/week</p>
                <p className="text-xl font-light text-emerald-600">
                  €{form.watch("ownerWeeklyRate") ? calculatePublicPrice(form.watch("ownerWeeklyRate") || 0, form.watch("commissionRate") || 25).toLocaleString() : 0}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>
      </Form>
    )
  }

  // Non-editing view
  const ownerNightly = priceRange.ownerNightlyRate || priceRange.nightlyRate || 0
  const ownerWeekly = priceRange.ownerWeeklyRate || priceRange.weeklyRate || 0
  const publicNightly = priceRange.publicNightlyRate || calculatePublicPrice(ownerNightly, priceRange.commissionRate)
  const publicWeekly = priceRange.publicWeeklyRate || (ownerWeekly ? calculatePublicPrice(ownerWeekly, priceRange.commissionRate) : 0)

  return (
    <Card className="p-6 hover:shadow-md transition-shadow">
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h4 className="text-lg font-medium text-gray-900">{priceRange.name}</h4>
              {priceRange.isValidated && (
                <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                  <Check className="w-3 h-3 mr-1" />
                  Validated
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <CalendarIcon className="w-4 h-4 text-gray-400" />
              <p className="text-sm text-gray-600">
                {format(new Date(priceRange.startDate), "dd MMM yyyy")} → {format(new Date(priceRange.endDate), "dd MMM yyyy")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-[#B5985A] bg-amber-50 border-amber-200">
              {priceRange.commissionRate}% commission
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

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-gray-600">Owner price/night</p>
            <p className="text-xl font-light text-gray-900">€{ownerNightly.toLocaleString()}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-gray-600">Owner price/week</p>
            <p className="text-xl font-light text-gray-900">€{ownerWeekly.toLocaleString()}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-gray-600">Public price/night</p>
            <p className="text-xl font-light text-emerald-600">€{publicNightly.toLocaleString()}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-gray-600">Public price/week</p>
            <p className="text-xl font-light text-emerald-600">€{publicWeekly.toLocaleString()}</p>
          </div>
        </div>
      </div>
    </Card>
  )
}

// Component for adding a new price period (modal-friendly)
function AddPricePeriodForm({
  onSave,
  isSubmitting = false,
}: {
  onSave: (data: CreatePriceRangeFormData) => Promise<void>
  isSubmitting?: boolean
}) {
  const form = useForm<CreatePriceRangeFormData>({
    resolver: zodResolver(createPricingPeriodSchema),
    defaultValues: {
      isValidated: true,
      commissionRate: 25,
      startDate: new Date(),
      endDate: new Date(new Date().setDate(new Date().getDate() + 30)),
    },
  })

  const handleSubmit = form.handleSubmit(async (data) => {
    await onSave(data)
  })

  return (
    <>
      <Form {...form}>
        <form onSubmit={handleSubmit} className="space-y-6" id="add-price-period-form">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="new-name">Period Name</Label>
            <Input
              id="new-name"
              {...form.register("name")}
              placeholder="e.g., High Season, Christmas Period"
              className="mt-1"
            />
          </div>

          <div>
            <Label>Validation Status</Label>
            <div className="flex items-center space-x-3 mt-3">
              <Checkbox
                id="new-validated"
                checked={form.watch("isValidated")}
                onCheckedChange={(checked) => form.setValue("isValidated", checked as boolean)}
                className="data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
              />
              <Label htmlFor="new-validated" className="text-sm font-normal cursor-pointer">
                Pre-validated by owner
              </Label>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <Label>Date Period</Label>
          <div className="flex items-center gap-3">
            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <Input
                    type="date"
                    value={field.value ? format(field.value, 'yyyy-MM-dd') : ''}
                    onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : undefined)}
                    className="w-[140px]"
                    min="1900-01-01"
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            <span className="text-gray-500 mt-2">→</span>
            <FormField
              control={form.control}
              name="endDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <Input
                    type="date"
                    value={field.value ? format(field.value, 'yyyy-MM-dd') : ''}
                    onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : undefined)}
                    className="w-[140px]"
                    min={form.watch("startDate") ? format(form.watch("startDate")!, 'yyyy-MM-dd') : '1900-01-01'}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              Owner Prices
            </Label>
            <div className="grid grid-cols-2 gap-4 mt-3">
              <div>
                <Label className="text-sm text-gray-600">Per night</Label>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-lg font-light text-gray-500">€</span>
                  <Input
                    type="number"
                    {...form.register("ownerNightlyRate", { valueAsNumber: true })}
                    placeholder="0"
                    className="text-lg font-light"
                  />
                </div>
              </div>
              <div>
                <Label className="text-sm text-gray-600">Per week</Label>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-lg font-light text-gray-500">€</span>
                  <Input
                    type="number"
                    {...form.register("ownerWeeklyRate", { valueAsNumber: true })}
                    placeholder="0"
                    className="text-lg font-light"
                  />
                </div>
              </div>
            </div>
          </div>

          <div>
            <Label className="flex items-center gap-2">
              <Percent className="w-4 h-4 text-emerald-600" />
              Commission Rate
            </Label>
            <div className="mt-3">
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  step="0.01"
                  {...form.register("commissionRate", { valueAsNumber: true })}
                  className="w-24 text-lg font-light"
                />
                <span className="text-lg font-light text-gray-500">%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 bg-white rounded-lg border border-emerald-200">
          <p className="text-sm font-medium text-gray-600 mb-3">Calculated Public Prices</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-600">Public price/night</p>
              <p className="text-xl font-light text-emerald-600">
                €{calculatePublicPrice(form.watch("ownerNightlyRate") || 0, form.watch("commissionRate") || 25).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Public price/week</p>
              <p className="text-xl font-light text-emerald-600">
                €{form.watch("ownerWeeklyRate") ? calculatePublicPrice(form.watch("ownerWeeklyRate") || 0, form.watch("commissionRate") || 25).toLocaleString() : 0}
              </p>
            </div>
          </div>
        </div>

        </form>
      </Form>
      <DialogFooter>
        <Button
          type="submit"
          form="add-price-period-form"
          className="gap-2"
          disabled={isSubmitting}
        >
          <Check className="w-4 h-4" />
          {isSubmitting ? "Adding..." : "Add Period"}
        </Button>
      </DialogFooter>
    </>
  )
}

