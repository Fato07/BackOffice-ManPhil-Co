import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

export function StatsSkeleton() {
  return (
    <div className={cn(
      "bg-black/40 backdrop-blur-md",
      "border border-white/10 rounded-lg",
      "p-3 flex items-center gap-4"
    )}>
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-2">
          <Skeleton className="h-8 w-8 rounded bg-white/10" />
          <div className="space-y-1">
            <Skeleton className="h-3 w-16 bg-white/10" />
            <Skeleton className="h-4 w-12 bg-white/10" />
          </div>
        </div>
      ))}
    </div>
  )
}