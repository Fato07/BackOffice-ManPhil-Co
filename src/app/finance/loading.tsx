import { Skeleton } from "@/components/ui/skeleton"

export function FinanceLoading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Skeleton className="h-8 w-48" />
    </div>
  )
}

export default FinanceLoading