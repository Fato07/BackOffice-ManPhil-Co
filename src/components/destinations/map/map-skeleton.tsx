import { motion } from "framer-motion"
import { Skeleton } from "@/components/ui/skeleton"

export function MapSkeleton() {
  return (
    <div className="relative h-full w-full bg-gray-950">
      {/* Map placeholder with animated gradient */}
      <motion.div
        className="absolute inset-0"
        animate={{
          background: [
            "linear-gradient(90deg, rgb(17 24 39) 0%, rgb(31 41 55) 50%, rgb(17 24 39) 100%)",
            "linear-gradient(90deg, rgb(31 41 55) 0%, rgb(17 24 39) 50%, rgb(31 41 55) 100%)",
            "linear-gradient(90deg, rgb(17 24 39) 0%, rgb(31 41 55) 50%, rgb(17 24 39) 100%)",
          ],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "linear"
        }}
      />
      
      {/* Controls skeleton */}
      <div className="absolute top-4 left-4 space-y-3">
        <Skeleton className="h-12 w-64 bg-white/10" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24 bg-white/10" />
          <Skeleton className="h-10 w-10 bg-white/10" />
        </div>
      </div>
      
      {/* Stats skeleton */}
      <div className="absolute top-4 right-4">
        <Skeleton className="h-32 w-48 bg-white/10" />
      </div>
      
      {/* Map markers skeleton */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="flex items-center gap-2 text-gray-600"
        >
          <div className="w-12 h-12 rounded-full bg-[#B5985A]/20" />
          <span className="text-sm">Loading map...</span>
        </motion.div>
      </div>
    </div>
  )
}