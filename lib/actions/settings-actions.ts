"use server"

import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "./auth-helper";

// 1. Obter configurações da oficina (filial vinculada)
export async function getWorkshopSettingsAction() {
  try {
    const user = await requireAuth();
    if (!user.branchId) {
      throw new Error("Usuário sem filial vinculada.");
    }

    const branch = await db.query.branches.findFirst({
      where: (b, { eq }) => eq(b.id, user.branchId!),
    });

    if (!branch) {
      throw new Error("Filial não encontrada.");
    }

    return { success: true, data: branch };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 2. Atualizar configurações da oficina
interface UpdateWorkshopSettingsInput {
  name: string;
  phone?: string;
  email?: string;
  cnpj?: string;
  address?: string;
}
export async function updateWorkshopSettingsAction(input: UpdateWorkshopSettingsInput) {
  try {
    const user = await requireAuth();
    if (!user.branchId) {
      throw new Error("Usuário sem filial vinculada.");
    }

    const [updated] = await db.update(schema.branches)
      .set({
        name: input.name,
        phone: input.phone || null,
        email: input.email || null,
        cnpj: input.cnpj ? input.cnpj.replace(/\D/g, "") : null,
        address: input.address || null,
      })
      .where(eq(schema.branches.id, user.branchId!))
      .returning();

    return { success: true, data: updated };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
