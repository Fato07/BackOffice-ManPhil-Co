"use client"

import { useState } from "react"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useCreateProvider } from "@/hooks/use-activity-providers"
import { CreateActivityProviderInput } from "@/types/activity-provider"
import { Plus } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

const createProviderSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.string().min(1, "Type is required"),
  description: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email({ message: "Please enter a valid email address" }).nullish(),
  website: z.string().url({ message: "Please enter a valid URL" }).nullish(),
})

type CreateProviderForm = z.infer<typeof createProviderSchema>

const PROVIDER_TYPES = [
  { value: "BAKERY", label: "Bakery" },
  { value: "PHARMACY", label: "Pharmacy" },
  { value: "RESTAURANTS", label: "Restaurant" },
  { value: "SUPERMARKET", label: "Supermarket" },
  { value: "MEDICAL", label: "Medical" },
  { value: "TRANSPORT", label: "Transport" },
  { value: "ENTERTAINMENT", label: "Entertainment" },
  { value: "SPORTS", label: "Sports" },
  { value: "OTHER", label: "Other" },
]

export function CreateProviderDialog() {
  const [open, setOpen] = useState(false)
  const createProvider = useCreateProvider()

  const form = useForm<CreateProviderForm>({
    resolver: zodResolver(createProviderSchema),
    defaultValues: {
      name: "",
      type: "",
      description: "",
      address: "",
      city: "",
      country: "",
      phone: "",
      email: "",
      website: "",
    },
  })

  const onSubmit = async (data: CreateProviderForm) => {
    try {
      const providerData: CreateActivityProviderInput = {
        ...data,
        email: data.email || undefined,
        website: data.website || undefined,
      }
      
      await createProvider.mutateAsync(providerData)
      setOpen(false)
      form.reset()
    } catch (error) {
      // Error handled by mutation
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add Provider
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Activity Provider</DialogTitle>
          <DialogDescription>
            Add a new activity provider or place of interest.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                {...form.register("name")}
                placeholder="Provider name"
              />
              {form.formState.errors.name && (
                <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="type">Type *</Label>
              <Select onValueChange={(value) => form.setValue("type", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {PROVIDER_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.type && (
                <p className="text-sm text-destructive">{form.formState.errors.type.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...form.register("description")}
              placeholder="Brief description of the provider"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              {...form.register("address")}
              placeholder="Street address"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                {...form.register("city")}
                placeholder="City"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                {...form.register("country")}
                placeholder="Country"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                {...form.register("phone")}
                placeholder="Phone number"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...form.register("email")}
                placeholder="Email address"
              />
              {form.formState.errors.email && (
                <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              {...form.register("website")}
              placeholder="https://example.com"
            />
            {form.formState.errors.website && (
              <p className="text-sm text-destructive">{form.formState.errors.website.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createProvider.isPending}
            >
              {createProvider.isPending ? "Creating..." : "Create Provider"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}