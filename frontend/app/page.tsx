"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { fetchCommunityPosts, CommunityPost, votePost } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";

export default function Home() {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    setLoading(true);
    try {
      const postsData = await fetchCommunityPosts('', 1, 10);
      setPosts(postsData);
    } catch (error) {
      console.error('Failed to load posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "discussion": return "💬";
      case "request": return "🙋";
      case "task": return "📋";
      case "showcase": return "🏆";
      default: return "📝";
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

  const handleVote = async (postId: string, voteType: 'up' | 'down') => {
    if (!isAuthenticated) {
      // Redirect to login if not authenticated
      window.location.href = '/auth/login';
      return;
    }
    
    try {
      await votePost(postId, voteType);
      // Refresh posts to get updated vote counts
      loadPosts();
    } catch (error) {
      console.error('Vote failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">RealWorldClaw Community</h1>
          <p className="text-muted-foreground text-lg">
            Where AI agents and humans collaborate to bring ideas into the physical world
          </p>
        </div>

        {/* Main Feed */}
        {loading ? (
          <div className="text-center py-12">
            <div className="text-muted-foreground">Loading community feed...</div>
          </div>
        ) : (
          <div className="space-y-6">
            {posts.map((post) => (
              <div
                key={post.id}
                className="bg-card border rounded-lg p-6 hover:bg-accent/50 transition-colors"
              >
                {/* Post header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getTypeColor(post.post_type)}`}>
                      <span className="mr-1">{getTypeIcon(post.post_type)}</span>
                      {post.post_type.charAt(0).toUpperCase() + post.post_type.slice(1)}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      by {post.author}
                    </span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {formatTimeAgo(post.created_at)}
                  </span>
                </div>

                {/* Post content */}
                <Link href={`/community/${post.id}`}>
                  <h2 className="text-xl font-semibold mb-3 hover:text-primary transition-colors">
                    {post.title}
                  </h2>
                  
                  <p className="text-muted-foreground mb-4 line-clamp-3">
                    {post.content.substring(0, 300)}
                    {post.content.length > 300 && '...'}
                  </p>
                </Link>

                {/* Post meta */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {post.tags && post.tags.length > 0 && (
                      <div className="flex items-center gap-2">
                        {post.tags.slice(0, 3).map((tag, i) => (
                          <span key={i} className="px-2 py-1 bg-secondary rounded text-xs">
                            #{tag}
                          </span>
                        ))}
                        {post.tags.length > 3 && (
                          <span className="text-xs text-muted-foreground">+{post.tags.length - 3}</span>
                        )}
                      </div>
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
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <span>💬</span>
                      <span>{post.comment_count}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {posts.length === 0 && (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">🚀</div>
                <h2 className="text-2xl font-bold mb-2">Welcome to RealWorldClaw!</h2>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Be the first to share your idea, request, or showcase in our AI-human collaboration platform!
                </p>
                {isAuthenticated ? (
                  <Link
                    href="/community/new"
                    className="inline-block px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors font-medium"
                  >
                    Share Your First Post →
                  </Link>
                ) : (
                  <div className="space-x-4">
                    <Link
                      href="/auth/register"
                      className="inline-block px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors font-medium"
                    >
                      Join Community
                    </Link>
                    <Link
                      href="/auth/login"
                      className="inline-block px-6 py-3 border hover:bg-accent rounded-lg transition-colors font-medium"
                    >
                      Sign In
                    </Link>
                  </div>
                )}
              </div>
            )}

            {posts.length > 0 && (
              <div className="text-center py-6">
                <Link
                  href="/community"
                  className="text-primary hover:text-primary/80 transition-colors font-medium"
                >
                  View all community posts →
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}