"use client"

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Package,
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
  AlertTriangle,
  Info
} from "lucide-react"
import {
  getPartsAction,
  createPartAction,
  updatePartAction,
  deletePartAction,
  savePartOverrideAction,
  deletePartOverrideAction
} from "@/lib/actions/parts-actions"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "sonner"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const springConfig = { type: "spring" as const, stiffness: 300, damping: 28 }

interface Override {
  id: string
  partId: string
  carName: string
  price: string
}

interface Part {
  id: string
  name: string
  brand: string | null
  sku: string | null
  quantity: number
  minQuantity: number
  costPrice: string
  salePrice: string
  location: string | null
  compatibleCars: string | null
  dimension: string | null
  size: string | null
  weight: string | null
  overridesCount: number
  overrides: Override[]
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

export default function PartsPage() {
  const [parts, setParts] = useState<Part[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [successMessage, setSuccessMessage] = useState("")

  // Confirm Dialog states
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [partIdToDelete, setPartIdToDelete] = useState<string | null>(null)

  // Estado para expandir os preços customizados por carro da peça
  const [expandedPartId, setExpandedPartId] = useState<string | null>(null)

  // Estado para o Modal de Criação / Edição
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPart, setEditingPart] = useState<Part | null>(null)

  // Estados do formulário de peças
  const [formName, setFormName] = useState("")
  const [formBrand, setFormBrand] = useState("")
  const [formSku, setFormSku] = useState("")
  const [formQty, setFormQty] = useState("0")
  const [formMinQty, setFormMinQty] = useState("2")
  const [formCostPrice, setFormCostPrice] = useState("")
  const [formSalePrice, setFormSalePrice] = useState("")
  const [formLocation, setFormLocation] = useState("")
  const [formCompatibleCars, setFormCompatibleCars] = useState("")
  const [formDimension, setFormDimension] = useState("")
  const [formSize, setFormSize] = useState("")
  const [formWeight, setFormWeight] = useState("")

  // Estado para adicionar preço diferenciado por carro da peça
  const [newCarName, setNewCarName] = useState("")
  const [newOverridePrice, setNewOverridePrice] = useState("")

  // Carrega peças inicialmente
  const loadParts = async () => {
    setIsLoading(true)
    const res = await getPartsAction()
    setIsLoading(false)
    if (res.success && res.data) {
      setParts(res.data as Part[])
    } else {
      setErrorMessage(res.error || "Não foi possível carregar o estoque de peças.")
    }
  }

  useEffect(() => {
    loadParts()
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
    setEditingPart(null)
    setFormName("")
    setFormBrand("")
    setFormSku("")
    setFormQty("0")
    setFormMinQty("2")
    setFormCostPrice("")
    setFormSalePrice("")
    setFormLocation("")
    setFormCompatibleCars("")
    setFormDimension("")
    setFormSize("")
    setFormWeight("")
    setIsModalOpen(true)
  }

  // Abre modal de edição
  const handleOpenEditModal = (part: Part) => {
    setEditingPart(part)
    setFormName(part.name)
    setFormBrand(part.brand || "")
    setFormSku(part.sku || "")
    setFormQty(part.quantity.toString())
    setFormMinQty(part.minQuantity.toString())
    setFormLocation(part.location || "")
    setFormCompatibleCars(part.compatibleCars || "")
    setFormDimension(part.dimension || "")
    setFormSize(part.size || "")
    setFormWeight(part.weight || "")

    // Formata os preços para o input pt-BR
    const formattedCost = parseFloat(part.costPrice).toLocaleString("pt-BR", {
      minimumFractionDigits: 2, maximumFractionDigits: 2
    })
    const formattedSale = parseFloat(part.salePrice).toLocaleString("pt-BR", {
      minimumFractionDigits: 2, maximumFractionDigits: 2
    })

    setFormCostPrice(formattedCost)
    setFormSalePrice(formattedSale)
    setIsModalOpen(true)
  }

  // Envio do formulário (Criar / Editar)
  const handleSavePart = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formName || !formCostPrice || !formSalePrice) return

    setActionLoading(true)
    const qtyNum = parseInt(formQty, 10) || 0
    const minQtyNum = parseInt(formMinQty, 10) || 0
    const cleanCost = parseCurrencyToFloatString(formCostPrice)
    const cleanSale = parseCurrencyToFloatString(formSalePrice)

    const payload = {
      name: formName,
      brand: formBrand || undefined,
      sku: formSku || undefined,
      quantity: qtyNum,
      minQuantity: minQtyNum,
      costPrice: cleanCost,
      salePrice: cleanSale,
      location: formLocation || undefined,
      compatibleCars: formCompatibleCars || undefined,
      dimension: formDimension || undefined,
      size: formSize || undefined,
      weight: formWeight || undefined
    }

    let res
    if (editingPart) {
      res = await updatePartAction({
        id: editingPart.id,
        ...payload
      })
    } else {
      res = await createPartAction(payload)
    }
    setActionLoading(false)

    if (res.success) {
      setSuccessMessage(editingPart ? "Peça editada com sucesso!" : "Nova peça inserida no estoque!")
      setIsModalOpen(false)
      loadParts()
    } else {
      setErrorMessage(res.error || "Não foi possível salvar a peça.")
    }
  }

