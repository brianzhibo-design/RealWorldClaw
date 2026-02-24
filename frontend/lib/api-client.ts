/**
 * API Client v2 — JWT-based fetch wrapper + SWR config + WebSocket hook
 */

import { useAuthStore } from "@/stores/authStore";
import { useEffect, useRef, useCallback, useState } from "react";

export const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
const WS_BASE = process.env.NEXT_PUBLIC_WS_URL || "wss://realworldclaw-api.fly.dev/api/v1/ws";

// ─── Authenticated fetch wrapper ──────────────────────

export async function apiFetch<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const token = useAuthStore.getState().token || (typeof window !== "undefined" ? localStorage.getItem("auth_token") : null);
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options?.headers as Record<string, string>),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    cache: "no-store",
  });

  if (res.status === 401) {
    useAuthStore.getState().logout();
    if (typeof window !== "undefined") {
      window.location.href = "/auth/login";
    }
    throw new Error("Unauthorized");
  }

  if (!res.ok) {
    throw new Error(`API ${res.status}: ${res.statusText}`);
  }

  return res.json();
}

// ─── SWR fetcher ──────────────────────────────────────

export const swrFetcher = <T>(path: string) => apiFetch<T>(path);

// ─── Auth API ─────────────────────────────────────────

export async function loginAPI(email: string, password: string, username?: string) {
  const body = username
    ? { username, password }
    : { email, password };
  return apiFetch<{ access_token: string; user: { id: string; username: string; email: string; role: string } }>(
    "/auth/login",
    {
      method: "POST",
      body: JSON.stringify(body),
    }
  );
}

export async function registerAPI(username: string, email: string, password: string) {
  return apiFetch<{ access_token: string; user: { id: string; username: string; email: string; role: string } }>(
    "/auth/register",
    {
      method: "POST",
      body: JSON.stringify({ username, email, password }),
    }
  );
}

export async function getMeAPI() {
  return apiFetch<{ id: string; username: string; email: string; role: string; avatar_url?: string }>(
    "/auth/me"
  );
}

export async function googleAuthAPI(credential: string) {
  return apiFetch<{ access_token: string; user: { id: string; username: string; email: string; role: string } }>(
    "/auth/google",
    {
      method: "POST",
      body: JSON.stringify({ credential }),
    }
  );
}

export async function githubAuthAPI(code: string) {
  return apiFetch<{ access_token: string; user: { id: string; username: string; email: string; role: string } }>(
    "/auth/github",
    {
      method: "POST",
      body: JSON.stringify({ code }),
    }
  );
}

// ─── WebSocket hook ───────────────────────────────────

type WSMessage = { channel: string; event: string; data: unknown };

export function useWebSocket(
  channels: string[],
  onMessage?: (msg: WSMessage) => void
) {
  const wsRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const reconnectRef = useRef(0);

  const connect = useCallback(() => {
    const token = useAuthStore.getState().token;
    if (!token) return;

    const ws = new WebSocket(WS_BASE);
    wsRef.current = ws;

    ws.onopen = () => {
      // Authenticate via message instead of URL query (security)
      ws.send(JSON.stringify({ action: "auth", token }));
      setConnected(true);
      reconnectRef.current = 0;
      // Subscribe to channels
      channels.forEach((ch) => {
        ws.send(JSON.stringify({ action: "subscribe", channel: ch }));
      });
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data) as WSMessage;
        onMessage?.(msg);
      } catch {}
    };

    ws.onclose = () => {
      setConnected(false);
      // Exponential backoff reconnect
      const delay = Math.min(1000 * Math.pow(2, reconnectRef.current), 30000);
      reconnectRef.current++;
      setTimeout(connect, delay);
    };

    ws.onerror = () => ws.close();
  }, [channels, onMessage]);

  useEffect(() => {
    connect();
    return () => {
      wsRef.current?.close();
    };
  }, [connect]);

  return { connected, ws: wsRef };
}

