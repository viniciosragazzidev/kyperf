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
import { toast } from "sonner"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"

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

  // Confirm Dialog states
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [customerIdToDelete, setCustomerIdToDelete] = useState<string | null>(null)

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

  const handleSaveCustomerRetry = (payload: any, originalCustomers: Customer[], isUpdate: boolean) => {
    if (isUpdate) {
      setCustomers(prev => prev.map(c => c.id === payload.id ? {
        ...c,
        name: payload.name,
        phone: payload.phone,
        document: payload.document || null,
        email: payload.email || null,
        address: payload.address || null
      } : c))

      updateCustomerAction(payload).then(res => {
        if (res.success) {
          toast.success("Cliente atualizado com sucesso!")
        } else {
          setCustomers(originalCustomers)
          toast.error("Erro ao atualizar o cliente. Quer tentar novamente?", {
            action: {
              label: "Tentar Novamente",
              onClick: () => handleSaveCustomerRetry(payload, originalCustomers, isUpdate)
            }
          })
        }
      }).catch(() => {
        setCustomers(originalCustomers)
        toast.error("Erro ao atualizar. Quer tentar novamente?", {
          action: {
            label: "Tentar Novamente",
            onClick: () => handleSaveCustomerRetry(payload, originalCustomers, isUpdate)
          }
        })
      })
    } else {
      const tempId = `temp-${Date.now()}`
      const newCustomerObj: Customer = {
        id: tempId,
        name: payload.name,
        phone: payload.phone,
        document: payload.document || null,
        email: payload.email || null,
        address: payload.address || null,
        riskProfile: null,
        vehiclesCount: payload.initialVehicle ? 1 : 0,
        workOrdersCount: 0
      }
      setCustomers(prev => [newCustomerObj, ...prev])

      createCustomerAction(payload).then(res => {
        if (res.success && res.data) {
          const realCustomer = res.data as any
          setCustomers(prev => prev.map(c => c.id === tempId ? { ...c, id: realCustomer.id } : c))
          toast.success("Cliente cadastrado com sucesso!")
        } else {
          setCustomers(originalCustomers)
          toast.error("Erro ao cadastrar. Quer tentar novamente?", {
            action: {
              label: "Tentar Novamente",
              onClick: () => handleSaveCustomerRetry(payload, originalCustomers, isUpdate)
            }
          })
        }
      }).catch(() => {
        setCustomers(originalCustomers)
        toast.error("Erro ao cadastrar. Quer tentar novamente?", {
          action: {
            label: "Tentar Novamente",
            onClick: () => handleSaveCustomerRetry(payload, originalCustomers, isUpdate)
          }
        })
      })
    }
  }

  // Envio do formulário (Criar / Editar)
  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formName || !formPhone) return

    const originalCustomers = [...customers]
    const rawPhone = formPhone.replace(/\D/g, "")
    const rawDocument = formDocument.replace(/\D/g, "")

    const inputPayload = {
      name: formName,
      phone: rawPhone,
      document: rawDocument || undefined,
      email: formEmail || undefined,
      address: formAddress || undefined,
    }

    if (editingCustomer) {
      const currentEditingId = editingCustomer.id
      const updatePayload = { ...inputPayload, id: currentEditingId }

      // Optimistic update
      setCustomers(prev => prev.map(c => c.id === currentEditingId ? {
        ...c,
        name: updatePayload.name,
        phone: updatePayload.phone,
        document: updatePayload.document || null,
        email: updatePayload.email || null,
        address: updatePayload.address || null
      } : c))
      setIsModalOpen(false)

      updateCustomerAction(updatePayload as any).then(res => {
        if (res.success) {
          toast.success("Dados do cliente atualizados!")
        } else {
          setCustomers(originalCustomers)
          toast.error("Erro ao salvar alterações no cliente. Quer tentar novamente?", {
            action: {
              label: "Tentar Novamente",
              onClick: () => handleSaveCustomerRetry(updatePayload, originalCustomers, true)
            }
          })
        }
      }).catch(() => {
        setCustomers(originalCustomers)
        toast.error("Erro de conexão ao salvar cliente. Quer tentar novamente?", {
          action: {
            label: "Tentar Novamente",
            onClick: () => handleSaveCustomerRetry(updatePayload, originalCustomers, true)
          }
        })
      })
    } else {
      const createPayload = {
        ...inputPayload,
        initialVehicle: addInitialVehicle ? {
          plate: vPlate.toUpperCase().replace(/[^A-Z0-9]/g, ""),
          brand: vBrand,
          model: vModel,
          year: vYear ? parseInt(vYear, 10) : undefined,
          engine: vEngine || undefined,
          mileage: vMileage ? parseInt(vMileage, 10) : undefined
        } : undefined
      }

      const tempId = `temp-${Date.now()}`
      const newCustomerObj: Customer = {
        id: tempId,
        name: createPayload.name,
        phone: createPayload.phone,
        document: createPayload.document || null,
        email: createPayload.email || null,
        address: createPayload.address || null,
        riskProfile: null,
        vehiclesCount: createPayload.initialVehicle ? 1 : 0,
        workOrdersCount: 0
      }

      // Optimistic create
      setCustomers(prev => [newCustomerObj, ...prev])
      setIsModalOpen(false)

      createCustomerAction(createPayload as any).then(res => {
        if (res.success && res.data) {
          const realCustomer = res.data as any
          setCustomers(prev => prev.map(c => c.id === tempId ? { ...c, id: realCustomer.id, vehicles: realCustomer.vehicles || [] } : c))
          toast.success("Novo cliente cadastrado com sucesso!")
        } else {
          setCustomers(originalCustomers)
          toast.error("Erro ao cadastrar o cliente. Quer tentar novamente?", {
            action: {
              label: "Tentar Novamente",
              onClick: () => handleSaveCustomerRetry(createPayload, originalCustomers, false)
            }
          })
        }
      }).catch(() => {
        setCustomers(originalCustomers)
        toast.error("Erro de conexão ao cadastrar o cliente. Quer tentar novamente?", {
          action: {
            label: "Tentar Novamente",
            onClick: () => handleSaveCustomerRetry(createPayload, originalCustomers, false)
          }
        })
      })
    }
  }

  // Deletar cliente
  const handleDeleteCustomerClick = (id: string) => {
    setCustomerIdToDelete(id)
    setDeleteConfirmOpen(true)
  }

  const handleConfirmDeleteCustomerRetry = (customerId: string, originalCustomers: any[]) => {
    setCustomers(prev => prev.filter(c => c.id !== customerId))
    deleteCustomerAction(customerId).then(res => {
      if (res.success) {
        toast.success("Cliente removido com sucesso!")
      } else {
        setCustomers(originalCustomers)
        toast.error("Erro ao deletar o cliente. Quer tentar novamente?", {
          action: {
            label: "Tentar Novamente",
            onClick: () => handleConfirmDeleteCustomerRetry(customerId, originalCustomers)
          }
        })
      }
    }).catch(() => {
      setCustomers(originalCustomers)
      toast.error("Erro de conexão. Quer tentar novamente?", {
        action: {
          label: "Tentar Novamente",
          onClick: () => handleConfirmDeleteCustomerRetry(customerId, originalCustomers)
        }
      })
    })
  }

  const handleConfirmDeleteCustomer = async () => {
    if (!customerIdToDelete) return
    const originalCustomers = [...customers]
    const currentCustomerId = customerIdToDelete
    setDeleteConfirmOpen(false)
    setCustomerIdToDelete(null)

    // Optimistically remove
    setCustomers(prev => prev.filter(c => c.id !== currentCustomerId))

    deleteCustomerAction(currentCustomerId).then(res => {
      if (res.success) {
        toast.success("Cliente removido com sucesso!")
      } else {
        setCustomers(originalCustomers)
        toast.error("Erro ao deletar o cliente. Quer tentar novamente?", {
          action: {
            label: "Tentar Novamente",
            onClick: () => handleConfirmDeleteCustomerRetry(currentCustomerId, originalCustomers)
          }
        })
      }
    }).catch(() => {
      setCustomers(originalCustomers)
      toast.error("Erro de conexão ao deletar o cliente. Quer tentar novamente?", {
        action: {
          label: "Tentar Novamente",
          onClick: () => handleConfirmDeleteCustomerRetry(currentCustomerId, originalCustomers)
        }
      })
    })
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
          <p className="text-xs text-muted-foreground mt-0.5 geist-mono pl-10">
            Cadastre os proprietários dos veículos, veja suas ordens de serviço e associe veículos de forma simplificada.
          </p>
        </div>

        <Button
          onClick={handleOpenCreateModal}
          className="bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs rounded-none px-5 py-2.5 h-auto transition-all shadow-md active:scale-95 flex items-center gap-1.5 cursor-pointer shrink-0"
        >
          <Plus className="size-4" />
          <span>Cadastrar Cliente</span>
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
          <AlertCircle className="size-3.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Busca */}
      <div className="mb-4 max-w-md relative flex items-center">
        <Search className="absolute left-3 size-4 text-muted-foreground z-10" />
        <Input
          type="text"
          placeholder="Buscar por nome, telefone ou documento..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full h-10 text-xs pl-9 pr-3 bg-card focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium text-foreground placeholder-muted-foreground/50"
        />
      </div>

      {/* Card da Tabela de Clientes (Jeet Style) */}
      <div className="bg-card rounded-3xl shadow-[0_10px_50px_-12px_rgba(0,0,0,0.05)] border border-border/50 overflow-hidden text-card-foreground">
        {isLoading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3, 4].map((idx) => (
              <div key={idx} className="flex items-center justify-between py-3 border-b border-border/40 last:border-0">
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-1/4 rounded-md animate-pulse" />
                  <Skeleton className="h-3 w-1/3 rounded-md animate-pulse" />
                </div>
                <div className="flex gap-4">
                  <Skeleton className="h-5 w-20 rounded-md animate-pulse" />
                  <Skeleton className="h-8 w-16 rounded-md animate-pulse" />
                </div>
              </div>
            ))}
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
                    <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-none border border-emerald-500/20 text-[10px] font-bold geist-mono">
                      <Car className="size-3" />
                      <span>{cust.vehiclesCount}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center gap-1 bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded-none border border-blue-500/20 text-[10px] font-bold geist-mono">
                      <FileText className="size-3" />
                      <span>{cust.workOrdersCount}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <Button
                        onClick={() => handleOpenEditModal(cust)}
                        variant="ghost"
                        className="p-1 hover:bg-muted text-muted-foreground hover:text-foreground rounded-md border border-transparent hover:border-border transition-all"
                        title="Editar cliente"
                      >
                        <Edit2 className="size-3.5" />
                      </Button>
                      <Button
                        onClick={() => handleDeleteCustomerClick(cust.id)}
                        variant="ghost"
                        className="p-1 hover:bg-red-500/10 text-muted-foreground hover:text-red-555 rounded-md border border-transparent hover:border-red-500/20 transition-all"
                        title="Excluir cliente"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
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
                <Button
                  onClick={() => setIsModalOpen(false)}
                  variant="ghost"
                  className="text-muted-foreground hover:text-foreground text-xs font-semibold"
                >
                  Fechar
                </Button>
              </div>

              <form onSubmit={handleSaveCustomer} className="flex flex-col max-h-[85vh] overflow-hidden">
                <ScrollArea className="flex-grow min-h-0 max-h-[60vh] w-full overflow-hidden">
                  <div className="p-5 space-y-3.5 pr-6 text-xs">
                    {/* 1. Dados Pessoais do Cliente */}
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <Label className="text-[10px] font-medium text-muted-foreground">Nome Completo</Label>
                        <Input
                          type="text"
                          required
                          placeholder="Ex: João da Silva"
                          value={formName}
                          onChange={(e) => setFormName(e.target.value)}
                          className="w-full text-xs bg-muted/20 focus:bg-card focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium text-foreground placeholder-muted-foreground/50"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-[10px] font-medium text-muted-foreground">CPF ou CNPJ</Label>
                          <Input
                            type="text"
                            placeholder="Ex: 123.456.789-00"
                            value={formDocument}
                            onChange={(e) => setFormDocument(formatDocument(e.target.value))}
                            className="w-full text-xs bg-muted/20 focus:bg-card focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium text-foreground placeholder-muted-foreground/50"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] font-medium text-muted-foreground">Celular / Telefone</Label>
                          <Input
                            type="text"
                            required
                            placeholder="Ex: (21) 99999-9999"
                            value={formPhone}
                            onChange={(e) => setFormPhone(formatPhone(e.target.value))}
                            className="w-full text-xs bg-muted/20 focus:bg-card focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium text-foreground placeholder-muted-foreground/50"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-[10px] font-medium text-muted-foreground">E-mail (Opcional)</Label>
                        <Input
                          type="email"
                          placeholder="Ex: joao@gmail.com"
                          value={formEmail}
                          onChange={(e) => setFormEmail(e.target.value)}
                          className="w-full text-xs bg-muted/20 focus:bg-card focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium text-foreground placeholder-muted-foreground/50"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-[10px] font-medium text-muted-foreground">Endereço (Opcional)</Label>
                        <Input
                          type="text"
                          placeholder="Ex: Rua das Flores, 123 - Centro"
                          value={formAddress}
                          onChange={(e) => setFormAddress(e.target.value)}
                          className="w-full text-xs bg-muted/20 focus:bg-card focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium text-foreground placeholder-muted-foreground/50"
                        />
                      </div>
                    </div>

                    {/* 2. Seção de Veículo Opcional (apenas na criação) */}
                    {!editingCustomer && (
                      <div className="border-t border-dashed border-border pt-3.5 space-y-3">
                        <Label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={addInitialVehicle}
                            onChange={(e) => setAddInitialVehicle(e.target.checked)}
                            className="rounded-md border-border text-emerald-500 focus:ring-emerald-500/30 size-4"
                          />
                          <span className="text-[11px] font-bold text-foreground">Deseja cadastrar o primeiro veículo do cliente agora?</span>
                        </Label>

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
                                <Label className="text-[10px] font-medium text-muted-foreground">Placa</Label>
                                <Input
                                  type="text"
                                  required={addInitialVehicle}
                                  placeholder="Ex: ABC-1234"
                                  value={vPlate}
                                  onChange={(e) => setVPlate(formatPlate(e.target.value))}
                                  className="w-full text-xs bg-card focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-bold text-foreground placeholder-muted-foreground/50 font-mono"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-[10px] font-medium text-muted-foreground">Motor (Opcional)</Label>
                                <Input
                                  type="text"
                                  placeholder="Ex: 1.6 Flex, 2.0 Turbo"
                                  value={vEngine}
                                  onChange={(e) => setVEngine(e.target.value)}
                                  className="w-full text-xs bg-card focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium text-foreground placeholder-muted-foreground/50"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                              <div className="space-y-1">
                                <Label className="text-[10px] font-medium text-muted-foreground">Marca</Label>
                                <Input
                                  type="text"
                                  required={addInitialVehicle}
                                  placeholder="Ex: Honda"
                                  value={vBrand}
                                  onChange={(e) => setVBrand(e.target.value)}
                                  className="w-full text-xs bg-card focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium text-foreground placeholder-muted-foreground/50"
                                />
                              </div>
                              <div className="space-y-1 col-span-1 sm:col-span-2">
                                <Label className="text-[10px] font-medium text-muted-foreground">Modelo</Label>
                                <Input
                                  type="text"
                                  required={addInitialVehicle}
                                  placeholder="Ex: Civic Sedan EXS"
                                  value={vModel}
                                  onChange={(e) => setVModel(e.target.value)}
                                  className="w-full text-xs bg-card focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium text-foreground placeholder-muted-foreground/50"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 text-xs">
                              <div className="space-y-1">
                                <Label className="text-[10px] font-medium text-muted-foreground">Ano de Fabricação (Opcional)</Label>
                                <Input
                                  type="number"
                                  placeholder="Ex: 2018"
                                  value={vYear}
                                  onChange={(e) => setVYear(e.target.value)}
                                  className="w-full text-xs bg-card focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium text-foreground placeholder-muted-foreground/50"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-[10px] font-medium text-muted-foreground">Quilometragem (Km - Opcional)</Label>
                                <Input
                                  type="number"
                                  placeholder="Ex: 85000"
                                  value={vMileage}
                                  onChange={(e) => setVMileage(e.target.value)}
                                  className="w-full text-xs bg-card focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium text-foreground placeholder-muted-foreground/50"
                                />
                              </div>
                            </div>

                          </motion.div>
                        )}
                      </div>
                    )}
                    <div className="h-6" />
                  </div>
                </ScrollArea>

                <div className="p-5 pt-3.5 flex justify-end gap-2 border-t border-dashed border-border bg-card">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsModalOpen(false)}
                    className="font-semibold text-xs rounded-none px-4 py-2 transition-colors"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={actionLoading}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-none px-5 py-2 transition-colors border border-emerald-600/10 flex items-center gap-1"
                  >
                    {actionLoading && <Loader2 className="size-3 animate-spin" />}
                    <span>Salvar Cliente</span>
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        title="Excluir Cliente"
        message="Deseja realmente excluir este cliente e todos os seus veículos associados?"
        confirmText="Excluir"
        cancelText="Cancelar"
        onConfirm={handleConfirmDeleteCustomer}
        onCancel={() => {
          setDeleteConfirmOpen(false)
          setCustomerIdToDelete(null)
        }}
      />

    </div>
  )
}
