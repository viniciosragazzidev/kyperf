"use server"

import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { eq, and, gte, sql } from "drizzle-orm";
import { requireAuth } from "./auth-helper";

export async function getFinanceDataAction(days: number = 30) {
  try {
    const user = await requireAuth();
    if (!user.tenantId) {
      throw new Error("Usuário sem tenant.");
    }

    const tenantId = user.tenantId;

    // Calcula data inicial
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    // Busca ordens pagas no período
    const paidOrders = await db.query.workOrders.findMany({
      where: (wo, { eq, and, gte }) => and(
        eq(wo.tenantId, tenantId),
        eq(wo.paymentStatus, 'PAID'),
        gte(wo.createdAt, startDate)
      ),
      with: {
        customer: true,
        vehicle: true,
        items: true,
      },
      orderBy: (wo, { desc }) => desc(wo.createdAt),
    });

    let totalRevenue = 0;
    let totalPartsCost = 0;
    let servicesRevenue = 0;
    let partsRevenue = 0;

    const formattedTransactions = paidOrders.map(order => {
      let orderPartsRevenue = 0;
      let orderServicesRevenue = 0;
      let orderPartsCost = 0;

      for (const item of order.items) {
        if (item.isApproved !== 1) continue;
        const qty = item.quantity;
        const salePrice = parseFloat(item.unitSalePrice) || 0;
        const costPrice = parseFloat(item.unitCostPrice) || 0;

        if (item.type === 'PART') {
          orderPartsRevenue += salePrice * qty;
          orderPartsCost += costPrice * qty;
        } else {
          orderServicesRevenue += salePrice * qty;
        }
      }

      const discount = parseFloat(order.discount || "0") || 0;
      const surcharge = parseFloat(order.surcharge || "0") || 0;
      
      const orderTotal = Math.max(0, orderPartsRevenue + orderServicesRevenue - discount + surcharge);

      totalRevenue += orderTotal;
      totalPartsCost += orderPartsCost;
      partsRevenue += orderPartsRevenue;
      servicesRevenue += orderServicesRevenue;

      return {
        id: order.id,
        osNumber: order.osNumber,
        customerName: order.customer.name,
        vehicleModel: `${order.vehicle.brand} ${order.vehicle.model}`,
        plate: order.vehicle.plate,
        paymentMethod: order.paymentMethod || "Não informado",
        createdAt: order.createdAt,
        totalPrice: orderTotal,
        partsCost: orderPartsCost,
        margin: Math.max(0, orderTotal - orderPartsCost)
      };
    });

    const grossProfit = totalRevenue - totalPartsCost;
    const grossMarginPercent = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

    return {
      success: true,
      data: {
        totalRevenue,
        totalPartsCost,
        grossProfit,
        grossMarginPercent,
        servicesRevenue,
        partsRevenue,
        transactions: formattedTransactions,
      }
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
