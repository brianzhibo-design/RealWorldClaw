"use client";

import { useState, useMemo } from 'react';
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from 'react-simple-maps';
import { ManufacturingNode, NODE_TYPE_INFO, STATUS_COLORS } from '@/lib/nodes';

const geoUrl = "/world-110m.json";

interface WorldMapProps {
  nodes: ManufacturingNode[];
  selectedTypes?: string[];
  selectedMaterials?: string[];
  searchQuery?: string;
  onNodeClick?: (node: ManufacturingNode) => void;
  hoveredNode?: ManufacturingNode | null;
  onNodeHover?: (node: ManufacturingNode | null) => void;
}

export function WorldMap({
  nodes,
  selectedTypes = [],
  selectedMaterials = [],
  searchQuery = '',
  onNodeClick,
  hoveredNode,
  onNodeHover
}: WorldMapProps) {
  const [zoom, setZoom] = useState(1);
  const [center, setCenter] = useState<[number, number]>([0, 20]);

  const filteredNodes = useMemo(() => {
    return nodes.filter(node => {
      if (selectedTypes.length > 0 && !selectedTypes.includes(node.node_type)) return false;
      if (selectedMaterials.length > 0 && 
          !selectedMaterials.some(m => node.materials.includes(m.toLowerCase()))) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchMaterial = node.materials.some(m => m.toLowerCase().includes(q));
        const matchName = node.name.toLowerCase().includes(q);
        const matchType = (NODE_TYPE_INFO[node.node_type]?.name || '').toLowerCase().includes(q);
        if (!matchMaterial && !matchName && !matchType) return false;
      }
      return true;
    });
  }, [nodes, selectedTypes, selectedMaterials, searchQuery]);

  const getNodeSize = (node: ManufacturingNode) => {
    const vol = (node.build_volume_x || 200) * (node.build_volume_y || 200) * (node.build_volume_z || 200);
    const base = Math.max(8, Math.min(20, Math.log(vol) * 2));
    return Math.max(4, base / Math.sqrt(zoom));
  };

  return (
    <div className="relative w-full h-full bg-slate-950 overflow-hidden">
      {/* Zoom controls */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        {[
          { label: '+', action: () => zoom < 8 && setZoom(z => z * 1.5), ariaLabel: 'Zoom in' },
          { label: '−', action: () => zoom > 1 && setZoom(z => z / 1.5), ariaLabel: 'Zoom out' },
          { label: '⌂', action: () => { setZoom(1); setCenter([0, 20]); }, ariaLabel: 'Reset view' },
        ].map(({ label, action, ariaLabel }) => (
          <button key={label} onClick={action} aria-label={ariaLabel}
            className="w-10 h-10 bg-slate-800/80 backdrop-blur-sm rounded-lg border border-slate-700 hover:bg-slate-700/80 transition-colors flex items-center justify-center text-white text-lg font-bold">
            {label}
          </button>
        ))}
      </div>

      <ComposableMap
        width={1200} height={600}
        projectionConfig={{ scale: 150 }}
        style={{ width: "100%", height: "100%" }}
      >
        <ZoomableGroup zoom={zoom} center={center}
          onMoveEnd={({ coordinates, zoom: z }) => { setCenter(coordinates); setZoom(z); }}>
          <Geographies geography={geoUrl}>
            {({ geographies }) => geographies.map(geo => (
              <Geography key={geo.rsmKey} geography={geo}
                fill="#1e293b" stroke="#334155" strokeWidth={0.5}
                style={{
                  default: { outline: "none" },
                  hover: { outline: "none", fill: "#334155" },
                  pressed: { outline: "none" },
                }}
              />
            ))}
          </Geographies>

          {filteredNodes.map(node => (
            <Marker key={node.id} coordinates={[node.fuzzy_longitude, node.fuzzy_latitude]}>
              <g onClick={() => onNodeClick?.(node)}
                 onMouseEnter={() => onNodeHover?.(node)}
                 onMouseLeave={() => onNodeHover?.(null)}
                 style={{ cursor: "pointer" }}>
                <circle r={getNodeSize(node) + 3}
                  fill={STATUS_COLORS[node.status] || '#64748b'} fillOpacity={0.2}
                  className="animate-pulse" />
                <circle r={getNodeSize(node)}
                  fill={STATUS_COLORS[node.status] || '#64748b'}
                  fillOpacity={hoveredNode && hoveredNode.id !== node.id ? 0.3 : 0.9}
                  stroke={NODE_TYPE_INFO[node.node_type]?.color || '#38bdf8'}
                  strokeWidth={2} />
                {getNodeSize(node) > 8 && (
                  <text textAnchor="middle" dominantBaseline="middle"
                    fontSize={Math.max(8, getNodeSize(node) * 0.7)} fill="white"
                    style={{ pointerEvents: "none" }}>
                    {NODE_TYPE_INFO[node.node_type]?.icon || '⚙️'}
                  </text>
                )}
              </g>
            </Marker>
          ))}
        </ZoomableGroup>
      </ComposableMap>

      {/* Hover tooltip */}
      {hoveredNode && (
        <div className="absolute bottom-4 left-4 z-20 bg-slate-800/95 backdrop-blur-sm rounded-lg border border-slate-700 p-4 max-w-sm">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">{NODE_TYPE_INFO[hoveredNode.node_type]?.icon || '⚙️'}</span>
            <div>
              <div className="text-sm font-semibold text-white">{hoveredNode.name}</div>
              <div className="text-xs text-slate-400">
                {NODE_TYPE_INFO[hoveredNode.node_type]?.name || hoveredNode.node_type} · 
                <span style={{ color: STATUS_COLORS[hoveredNode.status] }}> {hoveredNode.status}</span>
              </div>
            </div>
          </div>
          <div className="text-xs text-slate-300">
            {hoveredNode.materials.length > 0 && <div>Materials: {hoveredNode.materials.join(', ').toUpperCase()}</div>}
            {hoveredNode.build_volume_x && (
              <div>Build: {hoveredNode.build_volume_x}×{hoveredNode.build_volume_y}×{hoveredNode.build_volume_z}mm</div>
            )}
          </div>
          {hoveredNode.capabilities.length > 0 && (
            <div className="text-xs text-slate-400 mt-1">
              {hoveredNode.capabilities.join(', ')}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
