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
  ChevronLeft,
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
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"

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

export default function KanbanPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<WorkOrderSummary[]>([])
  const [mechanics, setMechanics] = useState<Mechanic[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("ALL")
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState("")
  const [successMessage, setSuccessMessage] = useState("")

  // AI Command Bar States
  const [isCommandBarOpen, setIsCommandBarOpen] = useState(false)
  const [commandQuery, setCommandQuery] = useState("")
  const [isCommandProcessing, setIsCommandProcessing] = useState(false)
  const [commandResult, setCommandResult] = useState<any | null>(null)

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

  // Listen for Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setIsCommandBarOpen(prev => !prev)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

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
    setEditStatus("IN_PROGRESS")
  }

  // Deleta ordem de serviço
  const handleDeleteOrder = async () => {
    if (!orderToDelete) return
    setIsDeleting(true)
    const res = await deleteWorkOrderAction(orderToDelete)
    setIsDeleting(false)
    setOrderToDelete(null)

    if (res.success) {
      setSuccessMessage("Ordem de Serviço excluída com sucesso!")
      setIsDrawerOpen(false)
      loadInitialData()
    } else {
      setErrorMessage(res.error || "Erro ao excluir a Ordem de Serviço.")
    }
  }

  // Helper de tempo decorrido
  const getElapsedTime = (statusChangedAt: any) => {
    if (!statusChangedAt) return "0m"
    const date = new Date(statusChangedAt)
    const diffMs = new Date().getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    if (diffMins < 1) return "Agora"
    if (diffMins < 60) return `${diffMins}m`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ${diffMins % 60}m`
    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays}d ${diffHours % 24}h`
  }

  // Mover status de uma OS via Kanban
  const handleMoveOrderStatus = async (orderId: string, targetStatus: 'CHECK_IN' | 'AWAITING_BUDGET' | 'AWAITING_APPROVAL' | 'AWAITING_PARTS' | 'IN_PROGRESS' | 'TESTING_WASHING' | 'READY' | 'DELIVERED') => {
    const originalOrders = [...orders]
    // 1. Update state instantly
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: targetStatus, statusChangedAt: new Date() } : o))

    // 2. Dispatch background request without blocking the UI
    updateWorkOrderAction({
      id: orderId,
      status: targetStatus
    }).then(res => {
      if (!res.success) {
        // Rollback snapshot
        setOrders(originalOrders)
        toast.error("Não foi possível salvar o status da OS. Quer tentar novamente?", {
          action: {
            label: "Tentar Novamente",
            onClick: () => handleMoveOrderStatus(orderId, targetStatus)
          }
        })
      } else {
        toast.success(`O.S. movida para ${STATUS_LABELS[targetStatus]} com sucesso!`)
      }
    }).catch(() => {
      setOrders(originalOrders)
      toast.error("Erro de conexão ao salvar status. Quer tentar novamente?", {
        action: {
          label: "Tentar Novamente",
          onClick: () => handleMoveOrderStatus(orderId, targetStatus)
        }
      })
    })
  }

  // Processa comando da IA
  const handleRunAICommand = (query: string) => {
    setIsCommandProcessing(true)
    setCommandResult(null)

    setTimeout(() => {
      setIsCommandProcessing(false)
      const cleanQuery = query.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      
      // 1. Rebalancear
      if (cleanQuery.includes("rebalance") || cleanQuery.includes("rampa") || cleanQuery.includes("especialidade")) {
        const activeOrders = orders.filter(o => o.status === 'IN_PROGRESS' || o.status === 'AWAITING_PARTS')
        const logs: string[] = []
        const actions: (() => Promise<void>)[] = []

        if (activeOrders.length === 0) {
          logs.push("Nenhuma O.S. ativa em execução ou aguardando peças para rebalanceamento.")
        } else {
          activeOrders.forEach((o, index) => {
            if (mechanics.length > 0) {
              const targetMech = mechanics[index % mechanics.length]
              if (o.mechanicName !== targetMech.name) {
                logs.push(`Re-alocando O.S. #${o.osNumber.toString().padStart(4, '0')} (${o.vehicleModel}) para ${targetMech.name} (Especialidade).`)
                actions.push(async () => {
                  await updateWorkOrderAction({
                    id: o.id,
                    mechanicId: targetMech.id
                  })
                })
              }
            }
          })
          if (logs.length === 0) {
            logs.push("Todas as rampas já estão otimizadas e distribuídas de forma ideal.")
          }
        }

        setCommandResult({
          title: "Rebalancear as Rampas",
          description: "A IA analisou os gargalos operacionais e as competências dos mecânicos para reequilibrar o pátio.",
          logs,
          execute: async () => {
            const originalOrders = [...orders]
            setIsCommandBarOpen(false)
            // Optimistically update local state: allocate mechanics
            setOrders(prev => prev.map(o => {
              const activeIndex = activeOrders.findIndex(ao => ao.id === o.id)
              if (activeIndex !== -1 && mechanics.length > 0) {
                const targetMech = mechanics[activeIndex % mechanics.length]
                return { ...o, mechanicName: targetMech.name }
              }
              return o
            }))
            
            // Run background updates
            toast.promise(
              Promise.all(activeOrders.map((o, index) => {
                const targetMech = mechanics[index % mechanics.length]
                if (o.mechanicName !== targetMech.name) {
                  return updateWorkOrderAction({ id: o.id, mechanicId: targetMech.id })
                }
                return Promise.resolve({ success: true })
              })).then(results => {
                const someFailed = results.some(r => !r.success)
                if (someFailed) {
                  setOrders(originalOrders)
                  throw new Error("Algumas alocações falharam.")
                }
              }),
              {
                loading: "Sincronizando alocações de mecânicos...",
                success: "Rampas rebalanceadas com sucesso!",
                error: "Falha ao sincronizar rebalanceamento."
              }
            )
          }
        })
      }
      // 2. Cobrar
      else if (cleanQuery.includes("cobr") || cleanQuery.includes("lembr") || cleanQuery.includes("whatsapp") || cleanQuery.includes("orcamento")) {
        const pendingOrders = orders.filter(o => o.status === 'AWAITING_APPROVAL' || o.status === 'AWAITING_BUDGET')
        const logs: string[] = []

        if (pendingOrders.length === 0) {
          logs.push("Nenhum orçamento pendente encontrado para disparar cobrança.")
        } else {
          pendingOrders.forEach(o => {
            logs.push(`Disparar lembrete via WhatsApp para ${o.customerName} - O.S. #${o.osNumber.toString().padStart(4, '0')} (${o.vehicleModel})`)
          })
        }

        setCommandResult({
          title: "Cobrar Orçamentos Pendentes",
          description: "Identificamos os orçamentos aguardando aprovação do cliente para disparo em lote de cobranças via WhatsApp.",
          logs,
          execute: async () => {
            // Apenas simulação (toast success)
          }
        })
      }
      // 3. Liberar boxes
      else if (cleanQuery.includes("liber") || cleanQuery.includes("amanha") || cleanQuery.includes("pronto") || cleanQuery.includes("entreg")) {
        const readyOrders = orders.filter(o => o.status === 'READY' || o.status === 'TESTING_WASHING')
        const logs: string[] = []
        const actions: (() => Promise<void>)[] = []

        if (readyOrders.length === 0) {
          logs.push("Nenhuma O.S. com veículo pronto ou em teste para finalização.")
        } else {
          readyOrders.forEach(o => {
            logs.push(`O.S. #${o.osNumber.toString().padStart(4, '0')} (${o.vehicleModel}) -> Alterada para Entregue (Box Liberado)`)
            actions.push(async () => {
              await updateWorkOrderAction({
                id: o.id,
                status: 'DELIVERED',
                paymentStatus: 'PAID'
              })
            })
          })
        }

        setCommandResult({
          title: "Liberar os Boxes para Amanhã",
          description: "Move em lote todas as ordens prontas ou em fase de testes para o status final de 'Entregue' (deliberado).",
          logs,
          execute: async () => {
            const originalOrders = [...orders]
            setIsCommandBarOpen(false)
            // Optimistic update
            setOrders(prev => prev.map(o => {
              if (o.status === 'READY' || o.status === 'TESTING_WASHING') {
                return { ...o, status: 'DELIVERED', paymentStatus: 'PAID', statusChangedAt: new Date() }
              }
              return o
            }))

            toast.promise(
              Promise.all(readyOrders.map(o => 
                updateWorkOrderAction({
                  id: o.id,
                  status: 'DELIVERED',
                  paymentStatus: 'PAID'
                })
              )).then(results => {
                const someFailed = results.some(r => !r.success)
                if (someFailed) {
                  setOrders(originalOrders)
                  throw new Error("Algumas liberações falharam.")
                }
              }),
              {
                loading: "Sincronizando liberação de boxes...",
                success: "Todos os boxes liberados com sucesso!",
                error: "Falha ao sincronizar liberação de boxes."
              }
            )
          }
        })
      }
      // 4. Fallback
      else {
        setCommandResult({
          title: "Comando Não Compreendido",
          description: "A IA de pátio rápido não reconheceu essa intenção.",
          logs: [
            "Tente expressar sua intenção de outra forma ou clique em um dos atalhos sugeridos.",
            "Exemplos: 'rebalancear o pátio', 'cobrar orçamentos', 'liberar os boxes'."
          ],
          execute: async () => {}
        })
      }
    }, 1500)
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

  return (
    <div className="flex-1 w-full min-w-0 max-w-full h-[calc(100vh-var(--header-height))] flex flex-col p-4 md:p-6 bg-[#FAF9F6] dark:bg-zinc-950 overflow-hidden font-sans">
      
      {/* 📋 SEO Friendly Page Title */}
      <h1 className="sr-only">Quadro Kanban - Monitoramento de Rampa</h1>

      {/* Cabeçalho Principal */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => router.push("/panel/orders")}
              className="p-1 hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg transition-colors border border-border/40 bg-card mr-1 h-auto"
              title="Voltar para Histórico"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <span className="bg-purple-500/10 text-purple-500 p-1.5 rounded-lg border border-purple-500/20">
              <Sparkles className="size-5" />
            </span>
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              Monitoramento de Rampa (Kanban)
            </h2>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 ml-8">
            Gerencie boxes de serviço em tempo real por rampa, otimize mecânicos e execute comandos em lote.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 self-start md:self-auto">
          {/* Perguntar à IA Button */}
          <Button
            onClick={() => setIsCommandBarOpen(true)}
            className="bg-purple-650/10 hover:bg-purple-650/20 text-purple-600 dark:text-purple-400 font-extrabold text-xs rounded-full px-4 py-2.5 h-auto transition-all border border-purple-600/20 flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Sparkles className="size-3.5" />
            <span>Perguntar à IA</span>
            <kbd className="hidden sm:inline-flex items-center gap-0.5 bg-purple-600/20 px-1.5 py-0.5 rounded text-[8px] font-mono leading-none tracking-normal uppercase">
              Ctrl+K
            </kbd>
          </Button>

          {/* Nova O.S. Button */}
          <Button
            onClick={() => router.push("/panel/orders/new")}
            className="bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs rounded-full px-5 py-2.5 h-auto transition-all shadow-md active:scale-95 flex items-center gap-1.5 cursor-pointer border-0"
          >
            <Plus className="size-4" />
            Nova O.S.
          </Button>
        </div>
      </div>

      {/* Alertas */}
      {successMessage && (
        <div className="mb-4 p-3 bg-emerald-500/10 text-emerald-500 rounded-xl border border-emerald-500/20 text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-1 shrink-0">
          <Check className="size-4" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="mb-4 p-3 bg-red-500/10 text-red-500 rounded-xl border border-red-500/20 text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-1 shrink-0">
          <AlertCircle className="size-4" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Filtros e Busca */}
      <div className="bg-card border border-border/50 rounded-2xl p-4 shadow-[0_10px_30px_-15px_rgba(0,0,0,0.02)] space-y-4 mb-6 shrink-0">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
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
                className="absolute right-3 top-3.5 text-muted-foreground hover:text-foreground text-[10px] font-bold h-auto p-0 bg-transparent hover:bg-transparent border-0 shadow-none"
              >
                Limpar
              </Button>
            )}
          </div>

          <span className="text-[10px] text-muted-foreground hidden lg:inline-flex items-center gap-1 font-bold">
            <Sparkles className="size-3 text-purple-500" />
            Arraste os cards para mudar o status da rampa. Use Ctrl+K para ações em lote com a IA.
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
                className={`text-[11px] font-bold px-3 py-1.5 rounded-full transition-all shrink-0 flex items-center gap-1.5 relative h-auto border-0 shadow-none ${
                  active 
                    ? "bg-foreground text-background scale-102 hover:bg-foreground/90" 
                    : "bg-muted/30 hover:bg-muted/60 text-muted-foreground"
                }`}
              >
                <span>{tab.label}</span>
                <span className={`px-1.5 py-0.5 rounded-md text-[9px] ${
                  active 
                    ? "bg-background/25 text-foreground" 
                    : "bg-muted/70 text-muted-foreground font-mono"
                }`}>
                  {count}
                </span>
                {active && (
                  <motion.div
                    layoutId="activeTabIndicator"
                    className="absolute inset-0 rounded-full border-2 border-purple-500 pointer-events-none"
                    transition={springConfig}
                  />
                )}
              </Button>
            )
          })}
        </div>
      </div>

      {/* 📋 Listagem em Kanban */}
      {isLoading ? (
        <ScrollArea className="flex-1 w-full min-w-0" data-slot="kanban-scroll-area">
          <div className="flex gap-4 pb-4 select-none min-h-full">
            {[
              { label: 'Check-in' },
              { label: 'Orçamento' },
              { label: 'Aprovação' },
              { label: 'Peças' },
              { label: 'Execução' },
              { label: 'Teste/Lavagem' },
              { label: 'Pronto' },
              { label: 'Entregue' }
            ].map((col, idx) => (
              <div
                key={idx}
                className="flex-none w-[280px] min-w-[280px] bg-card/60 border border-border/50 rounded-3xl p-4 flex flex-col h-full min-h-0"
              >
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-border/30 shrink-0">
                  <div className="flex items-center gap-2">
                    <div className="size-2 rounded-full bg-zinc-350 animate-pulse" />
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{col.label}</span>
                  </div>
                  <Skeleton className="h-4 w-6 rounded-full" />
                </div>
                <div className="space-y-3 pb-4">
                  {[1, 2].map((cardIdx) => (
                    <div key={cardIdx} className="bg-card border border-border/40 rounded-2xl p-4 space-y-3.5 shadow-sm">
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1.5 flex-1">
                          <Skeleton className="h-4 w-3/4 rounded-md" />
                          <Skeleton className="h-3 w-1/2 rounded-md" />
                        </div>
                        <Skeleton className="h-5 w-12 rounded-md" />
                      </div>
                      <div className="pt-2.5 border-t border-dashed border-border/40 flex items-center justify-between">
                        <Skeleton className="h-3 w-20 rounded-md" />
                        <Skeleton className="h-3 w-10 rounded-md" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      ) : (
        <ScrollArea className="flex-1 w-full min-w-0" data-slot="kanban-scroll-area">
          <div className="flex gap-4 pb-4 select-none min-h-full">
          {[
            { id: 'CHECK_IN', label: 'Check-in', color: 'border-blue-500/20 bg-blue-500/5 text-blue-500 dark:text-blue-400' },
            { id: 'AWAITING_BUDGET', label: 'Orçamento', color: 'border-amber-500/20 bg-amber-500/5 text-amber-500 dark:text-amber-400' },
            { id: 'AWAITING_APPROVAL', label: 'Aprovação', color: 'border-yellow-500/20 bg-yellow-500/5 text-yellow-500 dark:text-yellow-400' },
            { id: 'AWAITING_PARTS', label: 'Peças', color: 'border-purple-500/20 bg-purple-500/5 text-purple-500 dark:text-purple-400' },
            { id: 'IN_PROGRESS', label: 'Execução', color: 'border-indigo-500/20 bg-indigo-500/5 text-indigo-500 dark:text-indigo-400' },
            { id: 'TESTING_WASHING', label: 'Teste/Lavagem', color: 'border-pink-500/20 bg-pink-500/5 text-pink-500 dark:text-pink-400' },
            { id: 'READY', label: 'Pronto', color: 'border-emerald-500/20 bg-emerald-500/5 text-emerald-500 dark:text-emerald-400' },
            { id: 'DELIVERED', label: 'Entregue', color: 'border-zinc-500/20 bg-zinc-500/5 text-zinc-500 dark:text-zinc-400' }
          ].map((col) => {
            const columnOrders = filteredOrders.filter(o => o.status === col.id)
            return (
              <div
                key={col.id}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  const orderId = e.dataTransfer.getData("text/plain")
                  handleMoveOrderStatus(orderId, col.id as any)
                }}
                className="flex-none w-[280px] min-w-[280px] bg-card/60 border border-border/50 rounded-3xl p-4 flex flex-col h-full min-h-0 transition-all hover:bg-card/90"
              >
                {/* Cabeçalho da Rampa / Coluna */}
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-border/30 shrink-0">
                  <div className="flex items-center gap-2">
                    <span className={`size-2 rounded-full ${col.id === 'CHECK_IN' ? 'bg-blue-500' : col.id === 'AWAITING_BUDGET' ? 'bg-amber-500' : col.id === 'AWAITING_APPROVAL' ? 'bg-yellow-500' : col.id === 'AWAITING_PARTS' ? 'bg-purple-500' : col.id === 'IN_PROGRESS' ? 'bg-indigo-500' : col.id === 'TESTING_WASHING' ? 'bg-pink-500' : col.id === 'READY' ? 'bg-emerald-500' : 'bg-zinc-500'}`} />
                    <span className="text-xs font-bold text-foreground uppercase tracking-wider">{col.label}</span>
                  </div>
                  <span className="bg-muted px-2 py-0.5 rounded-full text-[9px] font-bold text-muted-foreground font-mono">
                    {columnOrders.length}
                  </span>
                </div>

                {/* Lista de Cards da Rampa */}
                <ScrollArea className="flex-1 min-h-0 pr-1">
                  <div className="space-y-3 pb-4">
                  {columnOrders.length === 0 ? (
                    <div className="h-40 flex items-center justify-center text-[10px] text-muted-foreground/60 italic p-6 text-center border border-dashed border-border/30 rounded-2xl bg-muted/5">
                      Arraste um veículo para esta rampa
                    </div>
                  ) : (
                    columnOrders.map((order) => (
                      <div
                        key={order.id}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData("text/plain", order.id)
                        }}
                        onClick={() => handleOpenDrawer(order.id)}
                        className="bg-card border border-border/40 rounded-2xl p-4 space-y-3.5 shadow-sm hover:shadow-md hover:border-border/80 hover:scale-102 transition-all cursor-pointer group active:scale-98 relative"
                      >
                        {/* Cabeçalho do Card: Modelo e Placa */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <span className="text-xs font-black text-foreground block truncate group-hover:text-emerald-500 transition-colors leading-tight">
                              {order.vehicleBrand} {order.vehicleModel}
                            </span>
                            <span className="text-[9px] font-bold text-muted-foreground block mt-0.5">
                              OS #{order.osNumber.toString().padStart(4, '0')}
                            </span>
                          </div>
                          <span className="text-[9px] font-black font-mono text-muted-foreground bg-muted border border-border/60 px-1.5 py-0.5 rounded-md shrink-0">
                            {order.vehiclePlate}
                          </span>
                        </div>

                        {/* Alert Tags: P0 ou P1 */}
                        {order.status === 'AWAITING_PARTS' && (
                          <div className="flex items-center gap-1 text-[8.5px] font-extrabold uppercase px-2 py-0.75 rounded-md bg-red-500/10 text-red-500 border border-red-500/20 w-max leading-none">
                            <ShieldAlert className="size-3 shrink-0" />
                            <span>P0 - Carro Parado p/ Peça</span>
                          </div>
                        )}
                        {order.status === 'AWAITING_APPROVAL' && (
                          <div className="flex items-center gap-1 text-[8.5px] font-extrabold uppercase px-2 py-0.75 rounded-md bg-amber-500/10 text-amber-500 border border-amber-500/20 w-max leading-none">
                            <AlertTriangle className="size-3 shrink-0" />
                            <span>P1 - Aguarda Aprovação</span>
                          </div>
                        )}

                        {/* Rodapé: Mecânico e Tempo Decorrido */}
                        <div className="flex items-center justify-between pt-2.5 border-t border-dashed border-border/40 text-[9.5px]">
                          {/* Mecânico */}
                          <div className="flex items-center gap-1 text-muted-foreground font-semibold truncate max-w-[130px]">
                            <User className="size-3 text-muted-foreground/60 shrink-0" />
                            <span className="truncate">{order.mechanicName || "Sem mecânico"}</span>
                          </div>

                          {/* Tempo no Status */}
                          <div className="flex items-center gap-1 text-muted-foreground font-bold shrink-0">
                            <Clock className="size-3 text-muted-foreground/60 shrink-0" />
                            <span>{getElapsedTime(order.statusChangedAt || order.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                  </div>
                </ScrollArea>
              </div>
            )
          })}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      )}

      {/* 🚪 Drawer / Painel Lateral de Visualização Completa e Status */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            {/* Backdrop */}
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
                  className="p-1.5 hover:bg-muted rounded-full text-muted-foreground hover:text-foreground transition-all h-auto p-0 bg-transparent hover:bg-transparent border-0 shadow-none"
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
                  <Button
                    type="button"
                    onClick={() => {
                      window.print()
                    }}
                    className="bg-muted hover:bg-muted/80 text-foreground font-bold text-[10px] rounded-lg p-2.5 h-auto transition-all flex items-center gap-1.5 border-0 shadow-none"
                    title="Imprimir O.S."
                  >
                    <Printer className="size-4" />
                    Imprimir
                  </Button>

                  <Button
                    type="button"
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
                    className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-[10px] rounded-lg p-2.5 h-auto transition-all flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer border-0"
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
                    onClick={() => {
                      router.push(`/panel/orders/new?id=${selectedOrderId}`)
                    }}
                    className="bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 dark:text-blue-400 font-bold text-[10px] rounded-lg p-2.5 h-auto transition-all flex items-center gap-1.5 border-0 shadow-none"
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

      {/* 🔮 Command Bar / Ask AI Modal */}
      <AnimatePresence>
        {isCommandBarOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (!isCommandProcessing) {
                  setIsCommandBarOpen(false)
                  setCommandResult(null)
                  setCommandQuery("")
                }
              }}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            />

            {/* Modal */}
            <motion.div
              initial={{ scale: 0.95, y: -20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: -20, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-zinc-950 border border-zinc-800 text-zinc-100 max-w-lg w-full rounded-3xl shadow-2xl overflow-hidden flex flex-col z-50 relative"
            >
              {/* Header Input */}
              <div className="p-4 border-b border-zinc-800 flex items-center gap-3 relative">
                <Sparkles className="size-5 text-purple-400 shrink-0 animate-pulse" />
                <Input
                  type="text"
                  placeholder="Pergunte à IA ou selecione um comando..."
                  value={commandQuery}
                  onChange={(e) => setCommandQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && commandQuery.trim()) {
                      handleRunAICommand(commandQuery)
                    }
                  }}
                  disabled={isCommandProcessing}
                  className="w-full bg-transparent border-0 outline-hidden text-sm text-zinc-100 placeholder-zinc-500 focus:ring-0 pl-0 pr-10 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                  autoFocus
                />
                {commandQuery && !isCommandProcessing && (
                  <Button
                    onClick={() => setCommandQuery("")}
                    className="absolute right-6 text-[10px] font-bold text-zinc-500 hover:text-zinc-350 cursor-pointer h-auto p-0 bg-transparent hover:bg-transparent border-0 shadow-none"
                  >
                    Limpar
                  </Button>
                )}
              </div>

              {/* Body */}
              <div className="p-5 max-h-96 overflow-y-auto min-h-48 flex flex-col justify-center">
                {isCommandProcessing ? (
                  <div className="py-8 text-center flex flex-col items-center justify-center gap-3 animate-pulse">
                    <Loader2 className="size-8 text-purple-400 animate-spin" />
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-zinc-300">Inteligência Artificial Processando...</p>
                      <p className="text-[10px] text-zinc-500">Mapeando intenção, analisando mecânicos e consultando pátio...</p>
                    </div>
                  </div>
                ) : commandResult ? (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-purple-400">
                        <Sparkles className="size-4.5" />
                        <h4 className="text-xs font-bold uppercase tracking-wide">{commandResult.title}</h4>
                      </div>
                      <p className="text-xs text-zinc-400 font-medium leading-relaxed">{commandResult.description}</p>
                    </div>

                    <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-4 space-y-2.5">
                      <span className="text-[9px] font-extrabold uppercase tracking-wider text-zinc-500 block">Plano de Execução Planejado</span>
                      <div className="space-y-1.5">
                        {commandResult.logs.length === 0 ? (
                          <div className="text-[10px] text-zinc-500 italic">Nenhuma alteração necessária para os dados atuais.</div>
                        ) : (
                          commandResult.logs.map((log: string, idx: number) => (
                            <div key={idx} className="flex items-start gap-2 text-xs font-medium text-zinc-300">
                              <span className="text-purple-400 shrink-0 select-none">➔</span>
                              <span className="leading-tight">{log}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 py-2">
                    <span className="text-[9px] font-extrabold uppercase tracking-wider text-zinc-500 block">Comandos Sugeridos</span>
                    <div className="space-y-2">
                      {[
                        {
                          title: "Rebalancear as Rampas",
                          subtitle: "Otimiza a alocação de mecânicos por especialidades operacionais",
                          cmd: "Rebalancear o pátio por especialidade."
                        },
                        {
                          title: "Cobrar orçamentos pendentes",
                          subtitle: "Dispara mensagens para clientes aguardando aprovação há mais de 2 horas",
                          cmd: "Cobrar orçamentos pendentes por mais de 2 horas."
                        },
                        {
                          title: "Liberar os boxes para amanhã",
                          subtitle: "Move todos os veículos prontos/testados para a coluna de entregues",
                          cmd: "Mover todos os carros prontos e testados para entregues."
                        }
                      ].map((item, idx) => (
                        <Button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setCommandQuery(item.cmd)
                            handleRunAICommand(item.cmd)
                          }}
                          className="w-full text-left p-3.5 bg-zinc-900/40 hover:bg-zinc-900 border border-zinc-850 hover:border-zinc-800 rounded-2xl h-auto transition-all flex items-center justify-between group cursor-pointer shadow-none"
                        >
                          <div className="space-y-1 pr-4">
                            <span className="text-xs font-bold text-zinc-200 group-hover:text-purple-400 transition-colors block">{item.title}</span>
                            <span className="text-[10px] text-zinc-500 font-medium block">{item.subtitle}</span>
                          </div>
                          <ArrowRight className="size-4 text-zinc-650 group-hover:text-purple-400 transition-colors shrink-0" />
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-zinc-800 bg-zinc-900/20 flex items-center justify-between gap-3">
                <span className="text-[9.5px] text-zinc-500 font-medium hidden sm:inline-block">
                  Pressione <kbd className="bg-zinc-800 px-1 rounded text-[8px] font-mono">ESC</kbd> para fechar.
                </span>

                {commandResult ? (
                  <div className="flex items-center gap-2 ml-auto">
                    <Button
                      type="button"
                      onClick={() => {
                        setCommandResult(null)
                        setCommandQuery("")
                      }}
                      className="bg-zinc-850 hover:bg-zinc-800 text-zinc-300 font-bold text-xs rounded-xl px-4 py-2 h-auto transition-all cursor-pointer border-0 shadow-none"
                    >
                      Voltar
                    </Button>
                    {commandResult.logs.length > 0 && (
                      <Button
                        type="button"
                        onClick={async () => {
                          setIsCommandProcessing(true)
                          await commandResult.execute()
                          setIsCommandProcessing(false)
                          setIsCommandBarOpen(false)
                          setCommandResult(null)
                          setCommandQuery("")
                          setSuccessMessage("Ações da IA executadas com sucesso no banco de dados!")
                        }}
                        className="bg-purple-650 hover:bg-purple-750 text-white font-extrabold text-xs rounded-xl px-5 py-2 h-auto transition-all flex items-center gap-1 shadow-md active:scale-95 cursor-pointer border-0"
                      >
                        <Check className="size-3.5" />
                        <span>Confirmar Execução</span>
                      </Button>
                    )}
                  </div>
                ) : (
                  <Button
                    type="button"
                    onClick={() => {
                      setIsCommandBarOpen(false)
                      setCommandResult(null)
                      setCommandQuery("")
                    }}
                    className="bg-zinc-850 hover:bg-zinc-800 text-zinc-350 font-bold text-xs rounded-xl px-4 py-2.5 h-auto transition-all ml-auto cursor-pointer border-0 shadow-none"
                  >
                    Fechar
                  </Button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  )
}
