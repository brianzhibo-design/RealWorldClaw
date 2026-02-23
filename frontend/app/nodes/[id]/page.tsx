"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api-client";
import { NODE_TYPE_INFO, STATUS_COLORS } from "@/lib/nodes";

interface NodeDetail {
  id: string;
  name: string;
  node_type: string;
  status: string;
  materials: string[];
  build_volume_x: number | null;
  build_volume_y: number | null;
  build_volume_z: number | null;
  fuzzy_latitude: number;
  fuzzy_longitude: number;
  description: string | null;
  capabilities: string[];
  last_heartbeat: string | null;
  created_at: string;
}

function coordToCity(lat: number, lng: number): string {
  // Simple geo approximation for display
  if (lat > 35 && lng > 100 && lng < 125) return "Northern China";
  if (lat > 20 && lat <= 35 && lng > 100 && lng < 125) return "Southern China";
  if (lat > 35 && lng > 125 && lng < 145) return "Japan / Korea";
  if (lat > 25 && lat < 50 && lng > -130 && lng < -60) return "United States";
  if (lat > 35 && lng > -15 && lng < 40) return "Europe";
  if (lat > -40 && lat < 0 && lng > 110 && lng < 160) return "Australia";
  return `${lat.toFixed(2)}°, ${lng.toFixed(2)}°`;
}

export default function NodeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [node, setNode] = useState<NodeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!params.id) return;
    apiFetch<NodeDetail>(`/nodes/${params.id}`)
      .then(setNode)
      .catch(() => setError("Failed to load node details"))
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500" />
      </div>
    );
  }

  if (error || !node) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h2 className="text-xl font-bold mb-2">Node Not Found</h2>
          <p className="text-slate-400 mb-6">{error || "This node does not exist."}</p>
          <Link href="/map" className="px-6 py-3 bg-sky-600 hover:bg-sky-500 text-white rounded-lg font-medium transition-colors">
            ← Back to Map
          </Link>
        </div>
      </div>
    );
  }

  const typeInfo = NODE_TYPE_INFO[node.node_type] || { name: node.node_type, icon: "⚙️", color: "#94a3b8" };
  const isOnline = node.status === "online" || node.status === "idle";
  const statusColor = STATUS_COLORS[node.status] || "#64748b";

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-slate-800">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <button onClick={() => router.back()} className="text-slate-400 hover:text-slate-300 mb-3 flex items-center gap-2 transition-colors">
            <span>←</span> Back
          </button>
          <div className="flex items-center gap-3">
            <span className="text-3xl">{typeInfo.icon}</span>
            <div>
              <h1 className="text-3xl font-bold">{node.name}</h1>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-slate-400">{typeInfo.name}</span>
                <span className="flex items-center gap-1.5 text-sm font-medium" style={{ color: statusColor }}>
                  <span className={`w-2 h-2 rounded-full ${isOnline ? "bg-green-500 animate-pulse" : "bg-slate-500"}`} />
                  {node.status}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* Materials */}
        {node.materials.length > 0 && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4">🧪 Supported Materials</h2>
            <div className="flex flex-wrap gap-2">
              {node.materials.map((m) => (
                <span key={m} className="px-3 py-1.5 bg-sky-900/40 border border-sky-800/50 rounded-full text-sm text-sky-300 font-medium">
                  {m.toUpperCase()}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Build Volume */}
        {node.build_volume_x && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4">📐 Build Volume</h2>
            <div className="font-mono text-2xl text-sky-400">
              {node.build_volume_x} × {node.build_volume_y} × {node.build_volume_z}
              <span className="text-base text-slate-400 ml-2">mm</span>
            </div>
          </div>
        )}

        {/* Location */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">📍 Location</h2>
          <p className="text-slate-300">{coordToCity(node.fuzzy_latitude, node.fuzzy_longitude)}</p>
          <p className="text-slate-500 text-sm mt-1">
            {node.fuzzy_latitude.toFixed(4)}°, {node.fuzzy_longitude.toFixed(4)}°
          </p>
        </div>

        {/* Capabilities */}
        {node.capabilities.length > 0 && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4">⚡ Capabilities</h2>
            <div className="flex flex-wrap gap-2">
              {node.capabilities.map((c) => (
                <span key={c} className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-full text-sm text-slate-300">
                  {c}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Description */}
        {node.description && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4">📝 Description</h2>
            <p className="text-slate-300 leading-relaxed">{node.description}</p>
          </div>
        )}

        {/* CTA */}
        <div className="pt-4">
          <Link
            href={`/orders/new?node_id=${node.id}`}
            className="inline-flex items-center gap-2 px-8 py-4 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-semibold text-lg transition-colors"
          >
            🖨️ Request a Print
          </Link>
        </div>
      </div>
    </div>
  );
}
