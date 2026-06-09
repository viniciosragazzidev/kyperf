"use server"

import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "./auth-helper";

const getAuthenticatedUser = requireAuth;

// 1. Obter serviços cadastrados com a contagem e lista de sobregravações e peças associadas
export async function getServicesAction() {
  try {
    const user = await getAuthenticatedUser();
    if (!user.tenantId) {
      throw new Error("Usuário não possui empresa vinculada.");
    }

    // Busca serviços do tenant
    const services = await db.query.servicesCatalog.findMany({
      where: (s, { eq }) => eq(s.tenantId, user.tenantId!),
    });

    // Busca sobregravações do tenant
    const overrides = await db.query.servicePriceOverrides.findMany({
      where: (o, { eq }) => eq(o.tenantId, user.tenantId!),
    });

    // Busca as peças vinculadas aos serviços por meio de um Inner Join
    const servicePartsList = await db
      .select({
        id: schema.serviceParts.id,
        serviceId: schema.serviceParts.serviceId,
        partId: schema.serviceParts.partId,
        quantity: schema.serviceParts.quantity,
        partName: schema.partsInventory.name,
        partBrand: schema.partsInventory.brand,
        partSku: schema.partsInventory.sku,
        partSalePrice: schema.partsInventory.salePrice,
      })
      .from(schema.serviceParts)
      .innerJoin(schema.partsInventory, eq(schema.serviceParts.partId, schema.partsInventory.id))
      .where(eq(schema.serviceParts.tenantId, user.tenantId!));

    const servicesWithOverridesAndParts = services.map(s => {
      const serviceOverrides = overrides.filter(o => o.serviceId === s.id);
      const serviceLinkedParts = servicePartsList.filter(p => p.serviceId === s.id);
      return {
        ...s,
        overridesCount: serviceOverrides.length,
        overrides: serviceOverrides,
        parts: serviceLinkedParts,
      };
    });

    return { success: true, data: servicesWithOverridesAndParts };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 2. Criar serviço
interface CreateServiceInput {
  name: string;
  description?: string;
  estimatedTimeMinutes: number;
  basePrice: string;
}
export async function createServiceAction(input: CreateServiceInput) {
  try {
    const user = await getAuthenticatedUser();
    if (!user.tenantId) {
      throw new Error("Usuário não possui empresa vinculada.");
    }

    const [newService] = await db.insert(schema.servicesCatalog).values({
      tenantId: user.tenantId,
      name: input.name,
      description: input.description || null,
      estimatedTimeMinutes: input.estimatedTimeMinutes,
      basePrice: input.basePrice,
    }).returning();

    return { success: true, data: newService };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 3. Editar serviço
interface UpdateServiceInput {
  id: string;
  name: string;
  description?: string;
  estimatedTimeMinutes: number;
  basePrice: string;
}
export async function updateServiceAction(input: UpdateServiceInput) {
  try {
    const user = await getAuthenticatedUser();
    if (!user.tenantId) {
      throw new Error("Usuário não possui empresa vinculada.");
    }

    const [updatedService] = await db.update(schema.servicesCatalog)
      .set({
        name: input.name,
        description: input.description || null,
        estimatedTimeMinutes: input.estimatedTimeMinutes,
        basePrice: input.basePrice,
      })
      .where(
        and(
          eq(schema.servicesCatalog.id, input.id),
          eq(schema.servicesCatalog.tenantId, user.tenantId)
        )
      )
      .returning();

    return { success: true, data: updatedService };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 4. Deletar serviço
export async function deleteServiceAction(id: string) {
  try {
    const user = await getAuthenticatedUser();
    if (!user.tenantId) {
      throw new Error("Usuário não possui empresa vinculada.");
    }

    await db.delete(schema.servicesCatalog)
      .where(
        and(
          eq(schema.servicesCatalog.id, id),
          eq(schema.servicesCatalog.tenantId, user.tenantId)
        )
      );

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 5. Salvar (criar ou editar) sobregravação de preço de serviço
interface SaveOverrideInput {
  serviceId: string;
  carName: string;
  price: string;
  id?: string;
}
export async function saveServiceOverrideAction(input: SaveOverrideInput) {
  try {
    const user = await getAuthenticatedUser();
    if (!user.tenantId) {
      throw new Error("Usuário não possui empresa vinculada.");
    }

    if (input.id) {
      const [updated] = await db.update(schema.servicePriceOverrides)
        .set({
          carName: input.carName,
          price: input.price,
        })
        .where(
          and(
            eq(schema.servicePriceOverrides.id, input.id),
            eq(schema.servicePriceOverrides.tenantId, user.tenantId)
          )
        )
        .returning();
      return { success: true, data: updated };
    } else {
      const [inserted] = await db.insert(schema.servicePriceOverrides).values({
        tenantId: user.tenantId,
        serviceId: input.serviceId,
        carName: input.carName,
        price: input.price,
      }).returning();
      return { success: true, data: inserted };
    }
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 6. Deletar sobregravação de preço de serviço
export async function deleteServiceOverrideAction(id: string) {
  try {
    const user = await getAuthenticatedUser();
    if (!user.tenantId) {
      throw new Error("Usuário não possui empresa vinculada.");
    }

    await db.delete(schema.servicePriceOverrides)
      .where(
        and(
          eq(schema.servicePriceOverrides.id, id),
          eq(schema.servicePriceOverrides.tenantId, user.tenantId)
        )
      );

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 7. Associar uma peça ao serviço do catálogo
export async function linkPartToServiceAction(serviceId: string, partId: string, quantity: number) {
  try {
    const user = await getAuthenticatedUser();
    if (!user.tenantId) {
      throw new Error("Usuário não autorizado.");
    }

    // Verifica se a associação já existe
    const existing = await db.query.serviceParts.findFirst({
      where: (sp, { and, eq }) => and(
        eq(sp.serviceId, serviceId),
        eq(sp.partId, partId),
        eq(sp.tenantId, user.tenantId!)
      )
    });

    if (existing) {
      // Se já existe, atualiza a quantidade somando
      await db
        .update(schema.serviceParts)
        .set({ quantity: existing.quantity + quantity })
        .where(eq(schema.serviceParts.id, existing.id));
    } else {
      // Caso contrário, cria um novo vínculo
      await db.insert(schema.serviceParts).values({
        tenantId: user.tenantId,
        serviceId,
        partId,
        quantity
      });
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 8. Remover associação de peça do serviço do catálogo
export async function unlinkPartFromServiceAction(id: string) {
  try {
    const user = await getAuthenticatedUser();
    if (!user.tenantId) {
      throw new Error("Usuário não autorizado.");
    }

    await db.delete(schema.serviceParts)
      .where(
        and(
          eq(schema.serviceParts.id, id),
          eq(schema.serviceParts.tenantId, user.tenantId)
        )
      );

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

interface FullServiceInput {
  id?: string;
  name: string;
  description?: string;
  estimatedTimeMinutes: number;
  basePrice: string;
  parts: Array<{ partId: string; quantity: number }>;
  overrides: Array<{ carName: string; price: string }>;
}

export async function saveFullServiceAction(input: FullServiceInput) {
  try {
    const user = await getAuthenticatedUser();
    if (!user.tenantId) {
      throw new Error("Usuário não possui empresa vinculada.");
    }

    const result = await db.transaction(async (tx) => {
      let serviceId = input.id;

      if (serviceId) {
        // 1. Atualizar o serviço
        await tx.update(schema.servicesCatalog)
          .set({
            name: input.name,
            description: input.description || null,
            estimatedTimeMinutes: input.estimatedTimeMinutes,
            basePrice: input.basePrice,
          })
          .where(
            and(
              eq(schema.servicesCatalog.id, serviceId),
              eq(schema.servicesCatalog.tenantId, user.tenantId!)
            )
          );

        // 2. Limpar peças antigas vinculadas
        await tx.delete(schema.serviceParts)
          .where(
            and(
              eq(schema.serviceParts.serviceId, serviceId),
              eq(schema.serviceParts.tenantId, user.tenantId!)
            )
          );

        // 3. Limpar sobregravações antigas
        await tx.delete(schema.servicePriceOverrides)
          .where(
            and(
              eq(schema.servicePriceOverrides.serviceId, serviceId),
              eq(schema.servicePriceOverrides.tenantId, user.tenantId!)
            )
          );
      } else {
        // Criar novo serviço
        const [newService] = await tx.insert(schema.servicesCatalog)
          .values({
            tenantId: user.tenantId!,
            name: input.name,
            description: input.description || null,
            estimatedTimeMinutes: input.estimatedTimeMinutes,
            basePrice: input.basePrice,
          })
          .returning();

        if (!newService) {
          throw new Error("Erro ao criar o serviço.");
        }
        serviceId = newService.id;
      }

      // 4. Inserir peças vinculadas
      if (input.parts && input.parts.length > 0) {
        for (const p of input.parts) {
          await tx.insert(schema.serviceParts).values({
            tenantId: user.tenantId!,
            serviceId: serviceId,
            partId: p.partId,
            quantity: p.quantity,
          });
        }
      }

      // 5. Inserir sobregravações
      if (input.overrides && input.overrides.length > 0) {
        for (const o of input.overrides) {
          await tx.insert(schema.servicePriceOverrides).values({
            tenantId: user.tenantId!,
            serviceId: serviceId,
            carName: o.carName,
            price: o.price,
          });
        }
      }

      return { id: serviceId };
    });

    return { success: true, data: result };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