// ─── Interfaces (migrated from api.ts) ────────────────

export interface Order {
  id: string;
  order_number: string;
  order_type: 'print_only' | 'full_build';
  component_id?: string;
  quantity: number;
  material?: string;
  urgency: 'normal' | 'express';
  status: 'pending' | 'accepted' | 'printing' | 'assembling' | 'quality_check' | 'shipping' | 'delivered' | 'completed' | 'cancelled';
  notes?: string;
  price_total_cny: number;
  platform_fee_cny?: number;
  maker_display?: string;
  maker_income_cny?: number;
  delivery_province?: string;
  delivery_city?: string;
  estimated_completion?: string;
  created_at: string;
  updated_at: string;
  // Legacy compat — may not exist
  title?: string;
  file_name?: string;
  file_id?: string;
}

export interface Node {
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
  status: 'online' | 'offline' | 'busy';
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface CommunityPost {
  id: string;
  title: string;
  content: string;
  post_type: 'discussion' | 'request' | 'task' | 'showcase';
  author_id: string;
  author_type: string;
  author_name?: string;
  author?: string; // legacy compat
  file_id?: string;
  images?: string[];
  comment_count: number;
  likes_count: number;
  upvotes: number;
  downvotes: number;
  created_at: string;
  updated_at: string;
  // Optional UI fields (may not come from API)
  tags?: string[];
  budget?: number;
  deadline?: string;
  materials?: string[];
}

export interface CommunityComment {
  id: string;
  post_id: string;
  content: string;
  author: string;
  author_id: string;
  author_type?: string;
  author_name?: string;
  parent_id?: string;
  replies?: CommunityComment[];
  created_at: string;
  updated_at: string;
  upvotes: number;
}

// ─── Helper: get token (dual-read) ───────────────────

function getToken(): string | null {
  const storeToken = useAuthStore.getState().token;
  if (storeToken) return storeToken;
  if (typeof window !== "undefined") return localStorage.getItem("auth_token");
  return null;
}

function authHeaders(extra?: Record<string, string>): Record<string, string> {
  const token = getToken();
  const headers: Record<string, string> = { ...extra };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

// ─── Order API functions (migrated from api.ts) ──────

export async function fetchOrders(type: 'public' | 'my' = 'public'): Promise<Order[]> {
  try {
    const res = await fetch(`${API_BASE}/orders?type=${type}`, { headers: authHeaders() });
    if (!res.ok) return [];
    const data = await res.json();
    return data.orders || data;
  } catch {
    return [];
  }
}

export async function fetchAvailableOrders(): Promise<Order[]> {
  try {
    const res = await fetch(`${API_BASE}/orders/available`, { headers: authHeaders() });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : data.orders || [];
  } catch {
    return [];
  }
}

export async function fetchAcceptedOrders(): Promise<Order[]> {
  try {
    const res = await fetch(`${API_BASE}/orders?status=accepted`, { headers: authHeaders() });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : data.orders || [];
  } catch {
    return [];
  }
}

export async function acceptOrder(orderId: string, estimatedHours: number = 24): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/orders/${orderId}/accept`, {
      method: 'PUT',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ estimated_hours: estimatedHours }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { success: false, error: err.detail || 'Failed to accept order' };
    }
    return { success: true };
  } catch {
    return { success: false, error: 'API unavailable' };
  }
}

export async function fetchOrder(id: string): Promise<Order | null> {
  try {
    const res = await fetch(`${API_BASE}/orders/${id}`, { headers: authHeaders() });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function createOrder(data: {
  title: string;
  material: string;
  color: string;
  quantity: number;
  fill_rate: number;
  notes?: string;
  file_name: string;
  file_size: number;
}): Promise<{ success: boolean; order_id?: string; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { success: false, error: err.detail || 'Order creation failed' };
    }
    const result = await res.json();
    return { success: true, order_id: result.id };
  } catch {
    return { success: false, error: 'API unavailable' };
  }
}

export async function updateOrderStatus(
  orderId: string,
  status: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/orders/${orderId}/status`, {
      method: 'PUT',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ status }),
    });
    if (!res.ok) return { success: false, error: 'Status update failed' };
    return { success: true };
  } catch {
    return { success: false, error: 'API unavailable' };
  }
}

