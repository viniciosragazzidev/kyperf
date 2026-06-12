"use client"

import { motion } from "framer-motion"

export default function PanelTemplate({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.985, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ 
        type: "spring",
        stiffness: 260,
        damping: 20,
        mass: 0.7
      }}
      className="w-full h-full flex flex-col flex-1"
    >
      {children}
    </motion.div>
  )
}
