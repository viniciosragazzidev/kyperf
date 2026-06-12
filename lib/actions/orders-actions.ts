"use server"

import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { eq, and, or, like, desc } from "drizzle-orm";
import { requireAuth, requireRole } from "./auth-helper";

const getAuthenticatedUser = requireAuth;

// 1. Obter lista de mecânicos da oficina
export async function getMechanicsAction() {
  try {
    const user = await getAuthenticatedUser();
    if (!user.tenantId) {
      throw new Error("Usuário não possui empresa vinculada.");
    }

    const mechanics = await db.query.user.findMany({
      where: (u, { eq, and }) => and(
        eq(u.tenantId, user.tenantId!),
        eq(u.role, 'MECHANIC'),
        eq(u.isActive, 1)
      ),
      columns: {
        id: true,
        name: true,
        email: true,
        commissionRate: true,
      }
    });

    return { success: true, data: mechanics };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 2. Buscar cliente por telefone ou documento (CPF/CNPJ)
export async function searchCustomerAction(query: string) {
  try {
    const user = await getAuthenticatedUser();
    if (!user.tenantId) {
      throw new Error("Usuário não possui empresa vinculada.");
    }

    const cleanQuery = query.replace(/\D/g, "");
    if (!cleanQuery) return { success: true, data: [] };

    const results = await db.query.customers.findMany({
      where: (c, { eq, and, or, like }) => and(
        eq(c.tenantId, user.tenantId!),
        or(
          like(c.phone, `%${cleanQuery}%`),
          c.document ? like(c.document, `%${cleanQuery}%`) : undefined
        )
      )
    });

    return { success: true, data: results };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 3. Buscar veículo por placa com detalhes do proprietário
export async function searchVehicleAction(plate: string) {
  try {
    const user = await getAuthenticatedUser();
    if (!user.tenantId) {
      throw new Error("Usuário não possui empresa vinculada.");
    }

    const cleanPlate = plate.toUpperCase().replace(/[^A-Z0-9]/g, "").trim();
    if (!cleanPlate) return { success: true, data: null };

    const vehicle = await db.query.vehicles.findFirst({
      where: (v, { eq, and }) => and(
        eq(v.tenantId, user.tenantId!),
        eq(v.plate, cleanPlate)
      )
    });

    if (!vehicle) {
      return { success: true, data: null };
    }

    // Busca o cliente dono do veículo
    const customer = await db.query.customers.findFirst({
      where: (c, { eq }) => eq(c.id, vehicle.customerId)
    });

    return { 
      success: true, 
      data: {
        ...vehicle,
        customer: customer || null
      }
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 4. Criar uma Ordem de Serviço
interface WorkOrderItemInput {
  type: 'PART' | 'SERVICE';
  partId?: string;
  serviceId?: string;
  customName?: string;
  quantity: number;
  unitCostPrice: string;
  unitSalePrice: string;
  isApproved: number;
}

interface CreateWorkOrderInput {
  customerId?: string;
  newCustomerName?: string;
  newCustomerPhone?: string;
  newCustomerDocument?: string;
  newCustomerEmail?: string;
  newCustomerAddress?: string;

  vehicleId?: string;
  newVehiclePlate: string;
  newVehicleBrand: string;
  newVehicleModel: string;
  newVehicleYear?: string;
  newVehicleEngine?: string;
  newVehicleMileage?: string;

  branchId?: string;
  mechanicId?: string;
  allocatedBox?: string;
  fuelLevel?: string;
  damages?: string;
  notes?: string;
  diagnostic?: string;
  photoUrls?: string[];
  checklist?: string;
  warranty?: string;
  discount?: string;
  surcharge?: string;
  paymentMethod?: string;
  paymentStatus?: 'PENDING' | 'PAID' | 'LATE';

  status?: 'CHECK_IN' | 'AWAITING_BUDGET' | 'AWAITING_APPROVAL' | 'AWAITING_PARTS' | 'IN_PROGRESS' | 'TESTING_WASHING' | 'READY' | 'DELIVERED';
  items?: WorkOrderItemInput[];
}

function generateAccessCode(): string {
  const numbers = "0123456789";
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let numPart = "";
  let letPart = "";
  for (let i = 0; i < 3; i++) {
    numPart += numbers.charAt(Math.floor(Math.random() * numbers.length));
    letPart += letters.charAt(Math.floor(Math.random() * letters.length));
  }
  return `${numPart}${letPart}`;
}

export async function createWorkOrderAction(input: CreateWorkOrderInput) {
  try {
    const user = await getAuthenticatedUser();
    if (!user.tenantId) {
      throw new Error("Usuário não possui empresa vinculada.");
    }

    // Define a filial de destino da OS
    const activeBranchId = input.branchId || user.branchId;
    if (!activeBranchId) {
      throw new Error("É necessário definir uma filial para abrir a Ordem de Serviço.");
    }

    const result = await db.transaction(async (tx) => {
      // 1. Identificar ou Criar Cliente
      let finalCustomerId = input.customerId;

      if (!finalCustomerId) {
        if (!input.newCustomerName || !input.newCustomerPhone) {
          throw new Error("Nome e telefone são necessários para cadastrar um novo cliente.");
        }

        // Tenta buscar se o cliente já existe pelo telefone
        const rawPhone = input.newCustomerPhone.replace(/\D/g, "");
        const existingCust = await tx.query.customers.findFirst({
          where: (c, { eq, and }) => and(
            eq(c.tenantId, user.tenantId!),
            eq(c.phone, rawPhone)
          )
        });

        if (existingCust) {
          finalCustomerId = existingCust.id;
        } else {
          const [newCust] = await tx.insert(schema.customers).values({
            tenantId: user.tenantId!,
            name: input.newCustomerName,
            phone: rawPhone,
            document: input.newCustomerDocument?.replace(/\D/g, "") || null,
            email: input.newCustomerEmail || null,
            address: input.newCustomerAddress || null,
          }).returning();

          if (!newCust) throw new Error("Erro ao criar novo cliente para a OS.");
          finalCustomerId = newCust.id;
        }
      }

      // 2. Identificar ou Criar Veículo
      let finalVehicleId = input.vehicleId;
      const cleanPlate = input.newVehiclePlate.toUpperCase().replace(/[^A-Z0-9]/g, "").trim();

      if (!finalVehicleId) {
        if (!cleanPlate || !input.newVehicleBrand || !input.newVehicleModel) {
          throw new Error("Placa, marca e modelo são necessários para cadastrar um veículo na OS.");
        }

        // Tenta buscar se o veículo já existe pela placa
        const existingVeh = await tx.query.vehicles.findFirst({
          where: (v, { eq, and }) => and(
            eq(v.tenantId, user.tenantId!),
            eq(v.plate, cleanPlate)
          )
        });

        if (existingVeh) {
          finalVehicleId = existingVeh.id;
        } else {
          const [newVeh] = await tx.insert(schema.vehicles).values({
            tenantId: user.tenantId!,
            customerId: finalCustomerId!,
            plate: cleanPlate,
            brand: input.newVehicleBrand,
            model: input.newVehicleModel,
            year: input.newVehicleYear ? parseInt(input.newVehicleYear, 10) : null,
            engine: input.newVehicleEngine || null,
            mileage: input.newVehicleMileage ? parseInt(input.newVehicleMileage, 10) : null,
          }).returning();

          if (!newVeh) throw new Error("Erro ao criar veículo para a OS.");
          finalVehicleId = newVeh.id;
        }
      } else {
        // Atualiza a quilometragem no cadastro principal do veículo se fornecida
        if (input.newVehicleMileage) {
          await tx.update(schema.vehicles)
            .set({ mileage: parseInt(input.newVehicleMileage, 10) })
            .where(eq(schema.vehicles.id, finalVehicleId));
        }
      }

      // Calcular o próximo número da OS de forma isolada por tenant
      const maxOrder = await tx.query.workOrders.findFirst({
        where: (wo, { eq }) => eq(wo.tenantId, user.tenantId!),
        orderBy: (wo, { desc }) => desc(wo.osNumber),
      });
      const nextOsNumber = (maxOrder?.osNumber || 0) + 1;

      // Gerar código de acesso público (3 números + 3 letras)
      const budgetAccessCode = generateAccessCode();

      // 3. Criar a Ordem de Serviço
      const [newOrder] = await tx.insert(schema.workOrders).values({
        tenantId: user.tenantId!,
        branchId: activeBranchId,
        osNumber: nextOsNumber,
        customerId: finalCustomerId!,
        vehicleId: finalVehicleId!,
        mechanicId: input.mechanicId || null,
        status: input.status || 'CHECK_IN',
        paymentStatus: input.paymentStatus || 'PENDING',
        currentMileage: input.newVehicleMileage ? parseInt(input.newVehicleMileage, 10) : 0,
        allocatedBox: input.allocatedBox || null,
        fuelLevel: input.fuelLevel || null,
        damages: input.damages || null,
        checklist: input.checklist || null,
        warranty: input.warranty || null,
        discount: input.discount || '0.00',
        surcharge: input.surcharge || '0.00',
        paymentMethod: input.paymentMethod || null,
        budgetAccessCode,
        notes: input.notes || null,
        diagnostic: input.diagnostic || null,
        photoUrls: input.photoUrls || [],
      }).returning();

      if (!newOrder) {
        throw new Error("Erro ao criar registro da O.S.");
      }

      // Registrar log de status inicial no histórico
      await tx.insert(schema.workOrderStatusHistory).values({
        tenantId: user.tenantId!,
        workOrderId: newOrder.id,
        status: newOrder.status,
        changedById: user.id,
        notes: "Abertura da Ordem de Serviço.",
      });

      // 4. Inserir itens da O.S. (se fornecidos)
      if (input.items && input.items.length > 0) {
        for (const item of input.items) {
          let finalPartId = item.type === 'PART' ? (item.partId || null) : null;
          let finalServiceId = item.type === 'SERVICE' ? (item.serviceId || null) : null;

          // Auto-registro de peças avulsas no estoque em background
          if (item.type === 'PART' && !finalPartId && item.customName) {
            const existingPart = await tx.query.partsInventory.findFirst({
              where: (pi, { eq, and }) => and(
                eq(pi.tenantId, user.tenantId!),
                eq(pi.name, item.customName!)
              )
            });
            if (existingPart) {
              finalPartId = existingPart.id;
            } else {
              const [newPart] = await tx.insert(schema.partsInventory).values({
                tenantId: user.tenantId!,
                branchId: activeBranchId!,
                name: item.customName!,
                sku: `AVULSO-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
                quantity: 0,
                minQuantity: 1,
                costPrice: item.unitCostPrice || '0.00',
                salePrice: item.unitSalePrice || '0.00',
              }).returning();
              if (newPart) finalPartId = newPart.id;
            }
          }

          // Auto-registro de serviços avulsos no catálogo em background
          if (item.type === 'SERVICE' && !finalServiceId && item.customName) {
            const existingService = await tx.query.servicesCatalog.findFirst({
              where: (sc, { eq, and }) => and(
                eq(sc.tenantId, user.tenantId!),
                eq(sc.name, item.customName!)
              )
            });
            if (existingService) {
              finalServiceId = existingService.id;
            } else {
              const [newService] = await tx.insert(schema.servicesCatalog).values({
                tenantId: user.tenantId!,
                name: item.customName!,
                estimatedTimeMinutes: 60,
                basePrice: item.unitSalePrice || '0.00',
              }).returning();
              if (newService) finalServiceId = newService.id;
            }
          }

          await tx.insert(schema.workOrderItems).values({
            workOrderId: newOrder.id,
            type: item.type,
            partId: finalPartId,
            serviceId: finalServiceId,
            customName: item.customName || null,
            quantity: item.quantity,
            unitCostPrice: item.unitCostPrice,
            unitSalePrice: item.unitSalePrice,
            isApproved: item.isApproved,
          });
        }
      }

      return newOrder;
    });

    return { success: true, data: result };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 5. Atualizar uma Ordem de Serviço Existente
interface UpdateWorkOrderInput {
  id: string;
  mechanicId?: string;
  allocatedBox?: string;
  fuelLevel?: string;
  damages?: string;
  notes?: string;
  diagnostic?: string;
  photoUrls?: string[];
  checklist?: string;
  warranty?: string;
  discount?: string;
  surcharge?: string;
  paymentMethod?: string;
  paymentStatus?: 'PENDING' | 'PAID' | 'LATE';
  status?: 'CHECK_IN' | 'AWAITING_BUDGET' | 'AWAITING_APPROVAL' | 'AWAITING_PARTS' | 'IN_PROGRESS' | 'TESTING_WASHING' | 'READY' | 'DELIVERED';
  currentMileage?: string;
  items?: WorkOrderItemInput[];
}

export async function updateWorkOrderAction(input: UpdateWorkOrderInput) {
  try {
    const user = await getAuthenticatedUser();
    if (!user.tenantId) {
      throw new Error("Usuário não possui empresa vinculada.");
    }

    // Busca OS existente para validar posse
    const existingOrder = await db.query.workOrders.findFirst({
      where: (wo, { eq, and }) => and(
        eq(wo.id, input.id),
        eq(wo.tenantId, user.tenantId!)
      )
    });

    if (!existingOrder) {
      throw new Error("Ordem de Serviço não encontrada.");
    }

    const result = await db.transaction(async (tx) => {
      // Verifica se o status mudou para registrar statusChangedAt
      const statusChanged = input.status && input.status !== existingOrder.status;

      if (statusChanged && input.status) {
        await tx.insert(schema.workOrderStatusHistory).values({
          tenantId: user.tenantId!,
          workOrderId: existingOrder.id,
          status: input.status,
          changedById: user.id,
          notes: "Atualização de status no painel de controle.",
        });
      }

      // 1. Atualizar Ordem de Serviço
      const [updatedOrder] = await tx.update(schema.workOrders)
        .set({
          mechanicId: input.mechanicId !== undefined ? input.mechanicId : existingOrder.mechanicId,
          status: input.status || existingOrder.status,
          paymentStatus: input.paymentStatus || existingOrder.paymentStatus,
          currentMileage: input.currentMileage ? parseInt(input.currentMileage, 10) : existingOrder.currentMileage,
          allocatedBox: input.allocatedBox !== undefined ? input.allocatedBox : existingOrder.allocatedBox,
          fuelLevel: input.fuelLevel !== undefined ? input.fuelLevel : existingOrder.fuelLevel,
          damages: input.damages !== undefined ? input.damages : existingOrder.damages,
          checklist: input.checklist !== undefined ? input.checklist : existingOrder.checklist,
          warranty: input.warranty !== undefined ? input.warranty : existingOrder.warranty,
          discount: input.discount !== undefined ? input.discount : existingOrder.discount,
          surcharge: input.surcharge !== undefined ? input.surcharge : existingOrder.surcharge,
          paymentMethod: input.paymentMethod !== undefined ? input.paymentMethod : existingOrder.paymentMethod,
          notes: input.notes !== undefined ? input.notes : existingOrder.notes,
          diagnostic: input.diagnostic !== undefined ? input.diagnostic : existingOrder.diagnostic,
          photoUrls: input.photoUrls !== undefined ? input.photoUrls : existingOrder.photoUrls,
          statusChangedAt: statusChanged ? new Date() : existingOrder.statusChangedAt,
          updatedAt: new Date(),
        })
        .where(eq(schema.workOrders.id, input.id))
        .returning();

      // Se mudou quilometragem, atualiza no veículo também
      if (input.currentMileage) {
        await tx.update(schema.vehicles)
          .set({ mileage: parseInt(input.currentMileage, 10) })
          .where(eq(schema.vehicles.id, existingOrder.vehicleId));
      }

      // 2. Atualizar Itens da OS (Remove antigos e reinsere novos)
      if (input.items !== undefined) {
        await tx.delete(schema.workOrderItems)
          .where(eq(schema.workOrderItems.workOrderId, input.id));

        if (input.items.length > 0) {
          for (const item of input.items) {
            let finalPartId = item.type === 'PART' ? (item.partId || null) : null;
            let finalServiceId = item.type === 'SERVICE' ? (item.serviceId || null) : null;

            // Auto-registro de peças avulsas no estoque em background
            if (item.type === 'PART' && !finalPartId && item.customName) {
              const existingPart = await tx.query.partsInventory.findFirst({
                where: (pi, { eq, and }) => and(
                  eq(pi.tenantId, user.tenantId!),
                  eq(pi.name, item.customName!)
                )
              });
              if (existingPart) {
                finalPartId = existingPart.id;
              } else {
                const [newPart] = await tx.insert(schema.partsInventory).values({
                  tenantId: user.tenantId!,
                  branchId: existingOrder.branchId || user.branchId!,
                  name: item.customName!,
                  sku: `AVULSO-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
                  quantity: 0,
                  minQuantity: 1,
                  costPrice: item.unitCostPrice || '0.00',
                  salePrice: item.unitSalePrice || '0.00',
                }).returning();
                if (newPart) finalPartId = newPart.id;
              }
            }

            // Auto-registro de serviços avulsos no catálogo em background
            if (item.type === 'SERVICE' && !finalServiceId && item.customName) {
              const existingService = await tx.query.servicesCatalog.findFirst({
                where: (sc, { eq, and }) => and(
                  eq(sc.tenantId, user.tenantId!),
                  eq(sc.name, item.customName!)
                )
              });
              if (existingService) {
                finalServiceId = existingService.id;
              } else {
                const [newService] = await tx.insert(schema.servicesCatalog).values({
                  tenantId: user.tenantId!,
                  name: item.customName!,
                  estimatedTimeMinutes: 60,
                  basePrice: item.unitSalePrice || '0.00',
                }).returning();
                if (newService) finalServiceId = newService.id;
              }
            }

            await tx.insert(schema.workOrderItems).values({
              workOrderId: input.id,
              type: item.type,
              partId: finalPartId,
              serviceId: finalServiceId,
              customName: item.customName || null,
              quantity: item.quantity,
              unitCostPrice: item.unitCostPrice,
              unitSalePrice: item.unitSalePrice,
              isApproved: item.isApproved,
            });
          }
        }
      }

      return updatedOrder;
    });

    return { success: true, data: result };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 6. Obter detalhes de uma Ordem de Serviço completa
export async function getWorkOrderAction(id: string) {
  try {
    const user = await getAuthenticatedUser();
    if (!user.tenantId) {
      throw new Error("Usuário não possui empresa vinculada.");
    }

    const order = await db.query.workOrders.findFirst({
      where: (wo, { eq, and }) => and(
        eq(wo.id, id),
        eq(wo.tenantId, user.tenantId!)
      )
    });

    if (!order) {
      throw new Error("Ordem de Serviço não encontrada.");
    }

    // Busca cliente
    const customer = await db.query.customers.findFirst({
      where: (c) => eq(c.id, order.customerId)
    });

    // Busca veículo
    const vehicle = await db.query.vehicles.findFirst({
      where: (v) => eq(v.id, order.vehicleId)
    });

    // Busca mecânico responsável
    let mechanic = null;
    if (order.mechanicId) {
      mechanic = await db.query.user.findFirst({
        where: (u) => eq(u.id, order.mechanicId!),
        columns: {
          id: true,
          name: true,
          email: true,
          commissionRate: true,
        }
      });
    }

    // Busca itens vinculados
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
        ...order,
        customer: customer || null,
        vehicle: vehicle || null,
        mechanic: mechanic || null,
        items
      } 
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 7. Obter lista resumida de todas as O.S. (para histórico ou listagem geral)
export async function getWorkOrdersAction() {
  try {
    const user = await getAuthenticatedUser();
    if (!user.tenantId) {
      throw new Error("Usuário não possui empresa vinculada.");
    }

    const orders = await db.select({
      id: schema.workOrders.id,
      osNumber: schema.workOrders.osNumber,
      status: schema.workOrders.status,
      paymentStatus: schema.workOrders.paymentStatus,
      createdAt: schema.workOrders.createdAt,
      statusChangedAt: schema.workOrders.statusChangedAt,
      customerName: schema.customers.name,
      vehiclePlate: schema.vehicles.plate,
      vehicleBrand: schema.vehicles.brand,
      vehicleModel: schema.vehicles.model,
      mechanicName: schema.user.name,
      discount: schema.workOrders.discount,
      surcharge: schema.workOrders.surcharge,
    })
    .from(schema.workOrders)
    .innerJoin(schema.customers, eq(schema.workOrders.customerId, schema.customers.id))
    .innerJoin(schema.vehicles, eq(schema.workOrders.vehicleId, schema.vehicles.id))
    .leftJoin(schema.user, eq(schema.workOrders.mechanicId, schema.user.id))
    .where(eq(schema.workOrders.tenantId, user.tenantId!))
    .orderBy(desc(schema.workOrders.createdAt));

    // Buscar itens para calcular os totais
    const items = await db.select({
      workOrderId: schema.workOrderItems.workOrderId,
      quantity: schema.workOrderItems.quantity,
      unitSalePrice: schema.workOrderItems.unitSalePrice,
      isApproved: schema.workOrderItems.isApproved,
    })
    .from(schema.workOrderItems)
    .innerJoin(schema.workOrders, eq(schema.workOrderItems.workOrderId, schema.workOrders.id))
    .where(eq(schema.workOrders.tenantId, user.tenantId!));

    const ordersWithTotals = orders.map(order => {
      const orderItems = items.filter(item => item.workOrderId === order.id);
      
      let totalApproved = 0;
      let totalGeneral = 0;
      
      orderItems.forEach(item => {
        const val = item.quantity * parseFloat(item.unitSalePrice);
        if (item.isApproved === 1) {
          totalApproved += val;
        }
        totalGeneral += val;
      });
      
      const disc = parseFloat(order.discount || '0');
      const sur = parseFloat(order.surcharge || '0');
      
      // O total final considera itens aprovados - desconto + acréscimo
      const grandTotal = Math.max(0, totalApproved - disc + sur);

      return {
        ...order,
        totalApproved,
        totalGeneral,
        grandTotal
      };
    });

    return { success: true, data: ordersWithTotals };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 8. Obter perfil do usuário logado
export async function getCurrentUserAction() {
  try {
    const user = await getAuthenticatedUser();
    return { success: true, data: user };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 9. Deletar uma Ordem de Serviço
export async function deleteWorkOrderAction(id: string) {
  try {
    // Apenas OWNER e MANAGER podem deletar Ordens de Serviço
    const user = await requireRole(['OWNER', 'MANAGER']);
    if (!user.tenantId) {
      throw new Error("Usuário não possui empresa vinculada.");
    }

    const existingOrder = await db.query.workOrders.findFirst({
      where: (wo, { eq, and }) => and(
        eq(wo.id, id),
        eq(wo.tenantId, user.tenantId!)
      )
    });

    if (!existingOrder) {
      throw new Error("Ordem de Serviço não encontrada.");
    }

    await db.delete(schema.workOrders)
      .where(eq(schema.workOrders.id, id));

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getYardOrdersAction() {
  try {
    const user = await getAuthenticatedUser();
    if (!user.tenantId) {
      throw new Error("Usuário não possui empresa vinculada.");
    }

    const orders = await db.select({
      id: schema.workOrders.id,
      osNumber: schema.workOrders.osNumber,
      status: schema.workOrders.status,
      createdAt: schema.workOrders.createdAt,
      statusChangedAt: schema.workOrders.statusChangedAt,
      customerName: schema.customers.name,
      customerPhone: schema.customers.phone,
      vehiclePlate: schema.vehicles.plate,
      vehicleBrand: schema.vehicles.brand,
      vehicleModel: schema.vehicles.model,
      mechanicName: schema.user.name,
      allocatedBox: schema.workOrders.allocatedBox,
    })
    .from(schema.workOrders)
    .innerJoin(schema.customers, eq(schema.workOrders.customerId, schema.customers.id))
    .innerJoin(schema.vehicles, eq(schema.workOrders.vehicleId, schema.vehicles.id))
    .leftJoin(schema.user, eq(schema.workOrders.mechanicId, schema.user.id))
    .where(eq(schema.workOrders.tenantId, user.tenantId!))
    .orderBy(desc(schema.workOrders.createdAt));

    const activeOrders = orders.filter(o => o.status !== 'DELIVERED');

    return { success: true, data: activeOrders };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
