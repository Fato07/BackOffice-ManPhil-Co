"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { X, Check } from "lucide-react"
import { PropertySection } from "../property-section"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { updatePropertyPromotionSchema } from "@/lib/validations"
import { useUpdateProperty } from "@/hooks/use-properties"
import { z } from "zod"
import { toast } from "sonner"
import { Checkbox } from "@/components/ui/checkbox"

type PromotionFormData = z.infer<typeof updatePropertyPromotionSchema>

interface PromoteSectionProps {
  property: {
    id: string
    exclusivity: boolean
    position: number | null
    segment: string | null
    iconicCollection: boolean
    onboardingFees: boolean
    onlineReservation: boolean
    flexibleCancellation: boolean
  }
}

export function PromoteSection({ property }: PromoteSectionProps) {
  const updateProperty = useUpdateProperty()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState(property)
  
  const form = useForm<PromotionFormData>({
    resolver: zodResolver(updatePropertyPromotionSchema),
    defaultValues: {
      exclusivity: property.exclusivity,
      position: property.position ?? undefined,
      segment: property.segment ?? undefined,
      iconicCollection: property.iconicCollection,
      onboardingFees: property.onboardingFees,
      onlineReservation: property.onlineReservation,
      flexibleCancellation: property.flexibleCancellation,
    },
  })

  const handleSave = async () => {
    try {
      const values = form.getValues()
      await updateProperty.mutateAsync({ id: property.id, data: values })
      setIsEditing(false)
      toast.success("Promotion settings updated successfully")
    } catch (error) {
      toast.error("Failed to update promotion settings")
    }
  }

  const handleCancel = () => {
    form.reset()
    setIsEditing(false)
  }

  const BooleanField = ({ 
    label, 
    value, 
    field 
  }: { 
    label: string
    value: boolean
    field: keyof PromotionFormData
  }) => (
    <div className="flex items-center justify-between py-2">
      <Label>{label}</Label>
      {value ? (
        <Check className="h-4 w-4 text-green-600" />
      ) : (
        <X className="h-4 w-4 text-red-600" />
      )}
    </div>
  )

  const BooleanEditField = ({ 
    label, 
    field 
  }: { 
    label: string
    field: keyof PromotionFormData
  }) => (
    <div className="flex items-center justify-between py-2">
      <Label>{label}</Label>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => form.setValue(field as any, false)}
          className={`p-1 rounded ${!form.watch(field as any) ? 'bg-red-100' : 'hover:bg-gray-100'}`}
        >
          <X className="h-4 w-4 text-red-600" />
        </button>
        <button
          type="button"
          onClick={() => form.setValue(field as any, true)}
          className={`p-1 rounded ${form.watch(field as any) ? 'bg-green-100' : 'hover:bg-gray-100'}`}
        >
          <Check className="h-4 w-4 text-green-600" />
        </button>
      </div>
    </div>
  )

  return (
    <PropertySection
      title="1. Promote"
      isEditing={isEditing}
      onEdit={() => setIsEditing(true)}
      onSave={handleSave}
      onCancel={handleCancel}
      isSaving={updateProperty.isPending}
    >
      {isEditing ? (
        <div className="space-y-4">
          <BooleanEditField label="Exclusivity" field="exclusivity" />
          
          <div>
            <Label>Position</Label>
            <Input
              type="number"
              {...form.register("position", { valueAsNumber: true })}
              placeholder="Enter position number"
              className="mt-1"
            />
          </div>

          <div>
            <Label>Segment</Label>
            <Select
              value={form.watch("segment") || ""}
              onValueChange={(value) => form.setValue("segment", value)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select segment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Bronze">Bronze</SelectItem>
                <SelectItem value="Silver">Silver</SelectItem>
                <SelectItem value="Gold">Gold</SelectItem>
                <SelectItem value="Platinum">Platinum</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <BooleanEditField label="Iconic collection" field="iconicCollection" />
          <BooleanEditField label="Onboarding fees" field="onboardingFees" />
          <BooleanEditField label="Online reservation" field="onlineReservation" />
          <BooleanEditField label="Flexible cancellation" field="flexibleCancellation" />
        </div>
      ) : (
        <div className="space-y-3">
          <BooleanField label="Exclusivity" value={property.exclusivity} field="exclusivity" />
          
          <div className="flex justify-between py-2">
            <Label>Position</Label>
            <span className="text-gray-600">{property.position || "/"}</span>
          </div>

          <div className="flex justify-between py-2">
            <Label>Segment</Label>
            <span className="text-gray-600">{property.segment || "/"}</span>
          </div>

          <BooleanField label="Iconic collection" value={property.iconicCollection} field="iconicCollection" />
          <BooleanField label="Onboarding fees" value={property.onboardingFees} field="onboardingFees" />
          <BooleanField label="Online reservation" value={property.onlineReservation} field="onlineReservation" />
          <BooleanField label="Flexible cancellation" value={property.flexibleCancellation} field="flexibleCancellation" />
        </div>
      )}
    </PropertySection>
  )
}