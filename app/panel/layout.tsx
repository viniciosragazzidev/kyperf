import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { getSession } from "@/lib/get-session"
import { redirect } from "next/navigation"
import InteractiveBg from "@/components/landing/interactive-bg"
import { ScrollArea } from "@/components/ui/scroll-area"

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
    <div className="[--header-height:calc(var(--spacing)*14)] relative h-screen overflow-hidden flex flex-col">
      <InteractiveBg />
      <SidebarProvider className="flex flex-col flex-1 overflow-hidden z-10">
        <SiteHeader />
        <div className="flex flex-1 overflow-hidden">
          <AppSidebar />
          <SidebarInset className="min-w-0 overflow-hidden bg-background dark:bg-background/40 dark:backdrop-blur-xs flex flex-col flex-1">
            <ScrollArea className="flex-1 w-full h-full" data-slot="panel-page-scroll-area">
              {children}
            </ScrollArea>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  )
}
