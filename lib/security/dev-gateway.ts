import { cookies } from "next/headers";
import crypto from "crypto";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { user as userTable } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * Checks all three gates of the Triple-Guard Security Protocol.
 * 
 * Gate 1: Corporate Domain Whitelist (Email Verification)
 * Gate 2: Database Persistence Marker (The isDev Flag)
 * Gate 3: Environment Cryptographic Signature (System Secret Hash)
 */
export async function checkDevGatewayAccess(sessionUser: { id: string; email: string } | null | undefined): Promise<boolean> {
  if (!sessionUser) return false;

  // Gate 1: Corporate Domain Whitelist (ends exactly with @kyper or @kyper.com)
  const email = sessionUser.email;
  const isCorporateDomain = email.endsWith("@kyper") || email.endsWith("@kyper.com");
  if (!isCorporateDomain) {
    console.warn(`[Security Gateway] Gate 1 failed: Email ${email} does not end with @kyper or @kyper.com`);
    return false;
  }

  // Gate 2: Database Persistence Marker (isDev flag check in database)
  const dbUser = await db.query.user.findFirst({
    where: eq(userTable.id, sessionUser.id),
    columns: {
      isDev: true
    }
  });

  if (!dbUser || !dbUser.isDev) {
    console.warn(`[Security Gateway] Gate 2 failed: User ${sessionUser.id} is not marked as dev in database`);
    return false;
  }

  // Gate 3: Environment Cryptographic Signature (System Secret Hash)
  const secret = process.env.DEV_GATEWAY_SECRET;
  if (!secret) {
    console.error(`[Security Gateway] Gate 3 failed: DEV_GATEWAY_SECRET is not configured on the server`);
    return false;
  }

  // Compute expected dynamic signature: HMAC-SHA256 of the user ID using DEV_GATEWAY_SECRET
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(sessionUser.id)
    .digest("hex");

  const cookieStore = await cookies();
  const signatureCookie = cookieStore.get("kyper_dev_signature")?.value;

  if (!signatureCookie || signatureCookie !== expectedSignature) {
    console.warn(`[Security Gateway] Gate 3 failed: Signature mismatch for user ${sessionUser.id}`);
    return false;
  }

  return true;
}

/**
 * Higher-order server check to verify access. If unauthorized, triggers 404 cloak.
 */
export async function verifyDevGatewayOr404(sessionUser: { id: string; email: string } | null | undefined): Promise<void> {
  const isAuthorized = await checkDevGatewayAccess(sessionUser);
  if (!isAuthorized) {
    notFound();
  }
}
