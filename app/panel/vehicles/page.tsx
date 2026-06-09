"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Car, 
  Search, 
  Plus, 
  Clock, 
  FileText, 
  User, 
  TrendingUp, 
  Trash2, 
  Edit, 
  X, 
  Info, 
  Calendar, 
  Gauge, 
  Compass, 
  Wrench, 
  DollarSign 
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { Skeleton } from "@/components/ui/skeleton"

// Import Server Actions
import { 
  getVehiclesAction, 
  getVehicleDetailsAction, 
  createVehicleAction, 
  updateVehicleAction, 
  deleteVehicleAction 
} from "@/lib/actions/vehicles-actions"
import { getCustomersAction } from "@/lib/actions/customers-actions"
import { 
  getFipeBrandsAction, 
  getFipeModelsAction, 
  getFipeYearsAction 
} from "@/lib/actions/fipe-actions"

interface Customer {
  id: string
  name: string
  phone: string
}

interface Vehicle {
  id: string
  plate: string
  brand: string
  model: string
  year: number | null
  engine: string | null
  mileage: number | null
  customerId: string
  customer?: Customer
}

interface OSItem {
  id: string
  type: string
  customName: string | null
  quantity: number
  unitSalePrice: string
  isApproved: number
}

interface WorkOrderHistory {
  id: string
  osNumber: number
  status: string
  paymentStatus: string
  currentMileage: number;
  diagnostic: string | null;
  notes: string | null;
  createdAt: Date | string;
  totalPrice: number;
  mechanic: { name: string } | null;
}

