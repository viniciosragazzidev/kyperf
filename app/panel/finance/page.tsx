"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { 
  DollarSign, 
  TrendingUp, 
  Package, 
  Activity, 
  Calendar, 
  ArrowRight, 
  Percent, 
  Wrench, 
  CreditCard,
  Briefcase
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

// Import Server Action
import { getFinanceDataAction } from "@/lib/actions/finance-actions"

interface Transaction {
  id: string
  osNumber: number
  customerName: string
  vehicleModel: string
  plate: string
  paymentMethod: string
  createdAt: Date | string
  totalPrice: number
  partsCost: number
  margin: number
}

interface FinanceData {
  totalRevenue: number
  totalPartsCost: number
  grossProfit: number
  grossMarginPercent: number
  servicesRevenue: number
  partsRevenue: number
  transactions: Transaction[]
}

export default function FinancePage() {
  const [data, setData] = useState<FinanceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [periodDays, setPeriodDays] = useState(30)

  const loadData = async (days: number) => {
    setLoading(true)
    try {
      const res = await getFinanceDataAction(days)
      if (res.success && res.data) {
        setData(res.data as unknown as FinanceData)
      }
    } catch (err) {
      console.error("Erro ao obter dados financeiros:", err)
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
  };

  const formatDate = (d: Date | string) => {
    return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })
  }

  const formatPlate = (plate: string) => {
    if (plate.length === 7) return `${plate.slice(0, 3)}-${plate.slice(3)}`
    return plate
  }

  return (
    <div className="flex-1 p-4 md:p-6 bg-[#FAF9F6] dark:bg-zinc-950 min-h-screen font-sans space-y-6">
      
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <span className="bg-emerald-500/10 text-emerald-500 p-1.5 rounded-lg border border-emerald-500/20">
              <DollarSign className="size-4.5" />
            </span>
            Fluxo de Caixa
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Controle de receitas recebidas de Ordens de Serviço faturadas e margens brutas.
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

      {loading ? (
        <div className="text-center py-20 text-muted-foreground text-xs font-medium">
          Calculando fluxo de caixa do período...
        </div>
      ) : data ? (
        <div className="space-y-6">
          
          {/* KPI Dashboard */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* KPI 1: Faturamento */}
            <div className="relative group overflow-hidden bg-card p-5 rounded-3xl border border-border/50 shadow-[0_10px_50px_-12px_rgba(0,0,0,0.05)] hover:border-emerald-500/30 transition-all cursor-pointer text-card-foreground">
              <div className="absolute top-0 right-0 size-20 bg-emerald-500/5 rounded-bl-full" />
              <div className="space-y-3">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Receita Total</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-black text-emerald-500 dark:text-emerald-450 tracking-tight">
                    {formatCurrency(data.totalRevenue).replace("R$", "")}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-medium">BRL</span>
                </div>
                <div className="text-[9px] text-muted-foreground uppercase font-bold">
                  Soma de OSs Pagas
                </div>
              </div>
            </div>

            {/* KPI 2: Custo Peças */}
            <div className="relative group overflow-hidden bg-card p-5 rounded-3xl border border-border/50 shadow-[0_10px_50px_-12px_rgba(0,0,0,0.05)] hover:border-red-500/30 transition-all cursor-pointer text-card-foreground">
              <div className="absolute top-0 right-0 size-20 bg-red-500/5 rounded-bl-full" />
              <div className="space-y-3">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Custo de Peças</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-black text-red-500 dark:text-red-450 tracking-tight">
                    {formatCurrency(data.totalPartsCost).replace("R$", "")}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-medium">BRL</span>
                </div>
                <div className="text-[9px] text-muted-foreground uppercase font-bold">
                  Custo de Aquisição (CMV)
                </div>
              </div>
            </div>

            {/* KPI 3: Lucro Bruto */}
            <div className="relative group overflow-hidden bg-card p-5 rounded-3xl border border-border/50 shadow-[0_10px_50px_-12px_rgba(0,0,0,0.05)] hover:border-cyan-500/30 transition-all cursor-pointer text-card-foreground">
              <div className="absolute top-0 right-0 size-20 bg-cyan-500/5 rounded-bl-full" />
              <div className="space-y-3">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Lucro Bruto</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-black text-cyan-500 dark:text-cyan-450 tracking-tight">
                    {formatCurrency(data.grossProfit).replace("R$", "")}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-medium">BRL</span>
                </div>
                <div className="text-[9px] text-muted-foreground uppercase font-bold">
                  Receita menos Custo de Peças
                </div>
              </div>
            </div>

            {/* KPI 4: Margem de Lucro */}
            <div className="relative group overflow-hidden bg-card p-5 rounded-3xl border border-border/50 shadow-[0_10px_50px_-12px_rgba(0,0,0,0.05)] hover:border-amber-500/30 transition-all cursor-pointer text-card-foreground">
              <div className="absolute top-0 right-0 size-20 bg-amber-500/5 rounded-bl-full" />
              <div className="space-y-3">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Margem Bruta %</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-black text-amber-500 dark:text-amber-400 tracking-tight">
                    {data.grossMarginPercent.toFixed(1)}%
                  </span>
                  <span className="text-[10px] text-muted-foreground font-medium">Percentual</span>
                </div>
                <div className="text-[9px] text-muted-foreground uppercase font-bold">
                  Rentabilidade do Catálogo
                </div>
              </div>
            </div>

          </section>

          {/* Double Column content */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left column: Revenue Breakdown - 4 columns */}
            <section className="lg:col-span-4 bg-card rounded-3xl shadow-[0_10px_50px_-12px_rgba(0,0,0,0.05)] border border-border/50 overflow-hidden text-card-foreground p-5 space-y-4">
              <div className="flex items-center justify-between pb-3.5 border-b border-dashed border-border">
                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                  <Activity className="size-4 text-emerald-500" />
                  Composição da Receita
                </h3>
              </div>

              <div className="space-y-5 text-xs">
                {/* Services percentage */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground font-bold flex items-center gap-1.5">
                      <Briefcase className="size-3.5 text-indigo-500" /> Mão de Obra (Serviços)
                    </span>
                    <span className="font-extrabold text-foreground font-mono">
                      {formatCurrency(data.servicesRevenue)}
                    </span>
                  </div>
                  <div className="h-2 w-full bg-muted/65 rounded-full overflow-hidden border border-border/10">
                    <div 
                      className="h-full bg-indigo-500 rounded-full" 
                      style={{ width: `${data.totalRevenue > 0 ? (data.servicesRevenue / data.totalRevenue) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                {/* Parts percentage */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground font-bold flex items-center gap-1.5">
                      <Package className="size-3.5 text-emerald-500" /> Insumos (Peças)
                    </span>
                    <span className="font-extrabold text-foreground font-mono">
                      {formatCurrency(data.partsRevenue)}
                    </span>
                  </div>
                  <div className="h-2 w-full bg-muted/65 rounded-full overflow-hidden border border-border/10">
                    <div 
                      className="h-full bg-emerald-500 rounded-full" 
                      style={{ width: `${data.totalRevenue > 0 ? (data.partsRevenue / data.totalRevenue) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                <div className="p-3.5 bg-muted/20 text-muted-foreground border border-border/50 rounded-2xl space-y-2 mt-4 text-[10px] leading-relaxed">
                  <p>
                    <strong>Mão de Obra:</strong> representa receitas com mão de obra pura. Possui margem de lucro de quase 100% (excluindo comissões de mecânicos).
                  </p>
                  <p>
                    <strong>Insumos:</strong> são peças físicas retiradas do estoque, que possuem custo de aquisição.
                  </p>
                </div>
              </div>
            </section>

            {/* Right column: Transaction List - 8 columns */}
            <section className="lg:col-span-8 bg-card rounded-3xl shadow-[0_10px_50px_-12px_rgba(0,0,0,0.05)] border border-border/50 overflow-hidden text-card-foreground p-5 space-y-4">
              <div className="flex items-center justify-between pb-3.5 border-b border-dashed border-border">
                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                  <CreditCard className="size-4 text-emerald-500" />
                  Receitas Realizadas
                </h3>
              </div>

              {data.transactions.length > 0 ? (
                <div className="overflow-x-auto max-h-[400px] pr-1 no-scrollbar">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-muted/50 border-b border-border/50 text-[9px] uppercase font-bold text-muted-foreground tracking-wider">
                        <th className="px-4 py-3">Data</th>
                        <th className="px-4 py-3">OS</th>
                        <th className="px-4 py-3">Cliente / Carro</th>
                        <th className="px-4 py-3">Pagamento</th>
                        <th className="px-4 py-3 text-right">Valor</th>
                        <th className="px-4 py-3 text-right">Lucro</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.transactions.map(t => (
                        <tr key={t.id} className="border-b border-dashed border-border/60 hover:bg-muted/30 transition-colors text-xs font-semibold text-foreground">
                          <td className="px-4 py-3 text-muted-foreground font-mono font-medium">{formatDate(t.createdAt)}</td>
                          <td className="px-4 py-3 text-foreground font-bold font-mono">#{String(t.osNumber).padStart(4, "0")}</td>
                          <td className="px-4 py-3">
                            <span className="font-bold uppercase block">{t.customerName}</span>
                            <span className="text-[9px] text-muted-foreground uppercase">{t.vehicleModel} · {formatPlate(t.plate)}</span>
                          </td>
                          <td className="px-4 py-3 uppercase text-muted-foreground font-mono font-medium">{t.paymentMethod}</td>
                          <td className="px-4 py-3 text-right text-emerald-500 font-extrabold font-mono">{formatCurrency(t.totalPrice)}</td>
                          <td className="px-4 py-3 text-right text-cyan-500 font-bold font-mono">{formatCurrency(t.margin)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 border border-dashed border-border rounded-2xl">
                  <p className="text-xs text-muted-foreground italic uppercase">
                    Nenhuma receita faturada no período selecionado.
                  </p>
                </div>
              )}
            </section>

          </div>

        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground text-xs font-medium">
          Erro ao obter fluxo financeiro.
        </div>
      )}

    </div>
  )
}
