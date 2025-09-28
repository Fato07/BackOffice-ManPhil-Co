"use client"

import { useState, useTransition } from "react"
import { PropertyWithRelations, StayMetadata } from "@/types/property"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { updateNetworkInfo } from "@/actions/property-stay"
import { Wifi, Smartphone, Globe, Router, Shield } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface NetworkConnectionProps {
  property: PropertyWithRelations
}

const coverageOptions = [
  { value: 'good', label: 'Good coverage', color: 'bg-green-100 text-green-700' },
  { value: 'average', label: 'Average coverage', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'poor', label: 'Poor coverage', color: 'bg-orange-100 text-orange-700' },
  { value: 'none', label: 'No coverage', color: 'bg-red-100 text-red-700' }
]

export function NetworkConnection({ property }: NetworkConnectionProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isPending, startTransition] = useTransition()
  
  const metadata = property.stayMetadata as StayMetadata | null
  const networkData = metadata?.network || {}

  // State for editing
  const [wifiName, setWifiName] = useState(property.wifiName || '')
  const [wifiPassword, setWifiPassword] = useState(property.wifiPassword || '')
  const [wifiInAllRooms, setWifiInAllRooms] = useState(property.wifiInAllRooms || false)
  const [wifiSpeed, setWifiSpeed] = useState(property.wifiSpeed || '')
  const [mobileNetworkCoverage, setMobileNetworkCoverage] = useState(property.mobileNetworkCoverage || '')
  const [fiberOptic, setFiberOptic] = useState(networkData.fiberOptic || false)
  const [routerAccessible, setRouterAccessible] = useState(networkData.routerAccessible || false)
  const [routerLocation, setRouterLocation] = useState(networkData.routerLocation || '')
  const [supplier, setSupplier] = useState(networkData.supplier || '')
  const [wiredInternet, setWiredInternet] = useState(networkData.wiredInternet || false)
  const [comment, setComment] = useState(networkData.comment || '')

  const handleSave = () => {
    startTransition(async () => {
      try {
        const result = await updateNetworkInfo({
          propertyId: property.id,
          wifiName: wifiName || null,
          wifiPassword: wifiPassword || null,
          wifiInAllRooms,
          wifiSpeed: wifiSpeed || null,
          mobileNetworkCoverage: mobileNetworkCoverage || null,
          stayMetadata: {
            ...metadata,
            network: {
              fiberOptic,
              routerAccessible,
              routerLocation: routerLocation || undefined,
              supplier: supplier || undefined,
              wiredInternet,
              comment: comment || undefined
            }
          }
        })

        if (!result.success) {
          throw new Error(result.error || 'Failed to update network information')
        }

        setIsEditing(false)
        toast.success("Network information updated successfully")
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to update network information")
      }
    })
  }

  const handleCancel = () => {
    setWifiName(property.wifiName || '')
    setWifiPassword(property.wifiPassword || '')
    setWifiInAllRooms(property.wifiInAllRooms || false)
    setWifiSpeed(property.wifiSpeed || '')
    setMobileNetworkCoverage(property.mobileNetworkCoverage || '')
    setFiberOptic(networkData.fiberOptic || false)
    setRouterAccessible(networkData.routerAccessible || false)
    setRouterLocation(networkData.routerLocation || '')
    setSupplier(networkData.supplier || '')
    setWiredInternet(networkData.wiredInternet || false)
    setComment(networkData.comment || '')
    setIsEditing(false)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h4 className="text-lg font-medium">Network & Connection</h4>
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

      {/* Remote Work */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Globe className="h-5 w-5 text-gray-500" />
          <h5 className="font-medium">Remote</h5>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="remote-work"
            checked={wifiName !== ''}
            disabled
          />
          <Label htmlFor="remote-work" className="text-sm">
            Suitable for remote work
          </Label>
        </div>
      </div>

      {/* Mobile Network */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Smartphone className="h-5 w-5 text-gray-500" />
          <h5 className="font-medium">Mobile network</h5>
        </div>
        <div>
          <Label>Mobile network coverage</Label>
          {isEditing ? (
            <Select value={mobileNetworkCoverage} onValueChange={setMobileNetworkCoverage}>
              <SelectTrigger>
                <SelectValue placeholder="Select coverage level" />
              </SelectTrigger>
              <SelectContent>
                {coverageOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            mobileNetworkCoverage ? (
              <Badge className={coverageOptions.find(o => o.value === mobileNetworkCoverage)?.color || ''}>
                {coverageOptions.find(o => o.value === mobileNetworkCoverage)?.label}
              </Badge>
            ) : (
              <p className="text-sm text-gray-500">Not specified</p>
            )
          )}
        </div>
        {networkData.comment && !isEditing && (
          <p className="mt-2 text-sm text-gray-600">{networkData.comment}</p>
        )}
      </div>

      {/* Internet */}
      <div className="pt-6 border-t">
        <div className="flex items-center gap-2 mb-4">
          <Wifi className="h-5 w-5 text-gray-500" />
          <h5 className="font-medium">Internet</h5>
        </div>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>WiFi Name</Label>
              <Input
                value={wifiName}
                onChange={(e) => setWifiName(e.target.value)}
                placeholder="e.g., Livebox-5C60"
                disabled={!isEditing}
              />
            </div>
            <div>
              <Label>WiFi Password</Label>
              <Input
                type={isEditing ? "text" : "password"}
                value={wifiPassword}
                onChange={(e) => setWifiPassword(e.target.value)}
                placeholder="Enter password"
                disabled={!isEditing}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="wifi-all-rooms"
              checked={wifiInAllRooms}
              onCheckedChange={(checked) => setWifiInAllRooms(checked === true)}
              disabled={!isEditing}
            />
            <Label htmlFor="wifi-all-rooms" className="cursor-pointer">
              WiFi in all rooms
            </Label>
          </div>

          <div>
            <Label>Internet Speed</Label>
            <Select value={wifiSpeed} onValueChange={setWifiSpeed} disabled={!isEditing}>
              <SelectTrigger>
                <SelectValue placeholder="Select speed" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="slow">Slow</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="fast">Fast</SelectItem>
                <SelectItem value="very-fast">Very Fast</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="fiber-optic"
                checked={fiberOptic}
                onCheckedChange={(checked) => setFiberOptic(checked === true)}
                disabled={!isEditing}
              />
              <Label htmlFor="fiber-optic" className="cursor-pointer">
                Fiber optic
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="wired-internet"
                checked={wiredInternet}
                onCheckedChange={(checked) => setWiredInternet(checked === true)}
                disabled={!isEditing}
              />
              <Label htmlFor="wired-internet" className="cursor-pointer">
                Wired cable for internet (ethernet)
              </Label>
            </div>
          </div>

          <div>
            <Label>Supplier</Label>
            <Input
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
              placeholder="e.g., Orange"
              disabled={!isEditing}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="router-accessible"
                checked={routerAccessible}
                onCheckedChange={(checked) => setRouterAccessible(checked === true)}
                disabled={!isEditing}
              />
              <Label htmlFor="router-accessible" className="cursor-pointer">
                Router is accessible to customers
              </Label>
            </div>
            {routerAccessible && (
              <div className="ml-6">
                <Label>Router location</Label>
                <Input
                  value={routerLocation}
                  onChange={(e) => setRouterLocation(e.target.value)}
                  placeholder="e.g., Placed on the right at the entrance"
                  disabled={!isEditing}
                />
              </div>
            )}
          </div>

          <div>
            <Label>Additional Comments</Label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Any additional network information..."
              rows={3}
              disabled={!isEditing}
            />
          </div>
        </div>
      </div>
    </div>
  )
}