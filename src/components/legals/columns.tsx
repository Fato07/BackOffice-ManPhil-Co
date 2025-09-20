"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { DocumentActions } from "./document-actions"
import { cn } from "@/lib/utils"
import { 
  LegalDocumentWithRelations,
  LEGAL_DOCUMENT_CATEGORY_LABELS,
  LEGAL_DOCUMENT_STATUS_LABELS,
  LEGAL_DOCUMENT_STATUS_COLORS,
  formatFileSize
} from "@/types/legal-document"
import { 
  FileText, 
  FileImage, 
  FileType,
  FileIcon,
  Building2,
  Calendar,
  ArrowUpDown
} from "lucide-react"
import { format, formatDistanceToNow, differenceInDays } from "date-fns"

// Helper to get file icon based on mime type
const getFileIcon = (mimeType: string) => {
  if (mimeType.includes('pdf')) return FileType
  if (mimeType.includes('image')) return FileImage
  if (mimeType.includes('word') || mimeType.includes('document')) return FileText
  return FileIcon
}

export const columns: ColumnDef<LegalDocumentWithRelations>[] = [
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
        onClick={(e) => e.stopPropagation()}
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
          Document
          <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const document = row.original
      const Icon = getFileIcon(document.mimeType)
      
      return (
        <div className="flex items-center gap-2 min-w-[200px]">
          <div className="h-6 w-6 rounded bg-muted flex items-center justify-center">
            <Icon className="h-3 w-3 text-muted-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="font-medium text-xs">{document.name}</span>
            {document.description && (
              <span className="text-[10px] text-muted-foreground line-clamp-1">
                {document.description}
              </span>
            )}
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "category",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="hover:bg-transparent p-0 font-semibold text-xs h-auto"
        >
          Category
          <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const category = row.getValue("category") as string
      return (
        <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-5">
          {LEGAL_DOCUMENT_CATEGORY_LABELS[category as keyof typeof LEGAL_DOCUMENT_CATEGORY_LABELS] || category}
        </Badge>
      )
    },
    filterFn: (row, id, value) => {
      return value === 'ALL' || row.getValue(id) === value
    },
  },
  {
    accessorKey: "property",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="hover:bg-transparent p-0 font-semibold text-xs h-auto"
        >
          Property
          <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const property = row.original.property
      
      if (!property) {
        return (
          <span className="text-xs text-muted-foreground">Global</span>
        )
      }
      
      return (
        <div className="flex items-center gap-1">
          <Building2 className="h-3 w-3 text-muted-foreground" />
          <span className="text-xs truncate max-w-[150px]">{property.name}</span>
        </div>
      )
    },
  },
  {
    accessorKey: "status",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="hover:bg-transparent p-0 font-semibold text-xs h-auto"
        >
          Status
          <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const status = row.getValue("status") as string
      const document = row.original
      const color = LEGAL_DOCUMENT_STATUS_COLORS[status as keyof typeof LEGAL_DOCUMENT_STATUS_COLORS] || 'gray'
      
      // Calculate days until expiry if applicable
      let daysUntilExpiry = null
      if (document.expiryDate) {
        daysUntilExpiry = differenceInDays(new Date(document.expiryDate), new Date())
      }
      
      return (
        <div className="flex items-center gap-2">
          <Badge 
            variant="secondary"
            className={cn(
              "text-[10px] py-0 px-1.5 h-5",
              color === 'green' && "bg-emerald-50 text-emerald-700 border-emerald-200",
              color === 'red' && "bg-rose-50 text-rose-700 border-rose-200",
              color === 'yellow' && "bg-amber-50 text-amber-700 border-amber-200",
              color === 'gray' && "bg-gray-50 text-gray-700 border-gray-200"
            )}
          >
            {LEGAL_DOCUMENT_STATUS_LABELS[status as keyof typeof LEGAL_DOCUMENT_STATUS_LABELS] || status}
          </Badge>
          {daysUntilExpiry !== null && daysUntilExpiry >= 0 && daysUntilExpiry <= 30 && (
            <span className="text-[10px] text-muted-foreground">
              ({daysUntilExpiry}d)
            </span>
          )}
        </div>
      )
    },
    filterFn: (row, id, value) => {
      return value === 'ALL' || row.getValue(id) === value
    },
  },
  {
    accessorKey: "expiryDate",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="hover:bg-transparent p-0 font-semibold text-xs h-auto"
        >
          Expiry
          <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const expiryDate = row.getValue("expiryDate") as Date | null
      
      if (!expiryDate) {
        return <span className="text-xs text-muted-foreground">No expiry</span>
      }
      
      const date = new Date(expiryDate)
      const daysUntilExpiry = differenceInDays(date, new Date())
      
      return (
        <div className="flex items-center gap-1">
          <Calendar className="h-3 w-3 text-muted-foreground" />
          <span className={`text-xs ${daysUntilExpiry < 30 ? "text-orange-600" : ""}`}>
            {format(date, "MMM d, yyyy")}
          </span>
        </div>
      )
    },
  },
  {
    accessorKey: "uploadedAt",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="hover:bg-transparent p-0 font-semibold text-xs h-auto"
        >
          Uploaded
          <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const uploadedAt = row.getValue("uploadedAt") as Date
      const versions = row.original.versions || []
      
      return (
        <div className="space-y-0.5">
          <span className="text-xs">
            {formatDistanceToNow(new Date(uploadedAt), { addSuffix: true })}
          </span>
          {versions.length > 1 && (
            <span className="text-[10px] text-muted-foreground">
              v{versions[0]?.versionNumber || 1} ({versions.length} versions)
            </span>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: "fileSize",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="hover:bg-transparent p-0 font-semibold text-xs h-auto"
        >
          Size
          <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const size = row.getValue("fileSize") as number
      return (
        <span className="text-xs text-muted-foreground">
          {formatFileSize(size)}
        </span>
      )
    },
  },
  {
    accessorKey: "tags",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="hover:bg-transparent p-0 font-semibold text-xs h-auto"
        >
          Tags
          <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const tags = row.getValue("tags") as string[]
      
      if (!tags || tags.length === 0) {
        return null
      }
      
      return (
        <div className="flex gap-1 flex-wrap max-w-[150px]">
          {tags.slice(0, 2).map((tag) => (
            <Badge key={tag} variant="secondary" className="text-[10px] py-0 px-1.5 h-5">
              {tag}
            </Badge>
          ))}
          {tags.length > 2 && (
            <Badge variant="secondary" className="text-[10px] py-0 px-1.5 h-5">
              +{tags.length - 2}
            </Badge>
          )}
        </div>
      )
    },
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      return (
        <div onClick={(e) => e.stopPropagation()}>
          <DocumentActions document={row.original} />
        </div>
      )
    },
  },
]