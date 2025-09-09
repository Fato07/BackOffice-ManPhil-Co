"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { X } from "lucide-react"
import { PropertySection } from "../property-section"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { updatePropertyBasicSchema } from "@/lib/validations"
import { useUpdateProperty } from "@/hooks/use-properties"
import { PropertyStatus, LicenseType, ConciergeServiceOffer } from "@/types/property"
import { z } from "zod"
import { toast } from "sonner"
import { usePermissions } from "@/hooks/use-permissions"
import { Permission } from "@/types/auth"

type BasicInfoFormData = z.infer<typeof updatePropertyBasicSchema>

interface HouseInfoSectionProps {
  property: {
    id: string
    name: string
    originalName: string | null
    status: PropertyStatus
    licenseType: LicenseType
    conciergeServiceOffer: ConciergeServiceOffer
    categories: string[]
    operatedByExternal: string | null
    address: string | null
    postcode: string | null
    city: string | null
    latitude: number | null
    longitude: number | null
    additionalDetails: string | null
    destination: {
      id: string
      name: string
      country: string
    }
  }
}

export function HouseInfoSection({ property }: HouseInfoSectionProps) {
  const updateProperty = useUpdateProperty()
  const { hasPermission } = usePermissions()
  const canEdit = hasPermission(Permission.PROPERTY_EDIT)
  const [isEditingGeneral, setIsEditingGeneral] = useState(false)
  const [isEditingLocation, setIsEditingLocation] = useState(false)
  const [categories, setCategories] = useState(property.categories)
  const [newCategory, setNewCategory] = useState("")
  
  const form = useForm<BasicInfoFormData>({
    resolver: zodResolver(updatePropertyBasicSchema),
    defaultValues: {
      name: property.name,
      originalName: property.originalName,
      status: property.status,
      licenseType: property.licenseType,
      conciergeServiceOffer: property.conciergeServiceOffer,
      categories: property.categories,
      operatedByExternal: property.operatedByExternal,
    },
  })

  const [locationData, setLocationData] = useState({
    address: property.address || "",
    additionalDetails: property.additionalDetails || "",
    postcode: property.postcode || "",
    city: property.city || "",
    latitude: property.latitude || null,
    longitude: property.longitude || null,
  })

  const handleSaveGeneral = async () => {
    try {
      const values = form.getValues()
      await updateProperty.mutateAsync({ 
        id: property.id, 
        data: { ...values, categories } 
      })
      toast.success("General information updated successfully")
      setIsEditingGeneral(false)
    } catch (error) {
      toast.error("Failed to update general information")
    }
  }

  const handleSaveLocation = async () => {
    try {
      await updateProperty.mutateAsync({ 
        id: property.id, 
        data: locationData 
      })
      toast.success("Location information updated successfully")
      setIsEditingLocation(false)
    } catch (error) {
      toast.error("Failed to update location")
    }
  }

  const handleCancelGeneral = () => {
    form.reset()
    setCategories(property.categories)
    setNewCategory("")
    setIsEditingGeneral(false)
  }

  const handleCancelLocation = () => {
    setLocationData({
      address: property.address || "",
      additionalDetails: property.additionalDetails || "",
      postcode: property.postcode || "",
      city: property.city || "",
      latitude: property.latitude || null,
      longitude: property.longitude || null,
    })
    setIsEditingLocation(false)
  }

  const addCategory = () => {
    if (newCategory.trim()) {
      const updatedCategories = [...categories, newCategory.trim()]
      setCategories(updatedCategories)
      form.setValue("categories", updatedCategories)
      setNewCategory("")
    }
  }

  const removeCategory = (index: number) => {
    const updatedCategories = categories.filter((_, i) => i !== index)
    setCategories(updatedCategories)
    form.setValue("categories", updatedCategories)
  }

  const statusOptions = [
    { value: "PUBLISHED", label: "Published", className: "bg-green-100 text-green-800" },
    { value: "HIDDEN", label: "Hidden", className: "bg-red-100 text-red-800" },
    { value: "ONBOARDING", label: "Onboarding", className: "bg-yellow-100 text-yellow-800" },
  ]

  return (
    <>
      <PropertySection
        title="General Information"
        isEditing={isEditingGeneral}
        onEdit={() => setIsEditingGeneral(true)}
        onSave={handleSaveGeneral}
        onCancel={handleCancelGeneral}
        isSaving={updateProperty.isPending}
        canEdit={canEdit}
      >
        {isEditingGeneral ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Name</Label>
                <Input {...form.register("name")} className="mt-1" />
              </div>
              <div>
                <Label>Status</Label>
                <Select
                  value={form.watch("status")}
                  onValueChange={(value) => form.setValue("status", value as PropertyStatus)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Original name</Label>
              <Input {...form.register("originalName")} className="mt-1" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>License type</Label>
                <Select
                  value={form.watch("licenseType")}
                  onValueChange={(value) => form.setValue("licenseType", value as LicenseType)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NOT_APPLICABLE">Not Applicable</SelectItem>
                    <SelectItem value="TYPE_1">Type 1</SelectItem>
                    <SelectItem value="TYPE_2">Type 2</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Concierge service offer</Label>
                <Select
                  value={form.watch("conciergeServiceOffer")}
                  onValueChange={(value) => form.setValue("conciergeServiceOffer", value as ConciergeServiceOffer)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ESSENTIAL">Essential</SelectItem>
                    <SelectItem value="PREMIUM">Premium</SelectItem>
                    <SelectItem value="LUXURY">Luxury</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Categories</Label>
              <div className="space-y-2 mt-1">
                <div className="flex gap-2">
                  <Input
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder="Add category"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCategory())}
                  />
                  <button
                    type="button"
                    onClick={addCategory}
                    className="px-3 py-2 bg-[#B5985A] text-white rounded hover:bg-[#B5985A]/90"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {categories.map((category, index) => (
                    <Badge key={index} variant="secondary" className="gap-1">
                      {category}
                      <button
                        type="button"
                        onClick={() => removeCategory(index)}
                        className="ml-1 hover:text-red-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <Label>Operated by (external agency)</Label>
              <Input {...form.register("operatedByExternal")} className="mt-1" />
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-600">Name</Label>
                <p className="mt-1">{property.name}</p>
              </div>
              <div>
                <Label className="text-gray-600">Status</Label>
                <div className="mt-1">
                  <Badge className={statusOptions.find(o => o.value === property.status)?.className}>
                    {statusOptions.find(o => o.value === property.status)?.label}
                  </Badge>
                </div>
              </div>
            </div>

            <div>
              <Label className="text-gray-600">Original name</Label>
              <p className="mt-1">{property.originalName || "—"}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-600">License type</Label>
                <p className="mt-1">{property.licenseType.replace("_", " ")}</p>
              </div>
              <div>
                <Label className="text-gray-600">Concierge service offer</Label>
                <p className="mt-1">{property.conciergeServiceOffer}</p>
              </div>
            </div>

            <div>
              <Label className="text-gray-600">Categories</Label>
              <div className="mt-1">
                {property.categories.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {property.categories.map((category, index) => (
                      <Badge key={index} variant="secondary">
                        {category}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">—</p>
                )}
              </div>
            </div>

            <div>
              <Label className="text-gray-600">Operated by (external agency)</Label>
              <p className="mt-1">{property.operatedByExternal || "—"}</p>
            </div>
          </div>
        )}
      </PropertySection>

      <PropertySection
        title="Location"
        isEditing={isEditingLocation}
        onEdit={() => setIsEditingLocation(true)}
        onSave={handleSaveLocation}
        onCancel={handleCancelLocation}
        isSaving={updateProperty.isPending}
        canEdit={canEdit}
      >
        {isEditingLocation ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Address</Label>
                <Input 
                  value={locationData.address} 
                  onChange={(e) => setLocationData({...locationData, address: e.target.value})}
                  className="mt-1" 
                />
              </div>
              <div>
                <Label>Additional details</Label>
                <Input 
                  value={locationData.additionalDetails} 
                  onChange={(e) => setLocationData({...locationData, additionalDetails: e.target.value})}
                  className="mt-1" 
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Postcode</Label>
                <Input 
                  value={locationData.postcode} 
                  onChange={(e) => setLocationData({...locationData, postcode: e.target.value})}
                  className="mt-1" 
                />
              </div>
              <div>
                <Label>City</Label>
                <Input 
                  value={locationData.city} 
                  onChange={(e) => setLocationData({...locationData, city: e.target.value})}
                  className="mt-1" 
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Latitude</Label>
                <Input 
                  type="number" 
                  step="0.000001" 
                  value={locationData.latitude || ""} 
                  onChange={(e) => setLocationData({...locationData, latitude: e.target.value ? parseFloat(e.target.value) : null})}
                  className="mt-1" 
                />
              </div>
              <div>
                <Label>Longitude</Label>
                <Input 
                  type="number" 
                  step="0.000001" 
                  value={locationData.longitude || ""} 
                  onChange={(e) => setLocationData({...locationData, longitude: e.target.value ? parseFloat(e.target.value) : null})}
                  className="mt-1" 
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-600">Destination</Label>
                <p className="mt-1">{property.destination.name}, {property.destination.country}</p>
              </div>
              <div>
                <Label className="text-gray-600">Additional details</Label>
                <p className="mt-1">{property.additionalDetails || "—"}</p>
              </div>
            </div>

            <div>
              <Label className="text-gray-600">Address</Label>
              <p className="mt-1">{property.address || "—"}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-600">Postcode</Label>
                <p className="mt-1">{property.postcode || "—"}</p>
              </div>
              <div>
                <Label className="text-gray-600">City</Label>
                <p className="mt-1">{property.city || "—"}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-600">Latitude</Label>
                <p className="mt-1">{property.latitude || "—"}</p>
              </div>
              <div>
                <Label className="text-gray-600">Longitude</Label>
                <p className="mt-1">{property.longitude || "—"}</p>
              </div>
            </div>
          </div>
        )}
      </PropertySection>
    </>
  )
}