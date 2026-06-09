"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { 
  Building2, 
  Phone, 
  Mail, 
  MapPin, 
  Check, 
  Info 
} from "lucide-react"

// Import Server Actions
import { 
  getWorkshopSettingsAction, 
  updateWorkshopSettingsAction 
} from "@/lib/actions/settings-actions"

interface WorkshopBranch {
  id: string
  name: string
  phone: string | null
  address: string | null
  cnpj: string | null
  email: string | null
}

export default function WorkshopSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  
  // Form State
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [cnpj, setCnpj] = useState("")
  const [address, setAddress] = useState("")

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await getWorkshopSettingsAction()
      if (res.success && res.data) {
        const branch = res.data as WorkshopBranch
        setName(branch.name)
        setPhone(branch.phone || "")
        setEmail(branch.email || "")
        setCnpj(branch.cnpj || "")
        setAddress(branch.address || "")
      }
    } catch (err) {
      console.error("Erro ao obter dados da oficina:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name) {
      alert("O nome da oficina é obrigatório.")
      return
    }

    setSubmitting(true)
    try {
      const res = await updateWorkshopSettingsAction({
        name,
        phone: phone || undefined,
        email: email || undefined,
        cnpj: cnpj || undefined,
        address: address || undefined,
      })

      if (res.success) {
        alert("Configurações da oficina atualizadas com sucesso!")
        loadData()
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

  return (
    <div className="flex-1 p-4 md:p-6 bg-[#FAF9F6] dark:bg-zinc-950 min-h-screen font-sans space-y-6">
      
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <span className="bg-emerald-500/10 text-emerald-500 p-1.5 rounded-lg border border-emerald-500/20">
              <Building2 className="size-4.5" />
            </span>
            Dados da Oficina
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Gerencie as informações da sua filial matriz. Estes dados serão exibidos nos cabeçalhos dos PDFs gerados.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-muted-foreground text-xs font-medium">
          Carregando configurações...
        </div>
      ) : (
        <div className="max-w-2xl bg-card rounded-3xl shadow-[0_10px_50px_-12px_rgba(0,0,0,0.05)] border border-border/50 overflow-hidden text-card-foreground p-6 space-y-6">
          <div className="flex items-center justify-between pb-3.5 border-b border-dashed border-border">
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
              <Building2 className="size-4 text-emerald-500" />
              Configurações Operacionais
            </h3>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 text-xs font-semibold">
            
            {/* Name */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Nome Fantasia da Unidade *</label>
              <input 
                placeholder="EX: AUTO CENTER CAR MATRIZ"
                className="w-full text-xs border border-border rounded-lg bg-muted/20 focus:bg-card focus:ring-2 focus:ring-emerald-500/20 h-10 px-3 font-bold uppercase outline-hidden"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            {/* CNPJ */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">CNPJ da Filial</label>
              <input 
                placeholder="EX: 12.345.678/0001-90"
                className="w-full text-xs border border-border rounded-lg bg-muted/20 focus:bg-card focus:ring-2 focus:ring-emerald-500/20 h-10 px-3 outline-hidden"
                value={cnpj}
                onChange={(e) => setCnpj(formatCNPJ(e.target.value))}
              />
            </div>

            {/* Phone & Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Telefone de Contato</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <input 
                    placeholder="EX: (11) 99999-9999"
                    className="w-full text-xs border border-border rounded-lg bg-muted/20 focus:bg-card focus:ring-2 focus:ring-emerald-500/20 h-10 pl-10 pr-3 outline-hidden"
                    value={phone}
                    onChange={(e) => setPhone(formatPhone(e.target.value))}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">E-mail Corporativo</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <input 
                    type="email"
                    placeholder="EX: matriz@oficina.com"
                    className="w-full text-xs border border-border rounded-lg bg-muted/20 focus:bg-card focus:ring-2 focus:ring-emerald-500/20 h-10 pl-10 pr-3 outline-hidden"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Address */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Endereço Físico Completo</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <input 
                  placeholder="EX: AVENIDA BRASIL, 1000 - CENTRO - RIO DE JANEIRO/RJ"
                  className="w-full text-xs border border-border rounded-lg bg-muted/20 focus:bg-card focus:ring-2 focus:ring-emerald-500/20 h-10 pl-10 pr-3 uppercase outline-hidden"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>
            </div>

            {/* Info and Buttons */}
            <div className="pt-4 border-t border-dashed border-border space-y-4">
              <div className="bg-muted/20 p-4 border border-border/50 rounded-2xl flex gap-3 text-[10px] text-muted-foreground leading-relaxed">
                <Info className="size-4 text-muted-foreground shrink-0 mt-0.5" />
                <p>
                  As informações de CNPJ, telefone, e-mail e endereço cadastradas acima são vinculadas diretamente às impressões térmicas e aos downloads em PDF de recibos físicos.
                </p>
              </div>

              <button 
                type="submit"
                disabled={submitting}
                className="w-full h-10 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full font-black uppercase tracking-wider flex items-center justify-center gap-2 text-[10px] cursor-pointer shadow-xs disabled:opacity-50"
              >
                <Check className="size-4" />
                {submitting ? "Gravando Configurações..." : "Salvar Configurações"}
              </button>
            </div>

          </form>
        </div>
      )}

    </div>
  )
}

