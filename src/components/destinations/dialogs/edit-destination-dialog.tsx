"use client"

import { useState, useEffect } from "react"
import { Edit } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { api } from "@/lib/api"
import { useQueryClient } from "@tanstack/react-query"
import { destinationKeys } from "@/hooks/use-destinations"
import { DestinationWithCount } from "@/hooks/use-destinations"
import { ImageUploadSection } from "../ui/image-upload-section"
import { Separator } from "@/components/ui/separator"

const editDestinationSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  country: z.string().min(2, "Country is required"),
  region: z.string().optional().nullable(),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
})

type EditDestinationForm = z.infer<typeof editDestinationSchema>

interface EditDestinationDialogProps {
  destination: DestinationWithCount
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditDestinationDialog({
  destination,
  open,
  onOpenChange,
}: EditDestinationDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const queryClient = useQueryClient()
  
  const form = useForm<EditDestinationForm>({
    resolver: zodResolver(editDestinationSchema),
    defaultValues: {
      name: destination.name,
      country: destination.country,
      region: destination.region || "",
      latitude: destination.latitude?.toString() || "",
      longitude: destination.longitude?.toString() || "",
    },
  })

  // Update form when destination changes
  useEffect(() => {
    form.reset({
      name: destination.name,
      country: destination.country,
      region: destination.region || "",
      latitude: destination.latitude?.toString() || "",
      longitude: destination.longitude?.toString() || "",
    })
  }, [destination, form])

  const onSubmit = async (data: EditDestinationForm) => {
    setIsSubmitting(true)
    try {
      const payload = {
        name: data.name,
        country: data.country,
        region: data.region || null,
        latitude: data.latitude ? parseFloat(data.latitude) : null,
        longitude: data.longitude ? parseFloat(data.longitude) : null,
      }
      
      await api.put(`/api/destinations/${destination.id}`, payload)
      
      toast.success("Destination updated successfully")
      queryClient.invalidateQueries({ queryKey: destinationKeys.all })
      onOpenChange(false)
    } catch (error) {
      
      toast.error("Failed to update destination")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto bg-black/90 backdrop-blur-xl border-white/10">
        <DialogHeader>
          <DialogTitle className="text-white">Edit Destination</DialogTitle>
          <DialogDescription className="text-gray-400">
            Update the destination information and image.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-300">Destination Name</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="e.g., Saint-Tropez"
                      className="bg-white/10 border-white/10 text-white placeholder:text-gray-500"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="country"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-300">Country</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="e.g., France"
                      className="bg-white/10 border-white/10 text-white placeholder:text-gray-500"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="region"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-300">Region (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value || ""}
                      placeholder="e.g., Provence-Alpes-Côte d'Azur"
                      className="bg-white/10 border-white/10 text-white placeholder:text-gray-500"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="latitude"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-300">Latitude</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        step="any"
                        placeholder="e.g., 43.2677"
                        className="bg-white/10 border-white/10 text-white placeholder:text-gray-500"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="longitude"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-300">Longitude</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        step="any"
                        placeholder="e.g., 6.6407"
                        className="bg-white/10 border-white/10 text-white placeholder:text-gray-500"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="pt-2">
              <Separator className="bg-white/10" />
            </div>
            <ImageUploadSection
              destinationId={destination.id}
              currentImageUrl={destination.imageUrl}
              currentImageAltText={destination.imageAltText}
              onImageUpdate={() => {
                // Refresh the data after image update
                queryClient.invalidateQueries({ queryKey: destinationKeys.all })
              }}
            />
            
            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1 border-white/10 text-white hover:bg-white/10"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-[#B5985A] hover:bg-[#B5985A]/80 text-white"
              >
                {isSubmitting ? "Updating..." : "Update Destination"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}