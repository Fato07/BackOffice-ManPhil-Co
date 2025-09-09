"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Check, X } from "lucide-react"
import { PropertySection } from "../property-section"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { usePermissions } from "@/hooks/use-permissions"
import { Permission } from "@/types/auth"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { updatePropertyEnvironmentSchema } from "@/lib/validations"
import { useUpdateProperty } from "@/hooks/use-properties"
import { z } from "zod"
import { toast } from "sonner"

type LocationFormData = z.infer<typeof updatePropertyEnvironmentSchema>

interface LocationSectionProps {
  property: {
    id: string
    neighborhood: string | null
    setting: string | null
    specialAttention: string | null
    locatedInCity: boolean
    beachAccess: boolean
    beachAccessibility: string | null
    beachTravelTime: string | null
    privateBeachAccess: boolean
    skiSlopes: boolean
    shops: boolean
    restaurants: boolean
    touristCenter: boolean
    golfCourse: boolean
  }
}

export function LocationSection({ property }: LocationSectionProps) {
  const updateProperty = useUpdateProperty()
  const { hasPermission } = usePermissions()
  const canEdit = hasPermission(Permission.PROPERTY_EDIT)
  const [isEditingEnvironment, setIsEditingEnvironment] = useState(false)
  const [isEditingNearby, setIsEditingNearby] = useState(false)
  
  const form = useForm<LocationFormData>({
    resolver: zodResolver(updatePropertyEnvironmentSchema),
    defaultValues: {
      neighborhood: property.neighborhood || "",
      setting: property.setting || "",
      specialAttention: property.specialAttention || "",
      locatedInCity: property.locatedInCity,
      beachAccess: property.beachAccess,
      beachAccessibility: property.beachAccessibility || "",
      beachTravelTime: property.beachTravelTime || "",
      privateBeachAccess: property.privateBeachAccess,
      skiSlopes: property.skiSlopes,
      shops: property.shops,
      restaurants: property.restaurants,
      touristCenter: property.touristCenter,
      golfCourse: property.golfCourse,
    },
  })

  const handleSave = async () => {
    try {
      const values = form.getValues()
      await updateProperty.mutateAsync({ 
        id: property.id, 
        data: values
      })
      toast.success("Location information updated successfully")
      setIsEditingEnvironment(false)
      setIsEditingNearby(false)
    } catch (error) {
      toast.error("Failed to update location information")
    }
  }

  const handleCancelEnvironment = () => {
    form.reset()
    setIsEditingEnvironment(false)
  }

  const handleCancelNearby = () => {
    form.reset()
    setIsEditingNearby(false)
  }

  const BooleanIcon = ({ value }: { value: boolean }) => 
    value ? <Check className="h-4 w-4 text-green-600" /> : <X className="h-4 w-4 text-red-600" />

  return (
    <>
      <PropertySection
        title="Environment"
        isEditing={isEditingEnvironment}
        onEdit={() => setIsEditingEnvironment(true)}
        onSave={handleSave}
        onCancel={handleCancelEnvironment}
        isSaving={updateProperty.isPending}
        canEdit={canEdit}
      >
        {isEditingEnvironment ? (
          <div className="space-y-4">
            <div>
              <Label>Neighborhood</Label>
              <Input {...form.register("neighborhood")} className="mt-1" />
            </div>

            <div>
              <Label>Setting</Label>
              <Input {...form.register("setting")} className="mt-1" />
            </div>

            <div>
              <Label>Special attention</Label>
              <Textarea 
                {...form.register("specialAttention")} 
                className="mt-1" 
                rows={3}
              />
            </div>

            <div>
              <Label>Located in city</Label>
              <RadioGroup
                value={form.watch("locatedInCity") ? "in" : "out"}
                onValueChange={(value) => form.setValue("locatedInCity", value === "in")}
                className="mt-2 flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="out" id="out" />
                  <Label htmlFor="out">Out of town</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="in" id="in" />
                  <Label htmlFor="in">In city</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <Label className="text-gray-600">Neighborhood</Label>
              <p className="mt-1">{property.neighborhood || "—"}</p>
            </div>

            <div>
              <Label className="text-gray-600">Setting</Label>
              <p className="mt-1">{property.setting || "—"}</p>
            </div>

            <div>
              <Label className="text-gray-600">Special attention</Label>
              <p className="mt-1">{property.specialAttention || "—"}</p>
            </div>

            <div className="flex items-center gap-6">
              <Label className="text-gray-600">Located in city</Label>
              <div className="flex gap-4">
                <span className={!property.locatedInCity ? "font-medium" : ""}>Out of town</span>
                <span className={property.locatedInCity ? "font-medium" : ""}>In city</span>
              </div>
            </div>
          </div>
        )}
      </PropertySection>

      <PropertySection
        title="Nearby"
        isEditing={isEditingNearby}
        onEdit={() => setIsEditingNearby(true)}
        onSave={handleSave}
        onCancel={handleCancelNearby}
        isSaving={updateProperty.isPending}
        canEdit={canEdit}
      >
        {isEditingNearby ? (
          <div className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Beach</Label>
                <Checkbox
                  checked={form.watch("beachAccess")}
                  onCheckedChange={(checked) => form.setValue("beachAccess", !!checked)}
                />
              </div>

              {form.watch("beachAccess") && (
                <>
                  <div className="grid grid-cols-2 gap-4 pl-6">
                    <div>
                      <Label>Accessibility</Label>
                      <RadioGroup
                        value={form.watch("beachAccessibility") || ""}
                        onValueChange={(value) => form.setValue("beachAccessibility", value)}
                        className="mt-2"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="on_foot" id="on_foot" />
                          <Label htmlFor="on_foot">On foot</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="by_car" id="by_car" />
                          <Label htmlFor="by_car">By car</Label>
                        </div>
                      </RadioGroup>
                    </div>
                    <div>
                      <Label>Travel time</Label>
                      <Input 
                        {...form.register("beachTravelTime")} 
                        placeholder="e.g., 5 minutes"
                        className="mt-1" 
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pl-6">
                    <Label>Private pathway to the beach</Label>
                    <RadioGroup
                      value={form.watch("privateBeachAccess") ? "yes" : "no"}
                      onValueChange={(value) => form.setValue("privateBeachAccess", value === "yes")}
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="no" id="no" />
                        <Label htmlFor="no">No</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="yes" id="yes" />
                        <Label htmlFor="yes">Yes</Label>
                      </div>
                    </RadioGroup>
                  </div>
                </>
              )}

              <div className="flex items-center justify-between">
                <Label>Ski slopes</Label>
                <Checkbox
                  checked={form.watch("skiSlopes")}
                  onCheckedChange={(checked) => form.setValue("skiSlopes", !!checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Shops</Label>
                <Checkbox
                  checked={form.watch("shops")}
                  onCheckedChange={(checked) => form.setValue("shops", !!checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Restaurants</Label>
                <Checkbox
                  checked={form.watch("restaurants")}
                  onCheckedChange={(checked) => form.setValue("restaurants", !!checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Tourist center</Label>
                <Checkbox
                  checked={form.watch("touristCenter")}
                  onCheckedChange={(checked) => form.setValue("touristCenter", !!checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Golf course</Label>
                <Checkbox
                  checked={form.watch("golfCourse")}
                  onCheckedChange={(checked) => form.setValue("golfCourse", !!checked)}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-gray-600">Beach</Label>
                <BooleanIcon value={property.beachAccess} />
              </div>
              
              {property.beachAccess && (
                <>
                  <div className="grid grid-cols-2 gap-4 pl-6">
                    <div>
                      <Label className="text-gray-600 text-sm">Accessibility</Label>
                      <p className="mt-1 text-sm">
                        {property.beachAccessibility === "on_foot" ? "On foot" : 
                         property.beachAccessibility === "by_car" ? "By car" : "—"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-gray-600 text-sm">Travel time</Label>
                      <p className="mt-1 text-sm">{property.beachTravelTime || "—"}</p>
                    </div>
                  </div>
                  <div className="pl-6">
                    <Label className="text-gray-600 text-sm">Private pathway to the beach</Label>
                    <p className="mt-1 text-sm">{property.privateBeachAccess ? "Yes" : "No"}</p>
                  </div>
                </>
              )}

              <div className="flex items-center justify-between">
                <Label className="text-gray-600">Ski slopes</Label>
                <BooleanIcon value={property.skiSlopes} />
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-gray-600">Shops</Label>
                <BooleanIcon value={property.shops} />
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-gray-600">Restaurants</Label>
                <BooleanIcon value={property.restaurants} />
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-gray-600">Tourist center</Label>
                <BooleanIcon value={property.touristCenter} />
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-gray-600">Golf course</Label>
                <BooleanIcon value={property.golfCourse} />
              </div>
            </div>
          </div>
        )}
      </PropertySection>
    </>
  )
}