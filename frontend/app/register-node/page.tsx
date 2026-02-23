"use client";
import { API_BASE as API_URL } from "@/lib/api-client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const NODE_TYPES = [
  { value: "3d_printer", label: "3D Printer", icon: "🖨️" },
  { value: "cnc_mill", label: "CNC Mill", icon: "🔧" },
  { value: "laser_cutter", label: "Laser Cutter", icon: "⚡" },
  { value: "injection_molder", label: "Injection Molder", icon: "🏭" },
  { value: "assembly", label: "Assembly", icon: "🔩" },
  { value: "other", label: "Other", icon: "🛠️" },
];

const COMMON_MATERIALS = ["PLA", "ABS", "PETG", "TPU", "Nylon", "Resin", "Wood", "Metal", "Acrylic"];

const PRESET_CITIES: Record<string, { lat: number; lng: number }> = {
  "Shenzhen": { lat: 22.5431, lng: 114.0579 },
  "Shanghai": { lat: 31.2304, lng: 121.4737 },
  "Beijing": { lat: 39.9042, lng: 116.4074 },
  "Guangzhou": { lat: 23.1291, lng: 113.2644 },
  "Tokyo": { lat: 35.6762, lng: 139.6503 },
  "Seoul": { lat: 37.5665, lng: 126.9780 },
  "Singapore": { lat: 1.3521, lng: 103.8198 },
  "San Francisco": { lat: 37.7749, lng: -122.4194 },
  "New York": { lat: 40.7128, lng: -74.0060 },
  "London": { lat: 51.5074, lng: -0.1278 },
  "Berlin": { lat: 52.5200, lng: 13.4050 },
  "Sydney": { lat: -33.8688, lng: 151.2093 },
};

