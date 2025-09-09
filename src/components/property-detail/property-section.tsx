"use client"

import { Edit2, Save, X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface PropertySectionProps {
  title: string
  children: React.ReactNode
  className?: string
  isEditing: boolean
  onEdit: () => void
  onSave: () => void | Promise<void>
  onCancel: () => void
  isSaving?: boolean
}

export function PropertySection({
  title,
  children,
  className,
  isEditing,
  onEdit,
  onSave,
  onCancel,
  isSaving = false,
}: PropertySectionProps) {
  const handleSave = async () => {
    await onSave()
  }

  return (
    <div className={cn("bg-white rounded-lg shadow-sm", className)}>
      <div className="flex items-center justify-between p-6 border-b">
        <h2 className="text-lg font-semibold">{title}</h2>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={onCancel}
                disabled={isSaving}
              >
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-1" />
                )}
                {isSaving ? "Saving..." : "Save"}
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={onEdit}
            >
              <Edit2 className="h-4 w-4 mr-1" />
              Edit
            </Button>
          )}
        </div>
      </div>
      <div className="p-6">{children}</div>
    </div>
  )
}