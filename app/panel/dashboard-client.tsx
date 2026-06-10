"use client"

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Wrench, 
  TrendingUp, 
  AlertTriangle, 
  DollarSign, 
  Activity, 
  Clock, 
  ArrowRight, 
  ShieldAlert, 
  FileText, 
  CheckCircle2, 
  MapPin, 
  Package, 
  Percent 
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DashboardData {
  activeOrdersCount: number;
  monthlyRevenue: number;
  ticketMedio: number;
  lowStockCount: number;
  lowStockParts: Array<{
    id: string;
    name: string;
    sku: string | null;
    quantity: number;
    minQuantity: number;
    brand: string | null;
    [key: string]: any;
  }>;
  statusCounts: {
    CHECK_IN: number;
    AWAITING_BUDGET: number;
    AWAITING_APPROVAL: number;
    AWAITING_PARTS: number;
    IN_PROGRESS: number;
    TESTING_WASHING: number;
    READY: number;
    DELIVERED: number;
  };
  recentOrders: Array<{
    id: string;
    osNumber: number;
    status: string;
    paymentStatus: string;
    createdAt: Date | string;
    totalPrice: number;
    customer: {
      name: string;
    };
    vehicle: {
      brand: string;
      model: string;
      plate: string;
    };
    [key: string]: any;
  }>;
  onboarding?: {
    hasMechanic: boolean;
    isWhatsappConnected: boolean;
    hasWorkOrder: boolean;
  };
}

interface DashboardClientProps {
  initialData: DashboardData | null;
  error?: string;
}

const statusConfig = {
  CHECK_IN: { label: "Check-in", bg: "bg-blue-500/10", border: "border-blue-500/20", text: "text-blue-500", bar: "bg-blue-500" },
  AWAITING_BUDGET: { label: "Orçamento", bg: "bg-amber-500/10", border: "border-amber-500/20", text: "text-amber-500", bar: "bg-amber-500" },
  AWAITING_APPROVAL: { label: "Aprovação", bg: "bg-yellow-500/10", border: "border-yellow-500/20", text: "text-yellow-600 dark:text-yellow-500", bar: "bg-yellow-500" },
  AWAITING_PARTS: { label: "Peças", bg: "bg-purple-500/10", border: "border-purple-500/20", text: "text-purple-500", bar: "bg-purple-500" },
  IN_PROGRESS: { label: "Execução", bg: "bg-indigo-500/10", border: "border-indigo-500/20", text: "text-indigo-500", bar: "bg-indigo-500" },
  TESTING_WASHING: { label: "Teste/Lavagem", bg: "bg-pink-500/10", border: "border-pink-500/20", text: "text-pink-500", bar: "bg-pink-500" },
  READY: { label: "Pronto", bg: "bg-emerald-500/10", border: "border-emerald-500/20", text: "text-emerald-500", bar: "bg-emerald-500" },
  DELIVERED: { label: "Entregue", bg: "bg-zinc-500/10", border: "border-zinc-500/20", text: "text-zinc-500", bar: "bg-zinc-550" },
};

