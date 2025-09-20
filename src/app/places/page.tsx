import { Suspense } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { PlacesContent } from "@/components/places/places-content"
import { PlacesLoading } from "./loading"

export default function PlacesPage() {
  return (
    <DashboardLayout>
      <Suspense fallback={<PlacesLoading />}>
        <PlacesContent />
      </Suspense>
    </DashboardLayout>
  )
}