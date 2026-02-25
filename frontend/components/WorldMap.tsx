"use client";

import { useState, useMemo, useRef } from 'react';
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from 'react-simple-maps';
import { geoContains } from 'd3-geo';
import { ManufacturingNode, MapRegionSummary, NODE_TYPE_INFO, STATUS_COLORS } from '@/lib/nodes';

const geoUrl = '/world-110m.json';

interface WorldMapProps {
  nodes: ManufacturingNode[];
  regions?: MapRegionSummary[];
  selectedTypes?: string[];
  selectedMaterials?: string[];
  searchQuery?: string;
  onNodeClick?: (node: ManufacturingNode) => void;
  hoveredNode?: ManufacturingNode | null;
  onNodeHover?: (node: ManufacturingNode | null) => void;
}

interface CountrySummary {
  key: string;
  label: string;
  online: number;
  total: number;
  center: [number, number];
}

function normalizeCountryValue(value: string): string {
  return value.trim().toLowerCase();
}

function getNodeCountryKeys(node: ManufacturingNode): string[] {
  const keys: string[] = [];

  if (typeof node.country === 'string' && node.country.trim()) {
    keys.push(normalizeCountryValue(node.country));
  }

  if (typeof node.country_code === 'string' && node.country_code.trim()) {
    keys.push(normalizeCountryValue(node.country_code));
  }

  return keys;
}

function getGeoCountryKeys(geo: any): string[] {
  const props = geo?.properties || {};
  const values = [props.NAME, props.NAME_LONG, props.ADMIN, props.ISO_A2, props.ISO_A3];
  return values
    .filter((v) => typeof v === 'string' && v.trim())
    .map((v) => normalizeCountryValue(v));
}

