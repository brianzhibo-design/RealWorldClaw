"use client";

import { useState, useEffect } from "react";
import { API_BASE, apiFetch } from "@/lib/api-client";
import { EmptyState } from "@/components/EmptyState";

interface Component {
  id: string;
  name: string;
  description: string;
  category: string;
  author: string;
  downloads: number;
  rating: number;
  created_at: string;
  file_url?: string;
  image_url?: string;
}

const COMPONENT_CATEGORIES = [
  { 
    id: '3d-models',
    name: '3D Models',
    icon: '🔧',
    description: 'Ready-to-print 3D models and parts'
  },
  {
    id: 'firmware', 
    name: 'Firmware',
    icon: '💾',
    description: 'Device firmware and control software'
  },
  {
    id: 'hardware-designs',
    name: 'Hardware Designs', 
    icon: '⚡',
    description: 'PCB layouts and electronic schematics'
  }
];

export default function ComponentsPage() {
  useEffect(() => {
    document.title = "Module Repository — RealWorldClaw";
  }, []);

  const [components, setComponents] = useState<Component[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchComponents();
  }, []);

  const fetchComponents = async (query?: string) => {
    try {
      const endpoint = query ? `/components/search?q=${encodeURIComponent(query)}` : '/components';
      const data = await apiFetch<Component[] | { components: Component[] }>(endpoint);
      setComponents(Array.isArray(data) ? data : (data as { components: Component[] }).components || []);
      setError(null);
    } catch (err) {
      // API unavailable - fallback to empty state without surfacing an error
      setComponents([]);
      setError(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setLoading(true);
      fetchComponents(searchQuery.trim());
    } else {
      setLoading(true);
      fetchComponents();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white">
        <header className="border-b border-slate-800">
          <div className="max-w-7xl mx-auto px-6 py-8">
            <h1 className="text-4xl font-bold text-white mb-2">Component Library</h1>
            <p className="text-lg text-slate-400">Browse and download 3D models, firmware, and hardware designs shared by the community</p>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600 mx-auto mb-4"></div>
              <p className="text-slate-400">Loading components...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Components empty state handled in main render section

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <h1 className="text-4xl font-bold text-white mb-2">Component Library</h1>
          <p className="text-lg text-slate-400">Browse and download 3D models, firmware, and hardware designs shared by the community</p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Search Box */}
        <div className="mb-12">
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search components..."
                className="w-full px-6 py-4 bg-slate-900 border border-slate-800 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-600 focus:border-transparent pr-12"
              />
              <button
                type="submit"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-sky-400 transition-colors"
              >
                🔍
              </button>
            </div>
          </form>
        </div>

        {/* Empty state */}
        {!loading && components.length === 0 ? (
          <EmptyState
            icon="🛠️"
            title="No components available"
            description="Browse and download 3D models, firmware, and hardware designs shared by the community"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {components.map((component) => (
            <div key={component.id} className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 hover:border-slate-700 transition-colors">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">{component.name}</h3>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-300">
                  {component.category}
                </span>
              </div>
              
              <p className="text-sm text-slate-300 mb-4 leading-relaxed">
                {component.description}
              </p>
              
              <div className="flex items-center justify-between text-sm text-slate-400 mb-4">
                <span>by {component.author}</span>
                <div className="flex items-center gap-3">
                  <span>⭐ {component.rating.toFixed(1)}</span>
                  <span>📥 {component.downloads}</span>
                </div>
              </div>
              
              <button className="w-full py-2 px-4 bg-sky-600 hover:bg-sky-500 text-white rounded-lg font-medium transition-colors">
                Download
              </button>
            </div>
          ))}
          </div>
        )}
      </div>
    </div>
  );
}