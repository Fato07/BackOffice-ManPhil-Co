"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
import { 
  CalendarIcon, 
  Download, 
  Eye, 
  Trash2, 
  Upload,
  X,
  FileText,
  History,
  Info
} from "lucide-react"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { updateLegalDocumentSchema, type UpdateLegalDocumentInput } from "@/lib/validations/legal-document"
import { 
  useLegalDocument, 
  useUpdateLegalDocument, 
  useDeleteLegalDocument,
  useDownloadDocument
} from "@/hooks/use-legal-documents"
import { useProperties } from "@/hooks/use-properties"
import { 
  LEGAL_DOCUMENT_CATEGORY_LABELS, 
  LEGAL_DOCUMENT_STATUS_LABELS,
  LEGAL_DOCUMENT_STATUS_COLORS,
  formatFileSize,
  type LegalDocumentWithRelations
} from "@/types/legal-document"
import { LegalDocumentCategory, LegalDocumentStatus } from "@/generated/prisma"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { UploadVersionDialog } from "./upload-version-dialog"

// Safe date formatting helper
const formatDate = (date: Date | string | null | undefined, pattern: string): string => {
  if (!date) return "N/A"
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    if (isNaN(dateObj.getTime())) return "Invalid date"
    return format(dateObj, pattern)
  } catch (error) {
    console.error('Date formatting error:', error)
    return "Invalid date"
  }
}

