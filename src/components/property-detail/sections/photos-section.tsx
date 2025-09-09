"use client"

import { useState, useCallback, useEffect } from "react"
import { Upload, X, GripVertical, Edit2, Trash2, Image as ImageIcon, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { usePropertyPhotos, useUploadPhotos, useUpdatePhoto, useDeletePhoto, useReorderPhotos } from "@/hooks/use-photos"
import { Photo } from "@/generated/prisma"
import { toast } from "sonner"
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core"
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

interface PhotosSectionProps {
  propertyId: string
}

const PHOTO_CATEGORIES = [
  { value: "EXTERIOR", label: "Exterior" },
  { value: "INTERIOR", label: "Interior" },
  { value: "BEDROOM", label: "Bedroom" },
  { value: "BATHROOM", label: "Bathroom" },
  { value: "KITCHEN", label: "Kitchen" },
  { value: "LIVING_ROOM", label: "Living Room" },
  { value: "DINING", label: "Dining" },
  { value: "POOL", label: "Pool" },
  { value: "GARDEN", label: "Garden" },
  { value: "VIEW", label: "View" },
  { value: "AMENITIES", label: "Amenities" },
  { value: "OTHER", label: "Other" },
]

function SortablePhotoCard({ 
  photo, 
  onEdit, 
  onDelete,
  isRecentlyUploaded 
}: { 
  photo: Photo; 
  onEdit: () => void; 
  onDelete: () => void;
  isRecentlyUploaded?: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: photo.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.7 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} className="relative">
      <Card className="group relative overflow-hidden rounded-2xl bg-white/95 backdrop-blur-sm border border-white/20 shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-[1.02] golden-glow">
        {/* Luxury gradient overlay */}
        <div className="absolute inset-0 luxury-gradient pointer-events-none" />
        <div className="absolute inset-0 animate-shimmer opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        {/* Success indicator with golden ring */}
        {isRecentlyUploaded && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/20 animate-success-fade pointer-events-none">
            <div className="absolute w-32 h-32 rounded-full border-4 border-amber-400/60 animate-ring-expand" />
            <CheckCircle2 className="w-16 h-16 text-white drop-shadow-2xl animate-check-bounce" />
          </div>
        )}
        
        <div className="relative overflow-hidden">
          <img
            src={photo.url}
            alt={photo.caption || "Property photo"}
            className="w-full aspect-[4/3] object-cover transition-transform duration-700 group-hover:scale-105"
          />
          
          {/* Premium hover overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 backdrop-blur-[2px]">
            {/* Drag handle with glass effect */}
            <div className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform -translate-y-2 group-hover:translate-y-0">
              <div
                {...attributes}
                {...listeners}
                className="p-2.5 bg-white/90 backdrop-blur-md rounded-xl cursor-move hover:bg-white transition-colors duration-300 shadow-xl"
              >
                <GripVertical className="h-4 w-4 text-gray-700" />
              </div>
            </div>
            
            {/* Action buttons with glass effect */}
            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform -translate-y-2 group-hover:translate-y-0 flex gap-2">
              <Button 
                size="icon" 
                variant="secondary" 
                onClick={onEdit}
                className="bg-white/90 backdrop-blur-md hover:bg-white shadow-xl border-0 transition-all duration-300 hover:scale-110"
              >
                <Edit2 className="h-4 w-4" />
              </Button>
              <Button 
                size="icon" 
                variant="secondary" 
                onClick={onDelete}
                className="bg-white/90 backdrop-blur-md hover:bg-white shadow-xl border-0 transition-all duration-300 hover:scale-110 hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        
        {/* Premium content area */}
        <div className="relative z-10 bg-gradient-to-b from-white/50 to-gray-50/30 backdrop-blur-sm">
          <CardContent className="p-4">
            <p className="text-sm font-medium text-gray-800 truncate tracking-wide">
              {photo.caption || "Untitled"}
            </p>
            <p className="text-xs text-gray-600 mt-1 font-light tracking-wider">
              {photo.isMain ? "Main photo" : "Additional photo"}
            </p>
          </CardContent>
        </div>
      </Card>
    </div>
  )
}

