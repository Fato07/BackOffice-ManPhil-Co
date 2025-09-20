"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { 
  ArrowUpDown, 
  Mail, 
  Phone, 
  Home,
  User,
  Building,
  Users,
  Archive,
  MoreHorizontal,
  ExternalLink 
} from "lucide-react"
import { ContactListItem } from "@/types/contact"
import { CONTACT_CATEGORIES, PROPERTY_RELATIONSHIPS } from "@/types/contact"
import { ContactActions } from "./contact-actions"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useRouter } from "next/navigation"
// Component for property links popover
function PropertyLinksCell({ contact }: { contact: ContactListItem }) {
  const router = useRouter()
  const linkedCount = contact.contactProperties?.length || 0
  
  if (linkedCount === 0) {
    return <span className="text-[10px] text-muted-foreground">0</span>
  }
  
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm"
          className="h-6 px-2 hover:bg-muted text-xs"
        >
          <Home className="h-2.5 w-2.5 mr-1" />
          {linkedCount}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-2">
          <h4 className="font-semibold text-sm">Linked Properties</h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {contact.contactProperties.map((link) => {
              const relationshipConfig = PROPERTY_RELATIONSHIPS[link.relationship]
              return (
                <div 
                  key={link.id} 
                  className="flex items-center justify-between gap-2 p-2 rounded border hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => router.push(`/houses/${link.propertyId}`)}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {link.propertyName}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant="outline" 
                      className={`${relationshipConfig.color} text-[10px] py-0 px-1.5 h-5`}
                    >
                      {relationshipConfig.label}
                    </Badge>
                    <ExternalLink className="h-3 w-3 text-muted-foreground" />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

export const createColumns = (
  onEdit?: (contact: ContactListItem) => void,
  onView?: (contact: ContactListItem) => void,
  onLinkProperty?: (contact: ContactListItem) => void
): ColumnDef<ContactListItem>[] => [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
        className="translate-y-[2px] h-3.5 w-3.5"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
        className="translate-y-[2px] h-3.5 w-3.5"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="hover:bg-transparent p-0 font-semibold text-xs h-auto"
        >
          Name
          <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const contact = row.original
      const category = contact.category as keyof typeof CONTACT_CATEGORIES
      const config = CONTACT_CATEGORIES[category]
      
      const getIcon = () => {
        switch (category) {
          case 'CLIENT':
            return <User className="h-2.5 w-2.5" />
          case 'OWNER':
            return <Home className="h-2.5 w-2.5" />
          case 'PROVIDER':
            return <Users className="h-2.5 w-2.5" />
          case 'ORGANIZATION':
            return <Building className="h-2.5 w-2.5" />
          default:
            return <Archive className="h-2.5 w-2.5" />
        }
      }
      
      return (
        <div className="flex flex-col gap-1 min-w-0">
          <div className="flex items-center gap-1">
            <span className="font-medium truncate text-xs">
              {contact.firstName} {contact.lastName}
            </span>
            <Badge variant="secondary" className={`gap-1 w-fit ${config.color} text-[10px] py-0 px-1.5 h-5`}>
              {getIcon()}
              {config.label}
            </Badge>
          </div>
         
        </div>
      )
    },
    sortingFn: (rowA, rowB) => {
      const nameA = `${rowA.original.firstName} ${rowA.original.lastName}`.toLowerCase()
      const nameB = `${rowB.original.firstName} ${rowB.original.lastName}`.toLowerCase()
      return nameA.localeCompare(nameB)
    },
    size: 160,
  },
  {
    accessorKey: "phone",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="hover:bg-transparent p-0 font-semibold text-xs h-auto"
        >
          Phone
          <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      )
    },
    meta: {
      className: "hidden md:table-cell",
    },
    cell: ({ row }) => {
      const phone = row.getValue("phone") as string | null
      return phone ? (
        <a 
          href={`tel:${phone}`}
          className="hover:underline text-xs text-muted-foreground flex items-center gap-1 max-w-[100px] truncate"
          title={phone}
        >
          <Phone className="h-2.5 w-2.5 flex-shrink-0" />
          {phone}
        </a>
      ) : (
        <span className="text-[10px] text-muted-foreground">No phone</span>
      )
    },
    size: 90,
  },
  {
    accessorKey: "email",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="hover:bg-transparent p-0 font-semibold text-xs h-auto"
        >
          Email
          <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      )
    },
    meta: {
      className: "hidden sm:table-cell",
    },
    cell: ({ row }) => {
      const email = row.getValue("email") as string | null
      return email ? (
        <a 
          href={`mailto:${email}`}
          className="hover:underline text-xs text-muted-foreground flex items-center gap-1 max-w-[120px] truncate"
          title={email}
        >
          <Mail className="h-2.5 w-2.5 flex-shrink-0" />
          {email.split('@')[0]}@{email.split('@')[1]}
        </a>
      ) : (
        <span className="text-[10px] text-muted-foreground">No email</span>
      )
    },
    size: 110,
  },
  {
    accessorKey: "comments",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="hover:bg-transparent p-0 font-semibold text-xs h-auto"
        >
          Notes
          <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      )
    },
    meta: {
      className: "hidden lg:table-cell",
    },
    cell: ({ row }) => {
      const comments = row.getValue("comments") as string | null
      if (!comments) {
        return <span className="text-[10px] text-muted-foreground">No comments</span>
      }
      
      const truncated = comments.length > 25 ? comments.substring(0, 25) + "..." : comments
      return (
        <span 
          className="text-xs text-muted-foreground cursor-help max-w-[80px] block truncate"
          title={comments}
        >
          {truncated}
        </span>
      )
    },
    size: 80,
  },
  {
    id: "contactProperties",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="hover:bg-transparent p-0 font-semibold text-xs h-auto"
        >
          Houses
          <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      )
    },
    cell: ({ row }) => <PropertyLinksCell contact={row.original} />,
    size: 70,
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => (
      <ContactActions 
        contact={row.original} 
        onEdit={onEdit}
        onView={onView}
        onLinkProperty={onLinkProperty}
      />
    ),
    enableSorting: false,
    enableHiding: false,
    size: 40,
  },
]