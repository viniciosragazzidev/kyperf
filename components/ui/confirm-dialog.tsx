"use client"

import React from "react"
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
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-55 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
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
        </div>
      )}
    </AnimatePresence>
  )
}