const statusConfig = {
  CHECK_IN: { label: "Check-In", text: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
  AWAITING_BUDGET: { label: "Orçamento", text: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
  AWAITING_APPROVAL: { label: "Aprov. Pendente", text: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/20" },
  AWAITING_PARTS: { label: "Aguard. Peças", text: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20" },
  IN_PROGRESS: { label: "Executando", text: "text-indigo-400", bg: "bg-indigo-500/10", border: "border-indigo-500/20" },
  TESTING_WASHING: { label: "Testando", text: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/20" },
  READY: { label: "Pronto", text: "text-pink-400", bg: "bg-pink-500/10", border: "border-pink-500/20" },
  DELIVERED: { label: "Entregue", text: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
}

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  // Selected vehicle for details & history
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)
  const [history, setHistory] = useState<WorkOrderHistory[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)

  // Form states (Create / Edit Modal)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [customerId, setCustomerId] = useState("")
  const [plate, setPlate] = useState("")
  const [brand, setBrand] = useState("")
  const [model, setModel] = useState("")
  const [year, setYear] = useState("")
  const [engine, setEngine] = useState("")
  const [mileage, setMileage] = useState("")
  const [submitting, setSubmitting] = useState(false)

  // Confirm Dialog states
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [vehicleIdToDelete, setVehicleIdToDelete] = useState<string | null>(null)

  // FIPE states
  const [fipeBrands, setFipeBrands] = useState<{ code: string; name: string }[]>([])
  const [fipeModels, setFipeModels] = useState<{ code: string; name: string }[]>([])
  const [fipeYears, setFipeYears] = useState<{ code: string; name: string }[]>([])
  const [selectedFipeBrandCode, setSelectedFipeBrandCode] = useState("")
  const [selectedFipeModelCode, setSelectedFipeModelCode] = useState("")
  const [isManualInput, setIsManualInput] = useState(false)
  const [loadingBrands, setLoadingBrands] = useState(false)
  const [loadingModels, setLoadingModels] = useState(false)
  const [loadingYears, setLoadingYears] = useState(false)
  const [brandSearch, setBrandSearch] = useState("")
  const [modelSearch, setModelSearch] = useState("")
  const [showBrandDropdown, setShowBrandDropdown] = useState(false)
  const [showModelDropdown, setShowModelDropdown] = useState(false)

  const loadFipeBrands = async () => {
    if (fipeBrands.length > 0) return
    setLoadingBrands(true)
    const res = await getFipeBrandsAction()
    if (res.success && res.data) {
      setFipeBrands(res.data)
    }
    setLoadingBrands(false)
  }

  const handleFipeBrandChange = async (brandCode: string) => {
    setSelectedFipeBrandCode(brandCode)
    setSelectedFipeModelCode("")
    setFipeModels([])
    setFipeYears([])
    
    const found = fipeBrands.find(b => b.code === brandCode)
    if (found) {
      setBrand(found.name)
      setModel("")
      setYear("")
      setModelSearch("")
    }

    if (!brandCode) return

    setLoadingModels(true)
    const res = await getFipeModelsAction(brandCode)
    if (res.success && res.data) {
      setFipeModels(res.data)
    }
    setLoadingModels(false)
  }

  const handleFipeModelChange = async (modelCode: string) => {
    setSelectedFipeModelCode(modelCode)
    setFipeYears([])
    
    const found = fipeModels.find(m => m.code === modelCode)
    if (found) {
      setModel(found.name)
      setYear("")
    }

    if (!selectedFipeBrandCode || !modelCode) return

    setLoadingYears(true)
    const res = await getFipeYearsAction(selectedFipeBrandCode, modelCode)
    if (res.success && res.data) {
      setFipeYears(res.data)
    }
    setLoadingYears(false)
  }

  const handleFipeYearChange = (yearValue: string) => {
    const match = yearValue.match(/^\d{4}/)
    if (match) {
      setYear(match[0])
    } else {
      setYear(yearValue)
    }
  }

  const loadData = async () => {
    setLoading(true)
    try {
      const [vehiclesRes, customersRes] = await Promise.all([
        getVehiclesAction(),
        getCustomersAction()
      ])

      if (vehiclesRes.success && vehiclesRes.data) {
        setVehicles(vehiclesRes.data as unknown as Vehicle[])
      }
      if (customersRes.success && customersRes.data) {
        setCustomers(customersRes.data as unknown as Customer[])
      }
    } catch (err) {
      console.error("Erro ao carregar veículos:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Load OS history for selected vehicle
  const handleSelectVehicle = async (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle)
    setLoadingHistory(true)
    try {
      const res = await getVehicleDetailsAction(vehicle.id)
      if (res.success && res.data) {
        setHistory(res.data.workOrders as unknown as WorkOrderHistory[])
      }
    } catch (err) {
      console.error("Erro ao obter histórico do veículo:", err)
    } finally {
      setLoadingHistory(false)
    }
  }

  const openCreateModal = () => {
    setEditingId(null)
    setCustomerId("")
    setPlate("")
    setBrand("")
    setModel("")
    setYear("")
    setEngine("")
    setMileage("")
    setIsManualInput(false)
    setSelectedFipeBrandCode("")
    setSelectedFipeModelCode("")
    setBrandSearch("")
    setModelSearch("")
    setFipeModels([])
    setFipeYears([])
    setModalOpen(true)
    loadFipeBrands()
  }

  const openEditModal = (vehicle: Vehicle, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingId(vehicle.id)
    setCustomerId(vehicle.customerId)
    setPlate(vehicle.plate)
    setBrand(vehicle.brand)
    setModel(vehicle.model)
    setYear(vehicle.year ? String(vehicle.year) : "")
    setEngine(vehicle.engine || "")
    setMileage(vehicle.mileage ? String(vehicle.mileage) : "")
    setIsManualInput(true)
    setModalOpen(true)
  }

  const handleDeleteVehicleClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setVehicleIdToDelete(id)
    setDeleteConfirmOpen(true)
  }

  const handleDeleteVehicleRetry = (vehicleId: string, originalVehicles: any[]) => {
    setVehicles(prev => prev.filter(v => v.id !== vehicleId))
    deleteVehicleAction(vehicleId).then(res => {
      if (res.success) {
        toast.success("Veículo excluído com sucesso!")
      } else {
        setVehicles(originalVehicles)
        const errMsg = res.error || ""
        if (errMsg.includes("foreign key") || errMsg.includes("violates foreign key") || errMsg.includes("work_orders_vehicle_id_vehicles_id_fk")) {
          toast.error("Não é possível excluir este veículo pois ele possui ordens de serviço vinculadas.")
        } else {
          toast.error("Erro ao deletar veículo. Quer tentar novamente?", {
            action: {
              label: "Tentar Novamente",
              onClick: () => handleDeleteVehicleRetry(vehicleId, originalVehicles)
            }
          })
        }
      }
    }).catch(() => {
      setVehicles(originalVehicles)
      toast.error("Erro de conexão ao excluir. Quer tentar novamente?", {
        action: {
          label: "Tentar Novamente",
          onClick: () => handleDeleteVehicleRetry(vehicleId, originalVehicles)
        }
      })
    })
  }

  const handleConfirmDeleteVehicle = async () => {
    if (!vehicleIdToDelete) return
    const originalVehicles = [...vehicles]
    const currentVehicleId = vehicleIdToDelete
    setDeleteConfirmOpen(false)
    setVehicleIdToDelete(null)

    // Optimistically remove
    setVehicles(prev => prev.filter(v => v.id !== currentVehicleId))
    if (selectedVehicle?.id === currentVehicleId) setSelectedVehicle(null)

    deleteVehicleAction(currentVehicleId).then(res => {
      if (res.success) {
        toast.success("Veículo excluído com sucesso!")
      } else {
        setVehicles(originalVehicles)
        const errMsg = res.error || ""
        if (errMsg.includes("foreign key") || errMsg.includes("violates foreign key") || errMsg.includes("work_orders_vehicle_id_vehicles_id_fk")) {
          toast.error("Não é possível excluir este veículo pois ele possui ordens de serviço vinculadas.")
        } else {
          toast.error("Erro ao deletar veículo. Quer tentar novamente?", {
            action: {
              label: "Tentar Novamente",
              onClick: () => handleDeleteVehicleRetry(currentVehicleId, originalVehicles)
            }
          })
        }
      }
    }).catch(() => {
      setVehicles(originalVehicles)
      toast.error("Erro de conexão ao excluir. Quer tentar novamente?", {
        action: {
          label: "Tentar Novamente",
          onClick: () => handleDeleteVehicleRetry(currentVehicleId, originalVehicles)
        }
      })
    })
  }

  const handleFormSubmitRetry = (payload: any, originalVehicles: any[], isUpdate: boolean) => {
    const customer = customers.find(c => c.id === payload.customerId)
    if (isUpdate) {
      setVehicles(prev => prev.map(v => v.id === payload.id ? { ...v, ...payload, customer } : v))
      updateVehicleAction(payload).then(res => {
        if (res.success) {
          toast.success("Veículo atualizado com sucesso!")
        } else {
          setVehicles(originalVehicles)
          toast.error("Erro ao atualizar o veículo. Quer tentar novamente?", {
            action: {
              label: "Tentar Novamente",
              onClick: () => handleFormSubmitRetry(payload, originalVehicles, isUpdate)
            }
          })
        }
      }).catch(() => {
        setVehicles(originalVehicles)
        toast.error("Erro ao atualizar. Quer tentar novamente?", {
          action: {
            label: "Tentar Novamente",
            onClick: () => handleFormSubmitRetry(payload, originalVehicles, isUpdate)
          }
        })
      })
    } else {
      const tempId = `temp-${Date.now()}`
      const newVehicleObj = { ...payload, id: tempId, customer }
      setVehicles(prev => [newVehicleObj, ...prev])

      createVehicleAction(payload).then(res => {
        if (res.success && res.data) {
          const realVehicle = res.data as any
          setVehicles(prev => prev.map(v => v.id === tempId ? { ...v, id: realVehicle.id } : v))
          toast.success("Veículo cadastrado com sucesso!")
        } else {
          setVehicles(originalVehicles)
          toast.error("Erro ao cadastrar. Quer tentar novamente?", {
            action: {
              label: "Tentar Novamente",
              onClick: () => handleFormSubmitRetry(payload, originalVehicles, isUpdate)
            }
          })
        }
      }).catch(() => {
        setVehicles(originalVehicles)
        toast.error("Erro ao cadastrar. Quer tentar novamente?", {
          action: {
            label: "Tentar Novamente",
            onClick: () => handleFormSubmitRetry(payload, originalVehicles, isUpdate)
          }
        })
      })
    }
  }

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!customerId || !plate || !brand || !model) {
      toast.warning("Por favor, preencha os campos obrigatórios.")
      return
    }

    const originalVehicles = [...vehicles]
    const formattedPlate = plate.toUpperCase().replace(/[^A-Z0-9]/g, "")
    const inputPayload = {
      customerId,
      plate: formattedPlate,
      brand,
      model,
      year: year ? parseInt(year, 10) : null,
      engine: engine || null,
      mileage: mileage ? parseInt(mileage, 10) : null,
    }

    const customer = customers.find(c => c.id === customerId)

    if (editingId) {
      const currentEditingId = editingId
      // Optimistic update
      setVehicles(prev => prev.map(v => v.id === currentEditingId ? { ...v, ...inputPayload, customer } as any : v))
      setModalOpen(false)

      updateVehicleAction({ ...inputPayload, id: currentEditingId } as any).then(res => {
        if (res.success) {
          toast.success("Veículo atualizado com sucesso!")
        } else {
          setVehicles(originalVehicles)
          toast.error("Erro ao atualizar o veículo. Quer tentar novamente?", {
            action: {
              label: "Tentar Novamente",
              onClick: () => handleFormSubmitRetry({ ...inputPayload, id: currentEditingId }, originalVehicles, true)
            }
          })
        }
      }).catch(() => {
        setVehicles(originalVehicles)
        toast.error("Erro de conexão ao atualizar o veículo. Quer tentar novamente?", {
          action: {
            label: "Tentar Novamente",
            onClick: () => handleFormSubmitRetry({ ...inputPayload, id: currentEditingId }, originalVehicles, true)
          }
        })
      })
    } else {
      const tempId = `temp-${Date.now()}`
      const newVehicleObj = { ...inputPayload, id: tempId, customer } as any

      // Optimistic create
      setVehicles(prev => [newVehicleObj, ...prev])
      setModalOpen(false)

      createVehicleAction(inputPayload as any).then(res => {
        if (res.success && res.data) {
          // Replace temp ID with the database ID
          const realVehicle = res.data as any
          setVehicles(prev => prev.map(v => v.id === tempId ? { ...v, id: realVehicle.id } : v))
          toast.success("Veículo cadastrado com sucesso!")
        } else {
          setVehicles(originalVehicles)
          toast.error("Erro ao cadastrar o veículo. Quer tentar novamente?", {
            action: {
              label: "Tentar Novamente",
              onClick: () => handleFormSubmitRetry(inputPayload, originalVehicles, false)
            }
          })
        }
      }).catch(() => {
        setVehicles(originalVehicles)
        toast.error("Erro de conexão ao cadastrar o veículo. Quer tentar novamente?", {
          action: {
            label: "Tentar Novamente",
            onClick: () => handleFormSubmitRetry(inputPayload, originalVehicles, false)
          }
        })
      })
    }
  }

  // Format Helpers
  const formatPlate = (p: string) => {
    const clean = p.toUpperCase().replace(/[^A-Z0-9]/g, "")
    if (clean.length === 7) return `${clean.slice(0, 3)}-${clean.slice(3)}`
    return clean
  }

  const formatDate = (d: Date | string) => {
    return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })
  }

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val)
  }

  // Filter list
  const filteredVehicles = vehicles.filter(v => 
    v.plate.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (v.customer && v.customer.name.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  return (
    <div className="flex-1 p-4 md:p-6 bg-[#FAF9F6] dark:bg-zinc-950 min-h-screen font-sans space-y-6">
      
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <span className="bg-emerald-500/10 text-emerald-500 p-1.5 rounded-lg border border-emerald-500/20">
              <Car className="size-4.5" />
            </span>
            Cadastro de Veículos
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Gestão da frota de clientes com visualização de timeline e histórico completo de serviços.
          </p>
        </div>

        <Button
          onClick={openCreateModal}
          className="flex items-center gap-1.5 bg-foreground hover:bg-foreground/90 text-background font-bold text-xs rounded-full px-4 py-2 transition-all shadow-sm active:scale-95 shrink-0"
        >
          <Plus className="size-3.5" />
          <span>Novo Veículo</span>
        </Button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left list of vehicles: 5 Columns */}
        <section className="lg:col-span-5 space-y-6">
          <div className="bg-card rounded-3xl shadow-[0_10px_50px_-12px_rgba(0,0,0,0.05)] border border-border/50 overflow-hidden text-card-foreground p-5 space-y-4">
            <div className="flex items-center justify-between pb-3.5 border-b border-dashed border-border">
              <h3 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                <Car className="size-4 text-emerald-500" />
                Veículos Cadastrados
              </h3>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
              <Input 
                placeholder="BUSCAR PLACA, MODELO OU CLIENTE..."
                className="w-full text-xs pl-8 pr-3 py-1.5 bg-muted/20 focus:bg-card focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium text-foreground placeholder-muted-foreground/50 uppercase"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Vehicle List */}
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((idx) => (
                  <div key={idx} className="p-3.5 border border-border/40 bg-muted/10 rounded-2xl flex items-center justify-between">
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-5 w-24 rounded-lg animate-pulse" />
                      <Skeleton className="h-3.5 w-32 rounded-md animate-pulse" />
                    </div>
                    <Skeleton className="h-8 w-8 rounded-full animate-pulse" />
                  </div>
                ))}
              </div>
            ) : filteredVehicles.length > 0 ? (
              <div className="space-y-3 max-h-[550px] overflow-y-auto pr-1 no-scrollbar">
                {filteredVehicles.map(v => (
                  <div 
                    key={v.id}
                    onClick={() => handleSelectVehicle(v)}
                    className={cn(
                      "p-3.5 border transition-all cursor-pointer flex items-center justify-between group rounded-2xl",
                      selectedVehicle?.id === v.id 
                        ? "bg-emerald-500/5 border-emerald-500/35 shadow-xs" 
                        : "bg-muted/10 border-border/40 hover:bg-muted/20"
                    )}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5">
                        <span className="font-bold text-xs text-foreground uppercase tracking-tight bg-muted border border-border px-2 py-0.5 rounded-lg font-mono">
                          {formatPlate(v.plate)}
                        </span>
                        <span className="font-bold text-xs text-foreground uppercase">
                          {v.brand} {v.model}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground font-medium">
                        <User className="size-3 text-muted-foreground" />
                        <span className="line-clamp-1 uppercase">Proprietário: {v.customer?.name}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                      <Button 
                        onClick={(e) => openEditModal(v, e)}
                        className="text-muted-foreground hover:text-foreground p-1 rounded hover:bg-muted transition-all"
                      >
                        <Edit className="size-3.5" />
                      </Button>
                      <Button 
                        onClick={(e) => handleDeleteVehicleClick(v.id, e)}
                        className="text-muted-foreground hover:text-red-550 p-1 rounded hover:bg-red-500/10 transition-all"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 border border-dashed border-border rounded-2xl">
                <p className="text-xs text-muted-foreground italic uppercase">
                  Frota de veículos vazia.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Right Section: OS timeline / Details - 7 Columns */}
        <section className="lg:col-span-7">
          {selectedVehicle ? (
            <div className="bg-card rounded-3xl shadow-[0_10px_50px_-12px_rgba(0,0,0,0.05)] border border-border/50 overflow-hidden text-card-foreground p-5 space-y-4 min-h-[500px]">
              
              {/* Selected Vehicle Specs */}
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-3.5 border-b border-dashed border-border">
                <div>
                  <span className="text-[9px] font-black uppercase text-emerald-500 tracking-widest">
                    Histórico & Prontuário
                  </span>
                  <h3 className="text-xl font-black text-foreground uppercase tracking-tight mt-0.5">
                    {selectedVehicle.brand} {selectedVehicle.model}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                    <User className="size-3.5" />
                    <span className="uppercase">Dono: {selectedVehicle.customer?.name} ({selectedVehicle.customer?.phone})</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <span className="bg-muted text-foreground border border-border text-[10px] font-bold py-1 px-3 rounded-full font-mono">
                    {formatPlate(selectedVehicle.plate)}
                  </span>
                </div>
              </div>

              {/* Specs Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-muted/20 p-4 border border-border/55 rounded-2xl">
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                    <Calendar className="size-3" /> Ano Fab/Mod
                  </span>
                  <span className="text-xs text-foreground font-bold">
                    {selectedVehicle.year || "N/A"}
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                    <Compass className="size-3" /> Motorização
                  </span>
                  <span className="text-xs text-foreground font-bold uppercase">
                    {selectedVehicle.engine || "N/A"}
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                    <Gauge className="size-3" /> Km de Cadastro
                  </span>
                  <span className="text-xs text-foreground font-bold font-mono">
                    {selectedVehicle.mileage ? `${selectedVehicle.mileage.toLocaleString()} km` : "N/A"}
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                    <Clock className="size-3" /> Ordens Atendidas
                  </span>
                  <span className="text-xs text-emerald-500 font-bold font-mono">
                    {loadingHistory ? "..." : history.length} OSs
                  </span>
                </div>
              </div>

              {/* Timeline list */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Clock className="size-4 text-emerald-500" />
                  Timeline de Manutenções
                </h4>

                {loadingHistory ? (
                  <div className="text-center py-12 text-muted-foreground text-xs font-medium">
                    Carregando histórico de OS...
                  </div>
                ) : history.length > 0 ? (
                  <div className="relative border-l border-border ml-3 pl-6 space-y-6 py-2">
                    {history.map(order => {
                      const cfg = statusConfig[order.status as keyof typeof statusConfig] || { label: order.status, text: "text-zinc-550", bg: "bg-zinc-100", border: "border-zinc-200" };
                      
                      return (
                        <div key={order.id} className="relative">
                          {/* Timeline node circle */}
                          <span className="absolute -left-[31px] top-1.5 size-4 rounded-full bg-card border-2 border-emerald-500 flex items-center justify-center">
                            <span className="size-1.5 rounded-full bg-emerald-500" />
                          </span>

                          {/* Timeline Card */}
                          <div className="p-3.5 bg-muted/10 border border-border/40 rounded-2xl hover:border-border/60 transition-colors space-y-3">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-dashed border-border/50 pb-2.5">
                              <div className="flex items-center gap-2.5">
                                <span className="text-xs font-black text-foreground font-mono">
                                  OS #{String(order.osNumber).padStart(4, "0")}
                                </span>
                                <span className={cn(
                                  "text-[8px] font-black uppercase px-2 py-0.5 border rounded-full",
                                  cfg.text, cfg.bg, cfg.border
                                )}>
                                  {cfg.label}
                                </span>
                              </div>
                              <span className="text-[9px] text-muted-foreground flex items-center gap-1 font-mono">
                                <Calendar className="size-3" />
                                {formatDate(order.createdAt)}
                              </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-medium">
                              <div>
                                <span className="text-[9px] text-muted-foreground uppercase font-bold">Mecânico Responsável</span>
                                <p className="text-foreground font-bold uppercase mt-0.5">
                                  {order.mechanic?.name || "Sem atribuição"}
                                </p>
                              </div>
                              <div>
                                <span className="text-[9px] text-muted-foreground uppercase font-bold">Quilometragem Registrada</span>
                                <p className="text-foreground font-bold mt-0.5 font-mono">
                                  {order.currentMileage.toLocaleString()} km
                                </p>
                              </div>
                            </div>

                            {order.diagnostic && (
                              <div className="bg-muted/30 p-2.5 rounded-xl border border-border/40">
                                <span className="text-[9px] text-muted-foreground uppercase font-bold">Diagnóstico & Parecer</span>
                                <p className="text-xs text-muted-foreground mt-1 italic leading-relaxed">
                                  "{order.diagnostic}"
                                </p>
                              </div>
                            )}

                            <div className="flex items-center justify-between pt-2 border-t border-dashed border-border/50 text-xs font-medium">
                              <span className="text-muted-foreground uppercase font-bold">Valor Financeiro</span>
                              <span className="font-black text-emerald-500 font-mono">
                                {formatCurrency(order.totalPrice)}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-10 text-center border border-dashed border-border rounded-2xl">
                    <p className="text-xs text-muted-foreground italic uppercase">
                      Nenhuma OS encontrada para este veículo.
                    </p>
                  </div>
                )}
              </div>

            </div>
          ) : (
            <div className="bg-card rounded-3xl border border-border/55 min-h-[500px] flex flex-col items-center justify-center p-8 text-center shadow-[0_10px_50px_-12px_rgba(0,0,0,0.05)]">
              <Car className="size-16 text-muted-foreground/40 mb-4 animate-pulse" />
              <h4 className="text-sm font-bold uppercase tracking-wider text-foreground">
                Selecione um Veículo
              </h4>
              <p className="text-muted-foreground text-xs mt-1 max-w-sm">
                Selecione um carro na lista ao lado para ver o histórico completo de manutenções e o prontuário.
              </p>
            </div>
          )}
        </section>

      </div>

      {/* Modal: Create & Edit Vehicle */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs overflow-y-auto">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card w-full max-w-md rounded-3xl shadow-xl border border-border overflow-hidden my-8"
            >
              
              {/* Modal Header */}
              <div className="px-5 py-4 border-b border-dashed border-border flex items-center justify-between">
                <h3 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                  <Car className="size-4 text-emerald-500" />
                  {editingId ? "Editar Veículo" : "Novo Veículo"}
                </h3>
                <Button 
                  onClick={() => setModalOpen(false)}
                  className="text-muted-foreground hover:text-foreground text-xs font-semibold"
                >
                  Fechar
                </Button>
              </div>

              {/* Form */}
              <form onSubmit={handleFormSubmit} className="flex flex-col">
                <div className="p-5 space-y-3.5 pr-6">
                  
                  {/* Customer Dropdown */}
                  <div className="space-y-1">
                    <Label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Proprietário *</Label>
                    <select 
                      className="w-full text-xs border border-border rounded-lg px-2.5 py-1.5 bg-muted/20 focus:bg-card focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium text-foreground uppercase"
                      required
                      value={customerId}
                      onChange={(e) => setCustomerId(e.target.value)}
                    >
                      <option value="">-- SELECIONE UM CLIENTE --</option>
                      {customers.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.phone})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Plate input */}
                  <div className="space-y-1">
                    <Label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Placa *</Label>
                    <Input 
                      placeholder="EX: ABC1D23"
                      className="w-full text-xs bg-muted/20 focus:bg-card focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-bold text-foreground placeholder-muted-foreground/50 uppercase font-mono"
                      required
                      value={plate}
                      onChange={(e) => setPlate(e.target.value)}
                    />
                  </div>

                  {/* Brand & Model Selector */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between col-span-2">
                      <Label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Informações do Veículo *</Label>
                      <Button
                        type="button"
                        onClick={() => {
                          setIsManualInput(!isManualInput);
                          if (!isManualInput) {
                            if (brandSearch) setBrand(brandSearch);
                            if (modelSearch) setModel(modelSearch);
                          } else {
                            setBrandSearch(brand);
                            setModelSearch(model);
                          }
                        }}
                        className="text-[10px] text-emerald-500 hover:underline font-bold"
                      >
                        {isManualInput ? "Usar Busca FIPE" : "Digitar Manualmente"}
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {/* Marca */}
                      <div className="space-y-1 relative">
                        <Label className="text-[9px] font-bold text-muted-foreground uppercase">Marca *</Label>
                        {isManualInput ? (
                          <Input 
                            placeholder="EX: HONDA"
                            className="w-full text-xs bg-muted/20 focus:bg-card focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium text-foreground placeholder-muted-foreground/50 uppercase"
                            required
                            value={brand}
                            onChange={(e) => setBrand(e.target.value)}
                          />
                        ) : (
                          <div className="relative">
                            <Input 
                              placeholder="BUSCAR MARCA..."
                              className="w-full text-xs bg-muted/20 focus:bg-card focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium text-foreground placeholder-muted-foreground/50 uppercase"
                              required
                              value={brandSearch}
                              onChange={(e) => {
                                setBrandSearch(e.target.value);
                                setShowBrandDropdown(true);
                              }}
                              onFocus={() => {
                                loadFipeBrands();
                                setShowBrandDropdown(true);
                              }}
                              onBlur={() => setTimeout(() => setShowBrandDropdown(false), 250)}
                            />
                            {showBrandDropdown && (
                              <div className="absolute top-9 left-0 right-0 max-h-48 overflow-y-auto bg-card border border-border rounded-xl shadow-lg z-30 text-[10px] uppercase no-scrollbar">
                                {loadingBrands ? (
                                  <div className="p-3 text-muted-foreground text-center font-medium">Carregando marcas...</div>
                                ) : (
                                  fipeBrands
                                    .filter(b => b.name.toLowerCase().includes(brandSearch.toLowerCase()))
                                    .map(b => (
                                      <Button
                                        key={b.code}
                                        type="button"
                                        onMouseDown={() => {
                                          handleFipeBrandChange(b.code);
                                          setBrandSearch(b.name);
                                          setShowBrandDropdown(false);
                                        }}
                                        className="w-full text-left px-3 py-1.5 hover:bg-muted font-bold text-foreground border-b border-border/20 last:border-b-0"
                                      >
                                        {b.name}
                                      </Button>
                                    ))
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Modelo */}
                      <div className="space-y-1 relative">
                        <Label className="text-[9px] font-bold text-muted-foreground uppercase">Modelo *</Label>
                        {isManualInput ? (
                          <Input 
                            placeholder="EX: CIVIC"
                            className="w-full text-xs bg-muted/20 focus:bg-card focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium text-foreground placeholder-muted-foreground/50 uppercase"
                            required
                            value={model}
                            onChange={(e) => setModel(e.target.value)}
                          />
                        ) : (
                          <div className="relative">
                            <Input 
                              placeholder={selectedFipeBrandCode ? "BUSCAR MODELO..." : "SELECIONE A MARCA"}
                              className="w-full text-xs bg-muted/20 focus:bg-card focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium text-foreground placeholder-muted-foreground/50 uppercase"
                              required
                              disabled={!selectedFipeBrandCode}
                              value={modelSearch}
                              onChange={(e) => {
                                setModelSearch(e.target.value);
                                setShowModelDropdown(true);
                              }}
                              onFocus={() => {
                                if (selectedFipeBrandCode) setShowModelDropdown(true);
                              }}
                              onBlur={() => setTimeout(() => setShowModelDropdown(false), 250)}
                            />
                            {showModelDropdown && selectedFipeBrandCode && (
                              <div className="absolute top-9 left-0 right-0 max-h-48 overflow-y-auto bg-card border border-border rounded-xl shadow-lg z-30 text-[10px] uppercase no-scrollbar">
                                {loadingModels ? (
                                  <div className="p-3 text-muted-foreground text-center font-medium">Carregando modelos...</div>
                                ) : (
                                  fipeModels
                                    .filter(m => m.name.toLowerCase().includes(modelSearch.toLowerCase()))
                                    .map(m => (
                                      <Button
                                        key={m.code}
                                        type="button"
                                        onMouseDown={() => {
                                          handleFipeModelChange(m.code);
                                          setModelSearch(m.name);
                                          setShowModelDropdown(false);
                                        }}
                                        className="w-full text-left px-3 py-1.5 hover:bg-muted font-bold text-foreground border-b border-border/20 last:border-b-0"
                                      >
                                        {m.name}
                                      </Button>
                                    ))
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Year, Engine, Mileage */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Ano</Label>
                      {isManualInput ? (
                        <Input 
                          type="number"
                          placeholder="2020"
                          className="w-full text-xs bg-muted/20 focus:bg-card focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium text-foreground placeholder-muted-foreground/50 font-mono"
                          value={year}
                          onChange={(e) => setYear(e.target.value)}
                        />
                      ) : (
                        <select
                          className="w-full text-xs border border-border rounded-lg px-2.5 py-1.5 bg-muted/20 focus:bg-card focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium text-foreground uppercase"
                          disabled={!selectedFipeModelCode}
                          value={fipeYears.find(y => y.name.startsWith(year))?.code || ""}
                          onChange={(e) => handleFipeYearChange(e.target.value)}
                        >
                          <option value="">-- SELECIONE --</option>
                          {loadingYears ? (
                            <option disabled>Carregando...</option>
                          ) : (
                            fipeYears.map(y => (
                              <option key={y.code} value={y.code}>
                                {y.name}
                              </option>
                            ))
                          )}
                        </select>
                      )}
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Motor</Label>
                      <Input 
                        placeholder="2.0 FLEX"
                        className="w-full text-xs bg-muted/20 focus:bg-card focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium text-foreground placeholder-muted-foreground/50 uppercase"
                        value={engine}
                        onChange={(e) => setEngine(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Km Atual</Label>
                      <Input 
                        type="number"
                        placeholder="85000"
                        className="w-full text-xs bg-muted/20 focus:bg-card focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium text-foreground placeholder-muted-foreground/50 font-mono"
                        value={mileage}
                        onChange={(e) => setMileage(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Buttons */}
                <div className="p-5 pt-3.5 flex justify-end gap-2 border-t border-dashed border-border bg-card">
                  <Button 
                    type="button" 
                    onClick={() => setModalOpen(false)}
                    className="border border-border hover:bg-muted text-muted-foreground font-semibold text-xs rounded-full px-4 py-2 transition-colors"
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit"
                    disabled={submitting}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-full px-5 py-2 transition-colors border border-emerald-600/10 flex items-center gap-1"
                  >
                    <span>{submitting ? "Gravando..." : "Salvar Veículo"}</span>
                  </Button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        title="Excluir Veículo"
        message="Deletar este veículo irá excluir o histórico de OS associado. Deseja realmente continuar?"
        confirmText="Excluir"
        cancelText="Cancelar"
        onConfirm={handleConfirmDeleteVehicle}
        onCancel={() => {
          setDeleteConfirmOpen(false)
          setVehicleIdToDelete(null)
        }}
      />

    </div>
  )
}
