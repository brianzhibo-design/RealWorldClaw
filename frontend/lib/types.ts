/**
 * TypeScript 类型定义 — 与后端 API 响应对齐
 * 注意：后端 display_name/description 是纯字符串，前端 mock 数据用 LocalizedText
 */

// ─── Component ──────────────────────────────────────────

export interface ComponentResponse {
  id: string;
  display_name: string;
  description: string;
  version: string;
  author_id: string;
  tags: string[];
  capabilities: string[];
  compute: string | null;
  material: string | null;
  estimated_cost_cny: number | null;
  estimated_print_time: string | null;
  estimated_filament_g: number | null;
  manifest_json: string | null;
  status: "unverified" | "verified" | "certified" | "flagged";
  downloads: number;
  rating: number;
  review_count: number;
  created_at: string;
  updated_at: string;
}

export interface ComponentListResponse {
  total: number;
  skip: number;
  limit: number;
  components: ComponentResponse[];
}

// ─── Maker ──────────────────────────────────────────────

export interface MakerPublic {
  id: string;
  maker_type: "maker" | "builder";
  printer_brand: string;
  printer_model: string;
  build_volume_x: number;
  build_volume_y: number;
  build_volume_z: number;
  materials: string[];
  capabilities: string[];
  location_province: string;
  location_city: string;
  availability: "open" | "busy" | "offline";
  pricing_per_hour_cny: number;
  description: string | null;
  rating: number;
  total_orders: number;
  success_rate: number;
  verified: boolean;
  created_at: string;
}

// ─── Order ──────────────────────────────────────────────

export interface OrderResponse {
  id: string;
  order_number: string;
  order_type: "print_only" | "full_build";
  component_id: string;
  quantity: number;
  material: string | null;
  urgency: "normal" | "express";
  status: string;
  notes: string | null;
  price_total_cny: number;
  platform_fee_cny: number;
  maker_display: string;
  shipping_tracking: string | null;
  shipping_carrier: string | null;
  estimated_completion: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Agent ──────────────────────────────────────────────

export interface AgentResponse {
  id: string;
  name: string;
  display_name: string | null;
  description: string;
  type: "openclaw" | "printer" | "factory";
  status: "pending_claim" | "active" | "suspended" | "deactivated";
  reputation: number;
  tier: "newcomer" | "contributor" | "trusted" | "core" | "legend";
  callback_url: string | null;
  created_at: string;
  updated_at: string;
}
