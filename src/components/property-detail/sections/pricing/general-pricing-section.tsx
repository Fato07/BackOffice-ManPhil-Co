"use client"

import { useState, useOptimistic } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { CalendarIcon, RefreshCw, DollarSign, Shield, CreditCard, Percent, Info, Settings } from "lucide-react"
import { format } from "date-fns"
import { PropertySection } from "../../property-section"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { updatePropertyPricingSchema } from "@/lib/validations/pricing"
import { useUpdatePropertyPricing } from "@/hooks/use-property-pricing"
import type { PropertyPricing } from "@/generated/prisma"
import { z } from "zod"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

type GeneralPricingFormData = z.infer<typeof updatePropertyPricingSchema>

interface GeneralPricingSectionProps {
  propertyId: string
  pricing: PropertyPricing | null
}

export function GeneralPricingSection({ propertyId, pricing }: GeneralPricingSectionProps) {
  const [isEditing, setIsEditing] = useState(false)
  const updatePricing = useUpdatePropertyPricing(propertyId)

  // Optimistic state
  const [optimisticPricing, setOptimisticPricing] = useOptimistic(
    pricing,
    (_, newPricing: PropertyPricing | null) => newPricing
  )

  const form = useForm<GeneralPricingFormData>({
    resolver: zodResolver(updatePropertyPricingSchema),
    defaultValues: {
      currency: pricing?.currency || "EUR",
      displayOnWebsite: pricing?.displayOnWebsite ?? true,
      retroCommission: pricing?.retroCommission ?? false,
      securityDeposit: pricing?.securityDeposit,
      paymentSchedule: pricing?.paymentSchedule,
      minOwnerAcceptedPrice: pricing?.minOwnerAcceptedPrice,
      minLCAcceptedPrice: pricing?.minLCAcceptedPrice,
      publicMinimumPrice: pricing?.publicMinimumPrice,
      netOwnerCommission: pricing?.netOwnerCommission ?? 25,
      publicPriceCommission: pricing?.publicPriceCommission ?? 20,
      b2b2cPartnerCommission: pricing?.b2b2cPartnerCommission ?? 10,
      publicTaxes: pricing?.publicTaxes ?? 0,
      clientFees: pricing?.clientFees ?? 2,
    },
  })

  const handleSave = async () => {
    try {
      const data = form.getValues()
      
      // Optimistically update
      const newPricing = {
        ...optimisticPricing,
        ...data,
        id: optimisticPricing?.id || '',
        propertyId,
        createdAt: optimisticPricing?.createdAt || new Date(),
        updatedAt: new Date(),
      } as PropertyPricing
      
      setOptimisticPricing(newPricing)
      setIsEditing(false)

      await updatePricing.mutateAsync(data)
      toast.success("Pricing settings updated successfully")
    } catch (error) {
      // Revert optimistic update
      setOptimisticPricing(pricing)
      setIsEditing(true)
      toast.error("Failed to update pricing settings")
    }
  }

  const handleCancel = () => {
    form.reset()
    setIsEditing(false)
  }

  return (
    <PropertySection
      title="General Pricing"
      isEditing={isEditing}
      onEdit={() => setIsEditing(true)}
      onSave={handleSave}
      onCancel={handleCancel}
      className="border-teal-200 bg-teal-50/30"
      isSaving={updatePricing.isPending}
    >
      <div className="mb-4">
        <div className="flex items-center gap-2 p-3 bg-teal-100 rounded-lg border border-teal-300">
          <DollarSign className="w-5 h-5 text-teal-600" />
          <p className="text-sm text-teal-800">
            Configure general pricing settings, commission rates, and payment terms for this property.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Last Update Info */}
        <Card className="p-4 bg-gradient-to-r from-teal-50 to-cyan-50 border-teal-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-lg shadow-sm">
                <CalendarIcon className="w-5 h-5 text-teal-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Last pricing update</p>
                <p className="text-xs text-gray-600">
                  {optimisticPricing?.lastPricingUpdate 
                    ? format(new Date(optimisticPricing.lastPricingUpdate), "dd MMMM yyyy 'at' HH:mm:ss")
                    : "Never updated"}
                </p>
              </div>
            </div>
            {isEditing && (
              <Button size="sm" variant="outline" className="gap-2 hover:bg-teal-50 hover:text-teal-700 hover:border-teal-300">
                <RefreshCw className="w-4 h-4" />
                Sync Prices
              </Button>
            )}
          </div>
        </Card>

        {isEditing ? (
          <div className="space-y-6">
            {/* Display Settings */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Settings className="w-4 h-4 text-teal-600" />
                <Label className="text-base font-semibold">Display Settings</Label>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="displayOnWebsite"
                      checked={form.watch("displayOnWebsite")}
                      onCheckedChange={(checked) => form.setValue("displayOnWebsite", checked as boolean)}
                      className="data-[state=checked]:bg-teal-600 data-[state=checked]:border-teal-600"
                    />
                    <Label htmlFor="displayOnWebsite" className="text-sm font-normal cursor-pointer">
                      Prices displayed on the website
                    </Label>
                  </div>
                </Card>

                <Card className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="retroCommission"
                      checked={form.watch("retroCommission")}
                      onCheckedChange={(checked) => form.setValue("retroCommission", checked as boolean)}
                      className="data-[state=checked]:bg-teal-600 data-[state=checked]:border-teal-600"
                    />
                    <Label htmlFor="retroCommission" className="text-sm font-normal cursor-pointer">
                      Retro-commission
                    </Label>
                  </div>
                </Card>
              </div>
            </div>

            {/* Financial Details */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Shield className="w-4 h-4 text-teal-600" />
                <Label className="text-base font-semibold">Security & Payment</Label>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4">
                <Card className="p-4 hover:shadow-md transition-shadow">
                  <Label className="text-sm text-gray-600">Security deposit</Label>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-lg font-light text-gray-500">€</span>
                    <Input
                      type="number"
                      {...form.register("securityDeposit", { valueAsNumber: true })}
                      className="text-lg font-light"
                      placeholder="0"
                    />
                  </div>
                </Card>

                <Card className="p-4 hover:shadow-md transition-shadow">
                  <Label className="text-sm text-gray-600">Payment schedule</Label>
                  <Input
                    {...form.register("paymentSchedule")}
                    placeholder="50 - 40 - 10"
                    className="mt-2 font-light"
                  />
                  <p className="text-xs text-gray-500 mt-1">Format: XX - XX - XX</p>
                </Card>

                <Card className="p-4 hover:shadow-md transition-shadow">
                  <Label className="text-sm text-gray-600">Currency</Label>
                  <div className="mt-2">
                    <Badge variant="secondary" className="text-base px-4 py-1 bg-teal-100 text-teal-800 border-teal-200">
                      {form.watch("currency")}
                    </Badge>
                  </div>
                </Card>
              </div>
            </div>

            {/* Minimum Prices */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <CreditCard className="w-4 h-4 text-teal-600" />
                <Label className="text-base font-semibold">Minimum Prices</Label>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <Card className="p-4 hover:shadow-md transition-shadow bg-gradient-to-br from-white to-orange-50">
                  <Label className="text-sm text-gray-600">Owner minimum</Label>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-lg font-light text-gray-500">€</span>
                    <Input
                      type="number"
                      {...form.register("minOwnerAcceptedPrice", { valueAsNumber: true })}
                      className="text-lg font-light"
                      placeholder="0"
                    />
                  </div>
                </Card>

                <Card className="p-4 hover:shadow-md transition-shadow bg-gradient-to-br from-white to-blue-50">
                  <Label className="text-sm text-gray-600">LC minimum</Label>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-lg font-light text-gray-500">€</span>
                    <Input
                      type="number"
                      {...form.register("minLCAcceptedPrice", { valueAsNumber: true })}
                      className="text-lg font-light"
                      placeholder="0"
                    />
                  </div>
                </Card>

                <Card className="p-4 hover:shadow-md transition-shadow bg-gradient-to-br from-white to-green-50">
                  <Label className="text-sm text-gray-600">Public minimum</Label>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-lg font-light text-gray-500">€</span>
                    <Input
                      type="number"
                      {...form.register("publicMinimumPrice", { valueAsNumber: true })}
                      className="text-lg font-light"
                      placeholder="0"
                    />
                  </div>
                </Card>
              </div>
            </div>

            {/* Commission Rates */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Percent className="w-4 h-4 text-teal-600" />
                <Label className="text-base font-semibold">Commission & Fees</Label>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4">
                <Card className="p-4 hover:shadow-md transition-shadow">
                  <Label className="text-sm text-gray-600">Net owner commission</Label>
                  <div className="flex items-center gap-2 mt-2">
                    <Input
                      type="number"
                      step="0.01"
                      {...form.register("netOwnerCommission", { valueAsNumber: true })}
                      className="text-lg font-light"
                      placeholder="0"
                    />
                    <span className="text-lg font-light text-gray-500">%</span>
                  </div>
                </Card>

                <Card className="p-4 hover:shadow-md transition-shadow">
                  <Label className="text-sm text-gray-600">Public price commission</Label>
                  <div className="flex items-center gap-2 mt-2">
                    <Input
                      type="number"
                      step="0.01"
                      {...form.register("publicPriceCommission", { valueAsNumber: true })}
                      className="text-lg font-light"
                      placeholder="0"
                    />
                    <span className="text-lg font-light text-gray-500">%</span>
                  </div>
                </Card>

                <Card className="p-4 hover:shadow-md transition-shadow">
                  <Label className="text-sm text-gray-600">B2B2C partner commission</Label>
                  <div className="flex items-center gap-2 mt-2">
                    <Input
                      type="number"
                      step="0.01"
                      {...form.register("b2b2cPartnerCommission", { valueAsNumber: true })}
                      className="text-lg font-light"
                      placeholder="0"
                    />
                    <span className="text-lg font-light text-gray-500">%</span>
                  </div>
                </Card>

                <Card className="p-4 hover:shadow-md transition-shadow">
                  <Label className="text-sm text-gray-600">Public taxes</Label>
                  <div className="flex items-center gap-2 mt-2">
                    <Input
                      type="number"
                      step="0.01"
                      {...form.register("publicTaxes", { valueAsNumber: true })}
                      className="text-lg font-light"
                      placeholder="0"
                    />
                    <span className="text-lg font-light text-gray-500">%</span>
                  </div>
                </Card>

                <Card className="p-4 hover:shadow-md transition-shadow">
                  <Label className="text-sm text-gray-600">Included client fees</Label>
                  <div className="flex items-center gap-2 mt-2">
                    <Input
                      type="number"
                      step="0.01"
                      {...form.register("clientFees", { valueAsNumber: true })}
                      className="text-lg font-light"
                      placeholder="0"
                    />
                    <span className="text-lg font-light text-gray-500">%</span>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        ) : (
          /* View Mode */
          <div className="space-y-6">
            {/* Display Settings */}
            <div>
              <Label className="text-sm text-gray-600 mb-3 block flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Display Settings
              </Label>
              <div className="flex flex-wrap gap-3">
                <Badge 
                  variant={optimisticPricing?.displayOnWebsite ? "default" : "secondary"}
                  className={cn(
                    "px-4 py-1.5",
                    optimisticPricing?.displayOnWebsite 
                      ? "bg-green-100 text-green-800 border-green-200" 
                      : "bg-gray-100 text-gray-600 border-gray-200"
                  )}
                >
                  {optimisticPricing?.displayOnWebsite ? "Displayed on website" : "Hidden from website"}
                </Badge>
                {optimisticPricing?.retroCommission && (
                  <Badge className="px-4 py-1.5 bg-blue-100 text-blue-800 border-blue-200">
                    Retro-commission enabled
                  </Badge>
                )}
              </div>
            </div>

            {/* Financial Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4">
              <div>
                <Label className="text-sm text-gray-600">Security deposit</Label>
                <p className="text-2xl font-light text-gray-900 mt-1">
                  €{optimisticPricing?.securityDeposit?.toLocaleString() || "—"}
                </p>
              </div>

              <div>
                <Label className="text-sm text-gray-600">Payment schedule</Label>
                <p className="text-lg font-light text-gray-900 mt-1">
                  {optimisticPricing?.paymentSchedule || "—"}
                </p>
              </div>

              <div>
                <Label className="text-sm text-gray-600">Currency</Label>
                <Badge variant="secondary" className="mt-1 text-base px-4 py-1 bg-teal-100 text-teal-800 border-teal-200">
                  {optimisticPricing?.currency || "EUR"}
                </Badge>
              </div>
            </div>

            {/* Minimum Prices */}
            <div>
              <Label className="text-sm text-gray-600 mb-3 block flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                Minimum Prices
              </Label>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <Card className="p-4 bg-gradient-to-br from-white to-orange-50 border-orange-200">
                  <p className="text-sm text-gray-600">Owner minimum</p>
                  <p className="text-2xl font-light text-gray-900">
                    €{optimisticPricing?.minOwnerAcceptedPrice?.toLocaleString() || "—"}
                  </p>
                </Card>

                <Card className="p-4 bg-gradient-to-br from-white to-blue-50 border-blue-200">
                  <p className="text-sm text-gray-600">LC minimum</p>
                  <p className="text-2xl font-light text-gray-900">
                    €{optimisticPricing?.minLCAcceptedPrice?.toLocaleString() || "—"}
                  </p>
                </Card>

                <Card className="p-4 bg-gradient-to-br from-white to-green-50 border-green-200">
                  <p className="text-sm text-gray-600">Public minimum</p>
                  <p className="text-2xl font-light text-gray-900">
                    €{optimisticPricing?.publicMinimumPrice?.toLocaleString() || "—"}
                  </p>
                </Card>
              </div>
            </div>

            {/* Commission Rates */}
            <div>
              <Label className="text-sm text-gray-600 mb-3 block flex items-center gap-2">
                <Percent className="w-4 h-4" />
                Commission & Fees
              </Label>
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
                <Card className="p-3 text-center">
                  <p className="text-xs text-gray-600">Net owner</p>
                  <p className="text-xl font-light text-[#B5985A]">
                    {optimisticPricing?.netOwnerCommission || 0}%
                  </p>
                </Card>

                <Card className="p-3 text-center">
                  <p className="text-xs text-gray-600">Public price</p>
                  <p className="text-xl font-light text-[#B5985A]">
                    {optimisticPricing?.publicPriceCommission || 0}%
                  </p>
                </Card>

                <Card className="p-3 text-center">
                  <p className="text-xs text-gray-600">B2B2C partner</p>
                  <p className="text-xl font-light text-[#B5985A]">
                    {optimisticPricing?.b2b2cPartnerCommission || 0}%
                  </p>
                </Card>

                <Card className="p-3 text-center">
                  <p className="text-xs text-gray-600">Public taxes</p>
                  <p className="text-xl font-light text-[#B5985A]">
                    {optimisticPricing?.publicTaxes || 0}%
                  </p>
                </Card>

                <Card className="p-3 text-center">
                  <p className="text-xs text-gray-600">Client fees</p>
                  <p className="text-xl font-light text-[#B5985A]">
                    {optimisticPricing?.clientFees || 0}%
                  </p>
                </Card>
              </div>
            </div>
          </div>
        )}
      </div>
    </PropertySection>
  )
}