"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { ContactType } from "@/generated/prisma"
import { 
  User,
  Building,
  Users,
  Wrench,
  AlertTriangle,
  UserCheck,
  CheckCircle,
  Shield,
  FileSignature,
  Home,
  Trees,
  Waves,
  UserPlus,
  Crown,
  Save,
  X
} from "lucide-react"

const contactFormSchema = z.object({
  type: z.nativeEnum(ContactType),
  firstName: z.string().min(1, "First name is required").max(100, "First name too long"),
  lastName: z.string().min(1, "Last name is required").max(100, "Last name too long"),
  email: z.string().email("Please enter a valid email address").optional().or(z.literal("")),
  phone: z.string().max(50, "Phone number too long").optional().or(z.literal("")),
  notes: z.string().max(1000, "Notes too long").optional().or(z.literal("")),
  spokenLanguage: z.string(),
  isContractSignatory: z.boolean(),
  isApproved: z.boolean(),
})

type ContactFormData = z.infer<typeof contactFormSchema>

const contactTypeIcons = {
  [ContactType.OWNER]: User,
  [ContactType.MANAGER]: UserCheck,
  [ContactType.AGENCY]: Building,
  [ContactType.STAFF]: Users,
  [ContactType.MAINTENANCE]: Wrench,
  [ContactType.EMERGENCY]: AlertTriangle,
  [ContactType.CHECK_IN_MANAGER]: CheckCircle,
  [ContactType.SECURITY_DEPOSIT_MANAGER]: Shield,
  [ContactType.SIGNATORY]: FileSignature,
  [ContactType.HOUSEKEEPING]: Home,
  [ContactType.GARDENING]: Trees,
  [ContactType.POOL_MAINTENANCE]: Waves,
  [ContactType.CHECK_IN_STAFF]: UserPlus,
}

const contactTypeLabels = {
  [ContactType.OWNER]: "Owner",
  [ContactType.MANAGER]: "Manager",
  [ContactType.AGENCY]: "Agency",
  [ContactType.STAFF]: "Staff",
  [ContactType.MAINTENANCE]: "Maintenance",
  [ContactType.EMERGENCY]: "Emergency",
  [ContactType.CHECK_IN_MANAGER]: "Check-in Manager",
  [ContactType.SECURITY_DEPOSIT_MANAGER]: "Security Deposit Manager",
  [ContactType.SIGNATORY]: "Signatory",
  [ContactType.HOUSEKEEPING]: "Housekeeping",
  [ContactType.GARDENING]: "Gardening",
  [ContactType.POOL_MAINTENANCE]: "Pool Maintenance",
  [ContactType.CHECK_IN_STAFF]: "Check-in Staff",
}

interface ContactDetailsModalProps {
  open: boolean
  onClose: () => void
  onSave: (data: ContactFormData) => void
  initialData?: Partial<ContactFormData>
  mode: "create" | "edit"
  isLoading?: boolean
}

