import { Suspense } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { LegalsContent } from "@/components/legals/legals-content"
import { Skeleton } from "@/components/ui/skeleton"
import { Card } from "@/components/ui/card"

function LegalsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-24" />
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-full max-w-md" />
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-10 w-40" />
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-32" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
          </div>
        </div>
        <Card>
          <div className="p-4 space-y-4">
            {/* Table header */}
            <div className="flex items-center border-b pb-4">
              <Skeleton className="h-4 w-4 mr-4" />
              <div className="flex flex-1 gap-4">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24 ml-auto" />
              </div>
            </div>
            {/* Table rows */}
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center py-2">
                <Skeleton className="h-4 w-4 mr-4" />
                <div className="flex flex-1 items-center gap-4">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded" />
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </div>
                  <Skeleton className="h-6 w-20 rounded-full" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-6 w-16 rounded-full" />
                  <Skeleton className="h-4 w-24" />
                  <div className="flex gap-2 ml-auto">
                    <Skeleton className="h-8 w-8" />
                    <Skeleton className="h-8 w-8" />
                    <Skeleton className="h-8 w-8" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}

export default function LegalsPage() {
  return (
    <DashboardLayout>
      <Suspense fallback={<LegalsLoading />}>
        <LegalsContent />
      </Suspense>
    </DashboardLayout>
  )
}