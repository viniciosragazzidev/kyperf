import { getSession } from "@/lib/get-session";
import { redirect } from "next/navigation";
import LiteSidebar from "@/components/lite/lite-sidebar";
import InteractiveBg from "@/components/landing/interactive-bg";

export default async function LiteLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="flex h-screen bg-background text-foreground font-sans overflow-hidden relative">
      <InteractiveBg />
      <LiteSidebar />
      <main className="flex-1 overflow-y-auto bg-background/40 backdrop-blur-xs border-l border-border/40 z-10">
        {children}
      </main>
    </div>
  );
}