export function PhotosSection({ propertyId }: PhotosSectionProps) {
  const [selectedCategory, setSelectedCategory] = useState("ALL")
  const [editingPhoto, setEditingPhoto] = useState<Photo | null>(null)
  const [deletingPhoto, setDeletingPhoto] = useState<Photo | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [recentlyUploadedIds, setRecentlyUploadedIds] = useState<Set<string>>(new Set())

  const { data: photos = [], isLoading } = usePropertyPhotos(propertyId)
  const uploadPhotosMutation = useUploadPhotos(propertyId)
  const updatePhoto = useUpdatePhoto()
  const deletePhoto = useDeletePhoto()
  const reorderPhotos = useReorderPhotos(propertyId)

  // Track recently uploaded photos for success animation
  useEffect(() => {
    if (uploadPhotosMutation.data?.photos) {
      const newPhotoIds = new Set(uploadPhotosMutation.data.photos.map((p: Photo) => p.id))
      setRecentlyUploadedIds(newPhotoIds as Set<string>)
      
      // Remove the success indicator after animation completes
      const timer = setTimeout(() => {
        setRecentlyUploadedIds(new Set())
      }, 3000)
      
      return () => clearTimeout(timer)
    }
  }, [uploadPhotosMutation.data])

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (active.id !== over?.id) {
      const oldIndex = photos.findIndex((p) => p.id === active.id)
      const newIndex = photos.findIndex((p) => p.id === over?.id)

      const newOrder = arrayMove(photos, oldIndex, newIndex)
      const updates = newOrder.map((photo, index) => ({
        id: photo.id,
        position: index,
      }))

      reorderPhotos.mutate(updates)
    }
  }

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files && files.length > 0) {
      uploadPhotosMutation.mutate(Array.from(files))
    }
  }, [uploadPhotosMutation])

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragging(false)

    const files = Array.from(event.dataTransfer.files).filter((file) =>
      file.type.startsWith("image/")
    )

    if (files.length > 0) {
      uploadPhotosMutation.mutate(files)
    }
  }, [uploadPhotosMutation])

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleUpdatePhoto = async (data: any) => {
    if (!editingPhoto) return

    await updatePhoto.mutateAsync({
      id: editingPhoto.id,
      data: {
        caption: data.caption,
        altText: data.altText,
        category: data.category,
      },
    })
    setEditingPhoto(null)
  }

  const handleDeletePhoto = async () => {
    if (!deletingPhoto) return

    await deletePhoto.mutateAsync(deletingPhoto.id)
    setDeletingPhoto(null)
  }

  const filteredPhotos = selectedCategory === "ALL"
    ? photos
    : photos.filter((p) => p.category === selectedCategory)

  const photosByCategory = photos.reduce((acc, photo) => {
    const category = photo.category || "OTHER"
    if (!acc[category]) acc[category] = []
    acc[category].push(photo)
    return acc
  }, {} as Record<string, Photo[]>)

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold">Photos ({photos.length})</h2>
        <Button size="sm" className="relative">
          <Upload className="h-4 w-4 mr-2" />
          Upload Photos
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileUpload}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
        </Button>
      </div>

      {/* Upload Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`mb-6 border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragging ? "border-primary bg-primary/5" : "border-gray-300"
        }`}
      >
        <ImageIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
        <p className="text-sm text-gray-600">
          Drag and drop photos here, or click the upload button
        </p>
        <p className="text-xs text-gray-500 mt-2">
          Supports JPEG, PNG, WebP up to 10MB each
        </p>
      </div>

      {/* Category Filter */}
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="mb-6">
        <TabsList>
          <TabsTrigger value="ALL">All ({photos.length})</TabsTrigger>
          {Object.entries(photosByCategory).map(([category, categoryPhotos]) => (
            <TabsTrigger key={category} value={category}>
              {PHOTO_CATEGORIES.find((c) => c.value === category)?.label || category} ({categoryPhotos.length})
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Photos Grid */}
      {isLoading ? (
        <div className="grid grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="h-64 animate-pulse bg-gray-100" />
          ))}
        </div>
      ) : filteredPhotos.length === 0 ? (
        <div className="text-center py-12">
          <ImageIcon className="h-16 w-16 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500">No photos uploaded yet</p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={filteredPhotos.map((p) => p.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredPhotos.map((photo) => (
                <SortablePhotoCard
                  key={photo.id}
                  photo={photo}
                  onEdit={() => setEditingPhoto(photo)}
                  onDelete={() => setDeletingPhoto(photo)}
                  isRecentlyUploaded={recentlyUploadedIds.has(photo.id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Edit Photo Dialog */}
      <Dialog open={!!editingPhoto} onOpenChange={(open) => !open && setEditingPhoto(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Photo</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              const formData = new FormData(e.currentTarget)
              handleUpdatePhoto({
                caption: formData.get("caption"),
                altText: formData.get("altText"),
                category: formData.get("category"),
              })
            }}
          >
            <div className="space-y-4">
              {editingPhoto && (
                <img
                  src={editingPhoto.url}
                  alt={editingPhoto.caption || ""}
                  className="w-full h-48 object-cover rounded"
                />
              )}
              <div>
                <Label htmlFor="caption">Caption</Label>
                <Input
                  id="caption"
                  name="caption"
                  defaultValue={editingPhoto?.caption || ""}
                  placeholder="Enter photo caption"
                />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Select name="category" defaultValue={editingPhoto?.category || "OTHER"}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PHOTO_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setEditingPhoto(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updatePhoto.isPending}>
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletingPhoto} onOpenChange={(open) => !open && setDeletingPhoto(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Photo</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete this photo? This action cannot be undone.</p>
          {deletingPhoto && (
            <img
              src={deletingPhoto.url}
              alt={deletingPhoto.caption || ""}
              className="w-full h-48 object-cover rounded mt-4"
            />
          )}
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setDeletingPhoto(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeletePhoto}
              disabled={deletePhoto.isPending}
            >
              Delete Photo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}