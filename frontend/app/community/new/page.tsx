"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createCommunityPost } from "@/lib/api-client";
import { useAuthStore } from "@/stores/authStore";

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
  }
];

export default function NewPostPage() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

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
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

      const result = await createCommunityPost({
        title: formData.title.trim(),
        content: formData.content.trim(),
        post_type: selectedType as 'discussion' | 'request' | 'task' | 'showcase',
        tags,
        materials,
        budget,
        deadline,
      });
      
      if (result.success) {
        router.push(`/community/${result.post_id}`);
      } else {
        setError(result.error || "Failed to create post");
      }
    } catch (err) {
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
            <Link href="/" className="text-slate-300 hover:text-white transition-colors">
              Feed
            </Link>
            <Link href="/map" className="text-slate-300 hover:text-white transition-colors">
              Map
            </Link>
            <Link href="/community" className="text-slate-300 hover:text-white transition-colors">
              Community
            </Link>
            <Link href="/submit" className="text-slate-300 hover:text-white transition-colors">
              Submit
            </Link>
            <Link href="https://realworldclaw-api.fly.dev/docs" target="_blank" className="text-slate-300 hover:text-white transition-colors">
              Docs
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/community" className="text-slate-300 hover:text-white transition-colors">
              Cancel
            </Link>
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
                  Markdown supported. Be specific about your requirements, materials, or project details.
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
                <p className="text-xs text-slate-400 mt-2">
                  Add relevant tags to help others find your post
                </p>
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

              {selectedType === "showcase" && (
                <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-3">📸 Media Upload</h3>
                  <p className="text-slate-400 mb-4">
                    Upload images and files to showcase your project (Feature coming soon)
                  </p>
                  <div className="border-2 border-dashed border-slate-600 rounded-lg p-8 text-center">
                    <div className="text-4xl mb-2">📁</div>
                    <p className="text-slate-400">Image and file upload coming soon</p>
                    <p className="text-sm text-slate-500 mt-2">For now, include image URLs in your content</p>
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