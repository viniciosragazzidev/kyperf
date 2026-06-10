"use client"

import * as React from "react"
import {
  Settings,
  Smile,
  User,
  Plus,
  Wrench,
  Users,
  Package,
  LayoutDashboard,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { signOut } from "@/lib/auth-client"

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command"

export function CommandBar() {
  const [open, setOpen] = React.useState(false)
  const router = useRouter()

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }
    const handleToggle = () => {
      setOpen((open) => !open)
    }

    document.addEventListener("keydown", down)
    window.addEventListener("toggle-command-bar", handleToggle)
    return () => {
      document.removeEventListener("keydown", down)
      window.removeEventListener("toggle-command-bar", handleToggle)
    }
  }, [])

  const runCommand = React.useCallback((command: () => void) => {
    setOpen(false)
    command()
  }, [])

  return (
    <>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Digite um comando ou pesquise..." />
        <CommandList>
          <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
          <CommandGroup heading="Sugestões">
            <CommandItem onSelect={() => runCommand(() => router.push("/panel"))}>
              <LayoutDashboard className="mr-2 h-4 w-4" />
              <span>Dashboard</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push("/panel/customers"))}>
              <Users className="mr-2 h-4 w-4" />
              <span>Clientes</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push("/panel/orders"))}>
              <Wrench className="mr-2 h-4 w-4" />
              <span>Ordens de Serviço</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push("/panel/inventory/parts"))}>
              <Package className="mr-2 h-4 w-4" />
              <span>Estoque de Peças</span>
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Ações">
            <CommandItem onSelect={() => runCommand(() => router.push("/panel/orders/new"))}>
              <Plus className="mr-2 h-4 w-4" />
              <span>Nova Ordem de Serviço</span>
              <CommandShortcut>⌘N</CommandShortcut>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push("/panel/customers?new=true"))}>
              <Plus className="mr-2 h-4 w-4" />
              <span>Novo Cliente</span>
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Configurações">
            <CommandItem onSelect={() => runCommand(() => router.push("/panel/settings/workshop"))}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Oficina</span>
              <CommandShortcut>⌘S</CommandShortcut>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push("/panel/settings/whatsapp"))}>
              <Smile className="mr-2 h-4 w-4" />
              <span>WhatsApp Config</span>
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Conta">
            <CommandItem onSelect={() => runCommand(() => signOut({ fetchOptions: { onSuccess: () => router.push("/login") } }))}>
              <User className="mr-2 h-4 w-4" />
              <span>Sair da Conta</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  )
}
