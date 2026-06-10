"use client"

import React, { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Wrench, 
  Plus, 
  Search, 
  Trash2, 
  Edit2, 
  Loader2, 
  Check, 
  AlertCircle, 
  Info, 
  Car, 
  User, 
  Calendar, 
  Clock, 
  FileText, 
  DollarSign, 
  ChevronRight, 
  X, 
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Printer,
  ChevronDown,
  AlertTriangle,
  Phone
} from "lucide-react"
import { 
  getWorkOrdersAction, 
  deleteWorkOrderAction, 
  updateWorkOrderAction, 
  getWorkOrderAction,
  getMechanicsAction 
} from "@/lib/actions/orders-actions"
import { sendDirectWhatsappAction } from "@/lib/actions/whatsapp-actions"
import { toast } from "sonner"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import dynamic from "next/dynamic"

const ThermalPrinterCard = dynamic(
  () => import("@/components/pdf/thermal-printer-card").then((m) => ({ default: m.ThermalPrinterCard })),
  {
    ssr: false,
    loading: () => (
      <div className="rounded-2xl border border-border bg-card p-4 flex items-center gap-2 animate-pulse" style={{ minWidth: 240 }}>
        <Printer className="size-4 text-muted-foreground" />
        <span className="text-[10px] text-muted-foreground">Carregando...</span>
      </div>
    ),
  }
)

const springConfig = { type: "spring" as const, stiffness: 300, damping: 28 }

interface WorkOrderSummary {
  id: string
  osNumber: number
  status: 'CHECK_IN' | 'AWAITING_BUDGET' | 'AWAITING_APPROVAL' | 'AWAITING_PARTS' | 'IN_PROGRESS' | 'TESTING_WASHING' | 'READY' | 'DELIVERED'
  paymentStatus: 'PENDING' | 'PAID' | 'LATE'
  createdAt: Date
  statusChangedAt: Date | string | null
  customerName: string
  vehiclePlate: string
  vehicleBrand: string
  vehicleModel: string
  mechanicName: string | null
  discount: string | null
  surcharge: string | null
  totalApproved: number
  totalGeneral: number
  grandTotal: number
}

interface Mechanic {
  id: string
  name: string
  email: string
  commissionRate: string
}

const STATUS_LABELS: Record<string, string> = {
  CHECK_IN: "Check-in",
  AWAITING_BUDGET: "Orçamento",
  AWAITING_APPROVAL: "Aprovação",
  AWAITING_PARTS: "Peças",
  IN_PROGRESS: "Execução",
  TESTING_WASHING: "Teste/Lavagem",
  READY: "Pronto",
  DELIVERED: "Entregue"
}

const STATUS_COLORS: Record<string, { bg: string, text: string, border: string }> = {
  CHECK_IN: { bg: "bg-blue-500/10", text: "text-blue-500", border: "border-blue-500/20" },
  AWAITING_BUDGET: { bg: "bg-amber-500/10", text: "text-amber-500", border: "border-amber-500/20" },
  AWAITING_APPROVAL: { bg: "bg-yellow-500/10", text: "text-yellow-600 dark:text-yellow-500", border: "border-yellow-500/20" },
  AWAITING_PARTS: { bg: "bg-purple-500/10", text: "text-purple-500", border: "border-purple-500/20" },
  IN_PROGRESS: { bg: "bg-indigo-500/10", text: "text-indigo-500", border: "border-indigo-500/20" },
  TESTING_WASHING: { bg: "bg-pink-500/10", text: "text-pink-500", border: "border-pink-500/20" },
  READY: { bg: "bg-emerald-500/10", text: "text-emerald-500", border: "border-emerald-500/20" },
  DELIVERED: { bg: "bg-zinc-500/10", text: "text-zinc-500", border: "border-zinc-500/20" }
}

const PAYMENT_LABELS: Record<string, string> = {
  PENDING: "Pendente",
  PAID: "Pago",
  LATE: "Atrasado"
}

