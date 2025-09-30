"use client"

import { useState } from "react"
import { Upload, Trash2, Image as ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FileDropzone } from "@/components/ui/file-dropzone"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface ImageUploadSectionProps {
  destinationId: string
  currentImageUrl?: string | null
  currentImageAltText?: string | null
  onImageUpdate?: (imageUrl: string | null, altText: string | null) => void
  className?: string
}

export function ImageUploadSection({
  destinationId,
  currentImageUrl,
  currentImageAltText,
  onImageUpdate,
  className
}: ImageUploadSectionProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [altText, setAltText] = useState(currentImageAltText || "")
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const handleFileSelect = (files: File[]) => {
    const file = files[0]
    if (file) {
      setSelectedFile(file)
      // Create preview URL
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    }
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", selectedFile)
      formData.append("altText", altText || `${destinationId} hero image`)

      const response = await fetch(`/api/destinations/${destinationId}/image`, {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to upload image")
      }

      if (data.success) {
        toast.success("Image uploaded successfully")
        onImageUpdate?.(data.imageUrl, data.imageAltText)
        handleRemoveFile()
      }
    } catch (error) {
      console.error("Error uploading image:", error)
      const message = error instanceof Error ? error.message : "Failed to upload image"
      toast.error(message)
    } finally {
      setIsUploading(false)
    }
  }

  const handleDelete = async () => {
    if (!currentImageUrl) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/destinations/${destinationId}/image`, {
        method: "DELETE",
      })
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to delete image")
      }
      
      toast.success("Image deleted successfully")
      onImageUpdate?.(null, null)
      setAltText("")
    } catch (error) {
      console.error("Error deleting image:", error)
      const message = error instanceof Error ? error.message : "Failed to delete image"
      toast.error(message)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className={cn("space-y-4", className)}>
      <Label className="text-gray-300">Destination Image</Label>
      
      {/* Current Image */}
      {currentImageUrl && !selectedFile && (
        <div className="space-y-3">
          <div className="relative aspect-video rounded-lg overflow-hidden bg-white/5 border border-white/10">
            <img
              src={currentImageUrl}
              alt={currentImageAltText || "Destination image"}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 hover:opacity-100 transition-opacity">
              <div className="absolute bottom-4 right-4">
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="shadow-lg"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {isDeleting ? "Deleting..." : "Delete"}
                </Button>
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-400">
            Click delete to remove the current image and upload a new one
          </p>
        </div>
      )}

      {/* File Upload */}
      {(!currentImageUrl || selectedFile) && (
        <div className="space-y-4">
          {selectedFile ? (
            <div className="space-y-3">
              {/* Preview */}
              <div className="relative aspect-video rounded-lg overflow-hidden bg-white/5 border border-white/10">
                <img
                  src={previewUrl!}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
                <Button
                  type="button"
                  size="icon"
                  variant="destructive"
                  onClick={handleRemoveFile}
                  className="absolute top-2 right-2 h-8 w-8"
                  disabled={isUploading}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              {/* Alt Text Input */}
              <div className="space-y-2">
                <Label className="text-gray-300 text-sm">Alt Text (Optional)</Label>
                <Input
                  type="text"
                  value={altText}
                  onChange={(e) => setAltText(e.target.value)}
                  placeholder="Describe the image for accessibility"
                  className="bg-white/10 border-white/10 text-white placeholder:text-gray-500"
                  disabled={isUploading}
                />
              </div>

              {/* Upload Button */}
              <Button
                type="button"
                onClick={handleUpload}
                disabled={isUploading}
                className="w-full bg-[#B5985A] hover:bg-[#B5985A]/80"
              >
                <Upload className="h-4 w-4 mr-2" />
                {isUploading ? "Uploading..." : "Upload Image"}
              </Button>
            </div>
          ) : (
            <FileDropzone
              onFileSelect={handleFileSelect}
              accept={{
                'image/jpeg': ['.jpg', '.jpeg'],
                'image/png': ['.png'],
                'image/webp': ['.webp']
              }}
              maxSize={5 * 1024 * 1024} // 5MB
              placeholder={{
                idle: (
                  <div className="flex flex-col items-center gap-2">
                    <div className="rounded-full border border-dashed border-white/20 p-3">
                      <ImageIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <div className="space-y-1 text-center">
                      <p className="text-sm font-medium text-gray-300">
                        Drop an image here or click to browse
                      </p>
                      <p className="text-xs text-gray-500">
                        JPG, PNG or WebP, max 5MB
                      </p>
                    </div>
                  </div>
                )
              }}
              className="bg-white/5 border-white/10 hover:border-[#B5985A]/50"
            />
          )}
        </div>
      )}
    </div>
  )
}