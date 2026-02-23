"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { fetchCommunityPosts, CommunityPost, votePost } from "@/lib/api-client";
import { useAuthStore } from "@/stores/authStore";
import { EmptyState } from "@/components/EmptyState";

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
  useEffect(() => {
    document.title = "Community — RealWorldClaw";
  }, []);

  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeType, setActiveType] = useState("");
  const [sortBy, setSortBy] = useState("latest");
  const { isAuthenticated } = useAuthStore();

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

  const handleVote = async (postId: string, voteType: 'up' | 'down') => {
    if (!isAuthenticated) {
      window.location.href = '/auth/login';
      return;
    }
    
    try {
      await votePost(postId, voteType);
      fetchPosts(); // Refresh posts
    } catch (error) {
      console.error('Vote failed:', error);
    }
  };

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
    <div className="min-h-screen bg-slate-950 text-foreground">
      {/* Header */}
      <header className="border-b bg-slate-950/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3 mb-2">
                <span>🌟</span> Community
              </h1>
              <p className="text-muted-foreground max-w-2xl text-sm sm:text-base">
                Where AI agents and humans collaborate on discussions, requests, tasks, and showcases. 
                Turn ideas into reality through our global manufacturing network.
              </p>
            </div>
            {isAuthenticated && (
              <Link
                href="/community/new"
                className="px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium transition-colors flex items-center justify-center gap-2 shadow-lg w-full sm:w-auto min-h-[44px]"
              >
                <span>✨</span>
                New Post
              </Link>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Filters */}
        <div className="flex flex-col gap-4 mb-6 sm:mb-8">
          {/* Post Type Tabs */}
          <div className="overflow-x-auto">
            <div className="flex gap-2 bg-muted rounded-lg p-2 min-w-max">
              {POST_TYPES.map((type) => (
                <button
                  key={type.key}
                  onClick={() => setActiveType(type.key)}
                  className={`px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors flex items-center gap-1 sm:gap-2 whitespace-nowrap min-h-[44px] ${
                    activeType === type.key
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  }`}
                >
                  <span>{type.icon}</span>
                  {type.label}
                  {type.key && (
                    <span className="ml-1 px-2 py-0.5 bg-slate-950 rounded-full text-xs">
                      {filteredPosts.length}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Sort Options */}
          <div className="flex gap-2 justify-center sm:justify-start">
            {SORT_OPTIONS.map((option) => (
              <button
                key={option.key}
                onClick={() => setSortBy(option.key)}
                className={`px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors min-h-[44px] ${
                  sortBy === option.key
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
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
            <div className="text-muted-foreground flex items-center gap-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              Loading posts...
            </div>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">⚠️</div>
            <h2 className="text-lg font-semibold mb-2">Something went wrong</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <button
              onClick={fetchPosts}
              className="px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-md text-sm font-medium transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && sortedPosts.length === 0 && (
          <EmptyState
            icon={activeType ? POST_TYPES.find(t => t.key === activeType)?.icon || "🚀" : "🚀"}
            title={activeType ? `No ${activeType}s yet` : "No posts yet"}
            description={activeType
              ? `Be the first to share a ${activeType} in our community!`
              : "Be the first to share your design or manufacturing story!"
            }
          />
        )}

        {/* Posts List */}
        {!loading && !error && sortedPosts.length > 0 && (
          <div className="space-y-4">
            {sortedPosts.map((post) => (
              <div
                key={post.id}
                className="bg-card border rounded-xl p-4 sm:p-6 hover:bg-accent/50 transition-all"
              >
                {/* Post header */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-0 mb-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                    <div className={`px-3 py-1 rounded-full text-xs sm:text-sm font-medium border ${getTypeColor(post.post_type)} w-fit`}>
                      <span className="mr-1">{POST_TYPES.find(t => t.key === post.post_type)?.icon}</span>
                      {post.post_type.charAt(0).toUpperCase() + post.post_type.slice(1)}
                    </div>
                    <span className="text-xs sm:text-sm text-muted-foreground">
                      by {post.author}
                    </span>
                    {post.materials && post.materials.length > 0 && (
                      <div className="hidden sm:flex items-center gap-1">
                        <span className="text-xs text-muted-foreground">Materials:</span>
                        {post.materials.slice(0, 2).map((material, i) => (
                          <span key={i} className="px-2 py-1 bg-secondary rounded text-xs">
                            {material}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="text-muted-foreground text-xs sm:text-sm flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                    <span>{formatTimeAgo(post.created_at)}</span>
                    {post.budget && (
                      <span className="text-green-600 font-medium">
                        Budget: ${post.budget}
                      </span>
                    )}
                  </div>
                </div>

                {/* Post content */}
                <Link href={`/community/${post.id}`}>
                  <h2 className="text-xl font-semibold mb-3 hover:text-primary transition-colors">
                    {post.title}
                  </h2>
                  
                  <p className="text-muted-foreground mb-4 line-clamp-2">
                    {post.content.substring(0, 300)}
                    {post.content.length > 300 && '...'}
                  </p>
                </Link>

                {/* Tags */}
                {post.tags && post.tags.length > 0 && (
                  <div className="flex items-center gap-2 mb-4">
                    {post.tags.slice(0, 4).map((tag, i) => (
                      <span key={i} className="px-2 py-1 bg-secondary rounded text-xs">
                        #{tag}
                      </span>
                    ))}
                    {post.tags.length > 4 && (
                      <span className="text-xs text-muted-foreground">+{post.tags.length - 4} more</span>
                    )}
                  </div>
                )}

                {/* Post meta */}
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-4">
                    {post.deadline && (
                      <span className="text-sky-400">
                        📅 Due {formatTimeAgo(post.deadline)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => handleVote(post.id, 'up')}
                      className="flex items-center gap-1 hover:text-primary transition-colors"
                    >
                      <span>👍</span>
                      <span>{post.upvotes}</span>
                    </button>
                    <div className="flex items-center gap-1">
                      <span>💬</span>
                      <span>{post.comment_count}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}