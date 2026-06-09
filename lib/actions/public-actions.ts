"use server"

import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

// Função interna para limpar formatação de CPF/CNPJ
function cleanDocument(doc: string): string {
  return doc.replace(/\D/g, "");
}

// 1. Obter Ordem de Serviço Pública (Orçamento)
export async function getPublicWorkOrderAction(id: string, cpf: string, accessCode: string) {
  try {
    if (!id || !cpf || !accessCode) {
      throw new Error("Parâmetros obrigatórios ausentes.");
    }

    const cleanCpf = cleanDocument(cpf);
    const cleanAccessCode = accessCode.trim().toUpperCase();

    // Busca a OS
    const order = await db.query.workOrders.findFirst({
      where: (wo, { eq }) => eq(wo.id, id),
    });

    if (!order) {
      throw new Error("Ordem de Serviço não encontrada.");
    }

    // Busca o cliente
    const customer = await db.query.customers.findFirst({
      where: (c) => eq(c.id, order.customerId),
    });

    if (!customer) {
      throw new Error("Cliente não encontrado.");
    }

    // Validação de segurança: CPF/CNPJ do Cliente
    const customerDoc = cleanDocument(customer.document || "");
    if (customerDoc !== cleanCpf) {
      throw new Error("Documento (CPF/CNPJ) inválido para este orçamento.");
    }

    // Validação de segurança: Código de Acesso da OS
    const orderAccessCode = (order.budgetAccessCode || "").trim().toUpperCase();
    if (orderAccessCode !== cleanAccessCode) {
      throw new Error("Código de acesso incorreto.");
    }

    // Busca veículo
    const vehicle = await db.query.vehicles.findFirst({
      where: (v) => eq(v.id, order.vehicleId),
    });

    // Busca dados da filial
    const branch = await db.query.branches.findFirst({
      where: (b) => eq(b.id, order.branchId),
    });

    // Busca itens (peças e serviços)
    const items = await db.select({
      id: schema.workOrderItems.id,
      type: schema.workOrderItems.type,
      partId: schema.workOrderItems.partId,
      serviceId: schema.workOrderItems.serviceId,
      customName: schema.workOrderItems.customName,
      quantity: schema.workOrderItems.quantity,
      unitCostPrice: schema.workOrderItems.unitCostPrice,
      unitSalePrice: schema.workOrderItems.unitSalePrice,
      isApproved: schema.workOrderItems.isApproved,
      partName: schema.partsInventory.name,
      partBrand: schema.partsInventory.brand,
      partSku: schema.partsInventory.sku,
      serviceName: schema.servicesCatalog.name,
    })
    .from(schema.workOrderItems)
    .leftJoin(schema.partsInventory, eq(schema.workOrderItems.partId, schema.partsInventory.id))
    .leftJoin(schema.servicesCatalog, eq(schema.workOrderItems.serviceId, schema.servicesCatalog.id))
    .where(eq(schema.workOrderItems.workOrderId, order.id));

    return {
      success: true,
      data: {
        id: order.id,
        osNumber: order.osNumber,
        status: order.status,
        discount: order.discount,
        surcharge: order.surcharge,
        notes: order.notes,
        diagnostic: order.diagnostic,
        createdAt: order.createdAt,
        customer: {
          name: customer.name,
          phone: customer.phone,
          email: customer.email,
        },
        vehicle: vehicle ? {
          brand: vehicle.brand,
          model: vehicle.model,
          plate: vehicle.plate,
          year: vehicle.year,
        } : null,
        branch: branch ? {
          name: branch.name,
          phone: branch.phone,
          cnpj: branch.cnpj,
          address: branch.address,
        } : null,
        items,
      }
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 2. Aprovar Orçamento Público
export async function approvePublicBudgetAction(
  id: string, 
  approvedItemIds: string[], 
  cpf: string, 
  accessCode: string
) {
  try {
    if (!id || !cpf || !accessCode) {
      throw new Error("Parâmetros obrigatórios ausentes.");
    }

    const cleanCpf = cleanDocument(cpf);
    const cleanAccessCode = accessCode.trim().toUpperCase();

    // 1. Busca a OS e valida a posse por segurança
    const order = await db.query.workOrders.findFirst({
      where: (wo, { eq }) => eq(wo.id, id),
    });

    if (!order) {
      throw new Error("Ordem de Serviço não encontrada.");
    }

    // Busca o cliente para verificar CPF
    const customer = await db.query.customers.findFirst({
      where: (c) => eq(c.id, order.customerId),
    });

    if (!customer) {
      throw new Error("Cliente não encontrado.");
    }

    const customerDoc = cleanDocument(customer.document || "");
    if (customerDoc !== cleanCpf) {
      throw new Error("Documento (CPF/CNPJ) inválido.");
    }

    const orderAccessCode = (order.budgetAccessCode || "").trim().toUpperCase();
    if (orderAccessCode !== cleanAccessCode) {
      throw new Error("Código de acesso incorreto.");
    }

    // 2. Executa as atualizações em transação
    await db.transaction(async (tx) => {
      // Atualizar aprovação dos itens
      // Aprovados: isApproved = 1. Rejeitados/Não Aprovados: isApproved = 0
      const items = await tx.select({ id: schema.workOrderItems.id })
        .from(schema.workOrderItems)
        .where(eq(schema.workOrderItems.workOrderId, id));

      for (const item of items) {
        const isApproved = approvedItemIds.includes(item.id) ? 1 : 0;
        await tx.update(schema.workOrderItems)
          .set({ isApproved })
          .where(eq(schema.workOrderItems.id, item.id));
      }

      // Adiciona uma nota ao histórico informando que foi aprovado via portal do cliente
      const approvalLog = `\n[Aprovação Digital] Orçamento revisado e enviado pelo cliente via Portal em ${new Date().toLocaleString("pt-BR")}.`;
      const updatedNotes = order.notes ? `${order.notes}${approvalLog}` : approvalLog.trim();

      // Transiciona o status da OS para "IN_PROGRESS" (Em execução)
      await tx.update(schema.workOrders)
        .set({
          status: 'IN_PROGRESS',
          notes: updatedNotes,
          statusChangedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(schema.workOrders.id, id));
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
