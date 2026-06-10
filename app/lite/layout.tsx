import { getSession } from "@/lib/get-session";
import { redirect } from "next/navigation";
import LiteSidebar from "@/components/lite/lite-sidebar";

export default async function LiteLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="flex h-screen bg-[#F8FAFC] font-sans overflow-hidden">
      <LiteSidebar />
      <main className="flex-1 overflow-y-auto bg-white">
        {children}
      </main>
    </div>
  );
}
