"use client"

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Users,
  Plus,
  Search,
  Edit2,
  Check,
  Loader2,
  ClipboardList
} from "lucide-react"
import {
  getEmployeesAction,
  createEmployeeAction,
  updateEmployeeAction,
  getBranchesAction
} from "@/lib/actions/employees-actions"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const springConfig = { type: "spring" as const, stiffness: 300, damping: 28 }

interface Branch {
  id: string
  name: string
}

interface Employee {
  id: string
  name: string
  email: string
  role: "OWNER" | "MANAGER" | "RECEPTOR" | "MECHANIC"
  commissionRate: string | null
  isActive: number
  phone: string | null
  specialties: string[] | null
  workStatus: "AVAILABLE" | "BUSY" | "AWAY"
  branchId: string | null
  branch?: Branch | null
}

const roleBadges: Record<string, { label: string, styles: string }> = {
  OWNER: { label: "Dono", styles: "bg-purple-500/10 text-purple-500 border-purple-500/20" },
  MANAGER: { label: "Gerente", styles: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
  RECEPTOR: { label: "Recepção", styles: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" },
  MECHANIC: { label: "Mecânico", styles: "bg-orange-500/10 text-orange-500 border-orange-500/20" },
}

const statusBadges: Record<string, { label: string, styles: string }> = {
  AVAILABLE: { label: "Disponível", styles: "bg-emerald-500 text-white" },
  BUSY: { label: "Ocupado", styles: "bg-orange-500 text-white animate-pulse" },
  AWAY: { label: "Ausente", styles: "bg-zinc-400 text-white" },
}

// Helpers para formatação de celular
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

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("ALL")
  const [statusFilter, setStatusFilter] = useState<string>("ALL")

  const [isLoading, setIsLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  // Drawer modal states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)

  // Form states
  const [formName, setFormName] = useState("")
  const [formEmail, setFormEmail] = useState("")
  const [formPassword, setFormPassword] = useState("")
  const [formRole, setFormRole] = useState<"OWNER" | "MANAGER" | "RECEPTOR" | "MECHANIC">("MECHANIC")
  const [formBranchId, setFormBranchId] = useState("")
  const [formCommissionRate, setFormCommissionRate] = useState("0.00")
  const [formPhone, setFormPhone] = useState("")
  const [formSpecialties, setFormSpecialties] = useState("")
  const [formIsActive, setFormIsActive] = useState<number>(1)
  const [formWorkStatus, setFormWorkStatus] = useState<"AVAILABLE" | "BUSY" | "AWAY">("AVAILABLE")

  // Carregar dados
  const loadData = async () => {
    setIsLoading(true)
    const [empRes, branchRes] = await Promise.all([
      getEmployeesAction(),
      getBranchesAction()
    ])
    setIsLoading(false)

    if (empRes.success && empRes.data) {
      setEmployees(empRes.data as Employee[])
    } else {
      toast.error(empRes.error || "Erro ao carregar colaboradores.")
    }

    if (branchRes.success && branchRes.data) {
      setBranches(branchRes.data as Branch[])
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleOpenCreateModal = () => {
    setEditingEmployee(null)
    setFormName("")
    setFormEmail("")
    setFormPassword("")
    setFormRole("MECHANIC")
    setFormBranchId(branches[0]?.id || "")
    setFormCommissionRate("10.00")
    setFormPhone("")
    setFormSpecialties("")
    setFormIsActive(1)
    setFormWorkStatus("AVAILABLE")
    setIsModalOpen(true)
  }

  const handleOpenEditModal = (emp: Employee) => {
    setEditingEmployee(emp)
    setFormName(emp.name)
    setFormEmail(emp.email)
    setFormPassword("")
    setFormRole(emp.role)
    setFormBranchId(emp.branchId || "")
    setFormCommissionRate(emp.commissionRate || "0.00")
    setFormPhone(emp.phone ? formatPhone(emp.phone) : "")
    setFormSpecialties(emp.specialties ? emp.specialties.join(", ") : "")
    setFormIsActive(emp.isActive)
    setFormWorkStatus(emp.workStatus || "AVAILABLE")
    setIsModalOpen(true)
  }

  const handleSaveEmployee = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formName || !formEmail) return

    setActionLoading(true)
    const specialtiesArray = formSpecialties
      ? formSpecialties.split(",").map(s => s.trim()).filter(s => s.length > 0)
      : []

    if (editingEmployee) {
      const res = await updateEmployeeAction({
        id: editingEmployee.id,
        name: formName,
        role: formRole,
        branchId: formBranchId || undefined,
        commissionRate: formRole === "MECHANIC" ? formCommissionRate : "0.00",
        isActive: formIsActive,
        phone: formPhone.replace(/\D/g, "") || undefined,
        specialties: specialtiesArray,
        workStatus: formWorkStatus,
      })

      setActionLoading(false)
      if (res.success && res.data) {
        toast.success("Colaborador atualizado com sucesso!")
        setIsModalOpen(false)
        loadData()
      } else {
        toast.error(res.error || "Erro ao atualizar colaborador.")
      }
    } else {
      const res = await createEmployeeAction({
        name: formName,
        email: formEmail,
        password: formPassword || undefined,
        role: formRole,
        branchId: formBranchId || undefined,
        commissionRate: formRole === "MECHANIC" ? formCommissionRate : "0.00",
        phone: formPhone.replace(/\D/g, "") || undefined,
        specialties: specialtiesArray,
      })

      setActionLoading(false)
      if (res.success && res.data) {
        toast.success("Colaborador cadastrado com sucesso!")
        setIsModalOpen(false)
        loadData()
      } else {
        toast.error(res.error || "Erro ao cadastrar colaborador.")
      }
    }
  }

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch =
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (emp.phone && emp.phone.includes(searchTerm))

    const matchesRole = roleFilter === "ALL" || emp.role === roleFilter
    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "ACTIVE" && emp.isActive === 1) ||
      (statusFilter === "INACTIVE" && emp.isActive === 0)

    return matchesSearch && matchesRole && matchesStatus
  })

  const totalCount = employees.length
  const activeCount = employees.filter(e => e.isActive === 1).length
  const mechanicsCount = employees.filter(e => e.role === "MECHANIC" && e.isActive === 1).length
  const busyMechanicsCount = employees.filter(e => e.role === "MECHANIC" && e.isActive === 1 && e.workStatus === "BUSY").length

  return (
    <div className="flex-1 p-4 md:p-6 bg-[#FAF9F6] dark:bg-zinc-950 min-h-screen font-sans">

      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <span className="bg-primary/10 text-primary p-1.5 rounded-lg border border-primary/20">
              <Users className="size-4.5" />
            </span>
            Gestão de Equipe
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5 geist-mono pl-10">
            Gerencie mecânicos, atendentes e administradores. Defina comissões e acompanhe o pátio.
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={() => window.location.href = "/panel/employees/workload"}
            variant="outline"
            className="flex items-center gap-1.5 font-extrabold text-xs rounded-none px-5 py-2.5 h-auto transition-all active:scale-95 shrink-0"
          >
            <span>Carga de Trabalho</span>
          </Button>
          <Button
            onClick={handleOpenCreateModal}
            className="bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs rounded-none px-5 py-2.5 h-auto transition-all shadow-md active:scale-95 flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <Plus className="size-4" />
            <span>Cadastrar Colaborador</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-card p-4 rounded-3xl border border-border/50 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)]">
          <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider geist-mono">Total de Colaboradores</span>
          <h3 className="text-2xl font-black text-foreground mt-1 geist-mono">{totalCount}</h3>
          <span className="text-[9px] text-muted-foreground mt-0.5 block">{activeCount} ativos no momento</span>
        </div>
        <div className="bg-card p-4 rounded-3xl border border-border/50 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)]">
          <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider geist-mono">Mecânicos na Rampa</span>
          <h3 className="text-2xl font-black text-orange-500 mt-1 geist-mono">{busyMechanicsCount}/{mechanicsCount}</h3>
          <span className="text-[9px] text-muted-foreground mt-0.5 block">Mecânicos ativos trabalhando</span>
        </div>
        <div className="bg-card p-4 rounded-3xl border border-border/50 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)]">
          <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider geist-mono">Filiais Atendidas</span>
          <h3 className="text-2xl font-black text-emerald-500 mt-1 geist-mono">{branches.length}</h3>
          <span className="text-[9px] text-muted-foreground mt-0.5 block">Locais cadastrados</span>
        </div>
        <div className="bg-card p-4 rounded-3xl border border-border/50 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)]">
          <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider geist-mono">Acesso ao Painel</span>
          <h3 className="text-2xl font-black text-purple-500 mt-1 geist-mono">RBAC</h3>
          <span className="text-[9px] text-muted-foreground mt-0.5 block">Permissões ativas por papel</span>
        </div>
      </div>

      {/* Busca e Filtros */}
      <div className="flex flex-col md:flex-row gap-3 mb-4 justify-between">
        <div className="relative max-w-md w-full flex items-center">
          <Search className="absolute left-3 size-4 text-muted-foreground z-10" />
          <Input
            type="text"
            placeholder="Buscar por nome, e-mail ou celular..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-10 text-xs pl-9 pr-3 bg-card focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium text-foreground placeholder-muted-foreground/50"
          />
        </div>

        <div className="flex gap-2 text-xs">
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[160px] bg-card border border-border px-3 py-2 text-foreground focus:outline-hidden font-semibold h-10 rounded-none">
              <SelectValue placeholder="Papel" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos os Papéis</SelectItem>
              <SelectItem value="OWNER">Dono</SelectItem>
              <SelectItem value="MANAGER">Gerente</SelectItem>
              <SelectItem value="RECEPTOR">Recepção</SelectItem>
              <SelectItem value="MECHANIC">Mecânico</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px] bg-card border border-border px-3 py-2 text-foreground focus:outline-hidden font-semibold h-10 rounded-none">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos os Status</SelectItem>
              <SelectItem value="ACTIVE">Ativo</SelectItem>
              <SelectItem value="INACTIVE">Inativo</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tabela de Colaboradores */}
      <div className="bg-card rounded-3xl shadow-[0_10px_50px_-12px_rgba(0,0,0,0.05)] border border-border/50 overflow-hidden text-card-foreground">
        {isLoading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3].map((idx) => (
              <div key={idx} className="flex items-center justify-between py-3 border-b border-border/40 last:border-0 animate-pulse">
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-1/4 rounded-md" />
                  <Skeleton className="h-3 w-1/3 rounded-md" />
                </div>
                <div className="flex gap-4">
                  <Skeleton className="h-5 w-20 rounded-md" />
                  <Skeleton className="h-8 w-16 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div className="p-16 text-center text-xs text-muted-foreground">
            Nenhum colaborador encontrado com os filtros selecionados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted/50 border-b border-border/50 text-[9px] uppercase font-bold text-muted-foreground tracking-wider">
                  <th className="px-4 py-3">Funcionário</th>
                  <th className="px-4 py-3">Cargo / Papel</th>
                  <th className="px-4 py-3">Filial</th>
                  <th className="px-4 py-3">Comissão</th>
                  <th className="px-4 py-3">Especialidades</th>
                  <th className="px-4 py-3 text-center">Status Pátio</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map((emp) => (
                  <tr key={emp.id} className={`border-b border-dashed border-border/60 hover:bg-muted/30 transition-colors text-xs font-semibold text-foreground ${emp.isActive === 0 ? "opacity-60" : ""}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="size-8 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center font-bold text-xs uppercase text-zinc-600 dark:text-zinc-400">
                          {emp.name.slice(0, 2)}
                        </div>
                        <div>
                          <div className="font-bold flex items-center gap-1.5">
                            {emp.name}
                            {emp.isActive === 0 && (
                              <span className="text-[8px] bg-red-500/10 text-red-500 border border-red-500/20 px-1 rounded-none uppercase tracking-widest geist-mono font-normal">
                                Inativo
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-muted-foreground font-normal">{emp.email}</div>
                          {emp.phone && (
                            <div className="text-[10px] text-muted-foreground font-normal mt-0.5">{formatPhone(emp.phone)}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${roleBadges[emp.role]?.styles || ""}`}>
                        {roleBadges[emp.role]?.label || emp.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground font-medium">{emp.branch?.name || "Todas/Matriz"}</td>
                    <td className="px-4 py-3 font-mono font-medium">
                      {emp.role === "MECHANIC" ? `${emp.commissionRate || "0.00"}%` : "--"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {emp.specialties && emp.specialties.length > 0 ? (
                          emp.specialties.map((spec, idx) => (
                            <span key={idx} className="bg-muted text-muted-foreground text-[9px] px-1.5 py-0.5 border border-border/30">
                              {spec}
                            </span>
                          ))
                        ) : (
                          <span className="text-muted-foreground/40 text-[10px] font-normal">--</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {emp.role === "MECHANIC" && emp.isActive === 1 ? (
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-bold rounded-full ${emp.workStatus === "AVAILABLE" ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" : emp.workStatus === "BUSY" ? "bg-orange-500/10 text-orange-500 border border-orange-500/20" : "bg-zinc-500/10 text-zinc-500 border border-zinc-500/20"}`}>
                          <span className={`size-1.5 rounded-full ${emp.workStatus === "AVAILABLE" ? "bg-emerald-500" : emp.workStatus === "BUSY" ? "bg-orange-500 animate-ping" : "bg-zinc-400"}`} />
                          {statusBadges[emp.workStatus]?.label || emp.workStatus}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/30 font-normal">--</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        onClick={() => handleOpenEditModal(emp)}
                        variant="ghost"
                        className="p-1 hover:bg-muted text-muted-foreground hover:text-foreground rounded-md border border-transparent hover:border-border transition-all"
                        title="Editar colaborador"
                      >
                        <Edit2 className="size-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Drawer Modal de Cadastro/Edição */}
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
                  <Users className="size-4 text-primary" />
                  {editingEmployee ? "Editar Colaborador" : "Cadastrar Colaborador"}
                </h2>
                <Button
                  onClick={() => setIsModalOpen(false)}
                  variant="ghost"
                  className="text-muted-foreground hover:text-foreground text-xs font-semibold"
                >
                  Fechar
                </Button>
              </div>

              <form onSubmit={handleSaveEmployee} className="flex flex-col max-h-[85vh] overflow-hidden">
                <ScrollArea className="flex-grow min-h-0 max-h-[60vh] w-full overflow-hidden">
                  <div className="p-5 space-y-4 pr-6 text-xs">

                    {/* Nome */}
                    <div className="space-y-1">
                      <Label className="text-[10px] font-medium text-muted-foreground">Nome Completo</Label>
                      <Input
                        type="text"
                        required
                        placeholder="Ex: Carlos Souza"
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        className="w-full text-xs"
                      />
                    </div>

                    {/* Email */}
                    <div className="space-y-1">
                      <Label className="text-[10px] font-medium text-muted-foreground">E-mail de Acesso</Label>
                      <Input
                        type="email"
                        required
                        disabled={!!editingEmployee}
                        placeholder="Ex: carlos.souza@oficina.com.br"
                        value={formEmail}
                        onChange={(e) => setFormEmail(e.target.value)}
                        className="w-full text-xs disabled:opacity-60"
                      />
                    </div>

                    {/* Senha (apenas criação) */}
                    {!editingEmployee && (
                      <div className="space-y-1">
                        <Label className="text-[10px] font-medium text-muted-foreground">Senha de Acesso Inicial</Label>
                        <Input
                          type="password"
                          placeholder="Mínimo 6 caracteres (Opcional, padrão: kyper123@)"
                          value={formPassword}
                          onChange={(e) => setFormPassword(e.target.value)}
                          className="w-full text-xs"
                        />
                      </div>
                    )}

                    {/* Telefone/Celular */}
                    <div className="space-y-1">
                      <Label className="text-[10px] font-medium text-muted-foreground">Telefone / Celular (Opcional)</Label>
                      <Input
                        type="text"
                        placeholder="Ex: (21) 98888-8888"
                        value={formPhone}
                        onChange={(e) => setFormPhone(formatPhone(e.target.value))}
                        className="w-full text-xs"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {/* Papel */}
                      <div className="space-y-1">
                        <Label className="text-[10px] font-medium text-muted-foreground">Cargo / Papel</Label>
                        <Select value={formRole} onValueChange={(val: any) => setFormRole(val)}>
                          <SelectTrigger className="w-full bg-muted/20 border border-border px-3 py-2 text-foreground focus:outline-hidden font-semibold rounded-none h-9">
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="MECHANIC">Mecânico</SelectItem>
                            <SelectItem value="RECEPTOR">Recepção</SelectItem>
                            <SelectItem value="MANAGER">Gerente</SelectItem>
                            <SelectItem value="OWNER">Dono</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Filial */}
                      <div className="space-y-1">
                        <Label className="text-[10px] font-medium text-muted-foreground">Filial Vinculada</Label>
                        <Select value={formBranchId} onValueChange={setFormBranchId}>
                          <SelectTrigger className="w-full bg-muted/20 border border-border px-3 py-2 text-foreground focus:outline-hidden font-semibold rounded-none h-9">
                            <SelectValue placeholder="Todas / Padrão" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Todas / Padrão</SelectItem>
                            {branches.map(b => (
                              <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Comissão (apenas para mecânicos) */}
                    {formRole === "MECHANIC" && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="space-y-1"
                      >
                        <Label className="text-[10px] font-medium text-muted-foreground">Taxa de Comissão (%) sobre Serviços</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          placeholder="Ex: 10.00"
                          value={formCommissionRate}
                          onChange={(e) => setFormCommissionRate(e.target.value)}
                          className="w-full text-xs font-mono"
                        />
                      </motion.div>
                    )}

                    {/* Especialidades (apenas para mecânicos) */}
                    {formRole === "MECHANIC" && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="space-y-1"
                      >
                        <Label className="text-[10px] font-medium text-muted-foreground">Especialidades (separadas por vírgula)</Label>
                        <Input
                          type="text"
                          placeholder="Ex: Suspensão, Freios, Injeção Eletrônica"
                          value={formSpecialties}
                          onChange={(e) => setFormSpecialties(e.target.value)}
                          className="w-full text-xs"
                        />
                      </motion.div>
                    )}

                    {/* Opções extras na edição */}
                    {editingEmployee && (
                      <div className="border-t border-dashed border-border pt-3.5 space-y-3">
                        {/* Status Ativo/Inativo */}
                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="font-bold text-foreground">Status do Cadastro</Label>
                            <p className="text-[9px] text-muted-foreground">Se desativado, o funcionário perde acesso ao sistema.</p>
                          </div>
                          <Select value={formIsActive.toString()} onValueChange={(val) => setFormIsActive(parseInt(val, 10))}>
                            <SelectTrigger className="w-[120px] bg-card border border-border px-3 py-1.5 text-foreground focus:outline-hidden font-semibold rounded-none h-8">
                              <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">Ativo</SelectItem>
                              <SelectItem value="0">Inativo</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Status de Trabalho no Pátio (apenas para mecânicos ativos) */}
                        {formRole === "MECHANIC" && formIsActive === 1 && (
                          <div className="flex items-center justify-between border-t border-dashed border-border/60 pt-3">
                            <div>
                              <Label className="font-bold text-foreground">Status no Pátio</Label>
                              <p className="text-[9px] text-muted-foreground">Estado atual do mecânico no pátio de rampas.</p>
                            </div>
                            <Select value={formWorkStatus} onValueChange={(val: any) => setFormWorkStatus(val)}>
                              <SelectTrigger className="w-[160px] bg-card border border-border px-3 py-1.5 text-foreground focus:outline-hidden font-semibold rounded-none h-8">
                                <SelectValue placeholder="Status Pátio" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="AVAILABLE">Disponível</SelectItem>
                                <SelectItem value="BUSY">Ocupado (Em serviço)</SelectItem>
                                <SelectItem value="AWAY">Ausente / Almoço</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
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
                    className="bg-primary hover:bg-primary-hover text-primary-foreground font-bold text-xs rounded-none px-5 py-2 transition-colors flex items-center gap-1.5"
                  >
                    {actionLoading && <span className="size-3 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin shrink-0" />}
                    <span>{editingEmployee ? "Salvar Alterações" : "Cadastrar Colaborador"}</span>
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
