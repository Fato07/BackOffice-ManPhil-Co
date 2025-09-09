import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"

export interface AuditLogFilters {
  userId?: string
  entityType?: string
  entityId?: string
  action?: string
  startDate?: string
  endDate?: string
  search?: string
}

export interface AuditLog {
  id: string
  userId: string
  action: string
  entityType: string
  entityId: string
  entityName?: string
  changes: any
  createdAt: string
}

export interface AuditLogResponse {
  data: AuditLog[]
  total: number
  page: number
  totalPages: number
}

export interface AuditLogDetails extends AuditLog {
  entityDetails: any
}

export function useAuditLogs(filters: AuditLogFilters = {}, page: number = 1) {
  const params = new URLSearchParams()
  
  params.append("page", page.toString())
  params.append("limit", "20")
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      params.append(key, value)
    }
  })

  return useQuery<AuditLogResponse>({
    queryKey: ["audit-logs", filters, page],
    queryFn: () => api.get(`/api/audit-logs?${params.toString()}`),
  })
}

export function useAuditLog(id: string) {
  return useQuery<AuditLogDetails>({
    queryKey: ["audit-log", id],
    queryFn: () => api.get(`/api/audit-logs/${id}`),
    enabled: !!id,
  })
}