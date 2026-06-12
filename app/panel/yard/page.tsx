"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Wrench, 
  Plus, 
  Clock, 
  User, 
  Search, 
  Info,
  Trash2,
  Edit3,
  Car,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  ArrowRight,
  MapPin,
  Play
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { MotionContainer, MotionItem } from "@/components/ui/motion-layout"

import { 
  getYardOrdersAction, 
  createWorkOrderAction,
  updateWorkOrderAction 
} from "@/lib/actions/orders-actions"

interface YardOrder {
  id: string
  osNumber: number
  status: string
  createdAt: Date | string
  statusChangedAt: Date | string
  customerName: string
  customerPhone: string
  vehiclePlate: string
  vehicleBrand: string
  vehicleModel: string
  mechanicName: string | null
  allocatedBox: string | null
  totalPrice?: number
}

const DEFAULT_DOCKS = [
  "Rampa 1",
  "Rampa 2",
  "Rampa 3",
  "Box 1",
  "Box 2",
  "Pátio Geral"
]

export default function YardPage() {
  const [orders, setOrders] = useState<YardOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [isIntakeOpen, setIsIntakeOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [isSimulationMode, setIsSimulationMode] = useState(false)

  // Express Ticket Intake Form
  const [plate, setPlate] = useState("")
  const [customerName, setCustomerName] = useState("")
  const [whatsapp, setWhatsapp] = useState("")
  const [targetBox, setTargetBox] = useState("")

  // Load orders
  const load = async () => {
    setLoading(true)
    const simMode = typeof window !== "undefined" && localStorage.getItem("kyperfix_simulation_mode") === "true"
    setIsSimulationMode(simMode)

    if (simMode) {
      const stored = localStorage.getItem("kyperfix_simulated_orders")
      if (stored) {
        setOrders(JSON.parse(stored))
      } else {
        const initialSimulated = [
          {
            id: "sim-order-1",
            osNumber: 9901,
            status: "IN_PROGRESS",
            createdAt: new Date(Date.now() - 30 * 60000).toISOString(),
            statusChangedAt: new Date(Date.now() - 30 * 60000).toISOString(),
            customerName: "Carlos Souza",
            customerPhone: "21999999991",
            vehiclePlate: "CIV9E12",
            vehicleBrand: "Honda",
            vehicleModel: "Civic",
            mechanicName: "Roberto",
            allocatedBox: "Rampa 1",
            totalPrice: 1200
          },
          {
            id: "sim-order-2",
            osNumber: 9902,
            status: "AWAITING_APPROVAL",
            createdAt: new Date(Date.now() - 10 * 60000).toISOString(),
            statusChangedAt: new Date(Date.now() - 10 * 60000).toISOString(),
            customerName: "Ana Maria",
            customerPhone: "21999999992",
            vehiclePlate: "TOY4A12",
            vehicleBrand: "Toyota",
            vehicleModel: "Corolla",
            mechanicName: null,
            allocatedBox: "Rampa 2",
            totalPrice: 750
          },
          {
            id: "sim-order-3",
            osNumber: 9903,
            status: "READY",
            createdAt: new Date(Date.now() - 5 * 3600000).toISOString(),
            statusChangedAt: new Date(Date.now() - 5 * 3600000).toISOString(),
            customerName: "Pedro Santos",
            customerPhone: "21999999993",
            vehiclePlate: "CHE5O24",
            vehicleBrand: "Chevrolet",
            vehicleModel: "Onix",
            mechanicName: "Bruno",
            allocatedBox: "Box 1",
            totalPrice: 450
          }
        ];
        localStorage.setItem("kyperfix_simulated_orders", JSON.stringify(initialSimulated))
        setOrders(initialSimulated)
      }
      setLoading(false)
    } else {
      try {
        const res = await getYardOrdersAction()
        if (res.success && res.data) {
          setOrders(res.data as unknown as YardOrder[])
        } else {
          toast.error("Erro ao carregar dados do pátio: " + res.error)
        }
      } catch (err: any) {
        toast.error("Erro de conexão: " + err.message)
      } finally {
        setLoading(false)
      }
    }
  }

  useEffect(() => {
    load()

    const handleSimChange = () => {
      load()
    }
    window.addEventListener("kyperfix-simulation-changed", handleSimChange)
    return () => window.removeEventListener("kyperfix-simulation-changed", handleSimChange)
  }, [])

  const handleSimulateAdvance = (id: string) => {
    const updated = orders.map(o => {
      if (o.id === id) {
        let nextStatus = o.status
        switch (o.status) {
          case 'CHECK_IN':
            nextStatus = 'AWAITING_APPROVAL'
            break
          case 'AWAITING_APPROVAL':
            nextStatus = 'IN_PROGRESS'
            break
          case 'IN_PROGRESS':
            nextStatus = 'READY'
            break
          case 'READY':
            nextStatus = 'DELIVERED'
            break
          default:
            nextStatus = 'CHECK_IN'
        }
        return {
          ...o,
          status: nextStatus,
          statusChangedAt: new Date().toISOString()
        }
      }
      return o
    })
    
    localStorage.setItem("kyperfix_simulated_orders", JSON.stringify(updated))
    setOrders(updated)
    window.dispatchEvent(new Event("kyperfix-simulation-changed"))
    toast.success("Status do veículo avançado com sucesso!")
  }

  const handleSimulateRemove = (id: string) => {
    const updated = orders.filter(o => o.id !== id)
    localStorage.setItem("kyperfix_simulated_orders", JSON.stringify(updated))
    setOrders(updated)
    window.dispatchEvent(new Event("kyperfix-simulation-changed"))
    toast.success("Veículo liberado/removido do pátio.")
  }

  // Map 8 database statuses to 3 flow stages
  const getLifecycleStage = (status: string): { key: 'intake' | 'ramp' | 'ready', label: string, color: string } => {
    switch (status) {
      case 'CHECK_IN':
      case 'AWAITING_BUDGET':
      case 'AWAITING_APPROVAL':
        return { key: 'intake', label: 'Conferência', color: 'text-blue-500 bg-blue-500/10 border-blue-500/20' }
      case 'AWAITING_PARTS':
      case 'IN_PROGRESS':
      case 'TESTING_WASHING':
        return { key: 'ramp', label: 'Na Rampa', color: 'text-amber-500 bg-amber-500/10 border-amber-500/20' }
      case 'READY':
      default:
        return { key: 'ready', label: 'Liberado', color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' }
    }
  }

  // Check for bottlenecks
  const checkBottleneck = (order: YardOrder) => {
    const elapsedMs = new Date().getTime() - new Date(order.statusChangedAt).getTime()
    const elapsedHours = elapsedMs / (1000 * 60 * 60)
    const stage = getLifecycleStage(order.status).key

    if (stage === 'intake' && elapsedHours > 2) return true
    if (stage === 'ramp' && elapsedHours > 4) return true
    if (stage === 'ready' && elapsedHours > 24) return true

    return false
  }

  const formatPlate = (p: string) => {
    const clean = p.toUpperCase().replace(/[^A-Z0-9]/g, "").trim()
    if (clean.length === 7) return `${clean.slice(0, 3)}-${clean.slice(3)}`
    return clean
  }

  // Submit Express Ticket
  const handleExpressIntake = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!plate || !customerName || !whatsapp) {
      toast.error("Por favor, preencha todos os campos obrigatórios.")
      return
    }

    setSubmitting(true)
    if (isSimulationMode) {
      try {
        const newOrder: YardOrder = {
          id: "sim-order-" + Math.random().toString(36).substr(2, 9),
          osNumber: orders.length > 0 ? Math.max(...orders.map(o => o.osNumber)) + 1 : 1001,
          status: 'CHECK_IN',
          createdAt: new Date().toISOString(),
          statusChangedAt: new Date().toISOString(),
          customerName: customerName,
          customerPhone: whatsapp.replace(/\D/g, ""),
          vehiclePlate: plate.toUpperCase(),
          vehicleBrand: "Veículo Simulado",
          vehicleModel: "Importado / Nacional",
          mechanicName: null,
          allocatedBox: targetBox || "Pátio Geral",
          totalPrice: 250
        }

        const updatedOrders = [...orders, newOrder]
        localStorage.setItem("kyperfix_simulated_orders", JSON.stringify(updatedOrders))
        setOrders(updatedOrders)
        
        window.dispatchEvent(new Event("kyperfix-simulation-changed"))

        toast.success("Entrada rápida simulada com sucesso!")
        setIsIntakeOpen(false)
        setPlate("")
        setCustomerName("")
        setWhatsapp("")
        setTargetBox("")
      } catch (err: any) {
        toast.error("Erro interno na simulação: " + err.message)
      } finally {
        setSubmitting(false)
      }
      return
    }

    try {
      const payload = {
        newVehiclePlate: plate.toUpperCase(),
        newVehicleBrand: "Importado / Nacional", // padrão assumido
        newVehicleModel: "Veículo",
        newCustomerName: customerName,
        newCustomerPhone: whatsapp.replace(/\D/g, ""),
        allocatedBox: targetBox || undefined,
        status: 'CHECK_IN'
      }

      const res = await createWorkOrderAction(payload as any)
      if (res.success) {
        toast.success("Entrada rápida realizada com sucesso!")
        setIsIntakeOpen(false)
        setPlate("")
        setCustomerName("")
        setWhatsapp("")
        setTargetBox("")
        load()
      } else {
        toast.error("Erro ao criar ticket: " + res.error)
      }
    } catch (err: any) {
      toast.error("Erro interno: " + err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex-1 p-4 md:p-6 bg-[#FAF9F6] dark:bg-zinc-950 min-h-screen font-sans space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <span className="bg-emerald-500/10 text-emerald-500 p-1.5 rounded-lg border border-emerald-500/20">
              <MapPin className="size-4.5" />
            </span>
            Controle de Pátio & Docas
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5 geist-mono pl-10">
            Painel logístico reativo inspirado em WMS. Visualize docas de trabalho, gargalos e liberação rápida.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={() => {
              const newMode = !isSimulationMode
              localStorage.setItem("kyperfix_simulation_mode", String(newMode))
              window.dispatchEvent(new Event("kyperfix-simulation-changed"))
              toast.success(newMode ? "Modo de Simulação ativo!" : "Retornou ao modo de produção real.")
            }}
            variant={isSimulationMode ? "default" : "outline"}
            className={cn(
              "text-xs font-bold py-1 px-3 h-9 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer",
              isSimulationMode 
                ? "bg-amber-500 hover:bg-amber-600 text-white border-amber-650/20" 
                : "bg-card text-muted-foreground hover:text-foreground border-border/50"
            )}
          >
            <Play className={cn("size-3.5", isSimulationMode ? "fill-white" : "")} />
            {isSimulationMode ? "Simulação Ativa" : "Demonstração / Simulação"}
          </Button>

          <Button
            onClick={() => {
              setTargetBox("")
              setIsIntakeOpen(true)
            }}
            className="bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs rounded-none px-5 py-2.5 h-auto transition-all shadow-md active:scale-95 flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="size-4" />
            Entrada Rápida (30s)
          </Button>
        </div>
      </div>

      {isSimulationMode && (
        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-600 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-left">
            <span className="bg-amber-500/20 text-amber-600 p-1.5 rounded-lg border border-amber-500/35">
              <AlertTriangle className="size-4 animate-pulse" />
            </span>
            <div className="grid">
              <span className="text-xs font-bold text-foreground">Você está no Modo de Simulação do Pátio</span>
              <span className="text-[10px] text-muted-foreground">
                As vagas e veículos exibidos são simulações salvas no seu navegador. Avance o fluxo dos carros ou adicione novos para testar.
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="xs"
              onClick={() => {
                localStorage.removeItem("kyperfix_simulated_orders")
                load()
                toast.success("Simulação resetada para o estado inicial.")
              }}
              className="text-[10px] font-bold text-amber-600 hover:text-amber-700 bg-amber-500/5 hover:bg-amber-500/10 border-amber-500/20 h-7 px-3 shrink-0"
            >
              Resetar Dados
            </Button>
            <Button
              variant="default"
              size="xs"
              onClick={() => {
                localStorage.setItem("kyperfix_simulation_mode", "false")
                window.dispatchEvent(new Event("kyperfix-simulation-changed"))
                toast.success("Retornou ao modo de produção real.")
              }}
              className="text-[10px] font-bold bg-amber-550 hover:bg-amber-600 text-white h-7 px-3 shrink-0"
            >
              Sair da Simulação
            </Button>
          </div>
        </div>
      )}

      {/* Dock Grid View */}
      {loading ? (
        <div className="text-center py-16 text-xs text-muted-foreground font-medium">
          Carregando status das docas...
        </div>
      ) : (
        <MotionContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" staggerChildren={0.04}>
          {DEFAULT_DOCKS.map((dockName) => {
            // Find active order in this dock
            const activeOrder = orders.find(
              (o) => o.allocatedBox?.toLowerCase() === dockName.toLowerCase()
            )

            const hasBottleneck = activeOrder ? checkBottleneck(activeOrder) : false
            const stage = activeOrder ? getLifecycleStage(activeOrder.status) : null

            return (
              <MotionItem key={dockName}>
                <motion.div 
                  layout
                  className={cn(
                    "bg-card rounded-3xl border p-5 space-y-4 shadow-sm transition-all duration-300 relative",
                    activeOrder 
                      ? hasBottleneck
                        ? "border-red-500/35 bg-red-500/[0.01] animate-pulse-slow shadow-lg shadow-red-500/5"
                        : "border-emerald-500/20"
                      : "border-border/50 border-dashed hover:border-emerald-500/20 hover:bg-emerald-500/[0.01]"
                  )}
                >
                {/* Header Doca */}
                <div className="flex items-center justify-between pb-3 border-b border-dashed border-border/80">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "p-1 rounded-md text-[10px] font-black uppercase font-mono tracking-tight",
                      activeOrder ? "bg-emerald-500/10 text-emerald-500" : "bg-muted text-muted-foreground"
                    )}>
                      {dockName}
                    </span>
                  </div>
                  {activeOrder ? (
                    <span className={cn("text-[9px] font-black uppercase px-2 py-0.5 rounded-full border", stage?.color)}>
                      {stage?.label}
                    </span>
                  ) : (
                    <span className="text-[9px] font-bold uppercase text-muted-foreground/60">Livre</span>
                  )}
                </div>

                {/* Body Content */}
                {activeOrder ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <div className="grid">
                          <span className="text-xs font-black text-foreground uppercase tracking-tight line-clamp-1">
                            {activeOrder.customerName}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            OS #{String(activeOrder.osNumber).padStart(4, "0")}
                          </span>
                        </div>
                        <span className="bg-foreground text-background font-mono px-2 py-0.5 rounded-sm text-[10px] font-bold shrink-0 shadow-xs">
                          {formatPlate(activeOrder.vehiclePlate)}
                        </span>
                      </div>

                      <div className="text-[11px] text-muted-foreground uppercase font-bold">
                        {activeOrder.vehicleBrand} {activeOrder.vehicleModel}
                      </div>
                    </div>

                    {/* Operational Infos */}
                    <div className="grid grid-cols-2 gap-2 text-[10px] bg-muted/20 p-2.5 rounded-2xl border border-border/40">
                      <div className="space-y-0.5">
                        <span className="text-muted-foreground uppercase font-bold block text-[8px]">Mecânico</span>
                        <span className="font-semibold text-foreground truncate block">
                          {activeOrder.mechanicName || "Não alocado"}
                        </span>
                      </div>
                      <div className="space-y-0.5 text-right">
                        <span className="text-muted-foreground uppercase font-bold block text-[8px]">Permanência</span>
                        <span className={cn(
                          "font-bold font-mono text-[10px]",
                          hasBottleneck ? "text-red-500 font-extrabold" : "text-foreground"
                        )}>
                          {(() => {
                            const diff = new Date().getTime() - new Date(activeOrder.statusChangedAt).getTime()
                            const min = Math.floor(diff / 60000)
                            if (min < 60) return `${min}m`
                            return `${Math.floor(min / 60)}h ${min % 60}m`
                          })()}
                        </span>
                      </div>
                    </div>

                    {/* Bottleneck alert text */}
                    {hasBottleneck && (
                      <div className="text-[10px] text-red-500 font-extrabold flex items-center gap-1 bg-red-500/5 p-2 rounded-xl border border-red-500/10">
                        <AlertTriangle className="size-3.5 shrink-0" />
                        <span>Retenção física excedeu o limite operacional da doca!</span>
                      </div>
                    )}

                    {/* Action button */}
                    <div className="flex gap-2 pt-1">
                      {isSimulationMode ? (
                        <>
                          <Button 
                            onClick={() => handleSimulateAdvance(activeOrder.id)}
                            className="flex-1 h-8 text-[10px] font-bold uppercase tracking-wider bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors cursor-pointer border border-emerald-600"
                          >
                            Avançar Fluxo
                          </Button>
                          <Button 
                            onClick={() => handleSimulateRemove(activeOrder.id)}
                            variant="destructive"
                            className="h-8 px-2.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </>
                      ) : (
                        <Link href={`/panel/orders/new?id=${activeOrder.id}`} className="flex-1">
                          <Button className="w-full h-8 text-[10px] font-bold uppercase tracking-wider bg-card hover:bg-muted border border-border text-foreground rounded-lg transition-colors cursor-pointer">
                            Editar O.S.
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-center flex flex-col items-center justify-center gap-3">
                    <div className="size-10 rounded-full border border-dashed border-border flex items-center justify-center text-muted-foreground/40">
                      <Plus className="size-4" />
                    </div>
                    <Button
                      onClick={() => {
                        setTargetBox(dockName)
                        setIsIntakeOpen(true)
                      }}
                      className="text-[10px] font-bold uppercase tracking-wider text-emerald-500 hover:text-emerald-600 transition-colors bg-transparent border-none hover:bg-transparent h-auto cursor-pointer"
                    >
                      Alocar Carro Aqui
                    </Button>
                  </div>
                )}
                </motion.div>
              </MotionItem>
            )
          })}
        </MotionContainer>
      )}

      {/* Express Intake Modal */}
      <AnimatePresence>
        {isIntakeOpen && (
          <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card w-full max-w-sm rounded-3xl shadow-xl border border-border p-6 space-y-4"
            >
              <div className="flex items-center gap-3 border-b border-dashed border-border pb-3.5">
                <span className="bg-emerald-500/10 text-emerald-500 p-2 rounded-xl border border-emerald-500/20">
                  <Car className="size-5" />
                </span>
                <div className="grid">
                  <h3 className="font-bold text-sm text-foreground">Entrada Rápida (30s)</h3>
                  {targetBox && (
                    <span className="text-[10px] text-emerald-500 font-extrabold uppercase font-mono">Alocando em: {targetBox}</span>
                  )}
                </div>
              </div>

              <form onSubmit={handleExpressIntake} className="space-y-4 text-xs font-semibold">
                {/* Placa */}
                <div className="space-y-1">
                  <Label className="text-[9px] font-bold text-muted-foreground uppercase">Placa do Veículo *</Label>
                  <Input
                    type="text"
                    required
                    placeholder="EX: BRA2E19"
                    value={plate}
                    onChange={(e) => setPlate(e.target.value.toUpperCase())}
                    className="w-full text-xs bg-muted/20 focus:bg-card focus:outline-hidden text-foreground font-mono font-black tracking-wider"
                  />
                </div>

                {/* Nome Cliente */}
                <div className="space-y-1">
                  <Label className="text-[9px] font-bold text-muted-foreground uppercase">Nome do Cliente *</Label>
                  <Input
                    type="text"
                    required
                    placeholder="EX: VINICIOS RAGAZZI"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full text-xs bg-muted/20 focus:bg-card focus:outline-hidden text-foreground font-bold"
                  />
                </div>

                {/* WhatsApp */}
                <div className="space-y-1">
                  <Label className="text-[9px] font-bold text-muted-foreground uppercase">Celular / WhatsApp *</Label>
                  <Input
                    type="text"
                    required
                    placeholder="EX: 21999999999"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value.replace(/\D/g, ""))}
                    className="w-full text-xs bg-muted/20 focus:bg-card focus:outline-hidden text-foreground font-mono font-bold"
                  />
                </div>

                <div className="flex gap-2 pt-2 border-t border-dashed border-border/60">
                  <Button
                    type="button"
                    onClick={() => setIsIntakeOpen(false)}
                    className="flex-1 h-10 border border-border hover:bg-muted text-muted-foreground font-semibold text-xs rounded-full px-4 py-2 transition-colors cursor-pointer"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 h-10 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-full px-5 py-2 transition-colors border border-emerald-600/10 flex items-center justify-center gap-1 cursor-pointer"
                  >
                    {submitting && <Loader2 className="size-3 animate-spin" />}
                    <span>Registrar</span>
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  )
}
