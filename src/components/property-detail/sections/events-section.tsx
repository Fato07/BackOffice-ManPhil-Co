"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { PropertySection } from "../property-section"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useUpdateProperty } from "@/hooks/use-properties"
import { PropertyWithRelations } from "@/types/property"
import { toast } from "sonner"
import { usePermissions } from "@/hooks/use-permissions"
import { Permission } from "@/types/auth"
import { Plus, Trash2 } from "lucide-react"

const EVENT_TYPES = [
  { value: "wedding", label: "Weddings" },
  { value: "corporate", label: "Corporate Events" },
  { value: "birthday", label: "Birthday Parties" },
  { value: "private_dinner", label: "Private Dinners" },
  { value: "other", label: "Other Events" },
]

const VENDOR_TYPES = [
  { value: "catering", label: "Catering" },
  { value: "photography", label: "Photography" },
  { value: "music", label: "Music/DJ" },
  { value: "flowers", label: "Flowers" },
  { value: "planning", label: "Event Planning" },
]

const eventsSchema = z.object({
  eventsAllowed: z.boolean().default(false),
  maxEventGuests: z.number().int().min(0).optional(),
  eventDetails: z.object({
    eventTypes: z.record(z.string(), z.object({
      allowed: z.boolean().default(false),
      capacity: z.number().int().min(0).optional(),
      pricing: z.string().optional(),
      restrictions: z.string().optional(),
    })).default({}),
    facilities: z.object({
      soundSystem: z.boolean().default(false),
      danceFloor: z.boolean().default(false),
      cateringKitchen: z.boolean().default(false),
      eventFurniture: z.boolean().default(false),
      parkingSpaces: z.number().int().min(0).optional(),
      outdoorEventSpace: z.boolean().default(false),
      indoorEventSpace: z.boolean().default(false),
      barArea: z.boolean().default(false),
      bbqFacilities: z.boolean().default(false),
    }),
    restrictions: z.object({
      noiseCurfewTime: z.string().optional(),
      musicAllowedUntil: z.string().optional(),
      minimumRentalPeriod: z.number().int().min(1).optional(),
      securityDepositRequired: z.boolean().default(false),
      securityDepositAmount: z.number().min(0).optional(),
      eventInsuranceRequired: z.boolean().default(false),
      additionalRestrictions: z.string().optional(),
    }),
    vendors: z.array(z.object({
      name: z.string(),
      serviceType: z.string(),
      contactInfo: z.string(),
      notes: z.string().optional(),
    })).default([]),
    additionalNotes: z.string().optional(),
  }),
})

type EventsData = z.infer<typeof eventsSchema>

interface EventsSectionProps {
  property: PropertyWithRelations
}

