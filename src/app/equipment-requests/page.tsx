import { Suspense } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { EquipmentRequestsContent } from "@/components/equipment-requests/equipment-requests-content"
import { Skeleton } from "@/components/ui/skeleton"
import { Card } from "@/components/ui/card"

function EquipmentRequestsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-32" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-32" />
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-full max-w-md" />
        </div>
        
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-9 w-32" />
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <Skeleton className="h-4 w-24" />
        <Card>
          <div className="p-4 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-12 w-12" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-[250px]" />
                  <Skeleton className="h-4 w-[200px]" />
                </div>
                <Skeleton className="h-8 w-[100px]" />
                <Skeleton className="h-8 w-8" />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}

export default function EquipmentRequestsPage() {
  return (
    <DashboardLayout>
      <Suspense fallback={<EquipmentRequestsLoading />}>
        <EquipmentRequestsContent />
      </Suspense>
    </DashboardLayout>
  )
}