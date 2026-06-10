"use server"

import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { eq, desc, like, or, and } from "drizzle-orm";
import { requireAuth } from "./auth-helper";

function generateAccessCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

// ── Pátio: listar todas as OS com cliente + veículo + itens totalizados
export async function getLiteOrdersAction() {
  try {
    const user = await requireAuth();
    if (!user.tenantId) throw new Error("Sem empresa vinculada.");

    const orders = await db.select({
      id: schema.workOrders.id,
      osNumber: schema.workOrders.osNumber,
      status: schema.workOrders.status,
      paymentStatus: schema.workOrders.paymentStatus,
      createdAt: schema.workOrders.createdAt,
      budgetAccessCode: schema.workOrders.budgetAccessCode,
      customerName: schema.customers.name,
      customerPhone: schema.customers.phone,
      vehiclePlate: schema.vehicles.plate,
      vehicleBrand: schema.vehicles.brand,
      vehicleModel: schema.vehicles.model,
    })
    .from(schema.workOrders)
    .innerJoin(schema.customers, eq(schema.workOrders.customerId, schema.customers.id))
    .innerJoin(schema.vehicles, eq(schema.workOrders.vehicleId, schema.vehicles.id))
    .where(eq(schema.workOrders.tenantId, user.tenantId!))
    .orderBy(desc(schema.workOrders.createdAt));

    const items = await db.select({
      workOrderId: schema.workOrderItems.workOrderId,
      quantity: schema.workOrderItems.quantity,
      unitSalePrice: schema.workOrderItems.unitSalePrice,
    })
    .from(schema.workOrderItems)
    .innerJoin(schema.workOrders, eq(schema.workOrderItems.workOrderId, schema.workOrders.id))
    .where(eq(schema.workOrders.tenantId, user.tenantId!));

    const withTotals = orders.map(o => {
      const total = items
        .filter(i => i.workOrderId === o.id)
        .reduce((acc, i) => acc + i.quantity * parseFloat(i.unitSalePrice), 0);
      return { ...o, total };
    });

    return { success: true, data: withTotals };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

// ── Criar OS Express (placa + nome + whatsapp — tudo em 1 transação)
export async function createLiteOSAction(input: {
  plate: string;
  brand: string;
  model: string;
  customerName: string;
  customerPhone: string;
}) {
  try {
    const user = await requireAuth();
    if (!user.tenantId) throw new Error("Sem empresa vinculada.");

    const cleanPlate = input.plate.toUpperCase().replace(/[^A-Z0-9]/g, "").trim();
    const cleanPhone = input.customerPhone.replace(/\D/g, "");

    const result = await db.transaction(async (tx) => {
      // 1. Cliente — busca por telefone, cria se não existir
      let customerId: string;
      const existingCust = await tx.query.customers.findFirst({
        where: (c, { eq, and }) => and(eq(c.tenantId, user.tenantId!), eq(c.phone, cleanPhone))
      });
      if (existingCust) {
        customerId = existingCust.id;
      } else {
        const [c] = await tx.insert(schema.customers).values({
          tenantId: user.tenantId!,
          name: input.customerName,
          phone: cleanPhone,
        }).returning();
        customerId = c.id;
      }

      // 2. Veículo — busca por placa, cria se não existir
      let vehicleId: string;
      const existingVeh = await tx.query.vehicles.findFirst({
        where: (v, { eq, and }) => and(eq(v.tenantId, user.tenantId!), eq(v.plate, cleanPlate))
      });
      if (existingVeh) {
        vehicleId = existingVeh.id;
      } else {
        const [v] = await tx.insert(schema.vehicles).values({
          tenantId: user.tenantId!,
          customerId,
          plate: cleanPlate,
          brand: input.brand || "N/I",
          model: input.model || "N/I",
        }).returning();
        vehicleId = v.id;
      }

      // 3. Próximo número de OS
      const max = await tx.query.workOrders.findFirst({
        where: (wo, { eq }) => eq(wo.tenantId, user.tenantId!),
        orderBy: (wo, { desc }) => desc(wo.osNumber),
      });
      const nextNum = (max?.osNumber || 0) + 1;

      // 4. OS
      const [order] = await tx.insert(schema.workOrders).values({
        tenantId: user.tenantId!,
        branchId: user.branchId || null,
        osNumber: nextNum,
        customerId,
        vehicleId,
        status: "AWAITING_BUDGET",
        paymentStatus: "PENDING",
        currentMileage: 0,
        budgetAccessCode: generateAccessCode(),
      }).returning();

      await tx.insert(schema.workOrderStatusHistory).values({
        tenantId: user.tenantId!,
        workOrderId: order.id,
        status: order.status,
        changedById: user.id,
        notes: "OS aberta via Kyperfix Lite.",
      });

      return order;
    });

    return { success: true, data: result };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

// ── Adicionar item livre à OS (peça ou serviço, sem vínculo com estoque)
export async function addLiteItemAction(input: {
  orderId: string;
  name: string;
  costPrice: string;
  salePrice: string;
  quantity?: number;
  type?: 'PART' | 'SERVICE';
}) {
  try {
    const user = await requireAuth();
    if (!user.tenantId) throw new Error("Sem empresa vinculada.");

    const [item] = await db.insert(schema.workOrderItems).values({
      workOrderId: input.orderId,
      type: input.type || "PART",
      customName: input.name,
      quantity: input.quantity || 1,
      unitCostPrice: input.costPrice,
      unitSalePrice: input.salePrice,
      isApproved: 0,
    }).returning();

    return { success: true, data: item };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

// ── Buscar itens de uma OS
export async function getLiteItemsAction(orderId: string) {
  try {
    const user = await requireAuth();
    if (!user.tenantId) throw new Error("Sem empresa vinculada.");

    const items = await db.select()
      .from(schema.workOrderItems)
      .where(eq(schema.workOrderItems.workOrderId, orderId));

    return { success: true, data: items };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

// ── Remover item de uma OS
export async function removeLiteItemAction(itemId: string) {
  try {
    await requireAuth();
    await db.delete(schema.workOrderItems)
      .where(eq(schema.workOrderItems.id, itemId));
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

// ── Avançar status da OS (Orçamento → Em Execução → Pronto)
export async function advanceLiteStatusAction(orderId: string) {
  try {
    const user = await requireAuth();
    if (!user.tenantId) throw new Error("Sem empresa vinculada.");

    const order = await db.query.workOrders.findFirst({
      where: (wo, { eq, and }) => and(eq(wo.id, orderId), eq(wo.tenantId, user.tenantId!))
    });
    if (!order) throw new Error("OS não encontrada.");

    type OrderStatus = "CHECK_IN"|"AWAITING_BUDGET"|"AWAITING_APPROVAL"|"AWAITING_PARTS"|"IN_PROGRESS"|"TESTING_WASHING"|"READY"|"DELIVERED";
    const flow: Record<string, OrderStatus> = {
      AWAITING_BUDGET:   "IN_PROGRESS",
      AWAITING_APPROVAL: "IN_PROGRESS",
      IN_PROGRESS:       "READY",
      AWAITING_PARTS:    "READY",
      READY:             "DELIVERED",
    };
    const nextStatus = (flow[order.status] || "READY") as OrderStatus;

    await db.update(schema.workOrders)
      .set({ status: nextStatus, statusChangedAt: new Date(), updatedAt: new Date() })
      .where(eq(schema.workOrders.id, orderId));

    await db.insert(schema.workOrderStatusHistory).values({
      tenantId: user.tenantId!,
      workOrderId: orderId,
      status: nextStatus,
      changedById: user.id,
      notes: "Avançado via painel Lite.",
    });

    return { success: true, data: { status: nextStatus } };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

// ── Buscar peças do catálogo (para consulta rápida de preço)
export async function getLitePartsAction(search?: string) {
  try {
    const user = await requireAuth();
    if (!user.tenantId) throw new Error("Sem empresa vinculada.");

    const parts = await db.select({
      id: schema.partsInventory.id,
      name: schema.partsInventory.name,
      brand: schema.partsInventory.brand,
      sku: schema.partsInventory.sku,
      quantity: schema.partsInventory.quantity,
      costPrice: schema.partsInventory.costPrice,
      salePrice: schema.partsInventory.salePrice,
      location: schema.partsInventory.location,
    })
    .from(schema.partsInventory)
    .where(
      search
        ? eq(schema.partsInventory.tenantId, user.tenantId!)
        : eq(schema.partsInventory.tenantId, user.tenantId!)
    )
    .orderBy(schema.partsInventory.name);

    return { success: true, data: parts };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

// ── Clientes — listagem simples
export async function getLiteCustomersAction(search?: string) {
  try {
    const user = await requireAuth();
    if (!user.tenantId) throw new Error("Sem empresa vinculada.");

    const customers = await db.select({
      id: schema.customers.id,
      name: schema.customers.name,
      phone: schema.customers.phone,
      document: schema.customers.document,
      email: schema.customers.email,
      address: schema.customers.address,
      createdAt: schema.customers.createdAt,
    })
    .from(schema.customers)
    .where(
      and(
        eq(schema.customers.tenantId, user.tenantId!),
        search ? or(
          like(schema.customers.name, `%${search}%`),
          like(schema.customers.phone, `%${search}%`)
        ) : undefined
      )
    )
    .orderBy(desc(schema.customers.createdAt));

    return { success: true, data: customers };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

// ── Portal público do cliente: aprovar orçamento pelo código
export async function approveLiteBudgetAction(code: string) {
  try {
    const order = await db.query.workOrders.findFirst({
      where: (wo, { eq }) => eq(wo.budgetAccessCode, code.toUpperCase())
    });
    if (!order) throw new Error("Orçamento não encontrado.");

    await db.update(schema.workOrders)
      .set({ status: "IN_PROGRESS", statusChangedAt: new Date(), updatedAt: new Date() })
      .where(eq(schema.workOrders.id, order.id));

    await db.update(schema.workOrderItems)
      .set({ isApproved: 1 })
      .where(eq(schema.workOrderItems.workOrderId, order.id));

    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

// ── Portal público do cliente: buscar dados do orçamento pelo código
export async function getLiteBudgetByCodeAction(code: string) {
  try {
    const order = await db.query.workOrders.findFirst({
      where: (wo, { eq }) => eq(wo.budgetAccessCode, code.toUpperCase())
    });
    if (!order) throw new Error("Orçamento não encontrado.");

    const customer = await db.query.customers.findFirst({
      where: (c, { eq }) => eq(c.id, order.customerId)
    });
    const vehicle = await db.query.vehicles.findFirst({
      where: (v, { eq }) => eq(v.id, order.vehicleId)
    });
    const items = await db.select()
      .from(schema.workOrderItems)
      .where(eq(schema.workOrderItems.workOrderId, order.id));

    return { success: true, data: { order, customer, vehicle, items } };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

// ── Atualizar OS no modo Lite (veículo, cliente e dados da OS)
export async function updateLiteOSAction(input: {
  orderId: string;
  // Veículo
  plate?: string;
  brand?: string;
  model?: string;
  year?: string;
  engine?: string;
  mileage?: string;
  fuelLevel?: string;
  // Cliente
  customerName?: string;
  customerPhone?: string;
  customerDocument?: string;
  customerEmail?: string;
  customerAddress?: string;
  // Triagem/Checklist
  symptoms?: string;
  diagnostic?: string;
  warranty?: string;
  checklist?: string;
  // Financeiro
  discount?: string;
  surcharge?: string;
  paymentMethod?: string;
  paymentStatus?: 'PENDING' | 'PAID' | 'LATE';
  status?: string;
  // Itens da OS
  items?: Array<{
    type: string;
    customName: string;
    quantity: number;
    unitSalePrice: string;
  }>;
}) {
  try {
    const user = await requireAuth();
    if (!user.tenantId) throw new Error("Sem empresa vinculada.");

    const order = await db.query.workOrders.findFirst({
      where: (wo, { eq, and }) => and(eq(wo.id, input.orderId), eq(wo.tenantId, user.tenantId!))
    });
    if (!order) throw new Error("OS não encontrada.");

    await db.transaction(async (tx) => {
      // 1. Atualizar veículo
      if (input.plate || input.brand || input.model || input.year || input.engine || input.mileage) {
        const cleanPlate = input.plate ? input.plate.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 7) : undefined;
        await tx.update(schema.vehicles)
          .set({
            plate: cleanPlate,
            brand: input.brand,
            model: input.model,
            year: input.year ? parseInt(input.year, 10) : undefined,
            engine: input.engine,
            mileage: input.mileage ? parseInt(input.mileage, 10) : undefined,
          })
          .where(eq(schema.vehicles.id, order.vehicleId));
      }

      // 2. Atualizar cliente
      if (input.customerName || input.customerPhone || input.customerDocument !== undefined || input.customerEmail !== undefined || input.customerAddress !== undefined) {
        const cleanPhone = input.customerPhone ? input.customerPhone.replace(/\D/g, "") : undefined;
        await tx.update(schema.customers)
          .set({
            name: input.customerName,
            phone: cleanPhone,
            document: input.customerDocument,
            email: input.customerEmail,
            address: input.customerAddress,
          })
          .where(eq(schema.customers.id, order.customerId));
      }

      // 3. Status mudou?
      const statusChanged = input.status && input.status !== order.status;
      if (statusChanged && input.status) {
        await tx.insert(schema.workOrderStatusHistory).values({
          tenantId: user.tenantId!,
          workOrderId: order.id,
          status: input.status as any,
          changedById: user.id,
          notes: "Atualizado via painel de edição Lite.",
        });
      }

      // 4. Atualizar OS
      await tx.update(schema.workOrders)
        .set({
          status: (input.status || order.status) as any,
          paymentStatus: (input.paymentStatus || order.paymentStatus) as any,
          currentMileage: input.mileage ? parseInt(input.mileage, 10) : order.currentMileage,
          fuelLevel: input.fuelLevel !== undefined ? input.fuelLevel : order.fuelLevel,
          notes: input.symptoms !== undefined ? input.symptoms : order.notes,
          diagnostic: input.diagnostic !== undefined ? input.diagnostic : order.diagnostic,
          checklist: input.checklist !== undefined ? input.checklist : order.checklist,
          warranty: input.warranty !== undefined ? input.warranty : order.warranty,
          discount: input.discount !== undefined ? input.discount : order.discount,
          surcharge: input.surcharge !== undefined ? input.surcharge : order.surcharge,
          paymentMethod: input.paymentMethod !== undefined ? input.paymentMethod : order.paymentMethod,
          statusChangedAt: statusChanged ? new Date() : order.statusChangedAt,
          updatedAt: new Date(),
        })
        .where(eq(schema.workOrders.id, order.id));

      // 5. Atualizar Itens da OS (Remove antigos e reinsere novos)
      if (input.items !== undefined) {
        await tx.delete(schema.workOrderItems)
          .where(eq(schema.workOrderItems.workOrderId, order.id));

        if (input.items.length > 0) {
          for (const item of input.items) {
            await tx.insert(schema.workOrderItems).values({
              workOrderId: order.id,
              type: item.type as any,
              customName: item.customName,
              quantity: item.quantity,
              unitCostPrice: "0",
              unitSalePrice: item.unitSalePrice,
              isApproved: 0,
            });
          }
        }
      }
    });

    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

// ── Serviços — listagem simples
export async function getLiteServicesAction(search?: string) {
  try {
    const user = await requireAuth();
    if (!user.tenantId) throw new Error("Sem empresa vinculada.");

    const services = await db.select({
      id: schema.servicesCatalog.id,
      name: schema.servicesCatalog.name,
      description: schema.servicesCatalog.description,
      estimatedTimeMinutes: schema.servicesCatalog.estimatedTimeMinutes,
      basePrice: schema.servicesCatalog.basePrice,
    })
    .from(schema.servicesCatalog)
    .where(
      and(
        eq(schema.servicesCatalog.tenantId, user.tenantId!),
        search ? like(schema.servicesCatalog.name, `%${search}%`) : undefined
      )
    )
    .orderBy(schema.servicesCatalog.name);

    return { success: true, data: services };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

// ── Obter todas as OS de um cliente específico no modo Lite
export async function getLiteCustomerOrdersAction(customerId: string) {
  try {
    const user = await requireAuth();
    if (!user.tenantId) throw new Error("Sem empresa vinculada.");

    const orders = await db.select({
      id: schema.workOrders.id,
      osNumber: schema.workOrders.osNumber,
      status: schema.workOrders.status,
      paymentStatus: schema.workOrders.paymentStatus,
      createdAt: schema.workOrders.createdAt,
      budgetAccessCode: schema.workOrders.budgetAccessCode,
      customerId: schema.workOrders.customerId,
      customerName: schema.customers.name,
      customerPhone: schema.customers.phone,
      vehiclePlate: schema.vehicles.plate,
      vehicleBrand: schema.vehicles.brand,
      vehicleModel: schema.vehicles.model,
    })
    .from(schema.workOrders)
    .innerJoin(schema.customers, eq(schema.workOrders.customerId, schema.customers.id))
    .innerJoin(schema.vehicles, eq(schema.workOrders.vehicleId, schema.vehicles.id))
    .where(and(eq(schema.workOrders.tenantId, user.tenantId!), eq(schema.workOrders.customerId, customerId)))
    .orderBy(desc(schema.workOrders.createdAt));

    const items = await db.select({
      workOrderId: schema.workOrderItems.workOrderId,
      quantity: schema.workOrderItems.quantity,
      unitSalePrice: schema.workOrderItems.unitSalePrice,
    })
    .from(schema.workOrderItems)
    .innerJoin(schema.workOrders, eq(schema.workOrderItems.workOrderId, schema.workOrders.id))
    .where(and(eq(schema.workOrders.tenantId, user.tenantId!), eq(schema.workOrders.customerId, customerId)));

    const withTotals = orders.map(o => {
      const total = items
        .filter(i => i.workOrderId === o.id)
        .reduce((acc, i) => acc + i.quantity * parseFloat(i.unitSalePrice), 0);
      return { ...o, total };
    });

    return { success: true, data: withTotals };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

// ── Obter todos os veículos no modo Lite
export async function getLiteVehiclesAction() {
  try {
    const user = await requireAuth();
    if (!user.tenantId) throw new Error("Sem empresa vinculada.");

    const vehicles = await db.select({
      id: schema.vehicles.id,
      plate: schema.vehicles.plate,
      brand: schema.vehicles.brand,
      model: schema.vehicles.model,
      year: schema.vehicles.year,
      engine: schema.vehicles.engine,
      mileage: schema.vehicles.mileage,
      customerId: schema.vehicles.customerId,
      customerName: schema.customers.name,
      customerPhone: schema.customers.phone,
    })
    .from(schema.vehicles)
    .innerJoin(schema.customers, eq(schema.vehicles.customerId, schema.customers.id))
    .where(eq(schema.vehicles.tenantId, user.tenantId!))
    .orderBy(schema.vehicles.plate);

    return { success: true, data: vehicles };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

// ── Obter todos os veículos de um cliente específico no modo Lite
export async function getLiteCustomerVehiclesAction(customerId: string) {
  try {
    const user = await requireAuth();
    if (!user.tenantId) throw new Error("Sem empresa vinculada.");

    const vehicles = await db.select()
      .from(schema.vehicles)
      .where(and(eq(schema.vehicles.tenantId, user.tenantId!), eq(schema.vehicles.customerId, customerId)))
      .orderBy(schema.vehicles.plate);

    return { success: true, data: vehicles };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

// ── Ajustar estoque de uma peça (Adicionar/Retirar)
export async function adjustLitePartStockAction(partId: string, delta: number) {
  try {
    const user = await requireAuth();
    if (!user.tenantId) throw new Error("Sem empresa vinculada.");

    const part = await db.query.partsInventory.findFirst({
      where: (p, { eq, and }) => and(eq(p.id, partId), eq(p.tenantId, user.tenantId!))
    });
    if (!part) throw new Error("Peça não encontrada.");

    const newQty = Math.max(0, part.quantity + delta);

    await db.update(schema.partsInventory)
      .set({ quantity: newQty })
      .where(eq(schema.partsInventory.id, partId));

    return { success: true, data: { quantity: newQty } };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}
