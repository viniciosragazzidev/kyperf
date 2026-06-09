import { NextResponse } from "next/server";
import { getSession } from "@/lib/get-session";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || !session.user) {
      return NextResponse.json({ authenticated: false, onboardingCompleted: false });
    }

    const userId = session.user.id;
    const dbUser = await db.query.user.findFirst({
      where: (u, { eq }) => eq(u.id, userId),
    });

    if (!dbUser || !dbUser.tenantId) {
      return NextResponse.json({ authenticated: true, onboardingCompleted: false });
    }

    const tenant = await db.query.tenants.findFirst({
      where: (t, { eq }) => eq(t.id, dbUser.tenantId!),
    });

    return NextResponse.json({
      authenticated: true,
      onboardingCompleted: !!tenant?.onboardingCompleted
    });
  } catch (error: any) {
    console.error("Erro no check de onboarding:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
