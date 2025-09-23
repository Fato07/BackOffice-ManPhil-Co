"use client"

import { useState } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { ExternalLink, Plus, Trash, X, Check } from "lucide-react"
import { EquipmentRequestItem } from "@/types/equipment-request"

interface EquipmentRequestItemsTableProps {
  items: EquipmentRequestItem[]
  editable?: boolean
  onChange?: (items: EquipmentRequestItem[]) => void
}

export function EquipmentRequestItemsTable({
  items,
  editable = false,
  onChange,
}: EquipmentRequestItemsTableProps) {
  const [editableItems, setEditableItems] = useState<EquipmentRequestItem[]>(items)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editingItem, setEditingItem] = useState<EquipmentRequestItem | null>(null)

  const handleAddItem = () => {
    const newItem: EquipmentRequestItem = {
      name: "",
      quantity: 1,
      description: "",
      estimatedCost: 0,
      link: "",
    }
    setEditableItems([...editableItems, newItem])
    setEditingIndex(editableItems.length)
    setEditingItem(newItem)
  }

  const handleEditItem = (index: number) => {
    setEditingIndex(index)
    setEditingItem({ ...editableItems[index] })
  }

  const handleSaveItem = () => {
    if (editingIndex !== null && editingItem) {
      const updatedItems = [...editableItems]
      updatedItems[editingIndex] = editingItem
      setEditableItems(updatedItems)
      onChange?.(updatedItems)
    }
    setEditingIndex(null)
    setEditingItem(null)
  }

  const handleCancelEdit = () => {
    if (editingIndex !== null && editingIndex === editableItems.length - 1 && editableItems[editingIndex].name === "") {
      // Remove empty new item
      const updatedItems = editableItems.slice(0, -1)
      setEditableItems(updatedItems)
      onChange?.(updatedItems)
    }
    setEditingIndex(null)
    setEditingItem(null)
  }

  const handleRemoveItem = (index: number) => {
    const updatedItems = editableItems.filter((_, i) => i !== index)
    setEditableItems(updatedItems)
    onChange?.(updatedItems)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount)
  }

  const totalCost = (editable ? editableItems : items).reduce(
    (sum, item) => sum + (item.estimatedCost || 0) * item.quantity,
    0
  )

  const displayItems = editable ? editableItems : items

  if (displayItems.length === 0 && !editable) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No items in this request
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">Item Name</TableHead>
              <TableHead className="w-[80px]">Qty</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="w-[120px]">Unit Cost</TableHead>
              <TableHead className="w-[120px]">Total Cost</TableHead>
              <TableHead className="w-[100px]">Link</TableHead>
              {editable && <TableHead className="w-[100px]">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayItems.length === 0 && editable ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No items added yet. Click &quot;Add Item&quot; to start.
                </TableCell>
              </TableRow>
            ) : (
              displayItems.map((item, index) => {
                const isEditing = editingIndex === index

                return (
                  <TableRow key={index}>
                    <TableCell>
                      {isEditing ? (
                        <Input
                          value={editingItem!.name}
                          onChange={(e) =>
                            setEditingItem({ ...editingItem!, name: e.target.value })
                          }
                          placeholder="Item name"
                          className="h-8"
                          autoFocus
                        />
                      ) : (
                        <span className="font-medium">{item.name}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <Input
                          type="number"
                          value={editingItem!.quantity}
                          onChange={(e) =>
                            setEditingItem({
                              ...editingItem!,
                              quantity: parseInt(e.target.value) || 1,
                            })
                          }
                          min="1"
                          className="h-8"
                        />
                      ) : (
                        <Badge variant="secondary">{item.quantity}</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <Textarea
                          value={editingItem!.description || ""}
                          onChange={(e) =>
                            setEditingItem({
                              ...editingItem!,
                              description: e.target.value,
                            })
                          }
                          placeholder="Description"
                          className="h-8 min-h-[32px] resize-none"
                        />
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          {item.description || "-"}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <Input
                          type="number"
                          value={editingItem!.estimatedCost || ""}
                          onChange={(e) =>
                            setEditingItem({
                              ...editingItem!,
                              estimatedCost: parseFloat(e.target.value) || 0,
                            })
                          }
                          min="0"
                          step="0.01"
                          className="h-8"
                          placeholder="0.00"
                        />
                      ) : (
                        <span>{item.estimatedCost ? formatCurrency(item.estimatedCost) : "-"}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">
                        {item.estimatedCost
                          ? formatCurrency(item.estimatedCost * item.quantity)
                          : "-"}
                      </span>
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <Input
                          value={editingItem!.link || ""}
                          onChange={(e) =>
                            setEditingItem({ ...editingItem!, link: e.target.value })
                          }
                          placeholder="https://..."
                          className="h-8"
                        />
                      ) : item.link ? (
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
                        >
                          View
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    {editable && (
                      <TableCell>
                        {isEditing ? (
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={handleSaveItem}
                              disabled={!editingItem?.name}
                              className="h-7 w-7 p-0"
                            >
                              <Check className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={handleCancelEdit}
                              className="h-7 w-7 p-0"
                            >
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEditItem(index)}
                              className="h-7 w-7 p-0"
                            >
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleRemoveItem(index)}
                              className="h-7 w-7 p-0 text-red-600 hover:text-red-700"
                            >
                              <Trash className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Total and Add Item */}
      <div className="flex items-center justify-between">
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Total Estimated Cost</p>
          <p className="text-xl font-bold">{formatCurrency(totalCost)}</p>
        </div>
        
        {editable && !editingIndex && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleAddItem}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Item
          </Button>
        )}
      </div>
    </div>
  )
}