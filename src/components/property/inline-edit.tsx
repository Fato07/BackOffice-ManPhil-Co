"use client"

import { useState, useEffect, useRef } from "react"
import { cn } from "@/lib/utils"
import { Edit2 } from "lucide-react"

interface InlineEditProps<T = string> {
  value: T
  onSave: (value: T) => void | Promise<void>
  renderView: (value: T) => React.ReactNode
  renderEdit: (props: {
    value: T
    onChange: (value: T) => void
    onSave: () => void
    onCancel: () => void
  }) => React.ReactNode
  className?: string
  editOnClick?: boolean
  showEditIcon?: boolean
}

export function InlineEdit<T = string>({
  value,
  onSave,
  renderView,
  renderEdit,
  className,
  editOnClick = true,
  showEditIcon = true,
}: InlineEditProps<T>) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState<T>(value)
  const [isLoading, setIsLoading] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Update edit value when prop value changes
  useEffect(() => {
    if (!isEditing) {
      setEditValue(value)
    }
  }, [value, isEditing])

  // Handle click outside
  useEffect(() => {
    if (!isEditing) return

    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        handleCancel()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isEditing])

  const handleSave = async () => {
    if (editValue === value) {
      setIsEditing(false)
      return
    }

    setIsLoading(true)
    try {
      await onSave(editValue)
      setIsEditing(false)
    } catch (error) {
      // Reset to original value on error
      setEditValue(value)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setEditValue(value)
    setIsEditing(false)
  }

  const handleStartEdit = () => {
    setIsEditing(true)
    setEditValue(value)
  }

  if (isEditing) {
    return (
      <div ref={containerRef} className={cn("relative", className)}>
        {renderEdit({
          value: editValue,
          onChange: setEditValue,
          onSave: handleSave,
          onCancel: handleCancel,
        })}
        {isLoading && (
          <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
          </div>
        )}
      </div>
    )
  }

  return (
    <div
      className={cn(
        "group relative inline-flex items-center gap-2 min-h-[2rem]",
        editOnClick && "cursor-pointer hover:bg-muted/50 px-2 py-1 -mx-2 -my-1 rounded-md transition-colors",
        className
      )}
      onClick={editOnClick ? handleStartEdit : undefined}
    >
      <div className="flex-1">{renderView(value)}</div>
      {showEditIcon && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            handleStartEdit()
          }}
          className={cn(
            "opacity-0 group-hover:opacity-100 transition-opacity",
            "text-muted-foreground hover:text-foreground",
            "p-1 rounded-sm hover:bg-muted"
          )}
        >
          <Edit2 className="h-3 w-3" />
        </button>
      )}
    </div>
  )
}