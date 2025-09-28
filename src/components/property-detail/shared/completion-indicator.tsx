"use client"

import { cn } from "@/lib/utils"
import { CheckCircle2, Circle, AlertCircle } from "lucide-react"

interface CompletionIndicatorProps {
  completed: boolean
  size?: "sm" | "md" | "lg"
  showLabel?: boolean
  className?: string
}

const sizeClasses = {
  sm: "h-4 w-4",
  md: "h-5 w-5", 
  lg: "h-6 w-6"
}

const labelSizes = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-base"
}

export function CompletionIndicator({
  completed,
  size = "md",
  showLabel = false,
  className = ""
}: CompletionIndicatorProps) {
  const sizeClass = sizeClasses[size]
  const labelSize = labelSizes[size]

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {completed ? (
        <CheckCircle2 className={cn(sizeClass, "text-green-600")} />
      ) : (
        <Circle className={cn(sizeClass, "text-gray-400")} />
      )}
      {showLabel && (
        <span className={cn(
          labelSize,
          completed ? "text-green-600" : "text-gray-500"
        )}>
          {completed ? "Complete" : "Incomplete"}
        </span>
      )}
    </div>
  )
}

interface CompletionBadgeProps {
  completedCount: number
  totalCount: number
  className?: string
}

export function CompletionBadge({ 
  completedCount, 
  totalCount,
  className = ""
}: CompletionBadgeProps) {
  const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0
  const isComplete = completedCount === totalCount
  const isPartial = completedCount > 0 && completedCount < totalCount

  return (
    <div className={cn(
      "flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium",
      isComplete && "bg-green-100 text-green-700",
      isPartial && "bg-amber-100 text-amber-700",
      !isComplete && !isPartial && "bg-gray-100 text-gray-600",
      className
    )}>
      {isComplete ? (
        <CheckCircle2 className="h-3 w-3" />
      ) : isPartial ? (
        <AlertCircle className="h-3 w-3" />
      ) : (
        <Circle className="h-3 w-3" />
      )}
      <span>{completedCount}/{totalCount}</span>
      <span className="text-xs opacity-75">({percentage}%)</span>
    </div>
  )
}