"use client"

import * as React from "react"
import { motion, MotionProps } from "framer-motion"
import { Button } from "./button"
import { cn } from "@/lib/utils"
import { VariantProps } from "class-variance-authority"
import { buttonVariants } from "./button"

type AnimatedButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  } & MotionProps

const AnimatedButton = React.forwardRef<HTMLButtonElement, AnimatedButtonProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={{
          type: "spring",
          stiffness: 400,
          damping: 17
        }}
      >
        <Button
          ref={ref}
          className={cn(
            "transition-all duration-200",
            "hover:shadow-md",
            className
          )}
          {...props}
        >
          {children}
        </Button>
      </motion.div>
    )
  }
)

AnimatedButton.displayName = "AnimatedButton"

export { AnimatedButton }