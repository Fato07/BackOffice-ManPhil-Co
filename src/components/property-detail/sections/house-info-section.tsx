"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { X } from "lucide-react"
import { PropertySection } from "../property-section"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { updatePropertyBasicSchema, updatePropertyDescriptionSchema, updatePropertyParkingSchema } from "@/lib/validations"
import { useUpdateProperty } from "@/hooks/use-properties"
import { PropertyStatus, LicenseType, ConciergeServiceOffer, PropertyDescription, PropertyParking } from "@/types/property"
import { Checkbox } from "@/components/ui/checkbox"
import { z } from "zod"
import { toast } from "sonner"
import { usePermissions } from "@/hooks/use-permissions"
import { Permission } from "@/types/auth"
import { GoogleMapsLink } from "@/components/ui/google-maps-link"

type BasicInfoFormData = z.infer<typeof updatePropertyBasicSchema>
type DescriptionFormData = z.infer<typeof updatePropertyDescriptionSchema>
type ParkingFormData = z.infer<typeof updatePropertyParkingSchema>

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
    description: any
    parking: any
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
  const [isEditingDescription, setIsEditingDescription] = useState(false)
  const [isEditingParking, setIsEditingParking] = useState(false)
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

  // Synchronize locationData with property changes
  useEffect(() => {
    setLocationData({
      address: property.address || "",
      additionalDetails: property.additionalDetails || "",
      postcode: property.postcode || "",
      city: property.city || "",
      latitude: property.latitude || null,
      longitude: property.longitude || null,
    })
  }, [property.address, property.additionalDetails, property.postcode, property.city, property.latitude, property.longitude])

  // Parse description and parking JSON data
  const descriptionData = property.description as PropertyDescription || {}
  const parkingData = property.parking as PropertyParking || {}

  const descriptionForm = useForm<DescriptionFormData>({
    resolver: zodResolver(updatePropertyDescriptionSchema),
    defaultValues: {
      description: {
        houseType: descriptionData.houseType || undefined,
        architecturalType: descriptionData.architecturalType || undefined,
        floorArea: descriptionData.floorArea || undefined,
        plotSize: descriptionData.plotSize || undefined,
        numberOfFurnishedFloors: descriptionData.numberOfFurnishedFloors || undefined,
        adjoiningHouse: descriptionData.adjoiningHouse || false,
        maxGuestCapacity: descriptionData.maxGuestCapacity || undefined,
        maxAdultCapacity: descriptionData.maxAdultCapacity || undefined,
        numberOfBedrooms: descriptionData.numberOfBedrooms || undefined,
        numberOfBedroomsForLiveInStaff: descriptionData.numberOfBedroomsForLiveInStaff || undefined,
        numberOfBathrooms: descriptionData.numberOfBathrooms || undefined,
      }
    }
  })

  const parkingForm = useForm<ParkingFormData>({
    resolver: zodResolver(updatePropertyParkingSchema),
    defaultValues: {
      parking: {
        hasChargingStation: parkingData.hasChargingStation || false,
        hasIndoorParking: parkingData.hasIndoorParking || false,
        hasOutdoorParking: parkingData.hasOutdoorParking || false,
        numberOfParkingSpots: parkingData.numberOfParkingSpots || undefined,
      }
    }
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

  const handleSaveDescription = async (data: DescriptionFormData) => {
    try {
      await updateProperty.mutateAsync({ 
        id: property.id, 
        data: data 
      })
      toast.success("Description updated successfully")
      setIsEditingDescription(false)
    } catch (error) {
      toast.error("Failed to update description")
    }
  }

  const handleSaveParking = async (data: ParkingFormData) => {
    try {
      await updateProperty.mutateAsync({ 
        id: property.id, 
        data: data 
      })
      toast.success("Car park information updated successfully")
      setIsEditingParking(false)
    } catch (error) {
      toast.error("Failed to update car park information")
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

  const handleCancelDescription = () => {
    descriptionForm.reset()
    setIsEditingDescription(false)
  }

  const handleCancelParking = () => {
    parkingForm.reset()
    setIsEditingParking(false)
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

      <div className="mb-6" />

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
                <div className="space-y-2">
                  <Input 
                    value={locationData.address} 
                    onChange={(e) => setLocationData({...locationData, address: e.target.value})}
                    className="mt-1" 
                  />
                  {(locationData.address || (locationData.latitude && locationData.longitude)) && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">Preview:</span>
                      <GoogleMapsLink 
                        address={locationData.address}
                        latitude={locationData.latitude}
                        longitude={locationData.longitude}
                      />
                    </div>
                  )}
                </div>
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
              <div className="mt-1 flex items-center gap-2">
                <p>{property.address || "—"}</p>
                {(property.address || (property.latitude && property.longitude)) && (
                  <GoogleMapsLink 
                    address={property.address}
                    latitude={property.latitude}
                    longitude={property.longitude}
                  />
                )}
              </div>
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

      <div className="mb-6" />

      <PropertySection
        title="Description"
        isEditing={isEditingDescription}
        onEdit={() => setIsEditingDescription(true)}
        onSave={descriptionForm.handleSubmit(handleSaveDescription)}
        onCancel={handleCancelDescription}
        isSaving={updateProperty.isPending}
        canEdit={canEdit}
      >
        {isEditingDescription ? (
          <form onSubmit={descriptionForm.handleSubmit(handleSaveDescription)}>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>House type</Label>
                  <Select
                    value={descriptionForm.watch("description.houseType")}
                    onValueChange={(value) => descriptionForm.setValue("description.houseType", value as any)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select house type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="VILLA">Villa</SelectItem>
                      <SelectItem value="APARTMENT">Apartment</SelectItem>
                      <SelectItem value="CHALET">Chalet</SelectItem>
                      <SelectItem value="PENTHOUSE">Penthouse</SelectItem>
                      <SelectItem value="TOWNHOUSE">Townhouse</SelectItem>
                      <SelectItem value="CASTLE">Castle</SelectItem>
                      <SelectItem value="MANOR">Manor</SelectItem>
                      <SelectItem value="COTTAGE">Cottage</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Architectural house type</Label>
                  <Select
                    value={descriptionForm.watch("description.architecturalType")}
                    onValueChange={(value) => descriptionForm.setValue("description.architecturalType", value as any)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select architectural type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CONTEMPORARY">Contemporary interior</SelectItem>
                      <SelectItem value="TRADITIONAL">Traditional</SelectItem>
                      <SelectItem value="MODERN">Modern</SelectItem>
                      <SelectItem value="RUSTIC">Rustic</SelectItem>
                      <SelectItem value="COLONIAL">Colonial</SelectItem>
                      <SelectItem value="MEDITERRANEAN">Mediterranean</SelectItem>
                      <SelectItem value="MINIMALIST">Minimalist</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Floor area in sqm</Label>
                  <Input 
                    type="number"
                    min="0"
                    {...descriptionForm.register("description.floorArea", { valueAsNumber: true })}
                    className="mt-1" 
                    placeholder="277"
                  />
                </div>
                <div>
                  <Label>Plot size in sqm</Label>
                  <Input 
                    type="number"
                    min="0"
                    {...descriptionForm.register("description.plotSize", { valueAsNumber: true })}
                    className="mt-1" 
                    placeholder="1950"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Number of furnished floors</Label>
                  <Input 
                    type="number"
                    min="0"
                    {...descriptionForm.register("description.numberOfFurnishedFloors", { valueAsNumber: true })}
                    className="mt-1" 
                    placeholder="2"
                  />
                </div>
                <div className="flex items-center space-x-2 mt-6">
                  <Checkbox 
                    id="adjoiningHouse"
                    checked={descriptionForm.watch("description.adjoiningHouse")}
                    onCheckedChange={(checked) => descriptionForm.setValue("description.adjoiningHouse", !!checked)}
                  />
                  <Label htmlFor="adjoiningHouse">Adjoining house</Label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Maximum guest capacity</Label>
                  <Input 
                    type="number"
                    min="0"
                    {...descriptionForm.register("description.maxGuestCapacity", { valueAsNumber: true })}
                    className="mt-1" 
                    placeholder="10"
                  />
                </div>
                <div>
                  <Label>Maximum adult capacity</Label>
                  <Input 
                    type="number"
                    min="0"
                    {...descriptionForm.register("description.maxAdultCapacity", { valueAsNumber: true })}
                    className="mt-1" 
                    placeholder="10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Number of bedrooms</Label>
                  <Input 
                    type="number"
                    min="0"
                    {...descriptionForm.register("description.numberOfBedrooms", { valueAsNumber: true })}
                    className="mt-1" 
                    placeholder="5"
                  />
                </div>
                <div>
                  <Label>Number of bedrooms for live-in staff</Label>
                  <Input 
                    type="number"
                    min="0"
                    {...descriptionForm.register("description.numberOfBedroomsForLiveInStaff", { valueAsNumber: true })}
                    className="mt-1" 
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <Label>Number of bathrooms</Label>
                <Input 
                  type="number"
                  min="0"
                  {...descriptionForm.register("description.numberOfBathrooms", { valueAsNumber: true })}
                  className="mt-1 w-1/2" 
                  placeholder="5"
                />
              </div>
            </div>
          </form>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-600">House type</Label>
                <p className="mt-1">{descriptionData.houseType?.replace(/_/g, ' ') || "—"}</p>
              </div>
              <div>
                <Label className="text-gray-600">Architectural house type</Label>
                <p className="mt-1">{descriptionData.architecturalType?.toLowerCase().replace(/_/g, ' ') || "—"}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-600">Floor area in sqm</Label>
                <p className="mt-1">{descriptionData.floorArea || "—"}</p>
              </div>
              <div>
                <Label className="text-gray-600">Plot size in sqm</Label>
                <p className="mt-1">{descriptionData.plotSize || "—"}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-600">Number of furnished floors</Label>
                <p className="mt-1">{descriptionData.numberOfFurnishedFloors || "—"}</p>
              </div>
              <div>
                <Label className="text-gray-600">Adjoining house</Label>
                <p className="mt-1">{descriptionData.adjoiningHouse ? "Yes" : "No"}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-600">Maximum guest capacity</Label>
                <p className="mt-1">{descriptionData.maxGuestCapacity || "—"}</p>
              </div>
              <div>
                <Label className="text-gray-600">Maximum adult capacity</Label>
                <p className="mt-1">{descriptionData.maxAdultCapacity || "—"}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-600">Number of bedrooms</Label>
                <p className="mt-1">{descriptionData.numberOfBedrooms || "—"}</p>
              </div>
              <div>
                <Label className="text-gray-600">Number of bedrooms for live-in staff</Label>
                <p className="mt-1">{descriptionData.numberOfBedroomsForLiveInStaff || "—"}</p>
              </div>
            </div>

            <div>
              <Label className="text-gray-600">Number of bathrooms</Label>
              <p className="mt-1">{descriptionData.numberOfBathrooms || "—"}</p>
            </div>
          </div>
        )}
      </PropertySection>

      <div className="mb-6" />

      <PropertySection
        title="Car park"
        isEditing={isEditingParking}
        onEdit={() => setIsEditingParking(true)}
        onSave={parkingForm.handleSubmit(handleSaveParking)}
        onCancel={handleCancelParking}
        isSaving={updateProperty.isPending}
        canEdit={canEdit}
      >
        {isEditingParking ? (
          <form onSubmit={parkingForm.handleSubmit(handleSaveParking)}>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="chargingStation"
                    checked={parkingForm.watch("parking.hasChargingStation")}
                    onCheckedChange={(checked) => parkingForm.setValue("parking.hasChargingStation", !!checked)}
                  />
                  <Label htmlFor="chargingStation">Charging station</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="indoorParking"
                    checked={parkingForm.watch("parking.hasIndoorParking")}
                    onCheckedChange={(checked) => parkingForm.setValue("parking.hasIndoorParking", !!checked)}
                  />
                  <Label htmlFor="indoorParking">Indoor parking spots</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="outdoorParking"
                    checked={parkingForm.watch("parking.hasOutdoorParking")}
                    onCheckedChange={(checked) => parkingForm.setValue("parking.hasOutdoorParking", !!checked)}
                  />
                  <Label htmlFor="outdoorParking">Outdoor parking spots</Label>
                </div>
              </div>

              <div>
                <Label>Number of parking spots</Label>
                <Input 
                  type="number"
                  min="0"
                  {...parkingForm.register("parking.numberOfParkingSpots", { valueAsNumber: true })}
                  className="mt-1 w-1/2" 
                  placeholder="4"
                />
              </div>
            </div>
          </form>
        ) : (
          <div className="space-y-3">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <input type="checkbox" checked={parkingData.hasChargingStation} disabled className="h-4 w-4" />
                <Label className="text-gray-600">Charging station</Label>
              </div>

              <div className="flex items-center space-x-2">
                <input type="checkbox" checked={parkingData.hasIndoorParking} disabled className="h-4 w-4" />
                <Label className="text-gray-600">Indoor parking spots</Label>
              </div>

              <div className="flex items-center space-x-2">
                <input type="checkbox" checked={parkingData.hasOutdoorParking} disabled className="h-4 w-4" />
                <Label className="text-gray-600">Outdoor parking spots</Label>
              </div>
            </div>

            <div>
              <Label className="text-gray-600">Number of parking spots</Label>
              <p className="mt-1">{parkingData.numberOfParkingSpots || "—"}</p>
            </div>
          </div>
        )}
      </PropertySection>
    </>
  )
}