// ─── Node API functions (migrated from api.ts) ───────

export async function fetchNodes(): Promise<Node[]> {
  try {
    const res = await fetch(`${API_BASE}/nodes`, { headers: authHeaders() });
    if (!res.ok) return [];
    const data = await res.json();
    return data.nodes || data;
  } catch {
    return [];
  }
}

export async function registerNode(data: {
  device_type: string;
  device_brand: string;
  device_model: string;
  build_volume: { x: number; y: number; z: number };
  supported_materials: string[];
  location: { city: string; country: string };
  description?: string;
  contact_info?: string;
}): Promise<{ success: boolean; node_id?: string; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/nodes/register`, {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { success: false, error: err.detail || 'Node registration failed' };
    }
    const result = await res.json();
    return { success: true, node_id: result.id || result.node_id };
  } catch {
    return { success: false, error: 'API unavailable' };
  }
}

// ─── Stats API (migrated from api.ts) ────────────────

export async function fetchStats(): Promise<{
  myNodes?: number;
  myOrders?: number;
  activeOrders?: number;
} | null> {
  try {
    const res = await fetch(`${API_BASE}/stats`, { headers: authHeaders() });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// ─── Community API functions (migrated from api.ts) ──

export async function fetchCommunityPosts(
  type?: string,
  page = 1,
  limit = 20,
  sort = 'newest'
): Promise<CommunityPost[]> {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      sort: sort,
      ...(type && type !== '' && { type }),
    });
    const res = await fetch(`${API_BASE}/community/posts?${params}`, { headers: authHeaders() });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : data.posts || [];
  } catch {
    return [];
  }
}

export async function fetchCommunityPost(id: string): Promise<CommunityPost | null> {
  try {
    const res = await fetch(`${API_BASE}/community/posts/${id}`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function fetchPostComments(postId: string): Promise<CommunityComment[]> {
  try {
    const res = await fetch(`${API_BASE}/community/posts/${postId}/comments`);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : data.comments || [];
  } catch {
    return [];
  }
}

export async function createCommunityPost(data: {
  title: string;
  content: string;
  post_type: 'discussion' | 'request' | 'task' | 'showcase';
  tags?: string[];
  materials?: string[];
  budget?: number;
  deadline?: string;
}): Promise<{ success: boolean; post_id?: string; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/community/posts`, {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { success: false, error: err.detail || 'Post creation failed' };
    }
    const result = await res.json();
    return { success: true, post_id: result.id };
  } catch {
    return { success: false, error: 'API unavailable' };
  }
}

export async function createComment(
  postId: string,
  content: string,
  parentId?: string
): Promise<{ success: boolean; comment_id?: string; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/community/posts/${postId}/comments`, {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ content, parent_id: parentId }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { success: false, error: err.detail || 'Comment creation failed' };
    }
    const result = await res.json();
    return { success: true, comment_id: result.id };
  } catch {
    return { success: false, error: 'API unavailable' };
  }
}

// ─── Vote API functions (migrated from api.ts) ───────

export async function votePost(
  postId: string,
  voteType: 'up' | 'down'
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/community/posts/${postId}/vote`, {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ vote_type: voteType }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { success: false, error: err.detail || 'Vote failed' };
    }
    return { success: true };
  } catch {
    return { success: false, error: 'API unavailable' };
  }
}

export async function voteComment(
  commentId: string,
  voteType: 'up' | 'down'
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/community/comments/${commentId}/vote`, {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ vote_type: voteType }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { success: false, error: err.detail || 'Vote failed' };
    }
    return { success: true };
  } catch {
    return { success: false, error: 'API unavailable' };
  }
}
