"use client"

import { useOfflineSync } from "@/hooks/use-offline-sync"
import { CloudOff, CloudUpload, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"

export function SyncStatusIndicator() {
  const { isOnline, isSyncing } = useOfflineSync()

  if (isOnline && !isSyncing) return null

  return (
    <div className={cn(
      "fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium shadow-sm transition-all duration-300 animate-in fade-in slide-in-from-bottom-2",
      !isOnline ? "bg-red-500/10 border-red-500/20 text-red-500" : "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
    )}>
      {isSyncing ? (
        <>
          <CloudUpload className="h-3.5 w-3.5 animate-bounce" />
          <span>Sincronizando...</span>
        </>
      ) : !isOnline ? (
        <>
          <CloudOff className="h-3.5 w-3.5" />
          <span>Modo Offline</span>
        </>
      ) : (
        <>
          <CheckCircle2 className="h-3.5 w-3.5" />
          <span>Sincronizado</span>
        </>
      )}
    </div>
  )
}
