"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Lock, 
  Check, 
  Wrench, 
  Package, 
  Calendar, 
  Car, 
  Phone, 
  FileText, 
  DollarSign, 
  ChevronRight, 
  AlertCircle,
  Building2,
  Info,
  Clock,
  User,
  Camera,
  Image as ImageIcon,
  X,
  ChevronDown,
  ChevronUp
} from "lucide-react"
import { cn } from "@/lib/utils"

// Import Server Actions
import { 
  getPublicWorkOrderAction, 
  approvePublicBudgetAction 
} from "@/lib/actions/public-actions"

interface PublicItem {
  id: string
  type: string
  partId: string | null
  serviceId: string | null
  customName: string | null
  quantity: number
  unitCostPrice: string
  unitSalePrice: string
  isApproved: number
  partName: string | null
  partBrand: string | null
  partSku: string | null
  serviceName: string | null
}

interface PublicOrder {
  id: string
  osNumber: number
  status: string
  discount: string
  surcharge: string
  notes: string | null
  diagnostic: string | null
  createdAt: Date | string
  customer: {
    name: string
    phone: string
    email: string | null
  }
  vehicle: {
    brand: string
    model: string
    plate: string
    year: number | null
  } | null
  branch: {
    name: string
    phone: string | null
    cnpj: string | null
    address: string | null
  } | null
  mechanic: {
    name: string
    image: string | null
    specialties: string[] | null
  } | null
  statusHistory: Array<{
    id: string
    status: string
    createdAt: Date | string
    notes: string | null
  }>
  photoUrls: string[] | null
  allocatedBox: string | null
  items: PublicItem[]
}

