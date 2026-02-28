"use client";
import { apiFetch, getErrorMessage } from "@/lib/api-client";
import { useAuthStore } from "@/stores/authStore";
import { useToast } from "@/hooks/use-toast";

import { useState } from "react";
import { useRouter } from "next/navigation";

const NODE_TYPES = [
  { value: "3d_printer", label: "3D Printer", icon: "🖨️", desc: "FDM, SLA, SLS printers" },
  { value: "cnc_mill", label: "CNC Mill", icon: "🔧", desc: "CNC milling machines" },
  { value: "laser_cutter", label: "Laser Cutter", icon: "⚡", desc: "CO2, fiber, diode lasers" },
  { value: "injection_molder", label: "Injection Molder", icon: "🏭", desc: "Plastic injection molding" },
  { value: "assembly", label: "Assembly", icon: "🔩", desc: "Assembly & packaging" },
  { value: "other", label: "Other", icon: "🛠️", desc: "Other equipment" },
];

const COMMON_MATERIALS = ["PLA", "ABS", "PETG", "TPU", "Nylon", "Resin", "Wood", "Metal", "Acrylic"];

const PRESET_CITIES: Record<string, { lat: number; lng: number; country: string }> = {
  "Shenzhen": { lat: 22.5431, lng: 114.0579, country: "CN" },
  "Shanghai": { lat: 31.2304, lng: 121.4737, country: "CN" },
  "Beijing": { lat: 39.9042, lng: 116.4074, country: "CN" },
  "Guangzhou": { lat: 23.1291, lng: 113.2644, country: "CN" },
  "Hangzhou": { lat: 30.2741, lng: 120.1551, country: "CN" },
  "Chengdu": { lat: 30.5728, lng: 104.0668, country: "CN" },
  "Wuhan": { lat: 30.5928, lng: 114.3055, country: "CN" },
  "Tokyo": { lat: 35.6762, lng: 139.6503, country: "JP" },
  "Osaka": { lat: 34.6937, lng: 135.5023, country: "JP" },
  "Seoul": { lat: 37.5665, lng: 126.9780, country: "KR" },
  "Singapore": { lat: 1.3521, lng: 103.8198, country: "SG" },
  "Bangkok": { lat: 13.7563, lng: 100.5018, country: "TH" },
  "Ho Chi Minh City": { lat: 10.8231, lng: 106.6297, country: "VN" },
  "Mumbai": { lat: 19.0760, lng: 72.8777, country: "IN" },
  "San Francisco": { lat: 37.7749, lng: -122.4194, country: "US" },
  "New York": { lat: 40.7128, lng: -74.0060, country: "US" },
  "Los Angeles": { lat: 34.0522, lng: -118.2437, country: "US" },
  "London": { lat: 51.5074, lng: -0.1278, country: "GB" },
  "Berlin": { lat: 52.5200, lng: 13.4050, country: "DE" },
  "Amsterdam": { lat: 52.3676, lng: 4.9041, country: "NL" },
  "Sydney": { lat: -33.8688, lng: 151.2093, country: "AU" },
  "São Paulo": { lat: -23.5505, lng: -46.6333, country: "BR" },
};

const STEPS = [
  { num: 1, title: "Node Type", desc: "What kind of equipment?" },
  { num: 2, title: "Basic Info", desc: "Name & description" },
  { num: 3, title: "Location", desc: "Where is your node?" },
  { num: 4, title: "Confirm", desc: "Review & submit" },
];

