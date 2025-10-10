"use client"

import { useState, useCallback, useMemo } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
import { CalendarIcon, Check, ChevronDown, Edit2, Info, Plus, Trash2, X, Clock, Calendar, History, Moon } from "lucide-react"
import { PropertySection } from "../../property-section"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  createMinimumStayRuleSchema,
  updateMinimumStayRuleSchema,
} from "@/lib/validations/pricing"
import {
  useCreateMinimumStayRule,
  useUpdateMinimumStayRule,
  useDeleteMinimumStayRule,
} from "@/hooks/use-property-pricing"
import { MinimumStayTable } from "./minimum-stay-table"
import { MinimumStayDetailsModal } from "./minimum-stay-details-modal"
import { EditMinimumStayModal } from "./edit-minimum-stay-modal"
import type { MinimumStayRule, BookingCondition } from "@/generated/prisma"
import { z } from "zod"

type CreateMinimumStayRuleFormData = z.infer<typeof createMinimumStayRuleSchema>
type UpdateMinimumStayRuleFormData = z.infer<typeof updateMinimumStayRuleSchema>

interface MinimumStaySectionProps {
  propertyId: string
  minimumStayRules: MinimumStayRule[]
}

const BOOKING_CONDITIONS: { value: BookingCondition; label: string; description: string; icon: React.ReactNode }[] = [
  { 
    value: "PER_NIGHT", 
    label: "Per night",
    description: "Flexible daily bookings",
    icon: <Moon className="w-4 h-4" />
  },
  { 
    value: "WEEKLY_SATURDAY_TO_SATURDAY", 
    label: "Weekly - Saturday to Saturday",
    description: "Saturday check-in/out only",
    icon: <Calendar className="w-4 h-4" />
  },
  { 
    value: "WEEKLY_SUNDAY_TO_SUNDAY", 
    label: "Weekly - Sunday to Sunday",
    description: "Sunday check-in/out only",
    icon: <Calendar className="w-4 h-4" />
  },
  { 
    value: "WEEKLY_MONDAY_TO_MONDAY", 
    label: "Weekly - Monday to Monday",
    description: "Monday check-in/out only",
    icon: <Calendar className="w-4 h-4" />
  },
]

