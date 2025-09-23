"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useUpdateProvider } from "@/hooks/use-activity-providers"
import { ActivityProvider } from "@/types/activity-provider"
import { ArrowLeft, Save, MapPin, Globe, Phone, Mail } from "lucide-react"
import { motion } from "framer-motion"
import { toast } from "sonner"

const editProviderSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.string().min(1, "Type is required"),
  description: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  postalCode: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email({ message: "Please enter a valid email address" }).nullish(),
  website: z.string().url({ message: "Please enter a valid URL" }).nullish(),
  openingHours: z.string().optional(),
  priceRange: z.string().optional(),
  comments: z.string().optional(),
  internalNotes: z.string().optional(),
  rating: z.number().min(0).max(5).optional(),
})

type EditProviderForm = z.infer<typeof editProviderSchema>

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

interface EditProviderFormProps {
  provider: ActivityProvider
}

export function EditProviderForm({ provider }: EditProviderFormProps) {
  const router = useRouter()
  const updateProvider = useUpdateProvider()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<EditProviderForm>({
    resolver: zodResolver(editProviderSchema),
    defaultValues: {
      name: provider.name,
      type: provider.type,
      description: provider.description || "",
      address: provider.address || "",
      city: provider.city || "",
      country: provider.country || "",
      postalCode: provider.postalCode || "",
      phone: provider.phone || "",
      email: provider.email || "",
      website: provider.website || "",
      openingHours: provider.openingHours || "",
      priceRange: provider.priceRange || "",
      comments: provider.comments || "",
      internalNotes: provider.internalNotes || "",
      rating: provider.rating || undefined,
    },
  })

  const onSubmit = async (data: EditProviderForm) => {
    setIsSubmitting(true)
    try {
      await updateProvider.mutateAsync({
        id: provider.id,
        data: {
          ...data,
          email: data.email || undefined,
          website: data.website || undefined,
          rating: data.rating || undefined,
        }
      })
      
      toast.success("Provider updated successfully")
      router.push("/places")
    } catch (error) {
      toast.error("Failed to update provider")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Edit Provider</h1>
          <p className="text-sm text-muted-foreground">
            Update the details for {provider.name}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => router.push("/places")}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to list
        </Button>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Essential details about the provider
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    {...form.register("name")}
                    placeholder="Provider name"
                  />
                  {form.formState.errors.name && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.name.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Type *</Label>
                  <Select
                    value={form.watch("type")}
                    onValueChange={(value) => form.setValue("type", value)}
                  >
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
                    <p className="text-sm text-destructive">
                      {form.formState.errors.type.message}
                    </p>
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

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="priceRange">Price Range</Label>
                  <Input
                    id="priceRange"
                    {...form.register("priceRange")}
                    placeholder="e.g., €€, $$$"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rating">Rating</Label>
                  <Input
                    id="rating"
                    type="number"
                    step="0.1"
                    min="0"
                    max="5"
                    {...form.register("rating", { valueAsNumber: true })}
                    placeholder="0-5"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Location</CardTitle>
              <CardDescription>
                Address and location details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="address"
                    {...form.register("address")}
                    placeholder="Street address"
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    {...form.register("city")}
                    placeholder="City"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="postalCode">Postal Code</Label>
                  <Input
                    id="postalCode"
                    {...form.register("postalCode")}
                    placeholder="Postal code"
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
              <CardDescription>
                How to reach this provider
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      {...form.register("phone")}
                      placeholder="+33 4 93 88 12 34"
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      {...form.register("email")}
                      placeholder="contact@provider.com"
                      className="pl-10"
                    />
                  </div>
                  {form.formState.errors.email && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.email.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <div className="relative">
                  <Globe className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="website"
                    {...form.register("website")}
                    placeholder="https://example.com"
                    className="pl-10"
                  />
                </div>
                {form.formState.errors.website && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.website.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="openingHours">Opening Hours</Label>
                <Textarea
                  id="openingHours"
                  {...form.register("openingHours")}
                  placeholder="Mon-Fri: 9am-6pm&#10;Sat: 10am-4pm&#10;Sun: Closed"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Additional Information</CardTitle>
              <CardDescription>
                Comments and internal notes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="comments">Comments</Label>
                <Textarea
                  id="comments"
                  {...form.register("comments")}
                  placeholder="Public comments about this provider"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="internalNotes">
                  Internal Notes
                  <span className="ml-2 text-xs text-muted-foreground">
                    (Not visible to guests)
                  </span>
                </Label>
                <Textarea
                  id="internalNotes"
                  {...form.register("internalNotes")}
                  placeholder="Private notes for staff"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {provider.properties && provider.properties.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Linked Properties</CardTitle>
                <CardDescription>
                  Properties associated with this provider
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {provider.properties.map((property: any) => (
                    <Badge key={property.id} variant="secondary">
                      {property.name}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex gap-4">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              {isSubmitting ? "Saving..." : "Save changes"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/places")}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}