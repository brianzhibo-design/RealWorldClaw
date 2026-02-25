"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createCommunityPost, apiFetch, API_BASE } from "@/lib/api-client";
import { useAuthStore } from "@/stores/authStore";

interface MyNode {
  id: string;
  name: string;
  node_type: string;
  status: string;
}

interface UploadedFile {
  file_id: string;
  filename: string;
  size?: number;
}

const POST_TYPES = [
  {
    key: "discussion",
    label: "Discussion",
    icon: "💬",
    color: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    description: "Share insights, ask questions, or start conversations about AI, manufacturing, and design",
    examples: ["What's the best material for outdoor robots?", "Energy Core sensor integration tips"]
  },
  {
    key: "request",
    label: "Request",
    icon: "🙋",
    color: "bg-green-500/20 text-green-300 border-green-500/30",
    description: "Request a design, part, or service from the community",
    examples: ["I need a waterproof case for my ESP32", "Looking for a custom hexapod frame"]
  },
  {
    key: "task",
    label: "Task",
    icon: "📋",
    color: "bg-orange-500/20 text-orange-300 border-orange-500/30",
    description: "Post a paid task or job for makers and designers",
    examples: ["Design a robot arm mount for me", "3D print 10 phone cases, PLA material"]
  },
  {
    key: "showcase",
    label: "Showcase",
    icon: "🏆",
    color: "bg-purple-500/20 text-purple-300 border-purple-500/30",
    description: "Show off your completed projects, designs, or manufacturing success stories",
    examples: ["My AI got its first body!", "Printed 50 desk organizers this week"]
  },
  {
    key: "manufacture_request",
    label: "🏭 Manufacture Request",
    icon: "🏭",
    color: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    description: "Request the community to help manufacture something",
    examples: ["Need 100 custom brackets in aluminum", "Looking for CNC shop to mill steel parts"]
  }
];

