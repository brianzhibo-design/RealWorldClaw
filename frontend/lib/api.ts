/**
 * API 客户端 — 对接后端，失败时 fallback 到 mock 数据
 */

import type {
  ComponentResponse,
  ComponentListResponse,
  FarmPublic,
  OrderResponse,
} from "./types";
import type { ClawComponent, PrintFarm } from "./mock-data";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// ─── 通用 fetch ─────────────────────────────────────────

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    // Next.js: 不缓存 API 请求
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`API ${res.status}: ${res.statusText}`);
  }
  return res.json();
}

// ─── 后端 → 前端类型适配 ────────────────────────────────

/** 将后端 ComponentResponse (flat string) 转为前端 ClawComponent (LocalizedText) */
export function apiComponentToMock(c: ComponentResponse): ClawComponent {
  return {
    id: c.id,
    display_name: { en: c.display_name, zh: c.display_name },
    description: { en: c.description, zh: c.description },
    author: c.author_id,
    tags: c.tags,
    compute: c.compute || "N/A",
    material: c.material || "PLA",
    estimated_cost_cny: c.estimated_cost_cny || 0,
    estimated_print_time: c.estimated_print_time || "N/A",
    estimated_filament_g: c.estimated_filament_g || 0,
    version: c.version,
    created_at: c.created_at,
  };
}

/** 将后端 FarmPublic 转为前端 PrintFarm */
export function apiFarmToMock(f: FarmPublic): PrintFarm {
  return {
    id: f.id,
    region: `${f.location_province} ${f.location_city}`,
    printer_brand: f.printer_brand,
    printer_model: f.printer_model,
    materials: f.materials,
    rating: f.rating,
    total_orders: f.total_orders,
    pricing_per_hour_cny: f.pricing_per_hour_cny,
    availability: f.availability,
  };
}

// ─── API 函数 ───────────────────────────────────────────

export async function fetchComponents(
  skip = 0,
  limit = 100,
): Promise<ClawComponent[]> {
  const data = await apiFetch<ComponentListResponse>(
    `/components?skip=${skip}&limit=${limit}`,
  );
  return data.components.map(apiComponentToMock);
}

export async function fetchComponent(id: string): Promise<ClawComponent> {
  const data = await apiFetch<ComponentResponse>(`/components/${id}`);
  return apiComponentToMock(data);
}

export async function fetchFarms(): Promise<PrintFarm[]> {
  const data = await apiFetch<FarmPublic[]>("/farms");
  return data.map(apiFarmToMock);
}

export async function fetchOrders(
  apiKey: string,
): Promise<{ as_customer: OrderResponse[]; as_farmer: OrderResponse[] }> {
  return apiFetch("/orders", {
    headers: { "X-API-Key": apiKey },
  });
}

export interface OrderCreateData {
  component_id: string;
  quantity: number;
  material_preference?: string;
  delivery_province: string;
  delivery_city: string;
  delivery_district: string;
  delivery_address: string;
  urgency?: "normal" | "express";
  notes?: string;
}

export async function createOrder(apiKey: string, data: OrderCreateData) {
  return apiFetch("/orders", {
    method: "POST",
    headers: { "X-API-Key": apiKey },
    body: JSON.stringify(data),
  });
}

export async function fetchStats(): Promise<{
  components: number;
  farms: number;
  agents: number;
}> {
  // 后端暂无 /stats 端点，手动聚合
  const [comps, farms] = await Promise.all([
    apiFetch<ComponentListResponse>("/components?skip=0&limit=1"),
    apiFetch<FarmPublic[]>("/farms"),
  ]);
  return {
    components: comps.total,
    farms: farms.length,
    agents: 0, // 公开 API 无法获取 agent 总数
  };
}
