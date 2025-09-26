"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Plus, Minus } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
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
import { Input } from "@/components/ui/input"
import { createPropertySchema, CreatePropertyFormData } from "@/lib/validations"
import { useCreateProperty } from "@/hooks/use-properties"
import { useDestinations } from "@/hooks/use-destinations"

interface CreateHouseDialogProps {
  children?: React.ReactNode
}

export function CreateHouseDialog({ children }: CreateHouseDialogProps) {
  const [open, setOpen] = useState(false)
  const { data: destinationsData, isLoading: destinationsLoading } = useDestinations()
  const createProperty = useCreateProperty()

  const form = useForm<z.input<typeof createPropertySchema>>({
    resolver: zodResolver(createPropertySchema),
    defaultValues: {
      name: "",
      destinationId: "",
      numberOfRooms: 0,
      numberOfBathrooms: 0,
    },
  })

  const onSubmit = async (data: z.input<typeof createPropertySchema>) => {
    // Ensure the data matches the expected type
    const submitData = {
      name: data.name,
      destinationId: data.destinationId,
      numberOfRooms: data.numberOfRooms || 0,
      numberOfBathrooms: data.numberOfBathrooms || 0,
    }
    
    createProperty.mutate(submitData, {
      onSuccess: () => {
        setOpen(false)
        form.reset()
      },
    })
  }

  const handleNumberChange = (field: "numberOfRooms" | "numberOfBathrooms", increment: boolean) => {
    const currentValue = form.getValues(field) || 0
    const newValue = increment ? currentValue + 1 : Math.max(0, currentValue - 1)
    form.setValue(field, newValue)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button className="bg-[#B5985A] hover:bg-[#B5985A]/90">
            <Plus className="mr-2 h-4 w-4" />
            Create a house
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create a house</DialogTitle>
          <DialogDescription>
            Add a new property to your portfolio. Fill in the basic information below.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Villa Sunshine" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="destinationId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Destination *</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                    disabled={destinationsLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a destination" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {destinationsData?.destinations.map((destination) => (
                        <SelectItem key={destination.id} value={destination.id}>
                          {destination.name}, {destination.country}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="numberOfRooms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Number of rooms</FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => handleNumberChange("numberOfRooms", false)}
                          className="h-9 w-9"
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <Input
                          type="number"
                          min="0"
                          {...field}
                          value={field.value}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          className="text-center"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => handleNumberChange("numberOfRooms", true)}
                          className="h-9 w-9"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="numberOfBathrooms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Number of bathrooms</FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => handleNumberChange("numberOfBathrooms", false)}
                          className="h-9 w-9"
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <Input
                          type="number"
                          min="0"
                          {...field}
                          value={field.value}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          className="text-center"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => handleNumberChange("numberOfBathrooms", true)}
                          className="h-9 w-9"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-[#1E3A3A] hover:bg-[#1E3A3A]/90"
                disabled={createProperty.isPending}
              >
                {createProperty.isPending ? "Creating..." : "Create"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}