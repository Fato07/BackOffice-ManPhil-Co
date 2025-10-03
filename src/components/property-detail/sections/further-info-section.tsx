"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { PropertySection } from "../property-section"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { useUpdateProperty } from "@/hooks/use-properties"
import { PropertyWithRelations } from "@/types/property"
import { usePermissions } from "@/hooks/use-permissions"
import { Permission } from "@/types/auth"
import { toast } from "sonner"

const furtherInfoSchema = z.object({
  // Accessibility
  wheelchairAccessible: z.boolean().default(false),
  elevatorAvailable: z.boolean().default(false),
  groundFloorBedrooms: z.boolean().default(false),
  accessibleBathroom: z.boolean().default(false),
  accessibilityNotes: z.string().optional(),

  // Policies
  smokingAllowed: z.enum(["ALLOWED", "NOT_ALLOWED", "OUTSIDE_ONLY"]).default("NOT_ALLOWED"),
  petsAllowed: z.enum(["ALLOWED", "NOT_ALLOWED", "SMALL_PETS_ONLY"]).default("NOT_ALLOWED"),
  eventsAllowed: z.boolean().default(false),
  maxEventGuests: z.number().int().min(0).optional(),
  quietHoursStart: z.string().optional(),
  quietHoursEnd: z.string().optional(),
  houseRules: z.string().optional(),

  // Staff
  hasHousekeeper: z.boolean().default(false),
  housekeeperFrequency: z.enum(["DAILY", "WEEKLY", "TWICE_WEEKLY", "ON_REQUEST"]).optional(),
  hasGardener: z.boolean().default(false),
  gardenerFrequency: z.enum(["DAILY", "WEEKLY", "TWICE_WEEKLY", "ON_REQUEST"]).optional(),
  hasPoolMaintenance: z.boolean().default(false),
  poolMaintenanceFrequency: z.enum(["DAILY", "WEEKLY", "TWICE_WEEKLY"]).optional(),
  hasSecurity: z.boolean().default(false),
  securityType: z.enum(["24_7", "NIGHT_ONLY", "ON_REQUEST"]).optional(),
  staffNotes: z.string().optional(),
})

type FurtherInfoData = z.infer<typeof furtherInfoSchema>

interface FurtherInfoSectionProps {
  property: PropertyWithRelations
}

