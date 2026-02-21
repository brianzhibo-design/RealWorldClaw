/**
 * API Client v2 — JWT-based fetch wrapper + SWR config + WebSocket hook
 */

import { useAuthStore } from "@/stores/authStore";
import { useEffect, useRef, useCallback, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const WS_BASE = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000/ws";

// ─── Authenticated fetch wrapper ──────────────────────

export async function apiFetch<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const token = useAuthStore.getState().token;
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

export async function loginAPI(email: string, password: string) {
  return apiFetch<{ access_token: string; user: { id: string; username: string; email: string; role: string } }>(
    "/api/v1/auth/login",
    {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }
  );
}

export async function registerAPI(username: string, email: string, password: string) {
  return apiFetch<{ access_token: string; user: { id: string; username: string; email: string; role: string } }>(
    "/api/v1/auth/register",
    {
      method: "POST",
      body: JSON.stringify({ username, email, password }),
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

    const ws = new WebSocket(`${WS_BASE}?token=${token}`);
    wsRef.current = ws;

    ws.onopen = () => {
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