export function EventsSection({ property }: EventsSectionProps) {
  const [isEditing, setIsEditing] = useState(false)
  const updateProperty = useUpdateProperty()
  const { hasPermission } = usePermissions()
  const canEdit = hasPermission(Permission.PROPERTY_EDIT)

  // Get event details from JSON field (Prisma handles JSON automatically)
  const existingEventDetails = (property.eventsDetails as any) || {}

  const form = useForm<z.input<typeof eventsSchema>>({
    resolver: zodResolver(eventsSchema),
    defaultValues: {
      eventsAllowed: property.eventsAllowed || false,
      maxEventGuests: property.eventsCapacity || existingEventDetails.maxEventGuests || undefined,
      eventDetails: {
        eventTypes: existingEventDetails.eventTypes || {},
        facilities: {
          soundSystem: existingEventDetails.facilities?.soundSystem || false,
          danceFloor: existingEventDetails.facilities?.danceFloor || false,
          cateringKitchen: existingEventDetails.facilities?.cateringKitchen || false,
          eventFurniture: existingEventDetails.facilities?.eventFurniture || false,
          parkingSpaces: existingEventDetails.facilities?.parkingSpaces || undefined,
          outdoorEventSpace: existingEventDetails.facilities?.outdoorEventSpace || false,
          indoorEventSpace: existingEventDetails.facilities?.indoorEventSpace || false,
          barArea: existingEventDetails.facilities?.barArea || false,
          bbqFacilities: existingEventDetails.facilities?.bbqFacilities || false,
        },
        restrictions: {
          noiseCurfewTime: existingEventDetails.restrictions?.noiseCurfewTime || undefined,
          musicAllowedUntil: existingEventDetails.restrictions?.musicAllowedUntil || undefined,
          minimumRentalPeriod: existingEventDetails.restrictions?.minimumRentalPeriod || undefined,
          securityDepositRequired: existingEventDetails.restrictions?.securityDepositRequired || false,
          securityDepositAmount: existingEventDetails.restrictions?.securityDepositAmount || undefined,
          eventInsuranceRequired: existingEventDetails.restrictions?.eventInsuranceRequired || false,
          additionalRestrictions: existingEventDetails.restrictions?.additionalRestrictions || undefined,
        },
        vendors: existingEventDetails.vendors || [],
        additionalNotes: existingEventDetails.additionalNotes || undefined,
      },
    },
  })

  const vendors = form.watch("eventDetails.vendors")

  const addVendor = () => {
    const currentVendors = form.getValues("eventDetails.vendors") || []
    form.setValue("eventDetails.vendors", [
      ...currentVendors,
      { name: "", serviceType: "catering", contactInfo: "", notes: "" }
    ])
  }

  const removeVendor = (index: number) => {
    const currentVendors = form.getValues("eventDetails.vendors") || []
    form.setValue("eventDetails.vendors", currentVendors.filter((_, i) => i !== index))
  }

  const handleSave = async (data: z.input<typeof eventsSchema>) => {
    try {
      const updateData = {
        eventsAllowed: data.eventsAllowed || false,
        eventsCapacity: data.eventsAllowed ? data.maxEventGuests : undefined,
        eventsDetails: data.eventsAllowed ? {
          ...data.eventDetails,
          maxEventGuests: data.maxEventGuests,
        } : null,
      }

      await updateProperty.mutateAsync({
        id: property.id,
        data: updateData,
      })
      toast.success("Events information updated successfully")
      setIsEditing(false)
    } catch (error) {
      // Provide more detailed error message
      if (error instanceof Error) {
        toast.error(`Failed to update events: ${error.message}`)
      } else {
        toast.error("Failed to update events information")
      }
    }
  }

  const handleCancel = () => {
    form.reset()
    setIsEditing(false)
  }

  return (
    <PropertySection
      title="Events"
      isEditing={isEditing}
      onEdit={() => setIsEditing(true)}
      onSave={form.handleSubmit(handleSave)}
      onCancel={handleCancel}
      isSaving={updateProperty.isPending}
      canEdit={canEdit}
    >
      <div className="space-y-8">
        {/* Basic Event Settings */}
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <Checkbox
              disabled={!isEditing}
              checked={form.watch("eventsAllowed")}
              onCheckedChange={(checked) => form.setValue("eventsAllowed", !!checked)}
            />
            <Label className="text-base font-medium">Events allowed at this property</Label>
          </div>

          {form.watch("eventsAllowed") && (
            <div className="ml-6">
              <Label>Maximum event guests</Label>
              <Input
                type="number"
                className="mt-2 w-32"
                disabled={!isEditing}
                {...form.register("maxEventGuests", { valueAsNumber: true })}
              />
            </div>
          )}
        </div>

        {form.watch("eventsAllowed") && (
          <>
            {/* Event Types */}
            <div>
              <h3 className="text-base font-semibold mb-4">Event Types</h3>
              <div className="space-y-4">
                {EVENT_TYPES.map((eventType) => (
                  <Card key={eventType.value} className="p-4">
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <Checkbox
                          disabled={!isEditing}
                          checked={form.watch(`eventDetails.eventTypes.${eventType.value}.allowed`) || false}
                          onCheckedChange={(checked) => 
                            form.setValue(`eventDetails.eventTypes.${eventType.value}.allowed`, !!checked)
                          }
                        />
                        <Label className="font-medium">{eventType.label}</Label>
                      </div>

                      {form.watch(`eventDetails.eventTypes.${eventType.value}.allowed`) && (
                        <div className="ml-6 grid grid-cols-2 gap-4">
                          <div>
                            <Label>Maximum Capacity</Label>
                            <Input
                              type="number"
                              disabled={!isEditing}
                              {...form.register(`eventDetails.eventTypes.${eventType.value}.capacity` as any, {
                                valueAsNumber: true
                              })}
                            />
                          </div>
                          <div>
                            <Label>Pricing Information</Label>
                            <Input
                              disabled={!isEditing}
                              {...form.register(`eventDetails.eventTypes.${eventType.value}.pricing` as any)}
                              placeholder="e.g., $5000/day"
                            />
                          </div>
                          <div className="col-span-2">
                            <Label>Restrictions</Label>
                            <Textarea
                              disabled={!isEditing}
                              {...form.register(`eventDetails.eventTypes.${eventType.value}.restrictions` as any)}
                              placeholder="Specific restrictions for this event type..."
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Facilities */}
            <div>
              <h3 className="text-base font-semibold mb-4">Available Facilities</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    disabled={!isEditing}
                    checked={form.watch("eventDetails.facilities.soundSystem")}
                    onCheckedChange={(checked) => form.setValue("eventDetails.facilities.soundSystem", !!checked)}
                  />
                  <Label>Sound system</Label>
                </div>
                <div className="flex items-center space-x-3">
                  <Checkbox
                    disabled={!isEditing}
                    checked={form.watch("eventDetails.facilities.danceFloor")}
                    onCheckedChange={(checked) => form.setValue("eventDetails.facilities.danceFloor", !!checked)}
                  />
                  <Label>Dance floor</Label>
                </div>
                <div className="flex items-center space-x-3">
                  <Checkbox
                    disabled={!isEditing}
                    checked={form.watch("eventDetails.facilities.cateringKitchen")}
                    onCheckedChange={(checked) => form.setValue("eventDetails.facilities.cateringKitchen", !!checked)}
                  />
                  <Label>Catering kitchen</Label>
                </div>
                <div className="flex items-center space-x-3">
                  <Checkbox
                    disabled={!isEditing}
                    checked={form.watch("eventDetails.facilities.eventFurniture")}
                    onCheckedChange={(checked) => form.setValue("eventDetails.facilities.eventFurniture", !!checked)}
                  />
                  <Label>Event furniture</Label>
                </div>
                <div className="flex items-center space-x-3">
                  <Checkbox
                    disabled={!isEditing}
                    checked={form.watch("eventDetails.facilities.outdoorEventSpace")}
                    onCheckedChange={(checked) => form.setValue("eventDetails.facilities.outdoorEventSpace", !!checked)}
                  />
                  <Label>Outdoor event space</Label>
                </div>
                <div className="flex items-center space-x-3">
                  <Checkbox
                    disabled={!isEditing}
                    checked={form.watch("eventDetails.facilities.indoorEventSpace")}
                    onCheckedChange={(checked) => form.setValue("eventDetails.facilities.indoorEventSpace", !!checked)}
                  />
                  <Label>Indoor event space</Label>
                </div>
                <div className="flex items-center space-x-3">
                  <Checkbox
                    disabled={!isEditing}
                    checked={form.watch("eventDetails.facilities.barArea")}
                    onCheckedChange={(checked) => form.setValue("eventDetails.facilities.barArea", !!checked)}
                  />
                  <Label>Bar area</Label>
                </div>
                <div className="flex items-center space-x-3">
                  <Checkbox
                    disabled={!isEditing}
                    checked={form.watch("eventDetails.facilities.bbqFacilities")}
                    onCheckedChange={(checked) => form.setValue("eventDetails.facilities.bbqFacilities", !!checked)}
                  />
                  <Label>BBQ facilities</Label>
                </div>
                <div>
                  <Label>Parking spaces</Label>
                  <Input
                    type="number"
                    className="mt-2"
                    disabled={!isEditing}
                    {...form.register("eventDetails.facilities.parkingSpaces", { valueAsNumber: true })}
                  />
                </div>
              </div>
            </div>

            {/* Restrictions */}
            <div>
              <h3 className="text-base font-semibold mb-4">Event Restrictions</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Noise curfew time</Label>
                    <Input
                      type="time"
                      disabled={!isEditing}
                      {...form.register("eventDetails.restrictions.noiseCurfewTime")}
                    />
                  </div>
                  <div>
                    <Label>Music allowed until</Label>
                    <Input
                      type="time"
                      disabled={!isEditing}
                      {...form.register("eventDetails.restrictions.musicAllowedUntil")}
                    />
                  </div>
                  <div>
                    <Label>Minimum rental period (days)</Label>
                    <Input
                      type="number"
                      disabled={!isEditing}
                      {...form.register("eventDetails.restrictions.minimumRentalPeriod", { valueAsNumber: true })}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      disabled={!isEditing}
                      checked={form.watch("eventDetails.restrictions.securityDepositRequired")}
                      onCheckedChange={(checked) => form.setValue("eventDetails.restrictions.securityDepositRequired", !!checked)}
                    />
                    <Label>Security deposit required</Label>
                  </div>
                  {form.watch("eventDetails.restrictions.securityDepositRequired") && (
                    <div className="ml-6">
                      <Label>Security deposit amount</Label>
                      <Input
                        type="number"
                        className="mt-2 w-32"
                        disabled={!isEditing}
                        {...form.register("eventDetails.restrictions.securityDepositAmount", { valueAsNumber: true })}
                      />
                    </div>
                  )}

                  <div className="flex items-center space-x-3">
                    <Checkbox
                      disabled={!isEditing}
                      checked={form.watch("eventDetails.restrictions.eventInsuranceRequired")}
                      onCheckedChange={(checked) => form.setValue("eventDetails.restrictions.eventInsuranceRequired", !!checked)}
                    />
                    <Label>Event insurance required</Label>
                  </div>
                </div>

                <div>
                  <Label>Additional restrictions</Label>
                  <Textarea
                    className="mt-2"
                    disabled={!isEditing}
                    {...form.register("eventDetails.restrictions.additionalRestrictions")}
                    placeholder="Any other event restrictions..."
                  />
                </div>
              </div>
            </div>

            {/* Preferred Vendors */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold">Preferred Vendors</h3>
                {isEditing && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={addVendor}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Vendor
                  </Button>
                )}
              </div>
              <div className="space-y-3">
                {vendors?.map((vendor, index) => (
                  <Card key={index} className="p-4">
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Vendor name</Label>
                          <Input
                            disabled={!isEditing}
                            {...form.register(`eventDetails.vendors.${index}.name` as any)}
                          />
                        </div>
                        <div>
                          <Label>Service type</Label>
                          <Select
                            disabled={!isEditing}
                            value={form.watch(`eventDetails.vendors.${index}.serviceType` as any)}
                            onValueChange={(value) => 
                              form.setValue(`eventDetails.vendors.${index}.serviceType` as any, value)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {VENDOR_TYPES.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Contact information</Label>
                          <Input
                            disabled={!isEditing}
                            {...form.register(`eventDetails.vendors.${index}.contactInfo` as any)}
                            placeholder="Phone, email, etc."
                          />
                        </div>
                        <div>
                          <Label>Notes</Label>
                          <Input
                            disabled={!isEditing}
                            {...form.register(`eventDetails.vendors.${index}.notes` as any)}
                          />
                        </div>
                      </div>
                      {isEditing && (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="text-red-600"
                          onClick={() => removeVendor(index)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Remove
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Additional Notes */}
            <div>
              <Label>Additional event notes</Label>
              <Textarea
                className="mt-2"
                disabled={!isEditing}
                {...form.register("eventDetails.additionalNotes")}
                placeholder="Any other event-related information..."
                rows={4}
              />
            </div>
          </>
        )}
      </div>
    </PropertySection>
  )
}