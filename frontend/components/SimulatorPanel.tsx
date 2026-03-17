"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Activity, Gauge, Power, Thermometer } from "lucide-react";

type ConnectionState = "connecting" | "connected" | "reconnecting" | "offline";

interface SimulatorData {
  temperature: number;
  humidity: number;
  relayOn: boolean;
}

const FALLBACK_WS_URL = "ws://localhost:8000/api/v1/ws/simulator";
const MAX_RETRY_DELAY_MS = 10000;

const clamp = (value: number, min = 0, max = 100) => Math.min(max, Math.max(min, value));

const toNumber = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
};

const toBoolean = (value: unknown): boolean | null => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["on", "true", "1", "open", "enabled"].includes(normalized)) return true;
    if (["off", "false", "0", "close", "disabled"].includes(normalized)) return false;
  }
  return null;
};

const normalizePayload = (raw: unknown): SimulatorData | null => {
  if (!raw || typeof raw !== "object") return null;
  const payload = raw as Record<string, unknown>;

  const temperature =
    toNumber(payload.temperature) ??
    toNumber(payload.temp) ??
    toNumber(payload.temperature_c) ??
    toNumber(payload.temp_c);

  const humidity = toNumber(payload.humidity) ?? toNumber(payload.hum);

  const relayOn =
    toBoolean(payload.relayOn) ??
    toBoolean(payload.relay_on) ??
    toBoolean(payload.relay) ??
    toBoolean(payload.relay_state) ??
    toBoolean(payload.relayStatus);

  if (temperature === null || humidity === null || relayOn === null) return null;

  return {
    temperature,
    humidity,
    relayOn,
  };
};

function CircularGauge({ value, colorClass }: { value: number; colorClass: string }) {
  const safeValue = clamp(value);
  const degree = Math.round((safeValue / 100) * 360);

  return (
    <div
      className="relative h-16 w-16 rounded-full transition-all duration-500"
      style={{
        background: `conic-gradient(var(--tw-gradient-to) ${degree}deg, rgb(15 23 42) ${degree}deg)`,
      }}
    >
      <div className="absolute inset-[5px] rounded-full bg-slate-900 flex items-center justify-center">
        <span className={`text-xs font-semibold ${colorClass}`}>{safeValue}%</span>
      </div>
    </div>
  );
}

export default function SimulatorPanel() {
  const [status, setStatus] = useState<ConnectionState>("connecting");
  const [data, setData] = useState<SimulatorData | null>(null);
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);

  const wsUrl = useMemo(() => process.env.NEXT_PUBLIC_WS_URL?.trim() || FALLBACK_WS_URL, []);

  useEffect(() => {
    let isMounted = true;
    let socket: WebSocket | null = null;

    const clearReconnectTimer = () => {
      if (!reconnectTimerRef.current) return;
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    };

    const scheduleReconnect = () => {
      clearReconnectTimer();
      retryCountRef.current += 1;
      const delay = Math.min(1000 * 2 ** Math.min(retryCountRef.current, 4), MAX_RETRY_DELAY_MS);
      setStatus("reconnecting");

      reconnectTimerRef.current = setTimeout(() => {
        connect();
      }, delay);
    };

    const connect = () => {
      if (!isMounted) return;

      try {
        setStatus(retryCountRef.current > 0 ? "reconnecting" : "connecting");
        socket = new WebSocket(wsUrl);

        socket.onopen = () => {
          if (!isMounted) return;
          retryCountRef.current = 0;
          setStatus("connected");
        };

        socket.onmessage = (event) => {
          if (!isMounted) return;
          try {
            const parsed = JSON.parse(event.data) as unknown;
            const normalized = normalizePayload(parsed);
            if (normalized) setData(normalized);
          } catch {
            // Ignore malformed payloads; keep previous valid data.
          }
        };

        socket.onerror = () => {
          if (!isMounted) return;
          setStatus("offline");
        };

        socket.onclose = () => {
          if (!isMounted) return;
          setStatus("offline");
          scheduleReconnect();
        };
      } catch {
        setStatus("offline");
        scheduleReconnect();
      }
    };

    connect();

    return () => {
      isMounted = false;
      clearReconnectTimer();
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
    };
  }, [wsUrl]);

  const statusText =
    status === "connected"
      ? "已连接"
      : status === "reconnecting"
      ? "重连中"
      : status === "connecting"
      ? "连接中"
      : "设备离线";

  const statusDotClass =
    status === "connected"
      ? "bg-emerald-400"
      : status === "reconnecting" || status === "connecting"
      ? "bg-amber-400 animate-pulse"
      : "bg-rose-400";

  return (
    <section className="bg-slate-900 border border-slate-800 rounded-2xl p-5 md:p-6 mb-8">
      <div className="flex items-start justify-between gap-3 mb-5">
        <div>
          <h2 className="text-lg md:text-xl font-semibold text-white">硬件模拟器实时面板</h2>
          <p className="text-slate-400 text-xs md:text-sm mt-1">温度 / 湿度 / 继电器状态</p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-800/80 px-3 py-1.5">
          <span className={`h-2.5 w-2.5 rounded-full ${statusDotClass}`} />
          <span className="text-xs text-slate-200">{statusText}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
          <div className="flex items-center gap-2 text-slate-300 mb-3">
            <Thermometer className="h-4 w-4 text-rose-400" />
            <span className="text-sm">温度</span>
          </div>
          <p className="text-3xl font-bold text-white tabular-nums transition-all duration-500">
            {data ? `${data.temperature.toFixed(1)}°C` : "--"}
          </p>
          <div className="mt-3 h-2 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-rose-500 to-orange-400 transition-all duration-500"
              style={{ width: `${clamp((data?.temperature ?? 0) * 2)}%` }}
            />
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
          <div className="flex items-center gap-2 text-slate-300 mb-3">
            <Gauge className="h-4 w-4 text-sky-400" />
            <span className="text-sm">湿度</span>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-3xl font-bold text-white tabular-nums transition-all duration-500">
              {data ? `${clamp(data.humidity).toFixed(1)}%` : "--"}
            </p>
            <div className="[--tw-gradient-to:rgb(56_189_248)]">
              <CircularGauge value={data?.humidity ?? 0} colorClass="text-sky-300" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 sm:col-span-2 lg:col-span-1">
          <div className="flex items-center gap-2 text-slate-300 mb-3">
            <Power className="h-4 w-4 text-emerald-400" />
            <span className="text-sm">继电器</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className={`h-3 w-3 rounded-full transition-all duration-500 ${
                  data?.relayOn ? "bg-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.8)]" : "bg-slate-600"
                }`}
              />
              <span className={`text-lg font-semibold ${data?.relayOn ? "text-emerald-300" : "text-slate-300"}`}>
                {data ? (data.relayOn ? "ON" : "OFF") : "--"}
              </span>
            </div>
            <Activity className={`h-5 w-5 ${data?.relayOn ? "text-emerald-400" : "text-slate-600"}`} />
          </div>
        </div>
      </div>
    </section>
  );
}
