"use client"

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardList, PlusCircle, Package, Users, MessageCircle, LogOut, Wrench, FileText, Car } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { ScrollArea } from "@/components/ui/scroll-area";

const navItems = [
  {
    group: "OFICINA",
    items: [
      { href: "/lite/patio",    icon: ClipboardList, label: "Pátio de Carros" },
      { href: "/lite/ordens",   icon: FileText,      label: "Ordens de Serviço" },
      { href: "/lite/nova-os",  icon: PlusCircle,    label: "Nova O.S." },
    ]
  },
  {
    group: "CADASTROS",
    items: [
      { href: "/lite/pecas",    icon: Package,       label: "Peças" },
      { href: "/lite/servicos", icon: Wrench,        label: "Serviços" },
      { href: "/lite/clientes", icon: Users,         label: "Clientes" },
      { href: "/lite/veiculos", icon: Car,           label: "Veículos" },
    ]
  },
  {
    group: "SISTEMA",
    items: [
      { href: "/lite/whatsapp", icon: MessageCircle, label: "WhatsApp" },
    ]
  }
];

export default function LiteSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await authClient.signOut();
    router.push("/login");
  };

  return (
    <aside className="w-72 shrink-0 bg-sidebar border-r border-sidebar-border flex flex-col h-full text-sidebar-foreground">
      {/* Logo & Switch */}
      <div className="px-6 py-5 border-b border-sidebar-border/60 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
              <Wrench className="size-4 text-primary" />
            </div>
            <div>
              <div className="text-sidebar-foreground font-black text-base leading-none tracking-widest font-mono">KYPERFIX</div>
              <div className="text-primary text-[10px] font-bold mt-0.5 tracking-widest font-mono">· LITE ·</div>
            </div>
          </div>
          <AnimatedThemeToggler className="flex size-9 items-center justify-center rounded-xl border border-sidebar-border bg-sidebar-accent/50 hover:bg-sidebar-accent text-sidebar-foreground hover:text-sidebar-foreground transition-all duration-150" />
        </div>

        {/* Switch Mode Toggle */}
        <div className="bg-sidebar-accent/50 p-1 rounded-xl flex border border-sidebar-border/60">
          <div className="flex-1 py-1.5 rounded-lg text-center text-[10px] font-black font-mono bg-background text-primary border border-border/10 shadow-xs">
            LITE
          </div>
          <Link
            href="/panel"
            className="flex-1 py-1.5 rounded-lg text-center text-[10px] font-black font-mono text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors"
          >
            COMPLETO
          </Link>
        </div>
      </div>

      {/* Nav */}
      <ScrollArea className="flex-1 px-3 py-5">
        <nav className="space-y-5">
          {navItems.map(({ group, items }) => (
            <div key={group}>
              <p className="text-sidebar-foreground/40 text-[10px] font-bold tracking-[0.2em] font-mono mb-2 px-3">
                {group}
              </p>
              <div className="space-y-0.5">
                {items.map(({ href, icon: Icon, label }) => {
                  const active = pathname === href || pathname.startsWith(href + "/");
                  return (
                    <Link
                      key={href}
                      href={href}
                      className={`
                        flex items-center gap-3 px-3 py-3.5 rounded-xl text-base font-semibold
                        transition-all duration-150 min-h-[52px]
                        ${active
                          ? "bg-primary/10 text-primary border border-primary/20 font-bold"
                          : "text-sidebar-foreground/75 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground border border-transparent"
                        }
                      `}
                    >
                      <Icon className={`size-5 shrink-0 ${active ? "text-primary" : "text-sidebar-foreground/45"}`} strokeWidth={2} />
                      <span className="text-[15px] font-mono">{label}</span>
                      {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </ScrollArea>

      {/* Footer */}
      <div className="px-3 pb-5 border-t border-sidebar-border pt-3">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-3.5 rounded-xl w-full text-sidebar-foreground/60
                     hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-all min-h-[52px] font-mono border border-transparent"
        >
          <LogOut className="size-5 shrink-0" />
          <span className="text-[15px]">Sair do Sistema</span>
        </button>
      </div>
    </aside>
  );
}
