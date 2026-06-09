"use server"

import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth } from "./auth-helper";

// 1. Obter todos os veículos do tenant com dados do proprietário
export async function getVehiclesAction() {
  try {
    const user = await requireAuth();
    if (!user.tenantId) {
      throw new Error("Usuário sem tenant.");
    }

    const vehiclesList = await db.query.vehicles.findMany({
      where: (v, { eq }) => eq(v.tenantId, user.tenantId!),
      with: {
        customer: true,
      },
      orderBy: (v, { desc }) => desc(v.createdAt),
    });

    return { success: true, data: vehiclesList };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 2. Obter detalhes de um veículo com proprietário e histórico de OS
export async function getVehicleDetailsAction(id: string) {
  try {
    const user = await requireAuth();
    if (!user.tenantId) {
      throw new Error("Usuário sem tenant.");
    }

    const vehicle = await db.query.vehicles.findFirst({
      where: (v, { eq, and }) => and(
        eq(v.id, id),
        eq(v.tenantId, user.tenantId!)
      ),
      with: {
        customer: true,
      }
    });

    if (!vehicle) {
      throw new Error("Veículo não encontrado.");
    }

    // Buscar histórico de OS do veículo
    const workOrdersList = await db.query.workOrders.findMany({
      where: (wo, { eq, and }) => and(
        eq(wo.vehicleId, id),
        eq(wo.tenantId, user.tenantId!)
      ),
      orderBy: (wo, { desc }) => desc(wo.createdAt),
      with: {
        items: true,
        mechanic: {
          columns: {
            name: true,
          }
        }
      }
    });

    // Calcular o total de cada OS no histórico
    const ordersWithTotals = workOrdersList.map(order => {
      const itemsTotal = order.items
        .filter(item => item.isApproved === 1)
        .reduce((sum, item) => {
          const price = parseFloat(item.unitSalePrice) || 0;
          return sum + (price * item.quantity);
        }, 0);

      const discount = parseFloat(order.discount || "0") || 0;
      const surcharge = parseFloat(order.surcharge || "0") || 0;
      const orderTotal = Math.max(0, itemsTotal - discount + surcharge);

      return {
        ...order,
        totalPrice: orderTotal
      };
    });

    return {
      success: true,
      data: {
        vehicle,
        workOrders: ordersWithTotals,
      }
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 3. Criar veículo
interface CreateVehicleInput {
  customerId: string;
  plate: string;
  brand: string;
  model: string;
  year?: number;
  engine?: string;
  mileage?: number;
}
export async function createVehicleAction(input: CreateVehicleInput) {
  try {
    const user = await requireAuth();
    if (!user.tenantId) {
      throw new Error("Usuário sem tenant.");
    }

    const cleanPlate = input.plate.toUpperCase().replace(/[^A-Z0-9]/g, "").trim();

    // Verificar se já existe veículo com essa placa
    const existing = await db.query.vehicles.findFirst({
      where: (v, { eq }) => eq(v.plate, cleanPlate),
    });

    if (existing) {
      throw new Error("Já existe um veículo cadastrado com esta placa.");
    }

    const [newVehicle] = await db.insert(schema.vehicles).values({
      tenantId: user.tenantId!,
      customerId: input.customerId,
      plate: cleanPlate,
      brand: input.brand,
      model: input.model,
      year: input.year || null,
      engine: input.engine || null,
      mileage: input.mileage || null,
    }).returning();

    return { success: true, data: newVehicle };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 4. Editar veículo
interface UpdateVehicleInput {
  id: string;
  customerId: string;
  plate: string;
  brand: string;
  model: string;
  year?: number;
  engine?: string;
  mileage?: number;
}
export async function updateVehicleAction(input: UpdateVehicleInput) {
  try {
    const user = await requireAuth();
    if (!user.tenantId) {
      throw new Error("Usuário sem tenant.");
    }

    const cleanPlate = input.plate.toUpperCase().replace(/[^A-Z0-9]/g, "").trim();

    // Verificar duplicidade de placa para outros ids
    const existing = await db.query.vehicles.findFirst({
      where: (v, { eq, and, ne }) => and(
        eq(v.plate, cleanPlate),
        ne(v.id, input.id)
      ),
    });

    if (existing) {
      throw new Error("Já existe outro veículo cadastrado com esta placa.");
    }

    const [updated] = await db.update(schema.vehicles)
      .set({
        customerId: input.customerId,
        plate: cleanPlate,
        brand: input.brand,
        model: input.model,
        year: input.year || null,
        engine: input.engine || null,
        mileage: input.mileage || null,
      })
      .where(
        and(
          eq(schema.vehicles.id, input.id),
          eq(schema.vehicles.tenantId, user.tenantId!)
        )
      )
      .returning();

    return { success: true, data: updated };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 5. Deletar veículo
export async function deleteVehicleAction(id: string) {
  try {
    const user = await requireAuth();
    if (!user.tenantId) {
      throw new Error("Usuário sem tenant.");
    }

    await db.delete(schema.vehicles)
      .where(
        and(
          eq(schema.vehicles.id, id),
          eq(schema.vehicles.tenantId, user.tenantId!)
        )
      );

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
