"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { apiFetch, getErrorMessage } from "@/lib/api-client";
import { EmptyState } from "@/components/EmptyState";

interface SpaceItem {
  id: string;
  name: string;
  display_name: string;
  icon?: string;
  member_count?: number;
  description?: string;
}

function CreateSpaceSection({ onCreated }: { onCreated: () => void }) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError(null);
    try {
      await apiFetch("/spaces", {
        method: "POST",
        body: JSON.stringify({ name, display_name: name, description }),
      });
      onCreated();
      setShowForm(false);
      setName("");
      setDescription("");
    } catch (err) {
      setError(getErrorMessage(err, "Unable to create space. Please review the form and try again."));
      setTimeout(() => setError(null), 3000);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="mt-12 text-center">
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-8">
        {!showForm ? (
          <>
            <div className="text-4xl mb-4">➕</div>
            <h3 className="text-lg font-semibold mb-2">Create Your Own Space</h3>
            <p className="text-slate-400 mb-4">Have an idea for a new community space?</p>
            <button
              onClick={() => setShowForm(true)}
              className="px-6 py-2 bg-sky-600 hover:bg-sky-500 hover:shadow-[0_0_18px_rgba(56,189,248,0.35)] text-white rounded-lg transition-all font-medium"
            >
              Create Space
            </button>
          </>
        ) : (
          <form onSubmit={handleCreate} className="max-w-md mx-auto space-y-4 text-left">
            <h3 className="text-lg font-semibold text-center mb-4">Create New Space</h3>
            {error && (
              <div className="p-3 bg-red-900/50 border border-red-800 rounded-lg text-red-200 text-sm">{error}</div>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="e.g. 3d-printing-tips"
                className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={3}
                placeholder="What is this space about?"
                className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-600 resize-none"
              />
            </div>
            <div className="flex gap-3 justify-center">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 bg-slate-700 hover:bg-sky-500 hover:shadow-[0_0_18px_rgba(56,189,248,0.35)] text-white rounded-lg transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creating}
                className="px-6 py-2 bg-sky-600 hover:bg-sky-500 hover:shadow-[0_0_18px_rgba(56,189,248,0.35)] disabled:opacity-50 text-white rounded-lg transition-all font-medium"
              >
                {creating ? "Creating..." : "Create"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default function SpacesPage() {
  const [spaces, setSpaces] = useState<SpaceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSpaces = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<{ spaces?: SpaceItem[] }>("/spaces");
      setSpaces(data.spaces || []);
    } catch (err) {
      console.error("Failed to fetch spaces:", err);
      setError(getErrorMessage(err, "Unable to load spaces. Please check your network and retry."));
      setTimeout(() => setError(null), 3000);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    document.title = "Spaces — RealWorldClaw";
  }, []);

  useEffect(() => {
    fetchSpaces();
  }, [fetchSpaces]);

  return (
    <div className="bg-slate-950 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Spaces</h1>
          <p className="text-slate-400">Browse community spaces and discussions</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-900/50 border border-red-800 rounded-lg text-red-200 text-sm">{error}</div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="text-slate-400">Loading spaces...</div>
          </div>
        ) : spaces.length === 0 ? (
          <EmptyState
            icon="🏢"
            title="No spaces available"
            description="Browse community spaces and discussions when they become available"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {spaces.map((space) => (
              <Link href={`/spaces/${space.name}`} key={space.id}
                className="bg-slate-900 border border-slate-800 rounded-lg p-4 hover:border-sky-500/50 transition-colors">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">{space.icon}</span>
                  <div>
                    <h3 className="font-semibold text-white">{space.display_name}</h3>
                    <p className="text-sm text-slate-400">{space.member_count} members</p>
                  </div>
                </div>
                <p className="text-sm text-slate-400 line-clamp-2">{space.description}</p>
              </Link>
            ))}
          </div>
        )}

        <CreateSpaceSection onCreated={fetchSpaces} />
      </div>
    </div>
  );
}
