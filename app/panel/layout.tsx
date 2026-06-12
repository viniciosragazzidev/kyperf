import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { getSession } from "@/lib/get-session"
import { redirect } from "next/navigation"
import InteractiveBg from "@/components/landing/interactive-bg"

export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="[--header-height:calc(var(--spacing)*14)] relative">
      <InteractiveBg />
      <SidebarProvider className="flex flex-col z-10">
        <SiteHeader />
        <div className="flex flex-1">
          <AppSidebar />
          <SidebarInset className="min-w-0 overflow-hidden bg-background/40 backdrop-blur-xs">{children}</SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  )
}
