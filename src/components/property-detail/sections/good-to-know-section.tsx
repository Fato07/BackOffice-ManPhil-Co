"use client"

import { useState, useMemo } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { PropertySection } from "../property-section"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useUpdateProperty } from "@/hooks/use-properties"
import { PropertyWithRelations } from "@/types/property"
import { toast } from "sonner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const goodToKnowSchema = z.object({
  propertyDescription: z.string().optional(),
  guestAccess: z.string().optional(),
  neighborhood: z.string().optional(),
  transportation: z.string().optional(),
  checkInInstructions: z.string().optional(),
  houseManual: z.string().optional(),
  localRecommendations: z.string().optional(),
  emergencyContacts: z.string().optional(),
  additionalNotes: z.string().optional(),
})

type GoodToKnowData = z.infer<typeof goodToKnowSchema>

interface GoodToKnowSectionProps {
  property: PropertyWithRelations
}

// TextSection component - moved outside to prevent recreation on every render
interface TextSectionProps {
  label: string
  field: keyof GoodToKnowData
  placeholder: string
  rows?: number
  form: any
  isEditing: boolean
}

const TextSection = ({ 
  label, 
  field,
  placeholder,
  rows = 6,
  form,
  isEditing 
}: TextSectionProps) => (
  <div>
    <Label className="text-base font-medium">{label}</Label>
    <Textarea
      className="mt-2"
      disabled={!isEditing}
      {...form.register(field)}
      placeholder={placeholder}
      rows={rows}
    />
    <p className="text-sm text-muted-foreground mt-1">
      {form.watch(field)?.length || 0} characters
    </p>
  </div>
)

export function GoodToKnowSection({ property }: GoodToKnowSectionProps) {
  const [isEditing, setIsEditing] = useState(false)
  const updateProperty = useUpdateProperty()

  // Parse goodToKnow field from JSON - memoized to prevent re-parsing on every render
  const goodToKnowData = useMemo(() => {
    if (!property.goodToKnow) return {}
    try {
      return JSON.parse(property.goodToKnow)
    } catch (error) {
      console.error('Failed to parse goodToKnow data:', error)
      return {}
    }
  }, [property.goodToKnow])

  // Memoize default values to prevent form re-initialization
  const defaultValues = useMemo(() => ({
    propertyDescription: goodToKnowData.propertyDescription || "",
    guestAccess: goodToKnowData.guestAccess || "",
    neighborhood: goodToKnowData.neighborhood || "",
    transportation: goodToKnowData.transportation || "",
    checkInInstructions: goodToKnowData.checkInInstructions || "",
    houseManual: goodToKnowData.houseManual || "",
    localRecommendations: goodToKnowData.localRecommendations || "",
    emergencyContacts: goodToKnowData.emergencyContacts || "",
    additionalNotes: goodToKnowData.additionalNotes || "",
  }), [goodToKnowData])

  const form = useForm<GoodToKnowData>({
    resolver: zodResolver(goodToKnowSchema),
    defaultValues,
  })

  const handleSave = async (data: GoodToKnowData) => {
    try {
      await updateProperty.mutateAsync({
        id: property.id,
        data: {
          goodToKnow: JSON.stringify(data),
        },
      })
      toast.success("Good to know information updated successfully")
      setIsEditing(false)
    } catch (error) {
      toast.error("Failed to update good to know information")
    }
  }

  const handleCancel = () => {
    form.reset(defaultValues)
    setIsEditing(false)
  }

  return (
    <PropertySection
      title="Good to Know"
      isEditing={isEditing}
      onEdit={() => setIsEditing(true)}
      onSave={form.handleSubmit(handleSave)}
      onCancel={handleCancel}
      isSaving={updateProperty.isPending}
    >
      <div className="space-y-6">
        <p className="text-sm text-muted-foreground">
          Provide detailed information that guests should know about your property. 
          This content will be shown to guests before and during their stay.
        </p>

        <Tabs defaultValue="property" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="property">Property</TabsTrigger>
            <TabsTrigger value="location">Location</TabsTrigger>
            <TabsTrigger value="checkin">Check-in</TabsTrigger>
            <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          </TabsList>

          <TabsContent value="property" className="space-y-6 mt-6">
            <TextSection
              label="Property Description"
              field="propertyDescription"
              placeholder="Describe your property in detail. Include unique features, ambiance, and what makes it special..."
              rows={10}
              form={form}
              isEditing={isEditing}
            />
            
            <TextSection
              label="Guest Access"
              field="guestAccess"
              placeholder="Describe what areas guests have access to and any restrictions..."
              form={form}
              isEditing={isEditing}
            />
            
            <TextSection
              label="House Manual"
              field="houseManual"
              placeholder="Include instructions for appliances, WiFi password, pool rules, etc..."
              rows={8}
              form={form}
              isEditing={isEditing}
            />
          </TabsContent>

          <TabsContent value="location" className="space-y-6 mt-6">
            <TextSection
              label="Neighborhood Overview"
              field="neighborhood"
              placeholder="Describe the neighborhood, nearby attractions, local culture..."
              rows={8}
              form={form}
              isEditing={isEditing}
            />
            
            <TextSection
              label="Transportation"
              field="transportation"
              placeholder="Explain how to get around: public transport, car rental, taxi services..."
              form={form}
              isEditing={isEditing}
            />
          </TabsContent>

          <TabsContent value="checkin" className="space-y-6 mt-6">
            <TextSection
              label="Check-in Instructions"
              field="checkInInstructions"
              placeholder="Provide detailed check-in instructions, key collection, parking..."
              rows={8}
              form={form}
              isEditing={isEditing}
            />
            
            <TextSection
              label="Emergency Contacts"
              field="emergencyContacts"
              placeholder="List emergency contacts, nearest hospital, police, property manager..."
              form={form}
              isEditing={isEditing}
            />
          </TabsContent>

          <TabsContent value="recommendations" className="space-y-6 mt-6">
            <TextSection
              label="Local Recommendations"
              field="localRecommendations"
              placeholder="Recommend restaurants, activities, hidden gems, must-see attractions..."
              rows={10}
              form={form}
              isEditing={isEditing}
            />
            
            <TextSection
              label="Additional Notes"
              field="additionalNotes"
              placeholder="Any other information guests should know..."
              form={form}
              isEditing={isEditing}
            />
          </TabsContent>
        </Tabs>

        {!isEditing && (
          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div>
              <p className="text-sm text-muted-foreground">Total characters</p>
              <p className="text-2xl font-semibold">
                {Object.values(form.getValues()).reduce((acc, val) => acc + (val?.length || 0), 0).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Sections filled</p>
              <p className="text-2xl font-semibold">
                {Object.values(form.getValues()).filter(val => val && val.length > 0).length} / 9
              </p>
            </div>
          </div>
        )}
      </div>
    </PropertySection>
  )
}