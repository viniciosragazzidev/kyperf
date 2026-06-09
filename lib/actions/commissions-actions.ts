"use server"

import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { eq, and, gte } from "drizzle-orm";
import { requireAuth } from "./auth-helper";

export async function getCommissionsDataAction(days: number = 30) {
  try {
    const user = await requireAuth();
    if (!user.tenantId) {
      throw new Error("Usuário sem tenant.");
    }

    const tenantId = user.tenantId;

    // Busca mecânicos do tenant
    const mechanics = await db.query.user.findMany({
      where: (u, { eq, and }) => and(
        eq(u.tenantId, tenantId),
        eq(u.role, 'MECHANIC'),
        eq(u.isActive, 1)
      ),
    });

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    // Busca ordens de serviço pagas e entregues no período
    const orders = await db.query.workOrders.findMany({
      where: (wo, { eq, and, gte }) => and(
        eq(wo.tenantId, tenantId),
        eq(wo.status, 'DELIVERED'),
        eq(wo.paymentStatus, 'PAID'),
        gte(wo.createdAt, startDate)
      ),
      with: {
        items: true,
      }
    });

    const report = mechanics.map(mech => {
      const mechOrders = orders.filter(o => o.mechanicId === mech.id);

      let totalServicesValue = 0;
      const executedServices: Array<{
        osNumber: number;
        serviceName: string;
        value: number;
        date: Date;
      }> = [];

      for (const order of mechOrders) {
        for (const item of order.items) {
          if (item.type === 'SERVICE' && item.isApproved === 1) {
            const val = (parseFloat(item.unitSalePrice) || 0) * item.quantity;
            totalServicesValue += val;
            executedServices.push({
              osNumber: order.osNumber,
              serviceName: item.customName || "Serviço mecânico",
              value: val,
              date: order.createdAt,
            });
          }
        }
      }

      const rate = mech.commissionRate ? parseFloat(mech.commissionRate) : 0;
      const commissionDue = (rate / 100) * totalServicesValue;

      return {
        id: mech.id,
        name: mech.name,
        email: mech.email,
        commissionRate: rate,
        totalServicesValue,
        commissionDue,
        servicesCount: executedServices.length,
        servicesList: executedServices,
      };
    });

    return { success: true, data: report };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
