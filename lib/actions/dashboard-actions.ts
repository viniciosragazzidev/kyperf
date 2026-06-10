"use server"

import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { eq, and, ne, sql, desc, gte } from "drizzle-orm";
import { requireAuth } from "./auth-helper";

export async function getDashboardDataAction() {
  try {
    const user = await requireAuth();
    if (!user.tenantId) {
      throw new Error("Usuário sem tenant.");
    }

    const tenantId = user.tenantId;

    // 1. Ordens de serviço ativas (diferentes de DELIVERED)
    const activeOrders = await db.query.workOrders.findMany({
      where: (wo, { eq, and, ne }) => and(
        eq(wo.tenantId, tenantId),
        ne(wo.status, 'DELIVERED')
      ),
      with: {
        customer: true,
        vehicle: true,
        items: true,
      }
    });

    // 2. Faturamento mensal (OS pagas do mês atual) e Ticket Médio
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const monthlyOrders = await db.query.workOrders.findMany({
      where: (wo, { eq, and, gte }) => and(
        eq(wo.tenantId, tenantId),
        gte(wo.createdAt, startOfMonth)
      ),
      with: {
        items: true,
      }
    });

    let monthlyRevenue = 0;
    let totalRevenueAll = 0;

    for (const order of monthlyOrders) {
      const itemsTotal = order.items
        .filter(item => item.isApproved === 1)
        .reduce((sum, item) => {
          const price = parseFloat(item.unitSalePrice) || 0;
          return sum + (price * item.quantity);
        }, 0);
      
      const discount = order.discount ? parseFloat(order.discount) : 0;
      const surcharge = order.surcharge ? parseFloat(order.surcharge) : 0;
      const orderTotal = Math.max(0, itemsTotal - discount + surcharge);

      totalRevenueAll += orderTotal;

      if (order.paymentStatus === 'PAID') {
        monthlyRevenue += orderTotal;
      }
    }

    const ticketMedio = monthlyOrders.length > 0 ? (totalRevenueAll / monthlyOrders.length) : 0;

    // 3. Peças com estoque baixo
    const lowStockParts = await db.query.partsInventory.findMany({
      where: (part, { eq, and, sql }) => and(
        eq(part.tenantId, tenantId),
        sql`${part.quantity} < ${part.minQuantity}`
      )
    });

    // 4. Distribuição por status
    const statusCounts = {
      CHECK_IN: 0,
      AWAITING_BUDGET: 0,
      AWAITING_APPROVAL: 0,
      AWAITING_PARTS: 0,
      IN_PROGRESS: 0,
      TESTING_WASHING: 0,
      READY: 0,
      DELIVERED: 0,
    };

    const allOrders = await db.query.workOrders.findMany({
      where: (wo, { eq }) => eq(wo.tenantId, tenantId),
    });

    for (const order of allOrders) {
      if (order.status in statusCounts) {
        statusCounts[order.status as keyof typeof statusCounts]++;
      }
    }

    // 5. Ordens recentes (últimas 5)
    const recentOrders = await db.query.workOrders.findMany({
      where: (wo, { eq }) => eq(wo.tenantId, tenantId),
      orderBy: (wo, { desc }) => desc(wo.createdAt),
      limit: 5,
      with: {
        customer: true,
        vehicle: true,
        items: true,
      }
    });

    const recentOrdersWithTotals = recentOrders.map(order => {
      const itemsTotal = order.items
        .filter(item => item.isApproved === 1)
        .reduce((sum, item) => {
          const price = parseFloat(item.unitSalePrice) || 0;
          return sum + (price * item.quantity);
        }, 0);
      
      const discount = order.discount ? parseFloat(order.discount) : 0;
      const surcharge = order.surcharge ? parseFloat(order.surcharge) : 0;
      const orderTotal = Math.max(0, itemsTotal - discount + surcharge);

      return {
        ...order,
        totalPrice: orderTotal
      };
    });

    // 6. Indicadores reais para Onboarding Contextual
    const dbMechanic = await db.query.user.findFirst({
      where: (u, { eq, and }) => and(
        eq(u.tenantId, tenantId),
        eq(u.role, 'MECHANIC')
      )
    });
    const hasMechanic = !!dbMechanic;

    const waConfig = await db.query.whatsappConfig.findFirst({
      where: (wc, { eq }) => eq(wc.tenantId, tenantId)
    });
    const isWhatsappConnected = waConfig?.status === 'CONNECTED';

    const hasWorkOrder = allOrders.length > 0;

    return {
      success: true,
      data: {
        activeOrdersCount: activeOrders.length,
        monthlyRevenue,
        ticketMedio,
        lowStockCount: lowStockParts.length,
        lowStockParts: lowStockParts.slice(0, 5),
        statusCounts,
        recentOrders: recentOrdersWithTotals,
        onboarding: {
          hasMechanic,
          isWhatsappConnected,
          hasWorkOrder
        }
      }
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
