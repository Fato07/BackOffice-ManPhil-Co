"use client"

import { useState, useCallback, useEffect } from "react"
import { GripVertical, Edit2, Trash2, Image as ImageIcon, CheckCircle2, Upload, X, Star, Expand, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileDropzone } from "@/components/ui/file-dropzone"
import { ImageViewerModal } from "@/components/property-detail/image-viewer-modal"
import { usePropertyPhotos, useUploadPhotos, useUpdatePhoto, useDeletePhoto, useReorderPhotos } from "@/hooks/use-photos"
import { Photo } from "@/generated/prisma"
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core"
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { usePermissions } from "@/hooks/use-permissions"
import { Permission } from "@/types/auth"
import { cn } from "@/lib/utils"

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
  onSetMain,
  onView,
  isRecentlyUploaded,
  canEdit
}: { 
  photo: Photo; 
  onEdit: () => void; 
  onDelete: () => void;
  onSetMain: () => void;
  onView: () => void;
  isRecentlyUploaded?: boolean;
  canEdit?: boolean;
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
        
        <div className="relative overflow-hidden cursor-pointer" onClick={onView}>
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
            
            {/* View button - always visible */}
            <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
              <Button 
                size="icon" 
                variant="secondary" 
                onClick={onView}
                className="bg-white/90 backdrop-blur-md hover:bg-white shadow-xl border-0 transition-all duration-300 hover:scale-110"
                title="View fullscreen"
              >
                <Expand className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Action buttons with glass effect */}
            {canEdit !== false && (
              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform -translate-y-2 group-hover:translate-y-0 flex gap-2">
                <Button 
                  size="icon" 
                  variant="secondary" 
                  onClick={onSetMain}
                  className={cn(
                    "bg-white/90 backdrop-blur-md hover:bg-white shadow-xl border-0 transition-all duration-300 hover:scale-110",
                    photo.isMain && "bg-amber-50/90 text-amber-600 hover:bg-amber-50"
                  )}
                  title={photo.isMain ? "Main photo" : "Set as main photo"}
                >
                  <Star className={cn("h-4 w-4", photo.isMain && "fill-current")} />
                </Button>
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
            )}
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
  const { hasPermission } = usePermissions()
  const canEdit = hasPermission(Permission.PROPERTY_EDIT)
  const [selectedCategory, setSelectedCategory] = useState("ALL")
  const [editingPhoto, setEditingPhoto] = useState<Photo | null>(null)
  const [deletingPhoto, setDeletingPhoto] = useState<Photo | null>(null)
  const [recentlyUploadedIds, setRecentlyUploadedIds] = useState<Set<string>>(new Set())
  const [viewerOpen, setViewerOpen] = useState(false)
  const [viewerInitialIndex, setViewerInitialIndex] = useState(0)
  const [uploadingFiles, setUploadingFiles] = useState<File[]>([])
  const [uploadProgress, setUploadProgress] = useState(0)

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

  const handleFileSelect = useCallback((files: File[]) => {
    if (files.length > 0) {
      setUploadingFiles(files)
      setUploadProgress(0)
      uploadPhotosMutation.mutate(files, {
        onSuccess: () => {
          setUploadingFiles([])
          setUploadProgress(100)
          // Clear progress after a short delay
          setTimeout(() => setUploadProgress(0), 1000)
        },
        onError: () => {
          setUploadingFiles([])
          setUploadProgress(0)
        }
      })
    }
  }, [uploadPhotosMutation])

  const handleUpdatePhoto = async (data: {
    caption?: string
    altText?: string  
    category?: string
  }) => {
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

  const handleSetMainPhoto = async (photoId: string) => {
    await updatePhoto.mutateAsync({
      id: photoId,
      data: { isMain: true },
    })
  }

  const handleViewPhoto = (photoId: string) => {
    const index = filteredPhotos.findIndex(p => p.id === photoId)
    if (index !== -1) {
      setViewerInitialIndex(index)
      setViewerOpen(true)
    }
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
        <h2 className="text-lg font-semibold">
          Photos ({photos.length})
          {uploadingFiles.length > 0 && (
            <span className="ml-2 text-sm font-normal text-amber-600 animate-pulse">
              (+{uploadingFiles.length} uploading...)
            </span>
          )}
        </h2>
      </div>

      {/* Upload Drop Zone */}
      {canEdit && (
        <div className="relative">
          <FileDropzone
            onFileSelect={handleFileSelect}
            accept={{
              'image/*': ['.jpg', '.jpeg', '.png', '.webp']
            }}
            maxSize={10 * 1024 * 1024} // 10MB
            multiple={true}
            maxFiles={20} // Allow up to 20 files at once
            className={cn("mb-6", uploadingFiles.length > 0 && "opacity-50 pointer-events-none")}
            showFileInfo={false}
            placeholder={{
              idle: (
                <div className="flex flex-col items-center gap-4">
                  <div className="relative">
                    <div className="rounded-full border-2 border-dashed border-amber-400/30 bg-amber-50/50 p-6 transition-all hover:border-amber-400/50 hover:bg-amber-50/80">
                      <ImageIcon className="h-10 w-10 text-amber-600" />
                    </div>
                    <div className="absolute inset-0 rounded-full animate-pulse ring-4 ring-amber-200/20" />
                  </div>
                  <div className="space-y-2 text-center">
                    <p className="text-base font-medium text-gray-700">
                      Drag & drop property photos here
                    </p>
                    <p className="text-sm text-gray-500">
                      or click to browse your files
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      Supports JPEG, PNG, WebP up to 10MB each
                    </p>
                  </div>
                </div>
              ),
              active: (
                <div className="flex flex-col items-center gap-4">
                  <Upload className="h-10 w-10 text-amber-600 animate-bounce" />
                  <p className="text-base font-medium text-amber-600">
                    Drop photos here to upload
                  </p>
                </div>
              )
            }}
          />
          
          {/* Upload Progress Overlay */}
          {uploadingFiles.length > 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm rounded-xl border-2 border-amber-400/50 z-10">
              <div className="flex flex-col items-center gap-4 px-6 py-8">
                <div className="relative">
                  <Loader2 className="h-12 w-12 text-amber-600 animate-spin" />
                  <div className="absolute inset-0 rounded-full border-4 border-amber-400/20 animate-ping" />
                </div>
                <div className="text-center space-y-2">
                  <p className="text-lg font-semibold text-gray-800">
                    Uploading {uploadingFiles.length} photo{uploadingFiles.length > 1 ? 's' : ''}...
                  </p>
                  <p className="text-sm text-gray-600">
                    Please wait while we process your images
                  </p>
                  {uploadProgress > 0 && uploadProgress < 100 && (
                    <div className="w-48 mx-auto mt-3">
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-amber-500 transition-all duration-300 ease-out"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{uploadProgress}%</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

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
      ) : filteredPhotos.length === 0 && uploadingFiles.length === 0 ? (
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
              {/* Placeholder cards for uploading files */}
              {uploadingFiles.map((file, index) => (
                <Card 
                  key={`uploading-${index}`} 
                  className="group relative overflow-hidden rounded-2xl bg-white/95 backdrop-blur-sm border border-white/20 shadow-lg animate-pulse"
                >
                  <div className="absolute inset-0 luxury-gradient pointer-events-none" />
                  <div className="relative overflow-hidden">
                    <div className="w-full aspect-[4/3] bg-gray-200 animate-pulse flex items-center justify-center">
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="h-8 w-8 text-gray-400 animate-spin" />
                        <p className="text-xs text-gray-500">Uploading...</p>
                      </div>
                    </div>
                  </div>
                  <div className="relative z-10 bg-gradient-to-b from-white/50 to-gray-50/30 backdrop-blur-sm">
                    <CardContent className="p-4">
                      <p className="text-sm font-medium text-gray-600 truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {(file.size / 1024 / 1024).toFixed(1)} MB
                      </p>
                    </CardContent>
                  </div>
                </Card>
              ))}
              
              {/* Existing photos */}
              {filteredPhotos.map((photo) => (
                <SortablePhotoCard
                  key={photo.id}
                  photo={photo}
                  onEdit={() => setEditingPhoto(photo)}
                  onDelete={() => setDeletingPhoto(photo)}
                  onSetMain={() => handleSetMainPhoto(photo.id)}
                  onView={() => handleViewPhoto(photo.id)}
                  isRecentlyUploaded={recentlyUploadedIds.has(photo.id)}
                  canEdit={canEdit}
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
                caption: formData.get("caption") as string,
                altText: formData.get("altText") as string,
                category: formData.get("category") as string,
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

      {/* Image Viewer Modal */}
      <ImageViewerModal
        isOpen={viewerOpen}
        onClose={() => setViewerOpen(false)}
        photos={filteredPhotos}
        initialIndex={viewerInitialIndex}
      />
    </div>
  )
}