"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

const DEVICE_TYPES = [
  { value: "3d_printer", label: "3D Printer", icon: "🖨️" },
  { value: "cnc_mill", label: "CNC Mill", icon: "🔧" },
  { value: "laser_cutter", label: "Laser Cutter", icon: "⚡" },
  { value: "other", label: "Other", icon: "🛠️" },
];

const MATERIALS = [
  "PLA", "ABS", "PETG", "TPU", "Nylon", "Resin", 
  "Wood", "Metal", "Acrylic", "Fabric", "Other"
];

export default function RegisterNodePage() {
  const router = useRouter();
  
  // Form state
  const [deviceType, setDeviceType] = useState("3d_printer");
  const [deviceName, setDeviceName] = useState("");
  const [buildVolumeX, setBuildVolumeX] = useState("");
  const [buildVolumeY, setBuildVolumeY] = useState("");
  const [buildVolumeZ, setBuildVolumeZ] = useState("");
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>(["PLA"]);
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if user is authenticated
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  
  if (!token) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔐</div>
          <h2 className="text-xl font-bold mb-2">Authentication Required</h2>
          <p className="text-slate-400 mb-6">Please sign in to register your manufacturing node</p>
          <a
            href="/auth/login"
            className="inline-block px-6 py-3 bg-sky-600 hover:bg-sky-500 text-white rounded-lg font-medium transition-colors"
          >
            Sign In →
          </a>
        </div>
      </div>
    );
  }

  const handleMaterialToggle = (material: string) => {
    setSelectedMaterials(prev => 
      prev.includes(material) 
        ? prev.filter(m => m !== material)
        : [...prev, material]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!deviceName.trim()) {
      setError("Device name is required");
      return;
    }

    if (!buildVolumeX || !buildVolumeY || !buildVolumeZ) {
      setError("Build volume dimensions are required");
      return;
    }

    if (selectedMaterials.length === 0) {
      setError("Please select at least one supported material");
      return;
    }

    if (!location.trim()) {
      setError("Location is required");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(`${API_URL}/nodes/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          device_type: deviceType,
          device_name: deviceName.trim(),
          build_volume: {
            x: parseInt(buildVolumeX),
            y: parseInt(buildVolumeY),
            z: parseInt(buildVolumeZ),
          },
          supported_materials: selectedMaterials,
          location: location.trim(),
          description: description.trim() || undefined,
        }),
      });

      if (response.ok) {
        const node = await response.json();
        router.push(`/dashboard?registered=${node.id}`);
      } else {
        const errorData = await response.json();
        setError(errorData.detail || "Failed to register node");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const selectedDeviceType = DEVICE_TYPES.find(t => t.value === deviceType);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="border-b border-slate-800">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <span>🏭</span> Register Manufacturing Node
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Share your manufacturing capabilities with the RealWorldClaw network
          </p>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Info banner */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4 mb-8">
          <div className="flex items-start gap-3">
            <span className="text-sky-400 text-xl">🛡️</span>
            <div className="text-sm">
              <div className="font-medium text-white mb-1">Privacy Notice</div>
              <div className="text-slate-300">
                Your exact location will be automatically blurred for privacy protection. 
                Only approximate distance will be shown to potential customers.
              </div>
            </div>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/50 border border-red-800 rounded-lg text-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Device Type */}
          <div>
            <label className="block text-sm font-medium mb-4">Device Type *</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {DEVICE_TYPES.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setDeviceType(type.value)}
                  className={`p-4 rounded-lg border transition-colors text-center ${
                    deviceType === type.value
                      ? "border-sky-600 bg-sky-600/20 text-sky-400"
                      : "border-slate-700 hover:border-slate-600 text-slate-300"
                  }`}
                >
                  <div className="text-2xl mb-2">{type.icon}</div>
                  <div className="text-sm font-medium">{type.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Device Name */}
          <div>
            <label className="block text-sm font-medium mb-2">Device Name *</label>
            <input
              type="text"
              value={deviceName}
              onChange={(e) => setDeviceName(e.target.value)}
              placeholder="e.g., My Bambu Lab X1 Carbon"
              className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-600 focus:border-transparent"
              required
            />
          </div>

          {/* Build Volume */}
          <div>
            <label className="block text-sm font-medium mb-2">Build Volume (mm) *</label>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Length (X)</label>
                <input
                  type="number"
                  min="1"
                  value={buildVolumeX}
                  onChange={(e) => setBuildVolumeX(e.target.value)}
                  placeholder="256"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-600 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Width (Y)</label>
                <input
                  type="number"
                  min="1"
                  value={buildVolumeY}
                  onChange={(e) => setBuildVolumeY(e.target.value)}
                  placeholder="256"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-600 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Height (Z)</label>
                <input
                  type="number"
                  min="1"
                  value={buildVolumeZ}
                  onChange={(e) => setBuildVolumeZ(e.target.value)}
                  placeholder="256"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-600 focus:border-transparent"
                  required
                />
              </div>
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Example: 256 × 256 × 256 mm for a Bambu Lab A1 mini
            </div>
          </div>

          {/* Supported Materials */}
          <div>
            <label className="block text-sm font-medium mb-4">Supported Materials * (select all that apply)</label>
            <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
              {MATERIALS.map((material) => (
                <label
                  key={material}
                  className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedMaterials.includes(material)
                      ? "border-sky-600 bg-sky-600/20 text-sky-400"
                      : "border-slate-700 hover:border-slate-600 text-slate-300"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedMaterials.includes(material)}
                    onChange={() => handleMaterialToggle(material)}
                    className="sr-only"
                  />
                  <span className="text-sm font-medium">{material}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium mb-2">Location *</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g., San Francisco, CA or 37.7749,-122.4194"
              className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-600 focus:border-transparent"
              required
            />
            <div className="text-xs text-slate-400 mt-1">
              City name or coordinates. This will be automatically blurred for privacy.
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-2">Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell makers about your setup, specialties, or any special capabilities..."
              rows={4}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-600 focus:border-transparent resize-none"
            />
          </div>

          {/* Summary */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
            <h3 className="font-medium mb-4 flex items-center gap-2">
              <span>{selectedDeviceType?.icon}</span>
              Registration Summary
            </h3>
            <div className="space-y-2 text-sm text-slate-300">
              <div>
                <span className="text-slate-400">Device:</span> {deviceName || "Not specified"}
              </div>
              <div>
                <span className="text-slate-400">Type:</span> {selectedDeviceType?.label}
              </div>
              <div>
                <span className="text-slate-400">Build Volume:</span> {buildVolumeX}×{buildVolumeY}×{buildVolumeZ} mm
              </div>
              <div>
                <span className="text-slate-400">Materials:</span> {selectedMaterials.join(", ") || "None selected"}
              </div>
              <div>
                <span className="text-slate-400">Location:</span> {location || "Not specified"}
              </div>
            </div>
          </div>

          {/* Submit button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="px-8 py-3 bg-sky-600 hover:bg-sky-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg font-medium transition-colors"
            >
              {submitting ? "Registering..." : "Register My Node →"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}