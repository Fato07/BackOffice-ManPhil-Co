"use client"

import { useState, useEffect } from "react"
import { Plus, Edit2, Trash2, GripVertical, ChevronDown, DoorOpen, Info, MapPin, Wrench } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Room, RoomType } from "@/generated/prisma"
import { useCreateRoom, useUpdateRoom, useDeleteRoom, useReorderRooms } from "@/hooks/use-rooms"
import { RoomTypeSelect } from "@/components/rooms/room-type-select"
import { EquipmentSelectSimple } from "@/components/rooms/equipment-select-simple"
import { getRoomTypeLabel, getRoomTypeCategory, ROOM_CATEGORIES } from "@/lib/constants/equipment"
import { toast } from "sonner"
import { usePermissions } from "@/hooks/use-permissions"
import { Permission } from "@/types/auth"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

interface RoomBuilderProps {
  propertyId: string
  rooms: Room[]
}

export function RoomBuilder({ propertyId, rooms: initialRooms }: RoomBuilderProps) {
  const { hasPermission } = usePermissions()
  const canEdit = hasPermission(Permission.PROPERTY_EDIT)
  
  // State
  const [rooms, setRooms] = useState(initialRooms)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingRoom, setEditingRoom] = useState<Room | null>(null)
  const [deletingRoom, setDeletingRoom] = useState<Room | null>(null)
  const [activeTab, setActiveTab] = useState<"outdoor" | "interior">("outdoor")
  const [expandedRooms, setExpandedRooms] = useState<string[]>([])
  
  
  // Sync rooms when initialRooms changes
  useEffect(() => {
    setRooms(initialRooms)
  }, [initialRooms])
  
  // Mutations
  const createRoom = useCreateRoom()
  const updateRoom = useUpdateRoom()
  const deleteRoom = useDeleteRoom()
  const reorderRooms = useReorderRooms()
  
  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )
  
  // Filter rooms by category
  const outdoorRooms = rooms.filter(room => 
    getRoomTypeCategory((room as any).type) === "OUTDOOR"
  )
  const interiorRooms = rooms.filter(room => 
    getRoomTypeCategory((room as any).type) === "INTERIOR"
  )
  
  // Handlers
  const handleCreateRoom = async (data: any) => {
    try {
      const newRoom = await createRoom.mutateAsync({
        propertyId,
        name: getRoomTypeLabel(data.roomType),
        roomType: data.roomType,
        groupName: data.groupName,
        view: data.view,
        generalInfo: data.generalInfo ? { description: data.generalInfo } : undefined,
        equipment: data.equipment,
      })
      setRooms([...rooms, newRoom])
      setIsAddDialogOpen(false)
      toast.success("Room created successfully")
    } catch (error) {
      toast.error("Failed to create room")
    }
  }
  
  const handleUpdateRoom = async (data: any) => {
    if (!editingRoom) return
    
    try {
      const updatedRoom = await updateRoom.mutateAsync({
        id: editingRoom.id,
        data: {
          name: getRoomTypeLabel(data.roomType),
          roomType: data.roomType,
          groupName: data.groupName || null,
          view: data.view || null,
          generalInfo: data.generalInfo ? { description: data.generalInfo } : undefined,
          equipment: data.equipment,
        },
      })
      setRooms(rooms.map(r => r.id === updatedRoom.id ? updatedRoom : r))
      setEditingRoom(null)
      toast.success("Room updated successfully")
    } catch (error) {
      toast.error("Failed to update room")
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
      toast.success("Room deleted successfully")
    } catch (error) {
      toast.error("Failed to delete room")
    }
  }
  
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (active.id !== over?.id) {
      const oldIndex = rooms.findIndex(r => r.id === active.id)
      const newIndex = rooms.findIndex(r => r.id === over?.id)
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = arrayMove(rooms, oldIndex, newIndex)
        setRooms(newOrder)
        
        // Update positions in database
        const updates = newOrder
          .map((room, index) => ({ id: room.id, position: index }))
        reorderRooms.mutate({ propertyId, rooms: updates })
      }
    }
  }
  
  const toggleRoom = (roomId: string) => {
    setExpandedRooms(prev =>
      prev.includes(roomId)
        ? prev.filter(id => id !== roomId)
        : [...prev, roomId]
    )
  }
  
  // Sortable Room Card Component
  function SortableRoomCard({ room }: { room: Room }) {
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
      <div ref={setNodeRef} style={style} className="mb-2">
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="flex items-center gap-3 p-4 hover:bg-gray-50">
            {canEdit && (
              <div {...attributes} {...listeners} className="cursor-move">
                <GripVertical className="h-4 w-4 text-gray-400" />
              </div>
            )}
            
            <div 
              className="flex-1 flex items-center cursor-pointer"
              onClick={() => toggleRoom(room.id)}
            >
              <div className="flex-1">
                <div className="font-medium">{room.name}</div>
                {room.groupName && (
                  <div className="text-sm text-gray-500">{room.groupName}</div>
                )}
              </div>
              
              <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
            </div>
            
            {canEdit && (
              <div className="flex items-center gap-1 ml-2" onClick={(e) => e.stopPropagation()}>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onPointerDown={(e) => {
                    e.stopPropagation()
                    setEditingRoom(room)
                  }}
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-red-600"
                  onPointerDown={(e) => {
                    e.stopPropagation()
                    setDeletingRoom(room)
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </div>
          
          {isExpanded && (
            <div className="px-4 pb-4 border-t">
              <div className="mt-3 space-y-2 text-sm">
                {room.view && <div>View: {room.view}</div>}
                {room.generalInfo && (
                  <div>{(room.generalInfo as any).description}</div>
                )}
                {equipment && equipment.length > 0 && (
                  <div>
                    <div className="font-medium mb-1">Equipment:</div>
                    {equipment.map((cat: any, idx: number) => (
                      <div key={idx}>
                        {cat.items.map((item: any, itemIdx: number) => (
                          <div key={itemIdx} className="ml-2">
                            • {item.name} (×{item.quantity})
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }
  
  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="outdoor">Outside</TabsTrigger>
          <TabsTrigger value="interior">Interior</TabsTrigger>
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
              {outdoorRooms.map(room => (
                <SortableRoomCard key={room.id} room={room} />
              ))}
            </SortableContext>
          </DndContext>
          
          {canEdit && (
            <Button
              variant="outline"
              className="w-full mt-2 border-dashed"
              onClick={() => {
                setActiveTab("outdoor")
                setIsAddDialogOpen(true)
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Outdoor Room
            </Button>
          )}
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
              {interiorRooms.map(room => (
                <SortableRoomCard key={room.id} room={room} />
              ))}
            </SortableContext>
          </DndContext>
          
          {canEdit && (
            <Button
              variant="outline"
              className="w-full mt-2 border-dashed"
              onClick={() => {
                setActiveTab("interior")
                setIsAddDialogOpen(true)
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Interior Room
            </Button>
          )}
        </TabsContent>
      </Tabs>
      
      {/* Add/Edit Room Dialog */}
      <RoomFormDialog
        open={isAddDialogOpen || !!editingRoom}
        onOpenChange={(open) => {
          if (!open) {
            setIsAddDialogOpen(false)
            setEditingRoom(null)
          }
        }}
        room={editingRoom}
        isOutdoor={activeTab === "outdoor"}
        onSubmit={editingRoom ? handleUpdateRoom : handleCreateRoom}
      />
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletingRoom} onOpenChange={(open) => !open && setDeletingRoom(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Room</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete "{deletingRoom?.name}"?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingRoom(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteRoom}>
              Delete
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
  room: Room | null
  isOutdoor: boolean
  onSubmit: (data: any) => void
}

function RoomFormDialog({ open, onOpenChange, room, isOutdoor, onSubmit }: RoomFormDialogProps) {
  const [formData, setFormData] = useState({
    roomType: isOutdoor ? RoomType.TERRACE : RoomType.BEDROOM,
    groupName: "",
    view: "",
    generalInfo: "",
    equipment: [],
  })
  
  // Get filtered room types based on indoor/outdoor
  const getFilteredRoomTypes = () => {
    if (isOutdoor) {
      return [
        ROOM_CATEGORIES.OUTDOOR.items,
        ROOM_CATEGORIES.SPORTS.items,
      ].flat()
    } else {
      return [
        ROOM_CATEGORIES.BEDROOMS.items,
        ROOM_CATEGORIES.BATHROOMS.items,
        ROOM_CATEGORIES.LIVING_SPACES.items,
        ROOM_CATEGORIES.ENTERTAINMENT.items,
        ROOM_CATEGORIES.WELLNESS.items,
        ROOM_CATEGORIES.UTILITY.items,
      ].flat()
    }
  }
  
  // Reset form when dialog opens/closes or room changes
  useEffect(() => {
    if (room) {
      const equipment = room.equipment as any || []
      const generalInfo = room.generalInfo as any
      setFormData({
        roomType: (room as any).type || (isOutdoor ? RoomType.TERRACE : RoomType.BEDROOM),
        groupName: room.groupName || "",
        view: room.view || "",
        generalInfo: generalInfo?.description || "",
        equipment: equipment,
      })
    } else {
      setFormData({
        roomType: isOutdoor ? RoomType.TERRACE : RoomType.BEDROOM,
        groupName: "",
        view: "",
        generalInfo: "",
        equipment: [],
      })
    }
  }, [room, isOutdoor])
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }
  
  const validRoomTypes = getFilteredRoomTypes()
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DoorOpen className="h-5 w-5 text-[#B5985A]" />
            {room ? "Edit" : "Add"} {isOutdoor ? "Outdoor" : "Interior"} Room
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="overflow-y-auto max-h-[calc(90vh-12rem)] pr-2">
            <div className="space-y-6">
            {/* Basic Information Section */}
            <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Info className="h-4 w-4" />
              Basic Information
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    Room Type <span className="text-red-500">*</span>
                  </Label>
                  <RoomTypeSelect
                    value={formData.roomType}
                    onValueChange={(value) => setFormData({ ...formData, roomType: value })}
                    placeholder={`Select ${isOutdoor ? "outdoor" : "interior"} room type`}
                    className="w-full"
                    filterTypes={validRoomTypes}
                  />
                  <p className="text-xs text-gray-500">
                    Choose the type of {isOutdoor ? "outdoor space" : "room"}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label>Group Name (optional)</Label>
                  <Input
                    value={formData.groupName}
                    onChange={(e) => setFormData({ ...formData, groupName: e.target.value })}
                    placeholder={isOutdoor ? "e.g., Main Terrace" : "e.g., Master Suite"}
                    maxLength={50}
                  />
                  <p className="text-xs text-gray-500">
                    Group related rooms together
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Room Details Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <MapPin className="h-4 w-4" />
              Room Details
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4 space-y-4">
              <div className="space-y-2">
                <Label>View (optional)</Label>
                <Input
                  value={formData.view}
                  onChange={(e) => setFormData({ ...formData, view: e.target.value })}
                  placeholder={isOutdoor ? "e.g., Garden View, Street View" : "e.g., Ocean View, Mountain View"}
                  maxLength={100}
                />
                <p className="text-xs text-gray-500">
                  Describe what can be seen from this {isOutdoor ? "area" : "room"}
                </p>
              </div>
              
              <div className="space-y-2">
                <Label className="flex items-center justify-between">
                  <span>Description (optional)</span>
                  <span className="text-xs text-gray-400">{formData.generalInfo.length}/500</span>
                </Label>
                <Textarea
                  value={formData.generalInfo}
                  onChange={(e) => setFormData({ ...formData, generalInfo: e.target.value })}
                  rows={3}
                  maxLength={500}
                  placeholder={isOutdoor 
                    ? "Describe this outdoor space, its features, and any special characteristics..."
                    : "Describe this room, its features, and any special characteristics..."
                  }
                  className="resize-none"
                />
              </div>
            </div>
          </div>
          
          {/* Equipment & Amenities Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Wrench className="h-4 w-4" />
              Equipment & Amenities
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <EquipmentSelectSimple
                value={formData.equipment}
                onValueChange={(equipment) => setFormData({ ...formData, equipment })}
                roomType={formData.roomType}
              />
            </div>
          </div>
            </div>
          </div>
          
          <DialogFooter className="flex items-center justify-between border-t pt-4 mt-6">
            <p className="text-xs text-gray-500">
              <span className="text-red-500">*</span> Required fields
            </p>
            <div className="flex gap-2">
              <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={!formData.roomType}
                className="bg-[#B5985A] hover:bg-[#B5985A]/90"
              >
                {room ? "Update" : "Create"} Room
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}