"use client";

import { useState, useMemo } from 'react';
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from 'react-simple-maps';
import { ManufacturingNode, MOCK_NODES, NODE_TYPE_INFO, STATUS_COLORS } from '@/lib/mockNodes';

// Simplified world topology URL (free from Natural Earth)
const geoUrl = "https://raw.githubusercontent.com/deldersveld/topojson/master/world-110m.json";

interface WorldMapProps {
  selectedTypes?: string[];
  selectedMaterials?: string[];
  searchQuery?: string;
  onNodeClick?: (node: ManufacturingNode) => void;
  hoveredNode?: ManufacturingNode | null;
  onNodeHover?: (node: ManufacturingNode | null) => void;
}

export function WorldMap({
  selectedTypes = [],
  selectedMaterials = [],
  searchQuery = '',
  onNodeClick,
  hoveredNode,
  onNodeHover
}: WorldMapProps) {
  const [zoom, setZoom] = useState(1);
  const [center, setCenter] = useState<[number, number]>([0, 0]);

  // Filter nodes based on selected criteria
  const filteredNodes = useMemo(() => {
    return MOCK_NODES.filter(node => {
      // Filter by type
      if (selectedTypes.length > 0 && !selectedTypes.includes(node.type)) {
        return false;
      }

      // Filter by materials
      if (selectedMaterials.length > 0 && 
          !selectedMaterials.some(material => 
            node.materials.some(nodeMaterial => 
              nodeMaterial.toLowerCase().includes(material.toLowerCase())
            )
          )) {
        return false;
      }

      // Filter by search query
      if (searchQuery && !node.materials.some(material => 
        material.toLowerCase().includes(searchQuery.toLowerCase())
      ) && !NODE_TYPE_INFO[node.type].name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      return true;
    });
  }, [selectedTypes, selectedMaterials, searchQuery]);

  const handleZoomIn = () => {
    if (zoom < 8) setZoom(zoom * 1.5);
  };

  const handleZoomOut = () => {
    if (zoom > 1) setZoom(zoom / 1.5);
  };

  const handleReset = () => {
    setZoom(1);
    setCenter([0, 0]);
  };

  const getNodeSize = (node: ManufacturingNode) => {
    // Base size on build volume (rough calculation)
    const volume = node.build_volume ? 
      node.build_volume.x * node.build_volume.y * node.build_volume.z : 100000;
    const baseSize = Math.max(8, Math.min(20, Math.log(volume) * 2));
    
    // Scale with zoom
    return Math.max(4, baseSize / Math.sqrt(zoom));
  };

  const getNodeOpacity = (node: ManufacturingNode) => {
    if (hoveredNode && hoveredNode.id !== node.id) {
      return 0.3;
    }
    return node.status === 'offline' ? 0.6 : 0.9;
  };

  return (
    <div className="relative w-full h-full bg-slate-900 overflow-hidden">
      {/* Map Controls */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        <button
          onClick={handleZoomIn}
          className="w-10 h-10 bg-slate-800/80 backdrop-blur-sm rounded-lg border border-slate-700 hover:bg-slate-700/80 transition-colors flex items-center justify-center text-white text-lg font-bold"
        >
          +
        </button>
        <button
          onClick={handleZoomOut}
          className="w-10 h-10 bg-slate-800/80 backdrop-blur-sm rounded-lg border border-slate-700 hover:bg-slate-700/80 transition-colors flex items-center justify-center text-white text-lg font-bold"
        >
          −
        </button>
        <button
          onClick={handleReset}
          className="w-10 h-10 bg-slate-800/80 backdrop-blur-sm rounded-lg border border-slate-700 hover:bg-slate-700/80 transition-colors flex items-center justify-center text-white text-sm"
        >
          ⌂
        </button>
      </div>

      {/* Node count indicator */}
      <div className="absolute top-4 left-4 z-10 bg-slate-800/80 backdrop-blur-sm rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300">
        {filteredNodes.length} manufacturing nodes
      </div>

      <ComposableMap
        width={1200}
        height={600}
        projectionConfig={{
          scale: 150,
        }}
        style={{ width: "100%", height: "100%" }}
      >
        <ZoomableGroup
          zoom={zoom}
          center={center}
          onMoveEnd={({ coordinates, zoom: newZoom }) => {
            setCenter(coordinates);
            setZoom(newZoom);
          }}
        >
          {/* World geography */}
          <Geographies geography={geoUrl}>
            {({ geographies }) =>
              geographies.map((geo) => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill="#1e293b" // slate-800
                  stroke="#334155" // slate-700
                  strokeWidth={0.5}
                  style={{
                    default: { outline: "none" },
                    hover: { outline: "none", fill: "#334155" },
                    pressed: { outline: "none" },
                  }}
                />
              ))
            }
          </Geographies>

          {/* Manufacturing nodes */}
          {filteredNodes.map((node) => (
            <Marker 
              key={node.id} 
              coordinates={[node.lng, node.lat]}
            >
              <g
                onClick={() => onNodeClick?.(node)}
                onMouseEnter={() => onNodeHover?.(node)}
                onMouseLeave={() => onNodeHover?.(null)}
                style={{ cursor: "pointer" }}
              >
                {/* Outer glow effect */}
                <circle
                  r={getNodeSize(node) + 3}
                  fill={STATUS_COLORS[node.status]}
                  fillOpacity={0.2}
                  className="animate-pulse"
                />
                
                {/* Main node */}
                <circle
                  r={getNodeSize(node)}
                  fill={STATUS_COLORS[node.status]}
                  fillOpacity={getNodeOpacity(node)}
                  stroke={NODE_TYPE_INFO[node.type].color}
                  strokeWidth={2}
                  className={`transition-all duration-200 ${
                    hoveredNode?.id === node.id ? 'drop-shadow-lg' : ''
                  }`}
                />
                
                {/* Node type icon - simplified for small sizes */}
                {getNodeSize(node) > 8 && (
                  <text
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={Math.max(8, getNodeSize(node) * 0.7)}
                    fill="white"
                    style={{ pointerEvents: "none" }}
                  >
                    {NODE_TYPE_INFO[node.type].icon}
                  </text>
                )}
              </g>
            </Marker>
          ))}
        </ZoomableGroup>
      </ComposableMap>

      {/* Node hover tooltip */}
      {hoveredNode && (
        <div className="absolute bottom-4 left-4 z-20 bg-slate-800/95 backdrop-blur-sm rounded-lg border border-slate-700 p-4 max-w-sm">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">{NODE_TYPE_INFO[hoveredNode.type].icon}</span>
            <div>
              <div className="text-sm font-semibold text-white">
                {NODE_TYPE_INFO[hoveredNode.type].name}
              </div>
              <div className="text-xs text-slate-400">
                Status: <span 
                  className="font-medium"
                  style={{ color: STATUS_COLORS[hoveredNode.status] }}
                >
                  {hoveredNode.status}
                </span>
              </div>
            </div>
          </div>
          
          <div className="text-xs text-slate-300 mb-2">
            <div>Materials: {hoveredNode.materials.join(', ')}</div>
            {hoveredNode.build_volume && (
              <div>
                Build Volume: {hoveredNode.build_volume.x}×{hoveredNode.build_volume.y}×{hoveredNode.build_volume.z}{hoveredNode.build_volume.units}
              </div>
            )}
          </div>
          
          {hoveredNode.capabilities && (
            <div className="text-xs text-slate-400">
              Capabilities: {hoveredNode.capabilities.join(', ')}
            </div>
          )}
        </div>
      )}
    </div>
  );
}