export function FurtherInfoSection({ property }: FurtherInfoSectionProps) {
  const [isEditing, setIsEditing] = useState(false)
  const updateProperty = useUpdateProperty()
  const { hasPermission } = usePermissions()
  const canEdit = hasPermission(Permission.PROPERTY_EDIT)

  // Parse JSON fields
  const accessibility = property.accessibility as any || {}
  const policies = property.policies as any || {}
  const staff = property.staff as any || {}

  const form = useForm<z.input<typeof furtherInfoSchema>>({
    resolver: zodResolver(furtherInfoSchema),
    defaultValues: {
      // Accessibility from JSON
      wheelchairAccessible: accessibility.wheelchairAccessible || false,
      elevatorAvailable: accessibility.elevatorAvailable || false,
      groundFloorBedrooms: accessibility.groundFloorBedrooms || false,
      accessibleBathroom: accessibility.accessibleBathroom || false,
      accessibilityNotes: accessibility.accessibilityNotes || "",
      // Policies from JSON
      smokingAllowed: policies.smokingAllowed || "NOT_ALLOWED",
      petsAllowed: policies.petsAllowed || "NOT_ALLOWED",
      eventsAllowed: property.eventsAllowed || false,
      maxEventGuests: property.eventsCapacity || undefined,
      quietHoursStart: policies.quietHoursStart || "",
      quietHoursEnd: policies.quietHoursEnd || "",
      houseRules: policies.houseRules || "",
      // Staff from JSON
      hasHousekeeper: staff.hasHousekeeper || false,
      housekeeperFrequency: staff.housekeeperFrequency || undefined,
      hasGardener: staff.hasGardener || false,
      gardenerFrequency: staff.gardenerFrequency || undefined,
      hasPoolMaintenance: staff.hasPoolMaintenance || false,
      poolMaintenanceFrequency: staff.poolMaintenanceFrequency || undefined,
      hasSecurity: staff.hasSecurity || false,
      securityType: staff.securityType || undefined,
      staffNotes: staff.staffNotes || "",
    },
  })

  const handleSave = async (data: z.input<typeof furtherInfoSchema>) => {
    try {
      // Prepare the JSON fields
      const accessibilityData = {
        wheelchairAccessible: data.wheelchairAccessible,
        elevatorAvailable: data.elevatorAvailable,
        groundFloorBedrooms: data.groundFloorBedrooms,
        accessibleBathroom: data.accessibleBathroom,
        accessibilityNotes: data.accessibilityNotes,
      }

      const policiesData = {
        smokingAllowed: data.smokingAllowed,
        petsAllowed: data.petsAllowed,
        quietHoursStart: data.quietHoursStart,
        quietHoursEnd: data.quietHoursEnd,
        houseRules: data.houseRules,
      }

      const staffData = {
        hasHousekeeper: data.hasHousekeeper,
        housekeeperFrequency: data.hasHousekeeper ? data.housekeeperFrequency : undefined,
        hasGardener: data.hasGardener,
        gardenerFrequency: data.hasGardener ? data.gardenerFrequency : undefined,
        hasPoolMaintenance: data.hasPoolMaintenance,
        poolMaintenanceFrequency: data.hasPoolMaintenance ? data.poolMaintenanceFrequency : undefined,
        hasSecurity: data.hasSecurity,
        securityType: data.hasSecurity ? data.securityType : undefined,
        staffNotes: data.staffNotes,
      }

      await updateProperty.mutateAsync({
        id: property.id,
        data: {
          accessibility: accessibilityData,
          policies: policiesData,
          staff: staffData,
          eventsAllowed: data.eventsAllowed,
          eventsCapacity: data.eventsAllowed ? data.maxEventGuests : undefined,
        },
      })
      toast.success("Further information updated successfully")
      setIsEditing(false)
    } catch (error) {
      toast.error("Failed to update further information")
    }
  }

  const handleCancel = () => {
    form.reset()
    setIsEditing(false)
  }

  return (
    <PropertySection
      title="Further Information"
      isEditing={isEditing}
      onEdit={() => setIsEditing(true)}
      onSave={form.handleSubmit(handleSave)}
      onCancel={handleCancel}
      isSaving={updateProperty.isPending}
      canEdit={canEdit}
    >
      <div className="space-y-8">
        <div>
          <h3 className="text-base font-semibold mb-4">Accessibility</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-3">
                <Checkbox
                  disabled={!isEditing}
                  checked={form.watch("wheelchairAccessible")}
                  onCheckedChange={(checked) => form.setValue("wheelchairAccessible", !!checked)}
                />
                <Label>Wheelchair accessible</Label>
              </div>
              <div className="flex items-center space-x-3">
                <Checkbox
                  disabled={!isEditing}
                  checked={form.watch("elevatorAvailable")}
                  onCheckedChange={(checked) => form.setValue("elevatorAvailable", !!checked)}
                />
                <Label>Elevator available</Label>
              </div>
              <div className="flex items-center space-x-3">
                <Checkbox
                  disabled={!isEditing}
                  checked={form.watch("groundFloorBedrooms")}
                  onCheckedChange={(checked) => form.setValue("groundFloorBedrooms", !!checked)}
                />
                <Label>Ground floor bedrooms</Label>
              </div>
              <div className="flex items-center space-x-3">
                <Checkbox
                  disabled={!isEditing}
                  checked={form.watch("accessibleBathroom")}
                  onCheckedChange={(checked) => form.setValue("accessibleBathroom", !!checked)}
                />
                <Label>Accessible bathroom</Label>
              </div>
            </div>
            <div>
              <Label>Accessibility notes</Label>
              <Textarea
                className="mt-2"
                disabled={!isEditing}
                {...form.register("accessibilityNotes")}
                placeholder="Additional accessibility information..."
              />
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-base font-semibold mb-4">House Policies</h3>
          <div className="space-y-4">
            <div>
              <Label>Smoking policy</Label>
              <RadioGroup
                className="mt-2"
                disabled={!isEditing}
                value={form.watch("smokingAllowed")}
                onValueChange={(value) => form.setValue("smokingAllowed", value as any)}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="ALLOWED" />
                  <Label>Allowed</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="NOT_ALLOWED" />
                  <Label>Not allowed</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="OUTSIDE_ONLY" />
                  <Label>Outside only</Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <Label>Pet policy</Label>
              <RadioGroup
                className="mt-2"
                disabled={!isEditing}
                value={form.watch("petsAllowed")}
                onValueChange={(value) => form.setValue("petsAllowed", value as any)}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="ALLOWED" />
                  <Label>Allowed</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="NOT_ALLOWED" />
                  <Label>Not allowed</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="SMALL_PETS_ONLY" />
                  <Label>Small pets only</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Checkbox
                  disabled={!isEditing}
                  checked={form.watch("eventsAllowed")}
                  onCheckedChange={(checked) => form.setValue("eventsAllowed", !!checked)}
                />
                <Label>Events allowed</Label>
              </div>
              {form.watch("eventsAllowed") && (
                <div>
                  <Label>Maximum event guests</Label>
                  <Input
                    type="number"
                    min="0"
                    className="mt-2 w-32"
                    disabled={!isEditing}
                    {...form.register("maxEventGuests", { valueAsNumber: true })}
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Quiet hours start</Label>
                <Input
                  type="time"
                  className="mt-2"
                  disabled={!isEditing}
                  {...form.register("quietHoursStart")}
                />
              </div>
              <div>
                <Label>Quiet hours end</Label>
                <Input
                  type="time"
                  className="mt-2"
                  disabled={!isEditing}
                  {...form.register("quietHoursEnd")}
                />
              </div>
            </div>

            <div>
              <Label>House rules</Label>
              <Textarea
                className="mt-2"
                disabled={!isEditing}
                {...form.register("houseRules")}
                placeholder="Additional house rules..."
                rows={4}
              />
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-base font-semibold mb-4">Staff & Services</h3>
          <div className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Checkbox
                  disabled={!isEditing}
                  checked={form.watch("hasHousekeeper")}
                  onCheckedChange={(checked) => form.setValue("hasHousekeeper", !!checked)}
                />
                <Label>Housekeeper available</Label>
              </div>
              {form.watch("hasHousekeeper") && (
                <div className="ml-7">
                  <Label>Frequency</Label>
                  <RadioGroup
                    className="mt-2"
                    disabled={!isEditing}
                    value={form.watch("housekeeperFrequency") || ""}
                    onValueChange={(value) => form.setValue("housekeeperFrequency", value as any)}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="DAILY" />
                      <Label>Daily</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="WEEKLY" />
                      <Label>Weekly</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="TWICE_WEEKLY" />
                      <Label>Twice weekly</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="ON_REQUEST" />
                      <Label>On request</Label>
                    </div>
                  </RadioGroup>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Checkbox
                  disabled={!isEditing}
                  checked={form.watch("hasGardener")}
                  onCheckedChange={(checked) => form.setValue("hasGardener", !!checked)}
                />
                <Label>Gardener available</Label>
              </div>
              {form.watch("hasGardener") && (
                <div className="ml-7">
                  <Label>Frequency</Label>
                  <RadioGroup
                    className="mt-2"
                    disabled={!isEditing}
                    value={form.watch("gardenerFrequency") || ""}
                    onValueChange={(value) => form.setValue("gardenerFrequency", value as any)}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="DAILY" />
                      <Label>Daily</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="WEEKLY" />
                      <Label>Weekly</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="TWICE_WEEKLY" />
                      <Label>Twice weekly</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="ON_REQUEST" />
                      <Label>On request</Label>
                    </div>
                  </RadioGroup>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Checkbox
                  disabled={!isEditing}
                  checked={form.watch("hasPoolMaintenance")}
                  onCheckedChange={(checked) => form.setValue("hasPoolMaintenance", !!checked)}
                />
                <Label>Pool maintenance</Label>
              </div>
              {form.watch("hasPoolMaintenance") && (
                <div className="ml-7">
                  <Label>Frequency</Label>
                  <RadioGroup
                    className="mt-2"
                    disabled={!isEditing}
                    value={form.watch("poolMaintenanceFrequency") || ""}
                    onValueChange={(value) => form.setValue("poolMaintenanceFrequency", value as any)}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="DAILY" />
                      <Label>Daily</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="WEEKLY" />
                      <Label>Weekly</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="TWICE_WEEKLY" />
                      <Label>Twice weekly</Label>
                    </div>
                  </RadioGroup>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Checkbox
                  disabled={!isEditing}
                  checked={form.watch("hasSecurity")}
                  onCheckedChange={(checked) => form.setValue("hasSecurity", !!checked)}
                />
                <Label>Security service</Label>
              </div>
              {form.watch("hasSecurity") && (
                <div className="ml-7">
                  <Label>Type</Label>
                  <RadioGroup
                    className="mt-2"
                    disabled={!isEditing}
                    value={form.watch("securityType") || ""}
                    onValueChange={(value) => form.setValue("securityType", value as any)}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="24_7" />
                      <Label>24/7</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="NIGHT_ONLY" />
                      <Label>Night only</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="ON_REQUEST" />
                      <Label>On request</Label>
                    </div>
                  </RadioGroup>
                </div>
              )}
            </div>

            <div>
              <Label>Staff notes</Label>
              <Textarea
                className="mt-2"
                disabled={!isEditing}
                {...form.register("staffNotes")}
                placeholder="Additional staff information..."
              />
            </div>
          </div>
        </div>
      </div>
    </PropertySection>
  )
}