export function MinimumStaySection({ propertyId, minimumStayRules }: MinimumStaySectionProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showHistory, setShowHistory] = useState(false)
  const [selectedRule, setSelectedRule] = useState<MinimumStayRule | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [editingRule, setEditingRule] = useState<MinimumStayRule | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)

  const createMinimumStayRule = useCreateMinimumStayRule(propertyId)
  const updateMinimumStayRule = useUpdateMinimumStayRule(propertyId)
  const deleteMinimumStayRule = useDeleteMinimumStayRule(propertyId)

  // Simple memoization of statistics to prevent recalculation
  const stats = useMemo(() => {
    if (minimumStayRules.length === 0) return null
    
    const minNights = Math.min(...minimumStayRules.map(r => r.minimumNights))
    const yearRoundCount = minimumStayRules.filter(r => !r.startDate || !r.endDate).length
    
    return {
      total: minimumStayRules.length,
      minNights,
      yearRoundCount
    }
  }, [minimumStayRules])

  const handleSave = async () => {
    setIsEditing(false)
  }

  const handleCancel = () => {
    setIsEditing(false)
    setIsAddingNew(false)
    setEditingId(null)
  }

  const handleEdit = useCallback((id: string) => {
    const rule = minimumStayRules.find(r => r.id === id)
    if (rule) {
      setEditingRule(rule)
      setShowEditModal(true)
    }
  }, [minimumStayRules])

  const handleDelete = useCallback((id: string) => {
    setDeletingId(id)
  }, [])

  const handleBulkDelete = async (ids: string[]) => {
    // Delete multiple rules
    for (const id of ids) {
      await deleteMinimumStayRule.mutateAsync(id)
    }
  }

  const handleViewDetails = useCallback((rule: MinimumStayRule) => {
    setSelectedRule(rule)
    setShowDetailsModal(true)
  }, [])

  return (
    <div className="space-y-6">
      <PropertySection
        title="Minimum Stay Requirements"
        isEditing={isEditing}
        onEdit={() => setIsEditing(true)}
        onSave={handleSave}
        onCancel={handleCancel}
        className="border-indigo-200 bg-indigo-50/30"
        isSaving={createMinimumStayRule.isPending || updateMinimumStayRule.isPending || deleteMinimumStayRule.isPending}
      >
        <div className="mb-4">
          <div className="flex items-center gap-2 p-3 bg-indigo-100 rounded-lg border border-indigo-300">
            <Clock className="w-5 h-5 text-indigo-600" />
            <p className="text-sm text-indigo-800">
              Set minimum stay requirements to optimize occupancy and reduce turnover costs.
            </p>
          </div>
        </div>

        {isEditing && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button
                variant="outline"
                className="border-2 border-dashed hover:border-indigo-300 hover:bg-indigo-50 transition-all"
                onClick={() => setIsAddingNew(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add New Rule
              </Button>
            </div>
            
            <p className="text-sm text-gray-600">
              Use the table below to manage your minimum stay rules. You can add, edit, or delete rules as needed.
            </p>
          </div>
        )}
      </PropertySection>

      <div className="bg-white rounded-lg shadow-sm">
        <div className="px-6 py-6 space-y-6">
        {stats && !isEditing && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="p-4 bg-gradient-to-br from-white to-indigo-50 border-indigo-200 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Clock className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Active Rules</p>
                  <p className="text-2xl font-light text-gray-900">{stats.total}</p>
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-gradient-to-br from-white to-purple-50 border-purple-200 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Moon className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Min. Nights</p>
                  <p className="text-2xl font-light text-gray-900">{stats.minNights}</p>
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-gradient-to-br from-white to-blue-50 border-blue-200 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Calendar className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Year-round Rules</p>
                  <p className="text-2xl font-light text-gray-900">{stats.yearRoundCount}</p>
                </div>
              </div>
            </Card>
          </div>
        )}

        <MinimumStayTable
          minimumStayRules={minimumStayRules}
          isEditing={isEditing}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onBulkDelete={handleBulkDelete}
          onViewDetails={handleViewDetails}
        />
        </div>
      </div>

      <Dialog open={isAddingNew} onOpenChange={setIsAddingNew}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Minimum Stay Rule</DialogTitle>
            <DialogDescription>
              Set minimum stay requirements to optimize occupancy and reduce turnover costs.
            </DialogDescription>
          </DialogHeader>
          <AddMinimumStayRuleForm
            onSave={async (data) => {
              await createMinimumStayRule.mutateAsync(data)
              setIsAddingNew(false)
            }}
            isSubmitting={createMinimumStayRule.isPending}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Minimum Stay Rule</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this minimum stay rule? This action cannot be undone.
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
                  await deleteMinimumStayRule.mutateAsync(deletingId)
                  setDeletingId(null)
                }
              }}
              disabled={deleteMinimumStayRule.isPending}
            >
              {deleteMinimumStayRule.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <MinimumStayDetailsModal
        rule={selectedRule}
        open={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false)
          setSelectedRule(null)
        }}
        onEdit={handleEdit}
      />

      <EditMinimumStayModal
        minimumStayRule={editingRule}
        open={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setEditingRule(null)
        }}
        propertyId={propertyId}
      />
    </div>
  )
}

