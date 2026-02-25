"use client";

import { useState, useEffect, useMemo } from 'react';
import { WorldMap } from '@/components/WorldMap';
import { NodeDetails } from '@/components/NodeDetails';
import { ManufacturingNode, MapRegionSummary, NODE_TYPE_INFO, STATUS_COLORS, fetchMapNodes, fetchMapRegions } from '@/lib/nodes';

export default function MapPage() {
  useEffect(() => {
    document.title = 'Manufacturing Map — RealWorldClaw';
  }, []);

  const [nodes, setNodes] = useState<ManufacturingNode[]>([]);
  const [regions, setRegions] = useState<MapRegionSummary[]>([]);
  const [selectedNode, setSelectedNode] = useState<ManufacturingNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<ManufacturingNode | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadNodes = async () => {
      try {
        setLoading(true);
        setError(null);
        const [nodeData, regionData] = await Promise.all([fetchMapNodes(), fetchMapRegions()]);
        setNodes(nodeData);
        setRegions(regionData);
      } catch (err: unknown) {
        console.error('Failed to fetch map nodes:', err);
        setError(err instanceof Error ? err.message : 'Failed to load');
      } finally {
        setLoading(false);
      }
    };
    loadNodes();
  }, []);

  const onlineCount = nodes.filter((n) => n.status === 'online' || n.status === 'idle').length;

  if (error) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-3.5rem)] bg-slate-950 text-red-400">
        Failed to load map data. Please try again.
      </div>
    );
  }

  return (
    <div className="relative w-full h-[calc(100vh-3.5rem)] overflow-hidden bg-[#131921] text-white flex">
      {/* Left sidebar — normal flow, no absolute positioning */}
      <div className="hidden sm:flex flex-col w-[240px] shrink-0 border-r border-slate-800/60 bg-[#0f1720]/95 z-20 overflow-hidden">
        {/* Stats */}
        <div className="px-3 py-3 border-b border-slate-800/50">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="uppercase tracking-widest text-[10px]">Network</span>
            {loading && <span className="animate-pulse">Loading...</span>}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-md bg-slate-900/60 px-2.5 py-1.5 border border-slate-700/50">
              <div className="text-[10px] text-slate-500">Nodes</div>
              <div className="text-sm font-semibold text-white">{nodes.length}</div>
            </div>
            <div className="rounded-md bg-slate-900/60 px-2.5 py-1.5 border border-slate-700/50">
              <div className="text-[10px] text-slate-500">Online</div>
              <div className="text-sm font-semibold text-emerald-300">{onlineCount}</div>
            </div>
          </div>
        </div>

        {/* Node list */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-3 py-2 border-b border-slate-800/40">
            <div className="text-[10px] uppercase tracking-widest text-slate-500">Registered Nodes</div>
          </div>
          {nodes.length === 0 && !loading ? (
            <div className="px-3 py-8 text-xs text-slate-500 text-center">
              No nodes yet
            </div>
          ) : (
            <div className="divide-y divide-slate-800/30">
              {nodes.map((node) => {
                const isOnline = node.status === 'online' || node.status === 'idle';
                const isSelected = selectedNode?.id === node.id;
                const isHovered = hoveredNode?.id === node.id;
                return (
                  <button
                    key={node.id}
                    onClick={() => setSelectedNode(node)}
                    onMouseEnter={() => setHoveredNode(node)}
                    onMouseLeave={() => setHoveredNode(null)}
                    className={`w-full text-left px-3 py-2.5 transition-colors ${
                      isSelected
                        ? 'bg-emerald-500/15 border-l-2 border-emerald-400'
                        : isHovered
                          ? 'bg-slate-800/40'
                          : 'border-l-2 border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-sm shrink-0">{NODE_TYPE_INFO[node.node_type]?.icon || '⚙️'}</span>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-medium text-white truncate">{node.name}</div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isOnline ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                          <span className="text-[10px] text-slate-400 truncate">
                            {NODE_TYPE_INFO[node.node_type]?.name || node.node_type}
                          </span>
                        </div>
                        {node.materials.length > 0 && (
                          <div className="text-[10px] text-slate-500 mt-0.5 truncate">
                            {node.materials.slice(0, 3).map(m => m.toUpperCase()).join(', ')}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Map area — takes remaining space */}
      <div className="flex-1 relative">
        {loading && (
          <div className="absolute inset-0 z-30 bg-[#131921] flex items-center justify-center">
            <div className="text-slate-400 animate-pulse">Loading map...</div>
          </div>
        )}

        <WorldMap
          nodes={nodes}
          regions={regions}
          selectedTypes={[]}
          selectedMaterials={[]}
          searchQuery=""
          onNodeClick={(node) => setSelectedNode(node)}
          hoveredNode={hoveredNode}
          onNodeHover={setHoveredNode}
        />

        {/* Node details panel — bottom right */}
        {selectedNode && (
          <div className="absolute bottom-[32vh] sm:bottom-3 right-3 z-30 w-[320px] max-w-[calc(100%-1.5rem)]">
            <NodeDetails node={selectedNode} onClose={() => setSelectedNode(null)} />
          </div>
        )}

        {/* Empty state */}
        {!loading && nodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center z-10 px-4">
            <div className="text-center">
              <div className="text-4xl mb-3">🌍</div>
              <div className="text-lg font-semibold text-white mb-1">Be the first to register a node</div>
              <div className="text-sm text-slate-400">No manufacturing nodes online yet.</div>
            </div>
          </div>
        )}
      </div>

      {/* Mobile: bottom sheet node list (small screens only) */}
      <div className="sm:hidden absolute bottom-0 left-0 right-0 z-20 bg-[#0f1720]/95 border-t border-slate-800/60 max-h-[30vh] overflow-y-auto">
        <div className="px-3 py-2 flex items-center justify-between border-b border-slate-800/40">
          <span className="text-[10px] uppercase tracking-widest text-slate-500">Nodes ({nodes.length})</span>
          <span className="text-[10px] text-emerald-300">{onlineCount} online</span>
        </div>
        {nodes.map((node) => {
          const isOnline = node.status === 'online' || node.status === 'idle';
          return (
            <button
              key={node.id}
              onClick={() => setSelectedNode(node)}
              className="w-full text-left px-3 py-2 border-b border-slate-800/20 hover:bg-slate-800/30"
            >
              <div className="flex items-center gap-2">
                <span className="text-xs">{NODE_TYPE_INFO[node.node_type]?.icon || '⚙️'}</span>
                <span className="text-xs text-white truncate flex-1">{node.name}</span>
                <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-400' : 'bg-slate-500'}`} />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
