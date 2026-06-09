import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";

export async function requireAuth() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || !session.user) {
    throw new Error("Não autorizado. Faça login novamente.");
  }

  const userId = session.user.id;
  const dbUser = await db.query.user.findFirst({
    where: (user, { eq }) => eq(user.id, userId),
  });

  if (!dbUser) {
    throw new Error("Usuário não cadastrado.");
  }

  return dbUser;
}

export async function requireRole(allowedRoles: ("OWNER" | "MANAGER" | "RECEPTOR" | "MECHANIC")[]) {
  const user = await requireAuth();

  if (!allowedRoles.includes(user.role)) {
    throw new Error("Acesso negado. Você não possui permissão para executar esta ação.");
  }

  return user;
}