export default function RegisterNodePage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    node_type: "3d_printer",
    latitude: "",
    longitude: "",
    capabilities: [] as string[],
    materials: [] as string[],
    build_volume_x: "",
    build_volume_y: "",
    build_volume_z: "",
    description: "",
  });
  const [capInput, setCapInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [selectedCity, setSelectedCity] = useState<string>(""); // Empty for custom coordinates
  const [locationMode, setLocationMode] = useState<"city" | "custom">("city");

  const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") || localStorage.getItem("token") : null;

  if (!token) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔐</div>
          <h2 className="text-xl font-bold mb-2">Authentication Required</h2>
          <p className="text-slate-400 mb-6">Please sign in to register your manufacturing node</p>
          <a href="/auth/login" className="inline-block px-6 py-3 bg-sky-600 hover:bg-sky-500 text-white rounded-lg font-medium transition-colors">Sign In →</a>
        </div>
      </div>
    );
  }

  const handleMaterialToggle = (m: string) => {
    setFormData(prev => ({
      ...prev,
      materials: prev.materials.includes(m) ? prev.materials.filter(x => x !== m) : [...prev.materials, m],
    }));
  };

  const handleAddCapability = () => {
    const cap = capInput.trim();
    if (cap && !formData.capabilities.includes(cap)) {
      setFormData(prev => ({ ...prev, capabilities: [...prev.capabilities, cap] }));
      setCapInput("");
    }
  };

  const handleCityChange = (city: string) => {
    setSelectedCity(city);
    if (city && PRESET_CITIES[city]) {
      const coords = PRESET_CITIES[city];
      setFormData(prev => ({ 
        ...prev, 
        latitude: String(coords.lat), 
        longitude: String(coords.lng) 
      }));
    }
  };

  const handleLocationModeChange = (mode: "city" | "custom") => {
    setLocationMode(mode);
    if (mode === "custom") {
      setSelectedCity("");
      // Clear coordinates when switching to custom mode
      setFormData(prev => ({ ...prev, latitude: "", longitude: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim() || formData.name.trim().length > 100) { setError("Name is required (1-100 chars)"); return; }
    
    // Validate location based on mode
    if (locationMode === "city" && !selectedCity) {
      setError("Please select a city or switch to custom coordinates");
      return;
    }
    
    const lat = parseFloat(formData.latitude);
    const lng = parseFloat(formData.longitude);
    if (isNaN(lat) || lat < -90 || lat > 90) { setError("Latitude must be between -90 and 90"); return; }
    if (isNaN(lng) || lng < -180 || lng > 180) { setError("Longitude must be between -180 and 180"); return; }
    if (formData.description.length > 500) { setError("Description must be under 500 characters"); return; }

    const bvx = formData.build_volume_x ? parseFloat(formData.build_volume_x) : undefined;
    const bvy = formData.build_volume_y ? parseFloat(formData.build_volume_y) : undefined;
    const bvz = formData.build_volume_z ? parseFloat(formData.build_volume_z) : undefined;
    if ((bvx !== undefined && bvx <= 0) || (bvy !== undefined && bvy <= 0) || (bvz !== undefined && bvz <= 0)) {
      setError("Build volume values must be > 0"); return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/nodes/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: formData.name.trim(),
          node_type: formData.node_type,
          latitude: lat,
          longitude: lng,
          capabilities: formData.capabilities.length > 0 ? formData.capabilities : undefined,
          materials: formData.materials.length > 0 ? formData.materials.map(n => n.toLowerCase()) : undefined,
          build_volume_x: bvx,
          build_volume_y: bvy,
          build_volume_z: bvz,
          description: formData.description.trim() || undefined,
        }),
      });

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          router.push("/map");
        }, 3000);
      } else {
        const errorData = await response.json();
        setError(errorData.detail || "Failed to register node");
      }
    } catch { setError("Network error. Please try again."); }
    finally { setSubmitting(false); }
  };

  const inputCls = "w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-600 focus:border-transparent";

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-slate-800">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold flex items-center gap-2">🏭 Register Manufacturing Node</h1>
          <p className="text-slate-400 text-sm mt-1">Share your manufacturing capabilities with the RealWorldClaw network</p>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {error && <div className="mb-6 p-4 bg-red-900/50 border border-red-800 rounded-lg text-red-200">{error}</div>}

        {success && (
          <div className="mb-6 p-4 bg-green-900/50 border border-green-800 rounded-lg text-green-200">
            Node registered successfully! Redirecting...
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Name */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4">📝 Basic Info</h2>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Node Name * (1-100 chars)</label>
              <input type="text" value={formData.name} onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))} placeholder="e.g. My Main 3D Printer" maxLength={100} required className={inputCls} />
            </div>
          </div>

          {/* Node Type */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4">⚙️ Node Type *</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {NODE_TYPES.map(type => (
                <button key={type.value} type="button" onClick={() => setFormData(prev => ({ ...prev, node_type: type.value }))}
                  className={`p-4 rounded-lg border transition-colors text-center ${formData.node_type === type.value ? "border-sky-600 bg-sky-600/20 text-sky-400" : "border-slate-700 hover:border-slate-600 text-slate-300"}`}>
                  <div className="text-2xl mb-2">{type.icon}</div>
                  <div className="text-sm font-medium">{type.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Location */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4">📍 Location *</h2>
            
            {/* Location Mode Toggle */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-300 mb-2">Location Input Method</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleLocationModeChange("city")}
                  className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                    locationMode === "city" 
                      ? "bg-sky-600 text-white" 
                      : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                  }`}
                >
                  Select City
                </button>
                <button
                  type="button"
                  onClick={() => handleLocationModeChange("custom")}
                  className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                    locationMode === "custom" 
                      ? "bg-sky-600 text-white" 
                      : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                  }`}
                >
                  Custom Coordinates
                </button>
              </div>
            </div>

            {locationMode === "city" ? (
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-300 mb-2">Select City</label>
                <select
                  value={selectedCity}
                  onChange={(e) => handleCityChange(e.target.value)}
                  required
                  className={inputCls}
                >
                  <option value="">-- Select a city --</option>
                  {Object.keys(PRESET_CITIES).map(city => (
                    <option key={city} value={city}>
                      {city} ({PRESET_CITIES[city].lat.toFixed(4)}, {PRESET_CITIES[city].lng.toFixed(4)})
                    </option>
                  ))}
                </select>
                {selectedCity && (
                  <div className="mt-2 text-sm text-slate-400">
                    Coordinates: {formData.latitude}, {formData.longitude}
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Latitude * (-90 to 90)</label>
                  <input 
                    type="number" 
                    step="any" 
                    min="-90" 
                    max="90" 
                    value={formData.latitude} 
                    onChange={e => setFormData(prev => ({ ...prev, latitude: e.target.value }))} 
                    placeholder="e.g. 22.5431" 
                    required 
                    className={inputCls} 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Longitude * (-180 to 180)</label>
                  <input 
                    type="number" 
                    step="any" 
                    min="-180" 
                    max="180" 
                    value={formData.longitude} 
                    onChange={e => setFormData(prev => ({ ...prev, longitude: e.target.value }))} 
                    placeholder="e.g. 114.0579" 
                    required 
                    className={inputCls} 
                  />
                </div>
              </div>
            )}
          </div>

          {/* Build Volume (optional) */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4">📐 Build Volume (mm, optional)</h2>
            <div className="grid grid-cols-3 gap-4">
              {(["x", "y", "z"] as const).map(axis => (
                <div key={axis}>
                  <label className="block text-xs text-slate-400 mb-1">{axis.toUpperCase()}</label>
                  <input type="number" min="0.1" step="any" value={formData[`build_volume_${axis}`]} onChange={e => setFormData(prev => ({ ...prev, [`build_volume_${axis}`]: e.target.value }))} placeholder="256" className={inputCls} />
                </div>
              ))}
            </div>
          </div>

          {/* Materials */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4">🧪 Materials</h2>
            <div className="flex flex-wrap gap-2">
              {COMMON_MATERIALS.map(m => (
                <button key={m} type="button" onClick={() => handleMaterialToggle(m)}
                  className={`px-3 py-2 text-sm rounded-full transition-colors ${formData.materials.includes(m) ? "bg-sky-600 text-white" : "bg-slate-700 text-slate-300 hover:bg-slate-600"}`}>
                  {formData.materials.includes(m) && "✓ "}{m}
                </button>
              ))}
            </div>
          </div>

          {/* Capabilities */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4">🎯 Capabilities</h2>
            <div className="flex gap-2 mb-3">
              <input type="text" value={capInput} onChange={e => setCapInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); handleAddCapability(); } }} placeholder="Add a capability and press Enter" className={`${inputCls} flex-1`} />
              <button type="button" onClick={handleAddCapability} className="px-4 py-3 bg-sky-600 hover:bg-sky-500 rounded-lg text-white text-sm transition-colors">Add</button>
            </div>
            {formData.capabilities.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.capabilities.map((cap, i) => (
                  <span key={i} className="inline-flex items-center gap-1 px-3 py-1 bg-slate-700 rounded-full text-sm text-slate-300">
                    {cap}
                    <button type="button" onClick={() => setFormData(prev => ({ ...prev, capabilities: prev.capabilities.filter((_, j) => j !== i) }))} className="text-slate-400 hover:text-red-400">×</button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Description */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4">💡 Description (max 500 chars)</h2>
            <textarea value={formData.description} onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))} placeholder="Describe your setup, specialties, or capabilities..." rows={4} maxLength={500} className={`${inputCls} resize-none`} />
            <div className="text-xs text-slate-500 mt-1 text-right">{formData.description.length}/500</div>
          </div>

          {/* Submit */}
          <div className="flex justify-between">
            <button type="button" onClick={() => router.back()} className="px-4 py-2 text-slate-400 hover:text-slate-300 transition-colors">← Cancel</button>
            <button type="submit" disabled={submitting} className="px-8 py-3 bg-sky-600 hover:bg-sky-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg font-medium transition-colors">
              {submitting ? "Registering..." : "Register Node →"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
