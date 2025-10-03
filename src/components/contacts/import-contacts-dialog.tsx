"use client"

import { useState, useRef } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, XCircle } from "lucide-react"
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
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { importContactsSchema, type ImportContactsData } from "@/lib/validations/contact"
import { CONTACT_CATEGORIES, PROPERTY_RELATIONSHIPS } from "@/types/contact"
import { GlobalContactCategory, ContactPropertyRelationship } from "@/generated/prisma"
import { toast } from "sonner"

interface ImportContactsDialogProps {
  children?: React.ReactNode
}

interface ImportResult {
  success: number
  failed: number
  skipped: number
  errors: string[]
}

interface ParsedContact {
  firstName: string
  lastName: string
  email?: string
  phone?: string
  category: GlobalContactCategory
  language: string
  comments?: string
  contactProperties?: {
    propertyId: string
    relationship: ContactPropertyRelationship
  }[]
}

// CSV Template headers
const CSV_TEMPLATE = [
  "First Name*",
  "Last Name*", 
  "Email",
  "Phone",
  "Category*",
  "Language*",
  "Comments",
  "Property Links (format: propertyId:relationship;propertyId:relationship)"
].join(",")

export function ImportContactsDialog({ children }: ImportContactsDialogProps) {
  const [open, setOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [previewData, setPreviewData] = useState<ParsedContact[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const form = useForm({
    resolver: zodResolver(importContactsSchema),
    defaultValues: {
      contacts: [],
      skipDuplicates: true,
      updateExisting: false,
    },
  })

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    // Validate file type
    const validTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
    if (!validTypes.includes(selectedFile.type)) {
      toast.error("Please upload a CSV or Excel file")
      return
    }

    setFile(selectedFile)
    
    // Parse file for preview
    try {
      const parsed = await parseFile(selectedFile)
      setPreviewData(parsed.slice(0, 5)) // Show first 5 rows
      form.setValue("contacts", parsed)
    } catch (error) {
      toast.error("Failed to parse file. Please check the format.")
      setFile(null)
    }
  }

  const parseFile = async (file: File): Promise<ParsedContact[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string
          const lines = text.split('\n')
          const headers = lines[0].split(',').map(h => h.trim())
          
          const contacts: ParsedContact[] = []
          
          for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim()
            if (!line) continue
            
            const values = line.split(',').map(v => v.trim())
            
            const contact: ParsedContact = {
              firstName: values[0] || '',
              lastName: values[1] || '',
              email: values[2] || undefined,
              phone: values[3] || undefined,
              category: values[4] as GlobalContactCategory || GlobalContactCategory.OTHER,
              language: values[5] || 'English',
              comments: values[6] || undefined,
              contactProperties: parsePropertyLinks(values[7]),
            }
            
            contacts.push(contact)
          }
          
          resolve(contacts)
        } catch (error) {
          reject(error)
        }
      }
      
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsText(file)
    })
  }

  const parsePropertyLinks = (linksStr: string): ParsedContact['contactProperties'] => {
    if (!linksStr || linksStr.trim() === '') return []
    
    const links: ParsedContact['contactProperties'] = []
    const pairs = linksStr.split(';')
    
    for (const pair of pairs) {
      const [propertyId, relationship] = pair.split(':')
      if (propertyId && relationship) {
        links.push({
          propertyId: propertyId.trim(),
          relationship: relationship.trim() as ContactPropertyRelationship,
        })
      }
    }
    
    return links
  }

  const onSubmit = async (data: ImportContactsData) => {
    try {
      setIsUploading(true)
      setUploadProgress(0)
      
      // Simulate progress updates
      const interval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90))
      }, 200)

      // In a real implementation, this would call the import API
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      clearInterval(interval)
      setUploadProgress(100)

      // Simulate import result
      const result: ImportResult = {
        success: data.contacts.length - 2,
        failed: 1,
        skipped: 1,
        errors: [
          "Row 5: Email 'invalid-email' is not valid",
          "Row 8: Skipped duplicate email 'john@example.com'",
        ]
      }
      
      setImportResult(result)
      
      if (result.success > 0) {
        toast.success(`Successfully imported ${result.success} contacts`)
      }
    } catch (error) {
      toast.error("Failed to import contacts")
    } finally {
      setIsUploading(false)
    }
  }

  const downloadTemplate = () => {
    const blob = new Blob([CSV_TEMPLATE], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'contacts-import-template.csv'
    a.click()
    window.URL.revokeObjectURL(url)
    toast.success("Template downloaded")
  }

  const resetImport = () => {
    setFile(null)
    setImportResult(null)
    setUploadProgress(0)
    setPreviewData([])
    form.reset()
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      setOpen(newOpen)
      if (!newOpen) resetImport()
    }}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline">
            <Upload className="mr-2 h-4 w-4" />
            Import
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Contacts</DialogTitle>
          <DialogDescription>
            Upload a CSV or Excel file to import multiple contacts at once.
          </DialogDescription>
        </DialogHeader>

        {!importResult ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <FormLabel>Upload File</FormLabel>
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    onClick={downloadTemplate}
                  >
                    Download Template
                  </Button>
                </div>
                
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileChange}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer flex flex-col items-center gap-2"
                  >
                    <FileSpreadsheet className="h-10 w-10 text-muted-foreground" />
                    <div className="text-sm">
                      <span className="font-medium text-primary">Click to upload</span>
                      <span className="text-muted-foreground"> or drag and drop</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      CSV or Excel files up to 10MB
                    </p>
                  </label>
                </div>

                {file && (
                  <Alert>
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertDescription>
                      Selected file: <span className="font-medium">{file.name}</span>
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="skipDuplicates"
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
                          Skip duplicate contacts
                        </FormLabel>
                        <FormDescription>
                          Skip contacts with email addresses that already exist
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="updateExisting"
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
                          Update existing contacts
                        </FormLabel>
                        <FormDescription>
                          Update contacts if they already exist (matched by email)
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              {previewData.length > 0 && (
                <div className="space-y-2">
                  <FormLabel>Preview (first 5 rows)</FormLabel>
                  <ScrollArea className="h-48 w-full border rounded-lg p-4">
                    <div className="space-y-2">
                      {previewData.map((contact, index) => (
                        <div key={index} className="text-sm p-2 bg-muted rounded-lg">
                          <div className="font-medium">
                            {contact.firstName} {contact.lastName}
                          </div>
                          <div className="text-muted-foreground">
                            {contact.email || "No email"} • {contact.category} • {contact.language}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}

              {isUploading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Importing contacts...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} />
                </div>
              )}

              <div className="flex justify-end gap-4">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="bg-[#1E3A3A] hover:bg-[#1E3A3A]/90"
                  disabled={!file || isUploading || form.getValues("contacts").length === 0}
                >
                  {isUploading ? (
                    <>
                      <span className="mr-2">Importing...</span>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Import Contacts
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        ) : (
          // Import Results
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="font-medium">Import Summary</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-green-50 rounded-lg text-center">
                  <CheckCircle2 className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <div className="text-2xl font-semibold text-green-900">
                    {importResult.success}
                  </div>
                  <div className="text-sm text-green-700">
                    Successful
                  </div>
                </div>
                <div className="p-4 bg-yellow-50 rounded-lg text-center">
                  <AlertCircle className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                  <div className="text-2xl font-semibold text-yellow-900">
                    {importResult.skipped}
                  </div>
                  <div className="text-sm text-yellow-700">
                    Skipped
                  </div>
                </div>
                <div className="p-4 bg-red-50 rounded-lg text-center">
                  <XCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
                  <div className="text-2xl font-semibold text-red-900">
                    {importResult.failed}
                  </div>
                  <div className="text-sm text-red-700">
                    Failed
                  </div>
                </div>
              </div>
            </div>

            {importResult.errors.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">Issues Found</h4>
                <ScrollArea className="h-32 w-full border rounded-lg p-4">
                  <div className="space-y-2">
                    {importResult.errors.map((error, index) => (
                      <Alert key={index} variant="destructive" className="py-2">
                        <AlertDescription className="text-sm">{error}</AlertDescription>
                      </Alert>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            <div className="flex justify-end gap-4">
              <Button
                variant="outline"
                onClick={resetImport}
              >
                Import More
              </Button>
              <Button
                className="bg-[#1E3A3A] hover:bg-[#1E3A3A]/90"
                onClick={() => setOpen(false)}
              >
                Done
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}