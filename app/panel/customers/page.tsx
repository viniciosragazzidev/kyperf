"use client"

import React, { useState, useEffect, Fragment } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Users, 
  Plus, 
  Search, 
  Trash2, 
  Edit2, 
  Loader2, 
  Sparkles, 
  Car, 
  Check,
  AlertCircle,
  FileText
} from "lucide-react"
import { 
  getCustomersAction, 
  createCustomerAction, 
  updateCustomerAction, 
  deleteCustomerAction 
} from "@/lib/actions/customers-actions"
import { ScrollArea } from "@/components/ui/scroll-area"

const springConfig = { type: "spring" as const, stiffness: 300, damping: 28 }

interface Customer {
  id: string
  name: string
  phone: string
  document: string | null
  email: string | null
  address: string | null
  riskProfile: string | null
  vehiclesCount: number
  workOrdersCount: number
}

// Helpers para formatação de máscaras
const formatPhone = (value: string) => {
  const clean = value.replace(/\D/g, "")
  if (clean.length > 10) {
    return `(${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7, 11)}`
  } else if (clean.length > 6) {
    return `(${clean.slice(0, 2)}) ${clean.slice(2, 6)}-${clean.slice(6, 10)}`
  } else if (clean.length > 2) {
    return `(${clean.slice(0, 2)}) ${clean.slice(2)}`
  } else if (clean.length > 0) {
    return `(${clean}`
  }
  return clean
}

const formatDocument = (value: string) => {
  const clean = value.replace(/\D/g, "")
  if (clean.length > 11) {
    // CNPJ
    return `${clean.slice(0, 2)}.${clean.slice(2, 5)}.${clean.slice(5, 8)}/${clean.slice(8, 12)}-${clean.slice(12, 14)}`
  } else if (clean.length > 9) {
    // CPF
    return `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6, 9)}-${clean.slice(9, 11)}`
  } else if (clean.length > 6) {
    return `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6)}`
  } else if (clean.length > 3) {
    return `${clean.slice(0, 3)}.${clean.slice(3)}`
  }
  return clean
}

