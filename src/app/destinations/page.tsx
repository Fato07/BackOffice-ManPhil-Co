import { Suspense } from "react"
import { DestinationsContent } from "@/components/destinations/destinations-content"
import { Skeleton } from "@/components/ui/skeleton"

function DestinationsLoading() {
  return (
    <div className="h-[calc(100vh-4rem)] relative">
      <Skeleton className="absolute inset-0" />
      <div className="absolute top-4 left-4 z-10 space-y-2">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-10 w-48" />
      </div>
      <div className="absolute top-4 right-4 z-10">
        <Skeleton className="h-24 w-64" />
      </div>
    </div>
  )
}

export default function DestinationsPage() {
  return (
    <Suspense fallback={<DestinationsLoading />}>
      <DestinationsContent />
    </Suspense>
  )
}