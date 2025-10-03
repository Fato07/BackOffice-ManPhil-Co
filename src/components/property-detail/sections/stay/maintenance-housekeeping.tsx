"use client"

import { useState, useTransition } from "react"
import { PropertyWithRelations, StayMetadata, ServiceSchedule } from "@/types/property"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import { updateMaintenanceSchedules } from "@/actions/property-stay"
import { ServiceScheduleSelector } from "../../shared/service-schedule-selector"
import { Shirt, Droplets, Trees, Waves, Users, Phone, Mail } from "lucide-react"
import Link from "next/link"

interface MaintenanceHousekeepingProps {
  property: PropertyWithRelations
}

export function MaintenanceHousekeeping({ property }: MaintenanceHousekeepingProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isPending, startTransition] = useTransition()
  
  const metadata = property.stayMetadata as StayMetadata | null
  const maintenanceData = metadata?.maintenance || {}

  // State for editing
  const [linenChange, setLinenChange] = useState<ServiceSchedule>(
    maintenanceData.linenChange || { frequency: 'none' }
  )
  const [towelChange, setTowelChange] = useState<ServiceSchedule>(
    maintenanceData.towelChange || { frequency: 'none' }
  )
  const [gardeningEnabled, setGardeningEnabled] = useState(
    maintenanceData.gardeningService?.enabled || false
  )
  const [gardeningService, setGardeningService] = useState<ServiceSchedule>(
    maintenanceData.gardeningService || { frequency: 'none' }
  )
  const [poolEnabled, setPoolEnabled] = useState(
    maintenanceData.poolMaintenance?.enabled || false
  )
  const [poolMaintenance, setPoolMaintenance] = useState<ServiceSchedule>(
    maintenanceData.poolMaintenance || { frequency: 'none' }
  )
  const [poolIncludesLinen, setPoolIncludesLinen] = useState(
    maintenanceData.poolMaintenance?.includesLinen || false
  )

  // Find related contacts
  const housekeepingContacts = property.contacts?.filter(c => c.type === 'HOUSEKEEPING') || []
  const gardeningContacts = property.contacts?.filter(c => c.type === 'GARDENING') || []
  const poolContacts = property.contacts?.filter(c => c.type === 'POOL_MAINTENANCE') || []

  const handleSave = () => {
    startTransition(async () => {
      try {
        const result = await updateMaintenanceSchedules({
          propertyId: property.id,
          stayMetadata: {
            ...metadata,
            maintenance: {
              linenChange,
              towelChange,
              gardeningService: {
                ...gardeningService,
                enabled: gardeningEnabled
              },
              poolMaintenance: {
                ...poolMaintenance,
                enabled: poolEnabled,
                includesLinen: poolIncludesLinen
              }
            }
          }
        })

        if (!result.success) {
          throw new Error(result.error || 'Failed to update maintenance schedules')
        }

        setIsEditing(false)
        toast.success("Maintenance schedules updated successfully")
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to update maintenance schedules")
      }
    })
  }

  const handleCancel = () => {
    setLinenChange(maintenanceData.linenChange || { frequency: 'none' })
    setTowelChange(maintenanceData.towelChange || { frequency: 'none' })
    setGardeningEnabled(maintenanceData.gardeningService?.enabled || false)
    setGardeningService(maintenanceData.gardeningService || { frequency: 'none' })
    setPoolEnabled(maintenanceData.poolMaintenance?.enabled || false)
    setPoolMaintenance(maintenanceData.poolMaintenance || { frequency: 'none' })
    setPoolIncludesLinen(maintenanceData.poolMaintenance?.includesLinen || false)
    setIsEditing(false)
  }

  const renderContacts = (
    contacts: typeof housekeepingContacts,
    title: string,
    icon: React.ComponentType<{ className?: string }>
  ) => {
    const Icon = icon
    return (
      <div className="mt-4">
        <div className="flex items-center justify-between mb-2">
          <h6 className="text-sm font-medium flex items-center gap-2">
            <Icon className="h-4 w-4 text-gray-500" />
            {title}
          </h6>
          <Link href="#contacts">
            <Button variant="ghost" size="sm">
              Manage
            </Button>
          </Link>
        </div>
        {contacts.length > 0 ? (
          <div className="space-y-2">
            {contacts.map(contact => (
              <Card key={contact.id} className="p-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{contact.name}</p>
                  <div className="flex gap-2">
                    {contact.phone && (
                      <a href={`tel:${contact.phone}`} className="text-gray-500 hover:text-gray-700">
                        <Phone className="h-3 w-3" />
                      </a>
                    )}
                    {contact.email && (
                      <a href={`mailto:${contact.email}`} className="text-gray-500 hover:text-gray-700">
                        <Mail className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">
            No contacts added. 
            <Link href="#contacts" className="text-blue-600 hover:underline ml-1">
              Add contact
            </Link>
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h4 className="text-lg font-medium">Maintenance & Housekeeping</h4>
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <ServiceScheduleSelector
              label="Change of bed linen"
              value={linenChange}
              onChange={setLinenChange}
              showArrivalTime
              disabled={!isEditing}
            />
          </div>
          <div>
            <ServiceScheduleSelector
              label="Change of bath towels"
              value={towelChange}
              onChange={setTowelChange}
              showArrivalTime
              disabled={!isEditing}
            />
          </div>
        </div>
        
        {(linenChange.frequency !== 'none' || towelChange.frequency !== 'none') && (
          renderContacts(housekeepingContacts, "Housekeeping Contact", Users)
        )}
      </div>

      <div className="pt-6 border-t">
        <div className="flex items-center space-x-2 mb-4">
          <Checkbox
            id="gardening-service"
            checked={gardeningEnabled}
            onCheckedChange={(checked) => setGardeningEnabled(checked === true)}
            disabled={!isEditing}
          />
          <Label 
            htmlFor="gardening-service" 
            className="flex items-center gap-2 cursor-pointer font-medium"
          >
            <Trees className="h-4 w-4 text-green-600" />
            Gardening
          </Label>
        </div>
        
        {gardeningEnabled && (
          <>
            <ServiceScheduleSelector
              label="Gardening service"
              value={gardeningService}
              onChange={setGardeningService}
              showArrivalTime
              disabled={!isEditing}
            />
            {renderContacts(gardeningContacts, "Garden Contact", Trees)}
          </>
        )}
      </div>

      <div className="pt-6 border-t">
        <div className="flex items-center space-x-2 mb-4">
          <Checkbox
            id="pool-maintenance"
            checked={poolEnabled}
            onCheckedChange={(checked) => setPoolEnabled(checked === true)}
            disabled={!isEditing}
          />
          <Label 
            htmlFor="pool-maintenance" 
            className="flex items-center gap-2 cursor-pointer font-medium"
          >
            <Waves className="h-4 w-4 text-blue-600" />
            Pool Maintenance
          </Label>
        </div>
        
        {poolEnabled && (
          <>
            <ServiceScheduleSelector
              label="Pool maintenance"
              value={poolMaintenance}
              onChange={setPoolMaintenance}
              showArrivalTime
              disabled={!isEditing}
            />
            <div className="mt-3 flex items-center space-x-2">
              <Checkbox
                id="pool-linen"
                checked={poolIncludesLinen}
                onCheckedChange={(checked) => setPoolIncludesLinen(checked === true)}
                disabled={!isEditing}
              />
              <Label htmlFor="pool-linen" className="cursor-pointer text-sm">
                Pool linen provided
              </Label>
            </div>
            {renderContacts(poolContacts, "Pool Contact", Waves)}
          </>
        )}
      </div>
    </div>
  )
}