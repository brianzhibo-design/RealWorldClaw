"use client";
import { API_BASE as API_URL } from "@/lib/api";

import { useState } from "react";
import { useRouter } from "next/navigation";


const EQUIPMENT_TYPES = [
  { id: "3d_printer", name: "3D Printer", icon: "🖨️" },
  { id: "cnc", name: "CNC Machine", icon: "⚒️" },
  { id: "laser_cutter", name: "Laser Cutter", icon: "⚡" },
  { id: "injection_molding", name: "Injection Molding", icon: "🏭" },
  { id: "other", name: "Other", icon: "🔧" }
];

const MATERIALS = [
  "PLA", "PETG", "ABS", "TPU", "Resin", "Wood", "Metal", "Acrylic", "Carbon Fiber"
];

const COUNTRIES = [
  "United States", "China", "Germany", "Japan", "United Kingdom", "France", 
  "Canada", "Australia", "Netherlands", "Italy", "Other"
];

export default function MakerRegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    makerName: "",
    description: "",
    equipmentTypes: [] as string[],
    availableMaterials: [] as string[],
    city: "",
    country: "United States",
    contactEmail: "",
    contactPhone: "",
    website: "",
    experience: "",
    minOrderQuantity: 1,
    maxOrderQuantity: 100,
    specialties: ""
  });
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check auth
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  if (!token) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔐</div>
          <h2 className="text-xl font-bold mb-2">Authentication Required</h2>
          <p className="text-slate-400 mb-6">Please sign in to register as a maker</p>
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

  const handleEquipmentToggle = (equipmentId: string) => {
    setFormData(prev => ({
      ...prev,
      equipmentTypes: prev.equipmentTypes.includes(equipmentId)
        ? prev.equipmentTypes.filter(t => t !== equipmentId)
        : [...prev.equipmentTypes, equipmentId]
    }));
  };

  const handleMaterialToggle = (material: string) => {
    setFormData(prev => ({
      ...prev,
      availableMaterials: prev.availableMaterials.includes(material)
        ? prev.availableMaterials.filter(m => m !== material)
        : [...prev.availableMaterials, material]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.makerName.trim()) {
      setError("Please enter your maker name");
      return;
    }

    if (formData.equipmentTypes.length === 0) {
      setError("Please select at least one equipment type");
      return;
    }

    if (formData.availableMaterials.length === 0) {
      setError("Please select at least one available material");
      return;
    }

    if (!formData.city.trim()) {
      setError("Please enter your city");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const registrationData = {
        name: formData.makerName.trim(),
        description: formData.description.trim() || undefined,
        equipment_types: formData.equipmentTypes,
        available_materials: formData.availableMaterials.map(m => m.toLowerCase()),
        location: {
          city: formData.city.trim(),
          country: formData.country
        },
        contact_info: {
          email: formData.contactEmail.trim() || undefined,
          phone: formData.contactPhone.trim() || undefined,
          website: formData.website.trim() || undefined
        },
        experience: formData.experience.trim() || undefined,
        min_order_quantity: formData.minOrderQuantity,
        max_order_quantity: formData.maxOrderQuantity,
        specialties: formData.specialties.trim() || undefined
      };

      const response = await fetch(`${API_URL}/makers/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(registrationData)
      });

      if (response.ok) {
        const result = await response.json();
        // Success! Redirect to dashboard
        router.push('/dashboard');
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Registration failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="border-b border-slate-800">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <span>👨‍🔧</span> Register as a Maker
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Join our network of manufacturing professionals
          </p>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-900/50 border border-red-800 rounded-lg text-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <span>📝</span> Basic Information
            </h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Maker Name *
                </label>
                <input
                  type="text"
                  value={formData.makerName}
                  onChange={(e) => setFormData(prev => ({ ...prev, makerName: e.target.value }))}
                  placeholder="Your business or professional name"
                  required
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-600 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Tell potential customers about your services, quality, and experience..."
                  rows={4}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-600 focus:border-transparent resize-none"
                />
              </div>
            </div>
          </div>

          {/* Equipment & Capabilities */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <span>🔧</span> Equipment & Capabilities
            </h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-3">
                  Equipment Types *
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {EQUIPMENT_TYPES.map((equipment) => (
                    <label
                      key={equipment.id}
                      className={`flex items-center p-4 rounded-lg border cursor-pointer transition-colors ${
                        formData.equipmentTypes.includes(equipment.id)
                          ? 'border-sky-500 bg-sky-900/20'
                          : 'border-slate-700 hover:border-slate-600 hover:bg-slate-800/50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={formData.equipmentTypes.includes(equipment.id)}
                        onChange={() => handleEquipmentToggle(equipment.id)}
                        className="sr-only"
                      />
                      <div className="text-2xl mr-3">{equipment.icon}</div>
                      <div className="font-medium">{equipment.name}</div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-3">
                  Available Materials *
                </label>
                <div className="flex flex-wrap gap-2">
                  {MATERIALS.map((material) => (
                    <button
                      key={material}
                      type="button"
                      onClick={() => handleMaterialToggle(material)}
                      className={`px-3 py-2 text-sm rounded-full transition-colors ${
                        formData.availableMaterials.includes(material)
                          ? 'bg-sky-600 text-white'
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      {formData.availableMaterials.includes(material) && "✓ "}
                      {material}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Min Order Quantity
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.minOrderQuantity}
                    onChange={(e) => setFormData(prev => ({ ...prev, minOrderQuantity: parseInt(e.target.value) || 1 }))}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-sky-600 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Max Order Quantity
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.maxOrderQuantity}
                    onChange={(e) => setFormData(prev => ({ ...prev, maxOrderQuantity: parseInt(e.target.value) || 100 }))}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-sky-600 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <span>📍</span> Location
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  City *
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                  placeholder="New York"
                  required
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-600 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Country *
                </label>
                <select
                  value={formData.country}
                  onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-sky-600 focus:border-transparent"
                >
                  {COUNTRIES.map(country => (
                    <option key={country} value={country}>{country}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <span>📞</span> Contact Information
            </h2>
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) => setFormData(prev => ({ ...prev, contactEmail: e.target.value }))}
                    placeholder="your@email.com"
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-600 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.contactPhone}
                    onChange={(e) => setFormData(prev => ({ ...prev, contactPhone: e.target.value }))}
                    placeholder="+1 (555) 123-4567"
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-600 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Website
                </label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                  placeholder="https://your-website.com"
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-600 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <span>💡</span> Additional Information
            </h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Experience
                </label>
                <textarea
                  value={formData.experience}
                  onChange={(e) => setFormData(prev => ({ ...prev, experience: e.target.value }))}
                  placeholder="Describe your experience, certifications, or notable projects..."
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-600 focus:border-transparent resize-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Specialties
                </label>
                <textarea
                  value={formData.specialties}
                  onChange={(e) => setFormData(prev => ({ ...prev, specialties: e.target.value }))}
                  placeholder="Any special techniques, finishing options, or unique capabilities..."
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-600 focus:border-transparent resize-none"
                />
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 text-slate-400 hover:text-slate-300 transition-colors"
            >
              ← Cancel
            </button>
            
            <button
              type="submit"
              disabled={submitting || formData.equipmentTypes.length === 0 || formData.availableMaterials.length === 0}
              className="px-8 py-3 bg-sky-600 hover:bg-sky-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg font-medium transition-colors"
            >
              {submitting ? "Registering..." : "Register as Maker →"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}