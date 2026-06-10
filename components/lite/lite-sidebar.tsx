"use client"

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardList, PlusCircle, Package, Users, MessageCircle, LogOut, Wrench, FileText, Car } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

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
    <aside className="w-72 shrink-0 bg-[#F8FAFC] border-r border-gray-200 flex flex-col h-full">
      {/* Logo & Switch */}
      <div className="px-6 py-5 border-b border-gray-200 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center shrink-0">
              <Wrench className="size-4 text-emerald-600" />
            </div>
            <div>
              <div className="text-gray-900 font-black text-base leading-none tracking-widest font-mono">KYPERFIX</div>
              <div className="text-emerald-600 text-[10px] font-bold mt-0.5 tracking-widest font-mono">· LITE ·</div>
            </div>
          </div>
        </div>

        {/* Switch Mode Toggle */}
        <div className="bg-gray-200/60 p-1 rounded-xl flex border border-gray-200">
          <div className="flex-1 py-1.5 rounded-lg text-center text-[10px] font-black font-mono bg-white text-emerald-700 shadow-sm border border-emerald-200/20">
            LITE
          </div>
          <Link
            href="/panel"
            className="flex-1 py-1.5 rounded-lg text-center text-[10px] font-black font-mono text-gray-500 hover:text-gray-900 transition-colors"
          >
            COMPLETO
          </Link>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-5 space-y-5 overflow-y-auto">
        {navItems.map(({ group, items }) => (
          <div key={group}>
            <p className="text-gray-400 text-[10px] font-bold tracking-[0.2em] font-mono mb-2 px-3">
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
                        ? "bg-emerald-100/50 text-emerald-700 border border-emerald-200"
                        : "text-gray-600 hover:bg-white hover:text-gray-900 border border-transparent"
                      }
                    `}
                  >
                    <Icon className={`size-5 shrink-0 ${active ? "text-emerald-600" : "text-gray-400"}`} strokeWidth={2} />
                    <span className="text-[15px] font-mono">{label}</span>
                    {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-600" />}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 pb-5 border-t border-gray-200 pt-3">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-3.5 rounded-xl w-full text-gray-500
                     hover:bg-white hover:text-gray-900 transition-all min-h-[52px] font-mono border border-transparent"
        >
          <LogOut className="size-5 shrink-0" />
          <span className="text-[15px]">Sair do Sistema</span>
        </button>
      </div>
    </aside>
  );
}