export default function DashboardClient({ initialData, error }: DashboardClientProps) {
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [showCommandBarHighlight, setShowCommandBarHighlight] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const welcomeShown = localStorage.getItem("kyperfix_welcome_shown");
      if (!welcomeShown) {
        setShowWelcomeModal(true);
      }
    }
  }, []);

  useEffect(() => {
    const handleToggle = () => {
      setShowCommandBarHighlight(false);
    };
    window.addEventListener("toggle-command-bar", handleToggle);
    return () => window.removeEventListener("toggle-command-bar", handleToggle);
  }, []);

  if (error || !initialData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center bg-red-500/5 rounded-3xl border border-red-500/20">
        <ShieldAlert className="size-16 text-red-500 mb-4 animate-bounce" />
        <h2 className="text-xl font-bold uppercase tracking-widest text-red-500">Erro ao Carregar Painel</h2>
        <p className="text-muted-foreground text-sm mt-2 max-w-md">
          {error || "Dados do dashboard inválidos ou indisponíveis."}
        </p>
      </div>
    );
  }

  const {
    activeOrdersCount,
    monthlyRevenue,
    ticketMedio,
    lowStockCount,
    lowStockParts,
    statusCounts,
    recentOrders,
    onboarding,
  } = initialData;

  const totalOrders = Object.values(statusCounts).reduce((a, b) => a + b, 0);

  // Onboarding Steps calculation
  const onboardingSteps = [
    {
      id: "mechanic",
      label: "Cadastrar o primeiro funcionário/mecânico",
      description: "Necessário para atribuir a execução dos serviços",
      completed: onboarding?.hasMechanic || false,
      href: "/panel/employees",
      buttonText: "Adicionar Mecânico"
    },
    {
      id: "whatsapp",
      label: "Conectar o robô do WhatsApp",
      description: "Para envio automático de orçamentos e status",
      completed: onboarding?.isWhatsappConnected || false,
      href: "/panel/settings/whatsapp",
      buttonText: "Configurar WhatsApp"
    },
    {
      id: "order",
      label: "Abrir a primeira Ordem de Serviço de teste",
      description: "Veja o fluxo operacional na prática",
      completed: onboarding?.hasWorkOrder || false,
      href: "/panel/orders/new",
      buttonText: "Criar O.S. de Teste"
    }
  ];

  const completedStepsCount = onboardingSteps.filter(s => s.completed).length;
  const showOnboardingChecklist = completedStepsCount < onboardingSteps.length;

  // Formatter helpers
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);
  };

  const formatPlate = (plate: string) => {
    if (plate.length === 7) {
      return `${plate.slice(0, 3)}-${plate.slice(3)}`;
    }
    return plate;
  };

  return (
    <div className="flex-1 p-4 md:p-6 bg-[#FAF9F6] dark:bg-zinc-950 min-h-screen font-sans space-y-6">
      
      {/* Modal de Boas-Vindas Contextual */}
      {showWelcomeModal && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-card border border-border rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 relative"
          >
            <div className="text-center space-y-2">
              <div className="size-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500 border border-emerald-500/20 mx-auto">
                <Wrench className="size-6 animate-pulse" />
              </div>
              <h2 className="text-lg font-black tracking-tight text-foreground">
                Bem-vindo à KYPERFIX! 🚀
              </h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Nós não somos um ERP operacional cinza, travado ou sem graça. A KYPERFIX foi construída para dar velocidade máxima no controle operacional do seu pátio.
              </p>
            </div>

            <div className="bg-muted/30 border border-border/50 rounded-2xl p-3.5 text-xs text-foreground/80 space-y-2">
              <p className="font-bold text-foreground flex items-center gap-1.5">
                <CheckCircle2 className="size-4 text-emerald-500" />
                Como funciona o seu guia de tela:
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground text-[11px] pl-1">
                <li>Complete o checklist inicial para destravar o painel</li>
                <li>Clique na barra de busca (ou Cmd+K) para abrir o copiloto</li>
                <li>Experimente colocar dados simulados no Kanban</li>
              </ul>
            </div>

            <Button
              onClick={() => {
                setShowWelcomeModal(false);
                localStorage.setItem("kyperfix_welcome_shown", "true");
                setShowCommandBarHighlight(true);
                // Auto hide highlight after 10s
                setTimeout(() => {
                  setShowCommandBarHighlight(false);
                }, 10000);
              }}
              className="w-full font-bold py-2.5 h-9 rounded-xl text-xs text-zinc-100 hover:text-white bg-zinc-900/90 dark:bg-zinc-950/90 border border-zinc-800/60 hover:bg-zinc-800/90 transition-all shadow-md cursor-pointer"
            >
              Vamos lá!
            </Button>
          </motion.div>
        </div>
      )}

      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <span className="bg-emerald-500/10 text-emerald-500 p-1.5 rounded-lg border border-emerald-500/20">
              <Activity className="size-4.5" />
            </span>
            Painel de Controle
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5 geist-mono">
            Visão geral em tempo real de operações, pátio e receitas da oficina.
          </p>
        </div>
        
        <div className="flex items-center gap-3 bg-card border border-border/50 p-2.5 rounded-2xl shadow-sm">
          <div className="size-9 bg-emerald-500/10 rounded-lg flex items-center justify-center text-emerald-500 border border-emerald-500/20 shrink-0">
            <Activity className="size-4 animate-pulse" />
          </div>
          <div className="grid">
            <span className="text-[9px] text-muted-foreground uppercase font-bold">Status do Sistema</span>
            <span className="text-[10px] text-foreground font-bold font-mono">FILIAL MATRIZ ➜ ONLINE</span>
          </div>
        </div>
      </div>

      {/* Tooltip de Orientação do Command Bar */}
      {showCommandBarHighlight && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 rounded-2xl p-4 shadow-sm flex items-center justify-between gap-4 animate-bounce"
        >
          <div className="flex items-center gap-3">
            <span className="bg-emerald-500/20 text-emerald-500 p-1.5 rounded-lg border border-emerald-500/35">
              <span className="font-mono font-bold text-xs">⌘K</span>
            </span>
            <div className="grid">
              <span className="text-xs font-bold text-foreground">Experimente o Cérebro do Sistema!</span>
              <span className="text-[10px] text-muted-foreground">Pressione <kbd className="font-mono bg-muted px-1 border rounded text-foreground text-[9px]">Ctrl+K</kbd> (ou <kbd className="font-mono bg-muted px-1 border rounded text-foreground text-[9px]">Cmd+K</kbd>) ou clique na barra de busca acima para criar ordens ou buscar recursos em 1 clique.</span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="xs"
            onClick={() => setShowCommandBarHighlight(false)}
            className="text-[10px] text-muted-foreground hover:text-foreground h-6 px-2 shrink-0"
          >
            Entendido
          </Button>
        </motion.div>
      )}

      {/* Checklist Inicial de Configuração */}
      {showOnboardingChecklist && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-emerald-500/20 rounded-3xl p-6 shadow-sm space-y-4 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 size-32 bg-emerald-500/5 rounded-bl-full pointer-events-none" />
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-sm font-bold uppercase tracking-wider text-emerald-650 flex items-center gap-2">
                <CheckCircle2 className="size-4 animate-pulse text-emerald-500" />
                Vamos preparar a KYPERFIX para rodar? 🚀
              </h2>
              <p className="text-xs text-muted-foreground">
                Conclua estes 3 passos básicos para destravar todo o poder operacional e de faturamento da sua oficina.
              </p>
            </div>
            <div className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-3 py-1 rounded-full text-xs font-bold font-mono">
              {completedStepsCount}/3 Concluídos
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1">
            <div className="h-2 w-full bg-muted rounded-full overflow-hidden border border-border/20">
              <div 
                className="h-full bg-emerald-500 transition-all duration-500 ease-out rounded-full" 
                style={{ width: `${(completedStepsCount / 3) * 100}%` }}
              />
            </div>
          </div>

          {/* Steps List */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {onboardingSteps.map((step) => (
              <div 
                key={step.id} 
                className={cn(
                  "p-3 rounded-2xl border transition-all flex flex-col justify-between gap-3 text-xs",
                  step.completed 
                    ? "bg-emerald-500/5 border-emerald-500/10 opacity-75" 
                    : "bg-muted/30 border-border/50 hover:bg-muted/50"
                )}
              >
                <div className="flex items-start gap-2.5">
                  <span className={cn(
                    "shrink-0 mt-0.5 rounded-full p-0.5",
                    step.completed ? "text-emerald-500" : "text-muted-foreground"
                  )}>
                    {step.completed ? (
                      <CheckCircle2 className="size-4.5 fill-emerald-500/20" />
                    ) : (
                      <div className="size-4.5 rounded-full border border-current" />
                    )}
                  </span>
                  <div>
                    <p className={cn("font-bold text-foreground", step.completed && "line-through")}>
                      {step.label}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {step.description}
                    </p>
                  </div>
                </div>

                {!step.completed && (
                  <Link href={step.href} className="w-full">
                    <Button variant="default" className="w-full text-[10px] py-1.5 h-7 rounded-lg">
                      {step.buttonText}
                    </Button>
                  </Link>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* KPI Cards Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Active Work Orders */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="relative group overflow-hidden bg-card p-5 rounded-3xl border border-border/50 shadow-[0_10px_50px_-12px_rgba(0,0,0,0.05)] hover:border-cyan-500/30 transition-all cursor-pointer text-card-foreground"
        >
          <div className="absolute top-0 right-0 size-20 bg-cyan-500/5 rounded-bl-full group-hover:bg-cyan-500/10 transition-all" />
          <div className="flex items-start justify-between">
            <div className="space-y-3">
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">OS em Andamento</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-black text-cyan-500 dark:text-cyan-450 tracking-tight">{activeOrdersCount}</span>
                <span className="text-[10px] text-muted-foreground font-medium">ativas</span>
              </div>
            </div>
            <div className="size-9 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-500 border border-cyan-500/20">
              <Wrench className="size-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-[11px] text-muted-foreground border-t border-dashed border-border pt-3">
            <Link href="/panel/orders/kanban" className="flex items-center gap-1 hover:text-cyan-500 transition-colors">
              Acessar Quadro Kanban
              <ArrowRight className="size-3 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </motion.div>

        {/* KPI 2: Monthly Revenue */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="relative group overflow-hidden bg-card p-5 rounded-3xl border border-border/50 shadow-[0_10px_50px_-12px_rgba(0,0,0,0.05)] hover:border-emerald-500/30 transition-all cursor-pointer text-card-foreground"
        >
          <div className="absolute top-0 right-0 size-20 bg-emerald-500/5 rounded-bl-full group-hover:bg-emerald-500/10 transition-all" />
          <div className="flex items-start justify-between">
            <div className="space-y-3">
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Faturamento Mensal</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-emerald-500 dark:text-emerald-400 tracking-tight">
                  {formatCurrency(monthlyRevenue).replace("R$", "")}
                </span>
                <span className="text-[10px] text-muted-foreground font-medium">BRL</span>
              </div>
            </div>
            <div className="size-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20">
              <DollarSign className="size-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-[11px] text-muted-foreground border-t border-dashed border-border pt-3">
            <span className="text-muted-foreground">Apenas OS finalizadas e pagas</span>
          </div>
        </motion.div>

        {/* KPI 3: Average Ticket */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="relative group overflow-hidden bg-card p-5 rounded-3xl border border-border/50 shadow-[0_10px_50px_-12px_rgba(0,0,0,0.05)] hover:border-amber-500/30 transition-all cursor-pointer text-card-foreground"
        >
          <div className="absolute top-0 right-0 size-20 bg-amber-500/5 rounded-bl-full group-hover:bg-amber-500/10 transition-all" />
          <div className="flex items-start justify-between">
            <div className="space-y-3">
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Ticket Médio por OS</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-amber-500 dark:text-amber-400 tracking-tight">
                  {formatCurrency(ticketMedio).replace("R$", "")}
                </span>
                <span className="text-[10px] text-muted-foreground font-medium">BRL</span>
              </div>
            </div>
            <div className="size-9 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20">
              <TrendingUp className="size-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-[11px] text-muted-foreground border-t border-dashed border-border pt-3">
            <span className="text-muted-foreground">Média geral do pátio</span>
          </div>
        </motion.div>

        {/* KPI 4: Low Stock Alert */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          className={cn(
            "relative group overflow-hidden bg-card p-5 rounded-3xl border transition-all cursor-pointer shadow-[0_10px_50px_-12px_rgba(0,0,0,0.05)] text-card-foreground",
            lowStockCount > 0 
              ? "border-red-500/20 hover:border-red-500/40 shadow-red-500/5" 
              : "border-border/50 hover:border-emerald-500/30"
          )}
        >
          <div className={cn(
            "absolute top-0 right-0 size-20 rounded-bl-full transition-all",
            lowStockCount > 0 ? "bg-red-500/5 group-hover:bg-red-500/10" : "bg-zinc-500/5"
          )} />
          <div className="flex items-start justify-between">
            <div className="space-y-3">
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Estoque Crítico</span>
              <div className="flex items-baseline gap-1.5">
                <span className={cn(
                  "text-3xl font-black tracking-tight",
                  lowStockCount > 0 ? "text-red-500 dark:text-red-400" : "text-foreground"
                )}>
                  {lowStockCount}
                </span>
                <span className="text-[10px] text-muted-foreground font-medium">itens</span>
              </div>
            </div>
            <div className={cn(
              "size-9 rounded-xl flex items-center justify-center border",
              lowStockCount > 0 
                ? "bg-red-500/10 text-red-500 border-red-500/20 animate-pulse" 
                : "bg-muted text-muted-foreground border-border"
            )}>
              <AlertTriangle className="size-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-[11px] text-muted-foreground border-t border-dashed border-border pt-3">
            <Link href="/panel/inventory/parts" className="flex items-center gap-1 hover:text-red-500 transition-colors">
              Visualizar Inventário
              <ArrowRight className="size-3 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Section: Status breakdown & Low stock list - 6 Columns */}
        <section className="lg:col-span-6 space-y-6">
          
          {/* Status Breakdown Panel */}
          <div className="bg-card rounded-3xl shadow-[0_10px_50px_-12px_rgba(0,0,0,0.05)] border border-border/50 overflow-hidden text-card-foreground p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-dashed border-border">
              <h3 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                <Activity className="size-4 text-emerald-500" />
                Status do Pátio
              </h3>
              <span className="inline-flex items-center bg-emerald-500/10 text-emerald-500 px-2.5 py-0.5 rounded-none border border-emerald-500/20 text-[10px] font-bold geist-mono">
                {totalOrders} OS no total
              </span>
            </div>

            <div className="space-y-3.5">
              {Object.entries(statusCounts).map(([statusKey, count]) => {
                const cfg = statusConfig[statusKey as keyof typeof statusConfig] || { label: statusKey, text: "text-muted-foreground", bar: "bg-zinc-400" };
                const pct = totalOrders > 0 ? (count / totalOrders) * 100 : 0;
                
                return (
                  <div key={statusKey} className="space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-foreground font-semibold">{cfg.label}</span>
                      <div className="flex items-center gap-2">
                        <span className={cn("font-bold", cfg.text)}>{count} OS</span>
                        <span className="text-[10px] text-muted-foreground">({pct.toFixed(0)}%)</span>
                      </div>
                    </div>
                    
                    <div className="h-2 w-full bg-muted/50 rounded-full overflow-hidden border border-border/20">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        className={cn("h-full rounded-full", cfg.bar)}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Low Stock Alerts list */}
          {lowStockCount > 0 && (
            <div className="bg-red-500/5 dark:bg-red-500/10 border border-red-500/15 p-5 rounded-3xl space-y-3.5 shadow-xs text-foreground">
              <div className="flex items-center gap-2 text-red-500 dark:text-red-400 pb-2 border-b border-dashed border-red-500/10">
                <ShieldAlert className="size-5 text-red-500 animate-pulse" />
                <h3 className="text-xs font-bold uppercase tracking-wider">
                  Alertas de Reabastecimento
                </h3>
              </div>

              <div className="divide-y divide-dashed divide-red-500/15">
                {lowStockParts.map(part => (
                  <div key={part.id} className="py-2.5 flex items-center justify-between text-xs font-medium">
                    <div className="grid">
                      <span className="font-bold text-foreground uppercase text-[11px]">{part.name}</span>
                      <span className="text-[9px] text-muted-foreground">
                        SKU: {part.sku || "N/A"} · {part.brand || "Sem Marca"}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-red-500 font-bold">
                        {part.quantity} / {part.minQuantity}
                      </div>
                      <span className="text-[9px] text-muted-foreground uppercase tracking-tight">restantes</span>
                    </div>
                  </div>
                ))}
              </div>
              
              <Link href="/panel/inventory/parts">
                <Button className="w-full mt-2 py-2 bg-red-500/10 hover:bg-red-500/15 text-red-500 dark:text-red-400 font-bold uppercase text-[9px] rounded-none border border-red-500/20 transition-all active:scale-98">
                  Ir para Estoque de Peças
                </Button>
              </Link>
            </div>
          )}
        </section>

        {/* Right Section: Recent OS List - 6 Columns */}
        <section className="lg:col-span-6 space-y-6">
          <div className="bg-card rounded-3xl shadow-[0_10px_50px_-12px_rgba(0,0,0,0.05)] border border-border/50 overflow-hidden text-card-foreground p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-dashed border-border">
              <h3 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                <FileText className="size-4 text-emerald-500" />
                Últimas Ordens de Serviço
              </h3>
              <Link href="/panel/orders">
                <Button className="text-[10px] uppercase font-bold text-emerald-500 hover:underline flex items-center gap-1 group">
                  Ver Todas
                  <ArrowRight className="size-3 group-hover:translate-x-0.5 transition-transform" />
                </Button>
              </Link>
            </div>

            <div className="space-y-3">
              {recentOrders.length > 0 ? (
                recentOrders.map(order => {
                  const cfg = statusConfig[order.status as keyof typeof statusConfig] || { label: order.status, bg: "bg-zinc-500/10", border: "border-zinc-500/20", text: "text-zinc-500" };
                  
                  return (
                    <div 
                      key={order.id}
                      className="group/item flex items-center justify-between p-3 bg-muted/20 hover:bg-muted/30 border border-border/50 rounded-2xl transition-all hover:-translate-y-0.5 shadow-xs text-foreground"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-xs text-foreground font-mono tracking-tighter">
                            #{String(order.osNumber).padStart(4, "0")}
                          </span>
                          <span className={cn(
                            "text-[8px] font-black uppercase px-2 py-0.5 border rounded-full",
                            cfg.bg, cfg.border, cfg.text
                          )}>
                            {cfg.label}
                          </span>
                        </div>
                        
                        <div className="grid text-xs">
                          <span className="font-bold text-foreground uppercase tracking-tight">
                            {order.customer.name}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {order.vehicle.brand} {order.vehicle.model} · <span className="text-foreground/80 font-bold font-mono">{formatPlate(order.vehicle.plate)}</span>
                          </span>
                        </div>
                      </div>

                      <div className="text-right flex flex-col items-end gap-1.5">
                        <span className="text-xs font-black text-emerald-500 font-mono">
                          {formatCurrency(order.totalPrice)}
                        </span>
                        
                        <Link href="/panel/orders">
                          <Button className="text-[9px] font-bold uppercase text-muted-foreground hover:text-foreground border border-border px-2.5 py-1 rounded-none transition-all bg-card hover:bg-muted/40">
                            Acessar
                          </Button>
                        </Link>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-12 border border-dashed border-border rounded-2xl">
                  <Wrench className="size-8 text-muted-foreground mx-auto mb-2 animate-spin" />
                  <p className="text-xs uppercase tracking-wider text-muted-foreground italic">
                    Nenhuma Ordem de Serviço cadastrada.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

    </div>
  );
}

