"use client";

import { useState, useMemo, useRef, useEffect } from 'react';
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from 'react-simple-maps';
import { ManufacturingNode, NODE_TYPE_INFO, STATUS_COLORS } from '@/lib/nodes';

const geoUrl = '/world-110m.json';

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
  onNodeHover,
}: WorldMapProps) {
  const [zoom, setZoom] = useState(1);
  const [center, setCenter] = useState<[number, number]>([0, 20]);
  const animatingRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (animatingRef.current) cancelAnimationFrame(animatingRef.current);
    };
  }, []);

  const filteredNodes = useMemo(() => {
    return nodes.filter((node) => {
      if (selectedTypes.length > 0 && !selectedTypes.includes(node.node_type)) return false;
      if (selectedMaterials.length > 0 && !selectedMaterials.some((m) => node.materials.includes(m.toLowerCase()))) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchMaterial = node.materials.some((m) => m.toLowerCase().includes(q));
        const matchName = node.name.toLowerCase().includes(q);
        const matchType = (NODE_TYPE_INFO[node.node_type]?.name || '').toLowerCase().includes(q);
        if (!matchMaterial && !matchName && !matchType) return false;
      }
      return true;
    });
  }, [nodes, selectedTypes, selectedMaterials, searchQuery]);

  const getNodeSize = (node: ManufacturingNode) => {
    const vol = (node.build_volume_x || 200) * (node.build_volume_y || 200) * (node.build_volume_z || 200);
    const base = Math.max(7, Math.min(20, Math.log(vol) * 2));
    return Math.max(4, base / Math.sqrt(zoom));
  };

  const smoothMoveTo = (targetCenter: [number, number], targetZoom: number) => {
    if (animatingRef.current) cancelAnimationFrame(animatingRef.current);

    const startCenter = center;
    const startZoom = zoom;
    const duration = 550;
    const start = performance.now();

    const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(1, elapsed / duration);
      const eased = easeInOutCubic(progress);

      setCenter([
        startCenter[0] + (targetCenter[0] - startCenter[0]) * eased,
        startCenter[1] + (targetCenter[1] - startCenter[1]) * eased,
      ]);
      setZoom(startZoom + (targetZoom - startZoom) * eased);

      if (progress < 1) {
        animatingRef.current = requestAnimationFrame(tick);
      }
    };

    animatingRef.current = requestAnimationFrame(tick);
  };

  return (
    <div className="relative w-full h-full bg-[#131921] overflow-hidden">
      <div className="absolute inset-0 opacity-80 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(16,185,129,0.14),rgba(19,25,33,0.96)_52%,rgba(8,13,20,1)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(16,185,129,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(34,211,238,0.06)_1px,transparent_1px)] bg-[size:64px_64px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.08),transparent_62%)]" />
      </div>

      <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
        {[
          { label: '+', action: () => zoom < 8 && smoothMoveTo(center, Math.min(8, zoom * 1.4)), ariaLabel: 'Zoom in' },
          { label: '−', action: () => zoom > 1 && smoothMoveTo(center, Math.max(1, zoom / 1.4)), ariaLabel: 'Zoom out' },
          { label: '⌂', action: () => smoothMoveTo([0, 20], 1), ariaLabel: 'Reset view' },
        ].map(({ label, action, ariaLabel }) => (
          <button
            key={label}
            onClick={action}
            aria-label={ariaLabel}
            className="w-10 h-10 rounded-lg border border-emerald-400/30 bg-[#101821]/90 backdrop-blur-md text-emerald-200 text-lg font-bold flex items-center justify-center hover:bg-[#15222f] hover:border-emerald-300/50 transition-all"
          >
            {label}
          </button>
        ))}
      </div>

      <ComposableMap width={1200} height={600} projectionConfig={{ scale: 150 }} style={{ width: '100%', height: '100%' }}>
        <defs>
          <linearGradient id="landGradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#0f2a2d" />
            <stop offset="45%" stopColor="#174a45" />
            <stop offset="100%" stopColor="#0d3a4f" />
          </linearGradient>
          <radialGradient id="landGlow" cx="50%" cy="50%" r="70%">
            <stop offset="0%" stopColor="rgba(16,185,129,0.16)" />
            <stop offset="100%" stopColor="rgba(16,185,129,0)" />
          </radialGradient>
          <filter id="mapGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <ZoomableGroup
          zoom={zoom}
          center={center}
          onMoveEnd={({ coordinates, zoom: z }) => {
            setCenter(coordinates as [number, number]);
            setZoom(z);
          }}
        >
          <Geographies geography={geoUrl}>
            {({ geographies }) =>
              geographies.map((geo, index) => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill={index % 3 === 0 ? '#13343a' : 'url(#landGradient)'}
                  stroke="#1d5b63"
                  strokeWidth={0.48}
                  filter="url(#mapGlow)"
                  style={{
                    default: { outline: 'none' },
                    hover: { outline: 'none', fill: '#1b4f53' },
                    pressed: { outline: 'none' },
                  }}
                />
              ))
            }
          </Geographies>
          <rect x={-600} y={-320} width={1200} height={620} fill="url(#landGlow)" pointerEvents="none" />

          {filteredNodes.map((node) => {
            const isHovered = hoveredNode?.id === node.id;
            const isOnline = node.status === 'online' || node.status === 'idle';
            const isOffline = node.status === 'offline';
            const baseSize = getNodeSize(node);
            const scale = isHovered ? 1.28 : 1;
            const dotColor = STATUS_COLORS[node.status] || '#64748b';

            return (
              <Marker key={node.id} coordinates={[node.fuzzy_longitude, node.fuzzy_latitude]}>
                <g
                  onClick={() => {
                    smoothMoveTo([node.fuzzy_longitude, node.fuzzy_latitude], Math.max(2.4, zoom));
                    onNodeClick?.(node);
                  }}
                  onMouseEnter={() => onNodeHover?.(node)}
                  onMouseLeave={() => onNodeHover?.(null)}
                  style={{ cursor: 'pointer', transformOrigin: 'center' }}
                  className="transition-transform duration-300"
                  transform={`scale(${scale})`}
                >
                  <circle r={baseSize + 7} fill={dotColor} fillOpacity={isOffline ? 0.08 : 0.16}>
                    {!isOffline && (
                      <animate attributeName="r" values={`${baseSize + 4};${baseSize + 12};${baseSize + 4}`} dur="2.4s" repeatCount="indefinite" />
                    )}
                    {!isOffline && <animate attributeName="fill-opacity" values="0.24;0.05;0.24" dur="2.4s" repeatCount="indefinite" />}
                  </circle>

                  <circle
                    r={baseSize + 3}
                    fill={isOnline ? '#10b981' : dotColor}
                    fillOpacity={isOffline ? 0.2 : 0.3}
                    stroke={isOnline ? '#6ee7b7' : '#64748b'}
                    strokeWidth={1.2}
                  >
                    {isOnline && <animate attributeName="fill-opacity" values="0.28;0.5;0.28" dur="1.6s" repeatCount="indefinite" />}
                  </circle>

                  <circle
                    r={baseSize}
                    fill={isOnline ? '#10b981' : dotColor}
                    fillOpacity={isOffline ? 0.45 : hoveredNode && hoveredNode.id !== node.id ? 0.45 : 0.95}
                    stroke={isOnline ? '#a7f3d0' : NODE_TYPE_INFO[node.node_type]?.color || '#22d3ee'}
                    strokeWidth={2}
                  />

                  {baseSize > 8 && (
                    <text
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize={Math.max(8, baseSize * 0.66)}
                      fill="white"
                      style={{ pointerEvents: 'none', textShadow: '0 0 8px rgba(0,0,0,0.5)' }}
                    >
                      {NODE_TYPE_INFO[node.node_type]?.icon || '⚙️'}
                    </text>
                  )}
                </g>
              </Marker>
            );
          })}
        </ZoomableGroup>
      </ComposableMap>

      {hoveredNode && (
        <div className="absolute bottom-4 left-4 z-20 max-w-sm rounded-xl border border-emerald-400/30 bg-[#0f1720]/90 backdrop-blur-md p-4 shadow-[0_0_30px_rgba(16,185,129,0.2)] animate-[fadeIn_220ms_ease-out]">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">{NODE_TYPE_INFO[hoveredNode.node_type]?.icon || '⚙️'}</span>
            <div>
              <div className="text-sm font-semibold text-white">{hoveredNode.name}</div>
              <div className="text-xs text-slate-300">
                {NODE_TYPE_INFO[hoveredNode.node_type]?.name || hoveredNode.node_type} ·{' '}
                <span style={{ color: STATUS_COLORS[hoveredNode.status] || '#94a3b8' }}>{hoveredNode.status}</span>
              </div>
            </div>
          </div>
          <div className="text-xs text-slate-300 space-y-1">
            {hoveredNode.materials.length > 0 && <div>Materials: {hoveredNode.materials.join(', ').toUpperCase()}</div>}
            {hoveredNode.build_volume_x && (
              <div>
                Build: {hoveredNode.build_volume_x}×{hoveredNode.build_volume_y}×{hoveredNode.build_volume_z}mm
              </div>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
