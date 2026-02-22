"use client";

import { useState } from 'react';
import { NODE_TYPE_INFO, MOCK_NODES } from '@/lib/mockNodes';

interface MapFiltersProps {
  selectedTypes: string[];
  onTypesChange: (types: string[]) => void;
  selectedMaterials: string[];
  onMaterialsChange: (materials: string[]) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function MapFilters({
  selectedTypes,
  onTypesChange,
  selectedMaterials,
  onMaterialsChange,
  searchQuery,
  onSearchChange
}: MapFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Get all unique materials from mock nodes
  const allMaterials = Array.from(
    new Set(MOCK_NODES.flatMap(node => node.materials))
  ).sort();

  const handleTypeToggle = (type: string) => {
    if (selectedTypes.includes(type)) {
      onTypesChange(selectedTypes.filter(t => t !== type));
    } else {
      onTypesChange([...selectedTypes, type]);
    }
  };

  const handleMaterialToggle = (material: string) => {
    if (selectedMaterials.includes(material)) {
      onMaterialsChange(selectedMaterials.filter(m => m !== material));
    } else {
      onMaterialsChange([...selectedMaterials, material]);
    }
  };

  const clearAllFilters = () => {
    onTypesChange([]);
    onMaterialsChange([]);
    onSearchChange('');
  };

  const hasActiveFilters = selectedTypes.length > 0 || selectedMaterials.length > 0 || searchQuery.length > 0;

  return (
    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10">
      {/* Collapsed search bar */}
      <div className="bg-slate-800/80 backdrop-blur-sm rounded-lg border border-slate-700 shadow-lg">
        <div className="flex items-center gap-2 p-3">
          <div className="flex items-center gap-2 flex-1">
            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search materials or equipment types..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="bg-transparent text-sm text-white placeholder-slate-400 outline-none flex-1 min-w-[250px]"
            />
          </div>
          
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <span className="text-xs bg-sky-500/20 text-sky-400 px-2 py-1 rounded">
                {selectedTypes.length + selectedMaterials.length} filters
              </span>
            )}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-slate-400 hover:text-white transition-colors"
              title="Show filters"
            >
              <svg className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
                   fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Expanded filters panel */}
        {isExpanded && (
          <div className="border-t border-slate-700 p-4 max-h-96 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Equipment Types */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-white">Equipment Types</h3>
                  {selectedTypes.length > 0 && (
                    <button
                      onClick={() => onTypesChange([])}
                      className="text-xs text-sky-400 hover:text-sky-300"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <div className="space-y-2">
                  {Object.entries(NODE_TYPE_INFO).map(([type, info]) => (
                    <label key={type} className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={selectedTypes.includes(type)}
                        onChange={() => handleTypeToggle(type)}
                        className="rounded border-slate-600 bg-slate-700 text-sky-500 focus:ring-sky-500 focus:ring-offset-0"
                      />
                      <span className="text-lg">{info.icon}</span>
                      <span className="text-sm text-slate-300 group-hover:text-white">
                        {info.name}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Materials */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-white">Materials</h3>
                  {selectedMaterials.length > 0 && (
                    <button
                      onClick={() => onMaterialsChange([])}
                      className="text-xs text-sky-400 hover:text-sky-300"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                  {allMaterials.map((material) => (
                    <label key={material} className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={selectedMaterials.includes(material)}
                        onChange={() => handleMaterialToggle(material)}
                        className="rounded border-slate-600 bg-slate-700 text-sky-500 focus:ring-sky-500 focus:ring-offset-0"
                      />
                      <span className="text-sm text-slate-300 group-hover:text-white truncate">
                        {material}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-700">
              <div className="text-xs text-slate-400">
                Showing {MOCK_NODES.length} nodes total
              </div>
              {hasActiveFilters && (
                <button
                  onClick={clearAllFilters}
                  className="text-sm text-red-400 hover:text-red-300 transition-colors"
                >
                  Clear all filters
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}