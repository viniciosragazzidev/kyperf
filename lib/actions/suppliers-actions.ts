"use server"

import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "./auth-helper";

// 1. Obter fornecedores cadastrados
export async function getSuppliersAction() {
  try {
    const user = await requireAuth();
    if (!user.tenantId) {
      throw new Error("Usuário não possui empresa vinculada.");
    }

    const list = await db.query.suppliers.findMany({
      where: (s, { eq }) => eq(s.tenantId, user.tenantId!),
      orderBy: (s, { desc }) => desc(s.createdAt),
    });

    return { success: true, data: list };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 2. Criar fornecedor
interface CreateSupplierInput {
  name: string;
  phone?: string;
  email?: string;
  cnpj?: string;
  address?: string;
}
export async function createSupplierAction(input: CreateSupplierInput) {
  try {
    const user = await requireAuth();
    if (!user.tenantId) {
      throw new Error("Usuário não possui empresa vinculada.");
    }

    const [newSupplier] = await db.insert(schema.suppliers).values({
      tenantId: user.tenantId!,
      name: input.name,
      phone: input.phone || null,
      email: input.email || null,
      cnpj: input.cnpj ? input.cnpj.replace(/\D/g, "") : null,
      address: input.address || null,
    }).returning();

    return { success: true, data: newSupplier };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 3. Editar fornecedor
interface UpdateSupplierInput {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  cnpj?: string;
  address?: string;
}
export async function updateSupplierAction(input: UpdateSupplierInput) {
  try {
    const user = await requireAuth();
    if (!user.tenantId) {
      throw new Error("Usuário não possui empresa vinculada.");
    }

    const [updated] = await db.update(schema.suppliers)
      .set({
        name: input.name,
        phone: input.phone || null,
        email: input.email || null,
        cnpj: input.cnpj ? input.cnpj.replace(/\D/g, "") : null,
        address: input.address || null,
      })
      .where(
        and(
          eq(schema.suppliers.id, input.id),
          eq(schema.suppliers.tenantId, user.tenantId!)
        )
      )
      .returning();

    return { success: true, data: updated };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 4. Deletar fornecedor
export async function deleteSupplierAction(id: string) {
  try {
    const user = await requireAuth();
    if (!user.tenantId) {
      throw new Error("Usuário não possui empresa vinculada.");
    }

    await db.delete(schema.suppliers)
      .where(
        and(
          eq(schema.suppliers.id, id),
          eq(schema.suppliers.tenantId, user.tenantId!)
        )
      );

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
