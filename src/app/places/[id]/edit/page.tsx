import { Suspense } from "react"
import { notFound } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { EditProviderForm } from "@/components/places/edit-provider-form"
import { Skeleton } from "@/components/ui/skeleton"
import { getActivityProvider } from "@/actions/activity-providers"

interface EditProviderPageProps {
  params: Promise<{
    id: string
  }>
}

async function EditProviderContent({ id }: { id: string }) {
  const result = await getActivityProvider(id)
  
  if (!result.success || !result.data) {
    notFound()
  }
  
  return <EditProviderForm provider={result.data} />
}

function EditProviderLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>
      
      <div className="rounded-lg border p-6 space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
        
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-20 w-full" />
        </div>
        
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
        
        <div className="flex gap-4">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>
    </div>
  )
}

export default async function EditProviderPage({ params }: EditProviderPageProps) {
  const { id } = await params
  
  return (
    <DashboardLayout>
      <Suspense fallback={<EditProviderLoading />}>
        <EditProviderContent id={id} />
      </Suspense>
    </DashboardLayout>
  )
}