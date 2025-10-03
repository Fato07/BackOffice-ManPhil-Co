"use client"

import { useState, useTransition } from "react"
import { PropertyWithRelations, StayMetadata } from "@/types/property"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { updateSecurityInfo } from "@/actions/property-stay"
import { Camera, Hospital, Heart, FireExtinguisher, AlertTriangle, Zap, Shield, MapPin } from "lucide-react"

interface SecurityDetailsProps {
  property: PropertyWithRelations
}

const surveillanceOptions = [
  { id: 'fence', label: 'Fence' },
  { id: 'intercom', label: 'Intercom videophone' },
  { id: 'electric-gate', label: 'Electric gate' },
  { id: 'alarm-system', label: 'Alarm system' }
]

export function SecurityDetails({ property }: SecurityDetailsProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isPending, startTransition] = useTransition()
  
  const metadata = property.stayMetadata as StayMetadata | null
  const securityData = metadata?.security || {}

  // State for editing
  const [surveillance, setSurveillance] = useState<string[]>(securityData.surveillance || [])
  const [nearestHospital, setNearestHospital] = useState({
    name: securityData.nearestHospital?.name || '',
    country: securityData.nearestHospital?.country || '',
    distance: securityData.nearestHospital?.distance || ''
  })
  const [firstAidKit, setFirstAidKit] = useState(securityData.firstAidKit || false)
  const [firstAidLocation, setFirstAidLocation] = useState(securityData.firstAidLocation || '')
  const [hasFireExtinguisher, setHasFireExtinguisher] = useState(property.hasFireExtinguisher || false)
  const [hasFireAlarm, setHasFireAlarm] = useState(property.hasFireAlarm || false)
  const [fireExtinguisherLocation, setFireExtinguisherLocation] = useState(securityData.fireExtinguisherLocation || '')
  const [smokeDetectorLocation, setSmokeDetectorLocation] = useState(securityData.smokeDetectorLocation || '')
  const [electricMeterAccessible, setElectricMeterAccessible] = useState(property.electricMeterAccessible || false)
  const [electricMeterLocation, setElectricMeterLocation] = useState(property.electricMeterLocation || '')
  const [specificMeasures, setSpecificMeasures] = useState(securityData.specificMeasures || '')

  const handleSave = () => {
    startTransition(async () => {
      try {
        const result = await updateSecurityInfo({
          propertyId: property.id,
          hasFireExtinguisher,
          hasFireAlarm,
          electricMeterAccessible,
          electricMeterLocation: electricMeterLocation || null,
          stayMetadata: {
            ...metadata,
            security: {
              surveillance,
              nearestHospital: nearestHospital.name ? nearestHospital : undefined,
              firstAidKit,
              firstAidLocation: firstAidLocation || undefined,
              fireExtinguisherLocation: fireExtinguisherLocation || undefined,
              smokeDetectorLocation: smokeDetectorLocation || undefined,
              specificMeasures: specificMeasures || undefined
            }
          }
        })

        if (!result.success) {
          throw new Error(result.error || 'Failed to update security information')
        }

        setIsEditing(false)
        toast.success("Security information updated successfully")
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to update security information")
      }
    })
  }

  const handleCancel = () => {
    setSurveillance(securityData.surveillance || [])
    setNearestHospital({
      name: securityData.nearestHospital?.name || '',
      country: securityData.nearestHospital?.country || '',
      distance: securityData.nearestHospital?.distance || ''
    })
    setFirstAidKit(securityData.firstAidKit || false)
    setFirstAidLocation(securityData.firstAidLocation || '')
    setHasFireExtinguisher(property.hasFireExtinguisher || false)
    setHasFireAlarm(property.hasFireAlarm || false)
    setFireExtinguisherLocation(securityData.fireExtinguisherLocation || '')
    setSmokeDetectorLocation(securityData.smokeDetectorLocation || '')
    setElectricMeterAccessible(property.electricMeterAccessible || false)
    setElectricMeterLocation(property.electricMeterLocation || '')
    setSpecificMeasures(securityData.specificMeasures || '')
    setIsEditing(false)
  }

  const toggleSurveillance = (option: string) => {
    setSurveillance(prev => 
      prev.includes(option) 
        ? prev.filter(id => id !== option)
        : [...prev, option]
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h4 className="text-lg font-medium">Security</h4>
        {!isEditing ? (
          <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
            Edit
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleCancel}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={isPending}>
              {isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center gap-2 mb-3">
          <Camera className="h-5 w-5 text-gray-500" />
          <h5 className="font-medium">Surveillance</h5>
        </div>
        <div>
          <Label>Accessories</Label>
          {isEditing ? (
            <div className="grid grid-cols-2 gap-2 mt-2">
              {surveillanceOptions.map(option => (
                <div key={option.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={option.id}
                    checked={surveillance.includes(option.id)}
                    onCheckedChange={() => toggleSurveillance(option.id)}
                  />
                  <Label htmlFor={option.id} className="cursor-pointer text-sm">
                    {option.label}
                  </Label>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2 mt-2">
              {surveillance.length > 0 ? (
                surveillance.map(item => {
                  const option = surveillanceOptions.find(o => o.id === item)
                  return option ? (
                    <Badge key={item} variant="secondary">
                      {option.label}
                    </Badge>
                  ) : null
                })
              ) : (
                <span className="text-sm text-gray-500">No surveillance equipment</span>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="pt-6 border-t">
        <div className="flex items-center gap-2 mb-4">
          <Hospital className="h-5 w-5 text-gray-500" />
          <h5 className="font-medium">Rescue</h5>
        </div>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div>
                <Label>Nearest hospital</Label>
                <Input
                  value={nearestHospital.name}
                  onChange={(e) => setNearestHospital({...nearestHospital, name: e.target.value})}
                  placeholder="Hospital name"
                  disabled={!isEditing}
                />
              </div>
              <div>
                <Label>Country</Label>
                <Input
                  value={nearestHospital.country}
                  onChange={(e) => setNearestHospital({...nearestHospital, country: e.target.value})}
                  placeholder="Country"
                  disabled={!isEditing}
                />
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <Label>Distance</Label>
                <Input
                  value={nearestHospital.distance}
                  onChange={(e) => setNearestHospital({...nearestHospital, distance: e.target.value})}
                  placeholder="e.g., 13 km"
                  disabled={!isEditing}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="first-aid-kit"
                checked={firstAidKit}
                onCheckedChange={(checked) => setFirstAidKit(checked === true)}
                disabled={!isEditing}
              />
              <Label htmlFor="first-aid-kit" className="cursor-pointer flex items-center gap-2">
                <Heart className="h-4 w-4 text-red-500" />
                First aid kit
              </Label>
            </div>
            {firstAidKit && (
              <div className="ml-6">
                <Label>First aid kit location</Label>
                <Input
                  value={firstAidLocation}
                  onChange={(e) => setFirstAidLocation(e.target.value)}
                  placeholder="Location of first aid kit"
                  disabled={!isEditing}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="pt-6 border-t">
        <h5 className="font-medium mb-3">Electric meter</h5>
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="meter-accessible"
              checked={electricMeterAccessible}
              onCheckedChange={(checked) => setElectricMeterAccessible(checked === true)}
              disabled={!isEditing}
            />
            <Label htmlFor="meter-accessible" className="cursor-pointer">
              The electric meter is accessible to tenants
            </Label>
          </div>
          <div>
            <Label className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-500" />
              Electric meter location
            </Label>
            <Input
              value={electricMeterLocation}
              onChange={(e) => setElectricMeterLocation(e.target.value)}
              placeholder="e.g., Cupboard on the right at the entrance"
              disabled={!isEditing}
            />
          </div>
        </div>
      </div>

      <div className="pt-6 border-t">
        <h5 className="font-medium mb-3">Fire safety</h5>
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="fire-extinguisher"
              checked={hasFireExtinguisher}
              onCheckedChange={(checked) => setHasFireExtinguisher(checked === true)}
              disabled={!isEditing}
            />
            <Label htmlFor="fire-extinguisher" className="cursor-pointer flex items-center gap-2">
              <FireExtinguisher className="h-4 w-4 text-red-500" />
              Fire extinguishers available
            </Label>
          </div>
          {hasFireExtinguisher && (
            <div className="ml-6">
              <Label>Location of fire extinguishers</Label>
              <Input
                value={fireExtinguisherLocation}
                onChange={(e) => setFireExtinguisherLocation(e.target.value)}
                placeholder="Where are the fire extinguishers located?"
                disabled={!isEditing}
              />
            </div>
          )}

          <div className="flex items-center space-x-2">
            <Checkbox
              id="fire-alarm"
              checked={hasFireAlarm}
              onCheckedChange={(checked) => setHasFireAlarm(checked === true)}
              disabled={!isEditing}
            />
            <Label htmlFor="fire-alarm" className="cursor-pointer">
              Fire alarm system
            </Label>
          </div>

          <div>
            <Label className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              Location of smoke detectors
            </Label>
            <Input
              value={smokeDetectorLocation}
              onChange={(e) => setSmokeDetectorLocation(e.target.value)}
              placeholder="Where are the smoke detectors located?"
              disabled={!isEditing}
            />
          </div>
        </div>
      </div>

      <div className="pt-6 border-t">
        <Label className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-gray-500" />
          Specific security measures
        </Label>
        <Textarea
          value={specificMeasures}
          onChange={(e) => setSpecificMeasures(e.target.value)}
          placeholder="Describe any additional security measures or important information..."
          rows={3}
          disabled={!isEditing}
        />
      </div>
    </div>
  )
}