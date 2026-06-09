import { NextResponse } from "next/server";
import { getSession } from "@/lib/get-session";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const reqHeaders = await headers();
    const cookieHeader = reqHeaders.get("cookie") || "";
    console.log("[Status API] Received request. Cookie header length:", cookieHeader.length);
    console.log("[Status API] Host header:", reqHeaders.get("host"));
    console.log("[Status API] X-Forwarded-Proto:", reqHeaders.get("x-forwarded-proto"));

    const session = await getSession();
    console.log("[Status API] getSession() result:", session ? "Session active" : "No session");

    let resData = { authenticated: false, onboardingCompleted: false };

    if (session && session.user) {
      const userId = session.user.id;
      console.log("[Status API] Querying dbUser for userId:", userId);
      
      const dbUser = await db.query.user.findFirst({
        where: (u, { eq }) => eq(u.id, userId),
      });

      console.log("[Status API] dbUser found:", dbUser ? "Yes" : "No", "tenantId:", dbUser?.tenantId);

      if (!dbUser || !dbUser.tenantId) {
        resData = { authenticated: true, onboardingCompleted: false };
      } else {
        const tenant = await db.query.tenants.findFirst({
          where: (t, { eq }) => eq(t.id, dbUser.tenantId!),
        });

        console.log("[Status API] Tenant found:", tenant ? "Yes" : "No", "onboardingCompleted:", tenant?.onboardingCompleted);

        resData = {
          authenticated: true,
          onboardingCompleted: !!tenant?.onboardingCompleted
        };
      }
    }

    const response = NextResponse.json(resData);
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");
    return response;

  } catch (error: any) {
    console.error("[Status API] Erro no check de onboarding:", error);
    const errResponse = NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    errResponse.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    errResponse.headers.set("Pragma", "no-cache");
    errResponse.headers.set("Expires", "0");
    return errResponse;
  }
}
