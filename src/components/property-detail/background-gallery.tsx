"use client"

import { Photo } from "@/generated/prisma"

interface BackgroundGalleryProps {
  photos: Photo[]
  className?: string
  overlayOpacity?: number
}

export function BackgroundGallery(_props: BackgroundGalleryProps) {
  // Component disabled - no background gallery
  return null
}