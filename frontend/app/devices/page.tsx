"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Cpu,
  Thermometer,
  Zap,
  Activity,
  RefreshCw,
  Clock,
  ChevronDown,
  ChevronUp,
  Send,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/authStore";
import { API_BASE } from "@/lib/api-client";


// ── Types ──────────────────────────────────────────────────────

interface TelemetryEntry {
  sensor_type: string;
  value: number;
  unit: string;
  timestamp: string;
}

interface CommandEntry {
  command_id: string;
  command: string;
  parameters: Record<string, unknown>;
  status: string;
  requester_agent_id: string;
  created_at: string;
  result?: string;
}

interface Device {
  id: string;
  device_id: string;
  name: string;
  type: string;
  status: string;
  capabilities: string[];
  last_seen_at: string | null;
  created_at: string;
}

// ── Helpers ────────────────────────────────────────────────────

function healthColor(lastSeen: string | null): string {
  if (!lastSeen) return "text-gray-400";
  const diff = Date.now() - new Date(lastSeen).getTime();
  if (diff < 5 * 60_000) return "text-green-500"; // < 5 min
  if (diff < 30 * 60_000) return "text-yellow-500"; // < 30 min
  return "text-red-500";
}

function healthLabel(lastSeen: string | null): string {
  if (!lastSeen) return "从未上线";
  const diff = Date.now() - new Date(lastSeen).getTime();
  if (diff < 5 * 60_000) return "在线";
  if (diff < 30 * 60_000) return "不稳定";
  return "离线";
}

function relativeTime(iso: string | null): string {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000) return "刚刚";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}分钟前`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}小时前`;
  return `${Math.floor(diff / 86_400_000)}天前`;
}

const typeIcon: Record<string, typeof Cpu> = {
  sensor: Thermometer,
  relay: Zap,
  printer: Cpu,
  camera: Activity,
};

// ── Device Card ────────────────────────────────────────────────

function DeviceCard({ device }: { device: Device }) {
  const token = useAuthStore((s) => s.token);
  const [expanded, setExpanded] = useState(false);
  const [telemetry, setTelemetry] = useState<TelemetryEntry[]>([]);
  const [commands, setCommands] = useState<CommandEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const Icon = typeIcon[device.type] || Cpu;

  const fetchDetails = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const headers: Record<string, string> = { Authorization: `Bearer ${token}` };

      const [telRes, cmdRes] = await Promise.all([
        fetch(`${API_BASE}/devices/${device.device_id}/telemetry?limit=10`, { headers }).catch(
          () => null
        ),
        fetch(`${API_BASE}/devices/${device.device_id}/commands?limit=10`, { headers }).catch(
          () => null
        ),
      ]);

      if (telRes?.ok) {
        const data = await telRes.json();
        setTelemetry(data.telemetry || data.data || []);
      }
      if (cmdRes?.ok) {
        const data = await cmdRes.json();
        setCommands(data.commands || data.data || []);
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = () => {
    const next = !expanded;
    setExpanded(next);
    if (next && telemetry.length === 0 && commands.length === 0) {
      fetchDetails();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
    >
      <Card className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Icon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">{device.name}</h3>
              <p className="text-xs text-muted-foreground font-mono">{device.device_id}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-medium ${healthColor(device.last_seen_at)}`}>
              ● {healthLabel(device.last_seen_at)}
            </span>
            <Button variant="ghost" size="sm" onClick={toggleExpand}>
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Meta */}
        <div className="flex gap-4 text-xs text-muted-foreground">
          <span>类型: {device.type}</span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {relativeTime(device.last_seen_at)}
          </span>
          {device.capabilities.length > 0 && (
            <span>能力: {device.capabilities.join(", ")}</span>
          )}
        </div>

        {/* Expanded: Telemetry + Commands */}
        {expanded && (
          <div className="space-y-4 pt-2 border-t">
            {loading && (
              <div className="flex justify-center py-4">
                <RefreshCw className="w-4 h-4 animate-spin text-muted-foreground" />
              </div>
            )}

            {/* Telemetry */}
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                <Thermometer className="w-4 h-4" /> 遥测数据
              </h4>
              {telemetry.length === 0 ? (
                <p className="text-xs text-muted-foreground">暂无数据</p>
              ) : (
                <div className="space-y-1">
                  {telemetry.map((t, i) => (
                    <div
                      key={i}
                      className="flex justify-between text-xs bg-muted/50 rounded px-2 py-1"
                    >
                      <span className="font-medium">
                        {t.sensor_type}: {t.value}
                        {t.unit}
                      </span>
                      <span className="text-muted-foreground">{relativeTime(t.timestamp)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Command History */}
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                <Send className="w-4 h-4" /> 命令历史
              </h4>
              {commands.length === 0 ? (
                <p className="text-xs text-muted-foreground">暂无命令</p>
              ) : (
                <div className="space-y-1">
                  {commands.map((c, i) => (
                    <div
                      key={i}
                      className="flex justify-between text-xs bg-muted/50 rounded px-2 py-1"
                    >
                      <span>
                        <span className="font-mono font-medium">{c.command}</span>
                        <span className="text-muted-foreground ml-2">
                          by {c.requester_agent_id}
                        </span>
                      </span>
                      <span
                        className={
                          c.status === "executed"
                            ? "text-green-600"
                            : c.status === "failed"
                            ? "text-red-500"
                            : "text-yellow-500"
                        }
                      >
                        {c.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Button variant="outline" size="sm" onClick={fetchDetails} className="w-full">
              <RefreshCw className="w-3 h-3 mr-1" /> 刷新
            </Button>
          </div>
        )}
      </Card>
    </motion.div>
  );
}

// ── Page ────────────────────────────────────────────────────────

export default function DevicesPage() {
  const token = useAuthStore((s) => s.token);
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDevices = async () => {
    setLoading(true);
    try {
      const headers: Record<string, string> = {};
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch(`${API_BASE}/devices`, { headers });
      if (res.ok) {
        const data = await res.json();
        setDevices(data.devices || []);
      }
    } catch (err) {
      console.error("Failed to fetch devices:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, [token]);

  const online = devices.filter(
    (d) => d.last_seen_at && Date.now() - new Date(d.last_seen_at).getTime() < 5 * 60_000
  ).length;

  return (
    
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">设备管理</h1>
            <p className="text-sm text-muted-foreground">
              查看设备状态、遥测数据和命令历史
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchDevices}>
            <RefreshCw className="w-4 h-4 mr-1" /> 刷新
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="p-4 text-center">
            <p className="text-2xl font-bold">{devices.length}</p>
            <p className="text-xs text-muted-foreground">总设备</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{online}</p>
            <p className="text-xs text-muted-foreground">在线</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-2xl font-bold text-red-500">{devices.length - online}</p>
            <p className="text-xs text-muted-foreground">离线</p>
          </Card>
        </div>

        {/* Device List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : devices.length === 0 ? (
          <Card className="p-12 text-center">
            <Cpu className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg mb-2">暂无设备</h3>
            <p className="text-sm text-muted-foreground">
              通过 API 注册你的第一个 ESP32 设备，或查看{" "}
              <a href="/docs" className="text-primary underline">
                快速上手文档
              </a>
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {devices.map((d) => (
              <DeviceCard key={d.id} device={d} />
            ))}
          </div>
        )}
      </div>
    
  );
}
