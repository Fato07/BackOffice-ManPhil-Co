"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useFieldArray } from "react-hook-form"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Trash2, Package } from "lucide-react"
import { useCreateEquipmentRequest } from "@/hooks/use-equipment-requests"
import { useProperties } from "@/hooks/use-properties"
import {
  CreateEquipmentRequestInput,
  createEquipmentRequestSchema,
  EquipmentRequestPriority,
} from "@/types/equipment-request"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"

export function CreateEquipmentRequestDialog() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("")
  
  const createMutation = useCreateEquipmentRequest()
  
  // Fetch properties for selection
  const { data: propertiesData } = useProperties({ status: 'ALL' }, 1, 100)

  const form = useForm<CreateEquipmentRequestInput>({
    resolver: zodResolver(createEquipmentRequestSchema),
    defaultValues: {
      propertyId: "",
      roomId: undefined,
      priority: EquipmentRequestPriority.MEDIUM,
      items: [{ name: "", quantity: 1, description: "", estimatedCost: undefined, link: "" }],
      reason: "",
      notes: "",
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  })

  const onSubmit = async (data: CreateEquipmentRequestInput) => {
    try {
      const result = await createMutation.mutateAsync(data)
      setOpen(false)
      form.reset()
      router.push(`/equipment-requests/${result.data.id}`)
    } catch (error) {
      // Error is handled by the mutation hook
    }
  }

  const addItem = () => {
    append({ name: "", quantity: 1, description: "", estimatedCost: undefined, link: "" })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <Plus className="h-3 w-3" />
          New Request
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-lg">Create Equipment Request</DialogTitle>
          <DialogDescription className="text-xs">
            Request equipment or supplies for a property. All requests will be reviewed by management.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid gap-4">
                <FormField
                  control={form.control}
                  name="propertyId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Property *</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value)
                          setSelectedPropertyId(value)
                        }}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a property" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {propertiesData?.data.map((property) => (
                            <SelectItem key={property.id} value={property.id}>
                              {property.name} - {property.destination.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Priority</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
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
                      <FormDescription className="text-[10px]">
                        Set the priority level for this request
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Reason for Request</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Explain why these items are needed..."
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription className="text-[10px]">
                        Brief explanation of why these items are needed
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <FormLabel className="text-sm">Equipment Items *</FormLabel>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addItem}
                      className="gap-2"
                    >
                      <Plus className="h-3 w-3" />
                      Add Item
                    </Button>
                  </div>
                  
                  <div className="space-y-4">
                    {fields.map((field, index) => (
                      <div key={field.id} className="space-y-4 p-4 border rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium text-xs">Item {index + 1}</span>
                          </div>
                          {fields.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => remove(index)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>

                        <div className="grid gap-4">
                          <div className="grid grid-cols-3 gap-4">
                            <FormField
                              control={form.control}
                              name={`items.${index}.name`}
                              render={({ field }) => (
                                <FormItem className="col-span-2">
                                  <FormLabel className="text-xs">Item Name *</FormLabel>
                                  <FormControl>
                                    <Input placeholder="e.g. Bath towels" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name={`items.${index}.quantity`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-xs">Quantity *</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      min="1"
                                      placeholder="1"
                                      {...field}
                                      onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <FormField
                            control={form.control}
                            name={`items.${index}.description`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs">Description</FormLabel>
                                <FormControl>
                                  <Input placeholder="Additional details (size, color, etc.)" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name={`items.${index}.estimatedCost`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-xs">Estimated Cost (€)</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      min="0"
                                      step="0.01"
                                      placeholder="0.00"
                                      {...field}
                                      onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name={`items.${index}.link`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-xs">Link</FormLabel>
                                  <FormControl>
                                    <Input type="url" placeholder="https://..." {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Additional Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Any additional information..."
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </form>
          </Form>
        </ScrollArea>
        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setOpen(false)}
            disabled={createMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={form.handleSubmit(onSubmit)}
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? "Creating..." : "Create Request"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}