const formatPlate = (value: string) => {
  const clean = value.toUpperCase().replace(/[^A-Z0-9]/g, "")
  if (clean.length > 7) {
    return clean.slice(0, 7)
  }
  if (clean.length === 7) {
    const isMercosul = isNaN(parseInt(clean[3], 10)) === false && isNaN(parseInt(clean[4], 10)) === true;
    if (isMercosul) {
      return clean;
    } else {
      return `${clean.slice(0, 3)}-${clean.slice(3)}`;
    }
  }
  return clean
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [successMessage, setSuccessMessage] = useState("")

  // Estado para o Modal de Criação / Edição do Cliente
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)

  // Estados do formulário do cliente
  const [formName, setFormName] = useState("")
  const [formPhone, setFormPhone] = useState("")
  const [formDocument, setFormDocument] = useState("")
  const [formEmail, setFormEmail] = useState("")
  const [formAddress, setFormAddress] = useState("")

  // Estados do formulário opcional de veículo inicial
  const [addInitialVehicle, setAddInitialVehicle] = useState(false)
  const [vPlate, setVPlate] = useState("")
  const [vBrand, setVBrand] = useState("")
  const [vModel, setVModel] = useState("")
  const [vYear, setVYear] = useState("")
  const [vEngine, setVEngine] = useState("")
  const [vMileage, setVMileage] = useState("")

  // Carrega clientes inicialmente
  const loadCustomers = async () => {
    setIsLoading(true)
    const res = await getCustomersAction()
    setIsLoading(false)
    if (res.success && res.data) {
      setCustomers(res.data as Customer[])
    } else {
      setErrorMessage(res.error || "Não foi possível carregar o cadastro de clientes.")
    }
  }

  useEffect(() => {
    loadCustomers()
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
    setEditingCustomer(null)
    setFormName("")
    setFormPhone("")
    setFormDocument("")
    setFormEmail("")
    setFormAddress("")
    setAddInitialVehicle(false)
    setVPlate("")
    setVBrand("")
    setVModel("")
    setVYear("")
    setVEngine("")
    setVMileage("")
    setIsModalOpen(true)
  }

  // Abre modal de edição
  const handleOpenEditModal = (cust: Customer) => {
    setEditingCustomer(cust)
    setFormName(cust.name)
    setFormPhone(formatPhone(cust.phone))
    setFormDocument(cust.document ? formatDocument(cust.document) : "")
    setFormEmail(cust.email || "")
    setFormAddress(cust.address || "")
    setAddInitialVehicle(false) // Desativa checkbox de veículo na edição
    setIsModalOpen(true)
  }

  // Envio do formulário (Criar / Editar)
  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formName || !formPhone) return

    setActionLoading(true)
    const rawPhone = formPhone.replace(/\D/g, "")
    const rawDocument = formDocument.replace(/\D/g, "")

    let res
    if (editingCustomer) {
      res = await updateCustomerAction({
        id: editingCustomer.id,
        name: formName,
        phone: rawPhone,
        document: rawDocument || undefined,
        email: formEmail || undefined,
        address: formAddress || undefined
      })
    } else {
      res = await createCustomerAction({
        name: formName,
        phone: rawPhone,
        document: rawDocument || undefined,
        email: formEmail || undefined,
        address: formAddress || undefined,
        initialVehicle: addInitialVehicle ? {
          plate: vPlate,
          brand: vBrand,
          model: vModel,
          year: vYear || undefined,
          engine: vEngine || undefined,
          mileage: vMileage || undefined
        } : undefined
      })
    }
    setActionLoading(false)

    if (res.success) {
      setSuccessMessage(editingCustomer ? "Dados do cliente atualizados!" : "Novo cliente cadastrado com sucesso!")
      setIsModalOpen(false)
      loadCustomers()
    } else {
      setErrorMessage(res.error || "Não foi possível salvar o cliente.")
    }
  }

  // Deletar cliente
  const handleDeleteCustomer = async (id: string) => {
    if (!confirm("Deseja realmente excluir este cliente e todos os seus veículos associados?")) return

    setActionLoading(true)
    const res = await deleteCustomerAction(id)
    setActionLoading(false)

    if (res.success) {
      setSuccessMessage("Cliente removido com sucesso!")
      loadCustomers()
    } else {
      setErrorMessage(res.error || "Erro ao deletar o cliente.")
    }
  }

  // Filtra clientes
  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.phone && c.phone.includes(searchTerm)) ||
    (c.document && c.document.includes(searchTerm))
  )

  return (
    <div className="flex-1 p-4 md:p-6 bg-[#FAF9F6] dark:bg-zinc-950 min-h-screen font-sans">
      
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <span className="bg-emerald-500/10 text-emerald-500 p-1.5 rounded-lg border border-emerald-500/20">
              <Users className="size-4.5" />
            </span>
            Gestão de Clientes
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Cadastre os proprietários dos veículos, veja suas ordens de serviço e associe veículos de forma simplificada.
          </p>
        </div>
        
        <button
          onClick={handleOpenCreateModal}
          className="flex items-center gap-1.5 bg-foreground hover:bg-foreground/90 text-background font-bold text-xs rounded-full px-4 py-2 transition-all shadow-sm active:scale-95 shrink-0"
        >
          <Plus className="size-3.5" />
          <span>Cadastrar Cliente</span>
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

      {/* Busca */}
      <div className="mb-4 max-w-md relative">
        <span className="absolute left-2.5 top-2.5 text-muted-foreground">
          <Search className="size-3.5" />
        </span>
        <input
          type="text"
          placeholder="Buscar por nome, telefone ou documento..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full text-xs border border-border rounded-lg pl-8 pr-3 py-2 bg-card focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium text-foreground placeholder-muted-foreground/50"
        />
      </div>

      {/* Card da Tabela de Clientes (Jeet Style) */}
      <div className="bg-card rounded-3xl shadow-[0_10px_50px_-12px_rgba(0,0,0,0.05)] border border-border/50 overflow-hidden text-card-foreground">
        {isLoading ? (
          <div className="p-16 flex flex-col items-center justify-center gap-2">
            <Loader2 className="size-6 text-emerald-500 animate-spin" />
            <span className="text-xs text-muted-foreground font-medium">Carregando lista de clientes...</span>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="p-16 text-center text-xs text-muted-foreground">
            Nenhum cliente cadastrado no momento.
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/50 border-b border-border/50 text-[9px] uppercase font-bold text-muted-foreground tracking-wider">
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">CPF / CNPJ</th>
                <th className="px-4 py-3">Telefone</th>
                <th className="px-4 py-3">E-mail</th>
                <th className="px-4 py-3 text-center">Veículos</th>
                <th className="px-4 py-3 text-center">O.S.'s</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((cust) => (
                <tr key={cust.id} className="border-b border-dashed border-border/60 hover:bg-muted/30 transition-colors text-xs font-semibold text-foreground">
                  <td className="px-4 py-3">
                    <div className="font-bold">{cust.name}</div>
                    {cust.address && (
                      <div className="text-[9px] text-muted-foreground font-normal mt-0.5 max-w-xs truncate" title={cust.address}>
                        {cust.address}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground font-mono font-medium">{cust.document ? formatDocument(cust.document) : "--"}</td>
                  <td className="px-4 py-3 text-muted-foreground font-medium">{formatPhone(cust.phone)}</td>
                  <td className="px-4 py-3 text-muted-foreground font-normal">{cust.email || "--"}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full border border-emerald-500/20 text-[10px] font-bold">
                      <Car className="size-3" />
                      <span>{cust.vehiclesCount}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center gap-1 bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded-full border border-blue-500/20 text-[10px] font-bold">
                      <FileText className="size-3" />
                      <span>{cust.workOrdersCount}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenEditModal(cust)}
                        className="p-1 hover:bg-muted text-muted-foreground hover:text-foreground rounded-md border border-transparent hover:border-border transition-all"
                        title="Editar cliente"
                      >
                        <Edit2 className="size-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteCustomer(cust.id)}
                        className="p-1 hover:bg-red-500/10 text-muted-foreground hover:text-red-500 rounded-md border border-transparent hover:border-red-500/20 transition-all"
                        title="Excluir cliente"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal de Cadastro/Edição de Cliente */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={springConfig}
              className="bg-card w-full max-w-md rounded-3xl shadow-xl border border-border overflow-hidden my-8"
            >
              <div className="px-5 py-4 border-b border-dashed border-border flex items-center justify-between">
                <h2 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                  <Users className="size-4 text-emerald-500" />
                  {editingCustomer ? "Editar Cliente" : "Cadastrar Cliente"}
                </h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-muted-foreground hover:text-foreground text-xs font-semibold"
                >
                  Fechar
                </button>
              </div>

              <form onSubmit={handleSaveCustomer} className="flex flex-col max-h-[85vh]">
                <ScrollArea className="flex-1 max-h-[65vh]">
                  <div className="p-5 space-y-3.5 pr-6">
                    {/* 1. Dados Pessoais do Cliente */}
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-medium text-muted-foreground">Nome Completo</label>
                        <input
                          type="text"
                          required
                          placeholder="Ex: João da Silva"
                          value={formName}
                          onChange={(e) => setFormName(e.target.value)}
                          className="w-full text-xs border border-border rounded-lg px-2.5 py-1.5 bg-muted/20 focus:bg-card focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium text-foreground placeholder-muted-foreground/50"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-medium text-muted-foreground">CPF ou CNPJ</label>
                          <input
                            type="text"
                            placeholder="Ex: 123.456.789-00"
                            value={formDocument}
                            onChange={(e) => setFormDocument(formatDocument(e.target.value))}
                            className="w-full text-xs border border-border rounded-lg px-2.5 py-1.5 bg-muted/20 focus:bg-card focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium text-foreground placeholder-muted-foreground/50"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-medium text-muted-foreground">Celular / Telefone</label>
                          <input
                            type="text"
                            required
                            placeholder="Ex: (21) 99999-9999"
                            value={formPhone}
                            onChange={(e) => setFormPhone(formatPhone(e.target.value))}
                            className="w-full text-xs border border-border rounded-lg px-2.5 py-1.5 bg-muted/20 focus:bg-card focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium text-foreground placeholder-muted-foreground/50"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-medium text-muted-foreground">E-mail (Opcional)</label>
                        <input
                          type="email"
                          placeholder="Ex: joao@gmail.com"
                          value={formEmail}
                          onChange={(e) => setFormEmail(e.target.value)}
                          className="w-full text-xs border border-border rounded-lg px-2.5 py-1.5 bg-muted/20 focus:bg-card focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium text-foreground placeholder-muted-foreground/50"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-medium text-muted-foreground">Endereço (Opcional)</label>
                        <input
                          type="text"
                          placeholder="Ex: Rua das Flores, 123 - Centro"
                          value={formAddress}
                          onChange={(e) => setFormAddress(e.target.value)}
                          className="w-full text-xs border border-border rounded-lg px-2.5 py-1.5 bg-muted/20 focus:bg-card focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium text-foreground placeholder-muted-foreground/50"
                        />
                      </div>
                    </div>

                    {/* 2. Seção de Veículo Opcional (apenas na criação) */}
                    {!editingCustomer && (
                      <div className="border-t border-dashed border-border pt-3.5 space-y-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={addInitialVehicle}
                            onChange={(e) => setAddInitialVehicle(e.target.checked)}
                            className="rounded-md border-border text-emerald-500 focus:ring-emerald-500/30 size-4"
                          />
                          <span className="text-[11px] font-bold text-foreground">Deseja cadastrar o primeiro veículo do cliente agora?</span>
                        </label>

                        {addInitialVehicle && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={springConfig}
                            className="space-y-3 bg-muted/20 border border-border/50 rounded-xl p-3.5"
                          >
                            <div className="flex items-center gap-1.5 text-foreground font-semibold text-[10px] uppercase tracking-wider text-emerald-500">
                              <Car className="size-3.5" />
                              <span>Veículo Inicial</span>
                            </div>

                            <div className="grid grid-cols-2 gap-3 text-xs">
                              <div className="space-y-1">
                                <label className="text-[10px] font-medium text-muted-foreground">Placa</label>
                                <input
                                  type="text"
                                  required={addInitialVehicle}
                                  placeholder="Ex: ABC-1234"
                                  value={vPlate}
                                  onChange={(e) => setVPlate(formatPlate(e.target.value))}
                                  className="w-full text-xs border border-border rounded-lg px-2.5 py-1.5 bg-card focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-bold text-foreground placeholder-muted-foreground/50 font-mono"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-medium text-muted-foreground">Motor (Opcional)</label>
                                <input
                                  type="text"
                                  placeholder="Ex: 1.6 Flex, 2.0 Turbo"
                                  value={vEngine}
                                  onChange={(e) => setVEngine(e.target.value)}
                                  className="w-full text-xs border border-border rounded-lg px-2.5 py-1.5 bg-card focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium text-foreground placeholder-muted-foreground/50"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                              <div className="space-y-1">
                                <label className="text-[10px] font-medium text-muted-foreground">Marca</label>
                                <input
                                  type="text"
                                  required={addInitialVehicle}
                                  placeholder="Ex: Honda"
                                  value={vBrand}
                                  onChange={(e) => setVBrand(e.target.value)}
                                  className="w-full text-xs border border-border rounded-lg px-2.5 py-1.5 bg-card focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium text-foreground placeholder-muted-foreground/50"
                                />
                              </div>
                              <div className="space-y-1 col-span-1 sm:col-span-2">
                                <label className="text-[10px] font-medium text-muted-foreground">Modelo</label>
                                <input
                                  type="text"
                                  required={addInitialVehicle}
                                  placeholder="Ex: Civic Sedan EXS"
                                  value={vModel}
                                  onChange={(e) => setVModel(e.target.value)}
                                  className="w-full text-xs border border-border rounded-lg px-2.5 py-1.5 bg-card focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium text-foreground placeholder-muted-foreground/50"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 text-xs">
                              <div className="space-y-1">
                                <label className="text-[10px] font-medium text-muted-foreground">Ano de Fabricação (Opcional)</label>
                                <input
                                  type="number"
                                  placeholder="Ex: 2018"
                                  value={vYear}
                                  onChange={(e) => setVYear(e.target.value)}
                                  className="w-full text-xs border border-border rounded-lg px-2.5 py-1.5 bg-card focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium text-foreground placeholder-muted-foreground/50"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-medium text-muted-foreground">Quilometragem (Km - Opcional)</label>
                                <input
                                  type="number"
                                  placeholder="Ex: 85000"
                                  value={vMileage}
                                  onChange={(e) => setVMileage(e.target.value)}
                                  className="w-full text-xs border border-border rounded-lg px-2.5 py-1.5 bg-card focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium text-foreground placeholder-muted-foreground/50"
                                />
                              </div>
                            </div>

                          </motion.div>
                        )}
                      </div>
                    )}
                  </div>
                </ScrollArea>

                <div className="p-5 pt-3.5 flex justify-end gap-2 border-t border-dashed border-border bg-card">
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
                    <span>Salvar Cliente</span>
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
