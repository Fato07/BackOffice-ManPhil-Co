"use client"

import { useState } from "react"
import { useForm, FieldValues } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { CalendarIcon, Upload, X } from "lucide-react"
import { 
  createLegalDocumentSchema,
  type CreateLegalDocumentInput
} from "@/lib/validations/legal-document"
import { z } from "zod"
import { 
  LEGAL_DOCUMENT_CATEGORY_LABELS,
  ALLOWED_FILE_EXTENSIONS,
  MAX_FILE_SIZE,
  formatFileSize
} from "@/types/legal-document"
import { useCreateLegalDocument } from "@/hooks/use-legal-documents"
import { useProperties } from "@/hooks/use-properties"
import { DocumentUploadZone } from "./document-upload-zone"

// Form schema with optional file for form state
const formSchema = createLegalDocumentSchema.omit({ file: true }).extend({
  file: z.instanceof(File).optional()
})

type FormData = z.infer<typeof formSchema>

interface CreateDocumentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateDocumentDialog({
  open,
  onOpenChange,
}: CreateDocumentDialogProps) {
  const [tagInput, setTagInput] = useState<string>("")
  const { mutate: createDocument, isPending } = useCreateLegalDocument()
  
  // Fetch properties for property selection
  const { data: propertiesResult, isLoading: propertiesLoading, error: propertiesError } = useProperties({}, 1, 100)
  const properties = propertiesResult?.data || []

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      category: undefined,
      subcategory: "",
      propertyId: undefined,
      expiryDate: undefined,
      reminderDays: undefined,
      tags: [],
      metadata: {},
      file: undefined,
    },
  } as any)

  const handleSubmit = (data: FormData) => {
    if (!data.file) {
      form.setError('file', { message: 'File is required' })
      return
    }
    
    createDocument({ ...data, file: data.file }, {
      onSuccess: () => {
        form.reset()
        onOpenChange(false)
      },
    })
  }

  const handleAddTag = () => {
    if (tagInput.trim()) {
      const currentTags = form.getValues("tags") || []
      form.setValue("tags", [...currentTags, tagInput.trim()])
      setTagInput("")
    }
  }

  const handleRemoveTag = (tag: string) => {
    const currentTags = form.getValues("tags") || []
    form.setValue("tags", currentTags.filter(t => t !== tag))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto bg-gradient-to-br from-white via-[#FAFAF8] to-white border-[#B5985A]/20 shadow-2xl">
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.02] pointer-events-none rounded-lg" />
        <DialogHeader className="relative">
          <DialogTitle className="text-2xl">Upload Legal Document</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground/80 mt-2">
            Upload a new legal document to the system. All fields marked with * are required.
          </DialogDescription>
          <div className="h-px bg-gradient-to-r from-transparent via-[#B5985A]/20 to-transparent mt-4" />
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
            {/* File upload section */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Upload File</h3>
              <FormField
                control={form.control}
                name="file"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <DocumentUploadZone
                        onFileSelect={(file) => {
                          field.onChange(file)
                          // Auto-fill name if empty
                          if (!form.getValues("name") && file) {
                            const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "")
                            form.setValue("name", nameWithoutExt)
                          }
                        }}
                        file={field.value || undefined}
                        onRemove={() => field.onChange(undefined)}
                      />
                    </FormControl>
                    <FormDescription>
                      Allowed formats: {ALLOWED_FILE_EXTENSIONS.join(", ")}. 
                      Max size: {formatFileSize(MAX_FILE_SIZE)}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Document Information */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Document Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Property Insurance Policy 2024" {...field} className="border-[#B5985A]/20 focus:border-[#B5985A]/40 focus:ring-[#B5985A]/20 transition-colors duration-200" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Brief description..."
                        className="resize-none border-[#B5985A]/20 focus:border-[#B5985A]/40 focus:ring-[#B5985A]/20 transition-colors duration-200"
                        {...field}
                        rows={1}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              </div>
            </div>

            {/* Classification */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <FormControl>
                        <SelectTrigger className="border-[#B5985A]/20 focus:border-[#B5985A]/40 focus:ring-[#B5985A]/20 transition-colors duration-200">
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(LEGAL_DOCUMENT_CATEGORY_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
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
                name="subcategory"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subcategory</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Annual, Monthly" {...field} className="border-[#B5985A]/20 focus:border-[#B5985A]/40 focus:ring-[#B5985A]/20 transition-colors duration-200" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              </div>
            </div>

            {/* Management Details */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="propertyId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Property</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(value === "none" ? null : value)} 
                      value={field.value || "none"}
                    >
                      <FormControl>
                        <SelectTrigger className="border-[#B5985A]/20 focus:border-[#B5985A]/40 focus:ring-[#B5985A]/20 transition-colors duration-200">
                          <SelectValue placeholder="No specific property (Global)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">No specific property (Global)</SelectItem>
                        {propertiesLoading ? (
                          <SelectItem value="loading" disabled>
                            Loading properties...
                          </SelectItem>
                        ) : propertiesError ? (
                          <SelectItem value="error" disabled>
                            Error loading properties
                          </SelectItem>
                        ) : properties.length === 0 ? (
                          <SelectItem value="empty" disabled>
                            No properties found
                          </SelectItem>
                        ) : (
                          properties.map((property) => (
                            <SelectItem key={property.id} value={property.id}>
                              {property.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormDescription className="text-xs">
                      Global or property-specific
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="expiryDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Expiry Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date < new Date()
                          }
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="reminderDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reminder Days</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        placeholder="e.g., 30"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormDescription>
                      Days before expiry to set reminder
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              </div>
            </div>

            {/* Tags Section */}
            <div className="space-y-2">
              <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags</FormLabel>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add tag..."
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleAddTag()
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={handleAddTag}
                      disabled={!tagInput.trim()}
                    >
                      Add
                    </Button>
                  </div>
                  {field.value && field.value.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {field.value.map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="cursor-pointer bg-[#FAFAF8] border border-[#B5985A]/20 hover:bg-[#B5985A]/10 transition-colors duration-200"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            handleRemoveTag(tag)
                          }}
                        >
                          {tag}
                          <X className="ml-1 h-3 w-3 hover:text-rose-600 transition-colors" />
                        </Badge>
                      ))}
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-[#B5985A]/10">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
                className="border-[#B5985A]/20 hover:bg-gray-50 transition-all duration-200"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending} className="bg-[#B5985A] hover:bg-[#B5985A]/90 text-white text-white transition-all duration-300 shadow-md hover:shadow-lg">
                {isPending ? (
                  <>
                    <div className="h-4 w-4 mr-2 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Document
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}