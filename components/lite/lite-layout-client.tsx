"use client"

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import LiteSidebar from "@/components/lite/lite-sidebar";
import InteractiveBg from "@/components/landing/interactive-bg";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

export default function LiteLayoutClient({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <div className="flex flex-col md:flex-row h-screen w-screen bg-background text-foreground font-sans overflow-hidden relative">
      <InteractiveBg />

      {/* Desktop Sidebar (visible on md and up) */}
      <div className="hidden md:flex h-full shrink-0 z-20">
        <LiteSidebar />
      </div>

      {/* Mobile Header (visible only on mobile/tablet) */}
      <header className="flex md:hidden h-16 w-full items-center justify-between px-4 border-b border-sidebar-border bg-sidebar/80 backdrop-blur-md shrink-0 z-30 text-sidebar-foreground">
        <div className="flex items-center gap-3">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger
              render={
                <Button variant="ghost" size="icon" className="h-10 w-10 shrink-0 hover:bg-sidebar-accent/50">
                  <Menu className="size-6 text-sidebar-foreground" />
                  <span className="sr-only">Menu</span>
                </Button>
              }
            />
            <SheetContent side="left" className="p-0 w-72 bg-sidebar border-r border-sidebar-border" showCloseButton={false}>
              <div className="h-full w-full flex flex-col">
                <LiteSidebar />
              </div>
            </SheetContent>
          </Sheet>
          
          <img src="/logo.svg" alt="KyperFix Logo" className="h-7 w-auto object-contain logo-invert" />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto bg-background dark:bg-background/40 dark:backdrop-blur-xs border-l border-border/40 z-10">
        {children}
      </main>
    </div>
  );
}
