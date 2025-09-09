"use client"

import { useState, useMemo } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { PropertySection } from "../property-section"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useUpdateProperty } from "@/hooks/use-properties"
import { PropertyWithRelations } from "@/types/property"
import { toast } from "sonner"
import { Plus, Trash2, Shield, User, Key, Wrench, Users, DollarSign, ClipboardList } from "lucide-react"
import { format } from "date-fns"
import { usePermissions } from "@/hooks/use-permissions"
import { ProtectedSection } from "@/components/auth/protected-section"
import { Permission } from "@/types/auth"

const internalSchema = z.object({
  internalNotes: z.string().optional(),
  internalDetails: z.object({
    owner: z.object({
      preferences: z.string().optional(),
      specialInstructions: z.string().optional(),
      contactPreference: z.enum(["email", "phone", "whatsapp"]).optional(),
    }).default({}),
    access: z.object({
      keyLocation: z.string().optional(),
      alarmCode: z.string().optional(),
      wifiPassword: z.string().optional(),
      gateCode: z.string().optional(),
      emergencyProcedures: z.string().optional(),
    }).default({}),
    maintenance: z.object({
      lastDate: z.string().optional(),
      nextDate: z.string().optional(),
      notes: z.string().optional(),
      knownIssues: z.string().optional(),
    }).default({}),
    vendors: z.array(z.object({
      id: z.string(),
      name: z.string(),
      serviceType: z.string(),
      phone: z.string().optional(),
      email: z.string().optional(),
      notes: z.string().optional(),
      lastServiceDate: z.string().optional(),
    })).default([]),
    financial: z.object({
      commissionStructure: z.string().optional(),
      pricingNotes: z.string().optional(),
      payoutDetails: z.string().optional(),
    }).default({}),
    operational: z.object({
      checkInProcedure: z.string().optional(),
      checkOutProcedure: z.string().optional(),
      cleaningInstructions: z.string().optional(),
      specialRequirements: z.string().optional(),
    }).default({}),
  }),
})

type InternalData = z.infer<typeof internalSchema>

interface InternalSectionProps {
  property: PropertyWithRelations
}

