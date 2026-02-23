"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

const MATERIALS = ["PLA", "PETG", "ABS", "TPU", "Resin"];
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
  const [selectedFileId, setSelectedFileId] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    material: "PLA",
    quantity: 1,
    color: "",
    notes: ""
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check auth
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  useEffect(() => {
    if (!token) {
      router.push('/auth/login');
      return;
    }

    const fetchFiles = async () => {
      try {
        const response = await fetch(`${API_URL}/files/my`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.ok) {
          const data = await response.json();
          setFiles(Array.isArray(data) ? data : data.files || []);
          if (data.length > 0) {
            setSelectedFileId(data[0].id);
          }
        } else if (response.status === 401) {
          localStorage.removeItem('token');
          router.push('/auth/login');
        } else {
          setError('Failed to load files');
        }
      } catch (err) {
        setError('Network error. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchFiles();
  }, [token, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFileId) {
      setError("Please select a file");
      return;
    }

    if (!formData.title.trim()) {
      setError("Please enter a title");
      return;
    }

    if (formData.quantity < 1) {
      setError("Quantity must be at least 1");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          file_id: selectedFileId,
          title: formData.title.trim(),
          description: formData.description.trim() || undefined,
          material: formData.material.toLowerCase(),
          quantity: formData.quantity,
          color: formData.color.trim() || undefined,
          notes: formData.notes.trim() || undefined
        })
      });

      if (response.ok) {
        const order = await response.json();
        router.push(`/orders/${order.id}`);
      } else {
        const errorData = await response.json();
        setError(errorData.detail || "Failed to create order");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="border-b border-slate-800">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <span>⚡</span> Create Order
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Create a manufacturing order from your uploaded files
          </p>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-900/50 border border-red-800 rounded-lg text-red-200">
            {error}
          </div>
        )}

        {files.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📁</div>
            <h2 className="text-xl font-bold mb-2">No uploaded files</h2>
            <p className="text-slate-400 mb-6">
              You need to upload a design file first before creating an order
            </p>
            <a
              href="/submit"
              className="inline-flex items-center gap-2 px-6 py-3 bg-sky-600 hover:bg-sky-500 text-white rounded-lg font-medium transition-colors"
            >
              <span>🚀</span>
              Upload Design File
            </a>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* File Selection */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span>📄</span> Select File
              </h2>
              <div className="space-y-3">
                {files.map((file) => (
                  <label
                    key={file.id}
                    className={`flex items-center p-4 rounded-lg border cursor-pointer transition-colors ${
                      selectedFileId === file.id
                        ? 'border-sky-500 bg-sky-900/20'
                        : 'border-slate-700 hover:border-slate-600 hover:bg-slate-800/50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="file"
                      value={file.id}
                      checked={selectedFileId === file.id}
                      onChange={(e) => setSelectedFileId(e.target.value)}
                      className="sr-only"
                    />
                    <div className={`w-4 h-4 rounded-full border-2 mr-3 flex items-center justify-center ${
                      selectedFileId === file.id ? 'border-sky-500' : 'border-slate-500'
                    }`}>
                      {selectedFileId === file.id && (
                        <div className="w-2 h-2 bg-sky-500 rounded-full"></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-white truncate">{file.filename}</div>
                      <div className="text-sm text-slate-400">
                        {formatFileSize(file.size)} • Uploaded {formatDate(file.created_at)}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-slate-800">
                <a
                  href="/submit"
                  className="text-sky-400 hover:text-sky-300 text-sm flex items-center gap-1"
                >
                  <span>+</span> Upload another file
                </a>
              </div>
            </div>

            {/* Order Details */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span>⚙️</span> Order Details
              </h2>
              <div className="space-y-6">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Give your order a descriptive title"
                    required
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-600 focus:border-transparent"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe what you're making (optional)"
                    rows={3}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-600 focus:border-transparent resize-none"
                  />
                </div>

                {/* Material and Quantity */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Material *
                    </label>
                    <select
                      value={formData.material}
                      onChange={(e) => setFormData(prev => ({ ...prev, material: e.target.value }))}
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-sky-600 focus:border-transparent"
                    >
                      {MATERIALS.map(material => (
                        <option key={material} value={material}>{material}</option>
                      ))}
                    </select>
                    <p className="text-xs text-slate-500 mt-1">
                      Material availability depends on the maker
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Quantity *
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={formData.quantity}
                      onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-sky-600 focus:border-transparent"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      How many copies to print
                    </p>
                  </div>
                </div>

                {/* Color */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Color (optional)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <input
                      type="text"
                      value={formData.color}
                      onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                      placeholder="e.g. Red, Blue, or leave blank"
                      className="flex-1 min-w-0 px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-600 focus:border-transparent"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {COLORS.map(color => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, color }))}
                        className={`px-3 py-1 text-xs rounded-full transition-colors ${
                          formData.color === color
                            ? 'bg-sky-600 text-white'
                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                        }`}
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Special Instructions (optional)
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Any special requirements, finish preferences, or other notes for the maker..."
                    rows={4}
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
                disabled={submitting || !selectedFileId || !formData.title.trim()}
                className="px-6 py-3 bg-sky-600 hover:bg-sky-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg font-medium transition-colors"
              >
                {submitting ? "Creating Order..." : "Create Order →"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}