interface EditLegalDocumentDialogProps {
  documentId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditLegalDocumentDialog({ 
  documentId, 
  open, 
  onOpenChange 
}: EditLegalDocumentDialogProps) {
  const [tagInput, setTagInput] = useState<string>("")
  const [showUploadVersion, setShowUploadVersion] = useState(false)
  const { data: documentResult, isLoading: documentLoading } = useLegalDocument(documentId, open)
  const document = documentResult?.data
  const updateDocument = useUpdateLegalDocument(documentId)
  const deleteDocument = useDeleteLegalDocument()
  const downloadDocument = useDownloadDocument()
  const { data: propertiesResult } = useProperties({}, 1, 100)
  const properties = propertiesResult?.data || []

  const form = useForm<UpdateLegalDocumentInput>({
    resolver: zodResolver(updateLegalDocumentSchema),
    defaultValues: {
      name: "",
      description: "",
      category: undefined,
      subcategory: "",
      status: undefined,
      propertyId: null,
      expiryDate: null,
      reminderDays: null,
      tags: [],
      metadata: {},
    },
  })

  // Update form when document data is loaded
  useEffect(() => {
    if (document) {
      form.reset({
        name: document.name,
        description: document.description || "",
        category: document.category,
        subcategory: document.subcategory || "",
        status: document.status,
        propertyId: document.propertyId || null,
        expiryDate: document.expiryDate ? new Date(document.expiryDate) : null,
        reminderDays: document.reminderDays || null,
        tags: document.tags || [],
        metadata: document.metadata as Record<string, unknown> || {},
      })
    }
  }, [document, form])

  const onSubmit = async (data: UpdateLegalDocumentInput) => {
    updateDocument.mutate(data, {
      onSuccess: () => {
        toast.success("Document updated successfully")
      },
    })
  }

  const handleDelete = () => {
    deleteDocument.mutate(documentId, {
      onSuccess: () => {
        onOpenChange(false)
      },
    })
  }

  const handleDownload = (versionNumber?: number) => {
    downloadDocument.mutate({ id: documentId, version: versionNumber })
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

  if (documentLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Loading Document</DialogTitle>
            <DialogDescription>
              Please wait while we retrieve the document details
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
            <Skeleton className="h-32 w-full" />
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (!document) return null

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-full bg-white p-0 sm:max-w-[90vw] lg:max-w-4xl">
        <div className="flex flex-col h-[85vh] max-h-[900px]">
          {/* Header - Simplified */}
          <DialogHeader className="px-6 py-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <DialogTitle className="text-lg font-medium text-gray-900">
                  {document?.name || 'Loading...'}
                </DialogTitle>
                <DialogDescription className="mt-0.5 text-sm text-gray-500">
                  {document?.category && LEGAL_DOCUMENT_CATEGORY_LABELS[document.category]}
                </DialogDescription>
              </div>
              <Badge 
                variant="secondary"
                className={cn(
                  "text-xs px-2 py-0.5 font-medium",
                  document && LEGAL_DOCUMENT_STATUS_COLORS[document.status] === "green" && "bg-green-100 text-green-700",
                  document && LEGAL_DOCUMENT_STATUS_COLORS[document.status] === "red" && "bg-red-100 text-red-700",
                  document && LEGAL_DOCUMENT_STATUS_COLORS[document.status] === "yellow" && "bg-yellow-100 text-yellow-700",
                  document && LEGAL_DOCUMENT_STATUS_COLORS[document.status] === "gray" && "bg-gray-100 text-gray-700"
                )}
              >
                {document && LEGAL_DOCUMENT_STATUS_LABELS[document.status]}
              </Badge>
            </div>
          </DialogHeader>

          {/* Tabs - Luxurious minimal design */}
          <Tabs defaultValue="details" className="flex-1 flex flex-col overflow-hidden relative">
            <TabsList className="flex w-full bg-white/50 backdrop-blur-sm border-b border-gray-200/50 rounded-none h-12 px-4 sm:px-6 gap-6 sm:gap-8">
              <TabsTrigger 
                value="details" 
                className="group relative bg-transparent px-0 pb-3 h-auto rounded-none transition-all duration-200 text-sm font-medium text-gray-500 hover:text-gray-700 data-[state=active]:text-[#1c355e] tracking-wide"
              >
                <span className="relative z-10">Details</span>
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#B5985A] to-[#D4AF37] transform scale-x-0 transition-transform duration-300 ease-out group-data-[state=active]:scale-x-100" />
                <span className="absolute bottom-[-1px] left-0 right-0 h-[1px] bg-gradient-to-r from-[#B5985A]/20 to-[#D4AF37]/20 blur-sm transform scale-x-0 transition-transform duration-300 ease-out group-data-[state=active]:scale-x-100" />
              </TabsTrigger>
              <TabsTrigger 
                value="versions"
                className="group relative bg-transparent px-0 pb-3 h-auto rounded-none transition-all duration-200 text-sm font-medium text-gray-500 hover:text-gray-700 data-[state=active]:text-[#1c355e] tracking-wide"
              >
                <span className="relative z-10 flex items-center gap-1.5">
                  <span>Versions</span>
                  <span className="text-xs text-gray-400 group-data-[state=active]:text-[#B5985A]/70 transition-colors duration-200">({document?.versions?.length || 1})</span>
                </span>
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#B5985A] to-[#D4AF37] transform scale-x-0 transition-transform duration-300 ease-out group-data-[state=active]:scale-x-100" />
                <span className="absolute bottom-[-1px] left-0 right-0 h-[1px] bg-gradient-to-r from-[#B5985A]/20 to-[#D4AF37]/20 blur-sm transform scale-x-0 transition-transform duration-300 ease-out group-data-[state=active]:scale-x-100" />
              </TabsTrigger>
              <TabsTrigger 
                value="metadata"
                className="group relative bg-transparent px-0 pb-3 h-auto rounded-none transition-all duration-200 text-sm font-medium text-gray-500 hover:text-gray-700 data-[state=active]:text-[#1c355e] tracking-wide"
              >
                <span className="relative z-10">Information</span>
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#B5985A] to-[#D4AF37] transform scale-x-0 transition-transform duration-300 ease-out group-data-[state=active]:scale-x-100" />
                <span className="absolute bottom-[-1px] left-0 right-0 h-[1px] bg-gradient-to-r from-[#B5985A]/20 to-[#D4AF37]/20 blur-sm transform scale-x-0 transition-transform duration-300 ease-out group-data-[state=active]:scale-x-100" />
              </TabsTrigger>
            </TabsList>

            {/* Scrollable content area */}
            <TabsContent value="details" className="flex-1 overflow-y-auto p-6 focus:outline-none animate-in fade-in-0 slide-in-from-bottom-1 duration-300">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Basic Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Document Name</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            className="h-10"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              value={field.value || ""}
                              className="resize-none min-h-[80px]"
                              rows={3}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Category, Status, and Property */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="h-10">
                                <SelectValue placeholder="Select category" />
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
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="h-10">
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Object.entries(LEGAL_DOCUMENT_STATUS_LABELS).map(([value, label]) => (
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

                    {/* Property */}
                    <FormField
                      control={form.control}
                      name="propertyId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Property (Optional)</FormLabel>
                          <Select
                            onValueChange={(value) => field.onChange(value === "none" ? null : value)}
                            value={field.value || "none"}
                          >
                            <FormControl>
                              <SelectTrigger className="h-10">
                                <SelectValue placeholder="Select property" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">None</SelectItem>
                              {properties && Array.isArray(properties) && properties.map((property) => (
                                <SelectItem key={property.id} value={property.id}>
                                  {property.name}
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
                          <FormLabel>Subcategory (Optional)</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              value={field.value || ""} 
                              className="h-10"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Expiry and Reminder */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="expiryDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel className="text-sm font-normal text-gray-700">Expiry Date</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "w-full h-9 pl-3 text-left font-normal border-gray-200 hover:border-gray-400",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    formatDate(field.value, "PPP")
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
                                selected={field.value || undefined}
                                onSelect={field.onChange}
                                disabled={(date) =>
                                  date < new Date(new Date().setHours(0, 0, 0, 0))
                                }
                                initialFocus
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
                              {...field} 
                              type="number" 
                              min={0}
                              value={field.value || ""}
                              onChange={(e) => {
                                const value = e.target.value
                                if (value === '' || value === null || value === undefined) {
                                  field.onChange(null)
                                } else {
                                  const parsed = parseInt(value, 10)
                                  field.onChange(isNaN(parsed) ? null : parsed)
                                }
                              }}
                              className="h-10"
                            />
                          </FormControl>
                          <FormDescription className="text-xs">
                            Days before expiry to send reminder
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Tags */}
                  <FormField
                    control={form.control}
                    name="tags"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Tags</FormLabel>
                        <FormControl>
                          <div className="space-y-3">
                            <div className="flex gap-2">
                              <Input
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                placeholder="Add a tag"
                                onKeyPress={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault()
                                    handleAddTag()
                                  }
                                }}
                                className="h-10 flex-1"
                              />
                              <Button
                                type="button"
                                size="sm"
                                onClick={handleAddTag}
                                disabled={!tagInput.trim()}
                                className="h-9 px-3 bg-gray-900 hover:bg-gray-800 text-white"
                              >
                                Add
                              </Button>
                            </div>
                            {field.value && field.value.length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                {field.value.map((tag) => (
                                  <Badge 
                                    key={tag} 
                                    variant="secondary"
                                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-2.5 py-1"
                                  >
                                    <span className="text-xs">{tag}</span>
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveTag(tag)}
                                      className="ml-1.5 hover:text-gray-900 transition-colors"
                                    >
                                      <X className="h-2.5 w-2.5" />
                                    </button>
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                </form>
              </Form>
            </TabsContent>

            <TabsContent value="versions" className="flex-1 overflow-y-auto p-6 focus:outline-none animate-in fade-in-0 slide-in-from-bottom-1 duration-300">
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-base font-medium text-gray-900">Version History</h3>
                  <Button
                    size="sm"
                    onClick={() => setShowUploadVersion(true)}
                    variant="outline"
                    className="h-8 px-3 text-sm border-gray-200 hover:bg-gray-50"
                  >
                    <Upload className="h-3.5 w-3.5 mr-1.5" />
                    New Version
                  </Button>
                </div>

                {document?.versions && Array.isArray(document.versions) && document.versions.length > 0 ? (
                  <div className="space-y-2">
                    {document.versions.map((version) => (
                      <div key={version.id} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-900">v{version.versionNumber}</span>
                              <span className="text-xs text-gray-500">{formatFileSize(version.fileSize)}</span>
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5">
                              {formatDate(version.uploadedAt, "MMM d, yyyy 'at' h:mm a")}
                            </div>
                            {version.comment && (
                              <p className="text-sm text-gray-600 mt-2">{version.comment}</p>
                            )}
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDownload(version.versionNumber)}
                            className="h-8 px-2 hover:bg-gray-100"
                          >
                            <Download className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileText className="h-12 w-12 text-gray-300 mx-auto" />
                    <p className="mt-3 text-sm">No version history available</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="metadata" className="flex-1 overflow-y-auto p-6 focus:outline-none animate-in fade-in-0 slide-in-from-bottom-1 duration-300">
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1 p-4 rounded-lg bg-gray-50 border">
                  <dt className="text-xs font-medium text-muted-foreground">File Size</dt>
                  <dd className="text-sm font-medium">{formatFileSize(document.fileSize)}</dd>
                </div>
                <div className="space-y-1 p-4 rounded-lg bg-gray-50 border">
                  <dt className="text-xs font-medium text-muted-foreground">MIME Type</dt>
                  <dd className="text-sm font-medium">{document.mimeType}</dd>
                </div>
                <div className="space-y-1 p-4 rounded-lg bg-gray-50 border">
                  <dt className="text-xs font-medium text-muted-foreground">Uploaded By</dt>
                  <dd className="text-sm font-medium">{document.uploadedBy}</dd>
                </div>
                <div className="space-y-1 p-4 rounded-lg bg-gray-50 border">
                  <dt className="text-xs font-medium text-muted-foreground">Uploaded At</dt>
                  <dd className="text-sm font-medium">{formatDate(document.uploadedAt, "PPp")}</dd>
                </div>
                {document.lastAccessedAt && (
                  <div className="space-y-1 p-4 rounded-lg bg-gray-50 border">
                    <dt className="text-xs font-medium text-muted-foreground">Last Accessed</dt>
                    <dd className="text-sm font-medium">{formatDate(document.lastAccessedAt, "PPp")}</dd>
                  </div>
                )}
                {document.property && (
                  <div className="space-y-1 p-4 rounded-lg bg-gray-50 border">
                    <dt className="text-xs font-medium text-muted-foreground">Property</dt>
                    <dd className="text-sm font-medium">{document.property.name}</dd>
                  </div>
                )}
              </dl>
              {document.metadata && Object.keys(document.metadata).length > 0 && (
                <div className="mt-6 space-y-2">
                  <h4 className="text-sm font-medium">Custom Metadata</h4>
                  <div className="rounded-lg border bg-gray-50 p-4">
                    <pre className="text-xs overflow-x-auto font-mono">
                      {(() => {
                        try {
                          return JSON.stringify(document.metadata, null, 2)
                        } catch (error) {
                          console.error('Error stringifying metadata:', error)
                          return 'Unable to display metadata'
                        }
                      })()}
                    </pre>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Simplified footer */}
          <div className="border-t px-6 py-4 mt-auto">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <div className="flex justify-between items-center">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        type="button" 
                        variant="ghost"
                        className="text-red-600 hover:bg-red-50"
                        size="sm"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete the
                          document and all its versions.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={handleDelete}
                          className="bg-rose-600 hover:bg-rose-700 text-white"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>

                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleDownload()}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={updateDocument.isPending}
                      className="bg-[#B5985A] hover:bg-[#B5985A]/90 text-white"
                    >
                      {updateDocument.isPending ? (
                        <>
                          <div className="h-4 w-4 mr-2 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                          Saving...
                        </>
                      ) : (
                        "Save Changes"
                      )}
                    </Button>
                  </div>
                </div>
              </form>
            </Form>
          </div>
        </div>
      </DialogContent>

    </Dialog>

      {/* Upload New Version Dialog */}
      <UploadVersionDialog
        documentId={documentId}
        documentName={document?.name || ""}
        open={showUploadVersion}
        onOpenChange={setShowUploadVersion}
      />
    </>
  )
}