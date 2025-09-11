"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { Input } from "./input"
import { cn } from "@/lib/utils"

const AnimatedInput = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, ...props }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false)
    
    return (
      <motion.div
        initial={false}
        animate={{
          scale: isFocused ? 1.01 : 1,
        }}
        transition={{ duration: 0.2 }}
        className="relative"
      >
        <Input
          ref={ref}
          className={cn(
            "transition-all duration-200",
            isFocused && "ring-2 ring-[#B5985A]/50",
            className
          )}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
        {isFocused && (
          <motion.div
            className="absolute inset-0 rounded-md pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              background: "radial-gradient(circle at center, rgba(181, 152, 90, 0.1) 0%, transparent 70%)"
            }}
          />
        )}
      </motion.div>
    )
  }
)

AnimatedInput.displayName = "AnimatedInput"

export { AnimatedInput }