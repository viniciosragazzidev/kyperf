"use client"

import { useEffect, useRef } from "react"
import { useMotionValue, useSpring, animate } from "framer-motion"

interface RollingNumberProps {
  value: number
  prefix?: string
  suffix?: string
  decimals?: number
  className?: string
}

export function RollingNumber({
  value,
  prefix = "",
  suffix = "",
  decimals = 0,
  className = ""
}: RollingNumberProps) {
  const motionValue = useMotionValue(0)
  const springValue = useSpring(motionValue, { stiffness: 80, damping: 15, mass: 1 })
  const elementRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    animate(motionValue, value, { duration: 1.2, ease: "easeOut" })
  }, [value, motionValue])

  useEffect(() => {
    const unsubscribe = springValue.on("change", (latest) => {
      if (elementRef.current) {
        elementRef.current.textContent = `${prefix}${latest.toLocaleString("pt-BR", {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals
        })}${suffix}`
      }
    })
    return () => unsubscribe()
  }, [springValue, prefix, suffix, decimals])

  return (
    <span ref={elementRef} className={className}>
      {prefix}
      {value.toLocaleString("pt-BR", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      })}
      {suffix}
    </span>
  )
}
