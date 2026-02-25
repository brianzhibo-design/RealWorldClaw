/**
 * Manufacturing node types and API client.
 * All data comes from the real API.
 */

import { API_BASE } from "@/lib/api-client";

export interface ManufacturingNode {
  id: string;
  name: string;
  node_type: string;
  fuzzy_latitude: number;
  fuzzy_longitude: number;
  country?: string;
  country_code?: string;
  capabilities: string[];
  materials: string[];
  build_volume_x: number | null;
  build_volume_y: number | null;
  build_volume_z: number | null;
  description: string | null;
  status: string;
  last_heartbeat: string | null;
  created_at: string;
}

export interface MapRegionSummary {
  country?: string;
  country_code?: string;
  region?: string;
  latitude?: number;
  longitude?: number;
  online_count?: number;
  total_count?: number;
}

// Display helpers
export const NODE_TYPE_INFO: Record<string, { name: string; icon: string; color: string }> = {
  '3d_printer': { name: '3D Printer', icon: '🖨️', color: '#38bdf8' },
  'cnc_mill': { name: 'CNC Mill', icon: '⚙️', color: '#a78bfa' },
  'laser_cutter': { name: 'Laser Cutter', icon: '✂️', color: '#f97316' },
  'drill_press': { name: 'Drill Press', icon: '🔩', color: '#22c55e' },
};

export const STATUS_COLORS: Record<string, string> = {
  online: '#22c55e',
  idle: '#22c55e',
  busy: '#eab308',
  offline: '#64748b',
  maintenance: '#f97316',
};

/** Fetch all nodes for the world map (public, no auth needed) */
export async function fetchMapNodes(): Promise<ManufacturingNode[]> {
  try {
    const res = await fetch(`${API_BASE}/nodes/map`, { cache: 'no-store' });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

/** Fetch region/country aggregation for the world map */
export async function fetchMapRegions(): Promise<MapRegionSummary[]> {
  try {
    const res = await fetch(`${API_BASE}/nodes/map?level=region`, { cache: 'no-store' });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

/** Fetch nearby nodes */
export async function fetchNearbyNodes(
  lat: number,
  lng: number,
  radius: number = 50
): Promise<{ nodes: ManufacturingNode[]; total_count: number }> {
  try {
    const res = await fetch(
      `${API_BASE}/nodes/nearby?lat=${lat}&lng=${lng}&radius=${radius}`,
      { cache: 'no-store' }
    );
    if (!res.ok) return { nodes: [], total_count: 0 };
    return await res.json();
  } catch {
    return { nodes: [], total_count: 0 };
  }
}
