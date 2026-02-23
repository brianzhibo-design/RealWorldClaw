"use client";
import { API_BASE as API_URL, apiFetch } from "@/lib/api-client";
import { useAuthStore } from "@/stores/authStore";

import { useState } from "react";
import { useRouter } from "next/navigation";

const MATERIALS = [
  "PLA", "PETG", "ABS", "TPU", "Nylon", "Resin", "ASA", "PC", "Carbon Fiber"
];

export default function MakerRegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    maker_type: "maker" as "maker" | "builder",
    printer_brand: "",
    printer_model: "",
    build_volume_x: "",
    build_volume_y: "",
    build_volume_z: "",
    materials: [] as string[],
    location_province: "",
    location_city: "",
    location_district: "",
    pricing_per_hour_cny: "",
    description: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const token = useAuthStore((state) => state.token);

  if (!token) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔐</div>
          <h2 className="text-xl font-bold mb-2">Authentication Required</h2>
          <p className="text-slate-400 mb-6">Please sign in to register as a maker</p>
          <a href="/auth/login" className="inline-block px-6 py-3 bg-sky-600 hover:bg-sky-500 text-white rounded-lg font-medium transition-colors">
            Sign In →
          </a>
        </div>
      </div>
    );
  }

  const handleMaterialToggle = (material: string) => {
    setFormData(prev => ({
      ...prev,
      materials: prev.materials.includes(material)
        ? prev.materials.filter(m => m !== material)
        : [...prev.materials, material],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.printer_brand.trim()) { setError("Printer Brand is required"); return; }
    if (!formData.printer_model.trim()) { setError("Printer Model is required"); return; }
    if (!formData.build_volume_x || parseFloat(formData.build_volume_x) <= 0) { setError("Build Volume X must be > 0"); return; }
    if (!formData.build_volume_y || parseFloat(formData.build_volume_y) <= 0) { setError("Build Volume Y must be > 0"); return; }
    if (!formData.build_volume_z || parseFloat(formData.build_volume_z) <= 0) { setError("Build Volume Z must be > 0"); return; }
    if (formData.materials.length === 0) { setError("Select at least one material"); return; }
    if (!formData.location_province.trim()) { setError("Province is required"); return; }
    if (!formData.location_city.trim()) { setError("City is required"); return; }
    if (!formData.location_district.trim()) { setError("District is required"); return; }
    if (!formData.pricing_per_hour_cny || parseFloat(formData.pricing_per_hour_cny) <= 0) { setError("Pricing must be > 0"); return; }

    setSubmitting(true);
    try {
      await apiFetch('/makers/register', {
        method: "POST",
        body: JSON.stringify({
          maker_type: formData.maker_type,
          printer_brand: formData.printer_brand.trim(),
          printer_model: formData.printer_model.trim(),
          build_volume_x: parseFloat(formData.build_volume_x),
          build_volume_y: parseFloat(formData.build_volume_y),
          build_volume_z: parseFloat(formData.build_volume_z),
          materials: formData.materials,
          location_province: formData.location_province.trim(),
          location_city: formData.location_city.trim(),
          location_district: formData.location_district.trim(),
          pricing_per_hour_cny: parseFloat(formData.pricing_per_hour_cny),
          description: formData.description.trim() || undefined,
        }),
      });

      setSuccess(true);
      setTimeout(() => {
        router.push("/maker-orders");
      }, 3000);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls = "w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-600 focus:border-transparent";

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-slate-800">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold flex items-center gap-2">👨‍🔧 Register as a Maker</h1>
          <p className="text-slate-400 text-sm mt-1">Join our network of manufacturing professionals</p>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-900/50 border border-red-800 rounded-lg text-red-200">{error}</div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-900/50 border border-green-800 rounded-lg text-green-200">
            Maker registration successful! Redirecting to your orders...
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Maker Type */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">📝 Maker Type</h2>
            <div className="flex gap-4">
              {(["maker", "builder"] as const).map(t => (
                <button key={t} type="button" onClick={() => setFormData(prev => ({ ...prev, maker_type: t }))}
                  className={`flex-1 p-4 rounded-lg border text-center capitalize transition-colors ${formData.maker_type === t ? "border-sky-500 bg-sky-900/20 text-sky-400" : "border-slate-700 hover:border-slate-600 text-slate-300"}`}>
                  {t === "maker" ? "🖨️" : "🔧"} {t}
                </button>
              ))}
            </div>
          </div>

          {/* Printer Info */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">🖨️ Printer Information</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Printer Brand *</label>
                <input type="text" value={formData.printer_brand} onChange={e => setFormData(prev => ({ ...prev, printer_brand: e.target.value }))} placeholder="e.g. Bambu Lab" required className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Printer Model *</label>
                <input type="text" value={formData.printer_model} onChange={e => setFormData(prev => ({ ...prev, printer_model: e.target.value }))} placeholder="e.g. P1S" required className={inputCls} />
              </div>
            </div>
          </div>

          {/* Build Volume */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">📐 Build Volume (mm)</h2>
            <div className="grid grid-cols-3 gap-4">
              {(["x", "y", "z"] as const).map(axis => (
                <div key={axis}>
                  <label className="block text-xs text-slate-400 mb-1">{axis.toUpperCase()}</label>
                  <input type="number" min="0.1" step="any" value={formData[`build_volume_${axis}`]} onChange={e => setFormData(prev => ({ ...prev, [`build_volume_${axis}`]: e.target.value }))} placeholder="256" required className={inputCls} />
                </div>
              ))}
            </div>
          </div>

          {/* Materials */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">🧪 Supported Materials *</h2>
            <div className="flex flex-wrap gap-2">
              {MATERIALS.map(m => (
                <button key={m} type="button" onClick={() => handleMaterialToggle(m)}
                  className={`px-3 py-2 text-sm rounded-full transition-colors ${formData.materials.includes(m) ? "bg-sky-600 text-white" : "bg-slate-700 text-slate-300 hover:bg-slate-600"}`}>
                  {formData.materials.includes(m) && "✓ "}{m}
                </button>
              ))}
            </div>
          </div>

          {/* Location */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">📍 Location</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Province *</label>
                <input type="text" value={formData.location_province} onChange={e => setFormData(prev => ({ ...prev, location_province: e.target.value }))} placeholder="e.g. Guangdong" required className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">City *</label>
                <input type="text" value={formData.location_city} onChange={e => setFormData(prev => ({ ...prev, location_city: e.target.value }))} placeholder="e.g. Shenzhen" required className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">District *</label>
                <input type="text" value={formData.location_district} onChange={e => setFormData(prev => ({ ...prev, location_district: e.target.value }))} placeholder="e.g. Nanshan" required className={inputCls} />
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">💰 Pricing</h2>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Pricing per Hour (CNY) *</label>
              <input type="number" min="0.01" step="any" value={formData.pricing_per_hour_cny} onChange={e => setFormData(prev => ({ ...prev, pricing_per_hour_cny: e.target.value }))} placeholder="e.g. 15.00" required className={inputCls} />
            </div>
          </div>

          {/* Description */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">💡 Description</h2>
            <textarea value={formData.description} onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))} placeholder="Tell customers about your services, quality, and experience..." rows={4} className={`${inputCls} resize-none`} />
          </div>

          {/* Submit */}
          <div className="flex items-center justify-between">
            <button type="button" onClick={() => router.back()} className="px-4 py-2 text-slate-400 hover:text-slate-300 transition-colors">← Cancel</button>
            <button type="submit" disabled={submitting} className="px-8 py-3 bg-sky-600 hover:bg-sky-500 disabled:bg-slate-700 disabled:text-slate-400 text-white rounded-lg font-medium transition-colors">
              {submitting ? "Registering..." : "Register as Maker →"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
