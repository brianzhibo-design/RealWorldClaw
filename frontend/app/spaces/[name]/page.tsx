"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { apiFetch } from "@/lib/api-client";
import { useAuthStore } from "@/stores/authStore";

export default function SpacePage() {
  const params = useParams();
  const spaceName = params?.name as string;
  
  const [space, setSpace] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortType, setSortType] = useState<'hot' | 'new' | 'top'>('hot');
  const [isMember, setIsMember] = useState(false);
  const [joinLoading, setJoinLoading] = useState(false);
  const [toastError, setToastError] = useState<string | null>(null);
  const currentUser = useAuthStore((s) => s.user);

  useEffect(() => {
    if (!spaceName) return;
    
    const loadSpaceData = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await apiFetch(`/spaces/${spaceName}`);
        const spaceData = data.space || data;
        setSpace(spaceData);
        setPosts(data.posts || []);
        setIsMember(spaceData.is_member || false);
      } catch (err) {
        console.error('Failed to fetch space data:', err);
        setError('Failed to load space. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    loadSpaceData();
  }, [spaceName]);

  const showErrorToast = (message: string) => {
    setToastError(message);
    setTimeout(() => setToastError(null), 3000);
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

  if (loading) {
    return (
      <div className="bg-slate-950 text-white flex items-center justify-center py-20">
        <div className="text-slate-400">Loading space...</div>
      </div>
    );
  }

  if (error || !space) {
    return (
      <div className="bg-slate-950 text-white flex items-center justify-center py-20">
        <div className="text-center">
          <div className="text-6xl mb-4">❓</div>
          <h1 className="text-2xl font-bold mb-2">Space Not Found</h1>
          <p className="text-slate-400 mb-4">{error || "The space you're looking for doesn't exist."}</p>
          <Link
            href="/spaces"
            className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white rounded-lg transition-colors"
          >
            Browse All Spaces
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-950 text-white">
      {toastError && (
        <div className="max-w-7xl mx-auto px-6 pt-4">
          <div className="p-3 bg-red-900/50 border border-red-800 rounded-lg text-red-200 text-sm">{toastError}</div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Space Header */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-8 mb-8">
          <div className="flex items-start gap-6">
            <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-3xl flex-shrink-0">
              {space.icon || '📁'}
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold mb-2">{space.display_name}</h1>
                  <p className="text-slate-300 text-lg leading-relaxed">
                    {space.description}
                  </p>
                </div>
                {currentUser && (
                  <button
                    onClick={async () => {
                      setJoinLoading(true);
                      try {
                        if (isMember) {
                          await apiFetch(`/spaces/${spaceName}/leave`, { method: "DELETE" });
                          setIsMember(false);
                        } else {
                          await apiFetch(`/spaces/${spaceName}/join`, { method: "POST" });
                          setIsMember(true);
                        }
                      } catch (err) {
                        showErrorToast(err instanceof Error ? err.message : "Action failed");
                      } finally {
                        setJoinLoading(false);
                      }
                    }}
                    disabled={joinLoading}
                    className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                      isMember
                        ? "bg-slate-700 hover:bg-slate-600 text-white"
                        : "bg-sky-600 hover:bg-sky-500 text-white"
                    } ${joinLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    {joinLoading ? "..." : isMember ? "Leave Space" : "Join Space"}
                  </button>
                )}
              </div>
              
              {/* Stats */}
              <div className="flex items-center gap-6 text-sm text-slate-400">
                <span>👥 {space.member_count || 0} members</span>
                <span>📝 {posts.length} posts</span>
                <span>📊 Active</span>
              </div>
            </div>
          </div>
        </div>

        {/* Posts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3">
            {/* Sort Tabs */}
            <div className="mb-6">
              <div className="flex items-center gap-4 border-b border-slate-700">
                {[
                  { key: 'hot', label: '🔥 Hot' },
                  { key: 'new', label: '🆕 New' },
                  { key: 'top', label: '⬆️ Top' }
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setSortType(key as 'hot' | 'new' | 'top')}
                    className={`px-4 py-2 border-b-2 transition-colors font-medium ${
                      sortType === key
                        ? 'border-sky-500 text-sky-400'
                        : 'border-transparent text-slate-400 hover:text-white hover:border-slate-600'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {posts.length > 0 ? (
              <div className="space-y-6">
                {posts.map((post) => (
                  <Link
                    key={post.id}
                    href={`/community/${post.id}`}
                    className="block bg-slate-800 border border-slate-700 rounded-xl p-6 hover:border-slate-600 hover:bg-slate-800/80 transition-all group"
                  >
                    {/* Post header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getTypeColor(post.post_type || 'discussion')}`}>
                          <span className="mr-1">{getTypeIcon(post.post_type || 'discussion')}</span>
                          {(post.post_type || 'discussion').charAt(0).toUpperCase() + (post.post_type || 'discussion').slice(1)}
                        </div>
                      </div>
                      <div className="text-slate-400 text-sm">
                        {formatTimeAgo(post.created_at)}
                      </div>
                    </div>

                    {/* Post content */}
                    <h2 className="text-xl font-semibold mb-3 group-hover:text-sky-400 transition-colors">
                      {post.title}
                    </h2>
                    
                    <p className="text-slate-300 mb-4 line-clamp-2">
                      {post.content?.substring(0, 200)}
                      {post.content?.length > 200 && '...'}
                    </p>

                    {/* Post meta */}
                    <div className="flex items-center justify-between text-sm text-slate-400">
                      <div className="flex items-center gap-4">
                        <span>👤 {post.author_name || 'Anonymous'}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <span>👍</span>
                          <span>{post.upvotes || 0}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span>💬</span>
                          <span>{post.comment_count || 0}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">{space.icon || '📁'}</div>
                <h2 className="text-xl font-bold mb-2">No posts yet</h2>
                <p className="text-slate-400 mb-4">
                  Be the first to start a discussion in {space.display_name}!
                </p>
                <Link
                  href="/community/new"
                  className="inline-block px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg transition-colors font-medium"
                >
                  Create First Post
                </Link>
              </div>
            )}
          </div>

          {/* Right Sidebar */}
          <div className="lg:col-span-1">
            <div className="space-y-6">
              {/* Space Rules */}
              <div className="bg-slate-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4">Space Rules</h3>
                <div className="space-y-2 text-sm text-slate-300">
                  <div>• Be respectful and constructive</div>
                  <div>• Stay on-topic</div>
                  <div>• Share knowledge freely</div>
                  <div>• Help others learn and grow</div>
                </div>
              </div>

              {/* Space Info */}
              <div className="bg-slate-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4">About</h3>
                <div className="space-y-2 text-sm text-slate-300">
                  <div>Created: {space.created_at ? new Date(space.created_at).toLocaleDateString() : 'N/A'}</div>
                  <div>Type: {space.space_type || 'Community'}</div>
                  {space.rules && (
                    <div>
                      <div className="font-medium mb-1">Rules:</div>
                      <div className="text-slate-400">{space.rules}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}