"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Download, FileSpreadsheet, FileText } from "lucide-react"
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
  FormDescription,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { exportContactsSchema, type ExportContactsData } from "@/lib/validations/contact"
import { CONTACT_CATEGORIES } from "@/types/contact"
import { GlobalContactCategory } from "@/generated/prisma"
import { toast } from "sonner"

interface ExportContactsDialogProps {
  selectedContactIds?: string[]
  children?: React.ReactNode
}

// Field selection options for export
const EXPORT_FIELDS = [
  { id: "firstName", label: "First Name", defaultChecked: true },
  { id: "lastName", label: "Last Name", defaultChecked: true },
  { id: "email", label: "Email", defaultChecked: true },
  { id: "phone", label: "Phone", defaultChecked: true },
  { id: "category", label: "Category", defaultChecked: true },
  { id: "language", label: "Language", defaultChecked: true },
  { id: "comments", label: "Comments", defaultChecked: false },
  { id: "contactProperties", label: "Linked Properties", defaultChecked: true },
  { id: "createdAt", label: "Created Date", defaultChecked: false },
  { id: "updatedAt", label: "Updated Date", defaultChecked: false },
]

export function ExportContactsDialog({ selectedContactIds = [], children }: ExportContactsDialogProps) {
  const [open, setOpen] = useState(false)
  const [selectedFields, setSelectedFields] = useState<string[]>(
    EXPORT_FIELDS.filter(field => field.defaultChecked).map(field => field.id)
  )
  const [isExporting, setIsExporting] = useState(false)

  const form = useForm({
    resolver: zodResolver(exportContactsSchema),
    defaultValues: {
      format: "csv",
      contactIds: selectedContactIds,
      filters: {},
    },
  })

  const handleFieldToggle = (fieldId: string, checked: boolean) => {
    setSelectedFields(prev => 
      checked 
        ? [...prev, fieldId]
        : prev.filter(id => id !== fieldId)
    )
  }

  const onSubmit = async (data: ExportContactsData) => {
    try {
      setIsExporting(true)

      // Here you would typically make an API call to generate the export
      // For now, we'll simulate the export process
      const exportData = {
        ...data,
        fields: selectedFields,
      }

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500))

      // In a real implementation, this would trigger a download
      const filename = `contacts-export-${new Date().toISOString().split('T')[0]}.${data.format}`
      
      toast.success(`Export completed: ${filename}`)
      setOpen(false)
      form.reset()
    } catch (error) {
      toast.error("Failed to export contacts")
    } finally {
      setIsExporting(false)
    }
  }

  const exportScope = form.watch("contactIds")?.length 
    ? `${form.watch("contactIds")?.length} selected contacts`
    : "All contacts"

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Export Contacts</DialogTitle>
          <DialogDescription>
            Configure your export settings and choose the data you want to include.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Export Scope */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Export Scope</Label>
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm">{exportScope}</p>
              </div>
            </div>

            {/* File Format */}
            <FormField
              control={form.control}
              name="format"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>File Format</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-row space-x-6"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="csv" id="csv" />
                        <Label htmlFor="csv" className="flex items-center cursor-pointer">
                          <FileText className="mr-2 h-4 w-4" />
                          CSV
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="excel" id="excel" />
                        <Label htmlFor="excel" className="flex items-center cursor-pointer">
                          <FileSpreadsheet className="mr-2 h-4 w-4" />
                          Excel
                        </Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Filter Options (only if not specific contacts) */}
            {!selectedContactIds.length && (
              <div className="space-y-4">
                <Label className="text-sm font-medium">Filter Options</Label>
                
                <FormField
                  control={form.control}
                  name="filters.category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="All categories" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="ALL">All categories</SelectItem>
                          {Object.entries(CONTACT_CATEGORIES).map(([key, config]) => (
                            <SelectItem key={key} value={key}>
                              {config.label}
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
                  name="filters.hasLinkedProperties"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          Only contacts with linked properties
                        </FormLabel>
                        <FormDescription>
                          Export only contacts that are linked to at least one property
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Field Selection */}
            <div className="space-y-4">
              <Label className="text-sm font-medium">Fields to Include</Label>
              <div className="grid grid-cols-2 gap-4">
                {EXPORT_FIELDS.map((field) => (
                  <FormItem
                    key={field.id}
                    className="flex flex-row items-start space-x-3 space-y-0"
                  >
                    <FormControl>
                      <Checkbox
                        checked={selectedFields.includes(field.id)}
                        onCheckedChange={(checked) => 
                          handleFieldToggle(field.id, checked as boolean)
                        }
                      />
                    </FormControl>
                    <FormLabel className="text-sm font-normal cursor-pointer">
                      {field.label}
                    </FormLabel>
                  </FormItem>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-[#1E3A3A] hover:bg-[#1E3A3A]/90"
                disabled={isExporting || selectedFields.length === 0}
              >
                {isExporting ? (
                  <>
                    <span className="mr-2">Exporting...</span>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Export
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