"use client"

import { useState } from "react"
import { useForm, Controller, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { DevTool } from "@hookform/devtools"
import { PropertySection } from "../property-section"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useUpdateProperty } from "@/hooks/use-properties"
import { PropertyWithRelations } from "@/types/property"
import { toast } from "sonner"
import { usePermissions } from "@/hooks/use-permissions"
import { Permission } from "@/types/auth"
import { Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"

const servicesSchema = z.object({
  // Transport Services
  airportTransfer: z.boolean().default(false),
  airportTransferType: z.enum(["INCLUDED", "PAID", "ON_REQUEST"]).optional(),
  airportTransferPrice: z.number().min(0).optional(),
  carRental: z.boolean().default(false),
  carRentalType: z.enum(["INCLUDED", "PAID", "ON_REQUEST"]).optional(),
  carRentalPrice: z.number().min(0).optional(),
  driver: z.boolean().default(false),
  driverType: z.enum(["INCLUDED", "PAID", "ON_REQUEST"]).optional(),
  driverPrice: z.number().min(0).optional(),
  transportNotes: z.string().optional(),

  // Meal Services
  breakfast: z.boolean().default(false),
  breakfastType: z.enum(["INCLUDED", "PAID", "ON_REQUEST"]).optional(),
  breakfastPrice: z.number().min(0).optional(),
  lunch: z.boolean().default(false),
  lunchType: z.enum(["INCLUDED", "PAID", "ON_REQUEST"]).optional(),
  lunchPrice: z.number().min(0).optional(),
  dinner: z.boolean().default(false),
  dinnerType: z.enum(["INCLUDED", "PAID", "ON_REQUEST"]).optional(),
  dinnerPrice: z.number().min(0).optional(),
  chef: z.boolean().default(false),
  chefType: z.enum(["INCLUDED", "PAID", "ON_REQUEST"]).optional(),
  chefPrice: z.number().min(0).optional(),
  groceryShopping: z.boolean().default(false),
  groceryShoppingType: z.enum(["INCLUDED", "PAID", "ON_REQUEST"]).optional(),
  mealNotes: z.string().optional(),

  // Concierge Services
  conciergeService: z.boolean().default(false),
  conciergeType: z.enum(["24_7", "BUSINESS_HOURS", "ON_REQUEST"]).optional(),
  restaurantReservations: z.boolean().default(false),
  activityBooking: z.boolean().default(false),
  equipmentRental: z.boolean().default(false),
  personalShopping: z.boolean().default(false),
  
  // Additional Services
  additionalServices: z.array(z.object({
    name: z.string().min(1),
    type: z.enum(["INCLUDED", "PAID", "ON_REQUEST"]),
    price: z.number().min(0).optional(),
    description: z.string().optional(),
  })).default([]),
  
  servicesNotes: z.string().optional(),
})

type ServicesData = z.infer<typeof servicesSchema>

interface ServicesSectionProps {
  property: PropertyWithRelations
}

interface ServiceRowProps {
  name: string
  field: keyof ServicesData
  typeField: keyof ServicesData
  priceField?: keyof ServicesData
  form: any // We'll type this properly later
  isEditing: boolean
}

const ServiceRow = ({ 
  name, 
  field, 
  typeField, 
  priceField,
  form,
  isEditing
}: ServiceRowProps) => {
  // Use watch for conditional rendering
  const isEnabled = form.watch(field);
  const serviceType = form.watch(typeField);

  return (
    <div className="space-y-3 pb-4 border-b last:border-0">
      <div className="flex items-center space-x-3">
        <Controller
          name={`${field}`}
          control={form.control}
          render={({ field: checkboxField }) => (
            <Checkbox
              disabled={!isEditing}
              checked={!!checkboxField.value}
              onCheckedChange={(checked) => {
                checkboxField.onChange(!!checked);
              }}
              name={checkboxField.name}
              ref={checkboxField.ref}
            />
          )}
        />
        <Label>{name}</Label>
      </div>
      {isEnabled && (
        <div className="ml-7 grid grid-cols-2 gap-4">
          <div>
            <Label>Type</Label>
            <Controller
              name={`${typeField}`}
              control={form.control}
              render={({ field }) => (
                <RadioGroup
                  className="mt-2"
                  disabled={!isEditing}
                  value={field.value || ""}
                  onValueChange={field.onChange}
                  name={field.name}
                  ref={field.ref}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="INCLUDED" />
                    <Label>Included</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="PAID" />
                    <Label>Paid</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="ON_REQUEST" />
                    <Label>On request</Label>
                  </div>
                </RadioGroup>
              )}
            />
          </div>
          {serviceType === "PAID" && priceField && (
            <div>
              <Label>Price (€)</Label>
              <Input
                type="number"
                min="0"
                className="mt-2"
                disabled={!isEditing}
                {...form.register(priceField, { valueAsNumber: true })}
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function ServicesSection({ property }: ServicesSectionProps) {
  const [isEditing, setIsEditing] = useState(false)
  const updateProperty = useUpdateProperty()
  const { hasPermission } = usePermissions()
  const canEdit = hasPermission(Permission.PROPERTY_EDIT)

  // Parse services from JSON field
  const servicesData = property.services as any || {}

  const form = useForm<z.input<typeof servicesSchema>>({
    resolver: zodResolver(servicesSchema),
    defaultValues: {
      airportTransfer: servicesData.airportTransfer || false,
      airportTransferType: servicesData.airportTransferType || undefined,
      airportTransferPrice: servicesData.airportTransferPrice || undefined,
      carRental: servicesData.carRental || false,
      carRentalType: servicesData.carRentalType || undefined,
      carRentalPrice: servicesData.carRentalPrice || undefined,
      driver: servicesData.driver || false,
      driverType: servicesData.driverType || undefined,
      driverPrice: servicesData.driverPrice || undefined,
      transportNotes: servicesData.transportNotes || "",
      breakfast: servicesData.breakfast || false,
      breakfastType: servicesData.breakfastType || undefined,
      breakfastPrice: servicesData.breakfastPrice || undefined,
      lunch: servicesData.lunch || false,
      lunchType: servicesData.lunchType || undefined,
      lunchPrice: servicesData.lunchPrice || undefined,
      dinner: servicesData.dinner || false,
      dinnerType: servicesData.dinnerType || undefined,
      dinnerPrice: servicesData.dinnerPrice || undefined,
      chef: servicesData.chef || false,
      chefType: servicesData.chefType || undefined,
      chefPrice: servicesData.chefPrice || undefined,
      groceryShopping: servicesData.groceryShopping || false,
      groceryShoppingType: servicesData.groceryShoppingType || undefined,
      mealNotes: servicesData.mealNotes || "",
      conciergeService: servicesData.conciergeService || false,
      conciergeType: servicesData.conciergeType || undefined,
      restaurantReservations: servicesData.restaurantReservations || false,
      activityBooking: servicesData.activityBooking || false,
      equipmentRental: servicesData.equipmentRental || false,
      personalShopping: servicesData.personalShopping || false,
      additionalServices: servicesData.additionalServices as any || [],
      servicesNotes: servicesData.servicesNotes || "",
    },
  })

  const additionalServices = form.watch("additionalServices")

  const addAdditionalService = () => {
    form.setValue("additionalServices", [
      ...(additionalServices || []),
      { name: "", type: "ON_REQUEST", price: 0, description: "" }
    ])
  }

  const removeAdditionalService = (index: number) => {
    form.setValue("additionalServices", (additionalServices || []).filter((_, i) => i !== index))
  }

  const handleSave = async (data: z.input<typeof servicesSchema>) => {
    try {
      const servicesPayload = {
        ...data,
        airportTransferType: data.airportTransfer ? data.airportTransferType : undefined,
        airportTransferPrice: data.airportTransfer && data.airportTransferType === "PAID" ? data.airportTransferPrice : undefined,
        carRentalType: data.carRental ? data.carRentalType : undefined,
        carRentalPrice: data.carRental && data.carRentalType === "PAID" ? data.carRentalPrice : undefined,
        driverType: data.driver ? data.driverType : undefined,
        driverPrice: data.driver && data.driverType === "PAID" ? data.driverPrice : undefined,
        breakfastType: data.breakfast ? data.breakfastType : undefined,
        breakfastPrice: data.breakfast && data.breakfastType === "PAID" ? data.breakfastPrice : undefined,
        lunchType: data.lunch ? data.lunchType : undefined,
        lunchPrice: data.lunch && data.lunchType === "PAID" ? data.lunchPrice : undefined,
        dinnerType: data.dinner ? data.dinnerType : undefined,
        dinnerPrice: data.dinner && data.dinnerType === "PAID" ? data.dinnerPrice : undefined,
        chefType: data.chef ? data.chefType : undefined,
        chefPrice: data.chef && data.chefType === "PAID" ? data.chefPrice : undefined,
        groceryShoppingType: data.groceryShopping ? data.groceryShoppingType : undefined,
        conciergeType: data.conciergeService ? data.conciergeType : undefined,
      }

      await updateProperty.mutateAsync({
        id: property.id,
        data: {
          services: servicesPayload,
        },
      })
      toast.success("Services updated successfully")
      setIsEditing(false)
    } catch (error) {
      toast.error("Failed to update services")
    }
  }

  const handleCancel = () => {
    form.reset()
    setIsEditing(false)
  }

  return (
    <>
    <PropertySection
      title="Services"
      isEditing={isEditing}
      onEdit={() => setIsEditing(true)}
      onSave={form.handleSubmit(handleSave)}
      onCancel={handleCancel}
      isSaving={updateProperty.isPending}
      canEdit={canEdit}
    >
      <div className="space-y-8">
        {/* Transport Services */}
        <div>
          <h3 className="text-base font-semibold mb-4">Transport Services</h3>
          <div className="space-y-4">
            <ServiceRow
              name="Airport transfer"
              field="airportTransfer"
              typeField="airportTransferType"
              priceField="airportTransferPrice"
              form={form}
              isEditing={isEditing}
            />
            <ServiceRow
              name="Car rental"
              field="carRental"
              typeField="carRentalType"
              priceField="carRentalPrice"
              form={form}
              isEditing={isEditing}
            />
            <ServiceRow
              name="Driver service"
              field="driver"
              typeField="driverType"
              priceField="driverPrice"
              form={form}
              isEditing={isEditing}
            />
            <div>
              <Label>Transport notes</Label>
              <Textarea
                className="mt-2"
                disabled={!isEditing}
                {...form.register("transportNotes")}
                placeholder="Additional transport information..."
              />
            </div>
          </div>
        </div>

        {/* Meal Services */}
        <div>
          <h3 className="text-base font-semibold mb-4">Meal Services</h3>
          <div className="space-y-4">
            <ServiceRow
              name="Breakfast"
              field="breakfast"
              typeField="breakfastType"
              priceField="breakfastPrice"
              form={form}
              isEditing={isEditing}
            />
            <ServiceRow
              name="Lunch"
              field="lunch"
              typeField="lunchType"
              priceField="lunchPrice"
              form={form}
              isEditing={isEditing}
            />
            <ServiceRow
              name="Dinner"
              field="dinner"
              typeField="dinnerType"
              priceField="dinnerPrice"
              form={form}
              isEditing={isEditing}
            />
            <ServiceRow
              name="Private chef"
              field="chef"
              typeField="chefType"
              priceField="chefPrice"
              form={form}
              isEditing={isEditing}
            />
            <ServiceRow
              name="Grocery shopping"
              field="groceryShopping"
              typeField="groceryShoppingType"
              form={form}
              isEditing={isEditing}
            />
            <div>
              <Label>Meal notes</Label>
              <Textarea
                className="mt-2"
                disabled={!isEditing}
                {...form.register("mealNotes")}
                placeholder="Additional meal service information..."
              />
            </div>
          </div>
        </div>

        {/* Concierge Services */}
        <div>
          <h3 className="text-base font-semibold mb-4">Concierge Services</h3>
          <div className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Controller
                  name="conciergeService"
                  control={form.control}
                  render={({ field }) => (
                    <Checkbox
                      disabled={!isEditing}
                      checked={!!field.value}
                      onCheckedChange={(checked) => field.onChange(!!checked)}
                    />
                  )}
                />
                <Label>Concierge service</Label>
              </div>
              {form.watch("conciergeService") && (
                <div className="ml-7">
                  <Label>Availability</Label>
                  <Controller
                    name="conciergeType"
                    control={form.control}
                    render={({ field: { onChange, value, name, ref } }) => (
                      <RadioGroup
                        className="mt-2"
                        disabled={!isEditing}
                        value={value || ""}
                        onValueChange={(val) => {
                          onChange(val);
                        }}
                        name={name}
                        ref={ref}
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="24_7" />
                          <Label>24/7</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="BUSINESS_HOURS" />
                          <Label>Business hours</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="ON_REQUEST" />
                          <Label>On request</Label>
                        </div>
                      </RadioGroup>
                    )}
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-3">
                <Controller
                  name="restaurantReservations"
                  control={form.control}
                  render={({ field }) => (
                    <Checkbox
                      disabled={!isEditing}
                      checked={!!field.value}
                      onCheckedChange={(checked) => field.onChange(!!checked)}
                    />
                  )}
                />
                <Label>Restaurant reservations</Label>
              </div>
              <div className="flex items-center space-x-3">
                <Controller
                  name="activityBooking"
                  control={form.control}
                  render={({ field }) => (
                    <Checkbox
                      disabled={!isEditing}
                      checked={!!field.value}
                      onCheckedChange={(checked) => field.onChange(!!checked)}
                    />
                  )}
                />
                <Label>Activity booking</Label>
              </div>
              <div className="flex items-center space-x-3">
                <Controller
                  name="equipmentRental"
                  control={form.control}
                  render={({ field }) => (
                    <Checkbox
                      disabled={!isEditing}
                      checked={!!field.value}
                      onCheckedChange={(checked) => field.onChange(!!checked)}
                    />
                  )}
                />
                <Label>Equipment rental</Label>
              </div>
              <div className="flex items-center space-x-3">
                <Controller
                  name="personalShopping"
                  control={form.control}
                  render={({ field }) => (
                    <Checkbox
                      disabled={!isEditing}
                      checked={!!field.value}
                      onCheckedChange={(checked) => field.onChange(!!checked)}
                    />
                  )}
                />
                <Label>Personal shopping</Label>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Services */}
        <div>
          <h3 className="text-base font-semibold mb-4">Additional Services</h3>
          <div className="space-y-4">
            {(additionalServices || []).map((service, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div className="grid grid-cols-2 gap-4 flex-1">
                    <div>
                      <Label>Service name</Label>
                      <Input
                        className="mt-2"
                        disabled={!isEditing}
                        value={service.name}
                        onChange={(e) => {
                          const updated = [...(additionalServices || [])]
                          updated[index].name = e.target.value
                          form.setValue("additionalServices", updated)
                        }}
                      />
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <Label>Type</Label>
                        <Select
                          disabled={!isEditing}
                          value={service.type}
                          onValueChange={(value) => {
                            const updated = [...(additionalServices || [])]
                            updated[index].type = value as "INCLUDED" | "PAID" | "ON_REQUEST"
                            form.setValue("additionalServices", updated)
                          }}
                        >
                          <SelectTrigger className="mt-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="INCLUDED">Included</SelectItem>
                            <SelectItem value="PAID">Paid</SelectItem>
                            <SelectItem value="ON_REQUEST">On request</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {service.type === "PAID" && (
                        <div className="w-24">
                          <Label>Price (€)</Label>
                          <Input
                            type="number"
                            min="0"
                            className="mt-2"
                            disabled={!isEditing}
                            value={service.price}
                            onChange={(e) => {
                              const updated = [...(additionalServices || [])]
                              updated[index].price = parseFloat(e.target.value) || 0
                              form.setValue("additionalServices", updated)
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  {isEditing && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-red-600"
                      onClick={() => removeAdditionalService(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea
                    className="mt-2"
                    disabled={!isEditing}
                    value={service.description}
                    onChange={(e) => {
                      const updated = [...(additionalServices || [])]
                      updated[index].description = e.target.value
                      form.setValue("additionalServices", updated)
                    }}
                  />
                </div>
              </div>
            ))}
            {isEditing && (
              <Button
                type="button"
                variant="outline"
                onClick={addAdditionalService}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add service
              </Button>
            )}
          </div>
        </div>

        <div>
          <Label>General services notes</Label>
          <Textarea
            className="mt-2"
            disabled={!isEditing}
            {...form.register("servicesNotes")}
            placeholder="Additional services information..."
            rows={4}
          />
        </div>
      </div>
    </PropertySection>
    {process.env.NODE_ENV === 'development' && <DevTool control={form.control} />}
  </>
  )
}