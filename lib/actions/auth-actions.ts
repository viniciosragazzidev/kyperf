"use server"

import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";

interface RegisterTenantInput {
  name: string;
  email: string;
  password: string;
  companyName: string;
}

export async function registerTenantAction(input: RegisterTenantInput) {
  try {
    const { name, email, password, companyName } = input;

    if (!name || !email || !password || !companyName) {
      return { success: false, error: "Todos os campos são obrigatórios." };
    }

    // 1. Gerar Slug a partir do nome da empresa
    const slug = companyName
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");

    // Verificar se o slug já existe
    const existingTenant = await db.query.tenants.findFirst({
      where: (tenants, { eq }) => eq(tenants.slug, slug),
    });

    let finalSlug = slug;
    if (existingTenant) {
      finalSlug = `${slug}-${Math.floor(Math.random() * 10000)}`;
    }

    // 2. Executar a transação para criar Tenant e Filial Padrão
    const result = await db.transaction(async (tx) => {
      // Criar Tenant (empresa)
      const [newTenant] = await tx
        .insert(schema.tenants)
        .values({
          name: companyName,
          slug: finalSlug,
          planStatus: "ACTIVE",
        })
        .returning();

      if (!newTenant) {
        throw new Error("Erro ao criar o registro da empresa.");
      }

      // Criar filial padrão (Matriz)
      const [newBranch] = await tx
        .insert(schema.branches)
        .values({
          tenantId: newTenant.id,
          name: "Matriz",
        })
        .returning();

      if (!newBranch) {
        throw new Error("Erro ao criar a filial matriz padrão.");
      }

      return { tenant: newTenant, branch: newBranch };
    });

    // 3. Cadastrar usuário no Better Auth associando o Tenant e a Branch
    const signUpResult = await auth.api.signUpEmail({
      body: {
        email,
        password,
        name,
        tenantId: result.tenant.id,
        branchId: result.branch.id,
        commissionRate: "0.00",
        isActive: 1,
      },
      headers: await headers(),
    });

    if (!signUpResult || !signUpResult.user) {
      throw new Error("Erro ao cadastrar usuário proprietário.");
    }

    // Definir explicitamente o papel OWNER diretamente no banco de dados para evitar regras de restrição do Better Auth API
    await db
      .update(schema.user)
      .set({
        role: "OWNER",
      })
      .where(eq(schema.user.id, signUpResult.user.id));

    return {
      success: true,
      data: {
        tenant: result.tenant,
        branch: result.branch,
        user: signUpResult.user,
      },
    };
  } catch (error: any) {
    console.error("Erro no cadastro do Tenant:", error);
    return {
      success: false,
      error: error.message || "Ocorreu um erro interno durante o cadastro.",
    };
  }
}
