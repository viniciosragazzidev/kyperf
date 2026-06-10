"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { toast } from "sonner"
import {
  Plus,
  Wrench,
  Package,
  Search,
  Check,
  Info,
  Trash2,
  Edit3,
  Clock,
  DollarSign,
  Car,
  Activity,
  AlertTriangle,
  Loader2
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

// Import Server Actions
import {
  getServicesAction,
  saveFullServiceAction,
  deleteServiceAction
} from "@/lib/actions/services-actions"
import { getPartsAction } from "@/lib/actions/parts-actions"

interface DBPart {
  id: string
  name: string
  sku: string | null
  salePrice: string
}

interface SelectedPart {
  id: string
  name: string
  sku: string | null
  price: number
  quantity: number
}

interface PriceOverride {
  carName: string
  price: string
}

interface ServiceItem {
  id: string
  name: string
  description: string | null
  estimatedTimeMinutes: number
  basePrice: string
  parts: Array<{
    id: string
    partId: string
    partName: string
    partSku: string | null
    partSalePrice: string
    quantity: number
  }>
  overrides: Array<{
    id: string
    carName: string
    price: string
  }>
}

export default function ServicesPage() {
  const [services, setServices] = useState<ServiceItem[]>([])
  const [availableParts, setAvailableParts] = useState<DBPart[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  // Form State
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null)
  const [serviceName, setServiceName] = useState("")
  const [description, setDescription] = useState("")
  const [basePrice, setBasePrice] = useState("")
  const [estimatedTime, setEstimatedTime] = useState("")
  const [selectedParts, setSelectedParts] = useState<SelectedPart[]>([])
  const [overrides, setOverrides] = useState<PriceOverride[]>([])

  // Search part autocomplete
  const [partSearchQuery, setPartSearchQuery] = useState("")
  const [newOverrideCarName, setNewOverrideCarName] = useState("")
  const [newOverridePrice, setNewOverridePrice] = useState("")

  // Confirm Dialog states
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [serviceIdToDelete, setServiceIdToDelete] = useState<string | null>(null)

  // Load Initial Data
  const loadData = async () => {
    setLoading(true)
    try {
      const [servicesRes, partsRes] = await Promise.all([
        getServicesAction(),
        getPartsAction()
      ])

      if (servicesRes.success && servicesRes.data) {
        setServices(servicesRes.data as unknown as ServiceItem[])
      }
      if (partsRes.success && partsRes.data) {
        setAvailableParts(partsRes.data as unknown as DBPart[])
      }
    } catch (err) {
      console.error("Erro ao carregar dados do catálogo:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Add Part to Selected
  const addPart = (part: DBPart) => {
    setSelectedParts(prev => {
      const existing = prev.find(p => p.id === part.id)
      if (existing) {
        return prev.map(p => p.id === part.id ? { ...p, quantity: p.quantity + 1 } : p)
      }
      return [...prev, {
        id: part.id,
        name: part.name,
        sku: part.sku,
        price: parseFloat(part.salePrice) || 0,
        quantity: 1
      }]
    })
    setPartSearchQuery("")
  }

  const removePart = (id: string) => {
    setSelectedParts(prev => prev.filter(p => p.id !== id))
  }

  const updateQuantity = (id: string, delta: number) => {
    setSelectedParts(prev => prev.map(p => {
      if (p.id === id) {
        const newQty = Math.max(1, p.quantity + delta)
        return { ...p, quantity: newQty }
      }
      return p
    }))
  }

  // Add Price Override
  const addPriceOverride = () => {
    if (!newOverrideCarName || !newOverridePrice) return
    setOverrides(prev => [
      ...prev,
      {
        carName: newOverrideCarName.trim(),
        price: parseFloat(newOverridePrice).toFixed(2)
      }
    ])
    setNewOverrideCarName("")
    setNewOverridePrice("")
  }

  const removePriceOverride = (index: number) => {
    setOverrides(prev => prev.filter((_, i) => i !== index))
  }

  // Select Service for Editing
  const handleSelectService = (service: ServiceItem) => {
    setSelectedServiceId(service.id)
    setServiceName(service.name)
    setDescription(service.description || "")
    setBasePrice(parseFloat(service.basePrice).toFixed(2))
    setEstimatedTime(String(service.estimatedTimeMinutes))

    // Map parts
    setSelectedParts(service.parts.map(p => ({
      id: p.partId,
      name: p.partName,
      sku: p.partSku,
      price: parseFloat(p.partSalePrice) || 0,
      quantity: p.quantity
    })))

    // Map overrides
    setOverrides(service.overrides.map(o => ({
      carName: o.carName,
      price: parseFloat(o.price).toFixed(2)
    })))
  }

  // Reset Form
  const resetForm = () => {
    setSelectedServiceId(null)
    setServiceName("")
    setDescription("")
    setBasePrice("")
    setEstimatedTime("")
    setSelectedParts([])
    setOverrides([])
    setPartSearchQuery("")
    setNewOverrideCarName("")
    setNewOverridePrice("")
  }

  // Delete Service
  const handleDeleteServiceClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setServiceIdToDelete(id)
    setDeleteConfirmOpen(true)
  }

  const handleConfirmDeleteService = async () => {
    if (!serviceIdToDelete) return
    setDeleteConfirmOpen(false)
    try {
      const res = await deleteServiceAction(serviceIdToDelete)
      if (res.success) {
        setServices(prev => prev.filter(s => s.id !== serviceIdToDelete))
        if (selectedServiceId === serviceIdToDelete) resetForm()
        toast.success("Serviço excluído com sucesso!")
      } else {
        toast.error("Erro ao deletar serviço: " + res.error)
      }
    } catch (err: any) {
      toast.error("Erro interno: " + err.message)
    } finally {
      setServiceIdToDelete(null)
    }
  }

  // Submit Form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!serviceName || !basePrice || !estimatedTime) {
      toast.warning("Por favor, preencha os campos obrigatórios.")
      return
    }

    setSubmitting(true)
    try {
      const input = {
        id: selectedServiceId || undefined,
        name: serviceName,
        description: description || undefined,
        estimatedTimeMinutes: parseInt(estimatedTime, 10),
        basePrice: parseFloat(basePrice).toFixed(2),
        parts: selectedParts.map(p => ({
          partId: p.id,
          quantity: p.quantity
        })),
        overrides: overrides.map(o => ({
          carName: o.carName,
          price: o.price
        }))
      }

      const res = await saveFullServiceAction(input)

      if (res.success) {
        toast.success("Catálogo atualizado com sucesso!")
        resetForm()
        loadData()
      } else {
        toast.error("Erro ao salvar serviço: " + res.error)
      }
    } catch (err: any) {
      toast.error("Erro interno ao enviar formulário: " + err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const totalPartsPrice = selectedParts.reduce((acc, p) => acc + (p.price * p.quantity), 0)
  const totalServicePrice = (parseFloat(basePrice) || 0) + totalPartsPrice

  // Filtered lists
  const filteredServices = services.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.description && s.description.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const filteredPartsAutocomplete = partSearchQuery.trim().length > 0
    ? availableParts.filter(p =>
      p.name.toLowerCase().includes(partSearchQuery.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase().includes(partSearchQuery.toLowerCase()))
    ).slice(0, 5)
    : []

  return (
    <div className="flex-1 p-4 md:p-6 bg-[#FAF9F6] dark:bg-zinc-950 min-h-screen font-sans space-y-6">

      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <span className="bg-emerald-500/10 text-emerald-500 p-1.5 rounded-lg border border-emerald-500/20">
              <Wrench className="size-4.5" />
            </span>
            Catálogo de Serviços
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5 geist-mono pl-10">
            Defina precificação técnica de serviços, autopeças associadas e sobregravações personalizadas por veículo.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* Left Section: List of Services - 5 Columns */}
        <section className="lg:col-span-5 space-y-6">
          <div className="bg-card rounded-3xl shadow-[0_10px_50px_-12px_rgba(0,0,0,0.05)] border border-border/50 overflow-hidden text-card-foreground p-5 space-y-4">
            <div className="flex items-center justify-between pb-3.5 border-b border-dashed border-border">
              <h3 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                <Wrench className="size-4 text-emerald-500" />
                Procedimentos
              </h3>
              {selectedServiceId && (
                <Button
                  onClick={resetForm}
                  className="border border-border hover:bg-muted text-muted-foreground font-semibold text-[10px] rounded-full px-3 py-1 transition-colors"
                >
                  Novo Procedimento
                </Button>
              )}
            </div>

            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
              <Input
                placeholder="BUSCAR NO CATÁLOGO..."
                className="w-full text-xs bg-muted/20 focus:bg-card focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium text-foreground placeholder-muted-foreground/50 uppercase"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* List */}
            {loading ? (
              <div className="text-center py-12 text-muted-foreground text-xs font-medium">
                Carregando catálogo...
              </div>
            ) : filteredServices.length > 0 ? (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1 no-scrollbar">
                {filteredServices.map(service => (
                  <div
                    key={service.id}
                    onClick={() => handleSelectService(service)}
                    className={cn(
                      "p-3 border transition-all cursor-pointer rounded-2xl flex items-center justify-between",
                      selectedServiceId === service.id
                        ? "bg-emerald-500/5 border-emerald-500/35 shadow-xs"
                        : "bg-muted/10 border-border/40 hover:bg-muted/20"
                    )}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-foreground uppercase tracking-tight line-clamp-1">
                          {service.name}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2.5 text-[9px] text-muted-foreground font-medium">
                        <span className="flex items-center gap-1">
                          <Clock className="size-3" />
                          {service.estimatedTimeMinutes} min
                        </span>
                        <span className="flex items-center gap-1">
                          <Package className="size-3" />
                          {service.parts.length} peças
                        </span>
                        {service.overrides.length > 0 && (
                          <span className="text-amber-500 font-bold">
                            {service.overrides.length} exceções
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right flex items-center gap-3">
                      <span className="text-xs font-black text-emerald-500 font-mono">
                        R$ {parseFloat(service.basePrice).toFixed(2)}
                      </span>
                      <Button
                        onClick={(e) => handleDeleteServiceClick(service.id, e)}
                        className="text-muted-foreground hover:text-red-500 p-1 rounded hover:bg-red-500/10 transition-all"
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
                  Nenhum serviço localizado.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Right Section: Creation/Editing Form - 7 Columns */}
        <section className="lg:col-span-7 space-y-6">
          <form onSubmit={handleSubmit} className="bg-card rounded-3xl shadow-[0_10px_50px_-12px_rgba(0,0,0,0.05)] border border-border/50 overflow-hidden text-card-foreground p-5 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground pb-3.5 border-b border-dashed border-border flex items-center gap-2">
              <Edit3 className="size-4 text-emerald-500" />
              {selectedServiceId ? "Editar Registro" : "Cadastrar Novo Procedimento"}
            </h3>

            {/* Basic Info */}
            <div className="grid gap-4">
              <div className="space-y-1">
                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Nome do Procedimento *</Label>
                <Input
                  id="service-name"
                  placeholder="EX: TROCA DE PASTILHAS DE FREIO DIANTEIRAS"
                  className="w-full text-xs bg-muted/20 focus:bg-card focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-bold text-foreground placeholder-muted-foreground/50 uppercase"
                  required
                  value={serviceName}
                  onChange={(e) => setServiceName(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Detalhamento Técnico / Escopo</Label>
                <Textarea
                  id="description"
                  placeholder="Descreva o passo-a-passo técnico ou escopo deste serviço..."
                  className="w-full text-xs bg-muted/20 focus:bg-card focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium text-foreground placeholder-muted-foreground/50 min-h-[80px] resize-none"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Preço de Mão de Obra Base *</Label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1.5 text-muted-foreground text-[10px] font-bold">R$</span>
                    <Input
                      type="number"
                      step="0.01"
                      className="w-full text-xs pl-7 pr-2.5 py-1.5 bg-muted/20 focus:bg-card focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-bold text-emerald-500 placeholder-muted-foreground/50 font-mono"
                      placeholder="0.00"
                      required
                      value={basePrice}
                      onChange={(e) => setBasePrice(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Tempo Estimado (Minutos) *</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      className="w-full text-xs bg-muted/20 focus:bg-card focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium text-foreground placeholder-muted-foreground/50 font-mono"
                      placeholder="60"
                      required
                      value={estimatedTime}
                      onChange={(e) => setEstimatedTime(e.target.value)}
                    />
                    <span className="absolute right-2.5 top-1.5 text-muted-foreground text-[9px] font-bold">MIN</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Linked Parts Block */}
            <div className="bg-muted/20 border border-border/50 rounded-2xl p-4 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                <Package className="size-4 text-emerald-500" />
                Vínculo Automático de Peças
              </h4>
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                Adicione as peças que são sempre gastas na execução deste serviço. Elas serão lançadas automaticamente na abertura da OS.
              </p>

              {/* Autocomplete Search input */}
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
                <Input
                  placeholder="DIGITE SKU OU NOME PARA BUSCAR NO ESTOQUE..."
                  className="w-full text-xs pl-8 pr-3 py-1.5 bg-card focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium text-foreground placeholder-muted-foreground/50 uppercase"
                  value={partSearchQuery}
                  onChange={(e) => setPartSearchQuery(e.target.value)}
                />

                {/* Autocomplete dropdown overlay */}
                {filteredPartsAutocomplete.length > 0 && (
                  <div className="absolute z-50 left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-xl divide-y divide-border overflow-hidden">
                    {filteredPartsAutocomplete.map(part => (
                      <div
                        key={part.id}
                        onClick={() => addPart(part)}
                        className="p-2.5 hover:bg-muted cursor-pointer flex items-center justify-between text-xs"
                      >
                        <div className="grid">
                          <span className="font-bold text-foreground uppercase text-[11px]">{part.name}</span>
                          <span className="text-[9px] text-muted-foreground font-mono">SKU: {part.sku || "N/A"}</span>
                        </div>
                        <span className="text-emerald-500 font-extrabold font-mono">R$ {parseFloat(part.salePrice).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Selected parts list */}
              {selectedParts.length > 0 ? (
                <div className="space-y-2.5 border-t border-border/50 pt-3">
                  {selectedParts.map(part => (
                    <div
                      key={part.id}
                      className="flex items-center justify-between border-b border-dashed border-border/50 pb-2.5 text-xs"
                    >
                      <div className="grid">
                        <span className="font-bold uppercase text-foreground">{part.name}</span>
                        <span className="text-[10px] text-muted-foreground font-mono">SKU: {part.sku || "N/A"} · R$ {part.price.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 bg-muted/40 rounded-lg px-2 py-0.5 border border-border">
                          <Button type="button" onClick={() => updateQuantity(part.id, -1)} className="hover:text-emerald-500 text-sm font-bold w-4">-</Button>
                          <span className="text-xs font-bold w-4 text-center">{part.quantity}</span>
                          <Button type="button" onClick={() => updateQuantity(part.id, 1)} className="hover:text-emerald-500 text-sm font-bold w-4">+</Button>
                        </div>
                        <Button type="button" onClick={() => removePart(part.id)} className="text-muted-foreground hover:text-red-550 transition-colors">
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-6 text-center border border-dashed border-border rounded-xl">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest italic">Aguardando inserção de peças...</p>
                </div>
              )}
            </div>

            {/* Overrides Block */}
            <div className="bg-muted/20 border border-border/50 rounded-2xl p-4 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                <Car className="size-4 text-emerald-500" />
                Sobregravações por Carro
              </h4>
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                Precisa cobrar preços diferentes para veículos específicos? Defina aqui as exceções.
              </p>

              {/* Add override inputs */}
              <div className="grid grid-cols-2 gap-3 items-center align-middle">
                <div className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground uppercase font-bold">Veículo (Modelo/Marca)</Label>
                  <Input
                    placeholder="EX: HONDA CIVIC"
                    className="w-full text-xs bg-card focus:bg-card focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium text-foreground placeholder-muted-foreground/50 uppercase"
                    value={newOverrideCarName}
                    onChange={(e) => setNewOverrideCarName(e.target.value)}
                  />
                </div>
                <div className="space-y-1 flex gap-2 items-end">
                  <div className="flex-1">
                    <Label className="text-[10px] text-muted-foreground uppercase font-bold">Preço de Mão de Obra</Label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1.5 text-muted-foreground text-[10px] font-bold">R$</span>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        className="w-full text-xs bg-card focus:bg-card focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-bold text-amber-500 placeholder-muted-foreground/50 font-mono"
                        value={newOverridePrice}
                        onChange={(e) => setNewOverridePrice(e.target.value)}
                      />
                    </div>
                  </div>
                  <Button
                    type="button"
                    onClick={addPriceOverride}
                    className="border border-border hover:bg-muted text-muted-foreground font-semibold text-xs rounded-lg px-3 py-1.5 transition-colors bg-card"
                  >
                    Add
                  </Button>
                </div>
              </div>

              {/* Overrides list */}
              {overrides.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-2">
                  {overrides.map((ov, index) => (
                    <div
                      key={index}
                      className="p-2.5 bg-card border border-border/50 rounded-xl flex items-center justify-between text-xs"
                    >
                      <div className="grid">
                        <span className="font-bold text-foreground uppercase text-[11px]">{ov.carName}</span>
                        <span className="text-[9px] text-muted-foreground">Mão de Obra Especial</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-amber-500 font-mono">R$ {parseFloat(ov.price).toFixed(2)}</span>
                        <Button type="button" onClick={() => removePriceOverride(index)} className="text-muted-foreground hover:text-red-500 transition-colors">
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            {/* Totals & Submit */}
            <div className="space-y-4 pt-4 border-t border-dashed border-border">
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">SUBTOTAL MÃO DE OBRA:</span>
                <span className="text-foreground font-bold font-mono">R$ {(parseFloat(basePrice) || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">SUBTOTAL AUTOPEÇAS VINCULADAS:</span>
                <span className="text-foreground font-bold font-mono">R$ {totalPartsPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center pt-2.5">
                <span className="text-xs font-bold uppercase tracking-wider text-foreground">Valor Estimado Total:</span>
                <span className="text-xl font-black text-emerald-500 tracking-tight font-mono">R$ {totalServicePrice.toFixed(2)}</span>
              </div>

              <div className="flex gap-2 pt-2">
                {selectedServiceId && (
                  <Button
                    type="button"
                    onClick={resetForm}
                    className="flex-1 h-10 border border-border hover:bg-muted text-muted-foreground font-semibold text-xs rounded-full px-4 py-2 transition-colors"
                  >
                    Cancelar Edição
                  </Button>
                )}

                <Button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 h-10 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-full px-5 py-2 transition-colors border border-emerald-600/10 flex items-center justify-center gap-1"
                >
                  {submitting && <Loader2 className="size-3 animate-spin" />}
                  <span>{selectedServiceId ? "Salvar Alterações" : "Efetivar Registro"}</span>
                </Button>
              </div>

              <div className="p-3 bg-muted/20 text-muted-foreground rounded-2xl border border-border/50 text-[10px] flex items-start gap-2 leading-relaxed">
                <Info className="size-4 text-muted-foreground shrink-0 mt-0.5" />
                <p>
                  O sistema aplicará o preço atual de venda das autopeças no estoque no momento do cadastro. Alterações futuras no inventário não alteram retrospectivamente as OSs abertas.
                </p>
              </div>
            </div>
          </form>
        </section>
      </div>

      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        title="Excluir Serviço"
        message="Tem certeza que deseja deletar este serviço do catálogo? Esta ação não pode ser desfeita."
        confirmText="Excluir"
        cancelText="Cancelar"
        onConfirm={handleConfirmDeleteService}
        onCancel={() => {
          setDeleteConfirmOpen(false)
          setServiceIdToDelete(null)
        }}
      />

    </div>
  )
}
