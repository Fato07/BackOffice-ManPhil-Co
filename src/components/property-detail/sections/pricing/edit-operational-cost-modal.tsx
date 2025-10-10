"use client"

import { useState, useTransition, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { 
  Check, 
  X, 
  Loader2, 
  DollarSign, 
  Receipt, 
  Home, 
  Bed, 
  Package, 
  Briefcase,
  MessageCircle,
  User
} from "lucide-react"
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
import { Textarea } from "@/components/ui/textarea"
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
import { cn } from "@/lib/utils"
import { updateOperationalCostSchema } from "@/lib/validations/pricing"
import { useUpdateOperationalCost } from "@/hooks/use-property-pricing"
import type { OperationalCost, OperationalCostType, PriceType } from "@/generated/prisma"
import { z } from "zod"
import { toast } from "sonner"

type UpdateOperationalCostFormData = z.infer<typeof updateOperationalCostSchema>

interface EditOperationalCostModalProps {
  operationalCost: OperationalCost | null
  open: boolean
  onClose: () => void
  propertyId: string
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

export function EditOperationalCostModal({
  operationalCost,
  open,
  onClose,
  propertyId
}: EditOperationalCostModalProps) {
  const [isPending, startTransition] = useTransition()
  const updateOperationalCost = useUpdateOperationalCost(propertyId)

  const form = useForm<UpdateOperationalCostFormData>({
    resolver: zodResolver(updateOperationalCostSchema),
    defaultValues: operationalCost ? {
      costType: operationalCost.costType,
      priceType: operationalCost.priceType,
      estimatedPrice: operationalCost.estimatedPrice,
      publicPrice: operationalCost.publicPrice,
      paidBy: operationalCost.paidBy,
      comment: operationalCost.comment,
    } : {},
  })

  // Reset form when operationalCost changes
  useEffect(() => {
    if (operationalCost) {
      form.reset({
        costType: operationalCost.costType,
        priceType: operationalCost.priceType,
        estimatedPrice: operationalCost.estimatedPrice,
        publicPrice: operationalCost.publicPrice,
        paidBy: operationalCost.paidBy,
        comment: operationalCost.comment,
      })
    }
  }, [operationalCost, form])

  const onSubmit = async (data: UpdateOperationalCostFormData) => {
    if (!operationalCost) return

    startTransition(async () => {
      try {
        await updateOperationalCost.mutateAsync({
          id: operationalCost.id,
          data: {
            costType: data.costType,
            priceType: data.priceType,
            estimatedPrice: data.estimatedPrice,
            publicPrice: data.publicPrice,
            paidBy: data.paidBy,
            comment: data.comment,
          }
        })
        
        toast.success("Operational cost updated successfully")
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
                  form.setError(err.path[0] as keyof UpdateOperationalCostFormData, {
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
        
        toast.error("Failed to update operational cost")
      }
    })
  }

  const handleClose = () => {
    if (!isPending) {
      form.reset()
      onClose()
    }
  }

  if (!operationalCost) return null

  const selectedCostType = OPERATIONAL_COST_TYPES.find(c => c.value === form.watch("costType"))
  const selectedPriceType = PRICE_TYPES.find(p => p.value === form.watch("priceType"))

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent className="sm:max-w-2xl overflow-y-auto p-4 sm:p-6">
        <SheetHeader>
          <SheetTitle>Edit Operational Cost</SheetTitle>
          <SheetDescription>
            Update the operational cost details and pricing information.
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 flex flex-col">
            <div className="flex-1 space-y-8">
            {/* Cost Type */}
            <FormField
              control={form.control}
              name="costType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cost Type</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select cost type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {OPERATIONAL_COST_TYPES.map((costType) => (
                        <SelectItem key={costType.value} value={costType.value}>
                          <div className="flex items-center gap-2">
                            {costType.icon}
                            <div>
                              <div className="font-medium">{costType.label}</div>
                              <div className="text-xs text-muted-foreground">
                                {costType.description}
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

            {/* Price Type */}
            <FormField
              control={form.control}
              name="priceType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price Type</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select price type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {PRICE_TYPES.map((priceType) => (
                        <SelectItem key={priceType.value} value={priceType.value}>
                          <div>
                            <div className="font-medium">{priceType.label}</div>
                            <div className="text-xs text-muted-foreground">
                              {priceType.description}
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

            {/* Pricing Information */}
            <div className="space-y-6 pt-6 border-t border-gray-100">
              <h4 className="font-medium text-sm text-gray-900 flex items-center gap-2 mb-4">
                <DollarSign className="w-4 h-4" />
                Pricing Information
              </h4>
              
              <div className="grid grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="estimatedPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estimated Price</FormLabel>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">€</span>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                            value={field.value?.toString() || ""}
                            placeholder="0"
                          />
                        </FormControl>
                      </div>
                      <FormDescription>
                        Internal estimated cost
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="publicPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Public Price</FormLabel>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">€</span>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                            value={field.value?.toString() || ""}
                            placeholder="0"
                          />
                        </FormControl>
                      </div>
                      <FormDescription>
                        Price charged to guests
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Paid By */}
            <div className="pt-6 border-t border-gray-100">
            <FormField
              control={form.control}
              name="paidBy"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Paid By</FormLabel>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value || ""}
                        placeholder="e.g., Guest, Owner, ManPhil&Co"
                      />
                    </FormControl>
                  </div>
                  <FormDescription>
                    Who is responsible for paying this cost
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            </div>

            {/* Comment */}
            <FormField
              control={form.control}
              name="comment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Comment</FormLabel>
                  <div className="flex items-start gap-2">
                    <MessageCircle className="w-4 h-4 text-muted-foreground mt-2" />
                    <FormControl>
                      <Textarea
                        {...field}
                        value={field.value || ""}
                        placeholder="Additional notes or details about this cost..."
                        rows={3}
                      />
                    </FormControl>
                  </div>
                  <FormDescription>
                    Optional notes about this operational cost
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Cost Preview */}
            {selectedCostType && selectedPriceType && (
              <div className="p-6 bg-gray-50 rounded-lg border mt-8">
                <h4 className="font-medium text-sm text-gray-900 mb-3 flex items-center gap-2">
                  <Receipt className="w-4 h-4" />
                  Cost Preview
                </h4>
                <div className="text-sm space-y-1">
                  <p>
                    <span className="font-medium">Type:</span> {selectedCostType.label}
                  </p>
                  <p>
                    <span className="font-medium">Frequency:</span> {selectedPriceType.label}
                  </p>
                  {form.watch("estimatedPrice") && (
                    <p>
                      <span className="font-medium">Estimated Cost:</span> €{form.watch("estimatedPrice")?.toFixed(2)}
                    </p>
                  )}
                  {form.watch("publicPrice") && (
                    <p>
                      <span className="font-medium">Public Price:</span> €{form.watch("publicPrice")?.toFixed(2)}
                    </p>
                  )}
                  {form.watch("paidBy") && (
                    <p>
                      <span className="font-medium">Paid By:</span> {form.watch("paidBy")}
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
                disabled={isPending}
              >
                {isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Check className="w-4 h-4 mr-2" />
                )}
                {isPending ? "Updating..." : "Update Cost"}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  )
}