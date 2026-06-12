"use client"

import React, { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { motion, AnimatePresence } from "framer-motion"
import { AlertTriangle } from "lucide-react"

interface ConfirmDialogProps {
  isOpen: boolean
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  isOpen,
  title = "Confirmar Ação",
  message,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  onConfirm,
  onCancel
}: ConfirmDialogProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  if (!mounted) return null

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed top-0 left-0 w-full h-[100vh] z-[9999] flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.93, opacity: 0, y: 10 }}
            transition={{ type: "spring", stiffness: 380, damping: 22, mass: 0.8 }}
            className="bg-card w-full max-w-sm rounded-3xl shadow-xl border border-border p-6 space-y-4"
          >
            <div className="flex items-center gap-3">
              <span className="bg-amber-500/10 text-amber-500 p-2 rounded-xl border border-amber-500/20">
                <AlertTriangle className="size-5" />
              </span>
              <h3 className="font-bold text-sm text-foreground">{title}</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{message}</p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onCancel}
                className="border border-border hover:bg-muted text-muted-foreground font-semibold text-xs rounded-full px-4 py-2 transition-colors cursor-pointer"
              >
                {cancelText}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className="bg-red-500 hover:bg-red-600 text-white font-bold text-xs rounded-full px-5 py-2 transition-colors border border-red-650/10 cursor-pointer shadow-xs"
              >
                {confirmText}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}
