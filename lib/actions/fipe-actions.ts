"use server"

const BASE_URL = "https://fipe.parallelum.com.br/api/v2";

function getHeaders() {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (process.env.FIPE_API_KEY) {
    headers["X-Subscription-Token"] = process.env.FIPE_API_KEY;
  }
  return headers;
}

export async function getFipeBrandsAction() {
  try {
    const res = await fetch(`${BASE_URL}/cars/brands`, {
      method: "GET",
      headers: getHeaders(),
      next: { revalidate: 86400 }, // Cache de 24 horas
    });

    if (!res.ok) {
      throw new Error(`Erro na API FIPE: ${res.statusText}`);
    }

    const data = await res.json();
    return { success: true, data };
  } catch (error: any) {
    console.error("Erro ao buscar marcas FIPE:", error);
    return { success: false, error: error.message };
  }
}

export async function getFipeModelsAction(brandCode: string) {
  try {
    if (!brandCode) throw new Error("Código de marca inválido.");

    const res = await fetch(`${BASE_URL}/cars/brands/${brandCode}/models`, {
      method: "GET",
      headers: getHeaders(),
      next: { revalidate: 86400 }, // Cache de 24 horas
    });

    if (!res.ok) {
      throw new Error(`Erro na API FIPE: ${res.statusText}`);
    }

    const data = await res.json();
    // A API v2 retorna { models: [...], years: [...] }
    const models = data?.models || [];
    return { success: true, data: models };
  } catch (error: any) {
    console.error(`Erro ao buscar modelos FIPE da marca ${brandCode}:`, error);
    return { success: false, error: error.message };
  }
}

export async function getFipeYearsAction(brandCode: string, modelCode: string) {
  try {
    if (!brandCode || !modelCode) throw new Error("Código de marca ou modelo inválido.");

    const res = await fetch(`${BASE_URL}/cars/brands/${brandCode}/models/${modelCode}/years`, {
      method: "GET",
      headers: getHeaders(),
      next: { revalidate: 86400 }, // Cache de 24 horas
    });

    if (!res.ok) {
      throw new Error(`Erro na API FIPE: ${res.statusText}`);
    }

    const data = await res.json();
    return { success: true, data };
  } catch (error: any) {
    console.error(`Erro ao buscar anos FIPE do modelo ${modelCode}:`, error);
    return { success: false, error: error.message };
  }
}
