import { getSession } from "@/lib/get-session";
import { redirect } from "next/navigation";
import LiteLayoutClient from "@/components/lite/lite-layout-client";

export default async function LiteLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <LiteLayoutClient>{children}</LiteLayoutClient>
  );
}
