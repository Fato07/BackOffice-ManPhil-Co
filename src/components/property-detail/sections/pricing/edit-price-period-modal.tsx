"use client"

import { useState, useTransition, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
import { DollarSign, Percent, Check, X, Loader2 } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { updatePricingPeriodSchema, calculatePublicPrice } from "@/lib/validations/pricing"
import { useUpdatePriceRange } from "@/hooks/use-property-pricing"
import type { PriceRange } from "@/generated/prisma"
import { z } from "zod"
import { toast } from "sonner"

type UpdatePricingPeriodFormData = z.infer<typeof updatePricingPeriodSchema>

interface EditPricePeriodModalProps {
  priceRange: PriceRange | null
  open: boolean
  onClose: () => void
  propertyId: string
}

export function EditPricePeriodModal({
  priceRange,
  open,
  onClose,
  propertyId
}: EditPricePeriodModalProps) {
  const [isPending, startTransition] = useTransition()
  const updatePriceRange = useUpdatePriceRange(propertyId)

  const form = useForm<UpdatePricingPeriodFormData>({
    resolver: zodResolver(updatePricingPeriodSchema),
    defaultValues: priceRange ? {
      name: priceRange.name,
      startDate: new Date(priceRange.startDate),
      endDate: new Date(priceRange.endDate),
      ownerNightlyRate: priceRange.ownerNightlyRate || priceRange.nightlyRate || 0,
      ownerWeeklyRate: priceRange.ownerWeeklyRate || priceRange.weeklyRate || undefined,
      commissionRate: priceRange.commissionRate,
      isValidated: priceRange.isValidated,
    } : {},
  })

  // Reset form when priceRange changes
  useEffect(() => {
    if (priceRange) {
      form.reset({
        name: priceRange.name,
        startDate: new Date(priceRange.startDate),
        endDate: new Date(priceRange.endDate),
        ownerNightlyRate: priceRange.ownerNightlyRate || priceRange.nightlyRate || 0,
        ownerWeeklyRate: priceRange.ownerWeeklyRate || priceRange.weeklyRate || undefined,
        commissionRate: priceRange.commissionRate,
        isValidated: priceRange.isValidated,
      })
    }
  }, [priceRange, form])

  const onSubmit = async (data: UpdatePricingPeriodFormData) => {
    if (!priceRange) return

    startTransition(async () => {
      try {
        await updatePriceRange.mutateAsync({
          id: priceRange.id,
          data: {
            name: data.name,
            startDate: data.startDate,
            endDate: data.endDate,
            ownerNightlyRate: data.ownerNightlyRate,
            ownerWeeklyRate: data.ownerWeeklyRate,
            commissionRate: data.commissionRate,
            isValidated: data.isValidated,
          }
        })
        
        toast.success("Pricing period updated successfully")
        onClose()
      } catch (error) {
        // Handle validation errors
        if (error && typeof error === 'object' && 'message' in error) {
          const errorMessage = error.message as string
          try {
            // Try to parse Zod validation errors
            const zodError = JSON.parse(errorMessage)
            if (Array.isArray(zodError)) {
              // Map validation errors to form fields
              zodError.forEach((err: any) => {
                if (err.path && err.path.length > 0) {
                  form.setError(err.path[0] as keyof UpdatePricingPeriodFormData, {
                    type: 'server',
                    message: err.message
                  })
                }
              })
              return // Don't show generic toast if we have field errors
            }
          } catch {
            // Not a JSON error, show generic message
          }
        }
        
        toast.error("Failed to update pricing period")
      }
    })
  }

  const handleClose = () => {
    if (!isPending) {
      form.reset()
      onClose()
    }
  }

  if (!priceRange) return null

  // Calculate public prices for display
  const ownerNightly = form.watch("ownerNightlyRate") || 0
  const ownerWeekly = form.watch("ownerWeeklyRate") || 0
  const commission = form.watch("commissionRate") || 0
  const publicNightly = commission > 0 ? calculatePublicPrice(ownerNightly, commission) : 0
  const publicWeekly = ownerWeekly && commission > 0 ? calculatePublicPrice(ownerWeekly, commission) : 0

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent className="sm:max-w-2xl overflow-y-auto p-4 sm:p-6">
        <SheetHeader>
          <SheetTitle>Edit Pricing Period</SheetTitle>
          <SheetDescription>
            Update the pricing details for this period. Changes will be reflected within 2 hours.
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 flex flex-col">
            <div className="flex-1 space-y-8">
            {/* Basic Information */}
            <div className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Period Name</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="e.g., Summer Season, Christmas Holiday"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          value={field.value ? format(field.value, 'yyyy-MM-dd') : ''}
                          onChange={(e) => {
                            field.onChange(e.target.value ? new Date(e.target.value) : undefined)
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Date</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          value={field.value ? format(field.value, 'yyyy-MM-dd') : ''}
                          onChange={(e) => {
                            field.onChange(e.target.value ? new Date(e.target.value) : undefined)
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Pricing Information */}
            <div className="space-y-6 pt-6 border-t border-gray-100">
              <h4 className="font-medium text-sm text-gray-900 flex items-center gap-2 mb-4">
                <DollarSign className="w-4 h-4" />
                Owner Rates
              </h4>
              
              <div className="grid grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="ownerNightlyRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nightly Rate</FormLabel>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">€</span>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : 0)}
                            value={field.value?.toString() || ""}
                            placeholder="0"
                          />
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="ownerWeeklyRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Weekly Rate (Optional)</FormLabel>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">€</span>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                            value={field.value?.toString() || ""}
                            placeholder="0"
                          />
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="commissionRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Commission Rate</FormLabel>
                    <div className="flex items-center gap-2">
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : 0)}
                          value={field.value?.toString() || ""}
                          placeholder="0"
                          className="w-32"
                        />
                      </FormControl>
                      <span className="text-sm text-gray-500">%</span>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Public Price Preview */}
            {(publicNightly > 0 || publicWeekly > 0) && (
              <div className="p-6 bg-gray-50 rounded-lg border mt-8">
                <h4 className="font-medium text-sm text-gray-900 mb-3 flex items-center gap-2">
                  <Percent className="w-4 h-4" />
                  Calculated Public Rates
                </h4>
                <div className="grid grid-cols-2 gap-6 text-sm">
                  <div>
                    <span className="text-gray-600">Public Nightly:</span>
                    <span className="ml-2 font-medium">€{publicNightly.toFixed(2)}</span>
                  </div>
                  {publicWeekly > 0 && (
                    <div>
                      <span className="text-gray-600">Public Weekly:</span>
                      <span className="ml-2 font-medium">€{publicWeekly.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Validation Status */}
            <div className="pt-6 border-t border-gray-100">
              <FormField
                control={form.control}
                name="isValidated"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Mark as validated</FormLabel>
                      <p className="text-xs text-muted-foreground">
                        Check this to confirm the pricing data is accurate and ready for use.
                      </p>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            </div>
            
            <SheetFooter className="mt-8">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isPending}
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isPending}
              >
                {isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Check className="w-4 h-4 mr-2" />
                )}
                {isPending ? "Updating..." : "Update Period"}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  )
}