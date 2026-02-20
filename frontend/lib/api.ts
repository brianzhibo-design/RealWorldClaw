/**
 * API 客户端 — 对接后端，失败时 fallback 到 mock 数据
 */

import type {
  ComponentResponse,
  ComponentListResponse,
  MakerPublic,
  OrderResponse,
} from "./types";
import type { ClawComponent, Maker } from "./mock-data";

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

/** 将后端 MakerPublic 转为前端 Maker */
export function apiMakerToMock(m: MakerPublic): Maker {
  return {
    id: m.id,
    maker_type: m.maker_type,
    region: `${m.location_province} ${m.location_city}`,
    printer_brand: m.printer_brand,
    printer_model: m.printer_model,
    materials: m.materials,
    capabilities: m.capabilities,
    rating: m.rating,
    total_orders: m.total_orders,
    pricing_per_hour_cny: m.pricing_per_hour_cny,
    availability: m.availability,
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

export async function fetchMakers(): Promise<Maker[]> {
  const data = await apiFetch<MakerPublic[]>("/makers");
  return data.map(apiMakerToMock);
}

export async function fetchOrders(
  apiKey: string,
): Promise<{ as_customer: OrderResponse[]; as_maker: OrderResponse[] }> {
  return apiFetch("/orders", {
    headers: { "X-API-Key": apiKey },
  });
}

export interface OrderCreateData {
  component_id: string;
  order_type?: "print_only" | "full_build";
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
  makers: number;
  agents: number;
}> {
  // 后端暂无 /stats 端点，手动聚合
  const [comps, makers] = await Promise.all([
    apiFetch<ComponentListResponse>("/components?skip=0&limit=1"),
    apiFetch<MakerPublic[]>("/makers"),
  ]);
  return {
    components: comps.total,
    makers: makers.length,
    agents: 0, // 公开 API 无法获取 agent 总数
  };
}
