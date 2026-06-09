"use server"

import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { eq, and, not } from "drizzle-orm";
import { requireAuth, requireRole } from "./auth-helper";
import { auth } from "@/lib/auth";

// 1. Obter todos os funcionários do tenant
export async function getEmployeesAction(filters?: {
  role?: "OWNER" | "MANAGER" | "RECEPTOR" | "MECHANIC";
  isActive?: number;
  branchId?: string;
}) {
  try {
    const adminUser = await requireRole(["OWNER", "MANAGER"]);
    if (!adminUser.tenantId) {
      throw new Error("Usuário sem tenant.");
    }

    const conditions = [eq(schema.user.tenantId, adminUser.tenantId)];

    if (filters?.role) {
      conditions.push(eq(schema.user.role, filters.role));
    }
    if (filters?.isActive !== undefined) {
      conditions.push(eq(schema.user.isActive, filters.isActive));
    }
    if (filters?.branchId) {
      conditions.push(eq(schema.user.branchId, filters.branchId));
    }

    const employees = await db.query.user.findMany({
      where: and(...conditions),
      orderBy: (u, { asc }) => [asc(u.name)],
      with: {
        branch: true,
      }
    });

    return { success: true, data: employees };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 2. Criar novo funcionário (registra via Better Auth)
interface CreateEmployeeInput {
  name: string;
  email: string;
  password?: string;
  role: "OWNER" | "MANAGER" | "RECEPTOR" | "MECHANIC";
  branchId?: string;
  commissionRate?: string;
  phone?: string;
  specialties?: string[];
}

export async function createEmployeeAction(input: CreateEmployeeInput) {
  try {
    const adminUser = await requireRole(["OWNER", "MANAGER"]);
    if (!adminUser.tenantId) {
      throw new Error("Usuário sem tenant.");
    }

    if (!input.name || !input.email) {
      throw new Error("Nome e e-mail são obrigatórios.");
    }

    // Verificar se já existe e-mail cadastrado
    const existing = await db.query.user.findFirst({
      where: eq(schema.user.email, input.email),
    });
    if (existing) {
      throw new Error("Este e-mail já está cadastrado.");
    }

    // Se senha não for enviada, criamos uma padrão temporária
    const pwd = input.password || "kyper123@";

    // Criamos o usuário no Better Auth passando uma instância limpa de Headers
    // Isso garante que a sessão do admin logado não seja substituída
    const signUpResult = await auth.api.signUpEmail({
      body: {
        email: input.email,
        password: pwd,
        name: input.name,
        tenantId: adminUser.tenantId,
        branchId: input.branchId || adminUser.branchId,
        role: input.role,
        commissionRate: input.role === "MECHANIC" ? (input.commissionRate || "0.00") : "0.00",
        isActive: 1,
      },
      headers: new Headers(),
    });

    if (!signUpResult || !signUpResult.user) {
      throw new Error("Falha ao registrar credenciais do funcionário.");
    }

    // Atualiza os dados extras específicos (telefone, especialidades) diretamente no banco
    await db
      .update(schema.user)
      .set({
        phone: input.phone || null,
        specialties: input.specialties || null,
        workStatus: "AVAILABLE",
      })
      .where(eq(schema.user.id, signUpResult.user.id));

    return { success: true, data: signUpResult.user };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 3. Atualizar funcionário existente
interface UpdateEmployeeInput {
  id: string;
  name: string;
  role: "OWNER" | "MANAGER" | "RECEPTOR" | "MECHANIC";
  branchId?: string;
  commissionRate?: string;
  isActive: number;
  phone?: string;
  specialties?: string[];
  workStatus?: "AVAILABLE" | "BUSY" | "AWAY";
}

export async function updateEmployeeAction(input: UpdateEmployeeInput) {
  try {
    const adminUser = await requireRole(["OWNER", "MANAGER"]);
    if (!adminUser.tenantId) {
      throw new Error("Usuário sem tenant.");
    }

    // Validar se o funcionário pertence ao mesmo tenant
    const targetUser = await db.query.user.findFirst({
      where: and(
        eq(schema.user.id, input.id),
        eq(schema.user.tenantId, adminUser.tenantId)
      ),
    });

    if (!targetUser) {
      throw new Error("Funcionário não encontrado ou não pertence a esta empresa.");
    }

    // Impedir que um administrador desative a si mesmo
    if (adminUser.id === input.id && input.isActive === 0) {
      throw new Error("Você não pode desativar o seu próprio usuário.");
    }

    // Atualizar no banco
    const [updated] = await db
      .update(schema.user)
      .set({
        name: input.name,
        role: input.role,
        branchId: input.branchId || null,
        commissionRate: input.role === "MECHANIC" ? (input.commissionRate || "0.00") : "0.00",
        isActive: input.isActive,
        phone: input.phone || null,
        specialties: input.specialties || null,
        workStatus: input.workStatus || "AVAILABLE",
        updatedAt: new Date(),
      })
      .where(eq(schema.user.id, input.id))
      .returning();

    return { success: true, data: updated };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 4. Obter carga de trabalho dos mecânicos em tempo real
export async function getMechanicWorkloadAction() {
  try {
    const adminUser = await requireRole(["OWNER", "MANAGER"]);
    if (!adminUser.tenantId) {
      throw new Error("Usuário sem tenant.");
    }

    // Buscar mecânicos do tenant
    const mechanics = await db.query.user.findMany({
      where: and(
        eq(schema.user.tenantId, adminUser.tenantId),
        eq(schema.user.role, "MECHANIC"),
        eq(schema.user.isActive, 1)
      ),
      orderBy: (u, { asc }) => [asc(u.name)],
    });

    // Buscar ordens de serviço ativas (tudo exceto READY e DELIVERED)
    const activeOrders = await db.query.workOrders.findMany({
      where: and(
        eq(schema.workOrders.tenantId, adminUser.tenantId),
        not(eq(schema.workOrders.status, "READY")),
        not(eq(schema.workOrders.status, "DELIVERED"))
      ),
      with: {
        customer: true,
        vehicle: true,
        items: true,
      }
    });

    const workload = mechanics.map(mech => {
      const mechOrders = activeOrders.filter(o => o.mechanicId === mech.id);
      
      // Encontrar a ordem em progresso (geralmente uma por vez)
      const currentOrder = mechOrders.find(o => o.status === "IN_PROGRESS");
      const pendingQueue = mechOrders.filter(o => o.status !== "IN_PROGRESS");

      return {
        mechanicId: mech.id,
        name: mech.name,
        email: mech.email,
        phone: mech.phone,
        specialties: mech.specialties || [],
        workStatus: mech.workStatus,
        activeOrdersCount: mechOrders.length,
        currentJob: currentOrder ? {
          id: currentOrder.id,
          osNumber: currentOrder.osNumber,
          status: currentOrder.status,
          box: currentOrder.allocatedBox,
          vehicle: `${currentOrder.vehicle.brand} ${currentOrder.vehicle.model} (${currentOrder.vehicle.plate})`,
          customer: currentOrder.customer.name,
          itemsCount: currentOrder.items.length,
          approvedItemsCount: currentOrder.items.filter(i => i.isApproved === 1).length,
        } : null,
        queue: pendingQueue.map(q => ({
          id: q.id,
          osNumber: q.osNumber,
          status: q.status,
          box: q.allocatedBox,
          vehicle: `${q.vehicle.brand} ${q.vehicle.model}`,
        })),
      };
    });

    return { success: true, data: workload };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 5. Obter filiais da empresa para seleção
export async function getBranchesAction() {
  try {
    const adminUser = await requireAuth();
    if (!adminUser.tenantId) {
      throw new Error("Usuário sem tenant.");
    }
    const list = await db.query.branches.findMany({
      where: eq(schema.branches.tenantId, adminUser.tenantId),
      orderBy: (b, { asc }) => [asc(b.name)],
    });
    return { success: true, data: list };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
