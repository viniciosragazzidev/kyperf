"use client"

import React, { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
  Users,
  LayoutDashboard,
  Wrench,
  ArrowLeft,
  Clock
} from "lucide-react"
import { getMechanicWorkloadAction } from "@/lib/actions/employees-actions"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

interface ActiveJob {
  id: string
  osNumber: number
  status: string
  box: string | null
  vehicle: string
  customer: string
  itemsCount: number
  approvedItemsCount: number
}

interface QueuedJob {
  id: string
  osNumber: number
  status: string
  box: string | null
  vehicle: string
}

interface MechanicWorkload {
  mechanicId: string
  name: string
  email: string
  phone: string | null
  specialties: string[]
  workStatus: "AVAILABLE" | "BUSY" | "AWAY"
  activeOrdersCount: number
  currentJob: ActiveJob | null
  queue: QueuedJob[]
}

const statusConfig: Record<string, { label: string, color: string, bg: string, border: string }> = {
  AVAILABLE: {
    label: "Disponível",
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20"
  },
  BUSY: {
    label: "Trabalhando",
    color: "text-orange-500",
    bg: "bg-orange-500/10",
    border: "border-orange-500/20"
  },
  AWAY: {
    label: "Ausente",
    color: "text-zinc-500",
    bg: "bg-zinc-500/10",
    border: "border-zinc-500/20"
  },
}

