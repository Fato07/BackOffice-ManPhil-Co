import { useState, useEffect, useCallback, useRef } from "react"
import { Photo } from "@/generated/prisma"

interface UseBackgroundGalleryOptions {
  photos: Photo[]
  interval?: number
  autoPlay?: boolean
}

export function useBackgroundGallery({ 
  photos, 
  interval = 7000,
  autoPlay = true 
}: UseBackgroundGalleryOptions) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [nextIndex, setNextIndex] = useState(1)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [isPaused, setIsPaused] = useState(!autoPlay)
  const [imagesLoaded, setImagesLoaded] = useState<Set<number>>(new Set([0]))
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Filter photos for background suitability
  const backgroundPhotos = photos.filter(p => 
    ['EXTERIOR', 'INTERIOR', 'VIEW', 'POOL', 'GARDEN', 'LIVING_ROOM'].includes(p.category || '')
  ).slice(0, 10)

  const validPhotos = backgroundPhotos.length > 0 ? backgroundPhotos : photos.slice(0, 10)

  // Preload image function
  const preloadImage = useCallback((index: number) => {
    if (validPhotos[index] && !imagesLoaded.has(index)) {
      const img = new Image()
      img.onload = () => {
        setImagesLoaded(prev => new Set(prev).add(index))
      }
      img.src = validPhotos[index].url
    }
  }, [validPhotos, imagesLoaded])

  // Go to next image
  const goToNext = useCallback(() => {
    if (validPhotos.length <= 1) return
    
    setIsTransitioning(true)
    const next = (currentIndex + 1) % validPhotos.length
    setNextIndex(next)
    
    // Preload the image after next
    const afterNext = (next + 1) % validPhotos.length
    preloadImage(afterNext)
    
    setTimeout(() => {
      setCurrentIndex(next)
      setIsTransitioning(false)
    }, 1000)
  }, [currentIndex, validPhotos.length, preloadImage])

  // Go to previous image
  const goToPrev = useCallback(() => {
    if (validPhotos.length <= 1) return
    
    setIsTransitioning(true)
    const prev = currentIndex === 0 ? validPhotos.length - 1 : currentIndex - 1
    setNextIndex(prev)
    
    setTimeout(() => {
      setCurrentIndex(prev)
      setIsTransitioning(false)
    }, 1000)
  }, [currentIndex, validPhotos.length])

  // Go to specific image
  const goToImage = useCallback((index: number) => {
    if (index === currentIndex || index < 0 || index >= validPhotos.length) return
    
    setIsTransitioning(true)
    setNextIndex(index)
    
    // Preload adjacent images
    const prevIndex = index === 0 ? validPhotos.length - 1 : index - 1
    const nextIndexToPreload = (index + 1) % validPhotos.length
    preloadImage(prevIndex)
    preloadImage(nextIndexToPreload)
    
    setTimeout(() => {
      setCurrentIndex(index)
      setIsTransitioning(false)
    }, 1000)
  }, [currentIndex, validPhotos.length, preloadImage])

  // Toggle pause/play
  const togglePause = useCallback(() => {
    setIsPaused(prev => !prev)
  }, [])

  // Auto-advance effect
  useEffect(() => {
    if (!isPaused && validPhotos.length > 1 && !isTransitioning) {
      intervalRef.current = setInterval(goToNext, interval)
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [goToNext, interval, isPaused, validPhotos.length, isTransitioning])

  // Preload first few images on mount
  useEffect(() => {
    if (validPhotos.length > 1) {
      preloadImage(1)
      if (validPhotos.length > 2) {
        preloadImage(2)
      }
    }
  }, [validPhotos.length, preloadImage])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') {
        goToPrev()
      } else if (event.key === 'ArrowRight') {
        goToNext()
      } else if (event.key === ' ') {
        event.preventDefault()
        togglePause()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [goToPrev, goToNext, togglePause])

  return {
    currentIndex,
    nextIndex,
    isTransitioning,
    isPaused,
    photos: validPhotos,
    currentPhoto: validPhotos[currentIndex],
    nextPhoto: validPhotos[nextIndex],
    goToNext,
    goToPrev,
    goToImage,
    togglePause,
    imagesLoaded: imagesLoaded.size,
    totalImages: validPhotos.length
  }
}