// Component for displaying a minimum stay rule in view mode
function MinimumStayRuleViewCard({ rule }: { rule: MinimumStayRule }) {
  const condition = BOOKING_CONDITIONS.find(c => c.value === rule.bookingCondition)

  return (
    <Card className="p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              {condition?.icon || <Calendar className="w-4 h-4 text-indigo-600" />}
            </div>
            <div>
              <h4 className="font-medium text-gray-900">{condition?.label || rule.bookingCondition}</h4>
              <p className="text-sm text-gray-600">{condition?.description}</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400" />
              <p className="text-sm">
                <span className="font-medium text-gray-900">{rule.minimumNights}</span>
                <span className="text-gray-600"> night{rule.minimumNights > 1 ? 's' : ''} minimum</span>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-gray-400" />
              <p className="text-sm text-gray-600">
                {rule.startDate && rule.endDate
                  ? `${format(new Date(rule.startDate), "dd MMM yyyy")} → ${format(new Date(rule.endDate), "dd MMM yyyy")}`
                  : "All year round"}
              </p>
            </div>
          </div>
        </div>
        
        {rule.startDate && rule.endDate && (
          <Badge variant="secondary" className="bg-indigo-100 text-indigo-800 border-indigo-200">
            Seasonal
          </Badge>
        )}
      </div>
    </Card>
  )
}

// Component for editing/displaying minimum stay rule with inline editing
function MinimumStayRuleCard({
  rule,
  isEditing,
  onEdit,
  onSave,
  onCancel,
  onDelete,
}: {
  rule: MinimumStayRule
  isEditing: boolean
  onEdit: () => void
  onSave: (data: UpdateMinimumStayRuleFormData) => Promise<void>
  onCancel: () => void
  onDelete: () => void
}) {
  const form = useForm<UpdateMinimumStayRuleFormData>({
    resolver: zodResolver(updateMinimumStayRuleSchema),
    defaultValues: {
      bookingCondition: rule.bookingCondition,
      minimumNights: rule.minimumNights,
      startDate: rule.startDate ? new Date(rule.startDate) : undefined,
      endDate: rule.endDate ? new Date(rule.endDate) : undefined,
    },
  })

  const handleSubmit = form.handleSubmit(async (data) => {
    await onSave(data)
  })

  const condition = BOOKING_CONDITIONS.find(c => c.value === rule.bookingCondition)

  if (isEditing) {
    return (
      <Form {...form}>
        <Card className="p-6 border-2 border-indigo-300 bg-indigo-50/30">
        <div className="space-y-6">
          <div className="flex items-start justify-between">
            <h4 className="text-lg font-medium text-gray-900">Edit Minimum Stay Rule</h4>
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

          <div>
            <Label>Booking Condition</Label>
            <Select
              value={form.watch("bookingCondition")}
              onValueChange={(value) => form.setValue("bookingCondition", value as BookingCondition)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BOOKING_CONDITIONS.map((condition) => (
                  <SelectItem key={condition.value} value={condition.value}>
                    <div className="flex items-center gap-2">
                      {condition.icon}
                      <span>{condition.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Minimum Nights</Label>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex items-center border rounded-md">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-10 px-3 rounded-r-none"
                  onClick={() => {
                    const current = form.watch("minimumNights") || 1
                    if (current > 1) form.setValue("minimumNights", current - 1)
                  }}
                >
                  -
                </Button>
                <Input
                  type="number"
                  {...form.register("minimumNights", { valueAsNumber: true })}
                  className="h-10 w-20 text-center border-0 rounded-none"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-10 px-3 rounded-l-none"
                  onClick={() => {
                    const current = form.watch("minimumNights") || 1
                    form.setValue("minimumNights", current + 1)
                  }}
                >
                  +
                </Button>
              </div>
              <span className="text-sm text-gray-600">night(s) minimum stay</span>
            </div>
          </div>

          <div>
            <Label>Applicable Period (optional)</Label>
            <div className="flex items-center gap-3 mt-2">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <Input
                      type="date"
                      value={field.value ? format(field.value, 'yyyy-MM-dd') : ''}
                      onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : null)}
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
                      onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : null)}
                      className="w-[140px]"
                      min={form.watch("startDate") ? format(form.watch("startDate")!, 'yyyy-MM-dd') : '1900-01-01'}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Leave empty to apply all year round</p>
          </div>
        </div>
      </Card>
      </Form>
    )
  }

  // Non-editing view
  return (
    <Card className="p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              {condition?.icon || <Calendar className="w-4 h-4 text-indigo-600" />}
            </div>
            <div>
              <h4 className="font-medium text-gray-900">{condition?.label || rule.bookingCondition}</h4>
              <p className="text-sm text-gray-600">{condition?.description}</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400" />
              <p className="text-sm">
                <span className="font-medium text-gray-900">{rule.minimumNights}</span>
                <span className="text-gray-600"> night{rule.minimumNights > 1 ? 's' : ''} minimum</span>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-gray-400" />
              <p className="text-sm text-gray-600">
                {rule.startDate && rule.endDate
                  ? `${format(new Date(rule.startDate), "dd MMM yyyy")} → ${format(new Date(rule.endDate), "dd MMM yyyy")}`
                  : "All year round"}
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {rule.startDate && rule.endDate && (
            <Badge variant="secondary" className="bg-indigo-100 text-indigo-800 border-indigo-200">
              Seasonal
            </Badge>
          )}
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
    </Card>
  )
}

