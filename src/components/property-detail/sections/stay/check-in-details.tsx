"use client"

import { useState, useTransition } from "react"
import { PropertyWithRelations } from "@/types/property"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { toast } from "sonner"
import { updateCheckInDetails } from "@/actions/property-stay"
import { Clock, User, Phone, Mail, Users } from "lucide-react"
import Link from "next/link"

interface CheckInDetailsProps {
  property: PropertyWithRelations
}

export function CheckInDetails({ property }: CheckInDetailsProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isPending, startTransition] = useTransition()
  
  const [checkInTime, setCheckInTime] = useState(property.checkInTime || '')
  const [checkOutTime, setCheckOutTime] = useState(property.checkOutTime || '')
  const [checkInPerson, setCheckInPerson] = useState(property.checkInPerson || '')

  // Find check-in related contacts
  const checkInContacts = property.contacts?.filter(contact => 
    contact.type === 'CHECK_IN_STAFF' || contact.type === 'CHECK_IN_MANAGER'
  ) || []

  const handleSave = () => {
    startTransition(async () => {
      try {
        const result = await updateCheckInDetails({
          propertyId: property.id,
          checkInTime: checkInTime || null,
          checkOutTime: checkOutTime || null,
          checkInPerson: checkInPerson || null,
        })

        if (!result.success) {
          throw new Error(result.error || 'Failed to update check-in details')
        }

        setIsEditing(false)
        toast.success("Check-in details updated successfully")
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to update check-in details")
      }
    })
  }

  const handleCancel = () => {
    setCheckInTime(property.checkInTime || '')
    setCheckOutTime(property.checkOutTime || '')
    setCheckInPerson(property.checkInPerson || '')
    setIsEditing(false)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h4 className="text-lg font-medium">Check-in Details</h4>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="check-in-time" className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-gray-500" />
            Check-in Time
          </Label>
          <Input
            id="check-in-time"
            type="time"
            value={checkInTime}
            onChange={(e) => setCheckInTime(e.target.value)}
            disabled={!isEditing}
          />
        </div>

        <div>
          <Label htmlFor="check-out-time" className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-gray-500" />
            Check-out Time
          </Label>
          <Input
            id="check-out-time"
            type="time"
            value={checkOutTime}
            onChange={(e) => setCheckOutTime(e.target.value)}
            disabled={!isEditing}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="check-in-person" className="flex items-center gap-2">
          <User className="h-4 w-4 text-gray-500" />
          Person in Charge of Check-in
        </Label>
        <Input
          id="check-in-person"
          value={checkInPerson}
          onChange={(e) => setCheckInPerson(e.target.value)}
          placeholder="e.g., ManPhil & Co Staff"
          disabled={!isEditing}
        />
      </div>

      {/* Check-in Contacts */}
      <div className="pt-4 border-t">
        <div className="flex items-center justify-between mb-4">
          <h5 className="font-medium flex items-center gap-2">
            <Users className="h-4 w-4 text-gray-500" />
            Check-in Contacts
          </h5>
          <Link href="#contacts">
            <Button variant="ghost" size="sm">
              Manage in Contacts
            </Button>
          </Link>
        </div>

        {checkInContacts.length > 0 ? (
          <div className="space-y-2">
            {checkInContacts.map(contact => (
              <Card key={contact.id} className="p-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="font-medium">{contact.name}</p>
                    <p className="text-sm text-gray-600">{contact.type.replace('_', ' ')}</p>
                    {contact.email && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail className="h-3 w-3" />
                        {contact.email}
                      </div>
                    )}
                    {contact.phone && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone className="h-3 w-3" />
                        {contact.phone}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">
            No check-in contacts added. 
            <Link href="#contacts" className="text-blue-600 hover:underline ml-1">
              Add in Contacts section
            </Link>
          </p>
        )}
      </div>
    </div>
  )
}