export default function WorkloadPage() {
  const [workloads, setWorkloads] = useState<MechanicWorkload[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const loadWorkloads = async () => {
    setIsLoading(true)
    const res = await getMechanicWorkloadAction()
    setIsLoading(false)
    if (res.success && res.data) {
      setWorkloads(res.data as MechanicWorkload[])
    } else {
      toast.error(res.error || "Erro ao carregar carga de trabalho.")
    }
  }

  useEffect(() => {
    loadWorkloads()
  }, [])

  return (
    <div className="flex-1 p-4 md:p-6 bg-[#FAF9F6] dark:bg-zinc-950 min-h-screen font-sans">

      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <button
            onClick={() => window.location.href = "/panel/employees"}
            className="flex items-center gap-1 text-[10px] uppercase font-bold text-muted-foreground tracking-wider hover:text-foreground mb-1 transition-colors geist-mono animate-none"
          >
            <ArrowLeft className="size-3" />
            <span>Voltar para Lista</span>
          </button>

          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <span className="bg-orange-500/10 text-orange-500 p-1.5 rounded-lg border border-orange-500/20">
              <LayoutDashboard className="size-4.5" />
            </span>
            Carga de Trabalho - Pátio
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5 geist-mono pl-10">
            Acompanhe em tempo real os carros que estão em cada rampa/box e a fila de serviços pendentes.
          </p>
        </div>

        <Button
          onClick={loadWorkloads}
          className="flex items-center gap-1.5 border border-border bg-card hover:bg-muted text-foreground font-bold text-xs rounded-none px-4 py-2 transition-all active:scale-95 shrink-0"
        >
          <span>Atualizar Painel</span>
        </Button>
      </div>

      {/* Rampa Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(idx => (
            <div key={idx} className="bg-card rounded-3xl p-5 border border-border/50 shadow-sm space-y-4 animate-pulse">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-1/3 rounded-md" />
                <Skeleton className="h-5 w-16 rounded-md" />
              </div>
              <Skeleton className="h-24 w-full rounded-2xl" />
              <div className="space-y-2">
                <Skeleton className="h-8 w-full rounded-md" />
                <Skeleton className="h-8 w-full rounded-md" />
              </div>
            </div>
          ))}
        </div>
      ) : workloads.length === 0 ? (
        <div className="bg-card rounded-3xl p-16 text-center text-xs text-muted-foreground border border-border/50">
          Nenhum mecânico ativo cadastrado no sistema para monitorar a carga de trabalho.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {workloads.map((mech) => {
            const status = statusConfig[mech.workStatus] || statusConfig.AVAILABLE

            return (
              <motion.div
                key={mech.mechanicId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card rounded-3xl border border-border/50 shadow-[0_10px_35px_-12px_rgba(0,0,0,0.03)] flex flex-col overflow-hidden text-foreground"
              >
                {/* Header do Cartão */}
                <div className="p-4 bg-muted/30 border-b border-border/40 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-xs flex items-center gap-1.5">
                      <div className="size-6 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center font-bold text-[10px] text-zinc-600 dark:text-zinc-400">
                        {mech.name.slice(0, 2)}
                      </div>
                      {mech.name}
                    </h3>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {mech.specialties.slice(0, 2).map((spec, idx) => (
                        <span key={idx} className="bg-background text-muted-foreground text-[8px] px-1 py-0.5 border border-border/30 geist-mono uppercase">
                          {spec}
                        </span>
                      ))}
                      {mech.specialties.length === 0 && (
                        <span className="text-muted-foreground/40 text-[9px]">Sem especialidade</span>
                      )}
                    </div>
                  </div>

                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-bold rounded-full ${status.bg} ${status.color} border ${status.border}`}>
                    <span className={`size-1 rounded-full ${mech.workStatus === "BUSY" ? "bg-orange-500 animate-ping" : mech.workStatus === "AVAILABLE" ? "bg-emerald-500" : "bg-zinc-400"}`} />
                    {status.label}
                  </span>
                </div>

                {/* Box de Trabalho Ativo */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  {mech.currentJob ? (
                    <div className="bg-orange-500/5 border border-orange-500/15 rounded-2xl p-4 mb-4">
                      <div className="flex justify-between items-start">
                        <span className="bg-orange-500 text-white text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-none font-mono">
                          Rampa / Box {mech.currentJob.box || "01"}
                        </span>
                        <span className="text-[10px] font-mono font-bold text-muted-foreground">
                          OS #{mech.currentJob.osNumber}
                        </span>
                      </div>

                      <div className="mt-3">
                        <h4 className="text-xs font-bold text-foreground truncate">{mech.currentJob.vehicle}</h4>
                        <p className="text-[10px] text-muted-foreground mt-0.5">Cliente: {mech.currentJob.customer}</p>
                      </div>

                      {/* Progresso de Serviços */}
                      <div className="mt-4 space-y-1">
                        <div className="flex justify-between text-[9px] font-bold text-muted-foreground">
                          <span>Serviços Concluídos</span>
                          <span>
                            {mech.currentJob.approvedItemsCount} / {mech.currentJob.itemsCount}
                          </span>
                        </div>
                        <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-orange-500 h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${mech.currentJob.itemsCount > 0
                                ? (mech.currentJob.approvedItemsCount / mech.currentJob.itemsCount) * 100
                                : 0}%`
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-emerald-500/5 border border-dashed border-emerald-500/20 rounded-2xl p-6 mb-4 flex flex-col items-center justify-center text-center text-xs">
                      <Wrench className="size-6 text-emerald-500/40 mb-2" />
                      <span className="font-bold text-emerald-600 dark:text-emerald-500">Rampa Livre</span>
                      <p className="text-[9px] text-muted-foreground mt-0.5 max-w-[160px]">Nenhum veículo em andamento no momento</p>
                    </div>
                  )}

                  {/* Fila de Espera */}
                  <div className="border-t border-dashed border-border/80 pt-4">
                    <div className="flex items-center gap-1 text-[9px] uppercase font-bold text-muted-foreground tracking-wider mb-2.5 geist-mono">
                      <Clock className="size-3" />
                      <span>Fila de Espera ({mech.queue.length})</span>
                    </div>

                    {mech.queue.length > 0 ? (
                      <div className="space-y-1.5">
                        {mech.queue.map((q, idx) => (
                          <div key={q.id} className="bg-muted/30 hover:bg-muted/50 border border-border/30 rounded-xl p-2.5 flex items-center justify-between text-xs transition-colors">
                            <div>
                              <span className="font-bold text-foreground block truncate max-w-[150px]">{q.vehicle}</span>
                              <span className="text-[9px] text-muted-foreground font-normal">OS #{q.osNumber}</span>
                            </div>
                            <span className="text-[8px] border border-border px-1.5 py-0.5 rounded-none font-bold uppercase tracking-wider text-muted-foreground bg-background">
                              {q.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted-foreground/40 text-[9px] block italic text-center py-2">Fila vazia</span>
                    )}
                  </div>

                </div>

              </motion.div>
            )
          })}
        </div>
      )}

    </div>
  )
}
