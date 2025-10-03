"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
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
import { Input } from "@/components/ui/input"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { api } from "@/lib/api"
import { useQueryClient } from "@tanstack/react-query"
import { destinationKeys } from "@/hooks/use-destinations"
import { ImageUploadSectionCreate } from "../ui/image-upload-section-create"
import { Separator } from "@/components/ui/separator"

const createDestinationSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  country: z.string().min(2, "Country is required"),
  region: z.string().optional(),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
})

type CreateDestinationForm = z.infer<typeof createDestinationSchema>

export function CreateDestinationDialog() {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [altText, setAltText] = useState("")
  const queryClient = useQueryClient()
  
  const form = useForm<CreateDestinationForm>({
    resolver: zodResolver(createDestinationSchema),
    defaultValues: {
      name: "",
      country: "",
      region: "",
    },
  })

  const handleImageSelect = (file: File | null, altText: string) => {
    setSelectedFile(file)
    setAltText(altText)
  }

  const uploadImage = async (destinationId: string) => {
    if (!selectedFile) return

    const formData = new FormData()
    formData.append("file", selectedFile)
    formData.append("altText", altText || `${form.getValues("name")} hero image`)

    const response = await fetch(`/api/destinations/${destinationId}/image`, {
      method: "POST",
      body: formData,
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || "Failed to upload image")
    }

    return data
  }

  const onSubmit = async (data: CreateDestinationForm) => {
    setIsSubmitting(true)
    try {
      // Step 1: Create the destination
      const payload = {
        ...data,
        latitude: data.latitude ? parseFloat(data.latitude) : undefined,
        longitude: data.longitude ? parseFloat(data.longitude) : undefined,
      }
      const newDestination = await api.post<{ id: string }>("/api/destinations", payload)
      
      // Step 2: Upload image if selected
      if (selectedFile) {
        try {
          await uploadImage(newDestination.id)
          toast.success("Destination created with image")
        } catch (imageError) {
          // Image upload failed but destination was created
          toast.success("Destination created successfully")
          toast.error("Failed to upload image. You can add it later by editing the destination.")
        }
      } else {
        toast.success("Destination created successfully")
      }

      // Invalidate queries to refresh the list
      await queryClient.invalidateQueries({ queryKey: destinationKeys.all })
      
      // Close dialog and reset states
      setOpen(false)
      form.reset()
      setSelectedFile(null)
      setAltText("")
    } catch (error) {
      // Error handled by toast notification
      toast.error("Failed to create destination")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button
            size="lg"
            className={[
              "h-14 w-14 rounded-full p-0",
              "bg-[#B5985A] hover:bg-[#B5985A]/80",
              "shadow-2xl shadow-[#B5985A]/30",
              "border border-white/20"
            ].join(" ")}
          >
            <Plus className="h-6 w-6" />
          </Button>
        </motion.div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto bg-black/90 backdrop-blur-xl border-white/10">
        <DialogHeader>
          <DialogTitle className="text-white">Add New Destination</DialogTitle>
          <DialogDescription className="text-gray-400">
            Create a new destination to associate with properties.
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
            <ImageUploadSectionCreate
              onImageSelect={handleImageSelect}
              disabled={isSubmitting}
            />
            
            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
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
                {isSubmitting ? "Creating..." : "Create Destination"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}