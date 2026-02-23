"use client";

import { ManufacturingNode, NODE_TYPE_INFO, STATUS_COLORS } from "@/lib/nodes";

interface NodeDetailsProps {
  node: ManufacturingNode;
  onClose: () => void;
}

export function NodeDetails({ node, onClose }: NodeDetailsProps) {
  return (
    <div className="bg-slate-800/95 backdrop-blur-sm rounded-lg border border-slate-700 p-5 w-80">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">{NODE_TYPE_INFO[node.node_type]?.icon || "⚙️"}</span>
          <h3 className="text-base font-semibold text-white">{node.name}</h3>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-white text-lg" aria-label="Close">×</button>
      </div>

      <div className="space-y-3 text-sm">
        <div className="flex justify-between">
          <span className="text-slate-400">Type</span>
          <span className="text-white">{NODE_TYPE_INFO[node.node_type]?.name || node.node_type}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Status</span>
          <span style={{ color: STATUS_COLORS[node.status] }} className="font-medium">{node.status}</span>
        </div>
        {node.build_volume_x && (
          <div className="flex justify-between">
            <span className="text-slate-400">Build Volume</span>
            <span className="text-white font-mono text-xs">
              {node.build_volume_x}×{node.build_volume_y}×{node.build_volume_z}mm
            </span>
          </div>
        )}
        {node.materials.length > 0 && (
          <div>
            <span className="text-slate-400 block mb-1">Materials</span>
            <div className="flex flex-wrap gap-1">
              {node.materials.map(m => (
                <span key={m} className="px-2 py-0.5 bg-slate-700 rounded text-xs text-slate-200">
                  {m.toUpperCase()}
                </span>
              ))}
            </div>
          </div>
        )}
        {node.capabilities.length > 0 && (
          <div>
            <span className="text-slate-400 block mb-1">Capabilities</span>
            <div className="flex flex-wrap gap-1">
              {node.capabilities.map(c => (
                <span key={c} className="px-2 py-0.5 bg-sky-900/50 rounded text-xs text-sky-300">{c}</span>
              ))}
            </div>
          </div>
        )}
        {node.description && (
          <div>
            <span className="text-slate-400 block mb-1">Description</span>
            <p className="text-slate-300 text-xs">{node.description}</p>
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-700">
        <button className="w-full py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-md text-sm font-medium transition-colors">
          Request Manufacturing
        </button>
      </div>
    </div>
  );
}
