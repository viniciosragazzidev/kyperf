"use server"

import React from "react";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "./auth-helper";
import { getWorkOrderForPdfAction } from "./pdf-actions";
import { renderToBuffer } from "@react-pdf/renderer";
import fs from "fs";
import path from "path";

// Importações dos documentos PDF
import { BudgetPDF } from "@/components/pdf/documents/budget-pdf";
import { CheckInPDF } from "@/components/pdf/documents/checkin-pdf";
import { WorkOrderPDF } from "@/components/pdf/documents/workorder-pdf";
import { ConclusionPDF } from "@/components/pdf/documents/conclusion-pdf";
import { DeliveryPDF } from "@/components/pdf/documents/delivery-pdf";

function getCleanApiUrl(apiUrl: string) {
  let url = apiUrl.trim();
  if (url.endsWith("/")) {
    url = url.slice(0, -1);
  }
  if (!url.endsWith("/api")) {
    url = `${url}/api`;
  }
  return url;
}

function getOpenwaApiKey() {
  try {
    const keyPath = path.join(process.cwd(), "openwa-data", ".api-key");
    if (fs.existsSync(keyPath)) {
      return fs.readFileSync(keyPath, "utf-8").trim();
    }
  } catch (err: any) {
    console.warn("Não foi possível ler o arquivo .api-key localmente:", err.message);
  }
  return null;
}

function cleanSessionName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getEffectiveApiUrl(configApiUrl: string): string {
  const envUrl = process.env.OPENWA_API_URL || process.env.NEXT_PUBLIC_OPENWA_API_URL;
  if (envUrl && envUrl.trim() !== "") {
    return envUrl;
  }
  return configApiUrl;
}

function getEffectiveApiToken(configApiToken: string | null): string {
  const envToken = process.env.OPENWA_API_TOKEN;
  if (envToken && envToken.trim() !== "") {
    return envToken;
  }
  return configApiToken || "";
}

/**
 * Resolve o UUID da sessão pelo seu nome.
 * Lista as sessões do OpenWA. Se encontrar uma correspondente ao nome, retorna o ID dela.
 * Caso contrário, cria a sessão no OpenWA e retorna o novo ID gerado.
 */
async function resolveSessionId(cleanUrl: string, headers: Record<string, string>, sessionName: string): Promise<string> {
  // 1. Tenta listar as sessões existentes
  try {
    const res = await fetch(`${cleanUrl}/sessions`, {
      method: "GET",
      headers,
      cache: "no-store",
    });
    if (res.ok) {
      const json = await res.json();
      const list = Array.isArray(json) ? json : (json?.data || []);
      const existing = list.find((s: any) => s.name === sessionName);
      if (existing && existing.id) {
        return existing.id;
      }
    }
  } catch (err) {
    console.warn("Erro ao listar sessões no OpenWA:", err);
  }

  // 2. Se não encontrou, cria a sessão no OpenWA
  const createRes = await fetch(`${cleanUrl}/sessions`, {
    method: "POST",
    headers,
    body: JSON.stringify({ name: sessionName }),
    cache: "no-store",
  });

  const createJson = await createRes.json();
  if (!createRes.ok) {
    // Se der conflito de que já existe, tenta listar novamente para obter o ID
    if (createRes.status === 409) {
      try {
        const listRes = await fetch(`${cleanUrl}/sessions`, {
          method: "GET",
          headers,
          cache: "no-store",
        });
        if (listRes.ok) {
          const listJson = await listRes.json();
          const list = Array.isArray(listJson) ? listJson : (listJson?.data || []);
          const existing = list.find((s: any) => s.name === sessionName);
          if (existing && existing.id) {
            return existing.id;
          }
        }
      } catch (listErr) {
        console.warn("Erro ao tentar recuperar sessão existente após conflito (409):", listErr);
      }
    }
    throw new Error(`Erro ao criar sessão no OpenWA: ${JSON.stringify(createJson)}`);
  }

  const id = createJson?.data?.id || createJson?.id;
  if (!id) {
    throw new Error("Resposta de criação de sessão do OpenWA não retornou um ID válido.");
  }

  return id;
}

export async function saveWhatsappConfigAction(apiUrl: string, apiToken: string, sessionName: string) {
  try {
    const user = await requireAuth();
    if (!user.tenantId) throw new Error("Usuário sem empresa vinculada.");

    const existing = await db.query.whatsappConfig.findFirst({
      where: (wc, { eq }) => eq(wc.tenantId, user.tenantId!),
    });

    if (existing) {
      await db
        .update(schema.whatsappConfig)
        .set({
          apiUrl,
          apiToken,
          sessionName,
          updatedAt: new Date(),
        })
        .where(eq(schema.whatsappConfig.id, existing.id));
    } else {
      await db.insert(schema.whatsappConfig).values({
        tenantId: user.tenantId!,
        apiUrl,
        apiToken,
        sessionName,
      });
    }

    return { success: true, message: "Configurações salvas com sucesso!" };
  } catch (error: any) {
    console.error("Erro ao salvar configuração do WhatsApp:", error);
    return { success: false, error: error.message };
  }
}

