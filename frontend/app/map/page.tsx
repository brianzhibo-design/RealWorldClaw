"use client";

import { useState, useEffect, useMemo } from 'react';
import { WorldMap } from '@/components/WorldMap';
import { MapFilters } from '@/components/MapFilters';
import { NodeDetails } from '@/components/NodeDetails';
import { ManufacturingNode, MapRegionSummary, NODE_TYPE_INFO, fetchMapNodes, fetchMapRegions } from '@/lib/nodes';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';

function inferCountryKey(node: ManufacturingNode): string | null {
  if (typeof node.country === 'string' && node.country.trim()) return node.country.trim().toLowerCase();
  if (typeof node.country_code === 'string' && node.country_code.trim()) return node.country_code.trim().toLowerCase();
  return null;
}

function LoadingMapSkeleton() {
  return (
    <div className="absolute inset-0 z-40 bg-[#131921] flex items-center justify-center">
      <div className="w-[min(52rem,92vw)] space-y-4 animate-pulse">
        <div className="h-10 rounded-lg bg-slate-800/80" />
        <div className="h-[54vh] rounded-xl bg-[radial-gradient(circle_at_50%_40%,rgba(16,185,129,0.18),rgba(30,41,59,0.85))] border border-slate-700/70" />
        <div className="grid grid-cols-3 gap-3">
          <div className="h-16 rounded-lg bg-slate-800/70" />
          <div className="h-16 rounded-lg bg-slate-800/70" />
          <div className="h-16 rounded-lg bg-slate-800/70" />
        </div>
      </div>
    </div>
  );
}

export default function MapPage() {
  useEffect(() => {
    document.title = 'Manufacturing Map — RealWorldClaw';
  }, []);

  const [nodes, setNodes] = useState<ManufacturingNode[]>([]);
  const [regions, setRegions] = useState<MapRegionSummary[]>([]);
  const [selectedNode, setSelectedNode] = useState<ManufacturingNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<ManufacturingNode | null>(null);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
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
  const countryCount = useMemo(() => {
    const keys = nodes.map(inferCountryKey).filter(Boolean) as string[];
    return new Set(keys).size;
  }, [nodes]);

  const stats = [
    { label: 'Total Nodes', value: nodes.length },
    { label: 'Online', value: onlineCount, accent: 'text-emerald-300' },
    { label: 'Countries', value: countryCount || '—', accent: 'text-cyan-300' },
  ];

  if (error) {
    return <ErrorState message={error} />;
  }

  return (
    <div className="relative w-full h-[calc(100vh-3.5rem)] md:h-[calc(100vh-3.5rem)] overflow-hidden bg-[#131921] text-white">
      {loading && <LoadingMapSkeleton />}

          <div className="absolute top-3 left-3 right-3 sm:left-6 sm:right-auto z-30">
            <div className="grid grid-cols-3 gap-2 sm:gap-3 rounded-xl border border-emerald-400/20 bg-[#0f1720]/78 backdrop-blur-md p-2.5 sm:p-3 shadow-[0_0_26px_rgba(16,185,129,0.12)]">
              {stats.map((s) => (
                <div key={s.label} className="rounded-md border border-slate-700/70 bg-slate-900/45 px-2.5 py-2 sm:px-3">
                  <div className="text-[10px] sm:text-[11px] uppercase tracking-[0.18em] text-slate-400">{s.label}</div>
                  <div className={`text-sm sm:text-xl font-semibold mt-0.5 ${s.accent || 'text-white'}`}>{s.value}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="absolute inset-0 pt-0">
            <WorldMap
              nodes={nodes}
              regions={regions}
              selectedTypes={selectedTypes}
              selectedMaterials={selectedMaterials}
              searchQuery={searchQuery}
              onNodeClick={(node) => setSelectedNode(node)}
              hoveredNode={hoveredNode}
              onNodeHover={setHoveredNode}
            />
          </div>

          <div className="absolute top-[6.5rem] left-2 sm:left-4 z-20">
            <MapFilters
              selectedTypes={selectedTypes}
              onTypesChange={setSelectedTypes}
              selectedMaterials={selectedMaterials}
              onMaterialsChange={setSelectedMaterials}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
            />
          </div>

          {/* Left sidebar - Node list */}
          <div className="absolute top-[13rem] left-2 sm:left-4 z-20 w-[220px] max-h-[calc(100vh-12rem)] overflow-y-auto rounded-xl border border-slate-700/60 bg-[#0f1720]/90 backdrop-blur-md">
            <div className="px-3 py-2 border-b border-slate-700/50">
              <div className="text-[10px] uppercase tracking-widest text-slate-400">Nodes ({nodes.length})</div>
            </div>
            <div className="divide-y divide-slate-800/50">
              {nodes.map((node) => {
                const isOnline = node.status === 'online' || node.status === 'idle';
                const isSelected = selectedNode?.id === node.id;
                return (
                  <button
                    key={node.id}
                    onClick={() => setSelectedNode(node)}
                    onMouseEnter={() => setHoveredNode(node)}
                    onMouseLeave={() => setHoveredNode(null)}
                    className={`w-full text-left px-3 py-2.5 transition-colors ${
                      isSelected ? 'bg-emerald-500/15' : 'hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs">{NODE_TYPE_INFO[node.node_type]?.icon || '⚙️'}</span>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-medium text-white truncate">{node.name}</div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                          <span className="text-[10px] text-slate-400">{NODE_TYPE_INFO[node.node_type]?.name || node.node_type}</span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
              {nodes.length === 0 && !loading && (
                <div className="px-3 py-4 text-xs text-slate-500 text-center">No nodes registered</div>
              )}
            </div>
          </div>

          {selectedNode && (
            <div className="absolute bottom-2 right-2 sm:bottom-4 sm:right-4 z-30">
              <NodeDetails node={selectedNode} onClose={() => setSelectedNode(null)} />
            </div>
          )}

          {!loading && nodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center z-10 px-4">
              <EmptyState
                icon="🌍"
                title="Be the first to register a node"
                description="No manufacturing nodes online yet. Start the global network by registering your machine."
              />
            </div>
          )}

    </div>
  );
}
