"use client"

import { useState, useCallback, useEffect } from "react"
import { Plus, GripVertical, Edit2, Trash2, ChevronDown, ChevronUp, Home, Trees, X } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Room } from "@/generated/prisma"
import { useCreateRoom, useUpdateRoom, useDeleteRoom, useReorderRooms } from "@/hooks/use-rooms"
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core"
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { toast } from "sonner"
import { usePermissions } from "@/hooks/use-permissions"
import { Permission } from "@/types/auth"

interface RoomBuilderProps {
  propertyId: string
  rooms: Room[]
}

interface RoomFormData {
  name: string
  groupName?: string
  type: "INTERIOR" | "OUTDOOR"
  view?: string
  generalInfo?: string
  equipment: Array<{
    category: string
    items: Array<{
      name: string
      quantity: number
    }>
  }>
}

const EQUIPMENT_CATEGORIES = [
  "Furniture",
  "Electronics",
  "Kitchen Appliances",
  "Bathroom",
  "Outdoor",
  "Entertainment",
  "Climate Control",
  "Safety",
  "Other"
]

export function RoomBuilder({ propertyId, rooms: initialRooms }: RoomBuilderProps) {
  const { hasPermission } = usePermissions()
  const canEdit = hasPermission(Permission.PROPERTY_EDIT)
  const [rooms, setRooms] = useState(initialRooms)
  const [expandedRooms, setExpandedRooms] = useState<string[]>([])
  const [editingRoom, setEditingRoom] = useState<Room | null>(null)
  const [creatingRoom, setCreatingRoom] = useState<{ type: "INTERIOR" | "OUTDOOR" } | null>(null)
  const [deletingRoom, setDeletingRoom] = useState<Room | null>(null)
  
  const createRoom = useCreateRoom()
  const updateRoom = useUpdateRoom()
  const deleteRoom = useDeleteRoom()
  const reorderRooms = useReorderRooms()
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )
  
  const outdoorRooms = rooms.filter(room => room.type === "OUTDOOR")
  const interiorRooms = rooms.filter(room => room.type === "INTERIOR")

  const toggleRoom = (roomId: string) => {
    setExpandedRooms(prev =>
      prev.includes(roomId)
        ? prev.filter(id => id !== roomId)
        : [...prev, roomId]
    )
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (active.id !== over?.id) {
      const activeRoom = rooms.find(r => r.id === active.id)
      const overRoom = rooms.find(r => r.id === over?.id)
      
      if (activeRoom && overRoom && activeRoom.type === overRoom.type) {
        const oldIndex = rooms.findIndex(r => r.id === active.id)
        const newIndex = rooms.findIndex(r => r.id === over?.id)
        
        const newOrder = arrayMove(rooms, oldIndex, newIndex)
        setRooms(newOrder)
        
        // Update positions
        const updates = newOrder
          .filter(room => room.type === activeRoom.type)
          .map((room, index) => ({ id: room.id, position: index }))
          
        reorderRooms.mutate({ propertyId, rooms: updates })
      }
    }
  }

  const handleCreateRoom = async (data: RoomFormData) => {
    if (!creatingRoom) return
    
    try {
      const newRoom = await createRoom.mutateAsync({
        propertyId,
        name: data.name,
        groupName: data.groupName,
        type: data.type,
        view: data.view,
        generalInfo: data.generalInfo ? { description: data.generalInfo } : undefined,
        equipment: data.equipment,
      })
      
      setRooms([...rooms, newRoom])
      setCreatingRoom(null)
    } catch (error) {
      // Error is handled by the mutation
    }
  }

  const handleUpdateRoom = async (data: RoomFormData) => {
    if (!editingRoom) return
    
    try {
      const updatedRoom = await updateRoom.mutateAsync({
        id: editingRoom.id,
        data: {
          name: data.name,
          groupName: data.groupName || null,
          type: data.type,
          view: data.view || null,
          generalInfo: data.generalInfo ? { description: data.generalInfo } : undefined,
          equipment: data.equipment,
        },
      })
      
      setRooms(rooms.map(r => r.id === updatedRoom.id ? updatedRoom : r))
      setEditingRoom(null)
    } catch (error) {
      // Error is handled by the mutation
    }
  }

  const handleDeleteRoom = async () => {
    if (!deletingRoom) return
    
    try {
      await deleteRoom.mutateAsync({
        id: deletingRoom.id,
        propertyId: deletingRoom.propertyId,
      })
      
      setRooms(rooms.filter(r => r.id !== deletingRoom.id))
      setDeletingRoom(null)
    } catch (error) {
      // Error is handled by the mutation
    }
  }

  function SortableRoomCard({ room, canEdit }: { room: Room; canEdit?: boolean }) {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: room.id })

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    }

    const isExpanded = expandedRooms.includes(room.id)
    const equipment = room.equipment as any
    
    return (
      <div ref={setNodeRef} style={style}>
        <Card className="mb-3">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  {...attributes}
                  {...listeners}
                  className="cursor-move"
                >
                  <GripVertical className="h-5 w-5 text-gray-400" />
                </div>
                <div 
                  className="flex-1 cursor-pointer"
                  onClick={() => toggleRoom(room.id)}
                >
                  <h3 className="font-medium">{room.groupName || room.name}</h3>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {canEdit !== false && (
                  <>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation()
                        setEditingRoom(room)
                      }}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-8 w-8 text-red-600"
                      onClick={(e) => {
                        e.stopPropagation()
                        setDeletingRoom(room)
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                )}
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </div>
            </div>
          </CardHeader>
          
          {isExpanded && (
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm text-gray-600">General information</Label>
                  <p className="mt-1">
                    {room.generalInfo && typeof room.generalInfo === 'object' && room.generalInfo !== null && 'description' in room.generalInfo 
                      ? (room.generalInfo as any).description 
                      : "No information"}
                  </p>
                </div>
                
                {room.view && (
                  <div>
                    <Label className="text-sm text-gray-600">View</Label>
                    <p className="mt-1">{room.view}</p>
                  </div>
                )}
                
                <div>
                  <Label className="text-sm text-gray-600">Equipment</Label>
                  {equipment && equipment.length > 0 ? (
                    <div className="mt-2 space-y-2">
                      {equipment.map((cat: any, index: number) => (
                        <div key={index}>
                          <p className="font-medium text-sm">{cat.category}</p>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {cat.items.map((item: any, idx: number) => (
                              <Badge key={idx} variant="secondary">
                                {item.name} ({item.quantity})
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 mt-1">No equipment added</p>
                  )}
                </div>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    )
  }

  const AddRoomCard = ({ type }: { type: "INTERIOR" | "OUTDOOR" }) => (
    <Card 
      className="mb-3 border-dashed cursor-pointer hover:border-gray-400"
      onClick={() => setCreatingRoom({ type })}
    >
      <CardHeader>
        <div className="flex items-center justify-center gap-2 text-gray-500">
          <Plus className="h-4 w-4" />
          <span>Add {type.toLowerCase()} room</span>
        </div>
      </CardHeader>
    </Card>
  )

  return (
    <div className="p-6">
      <h2 className="text-lg font-semibold mb-4">Rooms</h2>
      
      <Tabs defaultValue="outdoor" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="outdoor">
            <Trees className="h-4 w-4 mr-2" />
            Outside ({outdoorRooms.length})
          </TabsTrigger>
          <TabsTrigger value="interior">
            <Home className="h-4 w-4 mr-2" />
            Interior ({interiorRooms.length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="outdoor" className="mt-4">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={outdoorRooms.map(r => r.id)}
              strategy={verticalListSortingStrategy}
            >
              {outdoorRooms.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No outdoor rooms added yet
                </p>
              ) : (
                outdoorRooms.map(room => (
                  <SortableRoomCard key={room.id} room={room} canEdit={canEdit} />
                ))
              )}
            </SortableContext>
          </DndContext>
          {canEdit && <AddRoomCard type="OUTDOOR" />}
        </TabsContent>
        
        <TabsContent value="interior" className="mt-4">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={interiorRooms.map(r => r.id)}
              strategy={verticalListSortingStrategy}
            >
              {interiorRooms.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No interior rooms added yet
                </p>
              ) : (
                interiorRooms.map(room => (
                  <SortableRoomCard key={room.id} room={room} canEdit={canEdit} />
                ))
              )}
            </SortableContext>
          </DndContext>
          {canEdit && <AddRoomCard type="INTERIOR" />}
        </TabsContent>
      </Tabs>

      {/* Room Form Dialog */}
      <RoomFormDialog
        open={!!creatingRoom || !!editingRoom}
        onOpenChange={(open) => {
          if (!open) {
            setCreatingRoom(null)
            setEditingRoom(null)
          }
        }}
        room={editingRoom}
        defaultType={creatingRoom?.type}
        onSubmit={editingRoom ? handleUpdateRoom : handleCreateRoom}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletingRoom} onOpenChange={(open) => !open && setDeletingRoom(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Room</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete "{deletingRoom?.name}"? This action cannot be undone.</p>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setDeletingRoom(null)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteRoom}
              disabled={deleteRoom.isPending}
            >
              Delete Room
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Room Form Dialog Component
interface RoomFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  room?: Room | null
  defaultType?: "INTERIOR" | "OUTDOOR"
  onSubmit: (data: RoomFormData) => void
}

function RoomFormDialog({ open, onOpenChange, room, defaultType, onSubmit }: RoomFormDialogProps) {
  const [formData, setFormData] = useState<RoomFormData>({
    name: "",
    groupName: "",
    type: defaultType || "INTERIOR",
    view: "",
    generalInfo: "",
    equipment: [],
  })

  const [newCategory, setNewCategory] = useState("")
  const [newEquipment, setNewEquipment] = useState({ name: "", quantity: 1 })

  // Initialize form data when room changes
  useEffect(() => {
    if (room) {
      const equipment = room.equipment as any || []
      const generalInfo = room.generalInfo as any
      
      setFormData({
        name: room.name || "",
        groupName: room.groupName || "",
        type: room.type as "INTERIOR" | "OUTDOOR",
        view: room.view || "",
        generalInfo: generalInfo?.description || "",
        equipment: equipment,
      })
    } else {
      setFormData({
        name: "",
        groupName: "",
        type: defaultType || "INTERIOR",
        view: "",
        generalInfo: "",
        equipment: [],
      })
    }
  }, [room, defaultType])

  const addEquipmentCategory = () => {
    if (newCategory && !formData.equipment.find(e => e.category === newCategory)) {
      setFormData({
        ...formData,
        equipment: [...formData.equipment, { category: newCategory, items: [] }]
      })
      setNewCategory("")
    }
  }

  const addEquipmentItem = (categoryIndex: number) => {
    if (newEquipment.name) {
      const equipment = [...formData.equipment]
      equipment[categoryIndex].items.push({ ...newEquipment })
      setFormData({ ...formData, equipment })
      setNewEquipment({ name: "", quantity: 1 })
    }
  }

  const removeEquipmentItem = (categoryIndex: number, itemIndex: number) => {
    const equipment = [...formData.equipment]
    equipment[categoryIndex].items.splice(itemIndex, 1)
    if (equipment[categoryIndex].items.length === 0) {
      equipment.splice(categoryIndex, 1)
    }
    setFormData({ ...formData, equipment })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name) {
      toast.error("Room name is required")
      return
    }
    onSubmit(formData)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{room ? "Edit Room" : "Create Room"}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Room Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Master Bedroom, Kitchen"
              />
            </div>
            
            <div>
              <Label htmlFor="groupName">Group Name (optional)</Label>
              <Input
                id="groupName"
                value={formData.groupName}
                onChange={(e) => setFormData({ ...formData, groupName: e.target.value })}
                placeholder="e.g., Main Floor, Guest Wing"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="type">Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value: "INTERIOR" | "OUTDOOR") => 
                  setFormData({ ...formData, type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INTERIOR">Interior</SelectItem>
                  <SelectItem value="OUTDOOR">Outdoor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="view">View (optional)</Label>
              <Input
                id="view"
                value={formData.view}
                onChange={(e) => setFormData({ ...formData, view: e.target.value })}
                placeholder="e.g., Ocean view, Garden view"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="generalInfo">General Information</Label>
            <Textarea
              id="generalInfo"
              value={formData.generalInfo}
              onChange={(e) => setFormData({ ...formData, generalInfo: e.target.value })}
              placeholder="Describe the room..."
              rows={3}
            />
          </div>

          <div>
            <Label>Equipment</Label>
            <div className="space-y-4 mt-2">
              {formData.equipment.map((category, catIndex) => (
                <div key={catIndex} className="border rounded-lg p-3">
                  <h4 className="font-medium mb-2">{category.category}</h4>
                  <div className="space-y-2">
                    {category.items.map((item, itemIndex) => (
                      <div key={itemIndex} className="flex items-center gap-2">
                        <span className="flex-1">{item.name}</span>
                        <Badge variant="secondary">Qty: {item.quantity}</Badge>
                        <Button
                          size="sm"
                          variant="ghost"
                          type="button"
                          onClick={() => removeEquipmentItem(catIndex, itemIndex)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    
                    <div className="flex gap-2 mt-2">
                      <Input
                        placeholder="Item name"
                        value={newEquipment.name}
                        onChange={(e) => setNewEquipment({ ...newEquipment, name: e.target.value })}
                      />
                      <Input
                        type="number"
                        placeholder="Qty"
                        className="w-20"
                        min={1}
                        value={newEquipment.quantity}
                        onChange={(e) => setNewEquipment({ 
                          ...newEquipment, 
                          quantity: parseInt(e.target.value) || 1 
                        })}
                      />
                      <Button
                        size="sm"
                        type="button"
                        onClick={() => addEquipmentItem(catIndex)}
                      >
                        Add
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              
              <div className="flex gap-2">
                <Select value={newCategory} onValueChange={setNewCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {EQUIPMENT_CATEGORIES.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  onClick={addEquipmentCategory}
                  disabled={!newCategory}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Category
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {room ? "Update Room" : "Create Room"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}