/**
 * TypeScript 类型定义 — 与后端 API 响应对齐
 */

// ─── Order ──────────────────────────────────────────────

export interface OrderResponse {
  id: string;
  title: string;
  description?: string;
  material: string;
  color: string;
  quantity: number;
  fill_rate: number;
  status: string;
  notes?: string;
  file_name: string;
  file_size: string;
  created_at: string;
  updated_at: string;
  maker?: {
    id: string;
    name: string;
    rating: number;
    completed_orders: number;
    avatar: string;
  };
}

// ─── Node ──────────────────────────────────────────────

export interface NodeResponse {
  id: string;
  device_type: string;
  device_brand: string;
  device_model: string;
  build_volume: {
    x: number;
    y: number;
    z: number;
  };
  supported_materials: string[];
  location: {
    city: string;
    country: string;
  };
  status: "online" | "offline" | "busy";
  description?: string;
  contact_info?: string;
  created_at: string;
  updated_at: string;
}

// ─── User ──────────────────────────────────────────────

export interface UserResponse {
  id: string;
  username: string;
  email: string;
  created_at: string;
  updated_at: string;
}

// ─── Stats ─────────────────────────────────────────────

export interface StatsResponse {
  my_nodes: number;
  my_orders: number;
  active_orders: number;
  pending_orders: number;
}