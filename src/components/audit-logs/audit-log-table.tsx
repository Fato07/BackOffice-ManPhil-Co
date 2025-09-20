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
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Eye, ArrowUpDown } from "lucide-react"
import { AuditLog } from "@/hooks/use-audit-logs"
import { useUser } from "@/hooks/use-user"
import { AuditLogDetailsDialog } from "./audit-log-details-dialog"
import { motion } from "framer-motion"

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
    return <Skeleton className="h-3 w-24" />
  }

  return (
    <div className="flex items-center gap-2">
      {user?.imageUrl && (
        <img
          src={user.imageUrl}
          alt={user.fullName}
          className="w-5 h-5 rounded-full"
        />
      )}
      <span className="text-xs">{user?.fullName || userId}</span>
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
    create: "bg-green-100 text-green-800 hover:bg-green-100 border-green-300",
    update: "bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-300",
    delete: "bg-red-100 text-red-800 hover:bg-red-100 border-red-300",
  }

  return (
    <Badge 
      variant="outline"
      className={`${colors[action] || ""} font-medium text-[10px] py-0 px-1.5 h-5`}
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
              <TableHead>
                <Button variant="ghost" className="hover:bg-transparent p-0 font-semibold text-xs h-auto">
                  Time
                  <ArrowUpDown className="ml-1 h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" className="hover:bg-transparent p-0 font-semibold text-xs h-auto">
                  User
                  <ArrowUpDown className="ml-1 h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" className="hover:bg-transparent p-0 font-semibold text-xs h-auto">
                  Action
                  <ArrowUpDown className="ml-1 h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" className="hover:bg-transparent p-0 font-semibold text-xs h-auto">
                  Entity Type
                  <ArrowUpDown className="ml-1 h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" className="hover:bg-transparent p-0 font-semibold text-xs h-auto">
                  Entity
                  <ArrowUpDown className="ml-1 h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead className="w-[100px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-3 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-3 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-3 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-3 w-40" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-6" /></TableCell>
                </TableRow>
              ))
            ) : logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log, index) => (
                <motion.tr
                  key={log.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.02 }}
                  whileHover={{ backgroundColor: "rgba(0, 0, 0, 0.02)", x: 2 }}
                  className="border-b transition-colors hover:bg-gray-50/50"
                >
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                  </TableCell>
                  <TableCell>
                    <UserCell userId={log.userId} />
                  </TableCell>
                  <TableCell>
                    <ActionBadge action={log.action} />
                  </TableCell>
                  <TableCell className="capitalize text-xs text-muted-foreground">
                    {log.entityType}
                  </TableCell>
                  <TableCell className="font-medium text-xs">
                    {log.entityName}
                  </TableCell>
                  <TableCell>
                    <Button
                      className="h-6 w-6"
                      variant="ghost"
                      onClick={() => setSelectedLog(log)}
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
                  </TableCell>
                </motion.tr>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <div className="flex-1 text-xs text-muted-foreground">
            {logs.length} of {totalPages * 10} audit logs
          </div>
          <div className="flex items-center space-x-6 lg:space-x-8">
            <div className="flex w-[100px] items-center justify-center text-xs font-medium">
              Page {page} of {totalPages}
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                className="h-7 w-7 p-0"
                onClick={() => onPageChange(1)}
                disabled={page <= 1}
              >
                <span className="sr-only">Go to first page</span>
                <ChevronsLeft className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="outline"
                className="h-7 w-7 p-0"
                onClick={() => onPageChange(page - 1)}
                disabled={page <= 1}
              >
                <span className="sr-only">Go to previous page</span>
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="outline"
                className="h-7 w-7 p-0"
                onClick={() => onPageChange(page + 1)}
                disabled={page >= totalPages}
              >
                <span className="sr-only">Go to next page</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="outline"
                className="h-7 w-7 p-0"
                onClick={() => onPageChange(totalPages)}
                disabled={page >= totalPages}
              >
                <span className="sr-only">Go to last page</span>
                <ChevronsRight className="h-3.5 w-3.5" />
              </Button>
            </div>
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