// Component for adding a new minimum stay rule
function AddMinimumStayRuleForm({
  onSave,
  isSubmitting = false,
}: {
  onSave: (data: CreateMinimumStayRuleFormData) => Promise<void>
  isSubmitting?: boolean
}) {
  const form = useForm<CreateMinimumStayRuleFormData>({
    resolver: zodResolver(createMinimumStayRuleSchema),
    defaultValues: {
      bookingCondition: "PER_NIGHT",
      minimumNights: 1,
    },
  })

  const handleSubmit = form.handleSubmit(async (data) => {
    await onSave(data)
  })

  return (
    <>
      <Form {...form}>
        <form onSubmit={handleSubmit} className="space-y-6" id="add-minimum-stay-form">

        <div>
          <Label>Booking Condition</Label>
          <Select
            value={form.watch("bookingCondition")}
            onValueChange={(value) => form.setValue("bookingCondition", value as BookingCondition)}
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {BOOKING_CONDITIONS.map((condition) => (
                <SelectItem key={condition.value} value={condition.value}>
                  <div className="flex items-center gap-2">
                    {condition.icon}
                    <span>{condition.label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Minimum Nights</Label>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex items-center border rounded-md">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-10 px-3 rounded-r-none"
                onClick={() => {
                  const current = form.watch("minimumNights") || 1
                  if (current > 1) form.setValue("minimumNights", current - 1)
                }}
              >
                -
              </Button>
              <Input
                type="number"
                {...form.register("minimumNights", { valueAsNumber: true })}
                className="h-10 w-20 text-center border-0 rounded-none"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-10 px-3 rounded-l-none"
                onClick={() => {
                  const current = form.watch("minimumNights") || 1
                  form.setValue("minimumNights", current + 1)
                }}
              >
                +
              </Button>
            </div>
            <span className="text-sm text-gray-600">night(s) minimum stay</span>
          </div>
        </div>

        <div>
          <Label>Applicable Period (optional)</Label>
          <div className="flex items-center gap-3 mt-2">
            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <Input
                    type="date"
                    value={field.value ? format(field.value, 'yyyy-MM-dd') : ''}
                    onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : null)}
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
                    onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : null)}
                    className="w-[140px]"
                    min={form.watch("startDate") ? format(form.watch("startDate")!, 'yyyy-MM-dd') : '1900-01-01'}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">Leave empty to apply all year round</p>
        </div>

        </form>
      </Form>
      <DialogFooter>
        <Button
          type="submit"
          form="add-minimum-stay-form"
          className="gap-2"
          disabled={isSubmitting}
        >
          <Check className="w-4 h-4" />
          {isSubmitting ? "Adding..." : "Add Rule"}
        </Button>
      </DialogFooter>
    </>
  )
}

