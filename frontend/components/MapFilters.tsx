"use client";

import { NODE_TYPE_INFO } from "@/lib/nodes";

interface MapFiltersProps {
  selectedTypes: string[];
  onTypesChange: (types: string[]) => void;
  selectedMaterials: string[];
  onMaterialsChange: (materials: string[]) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

const MATERIALS = ["pla", "abs", "petg", "tpu", "nylon", "resin"];

export function MapFilters({
  selectedTypes, onTypesChange,
  selectedMaterials, onMaterialsChange,
  searchQuery, onSearchChange,
}: MapFiltersProps) {
  const toggleType = (type: string) => {
    onTypesChange(
      selectedTypes.includes(type)
        ? selectedTypes.filter(t => t !== type)
        : [...selectedTypes, type]
    );
  };

  const toggleMaterial = (material: string) => {
    onMaterialsChange(
      selectedMaterials.includes(material)
        ? selectedMaterials.filter(m => m !== material)
        : [...selectedMaterials, material]
    );
  };

  return (
    <div className="bg-slate-800/90 backdrop-blur-sm rounded-lg border border-slate-700 p-4 w-64 space-y-4">
      <input
        type="text" placeholder="Search nodes..."
        value={searchQuery} onChange={e => onSearchChange(e.target.value)}
        className="w-full px-3 py-1.5 bg-slate-900 border border-slate-600 rounded text-sm text-white placeholder:text-slate-500 focus:border-sky-500 focus:outline-none"
      />

      <div>
        <div className="text-xs text-slate-400 mb-2 font-medium uppercase tracking-wider">Equipment</div>
        <div className="space-y-1">
          {Object.entries(NODE_TYPE_INFO).map(([key, info]) => (
            <button key={key} onClick={() => toggleType(key)}
              className={`w-full flex items-center gap-2 px-2 py-1 rounded text-xs text-left transition-colors ${
                selectedTypes.includes(key)
                  ? 'bg-sky-900/50 text-sky-300 border border-sky-700'
                  : 'text-slate-300 hover:bg-slate-700/50'
              }`}>
              <span>{info.icon}</span>
              <span>{info.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="text-xs text-slate-400 mb-2 font-medium uppercase tracking-wider">Materials</div>
        <div className="flex flex-wrap gap-1">
          {MATERIALS.map(m => (
            <button key={m} onClick={() => toggleMaterial(m)}
              className={`px-2 py-0.5 rounded text-xs transition-colors ${
                selectedMaterials.includes(m)
                  ? 'bg-sky-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}>
              {m.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
