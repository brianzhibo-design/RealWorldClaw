"use client";

import { useState } from "react";
import Link from "next/link";
import { WorldMap } from "@/components/WorldMap";
import { MapFilters } from "@/components/MapFilters";
import { NodeDetails } from "@/components/NodeDetails";
import { ManufacturingNode } from "@/lib/mockNodes";

function Header() {
  return (
    <div className="bg-slate-900/95 backdrop-blur-sm border-b border-slate-700 px-6 py-4">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        {/* Logo and Title */}
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-sky-400 to-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">R</span>
            </div>
            <div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-sky-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
                RealWorldClaw
              </h1>
              <p className="text-xs text-slate-400 -mt-1">Global Manufacturing Network</p>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link href="/" className="text-sm text-sky-400 font-medium">
            Map
          </Link>
          <Link href="/orders" className="text-sm text-slate-400 hover:text-slate-300 transition-colors">
            Orders
          </Link>
          <Link href="/makers" className="text-sm text-slate-400 hover:text-slate-300 transition-colors">
            Makers
          </Link>
          <Link href="/materials" className="text-sm text-slate-400 hover:text-slate-300 transition-colors">
            Materials
          </Link>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-sm font-medium rounded-lg transition-colors">
            Submit Design
          </button>
          <button className="md:hidden text-slate-400">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

function StatusBar({ nodeCount, onlineCount, busyCount }: { 
  nodeCount: number; 
  onlineCount: number; 
  busyCount: number; 
}) {
  return (
    <div className="absolute bottom-4 right-4 z-10 bg-slate-800/80 backdrop-blur-sm rounded-lg border border-slate-700 px-4 py-3">
      <div className="flex items-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-400"></div>
          <span className="text-slate-300">{onlineCount} online</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
          <span className="text-slate-300">{busyCount} busy</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-gray-500"></div>
          <span className="text-slate-300">{nodeCount - onlineCount - busyCount} offline</span>
        </div>
      </div>
    </div>
  );
}

export default function MapPage() {
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNode, setSelectedNode] = useState<ManufacturingNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<ManufacturingNode | null>(null);

  // Mock stats for status bar
  const nodeCount = 15; // Total nodes in MOCK_NODES
  const onlineCount = 8;
  const busyCount = 4;

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <Header />
      
      {/* Main content area */}
      <div className="relative" style={{ height: 'calc(100vh - 73px)' }}>
        {/* Map filters overlay */}
        <MapFilters
          selectedTypes={selectedTypes}
          onTypesChange={setSelectedTypes}
          selectedMaterials={selectedMaterials}
          onMaterialsChange={setSelectedMaterials}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
        
        {/* World map */}
        <WorldMap
          selectedTypes={selectedTypes}
          selectedMaterials={selectedMaterials}
          searchQuery={searchQuery}
          onNodeClick={setSelectedNode}
          hoveredNode={hoveredNode}
          onNodeHover={setHoveredNode}
        />
        
        {/* Status bar */}
        <StatusBar 
          nodeCount={nodeCount}
          onlineCount={onlineCount}
          busyCount={busyCount}
        />
        
        {/* Node details modal */}
        <NodeDetails 
          node={selectedNode}
          onClose={() => setSelectedNode(null)}
        />
      </div>
      
      {/* Welcome overlay for first-time visitors */}
      {typeof window !== 'undefined' && !localStorage.getItem('rwc-visited') && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-2xl max-w-lg w-full p-8 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-sky-400 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Welcome to RealWorldClaw</h2>
            <p className="text-slate-300 mb-6 leading-relaxed">
              Discover manufacturing nodes around the world. Each glowing dot represents 
              a maker ready to bring your designs to life. Click on nodes to see their 
              capabilities, or use the search to find specific materials and equipment.
            </p>
            <button 
              onClick={() => {
                localStorage.setItem('rwc-visited', 'true');
                document.querySelector('[data-welcome]')?.remove();
              }}
              className="px-6 py-2 bg-sky-600 hover:bg-sky-500 text-white font-medium rounded-lg transition-colors"
              data-welcome
            >
              Explore the Map
            </button>
          </div>
        </div>
      )}
    </div>
  );
}