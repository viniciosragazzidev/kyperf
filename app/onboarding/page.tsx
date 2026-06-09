"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"
import { 
  Wrench, 
  Building2, 
  Users, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft, 
  Plus, 
  Sparkles,
  Check,
  UserCheck
} from "lucide-react"
import { 
  getOnboardingStateAction, 
  saveOnboardingStep1Action, 
  saveOnboardingStep2Action, 
  completeOnboardingAction 
} from "@/lib/actions/onboarding-actions"

// Configuração física de mola para todas as transações de animação do Framer Motion
const springConfig = { type: "spring" as const, stiffness: 300, damping: 28 }

interface Mechanic {
  name: string
  email: string
  commissionRate: string
  status: "idle" | "running" | "success"
}

// Helpers para parser e formatadores (máscaras)
const parseAddress = (fullAddress: string) => {
  let rua = ""
  let numero = ""
  let bairro = ""
  let cidade = ""
  let estado = ""
  let cep = ""
  
  if (!fullAddress) return { rua, numero, bairro, cidade, estado, cep }
  
  try {
    // Formato esperado: Rua, Número - Bairro, Cidade/Estado - CEP: CEP
    const cepParts = fullAddress.split(" - CEP: ")
    if (cepParts.length > 1) {
      cep = cepParts[1].trim()
    }
    
    const mainPart = cepParts[0]
    const mainParts = mainPart.split(" - ")
    
    if (mainParts.length > 0) {
      const streetParts = mainParts[0].split(", ")
      if (streetParts.length > 1) {
        rua = streetParts[0].trim()
        numero = streetParts[1].trim()
      } else {
        rua = mainParts[0].trim()
      }
    }
    
    if (mainParts.length > 1) {
      bairro = mainParts[1].trim()
    }
    
    if (mainParts.length > 2) {
      const geoParts = mainParts[2].split("/")
      if (geoParts.length > 1) {
        cidade = geoParts[0].trim()
        estado = geoParts[1].trim()
      } else {
        cidade = mainParts[2].trim()
      }
    }
  } catch (e) {
    rua = fullAddress
  }
  
  return { rua, numero, bairro, cidade, estado, cep }
}

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

const formatCNPJ = (value: string) => {
  const clean = value.replace(/\D/g, "")
  if (clean.length > 12) {
    return `${clean.slice(0, 2)}.${clean.slice(2, 5)}.${clean.slice(5, 8)}/${clean.slice(8, 12)}-${clean.slice(12, 14)}`
  } else if (clean.length > 8) {
    return `${clean.slice(0, 2)}.${clean.slice(2, 5)}.${clean.slice(5, 8)}/${clean.slice(8)}`
  } else if (clean.length > 5) {
    return `${clean.slice(0, 2)}.${clean.slice(2, 5)}.${clean.slice(5)}`
  } else if (clean.length > 2) {
    return `${clean.slice(0, 2)}.${clean.slice(2)}`
  }
  return clean
}

const formatCEP = (value: string) => {
  const clean = value.replace(/\D/g, "")
  if (clean.length > 5) {
    return `${clean.slice(0, 5)}-${clean.slice(5, 8)}`
  }
  return clean
}