export function WorldMap({
  nodes,
  regions = [],
  selectedTypes = [],
  selectedMaterials = [],
  searchQuery = '',
  onNodeClick,
  hoveredNode,
  onNodeHover,
}: WorldMapProps) {
  const [zoom, setZoom] = useState(1);
  const [center, setCenter] = useState<[number, number]>([0, 20]);
  const [selectedNode, setSelectedNode] = useState<ManufacturingNode | null>(null);
  const geoHasNodeCache = useRef(new Map<string, boolean>());

  const level = zoom < 2 ? 1 : zoom < 5 ? 2 : 3;

  // Clear geo cache when nodes change
  useMemo(() => { geoHasNodeCache.current.clear(); }, [nodes]);

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

  const countrySummaries = useMemo(() => {
    if (regions.length > 0) {
      const map = new Map<string, CountrySummary>();
      regions.forEach((region) => {
        const keySource = region.country_code || region.country;
        if (!keySource) return;
        const key = normalizeCountryValue(keySource);

        const online = Number(region.online_count ?? 0);
        const total = Number(region.total_count ?? 0);
        const lat = Number(region.latitude ?? 0);
        const lng = Number(region.longitude ?? 0);
        const hasCoord = Number.isFinite(lat) && Number.isFinite(lng) && !(lat === 0 && lng === 0);

        map.set(key, {
          key,
          label: region.country_code || region.country || key.toUpperCase(),
          online,
          total,
          center: hasCoord ? [lng, lat] : [0, 0],
        });
      });
      return map;
    }

    const map = new Map<
      string,
      {
        label: string;
        online: number;
        total: number;
        sumLat: number;
        sumLng: number;
        count: number;
      }
    >();

    filteredNodes.forEach((node) => {
      const key = normalizeCountryValue(node.country_code || node.country || '');
      if (!key) return;
      const current = map.get(key) || {
        label: node.country_code || node.country || key.toUpperCase(),
        online: 0,
        total: 0,
        sumLat: 0,
        sumLng: 0,
        count: 0,
      };

      current.total += 1;
      if (node.status === 'online' || node.status === 'idle') current.online += 1;
      current.sumLat += node.fuzzy_latitude;
      current.sumLng += node.fuzzy_longitude;
      current.count += 1;

      map.set(key, current);
    });

    const result = new Map<string, CountrySummary>();
    map.forEach((value, key) => {
      result.set(key, {
        key,
        label: value.label,
        online: value.online,
        total: value.total,
        center: [value.sumLng / value.count, value.sumLat / value.count],
      });
    });
    return result;
  }, [regions, filteredNodes]);

  const countryKeysWithNodes = useMemo(() => {
    const set = new Set<string>();
    countrySummaries.forEach((summary, key) => {
      if (summary.total > 0) set.add(key);
    });
    filteredNodes.forEach((node) => {
      getNodeCountryKeys(node).forEach((key) => set.add(key));
    });
    return set;
  }, [countrySummaries, filteredNodes]);

  const getNodeSize = () => {
    if (level === 2) return 4;
    return 5.5;
  };

  const updateView = (targetCenter: [number, number], targetZoom: number) => {
    setCenter(targetCenter);
    setZoom(targetZoom);
  };

  return (
    <div
      className="relative w-full h-full bg-[#131921] overflow-hidden"
      onClick={() => {
        setSelectedNode(null);
        onNodeHover?.(null);
      }}
    >
      <div className="absolute inset-0 opacity-80 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(16,185,129,0.14),rgba(19,25,33,0.96)_52%,rgba(8,13,20,1)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(16,185,129,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(34,211,238,0.06)_1px,transparent_1px)] bg-[size:64px_64px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.08),transparent_62%)]" />
      </div>

      <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
        {[
          { label: '+', action: () => zoom < 8 && updateView(center, Math.min(8, zoom * 1.4)), ariaLabel: 'Zoom in' },
          { label: '−', action: () => zoom > 1 && updateView(center, Math.max(1, zoom / 1.4)), ariaLabel: 'Zoom out' },
          { label: '⌂', action: () => updateView([0, 20], 1), ariaLabel: 'Reset view' },
        ].map(({ label, action, ariaLabel }) => (
          <button
            key={label}
            onClick={(e) => {
              e.stopPropagation();
              action();
            }}
            aria-label={ariaLabel}
            className="w-10 h-10 rounded-lg border border-emerald-400/30 bg-[#101821]/90 backdrop-blur-md text-emerald-200 text-lg font-bold flex items-center justify-center hover:bg-[#15222f] hover:border-emerald-300/50 transition-colors"
          >
            {label}
          </button>
        ))}
      </div>

      <ComposableMap width={1200} height={600} projectionConfig={{ scale: 150 }} style={{ width: '100%', height: '100%' }}>
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
              geographies.map((geo) => {
                const geoKeys = getGeoCountryKeys(geo);
                const countrySummary = geoKeys.map((k) => countrySummaries.get(k)).find(Boolean);
                // Use geoContains to check if any node falls within this country's polygon
                const hasNode = countrySummary?.total
                  ? true
                  : geoHasNodeCache.current.has(geo.rsmKey)
                    ? geoHasNodeCache.current.get(geo.rsmKey)!
                    : (() => {
                        const geoFeature = geo.type === 'Feature' ? geo : { type: 'Feature' as const, geometry: geo.geometry || geo, properties: {} };
                        const result = filteredNodes.some((node) =>
                          geoContains(geoFeature, [node.fuzzy_longitude, node.fuzzy_latitude])
                        );
                        geoHasNodeCache.current.set(geo.rsmKey, result);
                        return result;
                      })();

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={hasNode ? '#1a3a2a' : '#1e293b'}
                    stroke={hasNode ? '#10b981' : '#334155'}
                    strokeWidth={hasNode ? 0.8 : 0.4}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedNode(null);
                      onNodeHover?.(null);
                      if (level === 1) {
                        // Find center from nodes in this country
                        const geoF = geo.type === 'Feature' ? geo : { type: 'Feature' as const, geometry: geo.geometry || geo, properties: {} };
                        const nodesInGeo = filteredNodes.filter((n) =>
                          geoContains(geoF, [n.fuzzy_longitude, n.fuzzy_latitude])
                        );
                        if (nodesInGeo.length > 0) {
                          const avgLng = nodesInGeo.reduce((s, n) => s + n.fuzzy_longitude, 0) / nodesInGeo.length;
                          const avgLat = nodesInGeo.reduce((s, n) => s + n.fuzzy_latitude, 0) / nodesInGeo.length;
                          updateView([avgLng, avgLat], 3);
                        } else if (countrySummary) {
                          updateView(countrySummary.center, 3);
                        }
                      }
                    }}
                    style={{
                      default: { outline: 'none' },
                      hover: { outline: 'none', fill: hasNode ? '#1f4a35' : '#243244' },
                      pressed: { outline: 'none' },
                    }}
                  />
                );
              })
            }
          </Geographies>

          {level === 1 &&
            Array.from(countrySummaries.values())
              .filter((country) => country.total > 0)
              .map((country) => (
                <Marker key={`badge-${country.key}`} coordinates={country.center}>
                  <g style={{ pointerEvents: 'none' }}>
                    <rect x={-18} y={-11} rx={6} width={36} height={18} fill="rgba(15,23,32,0.9)" stroke="rgba(34,211,238,0.55)" strokeWidth={0.8} />
                    <text textAnchor="middle" y={2} fontSize={8.5} fill="#a5f3fc" fontWeight={700}>
                      {country.online}/{country.total}
                    </text>
                  </g>
                </Marker>
              ))}

          {level >= 2 &&
            filteredNodes.map((node) => {
              const isHovered = hoveredNode?.id === node.id || selectedNode?.id === node.id;
              const isOffline = node.status === 'offline';
              const baseSize = getNodeSize();
              const dotColor = STATUS_COLORS[node.status] || '#64748b';

              return (
                <Marker key={node.id} coordinates={[node.fuzzy_longitude, node.fuzzy_latitude]}>
                  <g
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedNode(node);
                      if (level === 2) {
                        updateView([node.fuzzy_longitude, node.fuzzy_latitude], Math.max(5, zoom));
                      }
                    }}
                    onMouseEnter={() => onNodeHover?.(node)}
                    onMouseLeave={() => onNodeHover?.(null)}
                    style={{ cursor: 'pointer' }}
                  >
                    <circle
                      r={baseSize}
                      fill={dotColor}
                      fillOpacity={isOffline ? 0.45 : hoveredNode && hoveredNode.id !== node.id ? 0.55 : 0.96}
                      stroke={isHovered ? '#a7f3d0' : '#d1d5db'}
                      strokeWidth={isHovered ? 1.5 : 0.75}
                    />
                  </g>
                </Marker>
              );
            })}
        </ZoomableGroup>
      </ComposableMap>

      {selectedNode && level >= 2 && (
        <div
          className="absolute bottom-4 left-4 z-20 w-[320px] max-w-[calc(100%-2rem)] rounded-xl border border-emerald-400/25 bg-[#0f1720]/92 p-4 shadow-lg transition-opacity duration-150"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">{NODE_TYPE_INFO[selectedNode.node_type]?.icon || '⚙️'}</span>
            <div>
              <div className="text-sm font-semibold text-white">{selectedNode.name}</div>
              <div className="text-xs text-slate-300">
                {NODE_TYPE_INFO[selectedNode.node_type]?.name || selectedNode.node_type} ·{' '}
                <span style={{ color: STATUS_COLORS[selectedNode.status] || '#94a3b8' }}>{selectedNode.status}</span>
              </div>
            </div>
          </div>

          <div className="text-xs text-slate-300 mb-3">
            Materials:{' '}
            {selectedNode.materials.length > 0
              ? selectedNode.materials
                  .slice(0, 3)
                  .map((m) => m.toUpperCase())
                  .join(', ')
              : '—'}
          </div>

          <button
            onClick={() => onNodeClick?.(selectedNode)}
            className="rounded-md border border-emerald-400/40 bg-emerald-500/15 px-3 py-1.5 text-xs font-medium text-emerald-200 hover:bg-emerald-500/25 transition-colors"
          >
            Details
          </button>
        </div>
      )}
    </div>
  );
}
