"use client"

import React, { useState, useEffect, Fragment } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Wrench, 
  Plus, 
  Search, 
  Trash2, 
  Edit2, 
  ChevronDown, 
  ChevronUp, 
  Loader2, 
  Sparkles, 
  Car, 
  Check,
  AlertCircle,
  Package,
  Info,
  X
} from "lucide-react"
import { 
  getServicesAction, 
  createServiceAction, 
  updateServiceAction, 
  deleteServiceAction, 
  saveServiceOverrideAction, 
  deleteServiceOverrideAction,
  linkPartToServiceAction,
  unlinkPartFromServiceAction
} from "@/lib/actions/services-actions"
import { 
  getPartsAction, 
  createPartAction 
} from "@/lib/actions/parts-actions"

const springConfig = { type: "spring" as const, stiffness: 300, damping: 28 }

interface Override {
  id: string
  serviceId: string
  carName: string
  price: string
}

interface LinkedPart {
  id: string
  serviceId: string
  partId: string
  quantity: number
  partName: string
  partBrand: string | null
  partSku: string | null
  partSalePrice: string
}

interface Service {
  id: string
  name: string
  description: string | null
  estimatedTimeMinutes: number
  basePrice: string
  overridesCount: number
  overrides: Override[]
  parts: LinkedPart[]
}

interface PartFromInventory {
  id: string
  name: string
  brand: string | null
  salePrice: string
}

