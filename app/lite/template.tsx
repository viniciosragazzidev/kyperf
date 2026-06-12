"use client"

import { motion } from "framer-motion"

export default function LiteTemplate({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        type: "spring",
        stiffness: 260,
        damping: 22,
        mass: 0.8
      }}
      style={{ willChange: "transform, opacity" }}
      className="w-full h-full flex flex-col flex-1"
    >
      {children}
    </motion.div>
  )
}
