import { NextResponse } from "next/server";
import { getSession } from "@/lib/get-session";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";

export async function GET() {
  try {
    const reqHeaders = await headers();
    const cookieHeader = reqHeaders.get("cookie") || "";
    console.log("[Status API] Received request. Cookie header length:", cookieHeader.length);
    console.log("[Status API] Host header:", reqHeaders.get("host"));
    console.log("[Status API] X-Forwarded-Proto:", reqHeaders.get("x-forwarded-proto"));

    const session = await getSession();
    console.log("[Status API] getSession() result:", session ? "Session active" : "No session");

    if (!session || !session.user) {
      return NextResponse.json({ authenticated: false, onboardingCompleted: false });
    }

    const userId = session.user.id;
    console.log("[Status API] Querying dbUser for userId:", userId);
    
    const dbUser = await db.query.user.findFirst({
      where: (u, { eq }) => eq(u.id, userId),
    });

    console.log("[Status API] dbUser found:", dbUser ? "Yes" : "No", "tenantId:", dbUser?.tenantId);

    if (!dbUser || !dbUser.tenantId) {
      return NextResponse.json({ authenticated: true, onboardingCompleted: false });
    }

    const tenant = await db.query.tenants.findFirst({
      where: (t, { eq }) => eq(t.id, dbUser.tenantId!),
    });

    console.log("[Status API] Tenant found:", tenant ? "Yes" : "No", "onboardingCompleted:", tenant?.onboardingCompleted);

    return NextResponse.json({
      authenticated: true,
      onboardingCompleted: !!tenant?.onboardingCompleted
    });
  } catch (error: any) {
    console.error("[Status API] Erro no check de onboarding:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
