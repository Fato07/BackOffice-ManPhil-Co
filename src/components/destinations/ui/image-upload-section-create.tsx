"use client"

import { useState } from "react"
import { Upload, Trash2, Image as ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FileDropzone } from "@/components/ui/file-dropzone"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface ImageUploadSectionCreateProps {
  onImageSelect: (file: File | null, altText: string) => void
  className?: string
  disabled?: boolean
}

export function ImageUploadSectionCreate({
  onImageSelect,
  className,
  disabled = false
}: ImageUploadSectionCreateProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [altText, setAltText] = useState("")
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const handleFileSelect = (files: File[]) => {
    const file = files[0]
    if (file) {
      setSelectedFile(file)
      // Create preview URL
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
      onImageSelect(file, altText)
    }
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
    onImageSelect(null, "")
  }

  const handleAltTextChange = (value: string) => {
    setAltText(value)
    if (selectedFile) {
      onImageSelect(selectedFile, value)
    }
  }

  return (
    <div className={cn("space-y-4", className)}>
      <Label className="text-gray-300">Destination Image (Optional)</Label>
      
      <div className="space-y-4">
        {selectedFile ? (
          <div className="space-y-3">
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
                disabled={disabled}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300 text-sm">Alt Text (Optional)</Label>
              <Input
                type="text"
                value={altText}
                onChange={(e) => handleAltTextChange(e.target.value)}
                placeholder="Describe the image for accessibility"
                className="bg-white/10 border-white/10 text-white placeholder:text-gray-500"
                disabled={disabled}
              />
            </div>
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
            disabled={disabled}
          />
        )}
      </div>
      
      <p className="text-xs text-gray-400">
        You can upload an image now or add it later by editing the destination
      </p>
    </div>
  )
}