const PAYMENT_COLORS: Record<string, { bg: string, text: string }> = {
  PENDING: { bg: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-500", bgRaw: "bg-yellow-500" },
  PAID: { bg: "bg-emerald-500/10 text-emerald-500", bgRaw: "bg-emerald-500" },
  LATE: { bg: "bg-red-500/10 text-red-500", bgRaw: "bg-red-500" }
} as any

// ─── Printer Popover ─────────────────────────────────────────────────────────
function PrinterPopover({
  orderId,
  osNumber,
  status,
}: {
  orderId: string;
  osNumber: number;
  status: string;
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open])

  return (
    <div className="relative" ref={ref}>
      <Button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="bg-muted hover:bg-muted/80 text-foreground font-bold text-[10px] rounded-lg p-2.5 transition-all flex items-center gap-1.5"
        title="Gerar PDF / Imprimir"
      >
        <Printer className="size-4" />
        Imprimir
      </Button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="absolute bottom-full mb-2 left-0 z-50"
            style={{ minWidth: 280 }}
          >
            <ThermalPrinterCard
              orderId={orderId}
              osNumber={osNumber}
              status={status}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}


export default function OrdersPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<WorkOrderSummary[]>([])
  const [mechanics, setMechanics] = useState<Mechanic[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("ALL")
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState("")
  const [successMessage, setSuccessMessage] = useState("")

  // Estado da OS selecionada para detalhes / edição rápida
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<any | null>(null)
  const [drawerItems, setDrawerItems] = useState<any[]>([])
  const [isLoadingDetails, setIsLoadingDetails] = useState(false)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  // Estados para edição rápida no drawer
  const [editStatus, setEditStatus] = useState<string>("")
  const [editMechanicId, setEditMechanicId] = useState<string>("")
  const [editPaymentStatus, setEditPaymentStatus] = useState<string>("")
  const [editAllocatedBox, setEditAllocatedBox] = useState<string>("")
  const [editNotes, setEditNotes] = useState<string>("")
  const [editDiagnostic, setEditDiagnostic] = useState<string>("")
  const [isSavingDetails, setIsSavingDetails] = useState(false)
  const [sendingWhatsapp, setSendingWhatsapp] = useState(false)

  // Confirmação de exclusão
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Carrega Ordens de Serviço e Mecânicos
  const loadInitialData = async () => {
    setIsLoading(true)
    const [ordersRes, mechRes] = await Promise.all([
      getWorkOrdersAction(),
      getMechanicsAction()
    ])
    setIsLoading(false)

    if (ordersRes.success && ordersRes.data) {
      setOrders(ordersRes.data as WorkOrderSummary[])
    } else {
      setErrorMessage(ordersRes.error || "Erro ao carregar Ordens de Serviço.")
    }

    if (mechRes.success && mechRes.data) {
      setMechanics(mechRes.data as Mechanic[])
    }
  }

  useEffect(() => {
    loadInitialData()
  }, [])

  // Limpeza de mensagens
  useEffect(() => {
    if (successMessage || errorMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage("")
        setErrorMessage("")
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [successMessage, errorMessage])

  // Abre drawer de detalhes e faz fetch assíncrono dos dados completos da O.S.
  const handleOpenDrawer = async (orderId: string) => {
    setSelectedOrderId(orderId)
    setIsLoadingDetails(true)
    setIsDrawerOpen(true)
    
    const res = await getWorkOrderAction(orderId)
    setIsLoadingDetails(false)
    
    if (res.success && res.data) {
      const details = res.data
      setSelectedOrderDetails(details)
      setDrawerItems(details.items || [])
      
      // Preenche estados de edição rápida
      setEditStatus(details.status)
      setEditMechanicId(details.mechanicId || "")
      setEditPaymentStatus(details.paymentStatus)
      setEditAllocatedBox(details.allocatedBox || "")
      setEditNotes(details.notes || "")
      setEditDiagnostic(details.diagnostic || "")
    } else {
      setErrorMessage(res.error || "Erro ao carregar dados detalhados da O.S.")
      setIsDrawerOpen(false)
    }
  }

  const triggerBackgroundQuickEditUpdate = (payload: any, originalOrders: WorkOrderSummary[]) => {
    const mechName = mechanics.find(m => m.id === payload.mechanicId)?.name || null
    setOrders(prev => prev.map(o => o.id === payload.id ? {
      ...o,
      status: payload.status,
      paymentStatus: payload.paymentStatus,
      mechanicName: mechName,
    } : o))

    updateWorkOrderAction(payload).then(res => {
      if (res.success) {
        toast.success("Ordem de Serviço atualizada com sucesso!")
      } else {
        setOrders(originalOrders)
        toast.error("Erro ao salvar alterações na OS. Quer tentar novamente?", {
          action: {
            label: "Tentar Novamente",
            onClick: () => triggerBackgroundQuickEditUpdate(payload, originalOrders)
          }
        })
      }
    }).catch(() => {
      setOrders(originalOrders)
      toast.error("Erro de conexão. Quer tentar novamente?", {
        action: {
          label: "Tentar Novamente",
          onClick: () => triggerBackgroundQuickEditUpdate(payload, originalOrders)
        }
      })
    })
  }

  // Salva alterações rápidas feitas no Drawer
  const handleSaveQuickEdits = async () => {
    if (!selectedOrderId) return

    const originalOrders = [...orders]
    const currentOrderId = selectedOrderId
    const payload = {
      id: selectedOrderId,
      status: editStatus as any,
      mechanicId: editMechanicId || null,
      paymentStatus: editPaymentStatus as any,
      allocatedBox: editAllocatedBox,
      notes: editNotes,
      diagnostic: editDiagnostic,
      items: drawerItems.map(it => ({
        type: it.type,
        partId: it.type === 'PART' ? it.partId : undefined,
        serviceId: it.type === 'SERVICE' ? it.serviceId : undefined,
        customName: it.customName || undefined,
        quantity: it.quantity,
        unitCostPrice: it.unitCostPrice,
        unitSalePrice: it.unitSalePrice,
        isApproved: it.isApproved
      }))
    }

    // Calcular novo total aprovado localmente
    const approvedVal = drawerItems
      .filter((i: any) => i.isApproved === 1)
      .reduce((acc: number, curr: any) => acc + (curr.quantity * parseFloat(curr.unitSalePrice)), 0)
    const disc = parseFloat(selectedOrderDetails?.discount || '0')
    const sur = parseFloat(selectedOrderDetails?.surcharge || '0')
    const calculatedGrandTotal = Math.max(0, approvedVal - disc + sur)
    const mechName = mechanics.find(m => m.id === editMechanicId)?.name || null

    // Atualização otimista
    setOrders(prev => prev.map(o => o.id === currentOrderId ? {
      ...o,
      status: editStatus as any,
      paymentStatus: editPaymentStatus as any,
      mechanicName: mechName,
      grandTotal: calculatedGrandTotal,
      totalApproved: approvedVal
    } : o))

    setIsDrawerOpen(false)

    // Despacha em background
    updateWorkOrderAction(payload as any).then(res => {
      if (res.success) {
        toast.success("Ordem de Serviço atualizada com sucesso!")
      } else {
        setOrders(originalOrders)
        toast.error("Erro ao salvar alterações na OS. Quer tentar novamente?", {
          action: {
            label: "Tentar Novamente",
            onClick: () => triggerBackgroundQuickEditUpdate(payload, originalOrders)
          }
        })
      }
    }).catch(() => {
      setOrders(originalOrders)
      toast.error("Erro de conexão ao salvar alterações. Quer tentar novamente?", {
        action: {
          label: "Tentar Novamente",
          onClick: () => triggerBackgroundQuickEditUpdate(payload, originalOrders)
        }
      })
    })
  }

  const handleUpdateDrawerItemApproval = (itemId: string, status: number) => {
    setDrawerItems(prev => prev.map(it => {
      if (it.id === itemId) {
        return { ...it, isApproved: status }
      }
      return it
    }))
  }

  const handleApproveAllDrawerItems = () => {
    setDrawerItems(prev => prev.map(it => ({ ...it, isApproved: 1 })))
    setEditStatus("IN_PROGRESS") // Avança status automaticamente ao aprovar orçamento
  }

  const handleDeleteOrderRetry = (orderId: string, originalOrders: WorkOrderSummary[]) => {
    setOrders(prev => prev.filter(o => o.id !== orderId))
    deleteWorkOrderAction(orderId).then(res => {
      if (res.success) {
        toast.success("Ordem de Serviço excluída com sucesso!")
      } else {
        setOrders(originalOrders)
        toast.error("Erro ao excluir. Quer tentar novamente?", {
          action: {
            label: "Tentar Novamente",
            onClick: () => handleDeleteOrderRetry(orderId, originalOrders)
          }
        })
      }
    }).catch(() => {
      setOrders(originalOrders)
      toast.error("Erro de conexão ao excluir.", {
        action: {
          label: "Tentar Novamente",
          onClick: () => handleDeleteOrderRetry(orderId, originalOrders)
        }
      })
    })
  }

  // Deleta ordem de serviço
  const handleDeleteOrder = async () => {
    if (!orderToDelete) return
    const originalOrders = [...orders]
    const currentOrderId = orderToDelete

    // Optimistically remove the order
    setOrders(prev => prev.filter(o => o.id !== currentOrderId))
    setOrderToDelete(null)

    deleteWorkOrderAction(currentOrderId).then(res => {
      if (res.success) {
        toast.success("Ordem de Serviço excluída com sucesso!")
      } else {
        setOrders(originalOrders)
        toast.error("Erro ao excluir a Ordem de Serviço. Quer tentar novamente?", {
          action: {
            label: "Tentar Novamente",
            onClick: () => handleDeleteOrderRetry(currentOrderId, originalOrders)
          }
        })
      }
    }).catch(() => {
      setOrders(originalOrders)
      toast.error("Erro de conexão ao excluir a Ordem de Serviço. Quer tentar novamente?", {
        action: {
          label: "Tentar Novamente",
          onClick: () => handleDeleteOrderRetry(currentOrderId, originalOrders)
        }
      })
    })
  }

  // Filtro de Busca & Status Tabs
  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.osNumber.toString().includes(searchTerm) ||
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.vehiclePlate.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.vehicleBrand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.vehicleModel.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "ALL" || order.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Contadores para as tabs de status
  const getCountForStatus = (status: string) => {
    if (status === "ALL") return orders.length
    return orders.filter(o => o.status === status).length
  }

  // Status resumidos das ordens para cartões de métricas superiores
  const totalActive = orders.filter(o => o.status !== 'DELIVERED').length
  const awaitingApproval = orders.filter(o => o.status === 'AWAITING_APPROVAL' || o.status === 'AWAITING_BUDGET').length
  const readyToDeliver = orders.filter(o => o.status === 'READY').length
  const totalRevenue = orders
    .filter(o => o.status === 'DELIVERED' && o.paymentStatus === 'PAID')
    .reduce((acc, curr) => acc + curr.grandTotal, 0)

  return (
    <div className="flex-1 p-4 md:p-6 bg-[#FAF9F6] dark:bg-zinc-950 min-h-screen font-sans">
      
      {/* 📋 SEO Friendly Page Title & Tags */}
      <h1 className="sr-only">Ordens de Serviço - Painel de Controle</h1>

      {/* Cabeçalho Principal */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-emerald-500/10 text-emerald-500 p-1.5 rounded-lg border border-emerald-500/20">
              <Wrench className="size-5" />
            </span>
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              Ordens de Serviço (O.S.)
            </h2>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 geist-mono">
            Monitore triagens, gerencie aprovações de orçamentos, acompanhe a esteira de boxes e faturamento.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 self-start md:self-auto">
          {/* Quadro Kanban Button */}
          <Button
            onClick={() => router.push("/panel/orders/kanban")}
            className="bg-purple-600/10 hover:bg-purple-600/20 text-purple-650 dark:text-purple-400 font-extrabold text-xs rounded-none px-4 py-2.5 transition-all border border-purple-600/20 flex items-center gap-1.5 shadow-sm cursor-pointer animate-pulse"
          >
            <Sparkles className="size-3.5" />
            <span>Quadro Kanban / Pátio</span>
          </Button>

          {/* Nova O.S. Button */}
          <Button
            onClick={() => router.push("/panel/orders/new")}
            className="bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs rounded-none px-5 py-2.5 transition-all shadow-md active:scale-95 flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="size-4" />
            Nova O.S.
          </Button>
        </div>
      </div>

      {/* Alertas Rápidos */}
      {successMessage && (
        <div className="mb-4 p-3 bg-emerald-500/10 text-emerald-500 rounded-xl border border-emerald-500/20 text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
          <Check className="size-4" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="mb-4 p-3 bg-red-500/10 text-red-500 rounded-xl border border-red-500/20 text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
          <AlertCircle className="size-4" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 📊 Painel de Métricas Rápidas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Ativas */}
        <div className="bg-card border border-border/50 rounded-2xl p-4 flex items-center justify-between shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)]">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-extrabold tracking-wider text-muted-foreground">O.S. Ativas</span>
            <p className="text-xl font-black text-foreground">{totalActive}</p>
          </div>
          <div className="bg-blue-500/10 text-blue-500 p-2.5 rounded-xl border border-blue-500/20">
            <Wrench className="size-4.5" />
          </div>
        </div>

        {/* Pendentes de Aprovação */}
        <div className="bg-card border border-border/50 rounded-2xl p-4 flex items-center justify-between shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)]">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-extrabold tracking-wider text-muted-foreground">Orçamentos Pendentes</span>
            <p className="text-xl font-black text-amber-500">{awaitingApproval}</p>
          </div>
          <div className="bg-amber-500/10 text-amber-500 p-2.5 rounded-xl border border-amber-500/20">
            <FileText className="size-4.5" />
          </div>
        </div>

        {/* Prontas para Entrega */}
        <div className="bg-card border border-border/50 rounded-2xl p-4 flex items-center justify-between shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)]">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-extrabold tracking-wider text-muted-foreground">Prontas p/ Retirar</span>
            <p className="text-xl font-black text-emerald-500">{readyToDeliver}</p>
          </div>
          <div className="bg-emerald-500/10 text-emerald-500 p-2.5 rounded-xl border border-emerald-500/20">
            <Check className="size-4.5" />
          </div>
        </div>

        {/* Faturamento Pago */}
        <div className="bg-card border border-border/50 rounded-2xl p-4 flex items-center justify-between shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)]">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-extrabold tracking-wider text-muted-foreground">Faturamento Pago (Entregues)</span>
            <p className="text-xl font-black text-foreground font-mono">
              R$ {totalRevenue.toFixed(2)}
            </p>
          </div>
          <div className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 p-2.5 rounded-xl border border-emerald-500/30">
            <DollarSign className="size-4.5" />
          </div>
        </div>
      </div>

      {/* Filtros e Busca */}
      <div className="bg-card border border-border/50 rounded-2xl p-4 shadow-[0_10px_30px_-15px_rgba(0,0,0,0.02)] space-y-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* Busca por texto */}
          <div className="relative w-full md:max-w-md">
            <span className="absolute left-3 top-3 text-muted-foreground">
              <Search className="size-4" />
            </span>
            <Input
              type="text"
              placeholder="Pesquise por OS, placa, modelo, cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs border border-border rounded-xl pl-9 pr-4 py-2.5 bg-muted/20 focus:bg-card focus:outline-hidden text-foreground placeholder:text-muted-foreground"
            />
            {searchTerm && (
              <Button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-3.5 text-muted-foreground hover:text-foreground text-[10px] font-bold"
              >
                Limpar
              </Button>
            )}
          </div>

          {/* Atalho rápido */}
          <span className="text-[10px] text-muted-foreground hidden lg:inline-flex items-center gap-1 font-bold">
            <Sparkles className="size-3 text-emerald-500" />
            Clique em uma ordem para ver detalhes completos e realizar ações rápidas.
          </span>
        </div>

        {/* Abas Horizontais de Status */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-border/50">
          {[
            { key: "ALL", label: "Todas" },
            { key: "CHECK_IN", label: "Check-in" },
            { key: "AWAITING_BUDGET", label: "Em Orçamento" },
            { key: "AWAITING_APPROVAL", label: "Aprovação" },
            { key: "AWAITING_PARTS", label: "Peças" },
            { key: "IN_PROGRESS", label: "Em Execução" },
            { key: "TESTING_WASHING", label: "Teste/Lavagem" },
            { key: "READY", label: "Pronto" },
            { key: "DELIVERED", label: "Entregues" }
          ].map((tab) => {
            const active = statusFilter === tab.key
            const count = getCountForStatus(tab.key)
            return (
              <Button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                variant={active ? "default" : "outline"}
                className="text-[11px] font-bold px-3 py-1.5 rounded-full transition-all shrink-0 flex items-center gap-1.5"
              >
                <span>{tab.label}</span>
                <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-bold ${
                  active 
                    ? "bg-primary/20 text-primary" 
                    : "bg-muted-foreground/15 text-foreground"
                }`}>
                  {count}
                </span>
              </Button>
            )
          })}
        </div>
      </div>
      {/* 📋 Listagem de Ordens */}
      {isLoading ? (
        <div className="bg-card border border-border/50 rounded-2xl p-6 space-y-4">
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((idx) => (
              <div key={idx} className="flex items-center justify-between py-2.5 border-b border-border/40 last:border-0">
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-1/4 rounded-md animate-pulse" />
                  <Skeleton className="h-3 w-1/3 rounded-md animate-pulse" />
                </div>
                <div className="flex items-center gap-4">
                  <Skeleton className="h-4 w-20 rounded-full animate-pulse" />
                  <Skeleton className="h-6 w-16 rounded-md animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-card border border-border/50 rounded-2xl p-12 text-center flex flex-col items-center justify-center gap-3">
          <div className="bg-muted/40 p-4 rounded-full border border-border">
            <Wrench className="size-6 text-muted-foreground/80" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase text-foreground">Nenhuma ordem encontrada</h3>
            <p className="text-xs text-muted-foreground mt-0.5 max-w-sm geist-mono">
              Não existem ordens de serviço abertas que correspondam ao termo de busca ou ao filtro de status selecionado.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-card border border-border/50 rounded-2xl overflow-hidden shadow-[0_10px_40px_-20px_rgba(0,0,0,0.02)]">
          
          {/* Tabela de Computadores (Desktop) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border/50 bg-muted/10">
                  <th className="p-4 text-[10px] font-extrabold uppercase text-muted-foreground tracking-wider">Nº O.S / Abertura</th>
                  <th className="p-4 text-[10px] font-extrabold uppercase text-muted-foreground tracking-wider">Cliente</th>
                  <th className="p-4 text-[10px] font-extrabold uppercase text-muted-foreground tracking-wider">Veículo</th>
                  <th className="p-4 text-[10px] font-extrabold uppercase text-muted-foreground tracking-wider">Mecânico</th>
                  <th className="p-4 text-[10px] font-extrabold uppercase text-muted-foreground tracking-wider text-center">Status</th>
                  <th className="p-4 text-[10px] font-extrabold uppercase text-muted-foreground tracking-wider text-right">Valor Final</th>
                  <th className="p-4 text-[10px] font-extrabold uppercase text-muted-foreground tracking-wider text-center">Pagamento</th>
                  <th className="p-4 text-[10px] font-extrabold uppercase text-muted-foreground tracking-wider text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {filteredOrders.map((order) => {
                  const statusInfo = STATUS_COLORS[order.status] || STATUS_COLORS.CHECK_IN
                  const payInfo = PAYMENT_COLORS[order.paymentStatus] || PAYMENT_COLORS.PENDING
                  return (
                    <tr 
                      key={order.id} 
                      onClick={() => handleOpenDrawer(order.id)}
                      className="hover:bg-muted/15 transition-all cursor-pointer group"
                    >
                      {/* OS & Abertura */}
                      <td className="p-4">
                        <div className="flex flex-col">
                          <span className="text-xs font-black text-foreground group-hover:text-emerald-500 transition-colors">
                            OS #{order.osNumber.toString().padStart(4, '0')}
                          </span>
                          <span className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1 font-mono">
                            <Calendar className="size-3" />
                            {new Date(order.createdAt).toLocaleDateString('pt-BR')} {new Date(order.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </td>
                      
                      {/* Cliente */}
                      <td className="p-4">
                        <span className="text-xs font-bold text-foreground block">{order.customerName}</span>
                      </td>

                      {/* Veículo */}
                      <td className="p-4">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-foreground block">{order.vehicleBrand} {order.vehicleModel}</span>
                          <span className="text-[9px] uppercase font-black font-mono text-muted-foreground bg-muted/65 px-1.5 py-0.5 rounded-sm border border-border w-max mt-0.5">
                            {order.vehiclePlate}
                          </span>
                        </div>
                      </td>

                      {/* Mecânico */}
                      <td className="p-4">
                        {order.mechanicName ? (
                          <span className="text-xs text-foreground font-semibold flex items-center gap-1">
                            <User className="size-3 text-muted-foreground" />
                            {order.mechanicName}
                          </span>
                        ) : (
                          <span className="text-[10px] text-muted-foreground italic font-medium">Sem mecânico alocado</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="p-4 text-center">
                        <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.75 rounded-full border ${statusInfo.bg} ${statusInfo.text} ${statusInfo.border}`}>
                          {STATUS_LABELS[order.status]}
                        </span>
                      </td>

                      {/* Valor Total */}
                      <td className="p-4 text-right">
                        <div className="flex flex-col items-end">
                          <span className="text-xs font-black text-foreground font-mono">
                            R$ {order.grandTotal.toFixed(2)}
                          </span>
                          {order.totalGeneral > order.totalApproved && (
                            <span className="text-[8.5px] text-muted-foreground line-through font-mono">
                              R$ {order.totalGeneral.toFixed(2)}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Pagamento */}
                      <td className="p-4 text-center">
                        <span className={`inline-flex items-center text-[10px] font-bold px-2.5 py-0.75 rounded-full ${payInfo.bg}`}>
                          {PAYMENT_LABELS[order.paymentStatus]}
                        </span>
                      </td>

                      {/* Ações */}
                      <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            onClick={() => handleOpenDrawer(order.id)}
                            className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-all"
                            title="Visualizar / Ações"
                          >
                            <ChevronRight className="size-4" />
                          </Button>
                          <Button
                            onClick={() => setOrderToDelete(order.id)}
                            className="p-1.5 hover:bg-red-500/10 rounded-lg text-muted-foreground hover:text-red-550 rounded-md border border-transparent hover:border-red-500/20 transition-all"
                            title="Excluir O.S."
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Cards de Mobile */}
          <div className="block md:hidden divide-y divide-border/30">
            {filteredOrders.map((order) => {
              const statusInfo = STATUS_COLORS[order.status] || STATUS_COLORS.CHECK_IN
              const payInfo = PAYMENT_COLORS[order.paymentStatus] || PAYMENT_COLORS.PENDING
              return (
                <div 
                  key={order.id}
                  onClick={() => handleOpenDrawer(order.id)}
                  className="p-4 active:bg-muted/10 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-foreground">
                      OS #{order.osNumber.toString().padStart(4, '0')}
                    </span>
                    <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full border ${statusInfo.bg} ${statusInfo.text} ${statusInfo.border}`}>
                      {STATUS_LABELS[order.status]}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block">Cliente</span>
                      <span className="font-bold text-foreground">{order.customerName}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block">Veículo</span>
                      <span className="font-semibold text-foreground">{order.vehicleBrand} {order.vehicleModel}</span>
                      <span className="text-[9px] uppercase font-bold font-mono text-muted-foreground block mt-0.5">{order.vehiclePlate}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1.5 border-t border-border/20">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full ${payInfo.bg}`}>
                        {PAYMENT_LABELS[order.paymentStatus]}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-black font-mono text-emerald-500 font-bold">R$ {order.grandTotal.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}


      {/* 🚪 Drawer / Painel Lateral de Visualização Completa e Status */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            {/* Backdrop escurecido */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
              className="fixed inset-0 bg-black z-50 pointer-events-auto"
            />

            {/* Sliding Panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.35 }}
              className="fixed top-0 right-0 h-full w-full max-w-xl bg-card border-l border-border shadow-2xl z-50 flex flex-col"
            >
              {/* Header Drawer */}
              <div className="p-4 border-b border-border flex items-center justify-between bg-muted/20">
                <div>
                  <h3 className="text-sm font-black text-foreground flex items-center gap-1.5">
                    <Wrench className="size-4 text-emerald-500" />
                    OS #{selectedOrderDetails?.osNumber ? selectedOrderDetails.osNumber.toString().padStart(4, '0') : "..."}
                  </h3>
                  <span className="text-[9px] font-bold text-muted-foreground block mt-0.5">
                    ABERTURA: {selectedOrderDetails?.createdAt ? new Date(selectedOrderDetails.createdAt).toLocaleDateString('pt-BR') : ""}
                  </span>
                </div>
                <Button
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-1.5 hover:bg-muted rounded-full text-muted-foreground hover:text-foreground transition-all p-0 bg-transparent border-0"
                >
                  <X className="size-4.5" />
                </Button>
              </div>

              {/* Corpo Principal (Scrollable) */}
              <ScrollArea className="flex-1 overflow-hidden">
                {isLoadingDetails ? (
                  <div className="py-24 flex flex-col items-center justify-center gap-2">
                    <Loader2 className="size-7 text-emerald-500 animate-spin" />
                    <span className="text-xs text-muted-foreground font-medium">Buscando especificidades...</span>
                  </div>
                ) : selectedOrderDetails ? (
                  <div className="p-4 md:p-5 space-y-6 pb-8">
                    
                    {/* Status Atual Card */}
                    <div className="bg-muted/30 border border-border/55 rounded-2xl p-4 space-y-3">
                      <h4 className="text-[10px] uppercase font-extrabold tracking-wider text-muted-foreground flex items-center gap-1">
                        <Clock className="size-3.5 text-blue-500" />
                        Status da Ordem de Serviço
                      </h4>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="space-y-1">
                          <Label className="text-[9px] font-bold text-muted-foreground uppercase">Etapa do Fluxo</Label>
                          <select
                            value={editStatus}
                            onChange={(e) => setEditStatus(e.target.value)}
                            className="w-full text-xs border border-border rounded-lg px-2 py-1.5 bg-card text-foreground font-bold focus:outline-hidden"
                          >
                            <option value="CHECK_IN">Check-in / Triagem</option>
                            <option value="AWAITING_BUDGET">Aguardando Orçamento</option>
                            <option value="AWAITING_APPROVAL">Aguardando Aprovação</option>
                            <option value="AWAITING_PARTS">Aguardando Peças</option>
                            <option value="IN_PROGRESS">Em Execução</option>
                            <option value="TESTING_WASHING">Teste / Lavagem</option>
                            <option value="READY">Pronto para Entrega</option>
                            <option value="DELIVERED">Faturado & Entregue</option>
                          </select>
                        </div>
                        
                        <div className="space-y-1">
                          <Label className="text-[9px] font-bold text-muted-foreground uppercase">Mecânico Alocado</Label>
                          <select
                            value={editMechanicId}
                            onChange={(e) => setEditMechanicId(e.target.value)}
                            className="w-full text-xs border border-border rounded-lg px-2 py-1.5 bg-card text-foreground font-semibold focus:outline-hidden"
                          >
                            <option value="">-- Sem mecânico alocado --</option>
                            {mechanics.map((mech) => (
                              <option key={mech.id} value={mech.id}>{mech.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs pt-1.5">
                        <div className="space-y-1">
                          <Label className="text-[9px] font-bold text-muted-foreground uppercase">Status Financeiro</Label>
                          <select
                            value={editPaymentStatus}
                            onChange={(e) => setEditPaymentStatus(e.target.value)}
                            className="w-full text-xs border border-border rounded-lg px-2 py-1.5 bg-card text-foreground font-bold focus:outline-hidden"
                          >
                            <option value="PENDING">Pendente</option>
                            <option value="PAID">Pago</option>
                            <option value="LATE">Atrasado</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <Label className="text-[9px] font-bold text-muted-foreground uppercase">Box Alocado</Label>
                          <Input
                            type="text"
                            placeholder="Ex: Elevador 2"
                            value={editAllocatedBox}
                            onChange={(e) => setEditAllocatedBox(e.target.value)}
                            className="w-full text-xs border border-border rounded-lg px-2.5 py-1.5 bg-card text-foreground focus:outline-hidden"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Cliente e Veículo Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Cliente */}
                      <div className="border border-border/50 rounded-2xl p-4 bg-card shadow-xs space-y-2">
                        <h4 className="text-[10px] uppercase font-extrabold tracking-wider text-muted-foreground flex items-center gap-1.5">
                          <User className="size-3.5 text-emerald-500" />
                          Proprietário
                        </h4>
                        <div className="text-xs space-y-1.5">
                          <span className="font-black text-foreground block">{selectedOrderDetails.customer?.name}</span>
                          <span className="text-muted-foreground block font-medium">Celular: {selectedOrderDetails.customer?.phone}</span>
                          {selectedOrderDetails.customer?.document && (
                            <span className="text-[10px] font-mono text-muted-foreground bg-muted px-1 py-0.5 rounded-sm block w-max">
                              Doc: {selectedOrderDetails.customer.document}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Veículo */}
                      <div className="border border-border/50 rounded-2xl p-4 bg-card shadow-xs space-y-2">
                        <h4 className="text-[10px] uppercase font-extrabold tracking-wider text-muted-foreground flex items-center gap-1.5">
                          <Car className="size-3.5 text-emerald-500" />
                          Veículo
                        </h4>
                        <div className="text-xs space-y-1">
                          <span className="font-black text-foreground block">
                            {selectedOrderDetails.vehicle?.brand} {selectedOrderDetails.vehicle?.model}
                          </span>
                          <span className="text-[9.5px] uppercase font-black font-mono text-muted-foreground bg-muted border border-border px-1.5 py-0.5 rounded-sm inline-block mt-0.5">
                            Placa: {selectedOrderDetails.vehicle?.plate}
                          </span>
                          <span className="text-muted-foreground block text-[10px] mt-1">
                            Km atual: <strong>{selectedOrderDetails.currentMileage} Km</strong>
                          </span>
                          {selectedOrderDetails.fuelLevel && (
                            <span className="text-muted-foreground block text-[10px]">
                              Combustível: <strong>{selectedOrderDetails.fuelLevel}</strong>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Notas do Triador / Diagnóstico */}
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <Label className="text-[9px] font-bold text-muted-foreground uppercase">Diagnóstico Inicial (Reclamação do Cliente)</Label>
                        <Textarea
                          placeholder="Digite o diagnóstico inicial..."
                          value={editDiagnostic}
                          onChange={(e) => setEditDiagnostic(e.target.value)}
                          rows={2}
                          className="w-full text-xs border border-border rounded-lg px-2.5 py-1.5 bg-muted/10 focus:bg-card focus:outline-hidden text-foreground placeholder:text-muted-foreground/60 resize-y"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-[9px] font-bold text-muted-foreground uppercase">Observações Internas</Label>
                        <Textarea
                          placeholder="Digite observações internas..."
                          value={editNotes}
                          onChange={(e) => setEditNotes(e.target.value)}
                          rows={2}
                          className="w-full text-xs border border-border rounded-lg px-2.5 py-1.5 bg-muted/10 focus:bg-card focus:outline-hidden text-foreground placeholder:text-muted-foreground/60 resize-y"
                        />
                      </div>
                    </div>

                    {/* Checklist Físico e Avarias */}
                    {((selectedOrderDetails.checklist && selectedOrderDetails.checklist !== "{}") || selectedOrderDetails.damages) && (
                      <div className="border border-border/50 rounded-2xl p-4 bg-muted/10 space-y-3">
                        <h4 className="text-[10px] uppercase font-extrabold tracking-wider text-muted-foreground">Triagem Física</h4>
                        
                        {selectedOrderDetails.checklist && selectedOrderDetails.checklist !== "{}" && (
                          <div className="space-y-1.5">
                            <span className="text-[9px] font-bold text-muted-foreground uppercase block">Acessórios Triados</span>
                            <div className="flex flex-wrap gap-1">
                              {Object.entries(JSON.parse(selectedOrderDetails.checklist)).map(([key, val]: any) => {
                                const states: Record<string, string> = { P: "Presente", A: "Ausente", N: "Não Se Aplica" }
                                const badgeColors: Record<string, string> = { 
                                  P: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20", 
                                  A: "bg-red-500/10 text-red-500 border-red-500/20", 
                                  N: "bg-zinc-500/10 text-zinc-500 border-zinc-500/20" 
                                }
                                return (
                                  <span key={key} className={`text-[9.5px] font-bold px-2 py-0.5 rounded-sm border ${badgeColors[val] || "bg-zinc-500/10 text-zinc-500"}`}>
                                    {key}: {states[val] || val}
                                  </span>
                                )
                              })}
                            </div>
                          </div>
                        )}

                        {selectedOrderDetails.damages && (
                          <div className="space-y-1">
                            <span className="text-[9px] font-bold text-muted-foreground uppercase block">Avarias Registradas</span>
                            <p className="text-xs text-foreground italic font-medium">
                              {selectedOrderDetails.damages}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Orçamento / Grade de Itens da O.S. */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between border-b border-border pb-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-[10px] uppercase font-extrabold tracking-wider text-muted-foreground flex items-center gap-1.5">
                            <FileText className="size-3.5 text-emerald-500" />
                            Peças e Serviços Orçados
                          </h4>
                          {drawerItems.some(i => i.isApproved === 0) && (
                            <Button
                              type="button"
                              onClick={handleApproveAllDrawerItems}
                              className="text-[8.5px] bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold px-2.5 py-0.5 rounded-full transition-all active:scale-95 shadow-xs h-auto border-0"
                            >
                              ✓ Aprovar Todo Orçamento
                            </Button>
                          )}
                        </div>
                        <span className="text-[9px] text-muted-foreground font-bold">
                          {drawerItems.length} itens cadastrados
                        </span>
                      </div>

                      {drawerItems && drawerItems.length > 0 ? (
                        <div className="space-y-2">
                          {drawerItems.map((item: any) => {
                            const itemTotal = item.quantity * parseFloat(item.unitSalePrice)
                            const isApproved = item.isApproved === 1
                            const isRejected = item.isApproved === 2
                            return (
                              <div 
                                key={item.id}
                                className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                                  isApproved 
                                    ? "bg-emerald-500/5 border-emerald-500/20" 
                                    : isRejected
                                      ? "bg-red-500/5 border-red-500/20 opacity-60"
                                      : "bg-muted/20 border-border/50"
                                }`}
                              >
                                <div className="space-y-0.5 pr-2 flex-1">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className={`text-[8.5px] font-bold px-1.5 py-0.25 rounded-md ${
                                      item.type === 'PART' 
                                        ? "bg-blue-500/10 text-blue-500" 
                                        : "bg-purple-500/10 text-purple-500"
                                    }`}>
                                      {item.type === 'PART' ? 'Peça' : 'Serviço'}
                                    </span>
                                    <span className="text-xs font-bold text-foreground">
                                      {item.customName || (item.type === 'PART' ? item.partName : item.serviceName)}
                                    </span>
                                  </div>
                                  <span className="text-[10px] text-muted-foreground font-semibold block">
                                    {item.quantity}x de R$ {parseFloat(item.unitSalePrice).toFixed(2)}
                                  </span>
                                </div>

                                <div className="text-right flex flex-col items-end gap-1.5">
                                  <span className="text-xs font-black text-foreground font-mono">
                                    R$ {itemTotal.toFixed(2)}
                                  </span>
                                  
                                  {/* Toggles de Aprovação Rápidos */}
                                  <div className="inline-flex rounded-lg overflow-hidden border border-border/40 text-[9px] font-extrabold shrink-0">
                                    <Button
                                      type="button"
                                      onClick={() => handleUpdateDrawerItemApproval(item.id, 0)}
                                      className={`px-2 py-1 flex items-center justify-center transition-all rounded-none h-auto border-0 ${item.isApproved === 0 ? 'bg-amber-500 text-white' : 'bg-muted/40 text-muted-foreground hover:bg-muted/70'}`}
                                      title="Pendente"
                                    >
                                      <Clock className="size-3" />
                                    </Button>
                                    <Button
                                      type="button"
                                      onClick={() => handleUpdateDrawerItemApproval(item.id, 1)}
                                      className={`px-2 py-1 flex items-center justify-center transition-all rounded-none h-auto border-0 ${item.isApproved === 1 ? 'bg-emerald-500 text-white' : 'bg-muted/40 text-muted-foreground hover:bg-muted/70'}`}
                                      title="Aprovado"
                                    >
                                      <Check className="size-3" />
                                    </Button>
                                    <Button
                                      type="button"
                                      onClick={() => handleUpdateDrawerItemApproval(item.id, 2)}
                                      className={`px-2 py-1 flex items-center justify-center transition-all rounded-none h-auto border-0 ${item.isApproved === 2 ? 'bg-red-500 text-white' : 'bg-muted/40 text-muted-foreground hover:bg-muted/70'}`}
                                      title="Recusado"
                                    >
                                      <X className="size-3" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            )
                          })}

                          {/* Resumo de Totais */}
                          <div className="pt-2 border-t border-dashed border-border flex flex-col items-end space-y-1.5 text-xs text-foreground font-bold">
                            <div className="flex justify-between w-full max-w-[200px] text-[11px] text-muted-foreground font-medium">
                              <span>Total Bruto:</span>
                              <span className="font-mono">R$ {drawerItems.reduce((acc: number, curr: any) => acc + (curr.quantity * parseFloat(curr.unitSalePrice)), 0).toFixed(2)}</span>
                            </div>
                            
                            {parseFloat(selectedOrderDetails.discount || '0') > 0 && (
                              <div className="flex justify-between w-full max-w-[200px] text-[11px] text-red-500 font-medium">
                                <span>Desconto:</span>
                                <span className="font-mono">- R$ {parseFloat(selectedOrderDetails.discount).toFixed(2)}</span>
                              </div>
                            )}

                            {parseFloat(selectedOrderDetails.surcharge || '0') > 0 && (
                              <div className="flex justify-between w-full max-w-[200px] text-[11px] text-amber-600 font-medium">
                                <span>Acréscimo:</span>
                                <span className="font-mono">+ R$ {parseFloat(selectedOrderDetails.surcharge).toFixed(2)}</span>
                              </div>
                            )}

                            <div className="flex justify-between w-full max-w-[200px] text-sm font-black border-t border-border pt-1">
                              <span>Total Aprovado:</span>
                              <span className="font-mono text-emerald-500">
                                R$ {(() => {
                                  const approvedVal = drawerItems
                                    .filter((i: any) => i.isApproved === 1)
                                    .reduce((acc: number, curr: any) => acc + (curr.quantity * parseFloat(curr.unitSalePrice)), 0)
                                  const disc = parseFloat(selectedOrderDetails.discount || '0')
                                  const sur = parseFloat(selectedOrderDetails.surcharge || '0')
                                  return Math.max(0, approvedVal - disc + sur).toFixed(2)
                                })()}
                              </span>
                            </div>
                          </div>

                        </div>
                      ) : (
                        <div className="text-center p-6 border border-dashed border-border rounded-xl">
                          <span className="text-[10px] text-muted-foreground italic font-medium">Nenhum item adicionado a este orçamento ainda.</span>
                        </div>
                      )}
                    </div>

                  </div>
                ) : null}
              </ScrollArea>

              {/* Footer Drawer */}
              <div className="p-4 border-t border-border flex items-center justify-between gap-3 bg-muted/10">
                <div className="flex items-center gap-2">
                  <PrinterPopover
                    orderId={selectedOrderId!}
                    osNumber={selectedOrderDetails?.osNumber ?? 0}
                    status={selectedOrderDetails?.status ?? 'CHECK_IN'}
                  />

                  <Button
                    type="button"
                    variant="ghost"
                    disabled={sendingWhatsapp}
                    onClick={async () => {
                      if (sendingWhatsapp) return;
                      setSendingWhatsapp(true);
                      try {
                        const res = await sendDirectWhatsappAction(selectedOrderId!);
                        if (res.success) {
                          toast.success(res.message);
                        } else if (res.fallback) {
                          const phone = selectedOrderDetails?.customer?.phone || "";
                          const cleanPhone = phone.replace(/\D/g, "");
                          const formattedPhone = cleanPhone.startsWith("55") ? cleanPhone : `55${cleanPhone}`;
                          
                          const urlPublic = `${window.location.origin}/public/budget/${selectedOrderId}`;
                          const accessCode = selectedOrderDetails?.budgetAccessCode || "";
                          const customerName = selectedOrderDetails?.customer?.name || "Cliente";
                          const osNum = String(selectedOrderDetails?.osNumber).padStart(4, '0');
                          
                          const message = `Olá, ${customerName}! Segue o link para visualizar e aprovar o orçamento da sua Ordem de Serviço *#${osNum}*:\n\n*Link:* ${urlPublic}\n*Código de Acesso:* *${accessCode}*\n\nSe tiver qualquer dúvida, estamos à disposição!`;
                          const encodedMessage = encodeURIComponent(message);
                          
                          window.open(`https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodedMessage}`, '_blank');
                        } else {
                          toast.error("Erro ao enviar: " + res.error);
                        }
                      } catch (err: any) {
                        toast.error("Erro ao processar envio: " + err.message);
                      } finally {
                        setSendingWhatsapp(false);
                      }
                    }}
                    className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-[10px] rounded-lg px-3 h-7 transition-all flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer border-transparent"
                    title="Enviar orçamento por WhatsApp"
                  >
                    {sendingWhatsapp ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Phone className="size-4" />
                    )}
                    {sendingWhatsapp ? "Enviando..." : "WhatsApp"}
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      router.push(`/panel/orders/new?id=${selectedOrderId}`)
                    }}
                    className="bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 dark:text-blue-400 font-bold text-[10px] rounded-lg px-3 h-7 transition-all flex items-center gap-1.5 border-transparent shadow-none"
                    title="Editar O.S. Completa"
                  >
                    <Edit2 className="size-4" />
                    Editar O.S.
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    onClick={() => setIsDrawerOpen(false)}
                    className="bg-muted hover:bg-muted/80 text-foreground font-bold text-xs rounded-lg px-4 py-2.5 h-auto transition-all border-0 shadow-none"
                  >
                    Fechar
                  </Button>
                  <Button
                    type="button"
                    disabled={isSavingDetails || isLoadingDetails}
                    onClick={handleSaveQuickEdits}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs rounded-lg px-5 py-2.5 h-auto transition-all flex items-center gap-1.5 shadow-sm active:scale-95 disabled:opacity-50 border-0"
                  >
                    {isSavingDetails ? (
                      <>
                        <Loader2 className="size-3.5 animate-spin" />
                        <span>Salvando...</span>
                      </>
                    ) : (
                      <>
                        <Check className="size-3.5" />
                        <span>Salvar</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>

            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ⚠️ Modal de Confirmação de Exclusão */}
      <AnimatePresence>
        {orderToDelete && (
          <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card border border-border max-w-sm w-full rounded-2xl p-5 shadow-2xl space-y-4"
            >
              <div className="flex items-center gap-2 text-red-500">
                <ShieldAlert className="size-5 shrink-0" />
                <h3 className="text-sm font-black uppercase tracking-wide">Excluir Ordem de Serviço</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Você tem certeza absoluta que deseja excluir esta Ordem de Serviço? Esta ação é irreversível e excluirá permanentemente todos os registros de itens e triagem associados.
              </p>
              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  onClick={() => setOrderToDelete(null)}
                  className="bg-muted hover:bg-muted/80 text-foreground font-bold text-xs rounded-lg px-4 py-2 h-auto transition-all border-0 shadow-none"
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleDeleteOrder}
                  className="bg-red-500 hover:bg-red-600 text-white font-extrabold text-xs rounded-lg px-4 py-2 h-auto transition-all flex items-center gap-1 shadow-md disabled:opacity-50 border-0"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" />
                      <span>Excluindo...</span>
                    </>
                  ) : (
                    <span>Sim, Excluir</span>
                  )}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  )
}
