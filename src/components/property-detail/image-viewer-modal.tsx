"use client"

import React, { useEffect, useCallback } from "react"
import { Photo } from "@/generated/prisma"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut, Download, Grid3X3 } from "lucide-react"
import { cn } from "@/lib/utils"

interface ImageViewerModalProps {
  isOpen: boolean
  onClose: () => void
  photos: Photo[]
  initialIndex?: number
  onPhotoChange?: (index: number) => void
}

export function ImageViewerModal({
  isOpen,
  onClose,
  photos,
  initialIndex = 0,
  onPhotoChange
}: ImageViewerModalProps) {
  const [currentIndex, setCurrentIndex] = React.useState(initialIndex)
  const [isZoomed, setIsZoomed] = React.useState(false)
  const [showThumbnails, setShowThumbnails] = React.useState(false)
  const [isTransitioning, setIsTransitioning] = React.useState(false)

  // Update current index when initialIndex changes
  useEffect(() => {
    setCurrentIndex(initialIndex)
  }, [initialIndex])

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        goToPrevious()
      } else if (e.key === 'ArrowRight') {
        goToNext()
      } else if (e.key === 'Escape') {
        onClose()
      } else if (e.key === ' ') {
        e.preventDefault()
        setIsZoomed(!isZoomed)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, currentIndex, isZoomed])

  const goToNext = useCallback(() => {
    if (photos.length <= 1 || isTransitioning) return
    
    setIsTransitioning(true)
    const nextIndex = (currentIndex + 1) % photos.length
    setCurrentIndex(nextIndex)
    onPhotoChange?.(nextIndex)
    
    setTimeout(() => setIsTransitioning(false), 300)
  }, [currentIndex, photos.length, isTransitioning, onPhotoChange])

  const goToPrevious = useCallback(() => {
    if (photos.length <= 1 || isTransitioning) return
    
    setIsTransitioning(true)
    const prevIndex = currentIndex === 0 ? photos.length - 1 : currentIndex - 1
    setCurrentIndex(prevIndex)
    onPhotoChange?.(prevIndex)
    
    setTimeout(() => setIsTransitioning(false), 300)
  }, [currentIndex, photos.length, isTransitioning, onPhotoChange])

  const goToImage = useCallback((index: number) => {
    if (index === currentIndex || isTransitioning) return
    
    setIsTransitioning(true)
    setCurrentIndex(index)
    onPhotoChange?.(index)
    setShowThumbnails(false)
    
    setTimeout(() => setIsTransitioning(false), 300)
  }, [currentIndex, isTransitioning, onPhotoChange])

  const handleDownload = () => {
    const photo = photos[currentIndex]
    const link = document.createElement('a')
    link.href = photo.url
    link.download = photo.caption || `property-photo-${currentIndex + 1}`
    link.click()
  }

  if (photos.length === 0) return null

  const currentPhoto = photos[currentIndex]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="!max-w-[100vw] !w-screen !h-screen !m-0 !translate-x-[-50%] !translate-y-[-50%] !left-[50%] !top-[50%] p-0 bg-black/95 backdrop-blur-2xl border-0 rounded-none" 
        showCloseButton={false}
      >
        <DialogTitle className="sr-only">Property Image Gallery - Viewing {currentIndex + 1} of {photos.length}</DialogTitle>
        
        <div className="absolute top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/70 to-transparent p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                size="icon"
                variant="ghost"
                onClick={onClose}
                className="text-white hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </Button>
              
              <div className="text-white">
                <p className="text-sm font-light">
                  {currentIndex + 1} / {photos.length}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setShowThumbnails(!showThumbnails)}
                className="text-white hover:bg-white/10"
              >
                <Grid3X3 className="h-5 w-5" />
              </Button>
              
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setIsZoomed(!isZoomed)}
                className="text-white hover:bg-white/10"
              >
                {isZoomed ? (
                  <ZoomOut className="h-5 w-5" />
                ) : (
                  <ZoomIn className="h-5 w-5" />
                )}
              </Button>
              
              <Button
                size="icon"
                variant="ghost"
                onClick={handleDownload}
                className="text-white hover:bg-white/10"
              >
                <Download className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>

        <div className="relative w-full h-full flex items-center justify-center">
          {photos.length > 1 && (
            <>
              <Button
                size="icon"
                variant="ghost"
                onClick={goToPrevious}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-40 h-12 w-12 bg-black/30 backdrop-blur-sm hover:bg-black/50 text-white"
                disabled={isTransitioning}
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>

              <Button
                size="icon"
                variant="ghost"
                onClick={goToNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-40 h-12 w-12 bg-black/30 backdrop-blur-sm hover:bg-black/50 text-white"
                disabled={isTransitioning}
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            </>
          )}

          <div
            className={cn(
              "relative transition-all duration-300",
              isZoomed ? "cursor-zoom-out" : "cursor-zoom-in",
              isTransitioning && "opacity-0"
            )}
            onClick={() => setIsZoomed(!isZoomed)}
          >
            <img
              src={currentPhoto.url}
              alt={currentPhoto.caption || "Property photo"}
              className={cn(
                "max-w-full max-h-screen object-contain transition-transform duration-300",
                isZoomed && "scale-150"
              )}
              draggable={false}
            />
          </div>
        </div>

        {currentPhoto.caption && (
          <div className="absolute bottom-0 left-0 right-0 z-40 bg-gradient-to-t from-black/70 to-transparent p-6">
            <p className="text-white text-center text-lg font-light">
              {currentPhoto.caption}
            </p>
          </div>
        )}

        {showThumbnails && (
          <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-xl overflow-auto">
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-light text-white">All Photos</h3>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setShowThumbnails(false)}
                  className="text-white hover:bg-white/10"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {photos.map((photo, index) => (
                  <button
                    key={photo.id}
                    onClick={() => goToImage(index)}
                    className={cn(
                      "relative aspect-square rounded-lg overflow-hidden group",
                      "transition-all duration-300 hover:scale-105",
                      currentIndex === index && "ring-2 ring-white"
                    )}
                  >
                    <img
                      src={photo.url}
                      alt={photo.caption || `Photo ${index + 1}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
                    <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-white text-xs truncate">
                        {photo.caption || `Photo ${index + 1}`}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}