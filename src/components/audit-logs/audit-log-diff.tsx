"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface AuditLogDiffProps {
  changes: any
}

function formatValue(value: any): string {
  if (value === null) return "null"
  if (value === undefined) return "undefined"
  if (typeof value === "boolean") return value.toString()
  if (typeof value === "number") return value.toString()
  if (typeof value === "string") return value
  if (Array.isArray(value)) return `[${value.length} items]`
  if (typeof value === "object") return "{object}"
  return String(value)
}

function isComplexValue(value: any): boolean {
  return typeof value === "object" && value !== null
}

function DiffItem({ field, value }: { field: string; value: any }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const isComplex = isComplexValue(value)

  return (
    <div className="space-y-2">
      <div 
        className={cn(
          "flex items-start gap-2",
          isComplex && "cursor-pointer"
        )}
        onClick={() => isComplex && setIsExpanded(!isExpanded)}
      >
        {isComplex && (
          <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
            {isExpanded ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
          </Button>
        )}
        <span className="text-sm font-medium min-w-[120px]">{field}:</span>
        {!isComplex && (
          <span className="text-sm text-muted-foreground">
            {formatValue(value)}
          </span>
        )}
        {isComplex && !isExpanded && (
          <span className="text-sm text-muted-foreground">
            {formatValue(value)}
          </span>
        )}
      </div>
      
      {isComplex && isExpanded && (
        <div className="ml-8 p-3 bg-muted/50 rounded-lg">
          <pre className="text-xs overflow-x-auto">
            {JSON.stringify(value, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}

export function AuditLogDiff({ changes }: AuditLogDiffProps) {
  // If changes is an array (for properties API), extract the data object
  const changeData = Array.isArray(changes) && changes[0]?.data 
    ? changes[0].data 
    : changes

  // Group changes by field
  const fields = Object.keys(changeData || {}).sort()

  if (fields.length === 0) {
    return (
      <p className="text-sm text-muted-foreground italic">
        No changes recorded
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {fields.map((field) => {
        const value = changeData[field]
        
        // Skip undefined values
        if (value === undefined) return null

        return (
          <div key={field} className="border-l-2 border-blue-500 pl-4 py-2">
            <DiffItem field={field} value={value} />
          </div>
        )
      })}
    </div>
  )
}