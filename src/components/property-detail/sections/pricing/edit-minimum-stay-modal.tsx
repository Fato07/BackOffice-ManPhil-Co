"use client"

import { useState, useTransition, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
import { Clock, Check, X, Loader2, Moon, Calendar as CalendarLucideIcon } from "lucide-react"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form"
import { updateMinimumStayRuleSchema } from "@/lib/validations/pricing"
import { useUpdateMinimumStayRule } from "@/hooks/use-property-pricing"
import type { MinimumStayRule, BookingCondition } from "@/generated/prisma"
import { z } from "zod"
import { toast } from "sonner"

type UpdateMinimumStayRuleFormData = z.infer<typeof updateMinimumStayRuleSchema>

interface EditMinimumStayModalProps {
  minimumStayRule: MinimumStayRule | null
  open: boolean
  onClose: () => void
  propertyId: string
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
    icon: <CalendarLucideIcon className="w-4 h-4" />
  },
  { 
    value: "WEEKLY_SUNDAY_TO_SUNDAY", 
    label: "Weekly - Sunday to Sunday",
    description: "Sunday check-in/out only",
    icon: <CalendarLucideIcon className="w-4 h-4" />
  },
  { 
    value: "WEEKLY_MONDAY_TO_MONDAY", 
    label: "Weekly - Monday to Monday",
    description: "Monday check-in/out only",
    icon: <CalendarLucideIcon className="w-4 h-4" />
  },
]

export function EditMinimumStayModal({
  minimumStayRule,
  open,
  onClose,
  propertyId
}: EditMinimumStayModalProps) {
  const [isPending, startTransition] = useTransition()
  const updateMinimumStayRule = useUpdateMinimumStayRule(propertyId)

  const form = useForm<UpdateMinimumStayRuleFormData>({
    resolver: zodResolver(updateMinimumStayRuleSchema),
    defaultValues: minimumStayRule ? {
      bookingCondition: minimumStayRule.bookingCondition,
      minimumNights: minimumStayRule.minimumNights,
      startDate: minimumStayRule.startDate ? new Date(minimumStayRule.startDate) : undefined,
      endDate: minimumStayRule.endDate ? new Date(minimumStayRule.endDate) : undefined,
    } : {},
  })

  // Reset form when minimumStayRule changes
  useEffect(() => {
    if (minimumStayRule) {
      form.reset({
        bookingCondition: minimumStayRule.bookingCondition,
        minimumNights: minimumStayRule.minimumNights,
        startDate: minimumStayRule.startDate ? new Date(minimumStayRule.startDate) : undefined,
        endDate: minimumStayRule.endDate ? new Date(minimumStayRule.endDate) : undefined,
      })
    }
  }, [minimumStayRule, form])

  const onSubmit = async (data: UpdateMinimumStayRuleFormData) => {
    if (!minimumStayRule) return

    startTransition(async () => {
      try {
        await updateMinimumStayRule.mutateAsync({
          id: minimumStayRule.id,
          data: {
            bookingCondition: data.bookingCondition,
            minimumNights: data.minimumNights,
            startDate: data.startDate,
            endDate: data.endDate,
          }
        })
        
        toast.success("Minimum stay rule updated successfully")
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
                  form.setError(err.path[0] as keyof UpdateMinimumStayRuleFormData, {
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
        
        toast.error("Failed to update minimum stay rule")
      }
    })
  }

  const handleClose = () => {
    if (!isPending) {
      form.reset()
      onClose()
    }
  }

  if (!minimumStayRule) return null

  const selectedCondition = BOOKING_CONDITIONS.find(c => c.value === form.watch("bookingCondition"))

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent className="sm:max-w-2xl overflow-y-auto p-4 sm:p-6">
        <SheetHeader>
          <SheetTitle>Edit Minimum Stay Rule</SheetTitle>
          <SheetDescription>
            Update the minimum stay requirements for this booking condition.
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form id="edit-minimum-stay-form" onSubmit={form.handleSubmit(onSubmit)} className="flex-1 flex flex-col">
            <div className="flex-1 space-y-8">
                {/* Booking Condition */}
            <FormField
              control={form.control}
              name="bookingCondition"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Booking Condition</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select booking condition" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {BOOKING_CONDITIONS.map((condition) => (
                        <SelectItem key={condition.value} value={condition.value}>
                          <div className="flex items-center gap-2">
                            {condition.icon}
                            <div>
                              <div className="font-medium">{condition.label}</div>
                              <div className="text-xs text-muted-foreground">
                                {condition.description}
                              </div>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Minimum Nights */}
            <FormField
              control={form.control}
              name="minimumNights"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Minimum Nights</FormLabel>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        step="1"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : 1)}
                        value={field.value?.toString() || ""}
                        placeholder="1"
                        className="w-32"
                      />
                    </FormControl>
                    <span className="text-sm text-muted-foreground">nights</span>
                  </div>
                  <FormDescription>
                    Minimum number of nights required for booking
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Date Range (Optional) */}
            <div className="space-y-6 pt-6 border-t border-gray-100">
              <div>
                <FormLabel>Date Range (Optional)</FormLabel>
                <FormDescription>
                  Leave empty for year-round rule, or set specific dates when this rule applies
                </FormDescription>
              </div>
              
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

            {/* Rule Preview */}
            {selectedCondition && (
              <div className="p-6 bg-gray-50 rounded-lg border mt-8">
                <h4 className="font-medium text-sm text-gray-900 mb-3 flex items-center gap-2">
                  {selectedCondition.icon}
                  Rule Preview
                </h4>
                <div className="text-sm space-y-1">
                  <p>
                    <span className="font-medium">Condition:</span> {selectedCondition.label}
                  </p>
                  <p>
                    <span className="font-medium">Minimum Stay:</span> {form.watch("minimumNights") || 1} night(s)
                  </p>
                  {form.watch("startDate") && form.watch("endDate") ? (
                    <p>
                      <span className="font-medium">Active Period:</span>{" "}
                      {format(form.watch("startDate")!, "MMM dd, yyyy")} -{" "}
                      {format(form.watch("endDate")!, "MMM dd, yyyy")}
                    </p>
                  ) : (
                    <p>
                      <span className="font-medium">Active Period:</span> Year-round
                    </p>
                  )}
                </div>
              </div>
            )}
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
                form="edit-minimum-stay-form"
                disabled={isPending}
              >
                {isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Check className="w-4 h-4 mr-2" />
                )}
                {isPending ? "Updating..." : "Update Rule"}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  )
}