export default function PublicBudgetPage({ params }: { params: Promise<{ id: string }> }) {
  // Get route ID
  const idPromise = params;
  const [resolvedId, setResolvedId] = useState<string | null>(null);

  // Resolve params promise
  idPromise.then(p => {
    if (p.id !== resolvedId) setResolvedId(p.id);
  });

  // State Management
  const [step, setStep] = useState<"auth" | "budget" | "tracking" | "success">("auth")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Auth form state
  const [cpf, setCpf] = useState("")
  const [accessCode, setAccessCode] = useState("")

  // Budget data state
  const [order, setOrder] = useState<PublicOrder | null>(null)
  const [approvedItems, setApprovedItems] = useState<string[]>([]) // IDs of approved items

  // Extra Tracking states
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null)
  const [showApprovedItemsList, setShowApprovedItemsList] = useState(false)

  // Helper to determine status weight for 5 customer steps
  const getStepStatus = (stepKey: string, currentStatus: string) => {
    const statusWeight: Record<string, number> = {
      'CHECK_IN': 1,
      'AWAITING_BUDGET': 2,
      'AWAITING_APPROVAL': 3,
      'AWAITING_PARTS': 4,
      'IN_PROGRESS': 5,
      'TESTING_WASHING': 6,
      'READY': 7,
      'DELIVERED': 8,
    }

    const currentWeight = statusWeight[currentStatus] || 1

    if (stepKey === "CHECK_IN") {
      return currentWeight > 1 ? "completed" : "active"
    }
    if (stepKey === "BUDGET") {
      if (currentWeight < 3) return "pending"
      if (currentWeight === 3) return "active"
      return "completed"
    }
    if (stepKey === "EXECUTION") {
      if (currentWeight < 4) return "pending"
      if (currentWeight === 4 || currentWeight === 5) return "active"
      return "completed"
    }
    if (stepKey === "TESTING") {
      if (currentWeight < 6) return "pending"
      if (currentWeight === 6) return "active"
      return "completed"
    }
    if (stepKey === "READY") {
      if (currentWeight < 7) return "pending"
      if (currentWeight === 7) return "active"
      return "completed"
    }
    return "pending"
  }

  // Formatters
  const formatCPF = (val: string) => {
    const clean = val.replace(/\D/g, "")
    if (clean.length <= 11) {
      // CPF
      return clean
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})$/, "$1-$2")
    } else {
      // CNPJ fallback
      return clean
        .replace(/^(\d{2})(\d)/, "$1.$2")
        .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
        .replace(/\.(\d{3})(\d)/, ".$1/$2")
        .replace(/(\d{4})(\d)/, "$1-$2")
        .substring(0, 18)
    }
  }

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val)
  }

  const formatPlate = (plate: string) => {
    const clean = plate.toUpperCase().replace(/[^A-Z0-9]/g, "").trim()
    if (clean.length === 7) return `${clean.slice(0, 3)}-${clean.slice(3)}`
    return clean
  }

  const formatDate = (d: Date | string) => {
    return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })
  }

  // Handle access code input (limit 6 chars, uppercase)
  const handleAccessCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").substring(0, 6)
    setAccessCode(val)
  }

  // Auth Submission
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!resolvedId) return;
    if (!cpf || !accessCode) {
      setError("Por favor, preencha todos os campos.")
      return
    }

    setLoading(true)
    setError(null)
    try {
      const res = await getPublicWorkOrderAction(resolvedId, cpf, accessCode)
      if (res.success && res.data) {
        const orderData = res.data as unknown as PublicOrder
        setOrder(orderData)
        
        // Initialize approved items with the items already approved in DB
        const initiallyApproved = orderData.items
          .filter(item => item.isApproved === 1)
          .map(item => item.id)
        setApprovedItems(initiallyApproved)
        
        const isTrackingStatus = ["AWAITING_PARTS", "IN_PROGRESS", "TESTING_WASHING", "READY", "DELIVERED"].includes(orderData.status)
        if (isTrackingStatus) {
          setStep("tracking")
        } else {
          setStep("budget")
        }
      } else {
        setError(res.error ?? "Erro ao autenticar. Verifique o CPF e o Código.")
      }
    } catch (err: any) {
      setError(err.message ?? "Erro interno.")
    } finally {
      setLoading(false)
    }
  }

  // Toggle item approval
  const handleToggleItem = (itemId: string) => {
    setApprovedItems(prev => 
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    )
  }

  // Submit Approval
  const handleApprove = async () => {
    if (!resolvedId || !order) return
    
    setLoading(true)
    setError(null)
    try {
      const res = await approvePublicBudgetAction(resolvedId, approvedItems, cpf, accessCode)
      if (res.success) {
        setStep("success")
      } else {
        setError(res.error ?? "Erro ao salvar aprovação.")
      }
    } catch (err: any) {
      setError(err.message ?? "Erro interno ao salvar.")
    } finally {
      setLoading(false)
    }
  }

  // Live total calculations
  const calculateTotals = () => {
    if (!order) return { itemsTotal: 0, grandTotal: 0 }
    
    const itemsTotal = order.items
      .filter(item => approvedItems.includes(item.id))
      .reduce((sum, item) => sum + (parseFloat(item.unitSalePrice) * item.quantity), 0)
    
    const disc = parseFloat(order.discount) || 0
    const sur = parseFloat(order.surcharge) || 0
    const grandTotal = Math.max(0, itemsTotal - disc + sur)
    
    return { itemsTotal, grandTotal }
  }

  const { itemsTotal, grandTotal } = calculateTotals()

  return (
    <div className="min-h-screen bg-[#FAF9F6] dark:bg-zinc-950 text-foreground font-sans flex flex-col transition-colors duration-300">
      
      {/* Dynamic Step Rendering */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-6 w-full max-w-5xl mx-auto">
        <AnimatePresence mode="wait">
          
          {/* Step 1: Authentication */}
          {step === "auth" && (
            <motion.div
              key="auth-card"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="w-full max-w-md bg-card rounded-3xl border border-border/50 shadow-[0_15px_60px_-15px_rgba(0,0,0,0.08)] p-6 md:p-8 space-y-6"
            >
              <div className="flex flex-col items-center text-center space-y-2">
                <span className="bg-emerald-500/10 text-emerald-500 p-3 rounded-full border border-emerald-500/20">
                  <Lock className="size-6" />
                </span>
                <h1 className="text-xl font-bold tracking-tight text-foreground">Visualização de Orçamento</h1>
                <p className="text-xs text-muted-foreground max-w-[280px]">
                  Confirme seus dados para acessar o detalhamento técnico da sua Ordem de Serviço.
                </p>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-[11px] rounded-xl p-3 flex gap-2 items-center">
                  <AlertCircle className="size-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleAuth} className="space-y-4 text-xs font-semibold">
                
                {/* CPF */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">CPF/CNPJ do Proprietário *</label>
                  <input
                    type="text"
                    required
                    placeholder="EX: 123.456.789-00"
                    className="w-full text-xs border border-border rounded-lg h-10 px-3 bg-muted/20 focus:bg-card focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-hidden transition-all"
                    value={cpf}
                    onChange={(e) => setCpf(formatCPF(e.target.value))}
                  />
                </div>

                {/* Security Code */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Código de Acesso da OS *</label>
                  <input
                    type="text"
                    required
                    placeholder="EX: 123ABC"
                    className="w-full text-xs border border-border rounded-lg h-10 px-3 bg-muted/20 focus:bg-card focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-hidden transition-all font-mono font-bold tracking-widest uppercase"
                    value={accessCode}
                    onChange={handleAccessCodeChange}
                  />
                  <p className="text-[9px] text-muted-foreground font-medium mt-1 leading-normal">
                    Este código possui 6 dígitos (3 números e 3 letras) e está disponível sob o QR Code na via impressa do seu orçamento.
                  </p>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-10 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full font-black uppercase tracking-wider flex items-center justify-center gap-2 text-[10px] cursor-pointer shadow-xs disabled:opacity-50 transition-all mt-6 active:scale-95"
                >
                  {loading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 0.75, ease: "linear" }}
                      className="w-3.5 h-3.5 rounded-full border-2 border-transparent border-t-white"
                    />
                  ) : "Acessar Orçamento"}
                </button>

              </form>
            </motion.div>
          )}

          {/* Step 2: Budget Details */}
          {step === "budget" && order && (
            <motion.div
              key="budget-layout"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="w-full space-y-6"
            >
              
              {/* Header card */}
              <div className="bg-card rounded-3xl shadow-[0_10px_50px_-12px_rgba(0,0,0,0.04)] border border-border/50 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 text-card-foreground">
                <div className="flex items-center gap-3">
                  <div className="bg-emerald-500/10 text-emerald-500 p-2 rounded-xl border border-emerald-500/20">
                    <Building2 className="size-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-black text-foreground uppercase tracking-tight">
                      {order.branch?.name || "Oficina KyperFix"}
                    </h2>
                    <p className="text-[10px] text-muted-foreground font-medium uppercase mt-0.5">
                      {order.branch?.address || "Endereço não informado"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-start md:self-auto">
                  <div className="text-left md:text-right">
                    <span className="text-[9px] font-black text-emerald-500 tracking-wider block uppercase">Orçamento Digital</span>
                    <span className="text-sm font-extrabold text-foreground font-mono">
                      OS #{String(order.osNumber).padStart(4, "0")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Main 2-column info */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                
                {/* Left side: client, vehicle and diagnostic */}
                <div className="md:col-span-4 space-y-6">
                  
                  {/* Customer / Vehicle */}
                  <div className="bg-card rounded-3xl shadow-[0_10px_50px_-12px_rgba(0,0,0,0.04)] border border-border/50 p-5 space-y-4 text-card-foreground text-xs">
                    <h3 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-b border-dashed border-border pb-2 flex items-center gap-1.5">
                      <Car className="size-3.5 text-emerald-500" />
                      Identificação
                    </h3>

                    <div className="space-y-3 font-semibold">
                      <div>
                        <span className="text-[9px] text-muted-foreground uppercase font-bold block">Proprietário</span>
                        <p className="text-foreground uppercase text-xs font-bold mt-0.5">
                          {order.customer.name}
                        </p>
                      </div>

                      {order.vehicle && (
                        <div>
                          <span className="text-[9px] text-muted-foreground uppercase font-bold block">Veículo</span>
                          <p className="text-foreground uppercase text-xs font-bold mt-0.5">
                            {order.vehicle.brand} {order.vehicle.model}
                          </p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="bg-foreground text-background font-mono px-2 py-0.5 rounded-sm text-[9px] font-bold">
                              {formatPlate(order.vehicle.plate)}
                            </span>
                            {order.vehicle.year && (
                              <span className="text-[10px] text-muted-foreground">
                                Ano {order.vehicle.year}
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="border-t border-dashed border-border/60 pt-3">
                        <span className="text-[9px] text-muted-foreground uppercase font-bold block">Abertura do Registro</span>
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-0.5 font-medium">
                          <Calendar className="size-3.5" />
                          <span>{formatDate(order.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Diagnostic Technical */}
                  {order.diagnostic && (
                    <div className="bg-card rounded-3xl shadow-[0_10px_50px_-12px_rgba(0,0,0,0.04)] border border-border/50 p-5 space-y-3 text-card-foreground text-xs">
                      <h3 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-b border-dashed border-border pb-2 flex items-center gap-1.5">
                        <FileText className="size-3.5 text-emerald-500" />
                        Diagnóstico Técnico
                      </h3>
                      <p className="text-muted-foreground text-[10.5px] leading-relaxed font-medium">
                        {order.diagnostic}
                      </p>
                    </div>
                  )}

                </div>

                {/* Right side: Items selection and totals */}
                <div className="md:col-span-8 space-y-6">
                  
                  {/* Items List */}
                  <div className="bg-card rounded-3xl shadow-[0_10px_50px_-12px_rgba(0,0,0,0.04)] border border-border/50 p-5 space-y-4 text-card-foreground">
                    <div className="border-b border-dashed border-border pb-3 flex items-center justify-between">
                      <h3 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <Wrench className="size-3.5 text-emerald-500" />
                        Selecione as Peças e Serviços para Aprovação
                      </h3>
                      <span className="text-[10px] font-bold text-emerald-500 font-mono bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        {approvedItems.length} selecionados
                      </span>
                    </div>

                    <div className="space-y-3">
                      {order.items.map(item => {
                        const isPart = item.type === "PART"
                        const name = item.customName || item.partName || item.serviceName || "Item desconhecido"
                        const isChecked = approvedItems.includes(item.id)
                        const itemPrice = parseFloat(item.unitSalePrice)
                        
                        return (
                          <div 
                            key={item.id}
                            onClick={() => handleToggleItem(item.id)}
                            className={cn(
                              "p-3.5 border rounded-2xl flex items-center justify-between cursor-pointer transition-all",
                              isChecked 
                                ? "bg-emerald-500/5 border-emerald-500/30 dark:bg-emerald-500/5" 
                                : "bg-muted/10 border-border/40 hover:bg-muted/20"
                            )}
                          >
                            <div className="flex items-center gap-3">
                              {/* Custom circular checkbox */}
                              <div className={cn(
                                "size-4.5 rounded-full border flex items-center justify-center transition-all shrink-0",
                                isChecked 
                                  ? "bg-emerald-500 border-emerald-500 text-white" 
                                  : "border-muted-foreground/30 bg-card"
                              )}>
                                {isChecked && <Check className="size-3 stroke-[3]" />}
                              </div>

                              <div className="grid">
                                <span className="text-xs font-bold text-foreground uppercase tracking-tight leading-snug line-clamp-1">
                                  {name}
                                </span>
                                <div className="flex items-center gap-2 text-[9px] text-muted-foreground uppercase font-semibold mt-0.5">
                                  <span className="flex items-center gap-0.5">
                                    {isPart ? <Package className="size-2.5" /> : <Wrench className="size-2.5" />}
                                    {isPart ? "Peça" : "Serviço"}
                                  </span>
                                  <span>·</span>
                                  <span>QTD: {item.quantity}</span>
                                </div>
                              </div>
                            </div>

                            <div className="text-right">
                              <span className="text-xs font-black text-foreground font-mono">
                                {formatCurrency(itemPrice * item.quantity)}
                              </span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Calculations and Actions */}
                  <div className="bg-card rounded-3xl shadow-[0_10px_50px_-12px_rgba(0,0,0,0.04)] border border-border/50 p-5 space-y-4 text-card-foreground text-xs font-semibold">
                    <h3 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-b border-dashed border-border pb-2 flex items-center gap-1.5">
                      <DollarSign className="size-3.5 text-emerald-500" />
                      Resumo de Valores
                    </h3>

                    <div className="space-y-2.5 pt-1">
                      <div className="flex justify-between items-center text-muted-foreground">
                        <span>SUBTOTAL DOS ITENS SELECIONADOS:</span>
                        <span className="font-mono text-foreground font-bold">{formatCurrency(itemsTotal)}</span>
                      </div>

                      {parseFloat(order.discount) > 0 && (
                        <div className="flex justify-between items-center text-muted-foreground">
                          <span>DESCONTO APLICADO:</span>
                          <span className="font-mono text-red-500 font-bold">- {formatCurrency(parseFloat(order.discount))}</span>
                        </div>
                      )}

                      {parseFloat(order.surcharge) > 0 && (
                        <div className="flex justify-between items-center text-muted-foreground">
                          <span>ACRÉSCIMO/TAXAS:</span>
                          <span className="font-mono text-emerald-500 font-bold">+ {formatCurrency(parseFloat(order.surcharge))}</span>
                        </div>
                      )}

                      <div className="flex justify-between items-center pt-3 border-t border-dashed border-border">
                        <span className="text-xs font-bold uppercase tracking-wider text-foreground">Valor Total Estimado:</span>
                        <span className="text-lg font-black text-emerald-500 tracking-tight font-mono">{formatCurrency(grandTotal)}</span>
                      </div>
                    </div>

                    {error && (
                      <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-[11px] rounded-xl p-3 flex gap-2 items-center">
                        <AlertCircle className="size-4 shrink-0" />
                        <span>{error}</span>
                      </div>
                    )}

                    <div className="pt-4 flex flex-col sm:flex-row gap-3">
                      <button
                        type="button"
                        onClick={handleApprove}
                        disabled={loading || approvedItems.length === 0}
                        className="flex-1 h-11 bg-emerald-500 hover:bg-emerald-600 disabled:bg-muted-foreground/30 text-white rounded-full font-black uppercase tracking-wider flex items-center justify-center gap-2 text-[10px] cursor-pointer shadow-xs disabled:opacity-50 transition-all active:scale-95"
                      >
                        {loading ? (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 0.75, ease: "linear" }}
                            className="w-3.5 h-3.5 rounded-full border-2 border-transparent border-t-white"
                          />
                        ) : (
                          <>
                            <Check className="size-4" />
                            <span>Confirmar e Iniciar Serviços</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="bg-muted/20 p-4 border border-border/50 rounded-2xl flex gap-3 text-[10px] text-muted-foreground leading-relaxed">
                      <Info className="size-4 text-muted-foreground shrink-0 mt-0.5" />
                      <p>
                        Ao confirmar, os serviços selecionados entrarão na fila de execução automática e os mecânicos responsáveis serão notificados. Peças em estoque serão reservadas para a sua OS.
                      </p>
                    </div>
                  </div>

                </div>

              </div>

            </motion.div>
          )}

          {/* Step 3: Success message */}
          {step === "success" && order && (
            <motion.div
              key="success-card"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-card rounded-3xl border border-border/50 shadow-[0_15px_60px_-15px_rgba(0,0,0,0.08)] p-6 md:p-8 text-center space-y-6"
            >
              <div className="flex flex-col items-center space-y-3">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  className="bg-emerald-500 text-white p-4 rounded-full border-4 border-emerald-500/20"
                >
                  <Check className="size-8 stroke-[3.5]" />
                </motion.div>
                <h1 className="text-xl font-bold tracking-tight text-foreground">Orçamento Aprovado!</h1>
                <p className="text-xs text-muted-foreground max-w-[280px]">
                  Sua autorização foi enviada com sucesso para a nossa equipe técnica.
                </p>
              </div>

              <div className="bg-muted/20 p-4 border border-border/50 rounded-2xl text-xs font-semibold text-left space-y-2.5">
                <div className="flex justify-between items-center text-muted-foreground text-[10px]">
                  <span>RESUMO DA TRANSAÇÃO:</span>
                  <span className="font-mono text-foreground font-bold">OS #{String(order.osNumber).padStart(4, "0")}</span>
                </div>
                <div className="flex justify-between items-center text-muted-foreground">
                  <span>Itens Aprovados:</span>
                  <span className="text-foreground">{approvedItems.length} de {order.items.length}</span>
                </div>
                <div className="flex justify-between items-center text-muted-foreground pt-2.5 border-t border-dashed border-border">
                  <span className="text-foreground font-bold uppercase text-[10px]">Total Autorizado:</span>
                  <span className="text-sm font-black text-emerald-500 font-mono">{formatCurrency(grandTotal)}</span>
                </div>
              </div>

              <div className="text-[10px] text-muted-foreground max-w-[260px] mx-auto leading-normal">
                Você receberá novas atualizações do status do seu veículo diretamente pelo celular ou WhatsApp conforme o serviço progrida. Obrigado!
              </div>
            </motion.div>
          )}

          {/* Step 4: Live Tracking Portal */}
          {step === "tracking" && order && (
            <motion.div
              key="tracking-layout"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="w-full space-y-6 text-card-foreground"
            >
              {/* Header card */}
              <div className="bg-card rounded-3xl shadow-[0_10px_50px_-12px_rgba(0,0,0,0.04)] border border-border/50 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="bg-emerald-500/10 text-emerald-500 p-2 rounded-xl border border-emerald-500/20">
                    <Building2 className="size-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-black text-foreground uppercase tracking-tight">
                      {order.branch?.name || "Oficina KyperFix"}
                    </h2>
                    <p className="text-[10px] text-muted-foreground font-medium uppercase mt-0.5">
                      {order.branch?.address || "Endereço não informado"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-left md:text-right">
                    <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider animate-pulse">
                      <span className="size-1.5 bg-emerald-500 rounded-full" />
                      Status: {
                        order.status === "AWAITING_PARTS" ? "Aguardando Peças" :
                        order.status === "IN_PROGRESS" ? "Em Execução" :
                        order.status === "TESTING_WASHING" ? "Testes e Lavagem" :
                        order.status === "READY" ? "Pronto para Retirada" :
                        order.status === "DELIVERED" ? "Entregue" : "Em Triagem"
                      }
                    </span>
                    <span className="text-xs font-extrabold text-foreground font-mono block mt-1">
                      OS #{String(order.osNumber).padStart(4, "0")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Main content grid */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                
                {/* Left side: Vehicle metadata, Mechanic details, collapsible approved list */}
                <div className="md:col-span-4 space-y-6">
                  
                  {/* Vehicle Metadata */}
                  <div className="bg-card rounded-3xl shadow-[0_10px_50px_-12px_rgba(0,0,0,0.04)] border border-border/50 p-5 space-y-4 text-xs">
                    <h3 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-b border-dashed border-border pb-2 flex items-center gap-1.5">
                      <Car className="size-3.5 text-emerald-500" />
                      Informações do Veículo
                    </h3>

                    <div className="space-y-3 font-semibold">
                      <div>
                        <span className="text-[9px] text-muted-foreground uppercase font-bold block">Proprietário</span>
                        <p className="text-foreground uppercase text-xs font-bold mt-0.5">
                          {order.customer.name}
                        </p>
                      </div>

                      {order.vehicle && (
                        <div>
                          <span className="text-[9px] text-muted-foreground uppercase font-bold block">Veículo</span>
                          <p className="text-foreground uppercase text-xs font-bold mt-0.5">
                            {order.vehicle.brand} {order.vehicle.model}
                          </p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="bg-foreground text-background font-mono px-2 py-0.5 rounded-sm text-[9px] font-bold">
                              {formatPlate(order.vehicle.plate)}
                            </span>
                            {order.vehicle.year && (
                              <span className="text-[10px] text-muted-foreground">
                                Ano {order.vehicle.year}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Mechanic Profile */}
                  <div className="bg-card rounded-3xl shadow-[0_10px_50px_-12px_rgba(0,0,0,0.04)] border border-border/50 p-5 space-y-4">
                    <h3 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-b border-dashed border-border pb-2 flex items-center gap-1.5">
                      <User className="size-3.5 text-emerald-500" />
                      Mecânico Responsável
                    </h3>

                    {order.mechanic ? (
                      <div className="flex items-start gap-3.5">
                        {order.mechanic.image ? (
                          <img 
                            src={order.mechanic.image} 
                            alt={order.mechanic.name} 
                            className="size-11 rounded-full object-cover border border-border" 
                          />
                        ) : (
                          <div className="size-11 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center shrink-0">
                            <User className="size-5" />
                          </div>
                        )}
                        <div className="grid gap-1">
                          <span className="text-xs font-extrabold text-foreground">{order.mechanic.name}</span>
                          <p className="text-[9px] text-muted-foreground leading-normal font-semibold">
                            Técnico encarregado dos serviços do seu veículo.
                          </p>
                          {order.mechanic.specialties && order.mechanic.specialties.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {order.mechanic.specialties.map((spec, i) => (
                                <span key={i} className="text-[8px] font-bold uppercase tracking-tight bg-muted border border-border/50 px-1.5 py-0.5 rounded-md text-muted-foreground">
                                  {spec}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 bg-muted/20 p-3 rounded-2xl border border-dashed border-border">
                        <Wrench className="size-5 text-muted-foreground/60 animate-pulse shrink-0" />
                        <div className="grid">
                          <span className="text-[10px] font-bold text-foreground">Equipe KyperFix</span>
                          <span className="text-[9px] text-muted-foreground">Aguardando alocação de mecânico de pátio.</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Collapsible Approved Items summary */}
                  <div className="bg-card rounded-3xl shadow-[0_10px_50px_-12px_rgba(0,0,0,0.04)] border border-border/50 p-5 space-y-3">
                    <button
                      type="button"
                      onClick={() => setShowApprovedItemsList(!showApprovedItemsList)}
                      className="w-full flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-b border-dashed border-border pb-2 focus:outline-hidden"
                    >
                      <span className="flex items-center gap-1.5">
                        <FileText className="size-3.5 text-emerald-500" />
                        Serviços Contratados
                      </span>
                      {showApprovedItemsList ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                    </button>

                    <AnimatePresence initial={false}>
                      {showApprovedItemsList && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25 }}
                          className="overflow-hidden space-y-3 pt-1 text-xs"
                        >
                          <div className="space-y-2 divide-y divide-dashed divide-border/40">
                            {order.items.filter(it => it.isApproved === 1).map(item => {
                              const name = item.customName || item.partName || item.serviceName || "Item"
                              return (
                                <div key={item.id} className="pt-2 flex justify-between items-center text-[11px] font-semibold">
                                  <div className="grid">
                                    <span className="text-foreground uppercase tracking-tight font-bold">{name}</span>
                                    <span className="text-[9px] text-muted-foreground uppercase">QTD: {item.quantity} · {item.type === "PART" ? "Peça" : "Serviço"}</span>
                                  </div>
                                  <span className="font-mono text-foreground">{formatCurrency(parseFloat(item.unitSalePrice) * item.quantity)}</span>
                                </div>
                              )
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="flex justify-between items-center pt-2 text-xs font-bold border-t border-dashed border-border/60">
                      <span className="text-muted-foreground text-[10px] uppercase">Total Aprovado:</span>
                      <span className="font-mono text-emerald-500 text-sm font-black">{formatCurrency(grandTotal)}</span>
                    </div>
                  </div>

                </div>

                {/* Right side: Realtime Timeline and Photo gallery */}
                <div className="md:col-span-8 space-y-6">
                  
                  {/* Timeline Tracker */}
                  <div className="bg-card rounded-3xl shadow-[0_10px_50px_-12px_rgba(0,0,0,0.04)] border border-border/50 p-5 space-y-5">
                    <h3 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-b border-dashed border-border pb-2 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Clock className="size-3.5 text-emerald-500" />
                        Linha do Tempo de Manutenção
                      </span>
                      <span className="text-[9px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        Atualizado em tempo real
                      </span>
                    </h3>

                    {/* Timeline vertical list */}
                    <div className="relative pl-6 space-y-6 text-xs border-l border-border/60 ml-2 pt-1 pb-1">
                      {[
                        { key: "CHECK_IN", title: "Check-in do Veículo", desc: "Seu veículo deu entrada na oficina e foi realizada a triagem inicial com check-in fotográfico." },
                        { key: "BUDGET", title: "Orçamento Técnico", desc: "Nossa equipe realizou o diagnóstico completo e registrou a lista de peças e serviços necessários." },
                        { key: "EXECUTION", title: "Serviço em Execução", desc: order.allocatedBox ? `Seu veículo está na doca ${order.allocatedBox} - Instalação de peças e execução de serviços em andamento.` : "O mecânico responsável iniciou a execução dos consertos autorizados no pátio da oficina." },
                        { key: "TESTING", title: "Testes de Qualidade & Limpeza", desc: "Após a execução, realizamos testes de rodagem para garantir o conserto e preparamos a higienização." },
                        { key: "READY", title: "Pronto para Retirada", desc: "Seu veículo está pronto, testado e limpo. Aguardamos sua visita para faturamento e entrega." }
                      ].map((stepItem, idx) => {
                        const stepState = getStepStatus(stepItem.key, order.status);
                        
                        // Busca data de transição correspondente
                        let transitionDate: Date | null = null;
                        if (stepItem.key === "CHECK_IN") {
                          const log = order.statusHistory.find(h => h.status === "CHECK_IN");
                          transitionDate = log ? new Date(log.createdAt) : new Date(order.createdAt);
                        } else if (stepItem.key === "BUDGET") {
                          const log = order.statusHistory.find(h => ["AWAITING_APPROVAL", "AWAITING_PARTS", "IN_PROGRESS", "TESTING_WASHING", "READY", "DELIVERED"].includes(h.status));
                          transitionDate = log ? new Date(log.createdAt) : null;
                        } else if (stepItem.key === "EXECUTION") {
                          const log = order.statusHistory.find(h => ["IN_PROGRESS", "AWAITING_PARTS"].includes(h.status));
                          transitionDate = log ? new Date(log.createdAt) : null;
                        } else if (stepItem.key === "TESTING") {
                          const log = order.statusHistory.find(h => h.status === "TESTING_WASHING");
                          transitionDate = log ? new Date(log.createdAt) : null;
                        } else if (stepItem.key === "READY") {
                          const log = order.statusHistory.find(h => ["READY", "DELIVERED"].includes(h.status));
                          transitionDate = log ? new Date(log.createdAt) : null;
                        }

                        return (
                          <div key={idx} className="relative group">
                            
                            {/* Dot icon indicator */}
                            <div className={cn(
                              "absolute -left-9.5 top-0.5 size-7 rounded-full flex items-center justify-center border transition-all z-10",
                              stepState === "completed" ? "bg-emerald-500 border-emerald-500 text-white shadow-emerald-500/20" :
                              stepState === "active" ? "bg-card border-emerald-500 text-emerald-500 shadow-md shadow-emerald-500/10 ring-4 ring-emerald-500/10" :
                              "bg-muted border-border/80 text-muted-foreground/60"
                            )}>
                              {stepState === "completed" ? (
                                <Check className="size-4 stroke-[3]" />
                              ) : stepState === "active" ? (
                                <Wrench className="size-3.5 animate-spin-slow text-emerald-500" />
                              ) : (
                                <div className="size-1.5 bg-muted-foreground/40 rounded-full" />
                              )}
                            </div>

                            <div className="grid gap-0.5 pr-2">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                                <span className={cn(
                                  "font-bold text-xs uppercase tracking-tight",
                                  stepState === "completed" ? "text-foreground" :
                                  stepState === "active" ? "text-emerald-500" :
                                  "text-muted-foreground/60"
                                )}>
                                  {stepItem.title}
                                </span>
                                {transitionDate && (
                                  <span className="text-[9px] font-mono text-muted-foreground/75 font-bold uppercase">
                                    {transitionDate.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })} às {transitionDate.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                                  </span>
                                )}
                              </div>
                              <p className={cn(
                                "text-[10.5px] leading-relaxed font-semibold mt-0.5",
                                stepState === "completed" ? "text-muted-foreground" :
                                stepState === "active" ? "text-foreground/95 font-bold" :
                                "text-muted-foreground/45"
                              )}>
                                {stepItem.desc}
                              </p>
                            </div>

                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Photo Gallery */}
                  <div className="bg-card rounded-3xl shadow-[0_10px_50px_-12px_rgba(0,0,0,0.04)] border border-border/50 p-5 space-y-4">
                    <h3 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-b border-dashed border-border pb-2 flex items-center gap-1.5">
                      <Camera className="size-3.5 text-emerald-500" />
                      Galeria de Fotos do Serviço
                    </h3>

                    {order.photoUrls && order.photoUrls.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {order.photoUrls.map((photo, i) => (
                          <div 
                            key={i} 
                            onClick={() => setSelectedPhoto(photo)}
                            className="relative group aspect-4/3 overflow-hidden rounded-2xl border border-border/60 bg-muted/30 cursor-pointer shadow-sm hover:border-emerald-500/40 transition-all hover:scale-102"
                          >
                            <img 
                              src={photo} 
                              alt={`Foto do serviço ${i + 1}`} 
                              className="size-full object-cover transition-transform group-hover:scale-105 duration-300"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                              <span className="bg-card/90 text-foreground text-[8px] font-extrabold uppercase px-2 py-1 rounded-md border border-border shadow-xs opacity-0 group-hover:opacity-100 transition-opacity">
                                Ampliar
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="border border-dashed border-border/80 rounded-2xl p-8 text-center text-xs space-y-2">
                        <ImageIcon className="size-7 text-muted-foreground/40 mx-auto" />
                        <p className="text-muted-foreground uppercase font-bold text-[9px] tracking-wider">Aguardando Fotos</p>
                        <p className="text-muted-foreground/60 text-[10px] max-w-xs mx-auto leading-normal">
                          Fotos do veículo em execução serão disponibilizadas nesta galeria conforme o mecânico atualize o andamento do serviço.
                        </p>
                      </div>
                    )}
                  </div>

                </div>

              </div>

            </motion.div>
          )}

          {/* Photo Lightbox Overlay */}
          <AnimatePresence>
            {selectedPhoto && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedPhoto(null)}
                className="fixed inset-0 bg-black/90 z-100 flex items-center justify-center p-4 md:p-6 backdrop-blur-xs cursor-zoom-out"
              >
                <button 
                  type="button" 
                  onClick={() => setSelectedPhoto(null)} 
                  className="absolute top-4 right-4 bg-zinc-800/80 hover:bg-zinc-700/80 text-white rounded-full p-2.5 border border-zinc-700 cursor-pointer transition-all active:scale-90 z-110"
                >
                  <X className="size-5" />
                </button>
                <motion.div
                  initial={{ scale: 0.95, y: 10 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.95, y: 10 }}
                  transition={{ type: "spring", damping: 25, stiffness: 300 }}
                  onClick={(e) => e.stopPropagation()}
                  className="relative max-w-4xl max-h-[85vh] overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950 shadow-2xl flex items-center justify-center cursor-default"
                >
                  <img 
                    src={selectedPhoto} 
                    alt="Visualização ampliada do serviço" 
                    className="max-w-full max-h-[85vh] object-contain"
                  />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

        </AnimatePresence>
      </main>

    </div>
  )
}
