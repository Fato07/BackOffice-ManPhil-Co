"use client"

import * as React from "react"
import { ColumnDef } from "@tanstack/react-table"
import { 
  User,
  Building,
  Users,
  Wrench,
  AlertTriangle,
  Mail,
  Phone,
  UserCheck,
  CheckCircle,
  Shield,
  FileSignature,
  Home,
  Trees,
  Waves,
  UserPlus,
  Crown,
  Edit2,
  Trash2
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DataTable, DataTableColumnHeader } from "@/components/ui/data-table"
import { exportToCSV } from "@/components/ui/virtual-data-table"
import { ContactType } from "@/generated/prisma"

interface ContactTableData {
  id?: string
  type: ContactType
  firstName: string
  lastName: string
  name?: string // Legacy field for backward compatibility
  email?: string | null
  phone?: string | null
  notes?: string | null
  spokenLanguage?: string | null
  isContractSignatory?: boolean
  isApproved: boolean
  index: number
}

interface ContactsTableProps {
  contacts: ContactTableData[]
  isEditing: boolean
  onEdit: (index: number) => void
  onDelete: (index: number) => void
  onBulkDelete?: (indices: number[]) => void
}

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

function createColumns(
  isEditing: boolean,
  onEdit: (index: number) => void,
  onDelete: (index: number) => void
): ColumnDef<ContactTableData>[] {
  return [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Contact" />
      ),
      cell: ({ row }) => {
        const contact = row.original
        const Icon = contactTypeIcons[contact.type]
        
        const fullName = `${contact.firstName} ${contact.lastName}`.trim()
        
        return (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Icon className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{fullName}</span>
              {contact.isContractSignatory && (
                <div title="Contract Signatory">
                  <Crown className="h-4 w-4 text-blue-600" />
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="w-fit text-xs">
                {contactTypeLabels[contact.type]}
              </Badge>
              {contact.spokenLanguage && (
                <span className="text-xs text-muted-foreground" title={`Speaks ${contact.spokenLanguage}`}>
                  {contact.spokenLanguage === "French" ? "🇫🇷" : "🇬🇧"}
                </span>
              )}
            </div>
          </div>
        )
      },
      sortingFn: (rowA, rowB) => {
        const nameA = `${rowA.original.firstName} ${rowA.original.lastName}`.toLowerCase()
        const nameB = `${rowB.original.firstName} ${rowB.original.lastName}`.toLowerCase()
        return nameA.localeCompare(nameB)
      },
    },
    {
      accessorKey: "contactInfo",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Contact Info" />
      ),
      meta: {
        className: "hidden sm:table-cell",
      },
      cell: ({ row }) => {
        const contact = row.original
        
        return (
          <div className="flex flex-col gap-1">
            {contact.email && (
              <a 
                href={`mailto:${contact.email}`}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground hover:underline transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <Mail className="h-3 w-3" />
                <span className="truncate max-w-[150px]">{contact.email}</span>
              </a>
            )}
            {contact.phone && (
              <a 
                href={`tel:${contact.phone}`}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground hover:underline transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <Phone className="h-3 w-3" />
                <span className="truncate max-w-[120px]">{contact.phone}</span>
              </a>
            )}
            {!contact.email && !contact.phone && (
              <span className="text-xs text-muted-foreground">No contact info</span>
            )}
          </div>
        )
      },
      enableSorting: false,
    },
    {
      accessorKey: "isApproved",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => {
        const contact = row.original
        return contact.isApproved ? (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            Approved
          </Badge>
        ) : (
          <Badge variant="outline">
            Pending
          </Badge>
        )
      },
      sortingFn: (rowA, rowB) => {
        const aApproved = rowA.original.isApproved
        const bApproved = rowB.original.isApproved
        return aApproved === bApproved ? 0 : aApproved ? -1 : 1
      },
    },
    {
      accessorKey: "notes",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Notes" />
      ),
      meta: {
        className: "hidden lg:table-cell",
      },
      cell: ({ row }) => {
        const contact = row.original
        if (!contact.notes) {
          return <span className="text-xs text-muted-foreground">No notes</span>
        }
        
        const truncated = contact.notes.length > 30 ? contact.notes.substring(0, 30) + "..." : contact.notes
        return (
          <span 
            className="text-sm text-muted-foreground cursor-help max-w-[120px] block truncate"
            title={contact.notes}
          >
            {truncated}
          </span>
        )
      },
      enableSorting: false,
    },
    {
      id: "actions",
      header: () => <span className="flex justify-end">Actions</span>,
      enableSorting: false,
      cell: ({ row }) => {
        const contact = row.original

        return (
          <div className="flex items-center justify-end gap-1">
            {isEditing && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 hover:bg-accent transition-colors"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    onEdit(contact.index)
                  }}
                  title="Edit"
                >
                  <Edit2 className="h-4 w-4" />
                  <span className="sr-only">Edit</span>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:!text-destructive hover:!bg-destructive/10 transition-colors"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    onDelete(contact.index)
                  }}
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Delete</span>
                </Button>
              </>
            )}
          </div>
        )
      },
    },
  ]
}

export const ContactsTable = React.memo(function ContactsTable({
  contacts,
  isEditing,
  onEdit,
  onDelete,
}: ContactsTableProps) {
  const columns = React.useMemo(
    () => createColumns(isEditing, onEdit, onDelete),
    [isEditing, onEdit, onDelete]
  )

  const handleExport = React.useCallback((data: ContactTableData[]) => {
    const exportData = data.map(contact => ({
      firstName: contact.firstName,
      lastName: contact.lastName,
      fullName: `${contact.firstName} ${contact.lastName}`.trim(),
      type: contactTypeLabels[contact.type],
      email: contact.email || "",
      phone: contact.phone || "",
      spokenLanguage: contact.spokenLanguage || "English",
      contractSignatory: contact.isContractSignatory ? "Yes" : "No",
      notes: contact.notes || "",
      status: contact.isApproved ? "Approved" : "Pending",
    }))
    
    exportToCSV(exportData, `property-contacts-${new Date().toISOString().split('T')[0]}.csv`)
  }, [])

  return (
    <DataTable
      columns={columns}
      data={contacts}
      searchable={true}
      searchPlaceholder="Search contacts..."
      exportable={true}
      onExport={handleExport}
      emptyState={
        <div className="text-center py-12">
          <Users className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-2 text-sm font-medium text-muted-foreground">No contacts added</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Start by adding your first contact for this property.
          </p>
        </div>
      }
    />
  )
})