  // Deletar peça do estoque
  const handleDeletePartClick = (id: string) => {
    setPartIdToDelete(id)
    setDeleteConfirmOpen(true)
  }

  const handleConfirmDeletePart = async () => {
    if (!partIdToDelete) return
    setDeleteConfirmOpen(false)
    setActionLoading(true)
    const res = await deletePartAction(partIdToDelete)
    setActionLoading(false)

    if (res.success) {
      toast.success("Peça removida do estoque!")
      if (expandedPartId === partIdToDelete) setExpandedPartId(null)
      loadParts()
    } else {
      toast.error(res.error || "Erro ao deletar a peça.")
    }
    setPartIdToDelete(null)
  }

  // Salvar sobregravação de preço por veículo
  const handleSaveOverride = async (partId: string) => {
    if (!newCarName || !newOverridePrice) return

    setActionLoading(true)
    const cleanPrice = parseCurrencyToFloatString(newOverridePrice)
    const res = await savePartOverrideAction({
      partId,
      carName: newCarName.trim(),
      price: cleanPrice
    })
    setActionLoading(false)

    if (res.success) {
      setNewCarName("")
      setNewOverridePrice("")
      setSuccessMessage("Preço customizado da peça salvo!")
      loadParts()
    } else {
      setErrorMessage(res.error || "Erro ao salvar preço customizado.")
    }
  }

  // Deletar sobregravação de peça
  const handleDeleteOverride = async (overrideId: string) => {
    setActionLoading(true)
    const res = await deletePartOverrideAction(overrideId)
    setActionLoading(false)

    if (res.success) {
      setSuccessMessage("Preço customizado removido!")
      loadParts()
    } else {
      setErrorMessage(res.error || "Erro ao remover preço diferenciado.")
    }
  }