export async function getWhatsappConfigAction() {
  try {
    const user = await requireAuth();
    if (!user.tenantId) throw new Error("Usuário sem empresa vinculada.");

    let config = await db.query.whatsappConfig.findFirst({
      where: (wc, { eq }) => eq(wc.tenantId, user.tenantId!),
    });

    const tenant = await db.query.tenants.findFirst({
      where: (t, { eq }) => eq(t.id, user.tenantId!),
    });
    const slug = tenant?.slug || "default";

    const defaultApiUrl = process.env.NEXT_PUBLIC_OPENWA_API_URL || process.env.OPENWA_API_URL || "http://localhost:2785";
    const defaultApiToken = process.env.OPENWA_API_TOKEN || "owa_k1_299e8be6ae7a9ecfee1942dd249a2186dcd5bbea405c1e4a8cda1168ac13e683";
    const defaultSessionName = cleanSessionName(`${slug}-session`);

    if (!config) {
      const inserted = await db.insert(schema.whatsappConfig).values({
        tenantId: user.tenantId!,
        apiUrl: defaultApiUrl,
        apiToken: defaultApiToken,
        sessionName: defaultSessionName,
        status: "DISCONNECTED",
      }).returning();

      config = inserted[0];
    } else if (
      config.apiUrl !== defaultApiUrl ||
      config.apiToken !== defaultApiToken ||
      !config.sessionName || 
      cleanSessionName(config.sessionName) !== config.sessionName
    ) {
      const updated = await db.update(schema.whatsappConfig).set({
        apiUrl: defaultApiUrl,
        apiToken: defaultApiToken,
        sessionName: defaultSessionName,
        updatedAt: new Date(),
      }).where(eq(schema.whatsappConfig.id, config.id)).returning();

      config = updated[0];
    }

    return { success: true, data: config };
  } catch (error: any) {
    console.error("Erro ao buscar/inicializar configuração do WhatsApp:", error);
    return { success: false, error: error.message };
  }
}

export async function checkWhatsappStatusAction() {
  try {
    const user = await requireAuth();
    if (!user.tenantId) throw new Error("Usuário sem empresa vinculada.");

    const config = await db.query.whatsappConfig.findFirst({
      where: (wc, { eq }) => eq(wc.tenantId, user.tenantId!),
    });

    if (!config) {
      return { success: true, status: "DISCONNECTED" };
    }

    const cleanUrl = getCleanApiUrl(getEffectiveApiUrl(config.apiUrl));
    const session = cleanSessionName(config.sessionName || "default");

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    const token = getOpenwaApiKey() || getEffectiveApiToken(config.apiToken);
    if (token) {
      headers["X-API-Key"] = token;
    }

    try {
      const sessionId = await resolveSessionId(cleanUrl, headers, session);

      const res = await fetch(`${cleanUrl}/sessions/${sessionId}`, {
        method: "GET",
        headers,
        cache: "no-store",
      });

      if (!res.ok) {
        await db
          .update(schema.whatsappConfig)
          .set({ status: "DISCONNECTED", updatedAt: new Date() })
          .where(eq(schema.whatsappConfig.id, config.id));
        return { success: true, status: "DISCONNECTED" };
      }

      const json = await res.json();
      const statusObj = json?.data || json;
      const rawStatus = (statusObj?.status || "DISCONNECTED").toUpperCase();

      let mappedStatus = "DISCONNECTED";
      if (rawStatus === "CONNECTED" || rawStatus === "WORKING" || rawStatus === "READY") {
        mappedStatus = "CONNECTED";
      } else if (
        rawStatus === "INITIALIZING" ||
        rawStatus === "CONNECTING" ||
        rawStatus === "SCAN_QR" ||
        rawStatus === "QR_READY" ||
        rawStatus === "STARTING"
      ) {
        mappedStatus = "CONNECTING";
      }

      await db
        .update(schema.whatsappConfig)
        .set({ status: mappedStatus, updatedAt: new Date() })
        .where(eq(schema.whatsappConfig.id, config.id));

      return { success: true, status: mappedStatus, rawStatus };
    } catch (err) {
      console.warn("Erro ao checar status do OpenWA:", err);
      // Mantém status DISCONNECTED se falhar na conexão de rede/res
      return { success: true, status: "DISCONNECTED" };
    }
  } catch (error: any) {
    console.error("Erro ao verificar status do WhatsApp:", error);
    return { success: false, error: error.message };
  }
}

