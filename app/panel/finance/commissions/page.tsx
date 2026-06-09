"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { 
  Percent, 
  User, 
  DollarSign, 
  Calendar, 
  Clock, 
  Activity, 
  X, 
  Info,
  ChevronRight,
  TrendingUp,
  Award
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

// Import Server Action
import { getCommissionsDataAction } from "@/lib/actions/commissions-actions"

interface ExecutedService {
  osNumber: number
  serviceName: string
  value: number
  date: Date | string
}

interface MechanicReport {
  id: string
  name: string
  email: string
  commissionRate: number
  totalServicesValue: number
  commissionDue: number
  servicesCount: number
  servicesList: ExecutedService[]
}

export default function CommissionsPage() {
  const [reports, setReports] = useState<MechanicReport[]>([])
  const [loading, setLoading] = useState(true)
  const [periodDays, setPeriodDays] = useState(30)
  const [selectedMechanic, setSelectedMechanic] = useState<MechanicReport | null>(null)

  const loadData = async (days: number) => {
    setLoading(true)
    try {
      const res = await getCommissionsDataAction(days)
      if (res.success && res.data) {
        setReports(res.data as unknown as MechanicReport[])
        // If a mechanic was selected, update their details from the new dataset
        if (selectedMechanic) {
          const updated = (res.data as unknown as MechanicReport[]).find(m => m.id === selectedMechanic.id)
          if (updated) setSelectedMechanic(updated)
        }
      }
    } catch (err) {
      console.error("Erro ao obter comissões:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData(periodDays)
  }, [periodDays])

  // Formatter helpers
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val)
  }

  const formatDate = (d: Date | string) => {
    return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })
  }

  // Calculate global totals
  const totalVolume = reports.reduce((acc, r) => acc + r.totalServicesValue, 0)
  const totalCommissions = reports.reduce((acc, r) => acc + r.commissionDue, 0)

  return (
    <div className="flex-1 p-4 md:p-6 bg-[#FAF9F6] dark:bg-zinc-950 min-h-screen font-sans space-y-6">
      
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <span className="bg-emerald-500/10 text-emerald-500 p-1.5 rounded-lg border border-emerald-500/20">
              <Award className="size-4.5" />
            </span>
            Relatório de Comissões
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Cálculo automatizado de comissões por produtividade com base na mão de obra executada.
          </p>
        </div>

        {/* Period Filter Buttons */}
        <div className="flex gap-1 bg-card border border-border/50 p-1 rounded-full shadow-xs self-start md:self-auto">
          {[7, 15, 30, 90].map(days => (
            <button
              key={days}
              onClick={() => setPeriodDays(days)}
              className={cn(
                "h-7 px-3 text-[10px] font-bold uppercase rounded-full transition-all cursor-pointer",
                periodDays === days 
                  ? "bg-foreground text-background shadow-xs" 
                  : "bg-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {days} Dias
            </button>
          ))}
        </div>
      </div>

      {loading && reports.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground text-xs font-medium">
          Calculando comissões da equipe técnica...
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* Summary Cards */}
          <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* KPI 1: Volume */}
            <div className="relative group overflow-hidden bg-card p-5 rounded-3xl border border-border/50 shadow-[0_10px_50px_-12px_rgba(0,0,0,0.05)] hover:border-emerald-500/30 transition-all cursor-pointer text-card-foreground">
              <div className="absolute top-0 right-0 size-20 bg-emerald-500/5 rounded-bl-full" />
              <div className="space-y-3">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Mão de Obra Faturada</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-black text-emerald-500 dark:text-emerald-450 tracking-tight">
                    {formatCurrency(totalVolume).replace("R$", "")}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-medium">BRL</span>
                </div>
                <div className="text-[9px] text-muted-foreground uppercase font-bold">
                  Somatório de serviços executados
                </div>
              </div>
            </div>

            {/* KPI 2: Provisão */}
            <div className="relative group overflow-hidden bg-card p-5 rounded-3xl border border-border/50 shadow-[0_10px_50px_-12px_rgba(0,0,0,0.05)] hover:border-cyan-500/30 transition-all cursor-pointer text-card-foreground">
              <div className="absolute top-0 right-0 size-20 bg-cyan-500/5 rounded-bl-full" />
              <div className="space-y-3">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Total de Comissões Devidas</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-black text-cyan-500 dark:text-cyan-450 tracking-tight">
                    {formatCurrency(totalCommissions).replace("R$", "")}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-medium">BRL</span>
                </div>
                <div className="text-[9px] text-muted-foreground uppercase font-bold">
                  Provisão para pagamento da equipe
                </div>
              </div>
            </div>

          </section>

          {/* Double column layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left Column: Mechanics List - 7 Columns */}
            <section className="lg:col-span-7 bg-card rounded-3xl shadow-[0_10px_50px_-12px_rgba(0,0,0,0.05)] border border-border/50 overflow-hidden text-card-foreground p-5 space-y-4">
              <div className="flex items-center justify-between pb-3.5 border-b border-dashed border-border">
                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                  <User className="size-4 text-emerald-500" />
                  Membros da Equipe Técnica
                </h3>
              </div>

              {reports.length > 0 ? (
                <div className="space-y-3">
                  {reports.map(m => (
                    <div 
                      key={m.id}
                      onClick={() => setSelectedMechanic(m)}
                      className={cn(
                        "p-4 border rounded-2xl transition-all cursor-pointer flex items-center justify-between group",
                        selectedMechanic?.id === m.id 
                          ? "bg-emerald-500/5 border-emerald-500/30 dark:bg-emerald-500/5" 
                          : "bg-muted/10 border-border/40 hover:bg-muted/20"
                      )}
                    >
                      <div className="space-y-1">
                        <h4 className="font-extrabold text-sm text-foreground uppercase tracking-tight">
                          {m.name}
                        </h4>
                        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                          <span className="uppercase">{m.email}</span>
                          <span className="flex items-center gap-1 text-emerald-500 font-bold">
                            <Percent className="size-3" />
                            {m.commissionRate}% taxa
                          </span>
                        </div>
                      </div>

                      <div className="text-right flex items-center gap-4">
                        <div>
                          <span className="text-[10px] text-muted-foreground block font-bold uppercase">Comissão</span>
                          <span className="text-sm font-black text-emerald-500 font-mono">
                            {formatCurrency(m.commissionDue)}
                          </span>
                        </div>
                        <ChevronRight className="size-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 border border-dashed border-border rounded-2xl">
                  <p className="text-xs text-muted-foreground italic uppercase">
                    Nenhum mecânico cadastrado no sistema.
                  </p>
                </div>
              )}
            </section>

            {/* Right Column: Dynamic Extrato (Statement) - 5 Columns */}
            <section className="lg:col-span-5">
              {selectedMechanic ? (
                <div className="bg-card rounded-3xl shadow-[0_10px_50px_-12px_rgba(0,0,0,0.05)] border border-border/50 overflow-hidden text-card-foreground p-5 space-y-4 min-h-[400px]">
                  
                  {/* Title & Header */}
                  <div className="flex justify-between items-start pb-3.5 border-b border-dashed border-border">
                    <div>
                      <span className="text-[9px] font-black uppercase text-emerald-500 tracking-widest block">
                        Extrato Detalhado
                      </span>
                      <h3 className="text-sm font-black text-foreground uppercase tracking-tight mt-0.5">
                        {selectedMechanic.name}
                      </h3>
                      <span className="text-[10px] text-muted-foreground uppercase font-medium">
                        Taxa acordada: {selectedMechanic.commissionRate}%
                      </span>
                    </div>

                    <button 
                      onClick={() => setSelectedMechanic(null)}
                      className="text-muted-foreground hover:text-foreground transition-colors p-1"
                    >
                      <X className="size-4" />
                    </button>
                  </div>

                  {/* Summary Box */}
                  <div className="grid grid-cols-2 gap-4 bg-muted/20 p-4 border border-border/50 rounded-2xl text-xs">
                    <div>
                      <span className="text-[9px] text-muted-foreground uppercase font-bold">Produção</span>
                      <p className="text-foreground font-extrabold mt-0.5 font-mono">
                        {formatCurrency(selectedMechanic.totalServicesValue)}
                      </p>
                    </div>
                    <div>
                      <span className="text-[9px] text-emerald-500 uppercase font-bold">Total a Pagar</span>
                      <p className="text-emerald-500 font-black mt-0.5 font-mono">
                        {formatCurrency(selectedMechanic.commissionDue)}
                      </p>
                    </div>
                  </div>

                  {/* Services List */}
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Clock className="size-3.5 text-emerald-500" />
                      Serviços Executados ({selectedMechanic.servicesCount})
                    </h4>

                    {selectedMechanic.servicesList.length > 0 ? (
                      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 no-scrollbar">
                        {selectedMechanic.servicesList.map((srv, index) => {
                          const itemComm = (selectedMechanic.commissionRate / 100) * srv.value;
                          return (
                            <div 
                              key={index}
                              className="p-3 bg-muted/10 border border-border/40 rounded-xl flex items-center justify-between text-xs font-medium"
                            >
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="bg-muted px-1.5 py-0.5 text-[9px] font-bold rounded-sm border border-border text-muted-foreground font-mono">
                                    OS #{String(srv.osNumber).padStart(4, "0")}
                                  </span>
                                  <span className="text-[10px] text-muted-foreground">{formatDate(srv.date)}</span>
                                </div>
                                <span className="font-bold text-foreground uppercase block line-clamp-1">
                                  {srv.serviceName}
                                </span>
                              </div>

                              <div className="text-right">
                                <span className="text-[10px] text-muted-foreground block font-mono">
                                  {formatCurrency(srv.value)}
                                </span>
                                <span className="font-black text-emerald-500 font-mono">
                                  + {formatCurrency(itemComm)}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="py-8 text-center border border-dashed border-border rounded-xl">
                        <p className="text-[10px] text-muted-foreground italic uppercase">
                          Nenhum serviço faturado neste período.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="bg-muted/20 p-4 border border-border/50 rounded-2xl flex gap-3 text-[10px] text-muted-foreground leading-relaxed mt-4">
                    <Info className="size-4 text-muted-foreground shrink-0 mt-0.5" />
                    <p>
                      Cálculos gerados de forma analítica sobre itens com status "Aprovado" em OSs de status "Entregue" e faturamento "Pago".
                    </p>
                  </div>

                </div>
              ) : (
                <div className="bg-card rounded-3xl shadow-[0_10px_50px_-12px_rgba(0,0,0,0.05)] border border-border/50 min-h-[400px] flex flex-col items-center justify-center p-8 text-center">
                  <Award className="size-12 text-muted-foreground/30 mb-4 animate-pulse" />
                  <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    Selecione um Profissional
                  </h4>
                  <p className="text-muted-foreground text-xs mt-1 max-w-xs font-medium">
                    Selecione um mecânico na lista ao lado para ver o extrato de ordens de serviço executadas e o cálculo analítico da comissão.
                  </p>
                </div>
              )}
            </section>

          </div>

        </div>
      )}

    </div>
  )
}