  // Filtra as peças na listagem
  const filteredParts = parts.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.brand && p.brand.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (p.compatibleCars && p.compatibleCars.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  return (
    <div className="flex-1 p-4 md:p-6 bg-[#FAF9F6] dark:bg-zinc-950 min-h-screen font-sans">

      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <span className="bg-emerald-500/10 text-emerald-500 p-1.5 rounded-lg border border-emerald-500/20">
              <Package className="size-4.5" />
            </span>
            Estoque de Peças & Insumos
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5 geist-mono pl-10">
            Gerencie componentes físicos, controle o nível crítico de estoque, adicione dimensões e customize preços por carro.
          </p>
        </div>

        <Button
          onClick={handleOpenCreateModal}
          className="bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs rounded-none px-5 py-2.5 h-auto transition-all shadow-md active:scale-95 flex items-center gap-1.5 cursor-pointer shrink-0"
        >
          <Plus className="size-4" />
          <span>Adicionar Peça</span>
        </Button>
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
          <AlertTriangle className="size-3.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Busca */}
      <div className="mb-4 max-w-md relative flex items-center">
        <Search className="absolute left-3 size-4 text-muted-foreground z-10" />
        <Input
          type="text"
          placeholder="Buscar por nome, marca ou compatibilidade..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full h-10 text-xs pl-9 pr-3 bg-card focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium text-foreground placeholder-muted-foreground/50"
        />
      </div>

      {/* Card da Tabela de Estoque (Jeet Style) */}
      <div className="bg-card rounded-3xl shadow-[0_10px_50px_-12px_rgba(0,0,0,0.05)] border border-border/50 overflow-hidden text-card-foreground">
        {isLoading ? (
          <div className="p-16 flex flex-col items-center justify-center gap-2">
            <Loader2 className="size-6 text-emerald-500 animate-spin" />
            <span className="text-xs text-muted-foreground font-medium">Buscando peças em estoque...</span>
          </div>
        ) : filteredParts.length === 0 ? (
          <div className="p-16 text-center text-xs text-muted-foreground">
            Nenhuma peça cadastrada no momento.
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/50 border-b border-border/50 text-[9px] uppercase font-bold text-muted-foreground tracking-wider">
                <th className="px-4 py-3">Peça / SKU</th>
                <th className="px-4 py-3">Marca</th>
                <th className="px-4 py-3 text-center">Qtd. Estoque</th>
                <th className="px-4 py-3">Preço Base</th>
                <th className="px-4 py-3">Compatibilidade</th>
                <th className="px-4 py-3 text-center">Preços por Carro</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredParts.map((part) => {
                const isExpanded = expandedPartId === part.id
                const isLowStock = part.quantity <= part.minQuantity
                return (
                  <React.Fragment key={part.id}>
                    <tr className="border-b border-dashed border-border/60 hover:bg-muted/30 transition-colors text-xs font-semibold text-foreground">
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="font-semibold text-foreground">{part.name}</span>
                          {part.sku && <span className="text-[9px] text-muted-foreground font-mono font-normal">{part.sku}</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground font-medium">{part.brand || "--"}</td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <span className={`font-bold px-2 py-0.5 rounded-md text-[10px] geist-mono ${isLowStock
                              ? "bg-red-500/10 text-red-500"
                              : "bg-emerald-500/10 text-emerald-500"
                            }`}>
                            {part.quantity} un
                          </span>
                          {isLowStock && (
                            <span title="Estoque crítico ou abaixo do mínimo!">
                              <AlertTriangle className="size-3 text-red-500" />
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">{formatCurrency(part.salePrice)}</td>
                      <td className="px-4 py-3 text-muted-foreground font-normal max-w-[150px] truncate" title={part.compatibleCars || ""}>
                        {part.compatibleCars || "Geral / Universal"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Button
                          onClick={() => setExpandedPartId(isExpanded ? null : part.id)}
                          className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border transition-all ${part.overridesCount > 0
                              ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/15"
                              : "bg-muted/50 text-muted-foreground border-border hover:bg-muted"
                            }`}
                        >
                          <Car className="size-3" />
                          <span>{part.overridesCount} {part.overridesCount === 1 ? "carro" : "carros"}</span>
                          {isExpanded ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
                        </Button>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <Button
                            onClick={() => handleOpenEditModal(part)}
                            className="p-1 hover:bg-muted text-muted-foreground hover:text-foreground rounded-md border border-transparent hover:border-border transition-all"
                            title="Editar peça"
                          >
                            <Edit2 className="size-3.5" />
                          </Button>
                          <Button
                            onClick={() => handleDeletePartClick(part.id)}
                            className="p-1 hover:bg-red-500/10 text-muted-foreground hover:text-red-500 rounded-md border border-transparent hover:border-red-500/20 transition-all"
                            title="Excluir peça"
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>

                    {/* Linha Expandida de Preços Customizados de Peças por Carro */}
                    {isExpanded && (
                      <tr>
                        <td colSpan={7} className="bg-muted/20 border-b border-dashed border-border/60 px-6 py-4">
                          <motion.div
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={springConfig}
                            className="space-y-4"
                          >
                            {/* Especificações físicas adicionais */}
                            <div className="bg-card border border-border/40 rounded-xl p-3 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                              <div>
                                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">Dimensões</span>
                                <span className="font-semibold text-foreground">{part.dimension || "--"}</span>
                              </div>
                              <div>
                                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">Tamanho</span>
                                <span className="font-semibold text-foreground">{part.size || "--"}</span>
                              </div>
                              <div>
                                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">Peso</span>
                                <span className="font-semibold text-foreground">{part.weight || "--"}</span>
                              </div>
                              <div>
                                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">Local no Estoque</span>
                                <span className="font-semibold text-foreground">{part.location || "--"}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 text-foreground font-semibold text-[11px]">
                              <Sparkles className="size-3.5 text-emerald-500" />
                              <h3>Preços Específicos por Carro para: <span className="underline">{part.name}</span></h3>
                            </div>

                            {/* Grid de overrides de preços */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                              {part.overrides.length === 0 ? (
                                <p className="text-[10px] text-muted-foreground font-medium col-span-full">
                                  Esta peça é vendida pelo valor base em todos os carros compatíveis. Defina um valor diferente abaixo.
                                </p>
                              ) : (
                                part.overrides.map(override => (
                                  <div
                                    key={override.id}
                                    className="bg-card border border-border/50 rounded-lg p-2 flex items-center justify-between text-xs"
                                  >
                                    <div className="flex flex-col">
                                      <span className="font-semibold text-foreground text-[11px]">{override.carName}</span>
                                      <span className="text-[10px] text-emerald-500 font-bold">{formatCurrency(override.price)}</span>
                                    </div>
                                    <Button
                                      onClick={() => handleDeleteOverride(override.id)}
                                      disabled={actionLoading}
                                      className="p-1 hover:bg-red-500/10 text-muted-foreground hover:text-red-500 rounded-md transition-colors"
                                      title="Remover preço diferenciado"
                                    >
                                      <Trash2 className="size-3" />
                                    </Button>
                                  </div>
                                ))
                              )}
                            </div>

                            {/* Form para adicionar override */}
                            <div className="flex flex-wrap gap-2 items-end pt-2 border-t border-dashed border-border/40">
                              <div className="space-y-1">
                                <Label className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider">Veículo Compatível</Label>
                                <Input
                                  type="text"
                                  placeholder="Ex: Civic Touring"
                                  value={newCarName}
                                  onChange={(e) => setNewCarName(e.target.value)}
                                  className="text-[11px] rounded-md px-2.5 py-1 bg-card focus:outline-hidden focus:ring-1 focus:ring-emerald-500 font-medium text-foreground w-[160px]"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider">Preço Customizado (R$)</Label>
                                <Input
                                  type="text"
                                  placeholder="Ex: 220,00"
                                  value={newOverridePrice}
                                  onChange={(e) => setNewOverridePrice(formatCurrencyInput(e.target.value))}
                                  className="text-[11px] rounded-md px-2.5 py-1 bg-card focus:outline-hidden focus:ring-1 focus:ring-emerald-500 font-medium text-foreground w-[130px]"
                                />
                              </div>
                              <Button
                                type="button"
                                onClick={() => handleSaveOverride(part.id)}
                                disabled={actionLoading || !newCarName || !newOverridePrice}
                                className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[10px] rounded-md px-3 py-1.5 transition-colors border-0 disabled:bg-muted disabled:text-muted-foreground"
                              >
                                Adicionar Preço
                              </Button>
                            </div>
                          </motion.div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal de Cadastro/Edição de Peça */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={springConfig}
              className="bg-card w-full max-w-lg rounded-3xl shadow-xl border border-border overflow-hidden my-8"
            >
              <div className="px-5 py-4 border-b border-dashed border-border flex items-center justify-between">
                <h2 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                  <Package className="size-4 text-emerald-500" />
                  {editingPart ? "Editar Peça" : "Adicionar Peça"}
                </h2>
                <Button
                  onClick={() => setIsModalOpen(false)}
                  className="text-muted-foreground hover:text-foreground text-xs font-semibold"
                >
                  Fechar
                </Button>
              </div>

              <form onSubmit={handleSavePart} className="flex flex-col max-h-[80vh]">
                <ScrollArea className="flex-1 max-h-[60vh]">
                  <div className="p-5 space-y-3 pr-6">
                    {/* 1. Nome, Marca e SKU */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="space-y-1 md:col-span-2">
                        <Label className="text-[10px] font-medium text-muted-foreground">Nome da Peça</Label>
                        <Input
                          type="text"
                          required
                          placeholder="Ex: Pastilha de Freio Dianteira"
                          value={formName}
                          onChange={(e) => setFormName(e.target.value)}
                          className="w-full text-xs bg-muted/20 focus:bg-card focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium text-foreground placeholder-muted-foreground/50"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-medium text-muted-foreground">Marca</Label>
                        <Input
                          type="text"
                          placeholder="Ex: Bosch"
                          value={formBrand}
                          onChange={(e) => setFormBrand(e.target.value)}
                          className="w-full text-xs bg-muted/20 focus:bg-card focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium text-foreground placeholder-muted-foreground/50"
                        />
                      </div>
                    </div>

                    {/* 2. SKU, Qtd e Estoque Mínimo */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <Label className="text-[10px] font-medium text-muted-foreground">Código SKU</Label>
                        <Input
                          type="text"
                          placeholder="Ex: PST-BOS-123"
                          value={formSku}
                          onChange={(e) => setFormSku(e.target.value)}
                          className="w-full text-xs bg-muted/20 focus:bg-card focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium text-foreground placeholder-muted-foreground/50 font-mono"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-medium text-muted-foreground">Quantidade Atual</Label>
                        <Input
                          type="number"
                          required
                          min="0"
                          placeholder="Ex: 10"
                          value={formQty}
                          onChange={(e) => setFormQty(e.target.value)}
                          className="w-full text-xs bg-muted/20 focus:bg-card focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium text-foreground placeholder-muted-foreground/50"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-medium text-muted-foreground">Estoque Mínimo</Label>
                        <Input
                          type="number"
                          required
                          min="0"
                          placeholder="Ex: 2"
                          value={formMinQty}
                          onChange={(e) => setFormMinQty(e.target.value)}
                          className="w-full text-xs bg-muted/20 focus:bg-card focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium text-foreground placeholder-muted-foreground/50"
                        />
                      </div>
                    </div>

                    {/* 3. Preços e Localização */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <Label className="text-[10px] font-medium text-muted-foreground">Preço de Custo (R$)</Label>
                        <Input
                          type="text"
                          required
                          placeholder="Ex: 45,00"
                          value={formCostPrice}
                          onChange={(e) => setFormCostPrice(formatCurrencyInput(e.target.value))}
                          className="w-full text-xs bg-muted/20 focus:bg-card focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium text-foreground placeholder-muted-foreground/50"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-medium text-muted-foreground">Preço de Venda Base (R$)</Label>
                        <Input
                          type="text"
                          required
                          placeholder="Ex: 89,90"
                          value={formSalePrice}
                          onChange={(e) => setFormSalePrice(formatCurrencyInput(e.target.value))}
                          className="w-full text-xs bg-muted/20 focus:bg-card focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium text-foreground placeholder-muted-foreground/50"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-medium text-muted-foreground">Prateleira / Corredor</Label>
                        <Input
                          type="text"
                          placeholder="Ex: A-3"
                          value={formLocation}
                          onChange={(e) => setFormLocation(e.target.value)}
                          className="w-full text-xs bg-muted/20 focus:bg-card focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium text-foreground placeholder-muted-foreground/50"
                        />
                      </div>
                    </div>

                    {/* 4. Especificações físicas e carros compatíveis */}
                    <div className="border-t border-dashed border-border/80 pt-3 space-y-3">
                      <div className="flex items-center gap-1 text-[11px] font-semibold text-foreground">
                        <Info className="size-3.5 text-muted-foreground" />
                        <span>Dimensões e Especificações Técnicas</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <Label className="text-[10px] font-medium text-muted-foreground">Dimensões (LxAxP)</Label>
                          <Input
                            type="text"
                            placeholder="Ex: 15x8x4 cm"
                            value={formDimension}
                            onChange={(e) => setFormDimension(e.target.value)}
                            className="w-full text-xs bg-muted/20 focus:bg-card focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium text-foreground placeholder-muted-foreground/50"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] font-medium text-muted-foreground">Tamanho</Label>
                          <Input
                            type="text"
                            placeholder="Ex: Aro 16, M, Padrão"
                            value={formSize}
                            onChange={(e) => setFormSize(e.target.value)}
                            className="w-full text-xs bg-muted/20 focus:bg-card focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium text-foreground placeholder-muted-foreground/50"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] font-medium text-muted-foreground">Peso</Label>
                          <Input
                            type="text"
                            placeholder="Ex: 850g, 1.2kg"
                            value={formWeight}
                            onChange={(e) => setFormWeight(e.target.value)}
                            className="w-full text-xs bg-muted/20 focus:bg-card focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium text-foreground placeholder-muted-foreground/50"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-[10px] font-medium text-muted-foreground">Modelos Compatíveis (Texto descritivo)</Label>
                        <Input
                          type="text"
                          placeholder="Ex: Civic 2012 a 2016, City 2015+"
                          value={formCompatibleCars}
                          onChange={(e) => setFormCompatibleCars(e.target.value)}
                          className="w-full text-xs bg-muted/20 focus:bg-card focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium text-foreground placeholder-muted-foreground/50"
                        />
                      </div>
                    </div>
                  </div>
                </ScrollArea>

                <div className="p-5 pt-3.5 flex justify-end gap-2 border-t border-dashed border-border/80 bg-card">
                  <Button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="hover:bg-muted text-muted-foreground font-semibold text-xs rounded-full px-4 py-2 transition-colors border-0"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={actionLoading}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-full px-5 py-2 transition-colors border-0 flex items-center gap-1"
                  >
                    {actionLoading && <Loader2 className="size-3 animate-spin" />}
                    <span>Salvar Peça</span>
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        title="Excluir Peça"
        message="Deseja realmente excluir esta peça e todos os seus valores por carro do estoque?"
        confirmText="Excluir"
        cancelText="Cancelar"
        onConfirm={handleConfirmDeletePart}
        onCancel={() => {
          setDeleteConfirmOpen(false)
          setPartIdToDelete(null)
        }}
      />

    </div>
  )
}
