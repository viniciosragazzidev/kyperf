"use client"

import { useRouter } from "next/navigation"
import { HelpCircle } from "lucide-react"
import { toast } from "sonner"
import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Task01Icon,
  Car02Icon,
  UserGroupIcon,
  PackageIcon,
  Invoice01Icon,
  Settings02Icon,
  WrenchIcon,
  ToolsIcon,
} from "@hugeicons/core-free-icons"

const data = {
  user: {
    name: "Mecânico Chefe",
    email: "contato@oficina.com.br",
    avatar: "/avatars/user.jpg",
  },
  navOficina: [
    {
      title: "Ordens de Serviço",
      url: "/panel/orders",
      icon: <HugeiconsIcon icon={Task01Icon} strokeWidth={2} />,
      items: [
        {
          title: "Visão Kanban",
          url: "/panel/orders/kanban",
        },
        {
          title: "Nova OS",
          url: "/panel/orders/new",
        },
        {
          title: "Histórico/Busca",
          url: "/panel/orders",
        },
      ],
    },
    {
      title: "Clientes",
      url: "/panel/customers",
      icon: <HugeiconsIcon icon={UserGroupIcon} strokeWidth={2} />,
    },
    {
      title: "Veículos",
      url: "/panel/vehicles",
      icon: <HugeiconsIcon icon={Car02Icon} strokeWidth={2} />,
    },
    {
      title: "Serviços",
      url: "/panel/services",
      icon: <HugeiconsIcon icon={WrenchIcon} strokeWidth={2} />,
    },
  ],
  navGestao: [
    {
      title: "Estoque",
      url: "/panel/inventory",
      icon: <HugeiconsIcon icon={PackageIcon} strokeWidth={2} />,
      items: [
        {
          title: "Peças & Insumos",
          url: "/panel/inventory/parts",
        },
        {
          title: "Fornecedores",
          url: "/panel/inventory/suppliers",
        },
      ],
    },
    {
      title: "Financeiro",
      url: "/panel/finance",
      icon: <HugeiconsIcon icon={Invoice01Icon} strokeWidth={2} />,
      items: [
        {
          title: "Fluxo de Caixa",
          url: "/panel/finance",
        },
        {
          title: "Contas a Pagar/Receber",
          url: "/panel/finance/accounts",
        },
        {
          title: "Comissões",
          url: "/panel/finance/commissions",
        },
      ],
    },
    {
      title: "Equipe & Oficina",
      url: "/panel/employees",
      icon: <HugeiconsIcon icon={UserGroupIcon} strokeWidth={2} />,
      items: [
        {
          title: "Colaboradores",
          url: "/panel/employees",
        },
        {
          title: "Carga de Trabalho",
          url: "/panel/employees/workload",
        },
      ],
    },
  ],
  navConfig: [
    {
      title: "Ajustes",
      url: "/panel/settings",
      icon: <HugeiconsIcon icon={Settings02Icon} strokeWidth={2} />,
      items: [
        {
          title: "Dados da Oficina",
          url: "/panel/settings/workshop",
        },
        {
          title: "Tabela de Mão de Obra",
          url: "/panel/settings/labor",
        },
        {
          title: "Integração WhatsApp",
          url: "/panel/settings/whatsapp",
        },
      ],
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const router = useRouter()

  const handleResetOnboarding = () => {
    localStorage.removeItem("kyperfix_welcome_shown")
    localStorage.removeItem("kyperfix_demo_mode")
    localStorage.removeItem("kyperfix_dashboard_onboarding_step")
    toast.success("Tour e copiloto reiniciados!")
    router.push("/panel")
    setTimeout(() => {
      window.location.reload()
    }, 500)
  }

  return (
    <Sidebar
      className="top-(--header-height) h-[calc(100svh-var(--header-height))]!"
      {...props}
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<a href="/panel" />}>
              <div className="flex items-center gap-2 justify-start pl-1">
                <HugeiconsIcon icon={ToolsIcon} strokeWidth={2} className="size-5 text-primary shrink-0" />
                <img src="/logo.svg" alt="KyperFix Logo" className="h-8 w-auto object-contain logo-invert" />
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain label="Oficina" items={data.navOficina} />
        <NavMain label="Gestão" items={data.navGestao} />
        <NavMain label="Configurações" items={data.navConfig} />
      </SidebarContent>
      <SidebarFooter className="p-3 gap-2 border-t border-border/40">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleResetOnboarding}
              className="w-full text-[11px] font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/20 h-9 rounded-lg flex items-center justify-start gap-2 pl-3 shadow-none transition-all cursor-pointer"
            >
              <HelpCircle className="size-4 shrink-0 text-amber-500 animate-pulse" />
              <span>Ajuda do Copiloto</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
