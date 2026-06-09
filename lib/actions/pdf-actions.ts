"use server"

import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "./auth-helper";

const getAuthenticatedUser = requireAuth;

export async function getWorkOrderForPdfAction(id: string) {
  try {
    const user = await getAuthenticatedUser();
    if (!user.tenantId) throw new Error("Usuário sem empresa vinculada.");

    const order = await db.query.workOrders.findFirst({
      where: (wo, { eq, and }) =>
        and(eq(wo.id, id), eq(wo.tenantId, user.tenantId!)),
    });
    if (!order) throw new Error("OS não encontrada.");

    const [customer, vehicle, branch, tenant] = await Promise.all([
      db.query.customers.findFirst({ where: (c) => eq(c.id, order.customerId) }),
      db.query.vehicles.findFirst({ where: (v) => eq(v.id, order.vehicleId) }),
      db.query.branches.findFirst({ where: (b) => eq(b.id, order.branchId) }),
      db.query.tenants.findFirst({ where: (t) => eq(t.id, user.tenantId!) }),
    ]);

    let mechanic = null;
    if (order.mechanicId) {
      mechanic = await db.query.user.findFirst({
        where: (u) => eq(u.id, order.mechanicId!),
        columns: { id: true, name: true, email: true, commissionRate: true },
      });
    }

    const items = await db
      .select({
        id: schema.workOrderItems.id,
        type: schema.workOrderItems.type,
        customName: schema.workOrderItems.customName,
        quantity: schema.workOrderItems.quantity,
        unitCostPrice: schema.workOrderItems.unitCostPrice,
        unitSalePrice: schema.workOrderItems.unitSalePrice,
        isApproved: schema.workOrderItems.isApproved,
        partName: schema.partsInventory.name,
        partBrand: schema.partsInventory.brand,
        serviceName: schema.servicesCatalog.name,
      })
      .from(schema.workOrderItems)
      .leftJoin(
        schema.partsInventory,
        eq(schema.workOrderItems.partId, schema.partsInventory.id)
      )
      .leftJoin(
        schema.servicesCatalog,
        eq(schema.workOrderItems.serviceId, schema.servicesCatalog.id)
      )
      .where(eq(schema.workOrderItems.workOrderId, order.id));

    return {
      success: true,
      data: {
        ...order,
        customer: customer || null,
        vehicle: vehicle || null,
        mechanic: mechanic || null,
        branch: branch || null,
        tenant: tenant || null,
        items,
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
