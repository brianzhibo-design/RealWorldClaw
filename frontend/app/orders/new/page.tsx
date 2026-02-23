"use client";
import { API_BASE as API_URL } from "@/lib/api";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const MATERIALS = ["PLA", "PETG", "ABS", "TPU", "Nylon", "Resin"];
const COLORS = ["Red", "Blue", "Green", "Yellow", "Orange", "Purple", "Black", "White", "Natural", "Transparent"];

interface UploadedFile {
  id: string;
  filename: string;
  size: number;
  created_at: string;
}

export default function NewOrderPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [formData, setFormData] = useState({
    component_id: "",
    file_id: "",
    order_type: "print_only" as "print_only" | "full_build",
    quantity: 1,
    material: "",
    material_preference: "",
    color: "",
    delivery_province: "",
    delivery_city: "",
    delivery_district: "",
    delivery_address: "",
    urgency: "normal" as "normal" | "express",
    auto_match: false,
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  useEffect(() => {
    if (!token) { router.push("/auth/login"); return; }
    const fetchFiles = async () => {
      try {
        const response = await fetch(`${API_URL}/files/my`, { headers: { Authorization: `Bearer ${token}` } });
        if (response.ok) {
          const data = await response.json();
          const fileList = Array.isArray(data) ? data : data.files || [];
          setFiles(fileList);
          if (fileList.length > 0) setFormData(prev => ({ ...prev, file_id: fileList[0].id }));
        } else if (response.status === 401) { localStorage.removeItem("token"); router.push("/auth/login"); }
        else setError("Failed to load files");
      } catch { setError("Network error. Please try again."); }
      finally { setLoading(false); }
    };
    fetchFiles();
  }, [token, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.component_id.trim()) { setError("Component ID is required"); return; }
    if (formData.quantity < 1) { setError("Quantity must be at least 1"); return; }
    if (!formData.delivery_province.trim()) { setError("Delivery Province is required"); return; }
    if (!formData.delivery_city.trim()) { setError("Delivery City is required"); return; }
    if (!formData.delivery_district.trim()) { setError("Delivery District is required"); return; }
    if (formData.delivery_address.trim().length < 5) { setError("Delivery Address must be at least 5 characters"); return; }

    setSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          component_id: formData.component_id.trim(),
          order_type: formData.order_type,
          quantity: formData.quantity,
          material_preference: formData.material_preference.trim() || undefined,
          delivery_province: formData.delivery_province.trim(),
          delivery_city: formData.delivery_city.trim(),
          delivery_district: formData.delivery_district.trim(),
          delivery_address: formData.delivery_address.trim(),
          urgency: formData.urgency,
          notes: formData.notes.trim() || undefined,
          file_id: formData.file_id || undefined,
          material: formData.material || undefined,
          color: formData.color.trim() || undefined,
          auto_match: formData.auto_match,
        }),
      });

      if (response.ok) {
        const order = await response.json();
        router.push(`/orders/${order.id}`);
      } else {
        const errorData = await response.json();
        setError(errorData.detail || "Failed to create order");
      }
    } catch { setError("Network error. Please try again."); }
    finally { setSubmitting(false); }
  };

  const formatFileSize = (bytes: number) => bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

  const inputCls = "w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-600 focus:border-transparent";

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-slate-800">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold flex items-center gap-2">⚡ Create Order</h1>
          <p className="text-slate-400 text-sm mt-1">Create a manufacturing order</p>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {error && <div className="mb-6 p-4 bg-red-900/50 border border-red-800 rounded-lg text-red-200">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Component & Order Type */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">📦 Order Info</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Component ID *</label>
                <input type="text" value={formData.component_id} onChange={e => setFormData(prev => ({ ...prev, component_id: e.target.value }))} placeholder="Enter or paste component ID" required className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Order Type</label>
                <div className="flex gap-4">
                  {(["print_only", "full_build"] as const).map(t => (
                    <button key={t} type="button" onClick={() => setFormData(prev => ({ ...prev, order_type: t }))}
                      className={`flex-1 p-3 rounded-lg border text-center text-sm transition-colors ${formData.order_type === t ? "border-sky-500 bg-sky-900/20 text-sky-400" : "border-slate-700 hover:border-slate-600 text-slate-300"}`}>
                      {t === "print_only" ? "🖨️ Print Only" : "🔧 Full Build"}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Quantity *</label>
                  <input type="number" min="1" value={formData.quantity} onChange={e => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))} className={inputCls} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Urgency</label>
                  <select value={formData.urgency} onChange={e => setFormData(prev => ({ ...prev, urgency: e.target.value as "normal" | "express" }))} className={inputCls}>
                    <option value="normal">Normal</option>
                    <option value="express">Express</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* File Selection */}
          {files.length > 0 && (
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">📄 File (optional)</h2>
              <div className="space-y-3">
                <label className={`flex items-center p-4 rounded-lg border cursor-pointer transition-colors ${!formData.file_id ? "border-sky-500 bg-sky-900/20" : "border-slate-700 hover:border-slate-600 hover:bg-slate-800/50"}`}>
                  <input type="radio" name="file" value="" checked={!formData.file_id} onChange={() => setFormData(prev => ({ ...prev, file_id: "" }))} className="sr-only" />
                  <div className="font-medium text-slate-300">None</div>
                </label>
                {files.map(file => (
                  <label key={file.id} className={`flex items-center p-4 rounded-lg border cursor-pointer transition-colors ${formData.file_id === file.id ? "border-sky-500 bg-sky-900/20" : "border-slate-700 hover:border-slate-600 hover:bg-slate-800/50"}`}>
                    <input type="radio" name="file" value={file.id} checked={formData.file_id === file.id} onChange={e => setFormData(prev => ({ ...prev, file_id: e.target.value }))} className="sr-only" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-white truncate">{file.filename}</div>
                      <div className="text-sm text-slate-400">{formatFileSize(file.size)}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Material & Color */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">🧪 Material & Color</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Material</label>
                <select value={formData.material} onChange={e => setFormData(prev => ({ ...prev, material: e.target.value }))} className={inputCls}>
                  <option value="">-- Select --</option>
                  {MATERIALS.map(m => <option key={m} value={m.toLowerCase()}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Material Preference</label>
                <input type="text" value={formData.material_preference} onChange={e => setFormData(prev => ({ ...prev, material_preference: e.target.value }))} placeholder="Any specific material preference" className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Color</label>
                <input type="text" value={formData.color} onChange={e => setFormData(prev => ({ ...prev, color: e.target.value }))} placeholder="e.g. Red, Blue" className={inputCls} />
                <div className="flex flex-wrap gap-2 mt-2">
                  {COLORS.map(c => (
                    <button key={c} type="button" onClick={() => setFormData(prev => ({ ...prev, color: c }))}
                      className={`px-3 py-1 text-xs rounded-full transition-colors ${formData.color === c ? "bg-sky-600 text-white" : "bg-slate-700 text-slate-300 hover:bg-slate-600"}`}>{c}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Delivery Address */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">📍 Delivery Address</h2>
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Province *</label>
                  <input type="text" value={formData.delivery_province} onChange={e => setFormData(prev => ({ ...prev, delivery_province: e.target.value }))} placeholder="e.g. Guangdong" required className={inputCls} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">City *</label>
                  <input type="text" value={formData.delivery_city} onChange={e => setFormData(prev => ({ ...prev, delivery_city: e.target.value }))} placeholder="e.g. Shenzhen" required className={inputCls} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">District *</label>
                  <input type="text" value={formData.delivery_district} onChange={e => setFormData(prev => ({ ...prev, delivery_district: e.target.value }))} placeholder="e.g. Nanshan" required className={inputCls} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Detailed Address * (min 5 chars)</label>
                <input type="text" value={formData.delivery_address} onChange={e => setFormData(prev => ({ ...prev, delivery_address: e.target.value }))} placeholder="e.g. Building 1, Room 302, Keji Road" required minLength={5} className={inputCls} />
              </div>
            </div>
          </div>

          {/* Options & Notes */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">⚙️ Options</h2>
            <div className="space-y-6">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={formData.auto_match} onChange={e => setFormData(prev => ({ ...prev, auto_match: e.target.checked }))}
                  className="w-5 h-5 rounded border-slate-600 bg-slate-800 text-sky-600 focus:ring-sky-600" />
                <span className="text-sm text-slate-300">Auto Match (automatically find a suitable maker)</span>
              </label>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Notes</label>
                <textarea value={formData.notes} onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))} placeholder="Any special requirements or instructions..." rows={4} className={`${inputCls} resize-none`} />
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex items-center justify-between">
            <button type="button" onClick={() => router.back()} className="px-4 py-2 text-slate-400 hover:text-slate-300 transition-colors">← Cancel</button>
            <button type="submit" disabled={submitting} className="px-6 py-3 bg-sky-600 hover:bg-sky-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg font-medium transition-colors">
              {submitting ? "Creating Order..." : "Create Order →"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
