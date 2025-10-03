"use client"

import { useState, useTransition } from "react"
import { PropertyWithRelations, StayMetadata } from "@/types/property"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import { updateAccessInfo } from "@/actions/property-stay"
import { Plane, Train, Car, MapPin, Key, AlertCircle, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface AccessDetailsProps {
  property: PropertyWithRelations
}

const roadTypeOptions = [
  { value: 'asphalt', label: 'Asphalt road', color: 'bg-gray-100' },
  { value: 'winding', label: 'Winding road', color: 'bg-yellow-100' },
  { value: 'dirt', label: 'Dirt road', color: 'bg-orange-100' }
] as const

export function AccessDetails({ property }: AccessDetailsProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isPending, startTransition] = useTransition()
  
  const metadata = property.stayMetadata as StayMetadata | null
  const accessData = metadata?.access || {}

  // State for editing
  const [airports, setAirports] = useState<string[]>(accessData.airports || [])
  const [trainStations, setTrainStations] = useState<string[]>(accessData.trainStations || [])
  const [cars, setCars] = useState<string[]>(accessData.cars || [])
  const [roadType, setRoadType] = useState(accessData.roadType || 'asphalt')
  const [specialAttention, setSpecialAttention] = useState(accessData.specialAttention || false)
  const [specialAttentionNote, setSpecialAttentionNote] = useState(accessData.specialAttentionNote || '')
  const [keyCount, setKeyCount] = useState(accessData.keyCount || 0)
  const [beeperCount, setBeeperCount] = useState(accessData.beeperCount || 0)

  // Input states for adding items
  const [newAirport, setNewAirport] = useState('')
  const [newStation, setNewStation] = useState('')
  const [newCar, setNewCar] = useState('')

  const handleSave = () => {
    startTransition(async () => {
      try {
        const result = await updateAccessInfo({
          propertyId: property.id,
          stayMetadata: {
            ...metadata,
            access: {
              airports,
              trainStations,
              cars,
              roadType: roadType as 'asphalt' | 'winding' | 'dirt',
              specialAttention,
              specialAttentionNote: specialAttention ? specialAttentionNote : undefined,
              keyCount,
              beeperCount
            }
          }
        })

        if (!result.success) {
          throw new Error(result.error || 'Failed to update access details')
        }

        setIsEditing(false)
        toast.success("Access details updated successfully")
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to update access details")
      }
    })
  }

  const handleCancel = () => {
    setAirports(accessData.airports || [])
    setTrainStations(accessData.trainStations || [])
    setCars(accessData.cars || [])
    setRoadType(accessData.roadType || 'asphalt')
    setSpecialAttention(accessData.specialAttention || false)
    setSpecialAttentionNote(accessData.specialAttentionNote || '')
    setKeyCount(accessData.keyCount || 0)
    setBeeperCount(accessData.beeperCount || 0)
    setIsEditing(false)
  }

  const addItem = (type: 'airport' | 'station' | 'car') => {
    if (type === 'airport' && newAirport.trim()) {
      setAirports([...airports, newAirport.trim()])
      setNewAirport('')
    } else if (type === 'station' && newStation.trim()) {
      setTrainStations([...trainStations, newStation.trim()])
      setNewStation('')
    } else if (type === 'car' && newCar.trim()) {
      setCars([...cars, newCar.trim()])
      setNewCar('')
    }
  }

  const removeItem = (type: 'airport' | 'station' | 'car', index: number) => {
    if (type === 'airport') {
      setAirports(airports.filter((_, i) => i !== index))
    } else if (type === 'station') {
      setTrainStations(trainStations.filter((_, i) => i !== index))
    } else if (type === 'car') {
      setCars(cars.filter((_, i) => i !== index))
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h4 className="text-lg font-medium">Access Information</h4>
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

      <div className="space-y-4">
        <h5 className="font-medium">How to get there?</h5>
        
        <div>
          <Label className="flex items-center gap-2 mb-2">
            <Plane className="h-4 w-4 text-gray-500" />
            Airport(s)
          </Label>
          {isEditing ? (
            <div className="space-y-2">
              {airports.map((airport, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Badge variant="secondary" className="flex-1 justify-between">
                    {airport}
                    <X 
                      className="h-3 w-3 ml-2 cursor-pointer" 
                      onClick={() => removeItem('airport', index)}
                    />
                  </Badge>
                </div>
              ))}
              <div className="flex gap-2">
                <Input
                  placeholder="Add airport (e.g., Nice)"
                  value={newAirport}
                  onChange={(e) => setNewAirport(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addItem('airport'))}
                />
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => addItem('airport')}
                >
                  Add
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {airports.length > 0 ? (
                airports.map((airport, index) => (
                  <Badge key={index} variant="secondary">
                    <Plane className="h-3 w-3 mr-1" />
                    {airport}
                  </Badge>
                ))
              ) : (
                <span className="text-sm text-gray-500">No airports specified</span>
              )}
            </div>
          )}
        </div>

        <div>
          <Label className="flex items-center gap-2 mb-2">
            <Train className="h-4 w-4 text-gray-500" />
            Train Station(s)
          </Label>
          {isEditing ? (
            <div className="space-y-2">
              {trainStations.map((station, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Badge variant="secondary" className="flex-1 justify-between">
                    {station}
                    <X 
                      className="h-3 w-3 ml-2 cursor-pointer" 
                      onClick={() => removeItem('station', index)}
                    />
                  </Badge>
                </div>
              ))}
              <div className="flex gap-2">
                <Input
                  placeholder="Add train station (e.g., Les Arcs - Draguignan)"
                  value={newStation}
                  onChange={(e) => setNewStation(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addItem('station'))}
                />
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => addItem('station')}
                >
                  Add
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {trainStations.length > 0 ? (
                trainStations.map((station, index) => (
                  <Badge key={index} variant="secondary">
                    <Train className="h-3 w-3 mr-1" />
                    {station}
                  </Badge>
                ))
              ) : (
                <span className="text-sm text-gray-500">No train stations specified</span>
              )}
            </div>
          )}
        </div>

        <div>
          <Label className="flex items-center gap-2 mb-2">
            <Car className="h-4 w-4 text-gray-500" />
            Car(s)
          </Label>
          {isEditing ? (
            <div className="space-y-2">
              {cars.map((car, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Badge variant="secondary" className="flex-1 justify-between">
                    {car}
                    <X 
                      className="h-3 w-3 ml-2 cursor-pointer" 
                      onClick={() => removeItem('car', index)}
                    />
                  </Badge>
                </div>
              ))}
              <div className="flex gap-2">
                <Input
                  placeholder="Add car type (e.g., A8)"
                  value={newCar}
                  onChange={(e) => setNewCar(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addItem('car'))}
                />
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => addItem('car')}
                >
                  Add
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {cars.length > 0 ? (
                cars.map((car, index) => (
                  <Badge key={index} variant="secondary">
                    <Car className="h-3 w-3 mr-1" />
                    {car}
                  </Badge>
                ))
              ) : (
                <span className="text-sm text-gray-500">No cars specified</span>
              )}
            </div>
          )}
        </div>

        <div>
          <Label className="flex items-center gap-2 mb-2">
            <MapPin className="h-4 w-4 text-gray-500" />
            Road Type
          </Label>
          {isEditing ? (
            <div className="flex gap-2">
              {roadTypeOptions.map(option => (
                <Badge
                  key={option.value}
                  variant={roadType === option.value ? "default" : "outline"}
                  className={cn(
                    "cursor-pointer",
                    roadType === option.value && option.color
                  )}
                  onClick={() => setRoadType(option.value)}
                >
                  {option.label}
                </Badge>
              ))}
            </div>
          ) : (
            <Badge className={roadTypeOptions.find(o => o.value === roadType)?.color}>
              {roadTypeOptions.find(o => o.value === roadType)?.label}
            </Badge>
          )}
        </div>

        <div>
          <div className="flex items-center space-x-2 mb-2">
            <Checkbox
              id="special-attention"
              checked={specialAttention}
              onCheckedChange={(checked) => setSpecialAttention(checked === true)}
              disabled={!isEditing}
            />
            <Label 
              htmlFor="special-attention" 
              className="flex items-center gap-2 cursor-pointer"
            >
              <AlertCircle className="h-4 w-4 text-yellow-500" />
              Access requires special attention
            </Label>
          </div>
          {specialAttention && (
            <Textarea
              placeholder="Describe the special attention required..."
              value={specialAttentionNote}
              onChange={(e) => setSpecialAttentionNote(e.target.value)}
              disabled={!isEditing}
              rows={2}
            />
          )}
        </div>

        <div>
          <h5 className="font-medium mb-3 flex items-center gap-2">
            <Key className="h-4 w-4 text-gray-500" />
            Keys
          </h5>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Number of key sets</Label>
              <Input
                type="number"
                min="0"
                value={keyCount}
                onChange={(e) => setKeyCount(parseInt(e.target.value) || 0)}
                disabled={!isEditing}
              />
            </div>
            <div>
              <Label>Number of beepers</Label>
              <Input
                type="number"
                min="0"
                value={beeperCount}
                onChange={(e) => setBeeperCount(parseInt(e.target.value) || 0)}
                disabled={!isEditing}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}