"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { API_BASE } from "@/lib/api-client";

interface SearchResult {
  type: "post" | "node";
  id: string;
  title: string;
  name: string;
  snippet: string;
  author_id?: string;
  tags?: string;
  created_at?: string;
  metadata?: Record<string, string | number | boolean | null>;
}

interface SearchResponse {
  results: SearchResult[];
  total: number;
  query: string;
  page: number;
  limit: number;
}

function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams?.get("q") || "";

  const [searchQuery, setSearchQuery] = useState(query);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "post" | "node">("all");

  const doSearch = useCallback(async (q: string, type: "all" | "post" | "node") => {
    if (!q.trim()) {
      setResults([]);
      setTotal(0);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/search?q=${encodeURIComponent(q)}&type=${type}&limit=50`);
      if (!res.ok) throw new Error(`Search failed: ${res.status}`);
      const data: SearchResponse = await res.json();
      setResults(data.results);
      setTotal(data.total);
    } catch (err) {
      console.error("Search error:", err);
      setError("Failed to search. Please try again.");
      setResults([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      doSearch(searchQuery, activeTab);
    }, 300); // debounce
    return () => clearTimeout(timer);
  }, [searchQuery, activeTab, doSearch]);

  const formatTimeAgo = (dateString?: string) => {
    if (!dateString) return "";
    const diff = Date.now() - new Date(dateString).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return "Just now";
  };

  const postCount = results.filter(r => r.type === "post").length;
  const nodeCount = results.filter(r => r.type === "node").length;

  return (
    <div className="bg-slate-950 min-h-screen text-white">
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Search Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">Search</h1>
          <div className="relative">
            <input
              type="text"
              placeholder="Search posts and nodes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 pl-10 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent text-lg"
              autoFocus
            />
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">🔍</div>
          </div>
          {searchQuery && !loading && (
            <p className="text-slate-400 mt-2">{total} result{total !== 1 ? "s" : ""} for &quot;{searchQuery}&quot;</p>
          )}
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-4 border-b border-slate-700 mb-8">
          {([
            { key: "all", label: `All (${total})` },
            { key: "post", label: `Posts (${postCount})` },
            { key: "node", label: `Nodes (${nodeCount})` },
          ] as const).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`px-4 py-2 border-b-2 transition-colors font-medium ${
                activeTab === key
                  ? "border-sky-500 text-sky-400"
                  : "border-transparent text-slate-400 hover:text-white"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Results */}
        {loading ? (
          <div className="text-center py-12 text-slate-400">Searching...</div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-400 mb-4">{error}</p>
            <button onClick={() => doSearch(searchQuery, activeTab)} className="px-4 py-2 bg-sky-600 hover:bg-sky-500 rounded-lg text-white">
              Retry
            </button>
          </div>
        ) : results.length > 0 ? (
          <div className="space-y-4">
            {results.map((result) => (
              <Link
                key={`${result.type}-${result.id}`}
                href={result.type === "post" ? `/community/${result.id}` : `/map`}
                className="block bg-slate-800 border border-slate-700 rounded-xl p-5 hover:border-slate-600 transition-all group"
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    result.type === "post"
                      ? "bg-sky-900/50 text-sky-300 border border-sky-700"
                      : "bg-emerald-900/50 text-emerald-300 border border-emerald-700"
                  }`}>
                    {result.type === "post" ? "📝 Post" : "🖨️ Node"}
                  </span>
                  {result.created_at && (
                    <span className="text-slate-500 text-sm">{formatTimeAgo(result.created_at)}</span>
                  )}
                  {result.metadata?.status && (
                    <span className={`text-xs ${result.metadata.status === "online" ? "text-green-400" : "text-slate-500"}`}>
                      ● {result.metadata.status}
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-semibold group-hover:text-sky-400 transition-colors mb-1">
                  {result.title || result.name}
                </h3>
                {result.snippet && (
                  <p className="text-slate-400 text-sm line-clamp-2">{result.snippet}</p>
                )}
                {result.metadata?.node_type && (
                  <p className="text-slate-500 text-xs mt-2">Type: {result.metadata.node_type}</p>
                )}
              </Link>
            ))}
          </div>
        ) : searchQuery ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">🔍</div>
            <p className="text-slate-400 text-lg">No results found for &quot;{searchQuery}&quot;</p>
            <p className="text-slate-500 mt-2">Try different keywords or check the spelling</p>
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">🔍</div>
            <p className="text-slate-400 text-lg">Enter a search term to find posts and manufacturing nodes</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="bg-slate-950 min-h-screen text-white flex items-center justify-center">Loading...</div>}>
      <SearchContent />
    </Suspense>
  );
}