export function ContactDetailsModal({
  open,
  onClose,
  onSave,
  initialData,
  mode,
  isLoading = false,
}: ContactDetailsModalProps) {
  const defaultFormValues = {
    type: ContactType.OWNER,
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    notes: "",
    spokenLanguage: "English",
    isContractSignatory: false,
    isApproved: false,
  }

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: mode === "edit" && initialData ? {
      ...defaultFormValues,
      ...initialData,
    } : defaultFormValues,
  })

  const { register, handleSubmit, formState: { errors }, setValue, watch, reset } = form
  const selectedType = watch("type")
  const SelectedIcon = contactTypeIcons[selectedType]

  // Reset form when modal closes to prepare for next use
  React.useEffect(() => {
    if (!open) {
      reset({
        type: ContactType.OWNER,
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        notes: "",
        spokenLanguage: "English",
        isContractSignatory: false,
        isApproved: false,
      })
    }
  }, [open, reset])

  // Don't render form until we have data for edit mode
  if (mode === "edit" && !initialData) {
    return null
  }

  const handleFormSubmit = (data: ContactFormData) => {
    // Clean up empty strings to null for optional fields
    const cleanedData = {
      ...data,
      email: data.email || undefined,
      phone: data.phone || undefined,
      notes: data.notes || undefined,
    }
    onSave(cleanedData)
  }

  const handleCancel = () => {
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] lg:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {SelectedIcon && <SelectedIcon className="h-5 w-5" />}
            {mode === "create" ? "Add New Contact" : "Edit Contact"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create" 
              ? "Add a new contact for this property. All fields except name are optional."
              : "Update the contact information below."
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-8">
          {/* Contact Type Section */}
          <div className="space-y-4">
            {/* <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground uppercase tracking-wide">
              <Users className="h-4 w-4" />
              Contact Information
            </div> */}
            <div>
              <Label htmlFor="type" className="text-base font-medium">Contact Type *</Label>
              <Select
                value={selectedType}
                onValueChange={(value) => setValue("type", value as ContactType)}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select contact type">
                    {selectedType && (
                      <div className="flex items-center gap-2">
                        {React.createElement(contactTypeIcons[selectedType], { className: "h-4 w-4" })}
                        {contactTypeLabels[selectedType]}
                      </div>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ContactType).map(([, value]) => {
                    const Icon = contactTypeIcons[value]
                    return (
                      <SelectItem key={value} value={value}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          {contactTypeLabels[value]}
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
              {errors.type && (
                <p className="text-sm text-destructive mt-1">{errors.type.message}</p>
              )}
            </div>
          </div>

          {/* Personal Details Section */}
          <div className="space-y-4">
            {/* <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground uppercase tracking-wide">
              <User className="h-4 w-4" />
              Personal Details
            </div> */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* First Name */}
              <div>
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                {...register("firstName")}
                placeholder="First name"
                className={`mt-2 ${errors.firstName ? "border-destructive" : ""}`}
              />
              {errors.firstName && (
                <p className="text-sm text-destructive mt-1">{errors.firstName.message}</p>
              )}
            </div>

              {/* Last Name */}
              <div>
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  {...register("lastName")}
                  placeholder="Last name"
                  className={`mt-2 ${errors.lastName ? "border-destructive" : ""}`}
                />
                {errors.lastName && (
                  <p className="text-sm text-destructive mt-1">{errors.lastName.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Contact Details Section */}
          <div className="space-y-4">
            {/* <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground uppercase tracking-wide">
              <Mail className="h-4 w-4" />
              Contact Details
            </div> */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Email */}
              <div>
                <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...register("email")}
                placeholder="email@example.com"
                className={`mt-2 ${errors.email ? "border-destructive" : ""}`}
              />
                {errors.email && (
                  <p className="text-sm text-destructive mt-1">{errors.email.message}</p>
                )}
              </div>

              {/* Phone */}
              <div>
                <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                {...register("phone")}
                placeholder="+1 234 567 8900"
                className={`mt-2 ${errors.phone ? "border-destructive" : ""}`}
              />
                {errors.phone && (
                  <p className="text-sm text-destructive mt-1">{errors.phone.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Language & Authorization Section */}
          <div className="space-y-4">
            {/* <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground uppercase tracking-wide">
              <Globe className="h-4 w-4" />
              Language & Authorization
            </div> */}
            <div className="space-y-6">
              {/* Spoken Language */}
              <div>
                <Label className="text-base font-medium">Spoken Language</Label>
                <RadioGroup
                  value={watch("spokenLanguage")}
                  onValueChange={(value) => setValue("spokenLanguage", value)}
                  className="flex gap-6 mt-3"
                >
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value="English" id="english" />
                    <Label htmlFor="english" className="text-sm font-medium">🇬🇧 English</Label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value="French" id="french" />
                    <Label htmlFor="french" className="text-sm font-medium">🇫🇷 French</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Contract Signatory */}
              <div className="space-y-3">
                <Label className="text-base font-medium">Contract Authorization</Label>
                <div className="flex items-start space-x-3 p-4 border rounded-lg bg-slate-50/50">
                  <Checkbox
                    id="isContractSignatory"
                    checked={watch("isContractSignatory")}
                    onCheckedChange={(checked) => setValue("isContractSignatory", !!checked)}
                    className="mt-1"
                  />
                  <div className="space-y-2">
                    <Label htmlFor="isContractSignatory" className="flex items-center gap-2 font-medium">
                      <FileSignature className="h-4 w-4" />
                      Contract Signatory
                    </Label>
                    <Badge 
                      variant={watch("isContractSignatory") ? "default" : "outline"}
                      className={watch("isContractSignatory") ? "bg-blue-100 text-blue-800 border-blue-200" : ""}
                    >
                      {watch("isContractSignatory") ? (
                        <>
                          <Crown className="w-3 h-3 mr-1" />
                          Authorized
                        </>
                      ) : (
                        "Not Authorized"
                      )}
                    </Badge>
                    <p className="text-xs text-muted-foreground">
                      This contact is authorized to sign contracts for the property
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Notes Section */}
          <div className="space-y-4">
            {/* <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground uppercase tracking-wide">
              <FileText className="h-4 w-4" />
              Additional Information
            </div> */}
            <div>
              <Label htmlFor="notes" className="text-base font-medium">Notes</Label>
              <Textarea
                id="notes"
                {...register("notes")}
                placeholder="Additional notes about this contact..."
                rows={4}
                className={`mt-2 ${errors.notes ? "border-destructive" : ""}`}
              />
              {errors.notes && (
                <p className="text-sm text-destructive mt-1">{errors.notes.message}</p>
              )}
            </div>
          </div>

          {/* Approval Status Section */}
          <div className="space-y-4">
            {/* <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground uppercase tracking-wide">
              <CheckCircle className="h-4 w-4" />
              Approval Status
            </div> */}
            <div className="p-4 border rounded-lg bg-green-50/50">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="isApproved"
                  checked={watch("isApproved")}
                  onCheckedChange={(checked) => setValue("isApproved", !!checked)}
                  className="mt-1"
                />
                <div className="space-y-2">
                  <Label htmlFor="isApproved" className="font-medium">Approved Contact</Label>
                  <Badge 
                    variant={watch("isApproved") ? "default" : "outline"}
                    className={watch("isApproved") ? "bg-green-100 text-green-800 border-green-200" : ""}
                  >
                    {watch("isApproved") ? (
                      <>
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Approved
                      </>
                    ) : (
                      "Pending"
                    )}
                  </Badge>
                  <p className="text-xs text-muted-foreground">
                    Mark this contact as approved for property management tasks
                  </p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-3 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isLoading}
              size="lg"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} size="lg">
              {isLoading ? (
                <>
                  <div className="h-4 w-4 mr-2 animate-spin border-2 border-current border-t-transparent rounded-full" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {mode === "create" ? "Add Contact" : "Save Changes"}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export type { ContactFormData }