"use client"

import { useState, useEffect, useRef } from "react"
import { cn } from "@/lib/utils"
import { Edit2, Check, X } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"

interface InlineSelectProps<T = string> {
  value: T
  options: Array<{ value: T; label: string }>
  onSave: (value: T) => void | Promise<void>
  renderView?: (option: { value: T; label: string } | undefined) => React.ReactNode
  className?: string
  editOnClick?: boolean
  showEditIcon?: boolean
}

export function InlineSelect<T = string>({
  value,
  options,
  onSave,
  renderView,
  className,
  editOnClick = true,
  showEditIcon = true,
}: InlineSelectProps<T>) {
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

    // Delay to prevent immediate closing when clicking the edit button
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside)
    }, 0)

    return () => {
      clearTimeout(timeoutId)
      document.removeEventListener('mousedown', handleClickOutside)
    }
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

  const selectedOption = options.find(opt => opt.value === value)
  const editOption = options.find(opt => opt.value === editValue)

  if (isEditing) {
    return (
      <div ref={containerRef} className={cn("relative inline-flex items-center gap-1", className)}>
        <Select
          value={String(editValue)}
          onValueChange={(val) => setEditValue(val as T)}
          disabled={isLoading}
        >
          <SelectTrigger className="h-6 text-xs min-w-[100px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem
                key={String(option.value)}
                value={String(option.value)}
                className="text-xs"
              >
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6"
          onClick={handleSave}
          disabled={isLoading}
        >
          <Check className="h-3 w-3 text-green-600" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6"
          onClick={handleCancel}
          disabled={isLoading}
        >
          <X className="h-3 w-3 text-destructive" />
        </Button>
        {isLoading && (
          <div className="absolute inset-0 bg-background/50 flex items-center justify-center rounded">
            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary" />
          </div>
        )}
      </div>
    )
  }

  const viewContent = renderView ? renderView(selectedOption) : (
    selectedOption ? selectedOption.label : ''
  )

  return (
    <div
      className={cn(
        "group relative inline-flex items-center gap-1",
        editOnClick && "cursor-pointer hover:bg-muted/50 px-1 py-0.5 -mx-1 -my-0.5 rounded transition-colors",
        className
      )}
      onClick={editOnClick ? handleStartEdit : undefined}
    >
      <div className="flex-1">{viewContent}</div>
      {showEditIcon && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            handleStartEdit()
          }}
          className={cn(
            "opacity-0 group-hover:opacity-100 transition-opacity",
            "text-muted-foreground hover:text-foreground",
            "p-0.5 rounded-sm hover:bg-muted"
          )}
        >
          <Edit2 className="h-2.5 w-2.5" />
        </button>
      )}
    </div>
  )
}