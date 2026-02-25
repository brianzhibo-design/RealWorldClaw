"use client";

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { WorldMap } from '@/components/WorldMap';
import { MapFilters } from '@/components/MapFilters';
import { NodeDetails } from '@/components/NodeDetails';
import { ManufacturingNode, MapRegionSummary, fetchMapNodes, fetchMapRegions } from '@/lib/nodes';
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
    <div className="relative w-full h-screen overflow-hidden bg-[#131921] text-white">
      {loading && <LoadingMapSkeleton />}

      <header className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-4 sm:px-6 py-3 bg-[#131921]/85 backdrop-blur-md border-b border-emerald-500/15">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <Link href="/" className="flex items-center gap-2 sm:gap-3 min-w-0">
            <svg viewBox="0 0 130 130" className="w-6 h-6 sm:w-7 sm:h-7 shrink-0">
              <path
                d="M 25 105 V 35 H 55 A 15 15 0 0 1 55 65 H 25 M 40 65 L 60 105"
                fill="none"
                stroke="#22d3ee"
                strokeWidth="6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M 70 35 L 80 105 L 95 65 L 110 105 L 120 35"
                fill="none"
                stroke="#10b981"
                strokeWidth="6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="25" cy="35" r="4" fill="#fff" />
              <circle cx="55" cy="50" r="4" fill="#fff" />
              <circle cx="95" cy="65" r="4" fill="#fff" />
            </svg>
            <h1 className="text-sm sm:text-lg font-bold truncate">
              <span className="hidden sm:inline">RealWorld</span>
              <span className="text-cyan-300">Claw</span> Global Fabrication Grid
            </h1>
          </Link>


        </div>

        <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm">
          <Link href="/auth/login" className="text-slate-300 hover:text-white transition-colors hidden sm:block">
            Sign In
          </Link>
          <Link
            href="/register-node"
            className="px-2.5 py-1.5 sm:px-3.5 sm:py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md transition-colors text-xs sm:text-sm font-medium"
          >
            <span className="hidden sm:inline">Register Your Machine</span>
            <span className="sm:hidden">Register</span>
          </Link>
        </div>
      </header>

          <div className="absolute top-[3.6rem] left-3 right-3 sm:left-6 sm:right-auto z-30">
            <div className="grid grid-cols-3 gap-2 sm:gap-3 rounded-xl border border-emerald-400/20 bg-[#0f1720]/78 backdrop-blur-md p-2.5 sm:p-3 shadow-[0_0_26px_rgba(16,185,129,0.12)]">
              {stats.map((s) => (
                <div key={s.label} className="rounded-md border border-slate-700/70 bg-slate-900/45 px-2.5 py-2 sm:px-3">
                  <div className="text-[10px] sm:text-[11px] uppercase tracking-[0.18em] text-slate-400">{s.label}</div>
                  <div className={`text-sm sm:text-xl font-semibold mt-0.5 ${s.accent || 'text-white'}`}>{s.value}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="absolute inset-0 pt-14">
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

          <div className="absolute top-40 left-2 sm:top-40 sm:left-4 z-20">
            <MapFilters
              selectedTypes={selectedTypes}
              onTypesChange={setSelectedTypes}
              selectedMaterials={selectedMaterials}
              onMaterialsChange={setSelectedMaterials}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
            />
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
