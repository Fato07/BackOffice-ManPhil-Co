"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { PropertySection } from "../property-section"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useUpdateProperty } from "@/hooks/use-properties"
import { PropertyWithRelations } from "@/types/property"
import { toast } from "sonner"
import { usePermissions } from "@/hooks/use-permissions"
import { Permission } from "@/types/auth"
import { Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const heatingSchema = z.object({
  // Heating System
  heatingSystemType: z.enum([
    "CENTRAL",
    "UNDERFLOOR",
    "RADIATORS",
    "HEAT_PUMP",
    "FIREPLACE",
    "ELECTRIC_HEATERS",
    "GAS_HEATERS",
    "SOLAR",
    "NONE"
  ]).default("NONE"),
  heatingAvailability: z.enum([
    "YEAR_ROUND",
    "WINTER_ONLY",
    "ON_REQUEST",
    "NOT_AVAILABLE"
  ]).default("NOT_AVAILABLE"),
  
  // Temperature Control
  temperatureControlType: z.enum([
    "CENTRAL_THERMOSTAT",
    "ROOM_THERMOSTATS",
    "MANUAL_CONTROLS",
    "SMART_HOME_SYSTEM",
    "NONE"
  ]).default("NONE"),
  
  // Energy
  energySource: z.enum([
    "GAS",
    "ELECTRIC",
    "OIL",
    "SOLAR",
    "WOOD",
    "OTHER"
  ]).default("ELECTRIC"),
  energyEfficiencyRating: z.enum([
    "A",
    "B",
    "C",
    "D",
    "E",
    "F",
    "G",
    "NOT_RATED"
  ]).default("NOT_RATED"),
  
  // Heating Schedule
  hasHeatingSchedule: z.boolean().default(false),
  heatingScheduleDetails: z.string().optional(),
  
  // Room-specific heating
  roomHeatingSettings: z.array(z.object({
    roomName: z.string().min(1),
    hasIndividualControl: z.boolean().default(false),
    heatingType: z.enum([
      "RADIATOR",
      "UNDERFLOOR",
      "ELECTRIC_HEATER",
      "FIREPLACE",
      "OTHER",
      "NONE"
    ]).default("NONE"),
    notes: z.string().optional(),
  })).default([]),
  
  // Additional Info
  heatingNotes: z.string().optional(),
})

type HeatingData = z.infer<typeof heatingSchema>

interface HeatingSectionProps {
  property: PropertyWithRelations
}

export function HeatingSection({ property }: HeatingSectionProps) {
  const [isEditing, setIsEditing] = useState(false)
  const updateProperty = useUpdateProperty()
  const { hasPermission } = usePermissions()
  const canEdit = hasPermission(Permission.PROPERTY_EDIT)

  // Parse existing heatingAC JSON data
  const existingData = property.heatingAC as HeatingData | null

  const form = useForm<z.input<typeof heatingSchema>>({
    resolver: zodResolver(heatingSchema),
    defaultValues: {
      heatingSystemType: existingData?.heatingSystemType || "NONE",
      heatingAvailability: existingData?.heatingAvailability || "NOT_AVAILABLE",
      temperatureControlType: existingData?.temperatureControlType || "NONE",
      energySource: existingData?.energySource || "ELECTRIC",
      energyEfficiencyRating: existingData?.energyEfficiencyRating || "NOT_RATED",
      hasHeatingSchedule: existingData?.hasHeatingSchedule || false,
      heatingScheduleDetails: existingData?.heatingScheduleDetails || "",
      roomHeatingSettings: existingData?.roomHeatingSettings || [],
      heatingNotes: existingData?.heatingNotes || "",
    },
  })

  const roomHeatingSettings = form.watch("roomHeatingSettings")
  const hasHeatingSchedule = form.watch("hasHeatingSchedule")

  const addRoomHeatingSetting = () => {
    form.setValue("roomHeatingSettings", [
      ...(roomHeatingSettings || []),
      { 
        roomName: "", 
        hasIndividualControl: false, 
        heatingType: "NONE",
        notes: ""
      }
    ])
  }

  const removeRoomHeatingSetting = (index: number) => {
    form.setValue("roomHeatingSettings", (roomHeatingSettings || []).filter((_, i) => i !== index))
  }

  const handleSave = async (data: z.input<typeof heatingSchema>) => {
    try {
      await updateProperty.mutateAsync({
        id: property.id,
        data: {
          heatingAC: data,
        },
      })
      toast.success("Heating information updated successfully")
      setIsEditing(false)
    } catch {
      toast.error("Failed to update heating information")
    }
  }

  const handleCancel = () => {
    form.reset()
    setIsEditing(false)
  }

  return (
    <PropertySection
      title="Heating"
      isEditing={isEditing}
      onEdit={() => setIsEditing(true)}
      onSave={form.handleSubmit(handleSave)}
      onCancel={handleCancel}
      isSaving={updateProperty.isPending}
      canEdit={canEdit}
    >
      <div className="space-y-8">
        <div>
          <h3 className="text-base font-semibold mb-4">Heating System</h3>
          <div className="space-y-4">
            <div>
              <Label>System type</Label>
              <RadioGroup
                className="mt-2 grid grid-cols-3 gap-3"
                disabled={!isEditing}
                value={form.watch("heatingSystemType")}
                onValueChange={(value) => form.setValue("heatingSystemType", value as z.infer<typeof heatingSchema>["heatingSystemType"])}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="CENTRAL" />
                  <Label>Central heating</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="UNDERFLOOR" />
                  <Label>Underfloor heating</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="RADIATORS" />
                  <Label>Radiators</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="HEAT_PUMP" />
                  <Label>Heat pump</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="FIREPLACE" />
                  <Label>Fireplace</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="ELECTRIC_HEATERS" />
                  <Label>Electric heaters</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="GAS_HEATERS" />
                  <Label>Gas heaters</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="SOLAR" />
                  <Label>Solar</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="NONE" />
                  <Label>None</Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <Label>Availability</Label>
              <RadioGroup
                className="mt-2"
                disabled={!isEditing}
                value={form.watch("heatingAvailability")}
                onValueChange={(value) => form.setValue("heatingAvailability", value as z.infer<typeof heatingSchema>["heatingAvailability"])}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="YEAR_ROUND" />
                  <Label>Year-round</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="WINTER_ONLY" />
                  <Label>Winter only</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="ON_REQUEST" />
                  <Label>On request</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="NOT_AVAILABLE" />
                  <Label>Not available</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-base font-semibold mb-4">Temperature Control</h3>
          <div>
            <Label>Control type</Label>
            <RadioGroup
              className="mt-2"
              disabled={!isEditing}
              value={form.watch("temperatureControlType")}
              onValueChange={(value) => form.setValue("temperatureControlType", value as z.infer<typeof heatingSchema>["temperatureControlType"])}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="CENTRAL_THERMOSTAT" />
                <Label>Central thermostat</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="ROOM_THERMOSTATS" />
                <Label>Room thermostats</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="MANUAL_CONTROLS" />
                <Label>Manual controls</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="SMART_HOME_SYSTEM" />
                <Label>Smart home system</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="NONE" />
                <Label>None</Label>
              </div>
            </RadioGroup>
          </div>
        </div>

        <div>
          <h3 className="text-base font-semibold mb-4">Energy Information</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Energy source</Label>
                <Select
                  disabled={!isEditing}
                  value={form.watch("energySource")}
                  onValueChange={(value) => form.setValue("energySource", value as z.infer<typeof heatingSchema>["energySource"])}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GAS">Gas</SelectItem>
                    <SelectItem value="ELECTRIC">Electric</SelectItem>
                    <SelectItem value="OIL">Oil</SelectItem>
                    <SelectItem value="SOLAR">Solar</SelectItem>
                    <SelectItem value="WOOD">Wood</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Energy efficiency rating</Label>
                <Select
                  disabled={!isEditing}
                  value={form.watch("energyEfficiencyRating")}
                  onValueChange={(value) => form.setValue("energyEfficiencyRating", value as z.infer<typeof heatingSchema>["energyEfficiencyRating"])}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A">A</SelectItem>
                    <SelectItem value="B">B</SelectItem>
                    <SelectItem value="C">C</SelectItem>
                    <SelectItem value="D">D</SelectItem>
                    <SelectItem value="E">E</SelectItem>
                    <SelectItem value="F">F</SelectItem>
                    <SelectItem value="G">G</SelectItem>
                    <SelectItem value="NOT_RATED">Not rated</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-base font-semibold mb-4">Heating Schedule</h3>
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Checkbox
                disabled={!isEditing}
                checked={hasHeatingSchedule}
                onCheckedChange={(checked) => form.setValue("hasHeatingSchedule", !!checked)}
              />
              <Label>Has heating schedule/timer settings</Label>
            </div>
            {hasHeatingSchedule && (
              <div>
                <Label>Schedule details</Label>
                <Textarea
                  className="mt-2"
                  disabled={!isEditing}
                  {...form.register("heatingScheduleDetails")}
                  placeholder="Describe the heating schedule and timer settings..."
                  rows={3}
                />
              </div>
            )}
          </div>
        </div>

        <div>
          <h3 className="text-base font-semibold mb-4">Room-specific Heating</h3>
          <div className="space-y-4">
            {(roomHeatingSettings || []).map((room, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div className="grid grid-cols-2 gap-4 flex-1">
                    <div>
                      <Label>Room name</Label>
                      <Input
                        className="mt-2"
                        disabled={!isEditing}
                        value={room.roomName}
                        onChange={(e) => {
                          const updated = [...(roomHeatingSettings || [])]
                          updated[index].roomName = e.target.value
                          form.setValue("roomHeatingSettings", updated)
                        }}
                        placeholder="e.g., Master bedroom, Living room"
                      />
                    </div>
                    <div>
                      <Label>Heating type</Label>
                      <Select
                        disabled={!isEditing}
                        value={room.heatingType}
                        onValueChange={(value) => {
                          const updated = [...(roomHeatingSettings || [])]
                          updated[index].heatingType = value as z.infer<typeof heatingSchema>["roomHeatingSettings"][0]["heatingType"]
                          form.setValue("roomHeatingSettings", updated)
                        }}
                      >
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="RADIATOR">Radiator</SelectItem>
                          <SelectItem value="UNDERFLOOR">Underfloor</SelectItem>
                          <SelectItem value="ELECTRIC_HEATER">Electric heater</SelectItem>
                          <SelectItem value="FIREPLACE">Fireplace</SelectItem>
                          <SelectItem value="OTHER">Other</SelectItem>
                          <SelectItem value="NONE">None</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {isEditing && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-red-600"
                      onClick={() => removeRoomHeatingSetting(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="flex items-center space-x-3">
                  <Checkbox
                    disabled={!isEditing}
                    checked={room.hasIndividualControl}
                    onCheckedChange={(checked) => {
                      const updated = [...(roomHeatingSettings || [])]
                      updated[index].hasIndividualControl = !!checked
                      form.setValue("roomHeatingSettings", updated)
                    }}
                  />
                  <Label>Has individual temperature control</Label>
                </div>
                <div>
                  <Label>Notes</Label>
                  <Input
                    className="mt-2"
                    disabled={!isEditing}
                    value={room.notes}
                    onChange={(e) => {
                      const updated = [...(roomHeatingSettings || [])]
                      updated[index].notes = e.target.value
                      form.setValue("roomHeatingSettings", updated)
                    }}
                    placeholder="Additional notes about this room's heating..."
                  />
                </div>
              </div>
            ))}
            {isEditing && (
              <Button
                type="button"
                variant="outline"
                onClick={addRoomHeatingSetting}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add room
              </Button>
            )}
          </div>
        </div>

        <div>
          <Label>Additional heating notes</Label>
          <Textarea
            className="mt-2"
            disabled={!isEditing}
            {...form.register("heatingNotes")}
            placeholder="Additional information about the heating system..."
            rows={4}
          />
        </div>
      </div>
    </PropertySection>
  )
}