"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Building2, 
  Search, 
  Plus, 
  Trash2, 
  Edit, 
  X, 
  Phone, 
  Mail, 
  MapPin, 
  FileText 
} from "lucide-react"
import { cn } from "@/lib/utils"

// Import Server Actions
import { 
  getSuppliersAction, 
  createSupplierAction, 
  updateSupplierAction, 
  deleteSupplierAction 
} from "@/lib/actions/suppliers-actions"

interface Supplier {
  id: string
  name: string
  phone: string | null
  email: string | null
  cnpj: string | null
  address: string | null
  createdAt: Date | string
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  // Form states (Create / Edit Modal)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [cnpj, setCnpj] = useState("")
  const [address, setAddress] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await getSuppliersAction()
      if (res.success && res.data) {
        setSuppliers(res.data as unknown as Supplier[])
      }
    } catch (err) {
      console.error("Erro ao carregar fornecedores:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const openCreateModal = () => {
    setEditingId(null)
    setName("")
    setPhone("")
    setEmail("")
    setCnpj("")
    setAddress("")
    setModalOpen(true)
  }

  const openEditModal = (supplier: Supplier) => {
    setEditingId(supplier.id)
    setName(supplier.name)
    setPhone(supplier.phone || "")
    setEmail(supplier.email || "")
    setCnpj(supplier.cnpj || "")
    setAddress(supplier.address || "")
    setModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja deletar este fornecedor?")) return
    try {
      const res = await deleteSupplierAction(id)
      if (res.success) {
        setSuppliers(prev => prev.filter(s => s.id !== id))
      } else {
        alert("Erro ao deletar fornecedor: " + res.error)
      }
    } catch (err: any) {
      alert("Erro interno: " + err.message)
    }
  }

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name) {
      alert("O nome do fornecedor é obrigatório.")
      return
    }

    setSubmitting(true)
    try {
      const input = {
        name,
        phone: phone || undefined,
        email: email || undefined,
        cnpj: cnpj || undefined,
        address: address || undefined,
      }

      let res
      if (editingId) {
        res = await updateSupplierAction({ ...input, id: editingId })
      } else {
        res = await createSupplierAction(input)
      }

      if (res.success) {
        setModalOpen(false)
        loadData()
        alert(editingId ? "Fornecedor atualizado com sucesso!" : "Fornecedor cadastrado com sucesso!")
      } else {
        alert("Erro ao salvar: " + res.error)
      }
    } catch (err: any) {
      alert("Erro interno: " + err.message)
    } finally {
      setSubmitting(false)
    }
  }

  // Formatting helpers
  const formatCNPJ = (value: string) => {
    const clean = value.replace(/\D/g, "")
    if (clean.length === 14) {
      return `${clean.slice(0, 2)}.${clean.slice(2, 5)}.${clean.slice(5, 8)}/${clean.slice(8, 12)}-${clean.slice(12)}`
    }
    return value
  }

  const formatPhone = (value: string) => {
    const clean = value.replace(/\D/g, "")
    if (clean.length === 11) {
      return `(${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7)}`
    } else if (clean.length === 10) {
      return `(${clean.slice(0, 2)}) ${clean.slice(2, 6)}-${clean.slice(6)}`
    }
    return value
  }

  const filteredSuppliers = suppliers.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.cnpj && s.cnpj.includes(searchQuery)) ||
    (s.email && s.email.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  return (
    <div className="flex-1 p-4 md:p-6 bg-[#FAF9F6] dark:bg-zinc-950 min-h-screen font-sans space-y-6">
      
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <span className="bg-emerald-500/10 text-emerald-500 p-1.5 rounded-lg border border-emerald-500/20">
              <Building2 className="size-4.5" />
            </span>
            Gestão de Fornecedores
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Cadastro de parceiros comerciais e distribuidores de autopeças.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-1.5 bg-foreground hover:bg-foreground/90 text-background font-bold text-xs rounded-full px-4 py-2 transition-all shadow-sm active:scale-95 shrink-0"
        >
          <Plus className="size-3.5" />
          <span>Novo Fornecedor</span>
        </button>
      </div>

      {/* Main Panel */}
      <div className="bg-card rounded-3xl shadow-[0_10px_50px_-12px_rgba(0,0,0,0.05)] border border-border/50 overflow-hidden text-card-foreground p-5 space-y-4">
        
        {/* Search & Statistics */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
            <input 
              placeholder="BUSCAR FORNECEDOR OU CNPJ..."
              className="w-full text-xs border border-border rounded-lg pl-8 pr-3 py-1.5 bg-muted/20 focus:bg-card focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium text-foreground placeholder-muted-foreground/50 uppercase"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="text-[10px] text-muted-foreground uppercase font-bold">
            Total cadastrado: <span className="text-emerald-500">{suppliers.length}</span>
          </div>
        </div>

        {/* Suppliers List / Table */}
        {loading ? (
          <div className="text-center py-12 text-muted-foreground text-xs font-medium">
            Carregando parceiros...
          </div>
        ) : filteredSuppliers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-muted/50 border-b border-border/50 text-[9px] uppercase font-bold text-muted-foreground tracking-wider">
                  <th className="px-4 py-3">Razão Social / Nome</th>
                  <th className="px-4 py-3">CNPJ</th>
                  <th className="px-4 py-3">Contato</th>
                  <th className="px-4 py-3">Endereço</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredSuppliers.map(s => (
                  <tr key={s.id} className="border-b border-dashed border-border/60 hover:bg-muted/30 transition-colors text-xs font-semibold text-foreground">
                    <td className="px-4 py-3 uppercase font-bold">{s.name}</td>
                    <td className="px-4 py-3 text-muted-foreground font-mono font-medium">{s.cnpj ? formatCNPJ(s.cnpj) : "Isento"}</td>
                    <td className="px-4 py-3 space-y-1">
                      {s.phone && (
                        <div className="flex items-center gap-1 text-muted-foreground font-medium">
                          <Phone className="size-3 text-muted-foreground" />
                          <span>{formatPhone(s.phone)}</span>
                        </div>
                      )}
                      {s.email && (
                        <div className="flex items-center gap-1 text-muted-foreground font-medium">
                          <Mail className="size-3 text-muted-foreground" />
                          <span>{s.email}</span>
                        </div>
                      )}
                      {!s.phone && !s.email && <span className="text-muted-foreground font-normal">--</span>}
                    </td>
                    <td className="px-4 py-3 max-w-xs truncate uppercase text-muted-foreground font-normal">
                      {s.address ? (
                        <div className="flex items-center gap-1">
                          <MapPin className="size-3 text-muted-foreground shrink-0" />
                          <span>{s.address}</span>
                        </div>
                      ) : "Sem endereço"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button 
                          onClick={() => openEditModal(s)}
                          className="p-1 hover:bg-muted text-muted-foreground hover:text-foreground rounded-md border border-transparent hover:border-border transition-all"
                        >
                          <Edit className="size-3.5" />
                        </button>
                        <button 
                          onClick={() => handleDelete(s.id)}
                          className="p-1 hover:bg-red-500/10 text-muted-foreground hover:text-red-550 rounded-md border border-transparent hover:border-red-500/20 transition-all"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 border border-dashed border-border rounded-2xl">
            <p className="text-xs text-muted-foreground italic uppercase">
              Nenhum fornecedor localizado.
            </p>
          </div>
        )}
      </div>

      {/* Modal Form */}
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
                  <Building2 className="size-4 text-emerald-500" />
                  {editingId ? "Editar Fornecedor" : "Novo Fornecedor"}
                </h3>
                <button 
                  onClick={() => setModalOpen(false)}
                  className="text-muted-foreground hover:text-foreground text-xs font-semibold"
                >
                  Fechar
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleFormSubmit} className="flex flex-col">
                <div className="p-5 space-y-3.5 pr-6">
                  
                  {/* Name */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Nome / Razão Social *</label>
                    <input 
                      placeholder="EX: DISTRIBUIDORA DE AUTO PEÇAS SÃO PAULO"
                      className="w-full text-xs border border-border rounded-lg px-2.5 py-1.5 bg-muted/20 focus:bg-card focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-bold text-foreground placeholder-muted-foreground/50 uppercase"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>

                  {/* CNPJ */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">CNPJ</label>
                    <input 
                      placeholder="EX: 12.345.678/0001-90"
                      className="w-full text-xs border border-border rounded-lg px-2.5 py-1.5 bg-muted/20 focus:bg-card focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium text-foreground placeholder-muted-foreground/50"
                      value={cnpj}
                      onChange={(e) => setCnpj(e.target.value)}
                    />
                  </div>

                  {/* Phone & Email */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Telefone</label>
                      <input 
                        placeholder="EX: (11) 99999-9999"
                        className="w-full text-xs border border-border rounded-lg px-2.5 py-1.5 bg-muted/20 focus:bg-card focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium text-foreground placeholder-muted-foreground/50"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">E-mail</label>
                      <input 
                        type="email"
                        placeholder="EX: contato@fornecedor.com"
                        className="w-full text-xs border border-border rounded-lg px-2.5 py-1.5 bg-muted/20 focus:bg-card focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium text-foreground placeholder-muted-foreground/50"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Address */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Endereço Completo</label>
                    <input 
                      placeholder="RUA DAS AUTOPEÇAS, 100 - SÃO PAULO/SP"
                      className="w-full text-xs border border-border rounded-lg px-2.5 py-1.5 bg-muted/20 focus:bg-card focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium text-foreground placeholder-muted-foreground/50 uppercase"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                    />
                  </div>

                </div>

                {/* Buttons */}
                <div className="p-5 pt-3.5 flex justify-end gap-2 border-t border-dashed border-border bg-card">
                  <button 
                    type="button" 
                    onClick={() => setModalOpen(false)}
                    className="border border-border hover:bg-muted text-muted-foreground font-semibold text-xs rounded-full px-4 py-2 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    disabled={submitting}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-full px-5 py-2 transition-colors border border-emerald-600/10 flex items-center gap-1"
                  >
                    <span>{submitting ? "Gravando..." : "Salvar Fornecedor"}</span>
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