export function InternalSection({ property }: InternalSectionProps) {
  const [isEditing, setIsEditing] = useState(false)
  const updateProperty = useUpdateProperty()
  const { hasPermission, canEditSection } = usePermissions()

  // Parse internal details from JSON stored in internalComment - memoized to prevent re-parsing
  const parsedInternal = useMemo(() => {
    if (!property.internalComment) return {}
    try {
      return JSON.parse(property.internalComment)
    } catch (error) {
      console.error('Failed to parse internal comment data:', error)
      return {}
    }
  }, [property.internalComment])
  
  // Memoize default values to prevent form re-initialization
  const defaultValues = useMemo(() => ({
    internalNotes: parsedInternal.internalNotes || "",
    internalDetails: {
      owner: parsedInternal.internalDetails?.owner || {},
      access: parsedInternal.internalDetails?.access || {},
      maintenance: parsedInternal.internalDetails?.maintenance || {},
      vendors: parsedInternal.internalDetails?.vendors || [],
      financial: parsedInternal.internalDetails?.financial || {},
      operational: parsedInternal.internalDetails?.operational || {},
    },
  }), [parsedInternal])
  
  const form = useForm<z.input<typeof internalSchema>>({
    resolver: zodResolver(internalSchema),
    defaultValues,
  })

  const vendors = form.watch("internalDetails.vendors")

  const addVendor = () => {
    const currentVendors = form.getValues("internalDetails.vendors") || []
    form.setValue("internalDetails.vendors", [
      ...currentVendors,
      { 
        id: Date.now().toString(),
        name: "", 
        serviceType: "", 
        phone: "", 
        email: "", 
        notes: "",
        lastServiceDate: "" 
      }
    ])
  }

  const removeVendor = (index: number) => {
    const currentVendors = form.getValues("internalDetails.vendors") || []
    form.setValue("internalDetails.vendors", currentVendors.filter((_, i) => i !== index))
  }

  const handleSave = async (data: z.input<typeof internalSchema>) => {
    try {
      await updateProperty.mutateAsync({
        id: property.id,
        data: {
          internalComment: JSON.stringify(data),
        },
      })
      toast.success("Internal information updated successfully")
      setIsEditing(false)
    } catch (error) {
      toast.error("Failed to update internal information")
    }
  }

  const handleCancel = () => {
    form.reset(defaultValues)
    setIsEditing(false)
  }

  return (
    <PropertySection
      title="Internal Information"
      isEditing={isEditing}
      onEdit={() => canEditSection('internal') && setIsEditing(true)}
      onSave={form.handleSubmit(handleSave)}
      onCancel={handleCancel}
      isSaving={updateProperty.isPending}
      className="border-amber-200 bg-amber-50/30"
      showEditButton={canEditSection('internal')}
    >
      <div className="mb-4">
        <div className="flex items-center gap-2 p-3 bg-amber-100 rounded-lg border border-amber-300">
          <Shield className="w-5 h-5 text-amber-600" />
          <p className="text-sm text-amber-800">
            This section contains confidential information for internal staff use only.
          </p>
        </div>
      </div>

      <div className="space-y-8">
        {/* General Internal Notes */}
        <div>
          <Label className="text-base font-semibold">General Internal Notes</Label>
          <Textarea
            className="mt-2"
            disabled={!isEditing}
            {...form.register("internalNotes")}
            placeholder="Any internal notes about this property..."
            rows={4}
          />
        </div>

        {/* Owner Information */}
        <ProtectedSection permission={Permission.OWNER_VIEW}>
          <div>
            <h3 className="text-base font-semibold mb-4">Owner Information</h3>
            <div className="space-y-4">
              <div>
                <Label>Owner preferences</Label>
                <Textarea
                  className="mt-2"
                  disabled={!isEditing || !hasPermission(Permission.OWNER_EDIT)}
                  {...form.register("internalDetails.owner.preferences")}
                  placeholder="Owner preferences and requirements..."
                />
              </div>
              <div>
                <Label>Special instructions</Label>
                <Textarea
                  className="mt-2"
                  disabled={!isEditing || !hasPermission(Permission.OWNER_EDIT)}
                  {...form.register("internalDetails.owner.specialInstructions")}
                  placeholder="Special instructions from the owner..."
                />
              </div>
              <div>
                <Label>Contact preference</Label>
                <Select
                  disabled={!isEditing || !hasPermission(Permission.OWNER_EDIT)}
                  value={form.watch("internalDetails.owner.contactPreference")}
                  onValueChange={(value) => form.setValue("internalDetails.owner.contactPreference", value as any)}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="phone">Phone</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </ProtectedSection>

        {/* Access Information */}
        <div>
          <h3 className="text-base font-semibold mb-4">Access Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Key location</Label>
              <Input
                disabled={!isEditing}
                {...form.register("internalDetails.access.keyLocation")}
                placeholder="Where keys are located..."
              />
            </div>
            <div>
              <Label>Alarm code</Label>
              <Input
                disabled={!isEditing}
                {...form.register("internalDetails.access.alarmCode")}
                placeholder="Alarm system code..."
              />
            </div>
            <div>
              <Label>WiFi password</Label>
              <Input
                disabled={!isEditing}
                {...form.register("internalDetails.access.wifiPassword")}
                placeholder="WiFi password..."
              />
            </div>
            <div>
              <Label>Gate code</Label>
              <Input
                disabled={!isEditing}
                {...form.register("internalDetails.access.gateCode")}
                placeholder="Gate access code..."
              />
            </div>
            <div className="col-span-2">
              <Label>Emergency procedures</Label>
              <Textarea
                className="mt-2"
                disabled={!isEditing}
                {...form.register("internalDetails.access.emergencyProcedures")}
                placeholder="Emergency contact and procedures..."
              />
            </div>
          </div>
        </div>

        {/* Maintenance Information */}
        <div>
          <h3 className="text-base font-semibold mb-4">Maintenance Information</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Last maintenance date</Label>
                <Input
                  type="date"
                  disabled={!isEditing}
                  {...form.register("internalDetails.maintenance.lastDate")}
                />
              </div>
              <div>
                <Label>Next scheduled maintenance</Label>
                <Input
                  type="date"
                  disabled={!isEditing}
                  {...form.register("internalDetails.maintenance.nextDate")}
                />
              </div>
            </div>
            <div>
              <Label>Maintenance notes</Label>
              <Textarea
                className="mt-2"
                disabled={!isEditing}
                {...form.register("internalDetails.maintenance.notes")}
                placeholder="Regular maintenance requirements..."
              />
            </div>
            <div>
              <Label>Known issues</Label>
              <Textarea
                className="mt-2"
                disabled={!isEditing}
                {...form.register("internalDetails.maintenance.knownIssues")}
                placeholder="Known issues or repairs needed..."
              />
            </div>
          </div>
        </div>

        {/* Vendor Contacts */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold">Vendor Contacts</h3>
            {isEditing && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={addVendor}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Vendor
              </Button>
            )}
          </div>
          <div className="space-y-3">
            {(vendors || []).map((vendor, index) => (
              <Card key={vendor.id} className="p-4">
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Vendor name</Label>
                      <Input
                        disabled={!isEditing}
                        {...form.register(`internalDetails.vendors.${index}.name`)}
                      />
                    </div>
                    <div>
                      <Label>Service type</Label>
                      <Input
                        disabled={!isEditing}
                        {...form.register(`internalDetails.vendors.${index}.serviceType`)}
                        placeholder="e.g., Plumber, Electrician"
                      />
                    </div>
                    <div>
                      <Label>Phone</Label>
                      <Input
                        disabled={!isEditing}
                        {...form.register(`internalDetails.vendors.${index}.phone`)}
                      />
                    </div>
                    <div>
                      <Label>Email</Label>
                      <Input
                        disabled={!isEditing}
                        {...form.register(`internalDetails.vendors.${index}.email`)}
                      />
                    </div>
                    <div>
                      <Label>Last service date</Label>
                      <Input
                        type="date"
                        disabled={!isEditing}
                        {...form.register(`internalDetails.vendors.${index}.lastServiceDate`)}
                      />
                    </div>
                    <div>
                      <Label>Notes</Label>
                      <Input
                        disabled={!isEditing}
                        {...form.register(`internalDetails.vendors.${index}.notes`)}
                      />
                    </div>
                  </div>
                  {isEditing && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="text-red-600"
                      onClick={() => removeVendor(index)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Remove
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Financial Information */}
        <ProtectedSection permission={Permission.FINANCIAL_VIEW}>
          <div>
            <h3 className="text-base font-semibold mb-4">Financial Information</h3>
            <div className="space-y-4">
              <div>
                <Label>Commission structure</Label>
                <Textarea
                  className="mt-2"
                  disabled={!isEditing || !hasPermission(Permission.FINANCIAL_EDIT)}
                  {...form.register("internalDetails.financial.commissionStructure")}
                  placeholder="Commission rates and structure..."
                />
              </div>
              <div>
                <Label>Pricing notes</Label>
                <Textarea
                  className="mt-2"
                  disabled={!isEditing || !hasPermission(Permission.FINANCIAL_EDIT)}
                  {...form.register("internalDetails.financial.pricingNotes")}
                  placeholder="Special pricing considerations..."
                />
              </div>
              <div>
                <Label>Payout details</Label>
                <Textarea
                  className="mt-2"
                  disabled={!isEditing || !hasPermission(Permission.FINANCIAL_EDIT)}
                  {...form.register("internalDetails.financial.payoutDetails")}
                  placeholder="Owner payout information..."
                />
              </div>
            </div>
          </div>
        </ProtectedSection>

        {/* Operational Procedures */}
        <div>
          <h3 className="text-base font-semibold mb-4">Operational Procedures</h3>
          <div className="space-y-4">
            <div>
              <Label>Check-in procedure</Label>
              <Textarea
                className="mt-2"
                disabled={!isEditing}
                {...form.register("internalDetails.operational.checkInProcedure")}
                placeholder="Step-by-step check-in process..."
                rows={4}
              />
            </div>
            <div>
              <Label>Check-out procedure</Label>
              <Textarea
                className="mt-2"
                disabled={!isEditing}
                {...form.register("internalDetails.operational.checkOutProcedure")}
                placeholder="Step-by-step check-out process..."
                rows={4}
              />
            </div>
            <div>
              <Label>Cleaning instructions</Label>
              <Textarea
                className="mt-2"
                disabled={!isEditing}
                {...form.register("internalDetails.operational.cleaningInstructions")}
                placeholder="Special cleaning requirements..."
              />
            </div>
            <div>
              <Label>Special requirements</Label>
              <Textarea
                className="mt-2"
                disabled={!isEditing}
                {...form.register("internalDetails.operational.specialRequirements")}
                placeholder="Any special operational requirements..."
              />
            </div>
          </div>
        </div>
      </div>
    </PropertySection>
  )
}