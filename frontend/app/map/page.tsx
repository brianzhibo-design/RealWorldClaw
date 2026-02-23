"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { WorldMap } from "@/components/WorldMap";
import { MapFilters } from "@/components/MapFilters";
import { NodeDetails } from "@/components/NodeDetails";
import { ManufacturingNode, fetchMapNodes } from "@/lib/nodes";

export default function MapPage() {
  const [nodes, setNodes] = useState<ManufacturingNode[]>([]);
  const [selectedNode, setSelectedNode] = useState<ManufacturingNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<ManufacturingNode | null>(null);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMapNodes().then((data) => {
      setNodes(data);
      setLoading(false);
    });
  }, []);

  const onlineCount = nodes.filter((n) => n.status === "online" || n.status === "idle").length;

  return (
    <div className="relative w-full h-screen bg-slate-950 overflow-hidden">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-4 sm:px-6 py-3 bg-slate-950/80 backdrop-blur-sm border-b border-slate-800/50">
        <div className="flex items-center gap-2 sm:gap-3">
          <Link href="/" className="flex items-center gap-2 sm:gap-3">
            <svg viewBox="0 0 130 130" className="w-6 h-6 sm:w-7 sm:h-7">
              <path d="M 25 105 V 35 H 55 A 15 15 0 0 1 55 65 H 25 M 40 65 L 60 105" fill="none" stroke="#38bdf8" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M 70 35 L 80 105 L 95 65 L 110 105 L 120 35" fill="none" stroke="#38bdf8" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="25" cy="35" r="4" fill="#fff"/><circle cx="55" cy="50" r="4" fill="#fff"/><circle cx="95" cy="65" r="4" fill="#fff"/>
            </svg>
            <h1 className="text-sm sm:text-lg font-bold text-white">
              <span className="hidden sm:inline">RealWorld</span><span className="text-sky-400">Claw</span> Map
            </h1>
          </Link>
        </div>
        <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm">
          <span className="text-slate-400 hidden sm:block">
            {loading ? "Loading..." : `${nodes.length} nodes · ${onlineCount} online`}
          </span>
          <span className="text-slate-400 sm:hidden">
            {loading ? "..." : `${onlineCount}/${nodes.length}`}
          </span>
          <Link href="/auth/signin" className="text-slate-300 hover:text-white transition-colors hidden sm:block">
            Sign In
          </Link>
          <Link
            href="/register-node"
            className="px-2 py-1 sm:px-3 sm:py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-md transition-colors text-xs sm:text-sm font-medium"
          >
            <span className="hidden sm:inline">Register Your Machine</span>
            <span className="sm:hidden">Register</span>
          </Link>
        </div>
      </header>

      {/* Map */}
      <div className="absolute inset-0 pt-14">
        <WorldMap
          nodes={nodes}
          selectedTypes={selectedTypes}
          selectedMaterials={selectedMaterials}
          searchQuery={searchQuery}
          onNodeClick={setSelectedNode}
          hoveredNode={hoveredNode}
          onNodeHover={setHoveredNode}
        />
      </div>

      {/* Filters */}
      <div className="absolute top-16 left-2 sm:top-20 sm:left-4 z-20">
        <MapFilters
          selectedTypes={selectedTypes}
          onTypesChange={setSelectedTypes}
          selectedMaterials={selectedMaterials}
          onMaterialsChange={setSelectedMaterials}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
      </div>

      {/* Node details panel */}
      {selectedNode && (
        <div className="absolute top-16 right-2 sm:top-20 sm:right-4 z-20 max-w-[calc(100vw-1rem)] sm:max-w-none">
          <NodeDetails node={selectedNode} onClose={() => setSelectedNode(null)} />
        </div>
      )}

      {/* Empty state */}
      {!loading && nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
          <div className="text-center pointer-events-auto">
            <div className="text-6xl mb-4">🌍</div>
            <h2 className="text-xl font-bold text-white mb-2">The map is waiting</h2>
            <p className="text-slate-400 mb-4 max-w-md">
              No manufacturing nodes online yet. Be the first to register your machine
              and light up the map.
            </p>
            <Link
              href="/register-node"
              className="inline-block px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg transition-colors font-medium"
            >
              Register Your Machine →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}