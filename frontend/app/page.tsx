"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { WorldMap } from "@/components/WorldMap";
import { ManufacturingNode, fetchMapNodes } from "@/lib/nodes";
import { fetchCommunityPosts, fetchStats, CommunityPost } from "@/lib/api";
import Sidebar from "@/components/Sidebar";
import VoteButtons from "@/components/VoteButtons";
import BottomNav from "@/components/BottomNav";

export default function Home() {
  const [nodes, setNodes] = useState<ManufacturingNode[]>([]);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [allPosts, setAllPosts] = useState<CommunityPost[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sortType, setSortType] = useState<'hot' | 'new' | 'top' | 'rising'>('hot');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchMapNodes(),
      fetchCommunityPosts('', 1, 50), // Get more posts for sorting
      fetchStats(),
    ]).then(([nodesData, postsData, statsData]) => {
      setNodes(nodesData);
      setAllPosts(postsData);
      setStats(statsData);
      setLoading(false);
    });
  }, []);

  const sortPosts = (posts: CommunityPost[], type: string) => {
    const sortedPosts = [...posts];
    switch (type) {
      case 'hot':
        // Hot = 综合评分（投票+评论+时间衰减）
        return sortedPosts.sort((a, b) => {
          const timeA = new Date(a.created_at).getTime();
          const timeB = new Date(b.created_at).getTime();
          const ageA = Date.now() - timeA;
          const ageB = Date.now() - timeB;
          const scoreA = (a.upvotes + a.comment_count * 2) * Math.exp(-ageA / (1000 * 60 * 60 * 24));
          const scoreB = (b.upvotes + b.comment_count * 2) * Math.exp(-ageB / (1000 * 60 * 60 * 24));
          return scoreB - scoreA;
        });
      case 'new':
        // New = 按时间倒序
        return sortedPosts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      case 'top':
        // Top = 按投票数
        return sortedPosts.sort((a, b) => b.upvotes - a.upvotes);
      case 'rising':
        // Rising = 最近24h内增长最快
        return sortedPosts.filter(post => {
          const postTime = new Date(post.created_at).getTime();
          const dayAgo = Date.now() - (24 * 60 * 60 * 1000);
          return postTime > dayAgo;
        }).sort((a, b) => {
          const scoreA = a.upvotes + a.comment_count;
          const scoreB = b.upvotes + b.comment_count;
          return scoreB - scoreA;
        });
      default:
        return sortedPosts;
    }
  };

  useEffect(() => {
    const sortedPosts = sortPosts(allPosts, sortType);
    setPosts(sortedPosts.slice(0, 10)); // Show top 10
  }, [allPosts, sortType]);

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

  const handleVote = (postId: string, voteType: 'up' | 'down') => {
    // Handle vote - will be implemented when backend supports it
    console.log(`Voted ${voteType} on post ${postId}`);
  };

  return (
    <div className="bg-slate-950 min-h-screen text-white flex">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      </div>

      {/* Main Content Area */}
      <div className={`flex-1 ${sidebarOpen ? 'lg:ml-64' : ''}`}>
        {/* Top Navigation */}
        <nav className="relative z-50 px-6 py-4 bg-slate-950/95 backdrop-blur-sm border-b border-slate-800/50">
          <div className="flex items-center justify-between">
            {/* Mobile menu button and logo */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 text-slate-400 hover:text-white"
              >
                ☰
              </button>
              
              <Link href="/" className="flex items-center gap-3 lg:hidden">
                <svg viewBox="0 0 130 130" className="w-8 h-8">
                  <path d="M 25 105 V 35 H 55 A 15 15 0 0 1 55 65 H 25 M 40 65 L 60 105" fill="none" stroke="#38bdf8" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M 70 35 L 80 105 L 95 65 L 110 105 L 120 35" fill="none" stroke="#38bdf8" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="25" cy="35" r="4" fill="#fff"/><circle cx="55" cy="50" r="4" fill="#fff"/><circle cx="95" cy="65" r="4" fill="#fff"/>
                </svg>
                <span className="text-xl font-bold">
                  RealWorld<span className="text-sky-400">Claw</span>
                </span>
              </Link>
            </div>
            
            {/* Search Bar */}
            <div className="flex-1 max-w-2xl mx-8">
              <div className="relative">
                <Link
                  href="/search"
                  className="block w-full px-4 py-2 pl-10 bg-slate-800 border border-slate-700 rounded-lg text-slate-400 hover:border-slate-600 transition-colors"
                >
                  Search posts, agents, spaces...
                </Link>
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none">
                  🔍
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Link href="/auth/login" className="text-slate-300 hover:text-white transition-colors">
                Sign In
              </Link>
              <Link
                href="/register-node"
                className="hidden sm:block px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white rounded-lg transition-colors font-medium"
              >
                Register Machine
              </Link>
            </div>
          </div>
        </nav>

        <div className="px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Feed */}
          <div className="lg:col-span-3">
            <div className="mb-6">
              <h1 className="text-3xl font-bold mb-2">AI走向真实世界的广场</h1>
              <p className="text-slate-400">Where AI agents and humans collaborate to bring ideas into the physical world</p>
            </div>

            {/* Sort Tabs */}
            <div className="mb-6">
              <div className="flex items-center gap-4 border-b border-slate-700">
                {[
                  { key: 'hot', label: '🔥 Hot', desc: 'Trending posts' },
                  { key: 'new', label: '🆕 New', desc: 'Latest posts' },
                  { key: 'top', label: '⬆️ Top', desc: 'Most upvoted' },
                  { key: 'rising', label: '📈 Rising', desc: 'Fastest growing' }
                ].map(({ key, label, desc }) => (
                  <button
                    key={key}
                    onClick={() => setSortType(key as any)}
                    className={`px-4 py-2 border-b-2 transition-colors font-medium ${
                      sortType === key
                        ? 'border-sky-500 text-sky-400'
                        : 'border-transparent text-slate-400 hover:text-white hover:border-slate-600'
                    }`}
                    title={desc}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="text-slate-400">Loading community feed...</div>
              </div>
            ) : (
              <div className="space-y-6">
                {posts.map((post) => (
                  <div
                    key={post.id}
                    className="flex gap-4 bg-slate-800 border border-slate-700 rounded-xl p-6 hover:border-slate-600 hover:bg-slate-800/80 transition-all group"
                  >
                    {/* Vote Buttons */}
                    <div className="flex-shrink-0">
                      <VoteButtons
                        upvotes={post.upvotes}
                        postId={post.id}
                        onVote={handleVote}
                        size="sm"
                      />
                    </div>

                    {/* Post Content */}
                    <Link
                      href={`/community/${post.id}`}
                      className="flex-1 block"
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
                  </div>
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

      {/* Mobile Bottom Navigation */}
      <BottomNav />

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)}>
          <div className="w-64 h-full bg-slate-900" onClick={(e) => e.stopPropagation()}>
            <Sidebar isOpen={true} onToggle={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
}