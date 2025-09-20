"use client"

import { motion } from "framer-motion"

export function FinanceContent() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-center justify-center min-h-[60vh]"
    >
      <h1 className="text-xl font-bold text-muted-foreground">Coming Soon...</h1>
    </motion.div>
  )
}