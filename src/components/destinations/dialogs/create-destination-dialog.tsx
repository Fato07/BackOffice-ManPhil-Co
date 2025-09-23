"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AnimatedButton } from "@/components/ui/animated-button"
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

const createDestinationSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  country: z.string().min(2, "Country is required"),
  region: z.string().optional(),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
})

type CreateDestinationForm = {
  name: string
  country: string
  region?: string
  latitude?: string
  longitude?: string
}

export function CreateDestinationDialog() {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()
  
  const form = useForm<CreateDestinationForm>({
    resolver: zodResolver(createDestinationSchema),
    defaultValues: {
      name: "",
      country: "",
      region: "",
    },
  })

  const onSubmit = async (data: CreateDestinationForm) => {
    try {
      const payload = {
        ...data,
        latitude: data.latitude ? parseFloat(data.latitude) : undefined,
        longitude: data.longitude ? parseFloat(data.longitude) : undefined,
      }
      await api.post("/api/destinations", payload)
      toast.success("Destination created successfully")
      queryClient.invalidateQueries({ queryKey: destinationKeys.all })
      setOpen(false)
      form.reset()
    } catch (error) {
      toast.error("Failed to create destination")
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
      <DialogContent className="sm:max-w-[425px] bg-black/90 backdrop-blur-xl border-white/10">
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
                      className="bg-white/10 border-white/10 text-white"
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
                      className="bg-white/10 border-white/10 text-white"
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
                      className="bg-white/10 border-white/10 text-white"
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
                        className="bg-white/10 border-white/10 text-white"
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
                        className="bg-white/10 border-white/10 text-white"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                className="flex-1 border-white/10 text-white"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-[#B5985A] hover:bg-[#B5985A]/80"
              >
                Create Destination
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}