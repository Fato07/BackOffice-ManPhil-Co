"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { AuditLogTable } from "@/components/audit-logs/audit-log-table"
import { AuditLogFiltersComponent } from "@/components/audit-logs/audit-log-filters"
import { useAuditLogs, AuditLogFilters } from "@/hooks/use-audit-logs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity } from "lucide-react"
import { useSearchParams } from "next/navigation"

export default function AuditLogsPage() {
  const searchParams = useSearchParams()
  
  // Parse initial filters from URL
  const initialFilters: AuditLogFilters = {
    entityType: searchParams.get("entityType") || undefined,
    entityId: searchParams.get("entityId") || undefined,
    action: searchParams.get("action") || undefined,
    userId: searchParams.get("userId") || undefined,
  }
  
  const [filters, setFilters] = useState<AuditLogFilters>(initialFilters)
  const [page, setPage] = useState(1)
  
  const { data, isLoading } = useAuditLogs(filters, page)

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Activity className="h-6 w-6" />
            Audit Trail
          </h1>
          <p className="text-muted-foreground mt-1">
            View all changes and activities across your properties
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
            <CardDescription>
              Filter audit logs by entity type, action, date range, and more
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AuditLogFiltersComponent
              filters={filters}
              onFiltersChange={setFilters}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Activity Log</CardTitle>
            <CardDescription>
              {data?.total || 0} total activities found
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <AuditLogTable
              logs={data?.data || []}
              isLoading={isLoading}
              page={page}
              totalPages={data?.totalPages || 1}
              onPageChange={setPage}
            />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}