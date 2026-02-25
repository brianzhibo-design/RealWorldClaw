"use client";

import { ManufacturingNode, NODE_TYPE_INFO, STATUS_COLORS } from '@/lib/nodes';

interface NodeDetailsProps {
  node: ManufacturingNode;
  onClose: () => void;
}

const MATERIAL_COLORS: Record<string, string> = {
  pla: 'bg-emerald-500/20 text-emerald-200 border-emerald-300/30',
  abs: 'bg-orange-500/20 text-orange-200 border-orange-300/30',
  petg: 'bg-cyan-500/20 text-cyan-200 border-cyan-300/30',
  tpu: 'bg-fuchsia-500/20 text-fuchsia-200 border-fuchsia-300/30',
  nylon: 'bg-indigo-500/20 text-indigo-200 border-indigo-300/30',
  resin: 'bg-purple-500/20 text-purple-200 border-purple-300/30',
};

function formatRelativeTime(input: string | null) {
  if (!input) return 'Unknown';
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return 'Unknown';

  const sec = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (sec < 60) return `${sec}s ago`;
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
  return `${Math.floor(sec / 86400)}d ago`;
}

function formatDurationSince(input: string | null) {
  if (!input) return 'Unknown';
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return 'Unknown';

  const ms = Math.max(0, Date.now() - date.getTime());
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
  if (days > 0) return `${days}d ${hours}h`;
  const mins = Math.floor((ms / (1000 * 60)) % 60);
  return `${hours}h ${mins}m`;
}

export function NodeDetails({ node, onClose }: NodeDetailsProps) {
  const maxBuildAxis = Math.max(node.build_volume_x || 0, node.build_volume_y || 0, node.build_volume_z || 0, 1);
  const onlineLike = node.status === 'online' || node.status === 'idle';

  return (
    <div className="w-[min(22rem,calc(100vw-1rem))] rounded-xl border border-emerald-400/30 bg-[#0d1620]/92 backdrop-blur-md p-5 shadow-[0_0_34px_rgba(16,185,129,0.2)]">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">{NODE_TYPE_INFO[node.node_type]?.icon || '⚙️'}</span>
          <div>
            <h3 className="text-base font-semibold text-white leading-tight">{node.name}</h3>
            <p className="text-xs text-slate-400">{NODE_TYPE_INFO[node.node_type]?.name || node.node_type}</p>
          </div>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-white text-lg" aria-label="Close">
          ×
        </button>
      </div>

      <div className="space-y-3 text-sm">
        <div className="rounded-lg border border-slate-700/80 bg-slate-900/50 p-3 space-y-2">
          <div className="flex justify-between">
            <span className="text-slate-400">Status</span>
            <span style={{ color: STATUS_COLORS[node.status] || '#94a3b8' }} className="font-semibold capitalize">
              {node.status}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Online duration</span>
            <span className="text-slate-200">{onlineLike ? formatDurationSince(node.created_at) : 'Offline'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Last activity</span>
            <span className="text-slate-200">{formatRelativeTime(node.last_heartbeat)}</span>
          </div>
        </div>

        {node.materials.length > 0 && (
          <div>
            <span className="text-slate-400 block mb-1.5">Materials</span>
            <div className="flex flex-wrap gap-1.5">
              {node.materials.map((m) => (
                <span
                  key={m}
                  className={`px-2 py-0.5 rounded-md border text-xs ${MATERIAL_COLORS[m.toLowerCase()] || 'bg-slate-700 text-slate-200 border-slate-500/40'}`}
                >
                  {m.toUpperCase()}
                </span>
              ))}
            </div>
          </div>
        )}

        {node.build_volume_x && node.build_volume_y && node.build_volume_z && (
          <div>
            <span className="text-slate-400 block mb-1.5">Build Volume</span>
            <div className="rounded-lg border border-cyan-400/20 bg-[#0a1119] p-2.5">
              <div className="mb-2 text-xs text-slate-300 font-mono">
                {node.build_volume_x} × {node.build_volume_y} × {node.build_volume_z} mm
              </div>
              <div className="space-y-1.5">
                {[
                  { label: 'X', value: node.build_volume_x },
                  { label: 'Y', value: node.build_volume_y },
                  { label: 'Z', value: node.build_volume_z },
                ].map((axis) => (
                  <div key={axis.label} className="flex items-center gap-2">
                    <span className="w-4 text-[10px] text-cyan-300">{axis.label}</span>
                    <div className="h-1.5 flex-1 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400"
                        style={{ width: `${Math.max(8, Math.round((axis.value / maxBuildAxis) * 100))}%` }}
                      />
                    </div>
                    <span className="w-10 text-right text-[10px] text-slate-400">{axis.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {node.capabilities.length > 0 && (
          <div>
            <span className="text-slate-400 block mb-1.5">Capabilities</span>
            <div className="flex flex-wrap gap-1.5">
              {node.capabilities.map((c) => (
                <span key={c} className="px-2 py-0.5 rounded-md bg-cyan-900/45 text-cyan-200 border border-cyan-400/20 text-xs">
                  {c}
                </span>
              ))}
            </div>
          </div>
        )}

        {node.description && (
          <div>
            <span className="text-slate-400 block mb-1.5">Description</span>
            <p className="text-slate-300 text-xs leading-relaxed">{node.description}</p>
          </div>
        )}
      </div>
    </div>
  );
}
