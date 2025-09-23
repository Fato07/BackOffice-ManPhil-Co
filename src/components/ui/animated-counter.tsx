"use client"

import { useEffect, useState } from "react"
import { motion, useSpring, useTransform } from "framer-motion"

interface AnimatedCounterProps {
  value: number
  duration?: number
}

export function AnimatedCounter({ value, duration = 1 }: AnimatedCounterProps) {
  const [isClient, setIsClient] = useState(false)
  const spring = useSpring(0, { duration: duration * 1000 })
  const display = useTransform(spring, (current) =>
    Math.round(current).toLocaleString()
  )

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (isClient) {
      spring.set(value)
    }
  }, [spring, value, isClient])

  if (!isClient) {
    return <span>{value.toLocaleString()}</span>
  }

  return <motion.span>{display}</motion.span>
}