export async function startWhatsappSessionAction() {
  try {
    const user = await requireAuth();
    if (!user.tenantId) throw new Error("Usuário sem empresa vinculada.");

    const config = await db.query.whatsappConfig.findFirst({
      where: (wc, { eq }) => eq(wc.tenantId, user.tenantId!),
    });

    if (!config) {
      throw new Error("WhatsApp não configurado. Salve as configurações primeiro.");
    }

    const cleanUrl = getCleanApiUrl(getEffectiveApiUrl(config.apiUrl));
    const session = cleanSessionName(config.sessionName || "default");

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    const token = getOpenwaApiKey() || getEffectiveApiToken(config.apiToken);
    if (token) {
      headers["X-API-Key"] = token;
    }

    await db
      .update(schema.whatsappConfig)
      .set({ status: "CONNECTING", updatedAt: new Date() })
      .where(eq(schema.whatsappConfig.id, config.id));

    // Resolve o UUID da sessão (cria se necessário no OpenWA)
    const sessionId = await resolveSessionId(cleanUrl, headers, session);

    const res = await fetch(`${cleanUrl}/sessions/${sessionId}/start`, {
      method: "POST",
      headers,
      body: JSON.stringify({}),
      cache: "no-store",
    });

    if (!res.ok) {
      const text = await res.text();
      let isAlreadyStarted = false;
      try {
        const errJson = JSON.parse(text);
        if (errJson.message === "Session is already started" || errJson.message?.includes("already started")) {
          isAlreadyStarted = true;
        }
      } catch (e) {}

      if (!isAlreadyStarted) {
        throw new Error(`Erro ao iniciar sessão no OpenWA: ${text}`);
      }
    }

    return { success: true, message: "Sessão iniciada com sucesso. Aguardando leitura do QR Code." };
  } catch (error: any) {
    console.error("Erro ao iniciar sessão do WhatsApp:", error);
    return { success: false, error: error.message };
  }
}

