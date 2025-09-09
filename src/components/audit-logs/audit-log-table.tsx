"use client"

import { useState } from "react"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { formatDistanceToNow } from "date-fns"
import { ChevronLeft, ChevronRight, Eye } from "lucide-react"
import { AuditLog } from "@/hooks/use-audit-logs"
import { useUser } from "@/hooks/use-user"
import { AuditLogDetailsDialog } from "./audit-log-details-dialog"

interface AuditLogTableProps {
  logs: AuditLog[]
  isLoading: boolean
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}

function UserCell({ userId }: { userId: string }) {
  const { data: user, isLoading } = useUser(userId)

  if (isLoading) {
    return <Skeleton className="h-4 w-24" />
  }

  return (
    <div className="flex items-center gap-2">
      {user?.imageUrl && (
        <img
          src={user.imageUrl}
          alt={user.fullName}
          className="w-6 h-6 rounded-full"
        />
      )}
      <span>{user?.fullName || userId}</span>
    </div>
  )
}

function ActionBadge({ action }: { action: string }) {
  const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    create: "default",
    update: "secondary",
    delete: "destructive",
  }

  const colors: Record<string, string> = {
    create: "bg-green-100 text-green-800 hover:bg-green-100",
    update: "bg-blue-100 text-blue-800 hover:bg-blue-100",
    delete: "bg-red-100 text-red-800 hover:bg-red-100",
  }

  return (
    <Badge 
      variant={variants[action] || "outline"}
      className={colors[action] || ""}
    >
      {action}
    </Badge>
  )
}

export function AuditLogTable({ 
  logs, 
  isLoading, 
  page, 
  totalPages, 
  onPageChange 
}: AuditLogTableProps) {
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Time</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Entity Type</TableHead>
              <TableHead>Entity</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                </TableRow>
              ))
            ) : logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No audit logs found
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                  </TableCell>
                  <TableCell>
                    <UserCell userId={log.userId} />
                  </TableCell>
                  <TableCell>
                    <ActionBadge action={log.action} />
                  </TableCell>
                  <TableCell className="capitalize">
                    {log.entityType}
                  </TableCell>
                  <TableCell className="font-medium">
                    {log.entityName}
                  </TableCell>
                  <TableCell>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setSelectedLog(log)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2 py-4">
          <div className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Details Dialog */}
      {selectedLog && (
        <AuditLogDetailsDialog
          logId={selectedLog.id}
          open={!!selectedLog}
          onOpenChange={(open) => !open && setSelectedLog(null)}
        />
      )}
    </>
  )
}