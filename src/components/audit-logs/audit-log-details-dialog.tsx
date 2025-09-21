"use client"

import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription 
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { useAuditLog } from "@/hooks/use-audit-logs"
import { useUser } from "@/hooks/use-user"
import { format } from "date-fns"
import { AuditLogDiff } from "./audit-log-diff"
import { User2, Calendar, Tag, FileText, Hash } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface AuditLogDetailsDialogProps {
  logId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AuditLogDetailsDialog({ 
  logId, 
  open, 
  onOpenChange 
}: AuditLogDetailsDialogProps) {
  const { data: log, isLoading } = useAuditLog(logId)
  const { data: user } = useUser(log?.userId)

  const getEntityLink = () => {
    if (!log?.entityDetails) return null

    switch (log.entityType) {
      case "property":
        return `/houses/${log.entityId}`
      case "room":
        return `/houses/${log.entityDetails.property?.id}?tab=rooms`
      case "photo":
        return `/houses/${log.entityDetails.property?.id}?tab=photos`
      case "resource":
        return `/houses/${log.entityDetails.property?.id}/links`
      case "EquipmentRequest":
        return `/equipment-requests`
      case "Contact":
        return `/contacts`
      default:
        return null
    }
  }
  
  // Extract base action type from complex action names (same logic as ActionBadge)
  const getBaseAction = (action: string): string => {
    const actionLower = action.toLowerCase()
    
    if (actionLower.includes('create')) return 'create'
    if (actionLower.includes('delete')) return 'delete'
    
    if (actionLower.includes('update') && actionLower.includes('status')) {
      if (actionLower.includes('approved')) return 'approve'
      if (actionLower.includes('rejected')) return 'reject'
      if (actionLower.includes('delivered')) return 'deliver'
      if (actionLower.includes('completed')) return 'complete'
    }
    
    if (actionLower.includes('update')) return 'update'
    
    return 'default'
  }

  const entityLink = getEntityLink()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Audit Log Details</DialogTitle>
          <DialogDescription>
            View detailed information about this change
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4 py-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-60 w-full" />
          </div>
        ) : log ? (
          <div className="space-y-6 py-4">
            {/* Summary Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground">Summary</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <User2 className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium">User</p>
                    <div className="flex items-center gap-2">
                      {user?.imageUrl && (
                        <img
                          src={user.imageUrl}
                          alt={user.fullName}
                          className="w-6 h-6 rounded-full"
                        />
                      )}
                      <span className="text-sm text-muted-foreground">
                        {user?.fullName || log.userId}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Timestamp</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(log.createdAt), "PPpp")}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Tag className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Action</p>
                    <Badge 
                      variant={
                        getBaseAction(log.action) === "create" ? "default" :
                        getBaseAction(log.action) === "update" ? "secondary" :
                        getBaseAction(log.action) === "delete" ? "destructive" : "outline"
                      }
                    >
                      {log.action.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase())}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <FileText className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Entity Type</p>
                    <p className="text-sm text-muted-foreground capitalize">
                      {log.entityType}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Entity Details Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-muted-foreground">Entity Details</h3>
                {entityLink && log.entityDetails && (
                  <Button asChild size="sm" variant="outline">
                    <Link href={entityLink}>
                      View {log.entityType}
                    </Link>
                  </Button>
                )}
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Hash className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">ID:</span>
                  <span className="text-sm text-muted-foreground font-mono">
                    {log.entityId}
                  </span>
                </div>

                {log.entityDetails ? (
                  <div className="mt-2 p-4 bg-muted/50 rounded-lg">
                    {log.entityType === "property" && (
                      <div className="space-y-2">
                        <p className="text-sm">
                          <span className="font-medium">Name:</span>{" "}
                          {log.entityDetails.name}
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">Status:</span>{" "}
                          <Badge variant="outline">
                            {log.entityDetails.status}
                          </Badge>
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">Destination:</span>{" "}
                          {log.entityDetails.destination?.name}
                        </p>
                      </div>
                    )}

                    {log.entityType === "room" && (
                      <div className="space-y-2">
                        <p className="text-sm">
                          <span className="font-medium">Name:</span>{" "}
                          {log.entityDetails.name}
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">Type:</span>{" "}
                          {log.entityDetails.type}
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">Property:</span>{" "}
                          {log.entityDetails.property?.name}
                        </p>
                      </div>
                    )}

                    {log.entityType === "photo" && (
                      <div className="space-y-2">
                        <p className="text-sm">
                          <span className="font-medium">Caption:</span>{" "}
                          {log.entityDetails.caption || "No caption"}
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">Property:</span>{" "}
                          {log.entityDetails.property?.name}
                        </p>
                        {log.entityDetails.url && (
                          <img
                            src={log.entityDetails.url}
                            alt={log.entityDetails.caption || "Photo"}
                            className="mt-2 h-32 w-auto rounded-lg object-cover"
                          />
                        )}
                      </div>
                    )}

                    {log.entityType === "resource" && (
                      <div className="space-y-2">
                        <p className="text-sm">
                          <span className="font-medium">Name:</span>{" "}
                          {log.entityDetails.name}
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">Type:</span>{" "}
                          <Badge variant="outline">
                            {log.entityDetails.type}
                          </Badge>
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">Property:</span>{" "}
                          {log.entityDetails.property?.name}
                        </p>
                      </div>
                    )}

                    {log.entityType === "EquipmentRequest" && (
                      <div className="space-y-2">
                        <p className="text-sm">
                          <span className="font-medium">Property:</span>{" "}
                          {log.entityDetails.property?.name}
                        </p>
                        {log.entityDetails.room && (
                          <p className="text-sm">
                            <span className="font-medium">Room:</span>{" "}
                            {log.entityDetails.room.name}
                          </p>
                        )}
                        <p className="text-sm">
                          <span className="font-medium">Priority:</span>{" "}
                          <Badge variant={
                            log.entityDetails.priority === "URGENT" ? "destructive" : 
                            log.entityDetails.priority === "HIGH" ? "secondary" : 
                            "outline"
                          }>
                            {log.entityDetails.priority}
                          </Badge>
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">Status:</span>{" "}
                          <Badge variant="outline">
                            {log.entityDetails.status}
                          </Badge>
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">Reason:</span>{" "}
                          {log.entityDetails.reason}
                        </p>
                        {log.entityDetails.items && (
                          <div className="mt-2">
                            <p className="text-sm font-medium mb-1">Items:</p>
                            <ul className="text-sm text-muted-foreground list-disc list-inside">
                              {(log.entityDetails.items as any[]).map((item: any, idx: number) => (
                                <li key={idx}>
                                  {item.name} - {item.quantity} {item.unit || 'unit(s)'}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}

                    {log.entityType === "Contact" && (
                      <div className="space-y-2">
                        <p className="text-sm">
                          <span className="font-medium">Name:</span>{" "}
                          {log.entityDetails.name}
                        </p>
                        {log.entityDetails.email && (
                          <p className="text-sm">
                            <span className="font-medium">Email:</span>{" "}
                            <a 
                              href={`mailto:${log.entityDetails.email}`}
                              className="text-primary hover:underline"
                            >
                              {log.entityDetails.email}
                            </a>
                          </p>
                        )}
                        {log.entityDetails.phone && (
                          <p className="text-sm">
                            <span className="font-medium">Phone:</span>{" "}
                            <a 
                              href={`tel:${log.entityDetails.phone}`}
                              className="text-primary hover:underline"
                            >
                              {log.entityDetails.phone}
                            </a>
                          </p>
                        )}
                        <p className="text-sm">
                          <span className="font-medium">Type:</span>{" "}
                          <Badge variant="outline">
                            {log.entityDetails.type}
                          </Badge>
                        </p>
                        {log.entityDetails.company && (
                          <p className="text-sm">
                            <span className="font-medium">Company:</span>{" "}
                            {log.entityDetails.company}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    Entity has been deleted
                  </p>
                )}
              </div>
            </div>

            <Separator />

            {/* Changes Section */}
            {getBaseAction(log.action) === "update" && log.changes && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground">Changes</h3>
                <AuditLogDiff changes={log.changes} />
              </div>
            )}

            {getBaseAction(log.action) === "create" && log.changes && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground">Created Data</h3>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <pre className="text-xs overflow-x-auto">
                    {JSON.stringify(log.changes, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}