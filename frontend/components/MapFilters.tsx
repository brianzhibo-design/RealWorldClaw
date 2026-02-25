"use client";

import { NODE_TYPE_INFO } from '@/lib/nodes';

interface MapFiltersProps {
  selectedTypes: string[];
  onTypesChange: (types: string[]) => void;
  selectedMaterials: string[];
  onMaterialsChange: (materials: string[]) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

const MATERIALS = ['pla', 'abs', 'petg', 'tpu', 'nylon', 'resin'];

export function MapFilters({
  selectedTypes,
  onTypesChange,
  selectedMaterials,
  onMaterialsChange,
  searchQuery,
  onSearchChange,
}: MapFiltersProps) {
  const toggleType = (type: string) => {
    onTypesChange(selectedTypes.includes(type) ? selectedTypes.filter((t) => t !== type) : [...selectedTypes, type]);
  };

  const toggleMaterial = (material: string) => {
    onMaterialsChange(
      selectedMaterials.includes(material) ? selectedMaterials.filter((m) => m !== material) : [...selectedMaterials, material]
    );
  };

  return (
    <div className="w-[min(18rem,calc(100vw-1rem))] rounded-xl border border-emerald-400/25 bg-[#0f1720]/88 backdrop-blur-md p-4 space-y-4 shadow-[0_0_22px_rgba(16,185,129,0.18)]">
      <div>
        <input
          type="text"
          placeholder="Search nodes, materials, machine type..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full rounded-lg border border-slate-600/80 bg-[#091018] px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
        />
      </div>

      <div>
        <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-300/80">Equipment</div>
        <div className="grid grid-cols-1 gap-1.5">
          {Object.entries(NODE_TYPE_INFO).map(([key, info]) => {
            const active = selectedTypes.includes(key);
            return (
              <button
                key={key}
                onClick={() => toggleType(key)}
                aria-label={`Toggle ${info.name} filter`}
                className={`w-full rounded-md px-2.5 py-1.5 text-xs text-left border transition-all duration-200 flex items-center gap-2 ${
                  active
                    ? 'bg-emerald-500/15 border-emerald-400/45 text-emerald-200'
                    : 'bg-slate-900/30 border-transparent text-slate-300 hover:bg-slate-800/70 hover:border-slate-600/60'
                }`}
              >
                <span>{info.icon}</span>
                <span className="truncate">{info.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-300/80">Materials</div>
        <div className="flex flex-wrap gap-1.5">
          {MATERIALS.map((m) => {
            const active = selectedMaterials.includes(m);
            return (
              <button
                key={m}
                onClick={() => toggleMaterial(m)}
                aria-label={`Toggle ${m.toUpperCase()} material filter`}
                className={`px-2 py-1 rounded-md text-[11px] font-medium transition-all border ${
                  active
                    ? 'bg-cyan-500/20 border-cyan-300/50 text-cyan-100 shadow-[0_0_12px_rgba(34,211,238,0.22)]'
                    : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:border-slate-500'
                }`}
              >
                {m.toUpperCase()}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