// Helpers para Formatação de Moeda
const formatCurrency = (val: string | number) => {
  const num = typeof val === "string" ? parseFloat(val) : val
  return num.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

const formatCurrencyInput = (value: string) => {
  const clean = value.replace(/\D/g, "")
  if (!clean) return ""
  const numberValue = parseInt(clean, 10) / 100
  return numberValue.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

const parseCurrencyToFloatString = (value: string) => {
  if (!value) return "0.00"
  const clean = value.replace(/\./g, "").replace(",", ".")
  return parseFloat(clean).toFixed(2)
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([])
  const [allParts, setAllParts] = useState<PartFromInventory[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [successMessage, setSuccessMessage] = useState("")

  // Estado para expandir os preços e peças do serviço
  const [expandedServiceId, setExpandedServiceId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"prices" | "parts">("prices")

  // Estado para o Modal de Criação / Edição do Serviço
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [formName, setFormName] = useState("")
  const [formDescription, setFormDescription] = useState("")
  const [formTime, setFormTime] = useState("45")
  const [formPrice, setFormPrice] = useState("")

  // Estado para adicionar preço diferenciado por carro
  const [newCarName, setNewCarName] = useState("")
  const [newOverridePrice, setNewOverridePrice] = useState("")

  // Estado para associar peça existente
  const [selectedPartId, setSelectedPartId] = useState("")
  const [partLinkQty, setPartLinkQty] = useState(1)

  // Estado para cadastrar nova peça inline na hora
  const [showNewPartInline, setShowNewPartInline] = useState(false)
  const [inlinePartName, setInlinePartName] = useState("")
  const [inlinePartBrand, setInlinePartBrand] = useState("")
  const [inlinePartSku, setInlinePartSku] = useState("")
  const [inlinePartQty, setInlinePartQty] = useState("5")
  const [inlinePartMinQty, setInlinePartMinQty] = useState("2")
  const [inlinePartCost, setInlinePartCost] = useState("")
  const [inlinePartSale, setInlinePartSale] = useState("")
  const [inlineLinkQty, setInlineLinkQty] = useState(1)

  // Carrega serviços e peças cadastrados
  const loadData = async () => {
    setIsLoading(true)
    const [resServices, resParts] = await Promise.all([
      getServicesAction(),
      getPartsAction()
    ])
    setIsLoading(false)

    if (resServices.success && resServices.data) {
      setServices(resServices.data as Service[])
    } else {
      setErrorMessage(resServices.error || "Não foi possível carregar os serviços.")
    }

    if (resParts.success && resParts.data) {
      setAllParts(resParts.data as PartFromInventory[])
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Limpa mensagens temporárias
  useEffect(() => {
    if (successMessage || errorMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage("")
        setErrorMessage("")
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [successMessage, errorMessage])

  // Abre modal de criação
  const handleOpenCreateModal = () => {
    setEditingService(null)
    setFormName("")
    setFormDescription("")
    setFormTime("45")
    setFormPrice("")
    setIsModalOpen(true)
  }

  // Abre modal de edição
  const handleOpenEditModal = (service: Service) => {
    setEditingService(service)
    setFormName(service.name)
    setFormDescription(service.description || "")
    setFormTime(service.estimatedTimeMinutes.toString())
    const formattedPrice = parseFloat(service.basePrice).toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
    setFormPrice(formattedPrice)
    setIsModalOpen(true)
  }

  // Envio do formulário do serviço (Criar / Editar)
  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formName || !formPrice) return

    setActionLoading(true)
    const timeNum = parseInt(formTime, 10) || 0
    const cleanPrice = parseCurrencyToFloatString(formPrice)

    let res
    if (editingService) {
      res = await updateServiceAction({
        id: editingService.id,
        name: formName,
        description: formDescription || undefined,
        estimatedTimeMinutes: timeNum,
        basePrice: cleanPrice
      })
    } else {
      res = await createServiceAction({
        name: formName,
        description: formDescription || undefined,
        estimatedTimeMinutes: timeNum,
        basePrice: cleanPrice
      })
    }
    setActionLoading(false)

    if (res.success) {
      setSuccessMessage(editingService ? "Serviço editado com sucesso!" : "Novo serviço criado com sucesso!")
      setIsModalOpen(false)
      loadData()
    } else {
      setErrorMessage(res.error || "Não foi possível salvar o serviço.")
    }
  }

  // Deletar um serviço
  const handleDeleteService = async (id: string) => {
    if (!confirm("Deseja realmente excluir este serviço e todos os seus preços diferenciados e vínculos de peças?")) return

    setActionLoading(true)
    const res = await deleteServiceAction(id)
    setActionLoading(false)

    if (res.success) {
      setSuccessMessage("Serviço removido com sucesso!")
      if (expandedServiceId === id) setExpandedServiceId(null)
      loadData()
    } else {
      setErrorMessage(res.error || "Erro ao deletar o serviço.")
    }
  }

  // Salvar uma sobregravação de preço por veículo
  const handleSaveOverride = async (serviceId: string) => {
    if (!newCarName || !newOverridePrice) return

    setActionLoading(true)
    const cleanPrice = parseCurrencyToFloatString(newOverridePrice)
    const res = await saveServiceOverrideAction({
      serviceId,
      carName: newCarName.trim(),
      price: cleanPrice
    })
    setActionLoading(false)

    if (res.success) {
      setNewCarName("")
      setNewOverridePrice("")
      setSuccessMessage("Preço customizado salvo com sucesso!")
      loadData()
    } else {
      setErrorMessage(res.error || "Erro ao salvar o preço diferenciado por carro.")
    }
  }

  // Excluir uma sobregravação
  const handleDeleteOverride = async (overrideId: string) => {
    setActionLoading(true)
    const res = await deleteServiceOverrideAction(overrideId)
    setActionLoading(false)

    if (res.success) {
      setSuccessMessage("Preço customizado removido!")
      loadData()
    } else {
      setErrorMessage(res.error || "Erro ao remover o preço diferenciado.")
    }
  }

  // Vincular peça existente
  const handleLinkPart = async (serviceId: string) => {
    if (!selectedPartId || partLinkQty < 1) return

    setActionLoading(true)
    const res = await linkPartToServiceAction(serviceId, selectedPartId, partLinkQty)
    setActionLoading(false)

    if (res.success) {
      setSelectedPartId("")
      setPartLinkQty(1)
      setSuccessMessage("Peça vinculada ao serviço com sucesso!")
      loadData()
    } else {
      setErrorMessage(res.error || "Erro ao vincular peça.")
    }
  }

  // Desvincular peça
  const handleUnlinkPart = async (linkId: string) => {
    setActionLoading(true)
    const res = await unlinkPartFromServiceAction(linkId)
    setActionLoading(false)

    if (res.success) {
      setSuccessMessage("Peça desvinculada do serviço.")
      loadData()
    } else {
      setErrorMessage(res.error || "Erro ao desvincular peça.")
    }
  }

  // Cadastrar nova peça "na hora" e vincular
  const handleCreateAndLinkPart = async (serviceId: string) => {
    if (!inlinePartName || !inlinePartCost || !inlinePartSale || inlineLinkQty < 1) return

    setActionLoading(true)
    const cleanCost = parseCurrencyToFloatString(inlinePartCost)
    const cleanSale = parseCurrencyToFloatString(inlinePartSale)
    const qtyVal = parseInt(inlinePartQty, 10) || 0
    const minQtyVal = parseInt(inlinePartMinQty, 10) || 2

    // 1. Cadastra no estoque
    const resPart = await createPartAction({
      name: inlinePartName,
      brand: inlinePartBrand || undefined,
      sku: inlinePartSku || undefined,
      quantity: qtyVal,
      minQuantity: minQtyVal,
      costPrice: cleanCost,
      salePrice: cleanSale
    })

    if (resPart.success && resPart.data) {
      // 2. Vincula a nova peça criada ao serviço
      const newPartId = resPart.data.id
      const resLink = await linkPartToServiceAction(serviceId, newPartId, inlineLinkQty)
      
      if (resLink.success) {
        setSuccessMessage("Nova peça cadastrada no estoque e vinculada a este serviço!")
        // Limpa form inline
        setInlinePartName("")
        setInlinePartBrand("")
        setInlinePartSku("")
        setInlinePartQty("5")
        setInlinePartMinQty("2")
        setInlinePartCost("")
        setInlinePartSale("")
        setInlineLinkQty(1)
        setShowNewPartInline(false)
        loadData()
      } else {
        setErrorMessage(resLink.error || "A peça foi criada no estoque, mas falhou ao vincular ao serviço.")
        loadData()
      }
    } else {
      setErrorMessage(resPart.error || "Não foi possível criar a nova peça no estoque.")
    }
    setActionLoading(false)
  }

  // Filtra serviços
  const filteredServices = services.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="flex-1 p-4 md:p-6 bg-[#FAF9F6] dark:bg-zinc-950 min-h-screen font-sans">
      
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <span className="bg-emerald-500/10 text-emerald-500 p-1.5 rounded-lg border border-emerald-500/20">
              <Wrench className="size-4.5" />
            </span>
            Gestão de Serviços
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Cadastre serviços, adicione descrições detalhadas, customize preços por carro e gerencie peças integradas ao serviço.
          </p>
        </div>
        
        <button
          onClick={handleOpenCreateModal}
          className="flex items-center gap-1.5 bg-foreground hover:bg-foreground/90 text-background font-bold text-xs rounded-full px-4 py-2 transition-all shadow-sm active:scale-95 shrink-0"
        >
          <Plus className="size-3.5" />
          <span>Cadastrar Serviço</span>
        </button>
      </div>

      {/* Alertas */}
      {successMessage && (
        <div className="mb-4 p-2.5 bg-emerald-500/10 text-emerald-500 rounded-lg border border-emerald-500/20 text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
          <Check className="size-3.5" />
          <span>{successMessage}</span>
        </div>
      )}
      {errorMessage && (
        <div className="mb-4 p-2.5 bg-red-500/10 text-red-500 rounded-lg border border-red-500/20 text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
          <AlertCircle className="size-3.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Caixa de Busca */}
      <div className="mb-4 max-w-md relative">
        <span className="absolute left-2.5 top-2.5 text-muted-foreground">
          <Search className="size-3.5" />
        </span>
        <input
          type="text"
          placeholder="Buscar serviços..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full text-xs border border-border rounded-lg pl-8 pr-3 py-2 bg-card focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium text-foreground placeholder-muted-foreground/50"
        />
      </div>

      {/* Card da Tabela de Serviços (Jeet Style) */}
      <div className="bg-card rounded-3xl shadow-[0_10px_50px_-12px_rgba(0,0,0,0.05)] border border-border/50 overflow-hidden text-card-foreground">
        {isLoading ? (
          <div className="p-16 flex flex-col items-center justify-center gap-2">
            <Loader2 className="size-6 text-emerald-500 animate-spin" />
            <span className="text-xs text-muted-foreground font-medium">Carregando catálogo de serviços...</span>
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="p-16 text-center text-xs text-muted-foreground">
            Nenhum serviço encontrado.
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/50 border-b border-border/50 text-[9px] uppercase font-bold text-muted-foreground tracking-wider">
                <th className="px-4 py-3">Serviço</th>
                <th className="px-4 py-3">Descrição</th>
                <th className="px-4 py-3">Tempo Estimado</th>
                <th className="px-4 py-3">Preço Base</th>
                <th className="px-4 py-3 text-center">Gestão Integrada</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredServices.map((service) => {
                const isExpanded = expandedServiceId === service.id
                return (
                  <Fragment key={service.id}>
                    <tr className="border-b border-dashed border-border/60 hover:bg-muted/30 transition-colors text-xs font-semibold text-foreground">
                      <td className="px-4 py-3 font-bold">{service.name}</td>
                      <td className="px-4 py-3 text-muted-foreground font-normal max-w-[180px] truncate" title={service.description || ""}>
                        {service.description || "--"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground font-medium">{service.estimatedTimeMinutes} min</td>
                      <td className="px-4 py-3">{formatCurrency(service.basePrice)}</td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => {
                              setActiveTab("prices")
                              setExpandedServiceId(isExpanded && activeTab === "prices" ? null : service.id)
                            }}
                            className={`inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full border transition-all ${
                              service.overridesCount > 0
                                ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/15"
                                : "bg-muted/50 text-muted-foreground border-border hover:bg-muted"
                            }`}
                          >
                            <Car className="size-2.5" />
                            <span>{service.overridesCount} veíc.</span>
                          </button>

                          <button
                            onClick={() => {
                              setActiveTab("parts")
                              setExpandedServiceId(isExpanded && activeTab === "parts" ? null : service.id)
                            }}
                            className={`inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full border transition-all ${
                              service.parts.length > 0
                                ? "bg-blue-500/10 text-blue-500 border-blue-500/20 hover:bg-blue-500/15"
                                : "bg-muted/50 text-muted-foreground border-border hover:bg-muted"
                            }`}
                          >
                            <Package className="size-2.5" />
                            <span>{service.parts.length} peças</span>
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => handleOpenEditModal(service)}
                            className="p-1 hover:bg-muted text-muted-foreground hover:text-foreground rounded-md border border-transparent hover:border-border transition-all"
                            title="Editar serviço"
                          >
                            <Edit2 className="size-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteService(service.id)}
                            className="p-1 hover:bg-red-500/10 text-muted-foreground hover:text-red-500 rounded-md border border-transparent hover:border-red-500/20 transition-all"
                            title="Excluir serviço"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    
                    {/* Linha Expandida (Overrides por Carro OU Peças Utilizadas) */}
                    {isExpanded && (
                      <tr>
                        <td colSpan={6} className="bg-muted/20 border-b border-dashed border-border/60 px-6 py-4">
                          <motion.div
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={springConfig}
                            className="space-y-4"
                          >
                            
                            {/* Seletor de Abas Interno */}
                            <div className="flex border-b border-border/40 gap-4 text-xs font-semibold pb-1.5">
                              <button
                                onClick={() => setActiveTab("prices")}
                                className={`pb-1 transition-all border-b-2 ${
                                  activeTab === "prices"
                                    ? "text-emerald-500 border-emerald-500 font-bold"
                                    : "text-muted-foreground border-transparent hover:text-foreground"
                                }`}
                              >
                                Preços por Veículo ({service.overridesCount})
                              </button>
                              <button
                                onClick={() => setActiveTab("parts")}
                                className={`pb-1 transition-all border-b-2 ${
                                  activeTab === "parts"
                                    ? "text-emerald-500 border-emerald-500 font-bold"
                                    : "text-muted-foreground border-transparent hover:text-foreground"
                                }`}
                              >
                                Peças Usadas ({service.parts.length})
                              </button>
                            </div>

                            {/* ABA 1: PREÇOS POR VEÍCULO */}
                            {activeTab === "prices" && (
                              <div className="space-y-4">
                                <div className="flex items-center gap-1.5 text-foreground font-semibold text-[11px]">
                                  <Sparkles className="size-3.5 text-emerald-500" />
                                  <h3>Preços Diferenciados por Carro: <span className="underline">{service.name}</span></h3>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                  {service.overrides.length === 0 ? (
                                    <p className="text-[10px] text-muted-foreground font-medium col-span-full">
                                      Este serviço utiliza o preço base em todos os veículos. Defina um valor customizado abaixo.
                                    </p>
                                  ) : (
                                    service.overrides.map(override => (
                                      <div
                                        key={override.id}
                                        className="bg-card border border-border/50 rounded-lg p-2 flex items-center justify-between text-xs"
                                      >
                                        <div className="flex flex-col">
                                          <span className="font-semibold text-foreground text-[11px]">{override.carName}</span>
                                          <span className="text-[10px] text-emerald-500 font-bold">{formatCurrency(override.price)}</span>
                                        </div>
                                        <button
                                          onClick={() => handleDeleteOverride(override.id)}
                                          disabled={actionLoading}
                                          className="p-1 hover:bg-red-500/10 text-muted-foreground hover:text-red-500 rounded-md transition-colors"
                                        >
                                          <Trash2 className="size-3" />
                                        </button>
                                      </div>
                                    ))
                                  )}
                                </div>

                                <div className="flex flex-wrap gap-2 items-end pt-2 border-t border-dashed border-border/40">
                                  <div className="space-y-1">
                                    <label className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider">Veículo / Modelo</label>
                                    <input
                                      type="text"
                                      placeholder="Ex: Civic"
                                      value={newCarName}
                                      onChange={(e) => setNewCarName(e.target.value)}
                                      className="text-[11px] border border-border rounded-md px-2.5 py-1 bg-card focus:outline-hidden focus:ring-1 focus:ring-emerald-500 font-medium text-foreground w-[160px]"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider">Valor Diferenciado (R$)</label>
                                    <input
                                      type="text"
                                      placeholder="Ex: 150,00"
                                      value={newOverridePrice}
                                      onChange={(e) => setNewOverridePrice(formatCurrencyInput(e.target.value))}
                                      className="text-[11px] border border-border rounded-md px-2.5 py-1 bg-card focus:outline-hidden focus:ring-1 focus:ring-emerald-500 font-medium text-foreground w-[130px]"
                                    />
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleSaveOverride(service.id)}
                                    disabled={actionLoading || !newCarName || !newOverridePrice}
                                    className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[10px] rounded-md px-3 py-1.5 transition-colors border border-emerald-600/15 disabled:bg-muted disabled:text-muted-foreground"
                                  >
                                    Adicionar Valor
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* ABA 2: PEÇAS UTILIZADAS */}
                            {activeTab === "parts" && (
                              <div className="space-y-4">
                                <div className="flex items-center justify-between gap-4">
                                  <div className="flex items-center gap-1.5 text-foreground font-semibold text-[11px]">
                                    <Package className="size-3.5 text-blue-500" />
                                    <h3>Peças Vinculadas ao Serviço: <span className="underline">{service.name}</span></h3>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => setShowNewPartInline(!showNewPartInline)}
                                    className="text-[10px] font-bold text-emerald-500 hover:underline flex items-center gap-1"
                                  >
                                    {showNewPartInline ? "Cancelar Cadastro" : "Cadastrar Nova Peça na Hora"}
                                  </button>
                                </div>

                                {/* Form Inline para cadastrar nova peça na hora */}
                                {showNewPartInline && (
                                  <div className="bg-card border border-emerald-500/20 rounded-xl p-3.5 space-y-3 shadow-xs animate-in fade-in slide-in-from-top-1">
                                    <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-500 uppercase tracking-wider">
                                      <Sparkles className="size-3.5" />
                                      <span>Nova Peça no Estoque & Vínculo Direto</span>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                                      <div className="space-y-0.5">
                                        <label className="text-[9px] text-muted-foreground font-medium">Nome da Peça</label>
                                        <input
                                          type="text"
                                          placeholder="Ex: Óleo Selènia 5W30"
                                          value={inlinePartName}
                                          onChange={(e) => setInlinePartName(e.target.value)}
                                          className="w-full text-xs border border-border rounded-md px-2 py-1 bg-muted/10 focus:bg-card focus:outline-hidden font-medium text-foreground"
                                        />
                                      </div>
                                      <div className="space-y-0.5">
                                        <label className="text-[9px] text-muted-foreground font-medium">Marca (Opcional)</label>
                                        <input
                                          type="text"
                                          placeholder="Ex: Petronas"
                                          value={inlinePartBrand}
                                          onChange={(e) => setInlinePartBrand(e.target.value)}
                                          className="w-full text-xs border border-border rounded-md px-2 py-1 bg-muted/10 focus:bg-card focus:outline-hidden font-medium text-foreground"
                                        />
                                      </div>
                                      <div className="space-y-0.5">
                                        <label className="text-[9px] text-muted-foreground font-medium">Código SKU (Opcional)</label>
                                        <input
                                          type="text"
                                          placeholder="Ex: OLE-5W30"
                                          value={inlinePartSku}
                                          onChange={(e) => setInlinePartSku(e.target.value)}
                                          className="w-full text-xs border border-border rounded-md px-2 py-1 bg-muted/10 focus:bg-card focus:outline-hidden font-medium text-foreground font-mono"
                                        />
                                      </div>
                                    </div>

                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                                      <div className="space-y-0.5">
                                        <label className="text-[9px] text-muted-foreground font-medium">Preço de Custo (R$)</label>
                                        <input
                                          type="text"
                                          placeholder="Ex: 35,00"
                                          value={inlinePartCost}
                                          onChange={(e) => setInlinePartCost(formatCurrencyInput(e.target.value))}
                                          className="w-full text-xs border border-border rounded-md px-2 py-1 bg-muted/10 focus:bg-card focus:outline-hidden font-medium text-foreground"
                                        />
                                      </div>
                                      <div className="space-y-0.5">
                                        <label className="text-[9px] text-muted-foreground font-medium">Preço de Venda (R$)</label>
                                        <input
                                          type="text"
                                          placeholder="Ex: 55,00"
                                          value={inlinePartSale}
                                          onChange={(e) => setInlinePartSale(formatCurrencyInput(e.target.value))}
                                          className="w-full text-xs border border-border rounded-md px-2 py-1 bg-muted/10 focus:bg-card focus:outline-hidden font-medium text-foreground"
                                        />
                                      </div>
                                      <div className="space-y-0.5">
                                        <label className="text-[9px] text-muted-foreground font-medium">Estoque Inicial</label>
                                        <input
                                          type="number"
                                          value={inlinePartQty}
                                          onChange={(e) => setInlinePartQty(e.target.value)}
                                          className="w-full text-xs border border-border rounded-md px-2 py-1 bg-muted/10 focus:bg-card focus:outline-hidden font-medium text-foreground"
                                        />
                                      </div>
                                      <div className="space-y-0.5">
                                        <label className="text-[9px] text-muted-foreground font-medium">Qtd Usada no Serviço</label>
                                        <input
                                          type="number"
                                          min="1"
                                          value={inlineLinkQty}
                                          onChange={(e) => setInlineLinkQty(parseInt(e.target.value, 10) || 1)}
                                          className="w-full text-xs border border-emerald-500/40 rounded-md px-2 py-1 bg-card focus:outline-hidden font-bold text-foreground"
                                        />
                                      </div>
                                    </div>

                                    <div className="flex justify-end gap-1.5">
                                      <button
                                        type="button"
                                        onClick={() => setShowNewPartInline(false)}
                                        className="text-[10px] font-semibold text-muted-foreground border border-border px-3 py-1.5 rounded-full hover:bg-muted transition-colors"
                                      >
                                        Cancelar
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleCreateAndLinkPart(service.id)}
                                        disabled={actionLoading || !inlinePartName || !inlinePartCost || !inlinePartSale}
                                        className="text-[10px] font-bold text-white bg-emerald-500 hover:bg-emerald-600 px-4 py-1.5 rounded-full transition-colors border border-emerald-600/10 disabled:bg-muted disabled:text-muted-foreground"
                                      >
                                        Salvar e Vincular
                                      </button>
                                    </div>
                                  </div>
                                )}

                                {/* Lista de peças vinculadas */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                  {service.parts.length === 0 ? (
                                    <p className="text-[10px] text-muted-foreground font-medium col-span-full">
                                      Nenhuma peça associada a este serviço. Associe peças abaixo.
                                    </p>
                                  ) : (
                                    service.parts.map(p => (
                                      <div
                                        key={p.id}
                                        className="bg-card border border-border/50 rounded-lg p-2 flex items-center justify-between text-xs"
                                      >
                                        <div className="flex flex-col">
                                          <span className="font-semibold text-foreground text-[11px]">{p.partName}</span>
                                          <span className="text-[10px] text-muted-foreground font-normal">
                                            {p.partBrand ? `${p.partBrand} • ` : ""}Qtd: <span className="font-bold text-foreground">{p.quantity} un</span>
                                          </span>
                                        </div>
                                        <button
                                          onClick={() => handleUnlinkPart(p.id)}
                                          disabled={actionLoading}
                                          className="p-1 hover:bg-red-500/10 text-muted-foreground hover:text-red-500 rounded-md transition-colors"
                                          title="Remover peça"
                                        >
                                          <Trash2 className="size-3.5" />
                                        </button>
                                      </div>
                                    ))
                                  )}
                                </div>

                                {/* Form Inline para associar peça existente */}
                                <div className="flex flex-wrap gap-2 items-end pt-2 border-t border-dashed border-border/40">
                                  <div className="space-y-1">
                                    <label className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider">Peça em Estoque</label>
                                    <select
                                      value={selectedPartId}
                                      onChange={(e) => setSelectedPartId(e.target.value)}
                                      className="text-[11px] border border-border rounded-md px-2 py-1 bg-card focus:outline-hidden focus:ring-1 focus:ring-emerald-500 font-medium text-foreground w-[220px]"
                                    >
                                      <option value="">-- Selecione a peça --</option>
                                      {allParts.map(part => (
                                        <option key={part.id} value={part.id}>
                                          {part.name} {part.brand ? `(${part.brand})` : ""} - {formatCurrency(part.salePrice)}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider">Quantidade Utilizada</label>
                                    <input
                                      type="number"
                                      min="1"
                                      value={partLinkQty}
                                      onChange={(e) => setPartLinkQty(parseInt(e.target.value, 10) || 1)}
                                      className="text-[11px] border border-border rounded-md px-2 py-1 bg-card focus:outline-hidden focus:ring-1 focus:ring-emerald-500 font-medium text-foreground w-[85px]"
                                    />
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleLinkPart(service.id)}
                                    disabled={actionLoading || !selectedPartId}
                                    className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[10px] rounded-md px-3.5 py-1.5 transition-colors border border-emerald-600/15 disabled:bg-muted disabled:text-muted-foreground"
                                  >
                                    Vincular Peça
                                  </button>
                                </div>

                              </div>
                            )}

                          </motion.div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal de Cadastro/Edição de Serviço */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={springConfig}
              className="bg-card w-full max-w-sm rounded-3xl shadow-xl border border-border overflow-hidden"
            >
              <div className="px-5 py-4 border-b border-dashed border-border flex items-center justify-between">
                <h2 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                  <Wrench className="size-4 text-emerald-500" />
                  {editingService ? "Editar Serviço" : "Novo Serviço"}
                </h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-muted-foreground hover:text-foreground text-xs font-semibold"
                >
                  Fechar
                </button>
              </div>

              <form onSubmit={handleSaveService} className="p-5 space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-medium text-muted-foreground">Nome do Serviço</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Troca de Óleo"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full text-xs border border-border rounded-lg px-2.5 py-1.5 bg-muted/20 focus:bg-card focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium text-foreground placeholder-muted-foreground/50"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-medium text-muted-foreground">Descrição do Serviço (Opcional)</label>
                  <textarea
                    placeholder="Ex: Realizar troca de óleo lubrificante do motor e substituição do respectivo filtro."
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    rows={2}
                    className="w-full text-xs border border-border rounded-lg px-2.5 py-1.5 bg-muted/20 focus:bg-card focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium text-foreground placeholder-muted-foreground/50 resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-medium text-muted-foreground">Tempo Estimado (min)</label>
                    <input
                      type="number"
                      required
                      min="1"
                      placeholder="Ex: 45"
                      value={formTime}
                      onChange={(e) => setFormTime(e.target.value)}
                      className="w-full text-xs border border-border rounded-lg px-2.5 py-1.5 bg-muted/20 focus:bg-card focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium text-foreground placeholder-muted-foreground/50"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-medium text-muted-foreground">Preço Base (R$)</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: 120,00"
                      value={formPrice}
                      onChange={(e) => setFormPrice(formatCurrencyInput(e.target.value))}
                      className="w-full text-xs border border-border rounded-lg px-2.5 py-1.5 bg-muted/20 focus:bg-card focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium text-foreground placeholder-muted-foreground/50"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="border border-border hover:bg-muted text-muted-foreground font-semibold text-xs rounded-full px-4 py-2 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-full px-5 py-2 transition-colors border border-emerald-600/10 flex items-center gap-1"
                  >
                    {actionLoading && <Loader2 className="size-3 animate-spin" />}
                    <span>Salvar</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  )
}
