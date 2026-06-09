"use server"

import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";

// Helper para validar a sessão e retornar o usuário/tenant
// Helper para validar a sessão e retornar o usuário
async function getAuthenticatedUser() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || !session.user) {
    throw new Error("Não autorizado. Faça login novamente.");
  }

  const userId = session.user.id;
  const dbUser = await db.query.user.findFirst({
    where: (user, { eq }) => eq(user.id, userId),
  });

  if (!dbUser) {
    throw new Error("Usuário não cadastrado.");
  }

  return dbUser;
}

// 1. Obter o estado atual do Onboarding
export async function getOnboardingStateAction() {
  try {
    const user = await getAuthenticatedUser();
    
    // Se o usuário não tem um Tenant, ele está iniciando do zero absoluto
    if (!user.tenantId) {
      return {
        success: true,
        data: {
          onboardingCompleted: false,
          tenant: null,
          branch: null,
        },
      };
    }

    const tenant = await db.query.tenants.findFirst({
      where: (tenants, { eq }) => eq(tenants.id, user.tenantId!),
    });

    if (!tenant) {
      return {
        success: true,
        data: {
          onboardingCompleted: false,
          tenant: null,
          branch: null,
        },
      };
    }

    const branch = await db.query.branches.findFirst({
      where: (branches, { eq }) => eq(branches.tenantId, tenant.id),
    });

    return {
      success: true,
      data: {
        onboardingCompleted: tenant.onboardingCompleted,
        tenant,
        branch,
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 2. Salvar Passo 1: Dados da Oficina & Filial Matriz
interface Step1Input {
  companyName: string;
  cnpj?: string;
  email?: string;
  phone: string;
  address: string;
}
export async function saveOnboardingStep1Action(input: Step1Input) {
  try {
    const user = await getAuthenticatedUser();
    const { companyName, cnpj, email, phone, address } = input;

    if (!companyName) {
      throw new Error("O nome da oficina é obrigatório.");
    }

    await db.transaction(async (tx) => {
      let tenantId = user.tenantId;
      let branchId = user.branchId;

      // Se o usuário ainda não tem um Tenant, cria um novo
      if (!tenantId) {
        const slug = companyName
          .toLowerCase()
          .trim()
          .replace(/[^\w\s-]/g, "")
          .replace(/[\s_-]+/g, "-")
          .replace(/^-+|-+$/g, "");

        // Gera slug única
        const existingTenant = await tx.query.tenants.findFirst({
          where: (tenants, { eq }) => eq(tenants.slug, slug),
        });

        let finalSlug = slug;
        if (existingTenant) {
          finalSlug = `${slug}-${Math.floor(Math.random() * 10000)}`;
        }

        const [newTenant] = await tx
          .insert(schema.tenants)
          .values({
            name: companyName,
            slug: finalSlug,
            planStatus: "ACTIVE",
            onboardingCompleted: false,
          })
          .returning();

        if (!newTenant) {
          throw new Error("Erro ao criar empresa.");
        }

        tenantId = newTenant.id;

        // Cria a filial padrão vinculada ao novo tenant
        const [newBranch] = await tx
          .insert(schema.branches)
          .values({
            tenantId: tenantId,
            name: "Matriz - " + companyName,
            phone,
            address,
            cnpj: cnpj || null,
            email: email || null,
          })
          .returning();

        if (!newBranch) {
          throw new Error("Erro ao criar filial padrão.");
        }

        branchId = newBranch.id;

        // Vincula o usuário ao Tenant e Branch como OWNER
        await tx
          .update(schema.user)
          .set({
            tenantId: tenantId,
            branchId: branchId,
            role: "OWNER",
            updatedAt: new Date(),
          })
          .where(eq(schema.user.id, user.id));
      } else {
        // Fluxo existente: Apenas atualiza o nome do Tenant e os dados da Branch
        await tx
          .update(schema.tenants)
          .set({ name: companyName, updatedAt: new Date() })
          .where(eq(schema.tenants.id, tenantId));

        if (branchId) {
          await tx
            .update(schema.branches)
            .set({ 
              name: "Matriz - " + companyName, 
              phone, 
              address,
              cnpj: cnpj || null,
              email: email || null,
            })
            .where(eq(schema.branches.id, branchId));
        } else {
          const firstBranch = await tx.query.branches.findFirst({
            where: (branches, { eq }) => eq(branches.tenantId, tenantId!),
          });

          if (firstBranch) {
            await tx
              .update(schema.branches)
              .set({ 
                name: "Matriz - " + companyName, 
                phone, 
                address,
                cnpj: cnpj || null,
                email: email || null,
              })
              .where(eq(schema.branches.id, firstBranch.id));
          } else {
            await tx.insert(schema.branches).values({
              tenantId: tenantId,
              name: "Matriz - " + companyName,
              phone,
              address,
              cnpj: cnpj || null,
              email: email || null,
            });
          }
        }
      }
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 3. Salvar Passo 2: Cadastro de Mecânico Inicial
interface Step2Input {
  name: string;
  email: string;
  commissionRate: string;
}
export async function saveOnboardingStep2Action(input: Step2Input) {
  try {
    const user = await getAuthenticatedUser();
    const { name, email, commissionRate } = input;

    if (!name || !email) {
      throw new Error("Nome e e-mail do mecânico são obrigatórios.");
    }

    // Busca a branch do usuário para vincular o mecânico
    const branchId = user.branchId;
    if (!branchId) {
      throw new Error("Usuário não possui uma filial padrão vinculada.");
    }

    const randomId = crypto.randomUUID();

    await db.insert(schema.user).values({
      id: randomId,
      name,
      email: email.toLowerCase().trim(),
      emailVerified: false,
      tenantId: user.tenantId!,
      branchId: branchId,
      role: "MECHANIC",
      commissionRate: commissionRate || "0.00",
      isActive: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 4. Salvar Passo 3: Importar Serviços do Catálogo
interface ServiceInput {
  name: string;
  estimatedTimeMinutes: number;
  basePrice: string;
}
export async function saveOnboardingStep3Action(services: ServiceInput[]) {
  try {
    const user = await getAuthenticatedUser();

    if (!services || services.length === 0) {
      // O usuário pode decidir não importar nenhum serviço inicialmente, o que é aceitável
      return { success: true };
    }

    await db.transaction(async (tx) => {
      for (const svc of services) {
        await tx.insert(schema.servicesCatalog).values({
          tenantId: user.tenantId!,
          name: svc.name,
          estimatedTimeMinutes: svc.estimatedTimeMinutes,
          basePrice: svc.basePrice,
        });
      }
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 5. Finalizar Onboarding
export async function completeOnboardingAction() {
  try {
    const user = await getAuthenticatedUser();

    await db
      .update(schema.tenants)
      .set({ onboardingCompleted: true, updatedAt: new Date() })
      .where(eq(schema.tenants.id, user.tenantId!));

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
