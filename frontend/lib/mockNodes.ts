export interface ManufacturingNode {
  id: string;
  lat: number;
  lng: number;
  type: 'printer_3d' | 'cnc' | 'laser_cutter' | 'injection_molding' | 'pcb_assembly';
  materials: string[];
  status: 'online' | 'busy' | 'offline';
  build_volume?: {
    x: number;
    y: number;
    z: number;
    units: 'mm' | 'in';
  };
  capabilities?: string[];
}

export const MOCK_NODES: ManufacturingNode[] = [
  // North America
  {
    id: 'node-sf-1',
    lat: 37.7749,
    lng: -122.4194,
    type: 'printer_3d',
    materials: ['PLA', 'ABS', 'PETG', 'TPU'],
    status: 'online',
    build_volume: { x: 256, y: 256, z: 256, units: 'mm' },
    capabilities: ['Multi-color printing', 'Support structures', 'High precision']
  },
  {
    id: 'node-ny-1',
    lat: 40.7128,
    lng: -74.0060,
    type: 'cnc',
    materials: ['Aluminum', 'Steel', 'Brass', 'Wood'],
    status: 'busy',
    build_volume: { x: 500, y: 300, z: 200, units: 'mm' },
    capabilities: ['5-axis machining', 'Tool changing', 'Precision cutting']
  },
  {
    id: 'node-la-1',
    lat: 34.0522,
    lng: -118.2437,
    type: 'laser_cutter',
    materials: ['Acrylic', 'Wood', 'Paper', 'Fabric'],
    status: 'online',
    build_volume: { x: 600, y: 400, z: 25, units: 'mm' },
    capabilities: ['Vector cutting', 'Engraving', 'Multiple materials']
  },
  {
    id: 'node-chicago-1',
    lat: 41.8781,
    lng: -87.6298,
    type: 'injection_molding',
    materials: ['ABS', 'PP', 'PE', 'PS'],
    status: 'offline',
    build_volume: { x: 200, y: 150, z: 100, units: 'mm' },
    capabilities: ['High volume production', 'Complex geometries', 'Multi-cavity molds']
  },

  // Europe
  {
    id: 'node-london-1',
    lat: 51.5074,
    lng: -0.1278,
    type: 'printer_3d',
    materials: ['PLA', 'ABS', 'PETG', 'Carbon Fiber'],
    status: 'online',
    build_volume: { x: 350, y: 350, z: 400, units: 'mm' },
    capabilities: ['Large format printing', 'Industrial materials', 'Post-processing']
  },
  {
    id: 'node-berlin-1',
    lat: 52.5200,
    lng: 13.4050,
    type: 'pcb_assembly',
    materials: ['FR4', 'Flexible PCB', 'Aluminum PCB'],
    status: 'busy',
    build_volume: { x: 100, y: 80, z: 10, units: 'mm' },
    capabilities: ['SMT assembly', 'Through-hole', 'Testing']
  },
  {
    id: 'node-paris-1',
    lat: 48.8566,
    lng: 2.3522,
    type: 'laser_cutter',
    materials: ['Steel', 'Aluminum', 'Acrylic', 'Wood'],
    status: 'online',
    build_volume: { x: 1000, y: 600, z: 50, units: 'mm' },
    capabilities: ['Metal cutting', 'Thick materials', 'High precision']
  },

  // Asia
  {
    id: 'node-tokyo-1',
    lat: 35.6762,
    lng: 139.6503,
    type: 'printer_3d',
    materials: ['PLA', 'ABS', 'Nylon', 'Metal powder'],
    status: 'online',
    build_volume: { x: 200, y: 200, z: 200, units: 'mm' },
    capabilities: ['Metal 3D printing', 'Multi-material', 'High precision']
  },
  {
    id: 'node-shanghai-1',
    lat: 31.2304,
    lng: 121.4737,
    type: 'cnc',
    materials: ['Aluminum', 'Titanium', 'Stainless Steel'],
    status: 'busy',
    build_volume: { x: 800, y: 600, z: 400, units: 'mm' },
    capabilities: ['Large parts', 'Aerospace materials', 'Automated setup']
  },
  {
    id: 'node-seoul-1',
    lat: 37.5665,
    lng: 126.9780,
    type: 'pcb_assembly',
    materials: ['FR4', 'Rogers', 'Ceramic'],
    status: 'online',
    build_volume: { x: 150, y: 100, z: 5, units: 'mm' },
    capabilities: ['High-frequency PCBs', 'Fine pitch components', 'RF testing']
  },
  {
    id: 'node-singapore-1',
    lat: 1.3521,
    lng: 103.8198,
    type: 'injection_molding',
    materials: ['ABS', 'PC', 'PA', 'POM'],
    status: 'online',
    build_volume: { x: 300, y: 200, z: 150, units: 'mm' },
    capabilities: ['Precision molding', 'Insert molding', 'Overmolding']
  },

  // Australia
  {
    id: 'node-sydney-1',
    lat: -33.8688,
    lng: 151.2093,
    type: 'printer_3d',
    materials: ['PLA', 'ABS', 'PETG', 'Wood filament'],
    status: 'online',
    build_volume: { x: 300, y: 300, z: 400, units: 'mm' },
    capabilities: ['Artistic printing', 'Custom materials', 'Large objects']
  },

  // South America
  {
    id: 'node-sao-paulo-1',
    lat: -23.5505,
    lng: -46.6333,
    type: 'laser_cutter',
    materials: ['Wood', 'Acrylic', 'Leather', 'Cardboard'],
    status: 'busy',
    build_volume: { x: 800, y: 600, z: 20, units: 'mm' },
    capabilities: ['Artistic cutting', 'Custom designs', 'Mixed materials']
  },

  // Africa
  {
    id: 'node-cape-town-1',
    lat: -33.9249,
    lng: 18.4241,
    type: 'printer_3d',
    materials: ['PLA', 'Recycled filament', 'Bio-plastic'],
    status: 'online',
    build_volume: { x: 220, y: 220, z: 250, units: 'mm' },
    capabilities: ['Sustainable materials', 'Educational projects', 'Rapid prototyping']
  }
];

export const NODE_TYPE_INFO = {
  printer_3d: {
    name: '3D Printer',
    icon: '🖨️',
    color: '#10b981' // emerald
  },
  cnc: {
    name: 'CNC Machine',
    icon: '⚙️',
    color: '#f59e0b' // amber
  },
  laser_cutter: {
    name: 'Laser Cutter',
    icon: '🔴',
    color: '#ef4444' // red
  },
  injection_molding: {
    name: 'Injection Molding',
    icon: '🏭',
    color: '#8b5cf6' // violet
  },
  pcb_assembly: {
    name: 'PCB Assembly',
    icon: '🔌',
    color: '#06b6d4' // cyan
  }
} as const;

export const STATUS_COLORS = {
  online: '#22c55e', // green
  busy: '#eab308', // yellow
  offline: '#6b7280' // gray
} as const;