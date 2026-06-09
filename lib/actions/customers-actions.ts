"use server"

import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "./auth-helper";

const getAuthenticatedUser = requireAuth;

// 1. Obter clientes cadastrados com contagem de veículos e Ordens de Serviço
export async function getCustomersAction() {
  try {
    const user = await getAuthenticatedUser();
    if (!user.tenantId) {
      throw new Error("Usuário não possui empresa vinculada.");
    }

    // Busca clientes do tenant
    const customersList = await db
      .select()
      .from(schema.customers)
      .where(eq(schema.customers.tenantId, user.tenantId!));

    // Busca veículos do tenant para contar por cliente
    const vehiclesList = await db
      .select({
        id: schema.vehicles.id,
        customerId: schema.vehicles.customerId,
      })
      .from(schema.vehicles)
      .where(eq(schema.vehicles.tenantId, user.tenantId!));

    // Busca Ordens de Serviço do tenant para contar por cliente
    const workOrdersList = await db
      .select({
        id: schema.workOrders.id,
        customerId: schema.workOrders.customerId,
      })
      .from(schema.workOrders)
      .where(eq(schema.workOrders.tenantId, user.tenantId!));

    const customersWithCounts = customersList.map(c => {
      const clientVehicles = vehiclesList.filter(v => v.customerId === c.id);
      const clientWorkOrders = workOrdersList.filter(o => o.customerId === c.id);
      return {
        ...c,
        vehiclesCount: clientVehicles.length,
        workOrdersCount: clientWorkOrders.length,
      };
    });

    return { success: true, data: customersWithCounts };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 2. Criar cliente com possibilidade de incluir veículo inicial de forma transacional
interface InitialVehicleInput {
  plate: string;
  brand: string;
  model: string;
  year?: string;
  engine?: string;
  mileage?: string;
}

interface CreateCustomerInput {
  name: string;
  phone: string;
  document?: string;
  email?: string;
  address?: string;
  initialVehicle?: InitialVehicleInput;
}

export async function createCustomerAction(input: CreateCustomerInput) {
  try {
    const user = await getAuthenticatedUser();
    if (!user.tenantId) {
      throw new Error("Usuário não possui empresa vinculada.");
    }

    if (!input.name || !input.phone) {
      throw new Error("Nome e telefone são obrigatórios.");
    }

    const result = await db.transaction(async (tx) => {
      // Cria o cliente
      const [newCust] = await tx
        .insert(schema.customers)
        .values({
          tenantId: user.tenantId!,
          name: input.name,
          phone: input.phone,
          document: input.document || null,
          email: input.email || null,
          address: input.address || null,
        })
        .returning();

      if (!newCust) {
        throw new Error("Erro ao cadastrar cliente.");
      }

      // Se passou veículo inicial, cadastra ele
      if (input.initialVehicle) {
        const v = input.initialVehicle;
        if (!v.plate || !v.brand || !v.model) {
          throw new Error("Dados mínimos do veículo (placa, marca e modelo) são necessários para o cadastro integrado.");
        }

        // Verifica placa duplicada para o tenant (ou globalmente se unique)
        const plateUpper = v.plate.toUpperCase().replace("-", "").trim();
        const existingVehicle = await tx.query.vehicles.findFirst({
          where: (vh, { eq }) => eq(vh.plate, plateUpper)
        });

        if (existingVehicle) {
          throw new Error(`A placa ${v.plate.toUpperCase()} já está cadastrada no sistema.`);
        }

        await tx.insert(schema.vehicles).values({
          tenantId: user.tenantId!,
          customerId: newCust.id,
          plate: plateUpper,
          brand: v.brand,
          model: v.model,
          year: v.year ? parseInt(v.year, 10) : null,
          engine: v.engine || null,
          mileage: v.mileage ? parseInt(v.mileage, 10) : null,
        });
      }

      return newCust;
    });

    return { success: true, data: result };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 3. Editar cliente
interface UpdateCustomerInput {
  id: string;
  name: string;
  phone: string;
  document?: string;
  email?: string;
  address?: string;
}

export async function updateCustomerAction(input: UpdateCustomerInput) {
  try {
    const user = await getAuthenticatedUser();
    if (!user.tenantId) {
      throw new Error("Usuário não possui empresa vinculada.");
    }

    const [updated] = await db
      .update(schema.customers)
      .set({
        name: input.name,
        phone: input.phone,
        document: input.document || null,
        email: input.email || null,
        address: input.address || null,
      })
      .where(
        and(
          eq(schema.customers.id, input.id),
          eq(schema.customers.tenantId, user.tenantId!)
        )
      )
      .returning();

    return { success: true, data: updated };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 4. Deletar cliente (veículos associados serão apagados por CASCADE no banco)
export async function deleteCustomerAction(id: string) {
  try {
    const user = await getAuthenticatedUser();
    if (!user.tenantId) {
      throw new Error("Usuário não possui empresa vinculada.");
    }

    await db
      .delete(schema.customers)
      .where(
        and(
          eq(schema.customers.id, id),
          eq(schema.customers.tenantId, user.tenantId!)
        )
      );

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