export default function RegisterNodePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    node_type: "",
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
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [manualCoords, setManualCoords] = useState(false);
  const [citySearch, setCitySearch] = useState("");

  const token = useAuthStore((state) => state.token);

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
    setManualCoords(false);
    if (city && PRESET_CITIES[city]) {
      const coords = PRESET_CITIES[city];
      setFormData(prev => ({
        ...prev,
        latitude: String(coords.lat),
        longitude: String(coords.lng),
      }));
    }
  };

  const canProceed = (): boolean => {
    switch (step) {
      case 1: return !!formData.node_type;
      case 2: return formData.name.trim().length > 0 && formData.name.trim().length <= 100;
      case 3: {
        const lat = parseFloat(formData.latitude);
        const lng = parseFloat(formData.longitude);
        return !isNaN(lat) && lat >= -90 && lat <= 90 && !isNaN(lng) && lng >= -180 && lng <= 180;
      }
      default: return true;
    }
  };

  const handleNext = () => {
    setError(null);
    if (canProceed() && step < 4) setStep(step + 1);
  };

  const handleBack = () => {
    setError(null);
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async () => {
    setError(null);

    const lat = parseFloat(formData.latitude);
    const lng = parseFloat(formData.longitude);
    if (formData.description.length > 500) { setError("Description must be under 500 characters"); return; }

    const bvx = formData.build_volume_x ? parseFloat(formData.build_volume_x) : undefined;
    const bvy = formData.build_volume_y ? parseFloat(formData.build_volume_y) : undefined;
    const bvz = formData.build_volume_z ? parseFloat(formData.build_volume_z) : undefined;
    if ((bvx !== undefined && bvx <= 0) || (bvy !== undefined && bvy <= 0) || (bvz !== undefined && bvz <= 0)) {
      setError("Build volume values must be > 0"); return;
    }

    setSubmitting(true);
    try {
      await apiFetch('/nodes/register', {
        method: "POST",
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

      toast({
        title: "Node registered",
        description: "Your node is now live on the map.",
      });
      router.push("/map");
    } catch (err) {
      setError(getErrorMessage(err, "Unable to register node. Please check the form and try again."));
    } finally { setSubmitting(false); }
  };

  const inputCls = "w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-600 focus:border-transparent";

  const filteredCities = citySearch
    ? Object.keys(PRESET_CITIES).filter(c => c.toLowerCase().includes(citySearch.toLowerCase()))
    : Object.keys(PRESET_CITIES);

  const selectedTypeInfo = NODE_TYPES.find(t => t.value === formData.node_type);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-slate-800">
        <div className="max-w-3xl mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold flex items-center gap-2">🏭 Register Manufacturing Node</h1>
          <p className="text-slate-400 text-sm mt-1">Step {step} of 4 — {STEPS[step - 1].title}</p>
        </div>
      </header>

      {/* Progress bar */}
      <div className="max-w-3xl mx-auto px-6 pt-6">
        <div className="flex items-center gap-1 mb-8">
          {STEPS.map((s) => (
            <div key={s.num} className="flex-1 flex flex-col items-center gap-1.5">
              <div className="w-full flex items-center">
                <div className={`h-1.5 flex-1 rounded-full transition-colors ${s.num <= step ? 'bg-sky-500' : 'bg-slate-800'}`} />
              </div>
              <div className={`text-[10px] font-medium transition-colors ${s.num === step ? 'text-sky-400' : s.num < step ? 'text-slate-400' : 'text-slate-600'}`}>
                {s.title}
              </div>
            </div>
          ))}
        </div>

        {error && <div className="mb-6 p-4 bg-red-900/50 border border-red-800 rounded-lg text-red-200">{error}</div>}

        {/* Step 1: Node Type */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">What type of equipment do you have?</h2>
            <p className="text-slate-400 text-sm">Select the category that best describes your manufacturing node.</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
              {NODE_TYPES.map(type => (
                <button key={type.value} type="button" onClick={() => setFormData(prev => ({ ...prev, node_type: type.value }))}
                  className={`p-5 rounded-xl border-2 transition-all text-center ${formData.node_type === type.value ? "border-sky-500 bg-sky-600/20 text-sky-300 shadow-lg shadow-sky-500/10" : "border-slate-700 hover:border-slate-500 text-slate-300"}`}>
                  <div className="text-3xl mb-2">{type.icon}</div>
                  <div className="text-sm font-semibold">{type.label}</div>
                  <div className="text-[11px] text-slate-500 mt-1">{type.desc}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Basic Info */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold">Tell us about your node</h2>
              <p className="text-slate-400 text-sm mt-1">
                {selectedTypeInfo?.icon} {selectedTypeInfo?.label} — give it a name and optional details.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Node Name <span className="text-red-400">*</span></label>
              <input type="text" value={formData.name} onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))} placeholder="e.g. My Bambu Lab P1S" maxLength={100} className={inputCls} autoFocus />
              <div className="text-xs text-slate-500 mt-1">{formData.name.length}/100 characters</div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Description <span className="text-slate-500">(optional)</span></label>
              <textarea value={formData.description} onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))} placeholder="Describe your setup, specialties, or capabilities..." rows={3} maxLength={500} className={`${inputCls} resize-none`} />
              <div className="text-xs text-slate-500 mt-1">{formData.description.length}/500</div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-3">Materials <span className="text-slate-500">(optional)</span></label>
              <div className="flex flex-wrap gap-2">
                {COMMON_MATERIALS.map(m => (
                  <button key={m} type="button" onClick={() => handleMaterialToggle(m)}
                    className={`px-3 py-2 text-sm rounded-full transition-colors ${formData.materials.includes(m) ? "bg-sky-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"}`}>
                    {formData.materials.includes(m) && "✓ "}{m}
                  </button>
                ))}
              </div>
            </div>

            {/* Build volume */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Build Volume (mm) <span className="text-slate-500">(optional)</span></label>
              <div className="grid grid-cols-3 gap-3">
                {(["x", "y", "z"] as const).map(axis => (
                  <div key={axis}>
                    <label className="block text-xs text-slate-500 mb-1">{axis.toUpperCase()}</label>
                    <input type="number" min="0.1" step="any" value={formData[`build_volume_${axis}`]} onChange={e => setFormData(prev => ({ ...prev, [`build_volume_${axis}`]: e.target.value }))} placeholder="256" className={inputCls} />
                  </div>
                ))}
              </div>
            </div>

            {/* Capabilities */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Capabilities <span className="text-slate-500">(optional)</span></label>
              <div className="flex gap-2 mb-2">
                <input type="text" value={capInput} onChange={e => setCapInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); handleAddCapability(); } }} placeholder="e.g. multi-color, high-temp" className={`${inputCls} flex-1`} />
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
          </div>
        )}

        {/* Step 3: Location */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold">Where is your node located?</h2>
              <p className="text-slate-400 text-sm mt-1">Select a city or enter coordinates manually. Your exact location is fuzzed for privacy.</p>
            </div>

            <div className="flex gap-3 mb-2">
              <button type="button" onClick={() => setManualCoords(false)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${!manualCoords ? 'bg-sky-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>
                🏙️ Select City
              </button>
              <button type="button" onClick={() => setManualCoords(true)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${manualCoords ? 'bg-sky-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>
                📍 Manual Coordinates
              </button>
            </div>

            {!manualCoords ? (
              <div>
                <div className="mb-3">
                  <input
                    type="text"
                    value={citySearch}
                    onChange={e => setCitySearch(e.target.value)}
                    placeholder="Search cities..."
                    className={inputCls}
                    autoFocus
                  />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-[320px] overflow-y-auto pr-1">
                  {filteredCities.map(city => {
                    const c = PRESET_CITIES[city];
                    return (
                      <button key={city} type="button" onClick={() => handleCityChange(city)}
                        className={`p-3 rounded-lg border text-left transition-all ${selectedCity === city ? "border-sky-500 bg-sky-600/20 text-sky-300" : "border-slate-700 hover:border-slate-500 text-slate-300"}`}>
                        <div className="text-sm font-medium">{city}</div>
                        <div className="text-[10px] text-slate-500">{c.country} · {c.lat.toFixed(2)}, {c.lng.toFixed(2)}</div>
                      </button>
                    );
                  })}
                </div>
                {selectedCity && (
                  <div className="mt-3 p-3 bg-slate-900/60 rounded-lg border border-slate-700/50">
                    <div className="text-sm text-slate-300">📍 {selectedCity} — <span className="text-slate-500">{formData.latitude}, {formData.longitude}</span></div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-slate-500">Enter latitude and longitude. You can find these from Google Maps by right-clicking any location.</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Latitude (-90 to 90)</label>
                    <input type="number" step="any" min="-90" max="90" value={formData.latitude}
                      onChange={e => { setFormData(prev => ({ ...prev, latitude: e.target.value })); setSelectedCity(""); }}
                      placeholder="e.g. 22.5431" className={inputCls} autoFocus />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Longitude (-180 to 180)</label>
                    <input type="number" step="any" min="-180" max="180" value={formData.longitude}
                      onChange={e => { setFormData(prev => ({ ...prev, longitude: e.target.value })); setSelectedCity(""); }}
                      placeholder="e.g. 114.0579" className={inputCls} />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 4: Confirm */}
        {step === 4 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Review your node</h2>
            <p className="text-slate-400 text-sm">Make sure everything looks good before submitting.</p>

            <div className="bg-slate-900/80 border border-slate-700 rounded-xl p-6 space-y-4">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
                <span className="text-3xl">{selectedTypeInfo?.icon || '⚙️'}</span>
                <div>
                  <div className="text-lg font-semibold text-white">{formData.name}</div>
                  <div className="text-sm text-slate-400">{selectedTypeInfo?.label || formData.node_type}</div>
                </div>
              </div>

              {formData.description && (
                <div>
                  <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Description</div>
                  <div className="text-sm text-slate-300">{formData.description}</div>
                </div>
              )}

              <div>
                <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Location</div>
                <div className="text-sm text-slate-300">
                  {selectedCity ? `${selectedCity} · ` : ''}{formData.latitude}, {formData.longitude}
                </div>
              </div>

              {formData.materials.length > 0 && (
                <div>
                  <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Materials</div>
                  <div className="flex flex-wrap gap-1.5">
                    {formData.materials.map(m => (
                      <span key={m} className="px-2 py-0.5 bg-sky-600/20 text-sky-300 rounded-full text-xs">{m}</span>
                    ))}
                  </div>
                </div>
              )}

              {formData.capabilities.length > 0 && (
                <div>
                  <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Capabilities</div>
                  <div className="flex flex-wrap gap-1.5">
                    {formData.capabilities.map(c => (
                      <span key={c} className="px-2 py-0.5 bg-slate-700 text-slate-300 rounded-full text-xs">{c}</span>
                    ))}
                  </div>
                </div>
              )}

              {(formData.build_volume_x || formData.build_volume_y || formData.build_volume_z) && (
                <div>
                  <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Build Volume</div>
                  <div className="text-sm text-slate-300">
                    {formData.build_volume_x || '—'} × {formData.build_volume_y || '—'} × {formData.build_volume_z || '—'} mm
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex justify-between mt-8 pb-12">
          {step > 1 ? (
            <button type="button" onClick={handleBack} className="px-5 py-2.5 text-slate-400 hover:text-slate-200 transition-colors font-medium">
              ← Back
            </button>
          ) : (
            <button type="button" onClick={() => router.back()} className="px-5 py-2.5 text-slate-400 hover:text-slate-200 transition-colors font-medium">
              ← Cancel
            </button>
          )}

          {step < 4 ? (
            <button type="button" onClick={handleNext} disabled={!canProceed()}
              className="px-8 py-2.5 bg-sky-600 hover:bg-sky-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg font-medium transition-colors">
              Next →
            </button>
          ) : (
            <button type="button" onClick={handleSubmit} disabled={submitting}
              className="px-8 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:text-slate-400 text-white rounded-lg font-medium transition-colors">
              {submitting ? "Registering..." : "✓ Register Node"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
