import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Skeleton } from "@/components/ui/skeleton"
import { Card } from "@/components/ui/card"

export default function EditEquipmentRequestLoading() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-9 w-24" /> {/* Back button */}
          <Skeleton className="h-8 w-64" /> {/* Title */}
        </div>

        <Card className="p-6 space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-10 w-48" />
          </div>

          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-20 w-full" />
          </div>

          <div className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-20 w-full" />
          </div>

          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-20 w-full" />
          </div>

          <div className="space-y-4">
            <Skeleton className="h-5 w-32" />
            <div className="border rounded-lg p-4 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-8 w-48" />
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-8 flex-1" />
                  <Skeleton className="h-8 w-24" />
                  <Skeleton className="h-8 w-32" />
                </div>
              ))}
            </div>
            <Skeleton className="h-9 w-32" /> {/* Add item button */}
          </div>
        </Card>

        <div className="flex justify-end gap-2">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
    </DashboardLayout>
  )
}