export async function getWhatsappQrCodeAction() {
  try {
    const user = await requireAuth();
    if (!user.tenantId) throw new Error("Usuário sem empresa vinculada.");

    const config = await db.query.whatsappConfig.findFirst({
      where: (wc, { eq }) => eq(wc.tenantId, user.tenantId!),
    });

    if (!config) throw new Error("Configuração do WhatsApp não encontrada.");

    const cleanUrl = getCleanApiUrl(getEffectiveApiUrl(config.apiUrl));
    const session = cleanSessionName(config.sessionName || "default");

    const headers: Record<string, string> = {};
    const token = getOpenwaApiKey() || getEffectiveApiToken(config.apiToken);
    if (token) {
      headers["X-API-Key"] = token;
    }

    const sessionId = await resolveSessionId(cleanUrl, headers, session);

    const res = await fetch(`${cleanUrl}/sessions/${sessionId}/qr`, {
      method: "GET",
      headers,
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error("Não foi possível obter o QR Code. A sessão pode já estar conectada.");
    }

    const contentType = res.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      const json = await res.json();
      const qrData = json?.qrCode || json?.data?.qrCode || json?.data || json?.qr || json?.data?.qr;
      if (qrData) {
        return { success: true, qr: qrData };
      }
      throw new Error("Formato de resposta JSON inválido para o QR Code.");
    } else {
      const buffer = await res.arrayBuffer();
      const base64 = Buffer.from(buffer).toString("base64");
      const qrDataUrl = `data:${contentType || "image/png"};base64,${base64}`;
      return { success: true, qr: qrDataUrl };
    }
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function disconnectWhatsappSessionAction() {
  try {
    const user = await requireAuth();
    if (!user.tenantId) throw new Error("Usuário sem empresa vinculada.");

    const config = await db.query.whatsappConfig.findFirst({
      where: (wc, { eq }) => eq(wc.tenantId, user.tenantId!),
    });

    if (!config) throw new Error("Configuração do WhatsApp não encontrada.");

    const cleanUrl = getCleanApiUrl(getEffectiveApiUrl(config.apiUrl));
    const session = cleanSessionName(config.sessionName || "default");

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    const token = getOpenwaApiKey() || getEffectiveApiToken(config.apiToken);
    if (token) {
      headers["X-API-Key"] = token;
    }

    const sessionId = await resolveSessionId(cleanUrl, headers, session);

    try {
      await fetch(`${cleanUrl}/sessions/${sessionId}/logout`, {
        method: "POST",
        headers,
        cache: "no-store",
      });
    } catch (apiErr) {
      console.warn("Erro ao fazer logout na API externa:", apiErr);
    }

    await db
      .update(schema.whatsappConfig)
      .set({ status: "DISCONNECTED", updatedAt: new Date() })
      .where(eq(schema.whatsappConfig.id, config.id));

    return { success: true, message: "Sessão desconectada com sucesso!" };
  } catch (error: any) {
    console.error("Erro ao desconectar sessão do WhatsApp:", error);
    return { success: false, error: error.message };
  }
}

export async function sendDirectWhatsappAction(orderId: string) {
  try {
    const user = await requireAuth();
    if (!user.tenantId) throw new Error("Usuário sem empresa vinculada.");

    const config = await db.query.whatsappConfig.findFirst({
      where: (wc, { eq }) => eq(wc.tenantId, user.tenantId!),
    });

    if (!config || config.status !== "CONNECTED") {
      return { success: false, fallback: true, message: "WhatsApp não integrado." };
    }

    const result = await getWorkOrderForPdfAction(orderId);
    if (!result.success || !result.data) {
      throw new Error(result.error || "Erro ao buscar dados da OS.");
    }
    const orderData = result.data;

    let pdfElement: React.ReactElement<any>;
    let fileSuffix = "orcamento";
    const status = orderData.status;

    if (status === "CHECK_IN") {
      pdfElement = React.createElement(CheckInPDF, { order: orderData }) as any;
      fileSuffix = "checkin";
    } else if (status === "AWAITING_BUDGET" || status === "AWAITING_APPROVAL") {
      pdfElement = React.createElement(BudgetPDF, { order: orderData }) as any;
      fileSuffix = "orcamento";
    } else if (status === "IN_PROGRESS" || status === "AWAITING_PARTS") {
      pdfElement = React.createElement(WorkOrderPDF, { order: orderData }) as any;
      fileSuffix = "os";
    } else if (status === "TESTING_WASHING" || status === "READY") {
      pdfElement = React.createElement(ConclusionPDF, { order: orderData }) as any;
      fileSuffix = "conclusao";
    } else if (status === "DELIVERED") {
      pdfElement = React.createElement(DeliveryPDF, { order: orderData }) as any;
      fileSuffix = "entrega";
    } else {
      pdfElement = React.createElement(BudgetPDF, { order: orderData }) as any;
      fileSuffix = "orcamento";
    }

    const pdfBuffer = await renderToBuffer(pdfElement);
    const base64Data = pdfBuffer.toString("base64");

    const phone = orderData.customer?.phone || "";
    const cleanPhone = phone.replace(/\D/g, "");
    if (!cleanPhone) {
      throw new Error("Cliente não possui número de telefone válido cadastrado.");
    }
    const formattedPhone = cleanPhone.startsWith("55") ? cleanPhone : `55${cleanPhone}`;
    const chatId = `${formattedPhone}@c.us`;

    const getBaseUrl = () => {
      let url = "";
      if (process.env.NEXT_PUBLIC_APP_URL) url = process.env.NEXT_PUBLIC_APP_URL;
      else if (process.env.VERCEL_URL) url = `https://${process.env.VERCEL_URL}`;
      else url = "http://localhost:3000";
      return url.replace(/\/$/, "");
    };
    const appUrl = getBaseUrl();
    const urlPublic = `${appUrl}/public/budget/${orderId}`;
    const accessCode = orderData.budgetAccessCode || "";
    const customerName = orderData.customer?.name || "Cliente";
    const osNum = String(orderData.osNumber).padStart(4, "0");

    const message = `Olá, ${customerName}! Segue em anexo o documento em PDF da sua Ordem de Serviço *#${osNum}*.\n\nVocê também pode visualizar e aprovar os itens online pelo link:\n*Link:* ${urlPublic}\n*Código de Acesso:* *${accessCode}*\n\nSe tiver qualquer dúvida, estamos à disposição!`;

    const cleanUrl = getCleanApiUrl(getEffectiveApiUrl(config.apiUrl));
    const session = cleanSessionName(config.sessionName || "default");

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    const token = getOpenwaApiKey() || getEffectiveApiToken(config.apiToken);
    if (token) {
      headers["X-API-Key"] = token;
    }

    const sessionId = await resolveSessionId(cleanUrl, headers, session);

    const payload = {
      chatId,
      base64: base64Data,
      mimetype: "application/pdf",
      filename: `OS-${osNum}-${fileSuffix}.pdf`,
      caption: message,
    };

    const res = await fetch(`${cleanUrl}/sessions/${sessionId}/messages/send-document`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Erro ao enviar arquivo via OpenWA: ${errText}`);
    }

    return { success: true, message: "Orçamento/O.S. enviada com sucesso em segundo plano!" };
  } catch (error: any) {
    console.error("Erro ao enviar WhatsApp direto:", error);
    return { success: false, error: error.message };
  }
}