export default function OnboardingPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  
  // Passo 1 State
  const [companyName, setCompanyName] = useState("")
  const [cnpj, setCnpj] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [cep, setCep] = useState("")
  const [rua, setRua] = useState("")
  const [numero, setNumero] = useState("")
  const [bairro, setBairro] = useState("")
  const [cidade, setCidade] = useState("")
  const [estado, setEstado] = useState("")

  // Passo 2 State (Mecânicos cadastrados localmente)
  const [mechanics, setMechanics] = useState<Mechanic[]>([])
  const [newMechName, setNewMechName] = useState("")
  const [newMechEmail, setNewMechEmail] = useState("")
  const [newMechComm, setNewMechComm] = useState("10") // Default 10% comissão

  // Busca o estado inicial de onboarding do usuário logado
  useEffect(() => {
    async function loadState() {
      const res = await getOnboardingStateAction()
      if (res.success && res.data) {
        if (res.data.onboardingCompleted) {
          router.push("/panel")
        } else {
          setCompanyName(res.data.tenant?.name || "")
          setPhone(res.data.branch?.phone ? formatPhone(res.data.branch.phone) : "")
          setCnpj(res.data.branch?.cnpj ? formatCNPJ(res.data.branch.cnpj) : "")
          setEmail(res.data.branch?.email || "")
          
          const addr = res.data.branch?.address || ""
          const parsed = parseAddress(addr)
          setCep(parsed.cep ? formatCEP(parsed.cep) : "")
          setRua(parsed.rua || "")
          setNumero(parsed.numero || "")
          setBairro(parsed.bairro || "")
          setCidade(parsed.cidade || "")
          setEstado(parsed.estado || "")
        }
      } else {
        setErrorMessage(res.error || "Ocorreu um erro ao carregar os dados de onboarding.")
      }
    }
    loadState()
  }, [router])

  // Navegação (3 etapas no total)
  const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, 3))
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1))

  // Calcular progresso
  const progressPercentage = (currentStep / 3) * 100

  // Mudanças nos inputs com máscaras e busca de CEP
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(formatPhone(e.target.value))
  }

  const handleCNPJChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCnpj(formatCNPJ(e.target.value))
  }

  const handleCEPChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCEP(e.target.value)
    setCep(formatted)
    
    const cleanCep = e.target.value.replace(/\D/g, "")
    if (cleanCep.length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`)
        const data = await response.json()
        if (!data.erro) {
          setRua(data.logradouro || "")
          setBairro(data.bairro || "")
          setCidade(data.localidade || "")
          setEstado(data.uf || "")
        }
      } catch (err) {
        console.error("Erro ao buscar CEP", err)
      }
    }
  }

  // SUBMIT ETAPA 1
  const handleSaveStep1 = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorMessage("")

    const cleanCep = cep.replace(/\D/g, "")
    if (cleanCep.length !== 8) {
      setErrorMessage("Por favor, informe um CEP válido com 8 dígitos.")
      setIsLoading(false)
      return
    }

    const cleanCnpj = cnpj.replace(/\D/g, "")
    if (cleanCnpj && cleanCnpj.length !== 14) {
      setErrorMessage("Por favor, informe um CNPJ válido com 14 dígitos ou deixe o campo vazio.")
      setIsLoading(false)
      return
    }

    const formattedAddress = `${rua}, ${numero} - ${bairro}, ${cidade}/${estado} - CEP: ${cep}`
    
    const res = await saveOnboardingStep1Action({ 
      companyName, 
      phone, 
      address: formattedAddress,
      cnpj: cnpj || undefined,
      email: email || undefined
    })
    setIsLoading(false)

    if (res.success) {
      nextStep()
    } else {
      setErrorMessage(res.error || "Não foi possível salvar os dados da oficina.")
    }
  }

  // ADICIONAR MECÂNICO LOCAL E BANCO (Passo 2)
  const handleAddMechanic = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMechName || !newMechEmail) return

    const newMech: Mechanic = {
      name: newMechName,
      email: newMechEmail,
      commissionRate: newMechComm,
      status: "running",
    }

    // Adiciona na lista com status "running" (laranja pulsante)
    setMechanics((prev) => [...prev, newMech])
    setNewMechName("")
    setNewMechEmail("")
    setNewMechComm("10")
    
    // Salva no banco de dados via Server Action
    const res = await saveOnboardingStep2Action({
      name: newMech.name,
      email: newMech.email,
      commissionRate: newMech.commissionRate,
    })

    // Atualiza status do mecânico na listagem local
    setMechanics((prev) =>
      prev.map((m) =>
        m.email === newMech.email
          ? { ...m, status: res.success ? "success" : "idle" }
          : m
      )
    )

    if (!res.success) {
      setErrorMessage(res.error || "Erro ao salvar o mecânico.")
    }
  }

  // SUBMIT ETAPA 2 (Apenas navega se já inseriu mecânicos ou se avançar)
  const handleSaveStep2 = () => {
    nextStep()
  }

  // FINALIZAR ONBOARDING (Etapa 3 - Conclusão)
  const handleFinishOnboarding = async () => {
    setIsLoading(true)
    setErrorMessage("")
    
    const res = await completeOnboardingAction()
    setIsLoading(false)

    if (res.success) {
      router.push("/panel")
    } else {
      setErrorMessage(res.error || "Erro ao concluir o onboarding.")
    }
  }

  return (
    <div className="min-h-svh w-full bg-background flex flex-col items-center justify-center p-3 md:p-6 font-sans">
      {/* Container Principal do Card (rounded-3xl, fundo da variável card, sombra ultra suave e difusa) */}
      <div className="w-full max-w-xl bg-card rounded-3xl shadow-[0_10px_50px_-12px_rgba(0,0,0,0.05)] overflow-hidden flex flex-col relative border border-border/50 text-card-foreground">
        
        {/* Barra de Progresso Líquida no Topo do Card */}
        <div className="w-full bg-muted/60 h-[4px]">
          <motion.div 
            className="h-full bg-emerald-500" 
            initial={{ width: "0%" }}
            animate={{ width: `${progressPercentage}%` }}
            transition={springConfig}
          />
        </div>

        {/* Header do Card */}
        <div className="px-4 py-3.5 flex items-center justify-between border-b border-dashed border-border/60">
          <div className="flex items-center gap-2.5">
            <div className="bg-emerald-500/10 text-emerald-500 p-1.5 rounded-lg border border-emerald-500/20">
              <Wrench className="size-4" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-foreground tracking-tight leading-tight">Configuração de Oficina</h1>
              <p className="text-[10px] font-normal text-muted-foreground">Passo {currentStep} de 3</p>
            </div>
          </div>
          <div className="flex items-center gap-1 bg-muted/50 border border-border px-2 py-0.5 rounded-full">
            <Sparkles className="size-3 text-muted-foreground" />
            <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider">Passo Inicial</span>
          </div>
        </div>

        {/* Conteúdo Centralizado */}
        <div className="flex-1 p-4 md:p-5 flex flex-col justify-center">
          
          {errorMessage && (
            <div className="mb-4 p-2.5 bg-red-500/10 text-red-500 rounded-lg border border-red-500/20 text-[11px] font-medium flex items-center gap-1.5">
              <div className="size-1 bg-red-500 rounded-full" />
              <span>{errorMessage}</span>
            </div>
          )}

          <AnimatePresence mode="wait">
            
            {/* PASSO 1: DADOS DA OFICINA */}
            {currentStep === 1 && (
              <motion.form
                key="step1"
                onSubmit={handleSaveStep1}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={springConfig}
                className="space-y-3 flex flex-col h-full"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 text-foreground font-semibold text-xs">
                    <Building2 className="size-4 text-muted-foreground" />
                    <h2>Identificação da Oficina</h2>
                  </div>
                  <p className="text-[11px] text-muted-foreground">Insira as informações de atendimento da sua filial matriz.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-[10px] font-medium text-muted-foreground">Nome da Oficina / Razão Social</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: AutoCenter Silva"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full text-xs border border-border rounded-lg px-2.5 py-1.5 bg-muted/20 focus:bg-card focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium text-foreground placeholder-muted-foreground/50"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-medium text-muted-foreground">CNPJ (Opcional)</label>
                    <input
                      type="text"
                      placeholder="Ex: 00.000.000/0000-00"
                      value={cnpj}
                      onChange={handleCNPJChange}
                      className="w-full text-xs border border-border rounded-lg px-2.5 py-1.5 bg-muted/20 focus:bg-card focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium text-foreground placeholder-muted-foreground/50"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-medium text-muted-foreground">E-mail Comercial</label>
                    <input
                      type="email"
                      placeholder="Ex: contato@autocenter.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full text-xs border border-border rounded-lg px-2.5 py-1.5 bg-muted/20 focus:bg-card focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium text-foreground placeholder-muted-foreground/50"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-medium text-muted-foreground">Telefone Comercial</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: (21) 98888-8888"
                      value={phone}
                      onChange={handlePhoneChange}
                      className="w-full text-xs border border-border rounded-lg px-2.5 py-1.5 bg-muted/20 focus:bg-card focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium text-foreground placeholder-muted-foreground/50"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-medium text-muted-foreground">CEP</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: 12345-678"
                      value={cep}
                      onChange={handleCEPChange}
                      className="w-full text-xs border border-border rounded-lg px-2.5 py-1.5 bg-muted/20 focus:bg-card focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium text-foreground placeholder-muted-foreground/50"
                    />
                  </div>

                  <div className="space-y-1 md:col-span-2">
                    <div className="grid grid-cols-4 gap-2">
                      <div className="col-span-3 space-y-1">
                        <label className="text-[10px] font-medium text-muted-foreground">Rua / Logradouro</label>
                        <input
                          type="text"
                          required
                          placeholder="Ex: Av. das Américas"
                          value={rua}
                          onChange={(e) => setRua(e.target.value)}
                          className="w-full text-xs border border-border rounded-lg px-2.5 py-1.5 bg-muted/20 focus:bg-card focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium text-foreground placeholder-muted-foreground/50"
                        />
                      </div>
                      <div className="col-span-1 space-y-1">
                        <label className="text-[10px] font-medium text-muted-foreground">Número</label>
                        <input
                          type="text"
                          required
                          placeholder="Ex: 1500"
                          value={numero}
                          onChange={(e) => setNumero(e.target.value)}
                          className="w-full text-xs border border-border rounded-lg px-2.5 py-1.5 bg-muted/20 focus:bg-card focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium text-foreground placeholder-muted-foreground/50"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1 md:col-span-2">
                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-1">
                        <label className="text-[10px] font-medium text-muted-foreground">Bairro</label>
                        <input
                          type="text"
                          required
                          placeholder="Ex: Barra"
                          value={bairro}
                          onChange={(e) => setBairro(e.target.value)}
                          className="w-full text-xs border border-border rounded-lg px-2.5 py-1.5 bg-muted/20 focus:bg-card focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium text-foreground placeholder-muted-foreground/50"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-medium text-muted-foreground">Cidade</label>
                        <input
                          type="text"
                          required
                          placeholder="Ex: Rio de Janeiro"
                          value={cidade}
                          onChange={(e) => setCidade(e.target.value)}
                          className="w-full text-xs border border-border rounded-lg px-2.5 py-1.5 bg-muted/20 focus:bg-card focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium text-foreground placeholder-muted-foreground/50"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-medium text-muted-foreground">Estado (UF)</label>
                        <input
                          type="text"
                          required
                          maxLength={2}
                          placeholder="Ex: RJ"
                          value={estado}
                          onChange={(e) => setEstado(e.target.value.toUpperCase())}
                          className="w-full text-xs border border-border rounded-lg px-2.5 py-1.5 bg-muted/20 focus:bg-card focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium text-foreground placeholder-muted-foreground/50"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Botão de Ação Primária no canto inferior direito */}
                <div className="pt-3 flex justify-end">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex items-center gap-1.5 bg-foreground hover:bg-foreground/90 text-background font-semibold text-xs rounded-full px-5 py-2 shadow-md hover:shadow-lg transition-all active:scale-95 disabled:bg-muted disabled:text-muted-foreground"
                  >
                    <span>Salvar e Avançar</span>
                    <ArrowRight className="size-3.5" />
                  </button>
                </div>
              </motion.form>
            )}

            {/* PASSO 2: CADASTRO DE MECÂNICOS */}
            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={springConfig}
                className="space-y-3.5 flex flex-col h-full"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 text-foreground font-semibold text-xs">
                    <Users className="size-4 text-muted-foreground" />
                    <h2>Sua Equipe de Mecânicos</h2>
                  </div>
                  <p className="text-[11px] text-muted-foreground">Cadastre o primeiro mecânico da sua oficina para vincular serviços.</p>
                </div>

                {/* Formulário de Adição rápida */}
                <form onSubmit={handleAddMechanic} className="grid grid-cols-1 md:grid-cols-3 gap-2 p-2.5 bg-muted/30 border border-border/50 rounded-xl">
                  <div className="space-y-0.5">
                    <input
                      type="text"
                      required
                      placeholder="Nome do Mecânico"
                      value={newMechName}
                      onChange={(e) => setNewMechName(e.target.value)}
                      className="w-full text-xs border border-border rounded-md px-2 py-1.5 bg-card focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium text-foreground placeholder-muted-foreground/50"
                    />
                  </div>
                  <div className="space-y-0.5">
                    <input
                      type="email"
                      required
                      placeholder="E-mail de Acesso"
                      value={newMechEmail}
                      onChange={(e) => setNewMechEmail(e.target.value)}
                      className="w-full text-xs border border-border rounded-md px-2 py-1.5 bg-card focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium text-foreground placeholder-muted-foreground/50"
                    />
                  </div>
                  <div className="flex gap-1.5 items-center">
                    <div className="relative flex-1">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        placeholder="Comissão %"
                        value={newMechComm}
                        onChange={(e) => setNewMechComm(e.target.value)}
                        className="w-full text-xs border border-border rounded-md pl-2 pr-5 py-1.5 bg-card focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium text-foreground placeholder-muted-foreground/50"
                      />
                      <span className="absolute right-2 top-2 text-[9px] text-muted-foreground font-bold">%</span>
                    </div>
                    <button
                      type="submit"
                      className="bg-emerald-500 hover:bg-emerald-600 text-white p-1.5 rounded-md transition-all active:scale-95 flex items-center justify-center shrink-0 border border-emerald-600/10"
                    >
                      <Plus className="size-3.5" />
                    </button>
                  </div>
                </form>

                {/* Tabela no estilo "Eval Run" */}
                <div className="border border-border/60 rounded-xl overflow-hidden bg-card">
                  <div className="max-h-[140px] overflow-y-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-muted/50 border-b border-border/50 text-[9px] uppercase font-bold text-muted-foreground tracking-wider">
                          <th className="px-3 py-2">Nome</th>
                          <th className="px-3 py-2">E-mail</th>
                          <th className="px-3 py-2 text-center">Comissão</th>
                          <th className="px-3 py-2 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {mechanics.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="px-3 py-6 text-center text-xs text-muted-foreground font-normal">
                              Nenhum mecânico adicionado ainda. Preencha os campos acima para adicionar.
                            </td>
                          </tr>
                        ) : (
                          <AnimatePresence>
                            {mechanics.map((mech, i) => (
                              <motion.tr
                                key={mech.email}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={springConfig}
                                className="border-b border-dashed border-border/60 text-xs font-medium text-foreground hover:bg-muted/40"
                              >
                                <td className="px-3 py-2">{mech.name}</td>
                                <td className="px-3 py-2 text-muted-foreground font-normal">{mech.email}</td>
                                <td className="px-3 py-2 text-center">{mech.commissionRate}%</td>
                                <td className="px-3 py-2 text-center flex justify-center items-center h-full">
                                  {mech.status === "running" ? (
                                    <div className="flex items-center gap-1 bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded-md border border-amber-500/20">
                                      <span className="relative flex h-1 w-1">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-1 w-1 bg-amber-500"></span>
                                      </span>
                                      <span className="text-[9px] font-bold">Salvando</span>
                                    </div>
                                  ) : mech.status === "success" ? (
                                    <div className="flex items-center gap-0.5 bg-emerald-500/10 text-emerald-500 px-1.5 py-0.5 rounded-md border border-emerald-500/20">
                                      <Check className="size-2.5" />
                                      <span className="text-[9px] font-bold">Salvo</span>
                                    </div>
                                  ) : (
                                    <span className="text-muted-foreground">--</span>
                                  )}
                                </td>
                              </motion.tr>
                            ))}
                          </AnimatePresence>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Botões no Rodapé */}
                <div className="pt-3 flex justify-between border-t border-dashed border-border/60 mt-auto">
                  <button
                    type="button"
                    onClick={prevStep}
                    className="flex items-center gap-1.5 border border-border hover:bg-muted text-muted-foreground font-semibold text-xs rounded-full px-4 py-2 transition-all"
                  >
                    <ArrowLeft className="size-3.5" />
                    <span>Voltar</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveStep2}
                    className="flex items-center gap-1.5 bg-foreground hover:bg-foreground/90 text-background font-semibold text-xs rounded-full px-5 py-2 shadow-md hover:shadow-lg transition-all active:scale-95"
                  >
                    <span>Avançar</span>
                    <ArrowRight className="size-3.5" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* PASSO 3: CONCLUSÃO DO ONBOARDING */}
            {currentStep === 3 && (
              <motion.div
                key="step3-conclusion"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={springConfig}
                className="space-y-5 flex flex-col items-center justify-center text-center py-4 h-full"
              >
                {/* Ícone Pulsante de Sucesso (Paleta Jeet - Verde Menta) */}
                <div className="relative flex items-center justify-center">
                  <motion.div
                    className="absolute size-14 bg-emerald-500/20 rounded-full"
                    animate={{ scale: [1, 1.25, 1] }}
                    transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                  />
                  <div className="relative size-12 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg border border-emerald-600/10 text-white">
                    <CheckCircle2 className="size-6" />
                  </div>
                </div>

                <div className="space-y-1.5 max-w-sm">
                  <h2 className="text-base font-bold text-foreground tracking-tight">Tudo pronto para começar!</h2>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Você configurou os dados da oficina e cadastrou seus mecânicos. O sistema está 100% operacional.
                  </p>
                </div>

                {/* Botão Run Main do Estilo "Eval Run" no Canto do Card */}
                <div className="pt-3 w-full flex justify-center">
                  <button
                    type="button"
                    onClick={handleFinishOnboarding}
                    disabled={isLoading}
                    className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-full px-6 py-2.5 shadow-md hover:shadow-lg transition-all active:scale-95 disabled:bg-zinc-300 border border-emerald-600/15"
                  >
                    <UserCheck className="size-4" />
                    <span>Concluir e Acessar Painel</span>
                  </button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>

        </div>
      </div>
    </div>
  )
}