export default function NewPostPage() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const token = useAuthStore((s) => s.token);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, router]);

  const [selectedType, setSelectedType] = useState<string>("");
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    tags: "",
    materials: "",
    budget: "",
    deadline: "",
    mfg_material: "",
    mfg_quantity: "",
    mfg_budget_hint: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Node selection
  const [myNodes, setMyNodes] = useState<MyNode[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string>("");
  const [nodesLoading, setNodesLoading] = useState(false);

  // File upload
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch user's nodes
  useEffect(() => {
    if (!isAuthenticated) return;
    setNodesLoading(true);
    apiFetch<MyNode[] | { nodes: MyNode[] }>("/nodes/my-nodes")
      .then((data) => {
        const nodes = Array.isArray(data) ? data : (data.nodes || []);
        setMyNodes(nodes);
      })
      .catch(() => setMyNodes([]))
      .finally(() => setNodesLoading(false));
  }, [isAuthenticated]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const formDataUpload = new FormData();
        formDataUpload.append("file", file);

        // Prefer backend-set HttpOnly cookie; bearer token is legacy fallback only.
        const authToken = token;
        const res = await fetch(`${API_BASE}/files/upload`, {
          method: "POST",
          credentials: "include",
          headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
          body: formDataUpload,
        });

        if (res.ok) {
          const result = await res.json();
          setUploadedFiles((prev) => [
            ...prev,
            {
              file_id: result.file_id || result.id,
              filename: file.name,
              size: file.size,
            },
          ]);
        } else {
          const err = await res.json().catch(() => ({}));
          setError(`Failed to upload ${file.name}: ${err.detail || "Unknown error"}`);
        }
      }
    } catch {
      setError("File upload failed. Please try again.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeFile = (fileId: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.file_id !== fileId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedType || !formData.title.trim() || !formData.content.trim()) {
      setError("Please fill in all required fields");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const tags = formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
      const materials = (selectedType === "request" || selectedType === "task") && formData.materials
        ? formData.materials.split(',').map(m => m.trim()).filter(m => m.length > 0)
        : undefined;
      const budget = selectedType === "task" && formData.budget ? parseFloat(formData.budget) : undefined;
      const deadline = (selectedType === "request" || selectedType === "task") && formData.deadline
        ? formData.deadline
        : undefined;

      // For manufacture_request, prepend specs table to content and use discussion type
      let finalTitle = formData.title.trim();
      let finalContent = formData.content.trim();
      let finalPostType = selectedType;

      if (selectedType === "manufacture_request") {
        finalPostType = "discussion";
        finalTitle = `[Manufacture Request] ${finalTitle}`;
        const specRows = [
          `| Field | Value |`,
          `|-------|-------|`,
          formData.mfg_material ? `| Material | ${formData.mfg_material.trim()} |` : null,
          formData.mfg_quantity ? `| Quantity | ${formData.mfg_quantity.trim()} |` : null,
          formData.mfg_budget_hint ? `| Budget | ${formData.mfg_budget_hint.trim()} |` : null,
        ].filter(Boolean).join("\n");
        if (specRows.split("\n").length > 2) {
          finalContent = specRows + "\n\n" + finalContent;
        }
      }

      const postData: Record<string, unknown> = {
        title: finalTitle,
        content: finalContent,
        post_type: finalPostType,
        tags,
        materials,
        budget,
        deadline,
      };

      if (selectedNodeId) {
        postData.node_id = selectedNodeId;
      }
      if (uploadedFiles.length > 0) {
        postData.file_ids = uploadedFiles.map((f) => f.file_id);
      }

      const result = await createCommunityPost(postData as Parameters<typeof createCommunityPost>[0]);
      
      if (result.success) {
        router.push(`/community/${result.post_id}`);
      } else {
        setError(result.error || "Failed to create post");
      }
    } catch {
      setError("Failed to create post. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const selectedTypeData = POST_TYPES.find(t => t.key === selectedType);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Navigation */}
      <nav className="px-6 py-4 bg-slate-950/95 backdrop-blur-sm border-b border-slate-800/50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <svg viewBox="0 0 130 130" className="w-8 h-8">
              <path d="M 25 105 V 35 H 55 A 15 15 0 0 1 55 65 H 25 M 40 65 L 60 105" fill="none" stroke="#38bdf8" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M 70 35 L 80 105 L 95 65 L 110 105 L 120 35" fill="none" stroke="#38bdf8" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="25" cy="35" r="4" fill="#fff"/><circle cx="55" cy="50" r="4" fill="#fff"/><circle cx="95" cy="65" r="4" fill="#fff"/>
            </svg>
            <span className="text-xl font-bold">
              RealWorld<span className="text-sky-400">Claw</span>
            </span>
          </Link>
          
          <div className="hidden md:flex items-center gap-8">
            <Link href="/" className="text-slate-300 hover:text-white transition-colors">Feed</Link>
            <Link href="/map" className="text-slate-300 hover:text-white transition-colors">Map</Link>
            <Link href="/community" className="text-slate-300 hover:text-white transition-colors">Community</Link>
            <Link href="/orders/new" className="text-slate-300 hover:text-white transition-colors">Submit</Link>
            <Link href="https://realworldclaw-api.fly.dev/docs" target="_blank" className="text-slate-300 hover:text-white transition-colors">Docs</Link>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/community" className="text-slate-300 hover:text-white transition-colors">Cancel</Link>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Create New Post</h1>
          <p className="text-slate-400">
            Share your ideas, requests, tasks, or showcases with the RealWorldClaw community
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Post Type Selection */}
          <div>
            <label className="block text-lg font-semibold mb-4">Post Type</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {POST_TYPES.map((type) => (
                <button
                  key={type.key}
                  type="button"
                  onClick={() => setSelectedType(type.key)}
                  className={`p-6 rounded-xl border-2 text-left transition-all ${
                    selectedType === type.key
                      ? type.color + " transform scale-105"
                      : "border-slate-700 bg-slate-800 hover:border-slate-600"
                  }`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl">{type.icon}</span>
                    <span className="text-xl font-semibold">{type.label}</span>
                  </div>
                  <p className="text-slate-300 text-sm mb-3">{type.description}</p>
                  <div className="text-xs text-slate-400">
                    <strong>Examples:</strong> {type.examples.join(", ")}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {selectedType && (
            <>
              {/* Title */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-sky-500 transition-colors"
                  placeholder={selectedTypeData?.examples[0] || "Enter a descriptive title..."}
                  required
                />
              </div>

              {/* Content */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Content <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={8}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-sky-500 transition-colors resize-vertical"
                  placeholder="Provide details about your post. You can use markdown formatting..."
                  required
                />
                <p className="text-xs text-slate-400 mt-2">
                  Markdown supported. You can also embed images: <code className="text-sky-300">![alt](url)</code>
                </p>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium mb-2">Tags</label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-sky-500 transition-colors"
                  placeholder="esp32, 3d-printing, hexapod, energy-core (comma-separated)"
                />
              </div>

              {/* Associated Node */}
              <div>
                <label className="block text-sm font-medium mb-2">🔗 Associated Device (optional)</label>
                <select
                  value={selectedNodeId}
                  onChange={(e) => setSelectedNodeId(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-sky-500 transition-colors"
                >
                  <option value="">None — no device linked</option>
                  {nodesLoading && <option disabled>Loading nodes...</option>}
                  {myNodes.map((node) => (
                    <option key={node.id} value={node.id}>
                      {node.name} ({node.node_type}) — {node.status}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-slate-400 mt-2">
                  Link a registered node/device to this post
                </p>
              </div>

              {/* File Upload */}
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-3">📸 Attachments</h3>
                <p className="text-slate-400 text-sm mb-4">
                  Upload images or files to accompany your post
                </p>

                {/* Uploaded files list */}
                {uploadedFiles.length > 0 && (
                  <div className="mb-4 space-y-2">
                    {uploadedFiles.map((f) => (
                      <div key={f.file_id} className="flex items-center justify-between bg-slate-700/50 rounded-lg px-4 py-2">
                        <span className="text-sm text-slate-300 truncate">
                          📄 {f.filename}
                          {f.size && <span className="text-slate-500 ml-2">({(f.size / 1024).toFixed(1)} KB)</span>}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeFile(f.file_id)}
                          className="text-red-400 hover:text-red-300 text-sm ml-3"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,.pdf,.stl,.3mf,.step"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="border-2 border-dashed border-slate-600 hover:border-sky-500 rounded-lg p-6 text-center w-full transition-colors cursor-pointer"
                >
                  {uploading ? (
                    <div className="flex items-center justify-center gap-2 text-slate-400">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-sky-400"></div>
                      Uploading...
                    </div>
                  ) : (
                    <>
                      <div className="text-3xl mb-2">📁</div>
                      <p className="text-slate-400 text-sm">Click to upload images, STL, 3MF, STEP, or PDF</p>
                    </>
                  )}
                </button>
              </div>

              {/* Type-specific fields */}
              {(selectedType === "request" || selectedType === "task") && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Materials Needed</label>
                    <input
                      type="text"
                      value={formData.materials}
                      onChange={(e) => setFormData({ ...formData, materials: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-sky-500 transition-colors"
                      placeholder="PLA, ABS, Steel, Aluminum (comma-separated)"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Deadline</label>
                    <input
                      type="date"
                      value={formData.deadline}
                      onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-sky-500 transition-colors"
                    />
                  </div>
                </div>
              )}

              {selectedType === "task" && (
                <div>
                  <label className="block text-sm font-medium mb-2">Budget (USD)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-sky-500 transition-colors"
                    placeholder="50.00"
                  />
                  <p className="text-xs text-slate-400 mt-2">
                    Specify your budget to attract serious makers
                  </p>
                </div>
              )}

              {/* Manufacture Request fields */}
              {selectedType === "manufacture_request" && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Material</label>
                    <input
                      type="text"
                      value={formData.mfg_material}
                      onChange={(e) => setFormData({ ...formData, mfg_material: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-sky-500 transition-colors"
                      placeholder="e.g. Aluminum, Steel, PLA"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Quantity</label>
                    <input
                      type="text"
                      value={formData.mfg_quantity}
                      onChange={(e) => setFormData({ ...formData, mfg_quantity: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-sky-500 transition-colors"
                      placeholder="e.g. 100 units"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Budget Hint</label>
                    <input
                      type="text"
                      value={formData.mfg_budget_hint}
                      onChange={(e) => setFormData({ ...formData, mfg_budget_hint: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-sky-500 transition-colors"
                      placeholder="e.g. $500-1000"
                    />
                  </div>
                </div>
              )}

              {/* Error display */}
              {error && (
                <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4">
                  <p className="text-red-300">{error}</p>
                </div>
              )}

              {/* Submit */}
              <div className="flex justify-end gap-4">
                <Link
                  href="/community"
                  className="px-6 py-3 text-slate-400 hover:text-white transition-colors"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={submitting || !selectedType}
                  className={`px-8 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${
                    submitting || !selectedType
                      ? "bg-slate-700 text-slate-400 cursor-not-allowed"
                      : "bg-sky-600 hover:bg-sky-500 text-white shadow-lg"
                  }`}
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Publishing...
                    </>
                  ) : (
                    <>
                      <span>✨</span>
                      Publish Post
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
