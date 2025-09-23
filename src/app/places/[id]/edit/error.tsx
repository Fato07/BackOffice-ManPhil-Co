"use client"

import { useEffect } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { AlertCircle } from "lucide-react"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Edit provider error:", error)
  }, [error])

  return (
    <DashboardLayout>
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="flex items-center gap-2 text-destructive">
          <AlertCircle className="h-5 w-5" />
          <h2 className="text-lg font-semibold">Something went wrong!</h2>
        </div>
        <p className="text-sm text-muted-foreground max-w-md text-center">
          We encountered an error while loading the provider details. Please try again.
        </p>
        <div className="flex gap-4">
          <Button
            onClick={reset}
            variant="default"
          >
            Try again
          </Button>
          <Button
            onClick={() => window.location.href = "/places"}
            variant="outline"
          >
            Back to providers
          </Button>
        </div>
      </div>
    </DashboardLayout>
  )
}