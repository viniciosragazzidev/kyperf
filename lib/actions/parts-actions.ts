"use server"

import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "./auth-helper";

const getAuthenticatedUser = requireAuth;

// 1. Obter peças cadastradas com a contagem e lista de sobregravações
export async function getPartsAction() {
  try {
    const user = await getAuthenticatedUser();
    if (!user.tenantId) {
      throw new Error("Usuário não possui empresa vinculada.");
    }

    // Busca as peças do tenant
    const parts = await db.query.partsInventory.findMany({
      where: (p, { eq }) => eq(p.tenantId, user.tenantId!),
    });

    // Busca sobregravações de peças do tenant
    const overrides = await db.query.partPriceOverrides.findMany({
      where: (o, { eq }) => eq(o.tenantId, user.tenantId!),
    });

    const partsWithOverrides = parts.map(p => {
      const partOverrides = overrides.filter(o => o.partId === p.id);
      return {
        ...p,
        overridesCount: partOverrides.length,
        overrides: partOverrides,
      };
    });

    return { success: true, data: partsWithOverrides };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 2. Criar peça
interface CreatePartInput {
  name: string;
  brand?: string;
  sku?: string;
  quantity: number;
  minQuantity: number;
  costPrice: string;
  salePrice: string;
  location?: string;
  compatibleCars?: string;
  dimension?: string;
  size?: string;
  weight?: string;
}
export async function createPartAction(input: CreatePartInput) {
  try {
    const user = await getAuthenticatedUser();
    if (!user.tenantId || !user.branchId) {
      throw new Error("Usuário não possui filial ativa para lançar estoque.");
    }

    const [newPart] = await db.insert(schema.partsInventory).values({
      tenantId: user.tenantId,
      branchId: user.branchId,
      name: input.name,
      brand: input.brand || null,
      sku: input.sku || null,
      quantity: input.quantity,
      minQuantity: input.minQuantity,
      costPrice: input.costPrice,
      salePrice: input.salePrice,
      location: input.location || null,
      compatibleCars: input.compatibleCars || null,
      dimension: input.dimension || null,
      size: input.size || null,
      weight: input.weight || null,
    }).returning();

    return { success: true, data: newPart };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 3. Editar peça
interface UpdatePartInput {
  id: string;
  name: string;
  brand?: string;
  sku?: string;
  quantity: number;
  minQuantity: number;
  costPrice: string;
  salePrice: string;
  location?: string;
  compatibleCars?: string;
  dimension?: string;
  size?: string;
  weight?: string;
}
export async function updatePartAction(input: UpdatePartInput) {
  try {
    const user = await getAuthenticatedUser();
    if (!user.tenantId) {
      throw new Error("Usuário não possui empresa vinculada.");
    }

    const [updatedPart] = await db.update(schema.partsInventory)
      .set({
        name: input.name,
        brand: input.brand || null,
        sku: input.sku || null,
        quantity: input.quantity,
        minQuantity: input.minQuantity,
        costPrice: input.costPrice,
        salePrice: input.salePrice,
        location: input.location || null,
        compatibleCars: input.compatibleCars || null,
        dimension: input.dimension || null,
        size: input.size || null,
        weight: input.weight || null,
      })
      .where(
        and(
          eq(schema.partsInventory.id, input.id),
          eq(schema.partsInventory.tenantId, user.tenantId)
        )
      )
      .returning();

    return { success: true, data: updatedPart };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 4. Deletar peça
export async function deletePartAction(id: string) {
  try {
    const user = await getAuthenticatedUser();
    if (!user.tenantId) {
      throw new Error("Usuário não possui empresa vinculada.");
    }

    await db.delete(schema.partsInventory)
      .where(
        and(
          eq(schema.partsInventory.id, id),
          eq(schema.partsInventory.tenantId, user.tenantId)
        )
      );

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 5. Salvar (criar ou editar) sobregravação de preço de peça
interface SavePartOverrideInput {
  partId: string;
  carName: string;
  price: string;
  id?: string;
}
export async function savePartOverrideAction(input: SavePartOverrideInput) {
  try {
    const user = await getAuthenticatedUser();
    if (!user.tenantId) {
      throw new Error("Usuário não possui empresa vinculada.");
    }

    if (input.id) {
      const [updated] = await db.update(schema.partPriceOverrides)
        .set({
          carName: input.carName,
          price: input.price,
        })
        .where(
          and(
            eq(schema.partPriceOverrides.id, input.id),
            eq(schema.partPriceOverrides.tenantId, user.tenantId)
          )
        )
        .returning();
      return { success: true, data: updated };
    } else {
      const [inserted] = await db.insert(schema.partPriceOverrides).values({
        tenantId: user.tenantId,
        partId: input.partId,
        carName: input.carName,
        price: input.price,
      }).returning();
      return { success: true, data: inserted };
    }
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 6. Deletar sobregravação de preço de peça
export async function deletePartOverrideAction(id: string) {
  try {
    const user = await getAuthenticatedUser();
    if (!user.tenantId) {
      throw new Error("Usuário não possui empresa vinculada.");
    }

    await db.delete(schema.partPriceOverrides)
      .where(
        and(
          eq(schema.partPriceOverrides.id, id),
          eq(schema.partPriceOverrides.tenantId, user.tenantId)
        )
      );

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
