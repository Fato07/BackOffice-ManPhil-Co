"use client"

import { motion } from "framer-motion"
import { Map, List } from "lucide-react"
import { cn } from "@/lib/utils"
import { ViewMode } from "../destinations-content"

interface ViewToggleProps {
  currentView: ViewMode
  onViewChange: (view: ViewMode) => void
}

const views = [
  { id: "map" as ViewMode, icon: Map, label: "Map" },
  { id: "list" as ViewMode, icon: List, label: "List" },
]

export function ViewToggle({ currentView, onViewChange }: ViewToggleProps) {
  return (
    <div className="flex items-center bg-black/40 backdrop-blur-md rounded-lg p-1 border border-white/10">
      {views.map((view) => (
        <button
          key={view.id}
          onClick={() => onViewChange(view.id)}
          className={cn(
            "relative px-4 py-2 rounded-md transition-all duration-200",
            "flex items-center gap-2 text-sm font-medium",
            currentView === view.id
              ? "text-white"
              : "text-gray-400 hover:text-white"
          )}
        >
          {currentView === view.id && (
            <motion.div
              layoutId="activeView"
              className="absolute inset-0 bg-[#B5985A] rounded-md"
              transition={{ type: "spring", duration: 0.3 }}
            />
          )}
          <view.icon className="relative z-10 h-4 w-4" />
          <span className="relative z-10">{view.label}</span>
        </button>
      ))}
    </div>
  )
}