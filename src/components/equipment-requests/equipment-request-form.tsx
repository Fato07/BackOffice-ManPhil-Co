"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { ArrowLeft, Save, Home, MapPin } from "lucide-react"
import {
  EquipmentRequest,
  EquipmentRequestPriority,
  UpdateEquipmentRequestInput,
  updateEquipmentRequestSchema,
} from "@/types/equipment-request"
import { EquipmentRequestItemsTable } from "./equipment-request-items-table"
import { updateEquipmentRequest } from "@/actions/equipment-requests"
import { usePermissions } from "@/hooks/use-permissions"
import { Permission } from "@/types/auth"

interface EquipmentRequestFormProps {
  request: EquipmentRequest
}

export function EquipmentRequestForm({ request }: EquipmentRequestFormProps) {
  const router = useRouter()
  const { hasPermission } = usePermissions()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const canEditInternal = hasPermission(Permission.EQUIPMENT_REQUEST_EDIT_INTERNAL)

  const form = useForm<UpdateEquipmentRequestInput>({
    resolver: zodResolver(updateEquipmentRequestSchema),
    defaultValues: {
      priority: request.priority,
      items: request.items,
      reason: request.reason || "",
      notes: request.notes || "",
      internalNotes: request.internalNotes || "",
    },
  })

  const onSubmit = async (data: UpdateEquipmentRequestInput) => {
    setIsSubmitting(true)
    
    try {
      await updateEquipmentRequest(request.id, data)
      toast.success("Equipment request updated successfully")
      router.push(`/equipment-requests/${request.id}`)
    } catch {
      toast.error("Failed to update equipment request")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    router.push(`/equipment-requests/${request.id}`)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCancel}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <h1 className="text-2xl font-bold">Edit Equipment Request</h1>
      </div>

      <Card className="p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex items-start gap-3">
            <Home className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Property</p>
              <p className="text-base font-medium">{request.property.name}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Destination</p>
              <p className="text-base">{request.property.destination.name}, {request.property.destination.country}</p>
            </div>
          </div>
        </div>
      </Card>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card className="p-6 space-y-6">
            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Priority</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={EquipmentRequestPriority.LOW}>Low</SelectItem>
                      <SelectItem value={EquipmentRequestPriority.MEDIUM}>Medium</SelectItem>
                      <SelectItem value={EquipmentRequestPriority.HIGH}>High</SelectItem>
                      <SelectItem value={EquipmentRequestPriority.URGENT}>Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason for Request</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Explain why these items are needed..."
                      className="min-h-[100px]"
                    />
                  </FormControl>
                  <FormDescription>
                    Provide context for the request to help with approval decisions
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Any additional information..."
                      className="min-h-[80px]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {canEditInternal && (
              <FormField
                control={form.control}
                name="internalNotes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Internal Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Internal notes (not visible to requester)..."
                        className="min-h-[80px]"
                      />
                    </FormControl>
                    <FormDescription>
                      These notes are only visible to staff with appropriate permissions
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <Separator />

            <FormField
              control={form.control}
              name="items"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Requested Items</FormLabel>
                  <FormControl>
                    <EquipmentRequestItemsTable
                      items={field.value || []}
                      editable={true}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </Card>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}