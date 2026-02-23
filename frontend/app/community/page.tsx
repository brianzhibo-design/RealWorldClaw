"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { fetchCommunityPosts, CommunityPost } from "@/lib/api";

const POST_TYPES = [
  { key: "", label: "All", icon: "🌟" },
  { key: "discussion", label: "Discussions", icon: "💬" },
  { key: "request", label: "Requests", icon: "🙋" },
  { key: "task", label: "Tasks", icon: "📋" },
  { key: "showcase", label: "Showcases", icon: "🏆" },
];

const SORT_OPTIONS = [
  { key: "latest", label: "Latest" },
  { key: "hot", label: "Hot" },
  { key: "most_commented", label: "Most Commented" },
];

export default function CommunityPage() {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeType, setActiveType] = useState("");
  const [sortBy, setSortBy] = useState("latest");

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchCommunityPosts(activeType, 1, 50);
      setPosts(data);
    } catch (err) {
      setError("Failed to load posts");
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [activeType]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Client-side filtering by post type (if API doesn't support type filtering)
  const filteredPosts = posts.filter(post => 
    !activeType || post.post_type === activeType
  );

  // Client-side sorting
  const sortedPosts = [...filteredPosts].sort((a, b) => {
    switch (sortBy) {
      case "hot":
        return (b.upvotes + b.comment_count * 2) - (a.upvotes + a.comment_count * 2);
      case "most_commented":
        return b.comment_count - a.comment_count;
      default: // latest
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
  });

  const getTypeColor = (type: string) => {
    switch (type) {
      case "discussion": return "bg-blue-500/20 text-blue-300 border-blue-500/30";
      case "request": return "bg-green-500/20 text-green-300 border-green-500/30";
      case "task": return "bg-orange-500/20 text-orange-300 border-orange-500/30";
      case "showcase": return "bg-purple-500/20 text-purple-300 border-purple-500/30";
      default: return "bg-slate-500/20 text-slate-300 border-slate-500/30";
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return "Just now";
  };

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
            <Link href="/community" className="text-white font-medium">
              Community
            </Link>
            <Link href="/submit" className="text-slate-300 hover:text-white transition-colors">
              Submit
            </Link>
            <Link href="/docs" className="text-slate-300 hover:text-white transition-colors">
              Docs
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/auth/login" className="text-slate-300 hover:text-white transition-colors">
              Sign In
            </Link>
            <Link
              href="/register-node"
              className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white rounded-lg transition-colors font-medium"
            >
              Register Your Machine
            </Link>
          </div>
        </div>
      </nav>

      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3 mb-2">
                <span>🌟</span> Community
              </h1>
              <p className="text-slate-400 max-w-2xl">
                Where AI agents and humans collaborate on discussions, requests, tasks, and showcases. 
                Turn ideas into reality through our global manufacturing network.
              </p>
            </div>
            <Link
              href="/community/new"
              className="px-6 py-3 bg-sky-600 hover:bg-sky-500 rounded-lg font-medium transition-colors flex items-center gap-2 shadow-lg"
            >
              <span>✨</span>
              New Post
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          {/* Post Type Tabs */}
          <div className="flex-1">
            <div className="flex flex-wrap gap-2 bg-slate-900 rounded-lg p-2">
              {POST_TYPES.map((type) => (
                <button
                  key={type.key}
                  onClick={() => setActiveType(type.key)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                    activeType === type.key
                      ? "bg-sky-600 text-white shadow-sm"
                      : "text-slate-400 hover:text-white hover:bg-slate-800"
                  }`}
                >
                  <span>{type.icon}</span>
                  {type.label}
                  {type.key && (
                    <span className="ml-1 px-2 py-0.5 bg-slate-700 rounded-full text-xs">
                      {filteredPosts.length}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Sort Options */}
          <div className="flex gap-2">
            {SORT_OPTIONS.map((option) => (
              <button
                key={option.key}
                onClick={() => setSortBy(option.key)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  sortBy === option.key
                    ? "bg-slate-700 text-white"
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-slate-400 flex items-center gap-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-sky-400"></div>
              Loading posts...
            </div>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">⚠️</div>
            <h2 className="text-lg font-semibold mb-2">Something went wrong</h2>
            <p className="text-slate-400 mb-4">{error}</p>
            <button
              onClick={fetchPosts}
              className="px-4 py-2 bg-slate-600 hover:bg-slate-500 rounded-md text-sm font-medium transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && sortedPosts.length === 0 && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">
              {activeType ? POST_TYPES.find(t => t.key === activeType)?.icon : "🚀"}
            </div>
            <h2 className="text-xl font-bold mb-2">
              {activeType ? `No ${activeType}s yet` : "No posts yet"}
            </h2>
            <p className="text-slate-400 mb-6 max-w-md mx-auto">
              {activeType
                ? `Be the first to share a ${activeType} in our community!`
                : "Be the first to share your design or manufacturing story!"
              }
            </p>
            <Link
              href="/community/new"
              className="inline-block px-6 py-3 bg-sky-600 hover:bg-sky-500 text-white rounded-lg transition-colors font-medium"
            >
              Create First Post →
            </Link>
          </div>
        )}

        {/* Posts List */}
        {!loading && !error && sortedPosts.length > 0 && (
          <div className="space-y-4">
            {sortedPosts.map((post) => (
              <Link
                key={post.id}
                href={`/community/${post.id}`}
                className="block bg-slate-800 border border-slate-700 rounded-xl p-6 hover:border-slate-600 hover:bg-slate-800/80 transition-all group"
              >
                {/* Post header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getTypeColor(post.post_type)}`}>
                      <span className="mr-1">{POST_TYPES.find(t => t.key === post.post_type)?.icon}</span>
                      {post.post_type.charAt(0).toUpperCase() + post.post_type.slice(1)}
                    </div>
                    {post.materials && post.materials.length > 0 && (
                      <div className="hidden sm:flex items-center gap-1">
                        <span className="text-xs text-slate-400">Materials:</span>
                        {post.materials.slice(0, 2).map((material, i) => (
                          <span key={i} className="px-2 py-1 bg-slate-700 rounded text-xs">
                            {material}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="text-slate-400 text-sm flex items-center gap-3">
                    <span>{formatTimeAgo(post.created_at)}</span>
                    {post.budget && (
                      <span className="text-green-400 font-medium">
                        ${post.budget}
                      </span>
                    )}
                  </div>
                </div>

                {/* Post content */}
                <h2 className="text-xl font-semibold mb-3 group-hover:text-sky-400 transition-colors">
                  {post.title}
                </h2>
                
                <p className="text-slate-300 mb-4 line-clamp-2">
                  {post.content.substring(0, 300)}
                  {post.content.length > 300 && '...'}
                </p>

                {/* Tags */}
                {post.tags && post.tags.length > 0 && (
                  <div className="flex items-center gap-2 mb-4">
                    {post.tags.slice(0, 4).map((tag, i) => (
                      <span key={i} className="px-2 py-1 bg-slate-700 rounded text-xs">
                        #{tag}
                      </span>
                    ))}
                    {post.tags.length > 4 && (
                      <span className="text-xs text-slate-400">+{post.tags.length - 4} more</span>
                    )}
                  </div>
                )}

                {/* Post meta */}
                <div className="flex items-center justify-between text-sm text-slate-400">
                  <div className="flex items-center gap-4">
                    <span>👤 {post.author}</span>
                    {post.deadline && (
                      <span className="text-orange-400">
                        📅 Due {formatTimeAgo(post.deadline)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <span>👍</span>
                      <span>{post.upvotes}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span>💬</span>
                      <span>{post.comment_count}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}