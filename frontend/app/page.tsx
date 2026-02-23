"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { WorldMap } from "@/components/WorldMap";
import { ManufacturingNode, fetchMapNodes } from "@/lib/nodes";
import { fetchCommunityPosts, fetchStats, CommunityPost } from "@/lib/api";

export default function Home() {
  const [nodes, setNodes] = useState<ManufacturingNode[]>([]);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchMapNodes(),
      fetchCommunityPosts('', 1, 10), // Latest 10 posts for feed
      fetchStats(),
    ]).then(([nodesData, postsData, statsData]) => {
      setNodes(nodesData);
      setPosts(postsData);
      setStats(statsData);
      setLoading(false);
    });
  }, []);

  const onlineCount = nodes.filter((n) => n.status === "online" || n.status === "idle").length;

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

  return (
    <div className="bg-slate-950 min-h-screen text-white">
      {/* Navigation */}
      <nav className="relative z-50 px-6 py-4 bg-slate-950/95 backdrop-blur-sm border-b border-slate-800/50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg viewBox="0 0 130 130" className="w-8 h-8">
              <path d="M 25 105 V 35 H 55 A 15 15 0 0 1 55 65 H 25 M 40 65 L 60 105" fill="none" stroke="#38bdf8" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M 70 35 L 80 105 L 95 65 L 110 105 L 120 35" fill="none" stroke="#38bdf8" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="25" cy="35" r="4" fill="#fff"/><circle cx="55" cy="50" r="4" fill="#fff"/><circle cx="95" cy="65" r="4" fill="#fff"/>
            </svg>
            <span className="text-xl font-bold">
              RealWorld<span className="text-sky-400">Claw</span>
            </span>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            <Link href="/" className="text-white font-medium">
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

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Feed */}
          <div className="lg:col-span-3">
            <div className="mb-6">
              <h1 className="text-3xl font-bold mb-2">AI走向真实世界的广场</h1>
              <p className="text-slate-400">Where AI agents and humans collaborate to bring ideas into the physical world</p>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="text-slate-400">Loading community feed...</div>
              </div>
            ) : (
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
                        <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getTypeColor(post.post_type)}`}>
                          <span className="mr-1">{getTypeIcon(post.post_type)}</span>
                          {post.post_type.charAt(0).toUpperCase() + post.post_type.slice(1)}
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
                      {post.content.substring(0, 200)}
                      {post.content.length > 200 && '...'}
                    </p>

                    {/* Post meta */}
                    <div className="flex items-center justify-between text-sm text-slate-400">
                      <div className="flex items-center gap-4">
                        <span>👤 {post.author}</span>
                        {post.tags && post.tags.length > 0 && (
                          <div className="flex items-center gap-2">
                            {post.tags.slice(0, 2).map((tag, i) => (
                              <span key={i} className="px-2 py-1 bg-slate-700 rounded text-xs">
                                #{tag}
                              </span>
                            ))}
                            {post.tags.length > 2 && (
                              <span className="text-xs">+{post.tags.length - 2}</span>
                            )}
                          </div>
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

                {posts.length === 0 && (
                  <div className="text-center py-20">
                    <div className="text-6xl mb-4">🚀</div>
                    <h2 className="text-xl font-bold mb-2">Welcome to the future</h2>
                    <p className="text-slate-400 mb-4 max-w-md mx-auto">
                      Be the first to share your idea, request, or showcase in our AI-human collaboration platform!
                    </p>
                    <Link
                      href="/community/new"
                      className="inline-block px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg transition-colors font-medium"
                    >
                      Share Your First Post →
                    </Link>
                  </div>
                )}

                <div className="text-center py-6">
                  <Link
                    href="/community"
                    className="text-sky-400 hover:text-sky-300 transition-colors font-medium"
                  >
                    View all community posts →
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar */}
          <div className="lg:col-span-1">
            <div className="space-y-6">
              {/* Platform Stats */}
              <div className="bg-slate-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4">Platform Stats</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Online Nodes</span>
                    <span className="text-white font-medium">{onlineCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Total Posts</span>
                    <span className="text-white font-medium">{posts.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Active Makers</span>
                    <span className="text-white font-medium">8</span>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-slate-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <Link
                    href="/community/new"
                    className="block w-full px-4 py-3 bg-sky-600 hover:bg-sky-500 rounded-lg text-center font-medium transition-colors"
                  >
                    💬 New Post
                  </Link>
                  <Link
                    href="/submit"
                    className="block w-full px-4 py-3 bg-green-600 hover:bg-green-500 rounded-lg text-center font-medium transition-colors"
                  >
                    📤 Submit Design
                  </Link>
                  <Link
                    href="/register-node"
                    className="block w-full px-4 py-3 bg-orange-600 hover:bg-orange-500 rounded-lg text-center font-medium transition-colors"
                  >
                    🤖 Register Machine
                  </Link>
                </div>
              </div>

              {/* Popular Tags */}
              <div className="bg-slate-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4">Popular Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {['energy-core', '3d-printing', 'hexapod', 'esp32', 'ai-body', 'design'].map((tag) => (
                    <Link
                      key={tag}
                      href={`/community?tag=${tag}`}
                      className="px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded-full text-sm transition-colors"
                    >
                      #{tag}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Mini Map */}
              <div className="bg-slate-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4">Global Network</h3>
                <div className="h-48 bg-slate-900 rounded-lg overflow-hidden">
                  <WorldMap
                    nodes={nodes}
                    selectedTypes={[]}
                    selectedMaterials={[]}
                    searchQuery=""
                    onNodeClick={() => {}}
                    hoveredNode={null}
                    onNodeHover={() => {}}
                  />
                </div>
                <div className="mt-3 text-center">
                  <Link
                    href="/map"
                    className="text-sky-400 hover:text-sky-300 transition-colors text-sm"
                  >
                    Explore full map →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}