"use client";

import { useState, useEffect, useCallback } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

interface Post {
  id: string;
  title: string;
  author: string;
  created_at: string;
  type: "design" | "showcase" | "discussion";
  preview_image?: string;
  comment_count: number;
}

const POST_TYPES = [
  { key: "", label: "All" },
  { key: "design", label: "Design Shares" },
  { key: "showcase", label: "Showcases" },
  { key: "discussion", label: "Discussions" },
];

export default function CommunityPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeType, setActiveType] = useState("");

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/community/posts?type=${activeType}&page=1&limit=20`);
      if (response.ok) {
        const data = await response.json();
        setPosts(Array.isArray(data) ? data : data.posts || []);
      } else {
        setPosts([]);
      }
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

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "design": return "🎨";
      case "showcase": return "✨";
      case "discussion": return "💬";
      default: return "📝";
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
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/90 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <span>🌟</span> Community
              </h1>
              <p className="text-slate-400 text-sm mt-1">
                Share designs, showcase creations, and connect with makers
              </p>
            </div>
            <a
              href="/community/new"
              className="px-4 py-2 bg-sky-600 hover:bg-sky-500 rounded-md text-sm font-medium transition-colors"
            >
              New Post
            </a>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Filter tabs */}
        <div className="flex space-x-1 bg-slate-900 rounded-lg p-1 mb-8">
          {POST_TYPES.map((type) => (
            <button
              key={type.key}
              onClick={() => setActiveType(type.key)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeType === type.key
                  ? "bg-sky-600 text-white"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>

        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-slate-400">Loading posts...</div>
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
        {!loading && !error && posts.length === 0 && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🚀</div>
            <h2 className="text-xl font-bold mb-2">No posts yet</h2>
            <p className="text-slate-400 mb-4 max-w-md mx-auto">
              Be the first to share your design or manufacturing story!
            </p>
            <a
              href="/community/new"
              className="inline-block px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg transition-colors font-medium"
            >
              Share Your Story →
            </a>
          </div>
        )}

        {/* Posts grid */}
        {!loading && !error && posts.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <a
                key={post.id}
                href={`/community/${post.id}`}
                className="block bg-slate-900 border border-slate-800 rounded-lg overflow-hidden hover:border-slate-700 hover:bg-slate-800/50 transition-all duration-200 group"
              >
                {/* Preview image */}
                {post.preview_image && (
                  <div className="aspect-video bg-slate-800 overflow-hidden">
                    <img
                      src={post.preview_image}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                  </div>
                )}

                <div className="p-4">
                  {/* Type badge */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-sm">{getTypeIcon(post.type)}</span>
                    <span className="px-2 py-1 bg-slate-800 text-slate-300 rounded-full text-xs font-medium uppercase tracking-wide">
                      {post.type}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="font-semibold text-white line-clamp-2 mb-3 group-hover:text-sky-400 transition-colors">
                    {post.title}
                  </h3>

                  {/* Meta */}
                  <div className="flex items-center justify-between text-sm text-slate-400">
                    <div className="flex items-center gap-2">
                      <span>👤 {post.author}</span>
                      <span>·</span>
                      <span>{formatTimeAgo(post.created_at)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span>💬</span>
                      <span>{post.comment_count}</span>
                    </div>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}