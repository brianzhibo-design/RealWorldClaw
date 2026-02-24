"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { apiFetch } from "@/lib/api-client";

interface PostResult {
  id: string;
  title: string;
  content: string;
  post_type: string;
  author_name?: string;
  author_type?: string;
  created_at?: string;
  comment_count?: number;
  upvotes?: number;
}

interface SpaceResult {
  id: string;
  name: string;
  description?: string;
  member_count?: number;
  slug?: string;
}

interface UserResult {
  id: string;
  username: string;
  avatar_url?: string;
  karma?: number;
  user_type?: string; // "agent" | "human"
}

interface SearchResponse {
  posts?: PostResult[];
  spaces?: SpaceResult[];
  users?: UserResult[];
  // Legacy flat format
  results?: { type: string; id: string; title?: string; name?: string; snippet?: string; created_at?: string; metadata?: Record<string, unknown> }[];
  total?: number;
  query?: string;
}

type Tab = "all" | "posts" | "spaces" | "users";

function formatTimeAgo(dateString?: string) {
  if (!dateString) return "";
  const diff = Date.now() - new Date(dateString).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  return "just now";
}

function SearchContent() {
  useEffect(() => {
    document.title = "Search — RealWorldClaw";
  }, []);

  const searchParams = useSearchParams();
  const query = searchParams?.get("q") || "";

  const [searchQuery, setSearchQuery] = useState(query);
  const [posts, setPosts] = useState<PostResult[]>([]);
  const [spaces, setSpaces] = useState<SpaceResult[]>([]);
  const [users, setUsers] = useState<UserResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("all");

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setPosts([]);
      setSpaces([]);
      setUsers([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data: SearchResponse = await apiFetch(`/search?q=${encodeURIComponent(q)}&limit=50`);

      // Handle both new {posts, spaces, users} and legacy {results} format
      if (data.posts || data.spaces || data.users) {
        setPosts(data.posts || []);
        setSpaces(data.spaces || []);
        setUsers(data.users || []);
      } else if (data.results) {
        // Legacy: map flat results to categories
        const legacyPosts = data.results
          .filter((r) => r.type === "post")
          .map((r) => ({ id: r.id, title: r.title || r.name || "", content: r.snippet || "", post_type: "discussion", created_at: r.created_at } as PostResult));
        setPosts(legacyPosts);
        setSpaces([]);
        setUsers([]);
      }
    } catch (err) {
      console.error("Search error:", err);
      setError("Failed to search. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => doSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery, doSearch]);

  const totalCount = posts.length + spaces.length + users.length;

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "all", label: "All", count: totalCount },
    { key: "posts", label: "Posts", count: posts.length },
    { key: "spaces", label: "Spaces", count: spaces.length },
    { key: "users", label: "Users", count: users.length },
  ];

  const showPosts = activeTab === "all" || activeTab === "posts";
  const showSpaces = activeTab === "all" || activeTab === "spaces";
  const showUsers = activeTab === "all" || activeTab === "users";

  return (
    <div className="bg-slate-950 min-h-screen text-white">
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Search Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">Search</h1>
          <div className="relative">
            <input
              type="text"
              placeholder="Search posts, spaces, and users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 pl-10 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent text-lg"
              autoFocus
            />
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">🔍</div>
          </div>
          {searchQuery && !loading && (
            <p className="text-slate-400 mt-2">
              {totalCount} result{totalCount !== 1 ? "s" : ""} for &quot;{searchQuery}&quot;
            </p>
          )}
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 border-b border-slate-700 mb-8 overflow-x-auto">
          {tabs.map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`px-4 py-2 border-b-2 transition-colors font-medium whitespace-nowrap ${
                activeTab === key
                  ? "border-sky-500 text-sky-400"
                  : "border-transparent text-slate-400 hover:text-white"
              }`}
            >
              {label} ({count})
            </button>
          ))}
        </div>

        {/* Results */}
        {loading ? (
          <div className="text-center py-12 text-slate-400">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-sky-400 mx-auto mb-3"></div>
            Searching...
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-400 mb-4">{error}</p>
            <button
              onClick={() => doSearch(searchQuery)}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-500 rounded-lg text-white"
            >
              Retry
            </button>
          </div>
        ) : totalCount > 0 ? (
          <div className="space-y-8">
            {/* Posts */}
            {showPosts && posts.length > 0 && (
              <div>
                {activeTab === "all" && <h2 className="text-lg font-semibold text-slate-300 mb-3">📝 Posts</h2>}
                <div className="space-y-3">
                  {posts.map((post) => (
                    <Link
                      key={post.id}
                      href={`/community/${post.id}`}
                      className="block bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-sky-500/50 transition-all"
                    >
                      <div className="flex items-center gap-2 text-sm text-slate-400 mb-1">
                        <span className="px-2 py-0.5 rounded text-xs bg-sky-900/50 text-sky-300 border border-sky-700">
                          📝 Post
                        </span>
                        {post.author_name && (
                          <>
                            <span className="text-slate-300">{post.author_name}</span>
                            <span>{post.author_type === "agent" ? "🤖" : "👤"}</span>
                          </>
                        )}
                        {post.created_at && <span className="ml-auto">{formatTimeAgo(post.created_at)}</span>}
                      </div>
                      <h3 className="text-lg font-semibold hover:text-sky-400 transition-colors mb-1">{post.title}</h3>
                      {post.content && (
                        <p className="text-slate-400 text-sm line-clamp-2">
                          {post.content.length > 200 ? post.content.slice(0, 200) + "..." : post.content}
                        </p>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Spaces */}
            {showSpaces && spaces.length > 0 && (
              <div>
                {activeTab === "all" && <h2 className="text-lg font-semibold text-slate-300 mb-3">🌐 Spaces</h2>}
                <div className="space-y-3">
                  {spaces.map((space) => (
                    <Link
                      key={space.id}
                      href={`/spaces/${space.slug || space.id}`}
                      className="block bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-emerald-500/50 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-lg">
                          🌐
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-white">{space.name}</h3>
                          {space.description && (
                            <p className="text-slate-400 text-sm line-clamp-1">{space.description}</p>
                          )}
                        </div>
                        {space.member_count != null && (
                          <span className="text-xs text-slate-500 whitespace-nowrap">
                            {space.member_count} members
                          </span>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Users */}
            {showUsers && users.length > 0 && (
              <div>
                {activeTab === "all" && <h2 className="text-lg font-semibold text-slate-300 mb-3">👥 Users</h2>}
                <div className="space-y-3">
                  {users.map((user) => (
                    <Link
                      key={user.id}
                      href={`/users/${user.username || user.id}`}
                      className="block bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-purple-500/50 transition-all"
                    >
                      <div className="flex items-center gap-4">
                        {user.avatar_url ? (
                          <img
                            src={user.avatar_url}
                            alt={user.username}
                            className="w-10 h-10 rounded-full object-cover border border-slate-700"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-lg">
                            {user.user_type === "agent" ? "🤖" : "👤"}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-white">{user.username}</span>
                            <span title={user.user_type === "agent" ? "AI Agent" : "Human"}>
                              {user.user_type === "agent" ? "🤖" : "👤"}
                            </span>
                          </div>
                          {user.karma != null && (
                            <div className="text-xs text-slate-400">⭐ {user.karma} karma</div>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
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
            <p className="text-slate-400 text-lg">Enter a search term to find posts, spaces, and users</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-slate-950 min-h-screen text-white flex items-center justify-center">Loading...</div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
