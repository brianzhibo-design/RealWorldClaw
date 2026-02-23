"use client";

import { useState, useCallback, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiFetch, API_BASE } from "@/lib/api-client";
import { useAuthStore } from "@/stores/authStore";

const MATERIALS = ["PLA", "PETG", "ABS", "TPU"];
const STEPS = ["Upload File", "Parameters", "Select Node", "Address", "Confirm"];

export default function NewOrderPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500" /></div>}>
      <NewOrderContent />
    </Suspense>
  );
}

function NewOrderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedNode = searchParams.get("node_id") || "";
  const token = useAuthStore((s) => s.token);

  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [fileId, setFileId] = useState("");
  const [fileName, setFileName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [material, setMaterial] = useState("PLA");
  const [quantity, setQuantity] = useState(1);
  const [urgency, setUrgency] = useState<"normal" | "express">("normal");
  const [notes, setNotes] = useState("");
  const [nodeId, setNodeId] = useState(preselectedNode);
  const [deliveryAddress, setDeliveryAddress] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!token) router.push("/auth/login");
  }, [token, router]);

  const handleFileUpload = useCallback(
    async (file: File) => {
      setUploading(true);
      setError(null);
      try {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch(`${API_BASE}/files/upload`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
        if (!res.ok) throw new Error("Upload failed");
        const data = await res.json();
        setFileId(data.id || data.file_id);
        setFileName(file.name);
      } catch {
        setError("File upload failed. Please try again.");
      } finally {
        setUploading(false);
      }
    },
    [token]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) handleFileUpload(file);
    },
    [handleFileUpload]
  );

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const body: Record<string, unknown> = {
        order_type: "print_only",
        file_id: fileId || undefined,
        material: material.toLowerCase(),
        quantity,
        urgency,
        delivery_province: "—",
        delivery_city: "—",
        delivery_district: "—",
        delivery_address: deliveryAddress,
      };
      if (nodeId) body.node_id = nodeId;
      if (notes) body.notes = notes;

      const order = await apiFetch<{ id: string }>("/orders", {
        method: "POST",
        body: JSON.stringify(body),
      });
      router.push(`/orders/${order.id}`);
    } catch {
      setError("Failed to create order. Please try again.");
      setSubmitting(false);
    }
  };

  const canNext = () => {
    if (step === 0) return true; // file is optional
    if (step === 1) return material && quantity >= 1;
    if (step === 2) return true; // node optional
    if (step === 3) return deliveryAddress.trim().length >= 5;
    return true;
  };

  const inputCls =
    "w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-600 focus:border-transparent";

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-slate-800">
        <div className="max-w-3xl mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold">⚡ Create Order</h1>
          {/* Step indicator */}
          <div className="flex items-center gap-1 mt-4">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center gap-1 flex-1">
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-colors ${
                    i <= step
                      ? "bg-sky-600 text-white"
                      : "bg-slate-800 text-slate-500 border border-slate-700"
                  }`}
                >
                  {i < step ? "✓" : i + 1}
                </div>
                <span
                  className={`text-xs hidden sm:block ${
                    i <= step ? "text-sky-400" : "text-slate-500"
                  }`}
                >
                  {s}
                </span>
                {i < STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-1 ${
                      i < step ? "bg-sky-600" : "bg-slate-700"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-900/50 border border-red-800 rounded-lg text-red-200">
            {error}
          </div>
        )}

        {/* Step 0: Upload File */}
        {step === 0 && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-8">
            <h2 className="text-xl font-semibold mb-6">📄 Upload Your Design File</h2>
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${
                fileId
                  ? "border-sky-500 bg-sky-900/20"
                  : "border-slate-700 hover:border-slate-500 hover:bg-slate-800/50"
              }`}
            >
              {uploading ? (
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500 mx-auto" />
              ) : fileId ? (
                <div>
                  <div className="text-4xl mb-2">✅</div>
                  <p className="text-sky-400 font-medium">{fileName}</p>
                  <p className="text-slate-500 text-sm mt-1">Click to replace</p>
                </div>
              ) : (
                <div>
                  <div className="text-4xl mb-3">📁</div>
                  <p className="text-slate-300">
                    Drag & drop your STL/image file here
                  </p>
                  <p className="text-slate-500 text-sm mt-1">
                    or click to browse
                  </p>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".stl,.obj,.3mf,.step,.png,.jpg,.jpeg"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFileUpload(f);
              }}
            />
            <p className="text-slate-500 text-xs mt-3">
              Supported: STL, OBJ, 3MF, STEP, PNG, JPG. File is optional.
            </p>
          </div>
        )}

        {/* Step 1: Parameters */}
        {step === 1 && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-8 space-y-6">
            <h2 className="text-xl font-semibold">🧪 Print Parameters</h2>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Material *</label>
              <select
                value={material}
                onChange={(e) => setMaterial(e.target.value)}
                className={inputCls}
              >
                {MATERIALS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Quantity *</label>
                <input
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Urgency</label>
                <div className="flex gap-3">
                  {(["normal", "express"] as const).map((u) => (
                    <button
                      key={u}
                      type="button"
                      onClick={() => setUrgency(u)}
                      className={`flex-1 py-3 rounded-lg border text-sm font-medium transition-colors ${
                        urgency === u
                          ? "border-sky-500 bg-sky-900/20 text-sky-400"
                          : "border-slate-700 text-slate-400 hover:border-slate-600"
                      }`}
                    >
                      {u === "normal" ? "🕐 Normal" : "⚡ Express"}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any special requirements..."
                rows={3}
                className={`${inputCls} resize-none`}
              />
            </div>
          </div>
        )}

        {/* Step 2: Select Node */}
        {step === 2 && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-8 space-y-6">
            <h2 className="text-xl font-semibold">🖨️ Select Maker Node</h2>
            {nodeId ? (
              <div className="p-4 border border-sky-500 bg-sky-900/20 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sky-400 font-medium">Node selected</p>
                    <p className="text-slate-400 text-sm font-mono">{nodeId}</p>
                  </div>
                  <button
                    onClick={() => setNodeId("")}
                    className="text-slate-400 hover:text-white text-sm"
                  >
                    Clear
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-6 border border-slate-700 rounded-lg text-center">
                <div className="text-3xl mb-3">🤖</div>
                <p className="text-slate-300 font-medium">Auto-match best maker</p>
                <p className="text-slate-500 text-sm mt-1">
                  We&apos;ll find the best available maker for your order
                </p>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Or enter a Node ID manually
              </label>
              <input
                type="text"
                value={nodeId}
                onChange={(e) => setNodeId(e.target.value)}
                placeholder="Paste node ID..."
                className={inputCls}
              />
            </div>
          </div>
        )}

        {/* Step 3: Address */}
        {step === 3 && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-8 space-y-6">
            <h2 className="text-xl font-semibold">📍 Delivery Address</h2>
            <textarea
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
              placeholder="Enter your full delivery address (min 5 characters)..."
              rows={4}
              className={`${inputCls} resize-none`}
            />
          </div>
        )}

        {/* Step 4: Confirm */}
        {step === 4 && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-8 space-y-4">
            <h2 className="text-xl font-semibold mb-2">✅ Order Summary</h2>
            <div className="divide-y divide-slate-800">
              <div className="flex justify-between py-3">
                <span className="text-slate-400">File</span>
                <span className="text-white">{fileName || "None"}</span>
              </div>
              <div className="flex justify-between py-3">
                <span className="text-slate-400">Material</span>
                <span className="text-white">{material}</span>
              </div>
              <div className="flex justify-between py-3">
                <span className="text-slate-400">Quantity</span>
                <span className="text-white">×{quantity}</span>
              </div>
              <div className="flex justify-between py-3">
                <span className="text-slate-400">Urgency</span>
                <span className={urgency === "express" ? "text-orange-400" : "text-white"}>
                  {urgency === "express" ? "⚡ Express" : "🕐 Normal"}
                </span>
              </div>
              <div className="flex justify-between py-3">
                <span className="text-slate-400">Node</span>
                <span className="text-white">{nodeId || "Auto-match"}</span>
              </div>
              <div className="flex justify-between py-3">
                <span className="text-slate-400">Address</span>
                <span className="text-white text-right max-w-xs">{deliveryAddress}</span>
              </div>
              {notes && (
                <div className="flex justify-between py-3">
                  <span className="text-slate-400">Notes</span>
                  <span className="text-slate-300 text-right max-w-xs">{notes}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex items-center justify-between mt-8">
          <button
            onClick={() => (step === 0 ? router.back() : setStep(step - 1))}
            className="px-5 py-2.5 text-slate-400 hover:text-slate-300 transition-colors"
          >
            ← {step === 0 ? "Cancel" : "Back"}
          </button>
          {step < 4 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={!canNext()}
              className="px-6 py-3 bg-sky-600 hover:bg-sky-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg font-medium transition-colors"
            >
              Next →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-8 py-3 bg-sky-600 hover:bg-sky-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg font-semibold transition-colors"
            >
              {submitting ? "Submitting..." : "🚀 Place Order"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
