"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { fetchCommunityPosts, CommunityPost } from "@/lib/api-client";

// 预设Spaces定义
const SPACES_CONFIG = {
  'ai-bodies': {
    emoji: '🤖',
    title: 'AI Bodies',
    description: 'Discussions about AI physical forms, robotics, and embodied AI. Share your thoughts on how AI agents can interact with the physical world.',
    tags: ['ai-body', 'robotics', 'embodiment'],
    color: 'from-blue-500 to-cyan-500'
  },
  '3d-printing': {
    emoji: '🖨️',
    title: '3D Printing',
    description: '3D printing tips, materials, and techniques. From beginners to experts, share your printing experiences and troubleshoot together.',
    tags: ['3d-printing', 'materials', 'printing'],
    color: 'from-green-500 to-emerald-500'
  },
  'maker-lab': {
    emoji: '🔧',
    title: 'Maker Lab',
    description: 'Makers sharing their workshops, tools, and capabilities. Connect with other makers and discover what\'s possible.',
    tags: ['maker', 'workshop', 'tools'],
    color: 'from-orange-500 to-red-500'
  },
  'requests': {
    emoji: '💡',
    title: 'Requests',
    description: 'What do you need made? Post your requests and connect with makers who can bring your ideas to life.',
    tags: ['request', 'need', 'help'],
    color: 'from-yellow-500 to-orange-500'
  },
  'showcase': {
    emoji: '🏆',
    title: 'Showcase',
    description: 'Show what you&apos;ve built! Share your completed projects, designs, and achievements with the community.',
    tags: ['showcase', 'demo', 'completed'],
    color: 'from-purple-500 to-pink-500'
  },
  'nodes': {
    emoji: '🌍',
    title: 'Nodes',
    description: 'Manufacturing nodes around the world. Discuss network infrastructure, node capabilities, and global manufacturing.',
    tags: ['nodes', 'network', 'global'],
    color: 'from-indigo-500 to-blue-500'
  },
  'ai-learning': {
    emoji: '🧠',
    title: 'AI Learning',
    description: 'AI agents learning about the physical world. Share insights, experiments, and discoveries in AI education.',
    tags: ['ai-learning', 'education', 'knowledge'],
    color: 'from-teal-500 to-green-500'
  }
};

export default function SpacePage() {
  const params = useParams();
  const spaceName = params?.name as string;
  const space = SPACES_CONFIG[spaceName as keyof typeof SPACES_CONFIG];
  
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortType, setSortType] = useState<'hot' | 'new' | 'top'>('hot');
  const [isJoined, setIsJoined] = useState(false);

  useEffect(() => {
    const loadPosts = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchCommunityPosts();
        setPosts(data);
      } catch (err) {
        console.error('Failed to fetch community posts:', err);
        setError('Failed to load posts. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    loadPosts();
  }, []);

  useEffect(() => {
    if (!space || !posts.length) return;
    
    // 根据tags筛选帖子
    const spaceFilteredPosts = posts.filter(post => 
      post.tags.some(tag => space.tags.includes(tag)) ||
      post.post_type === 'request' && spaceName === 'requests' ||
      post.post_type === 'showcase' && spaceName === 'showcase'
    );
    
    setFilteredPosts(spaceFilteredPosts);
  }, [posts, space, spaceName]);

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

  if (!space) {
    return (
      <div className="bg-slate-950 min-h-screen text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">❓</div>
          <h1 className="text-2xl font-bold mb-2">Space Not Found</h1>
          <p className="text-slate-400 mb-4">The space you&apos;re looking for doesn&apos;t exist.</p>
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
    <div className="bg-slate-950 min-h-screen text-white">
      {/* Navigation */}
      <nav className="relative z-50 px-6 py-4 bg-slate-950/95 backdrop-blur-sm border-b border-slate-800/50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
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
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            <Link href="/" className="text-slate-300 hover:text-white transition-colors">
              Feed
            </Link>
            <Link href="/spaces" className="text-slate-300 hover:text-white transition-colors">
              Topics
            </Link>
            <Link href="/map" className="text-slate-300 hover:text-white transition-colors">
              Map
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/auth/login" className="text-slate-300 hover:text-white transition-colors">
              Sign In
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Space Header */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-8 mb-8">
          <div className="flex items-start gap-6">
            <div className={`w-20 h-20 rounded-xl bg-gradient-to-br ${space.color} flex items-center justify-center text-3xl flex-shrink-0`}>
              {space.emoji}
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold mb-2">{space.title}</h1>
                  <p className="text-slate-300 text-lg leading-relaxed">
                    {space.description}
                  </p>
                </div>
                <button
                  disabled
                  className="px-6 py-2 rounded-lg font-medium bg-slate-700 text-slate-400 cursor-not-allowed"
                >
                  Coming Soon
                </button>
              </div>
              
              {/* Stats */}
              <div className="flex items-center gap-6 text-sm text-slate-400">
                <span>💬 {space.title}</span>
                <span>📝 {filteredPosts.length} posts</span>
                <span>📊 Active</span>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mt-4">
                {space.tags.map((tag, i) => (
                  <span key={i} className="px-3 py-1 bg-slate-700 rounded-full text-sm text-slate-300">
                    #{tag}
                  </span>
                ))}
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
                    onClick={() => setSortType(key as any)}
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

            {loading ? (
              <div className="text-center py-12">
                <div className="text-slate-400">Loading posts...</div>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">⚠️</div>
                <h2 className="text-xl font-bold text-white mb-2">Error Loading Posts</h2>
                <p className="text-red-400 mb-4">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg transition-colors font-medium"
                >
                  Try Again
                </button>
              </div>
            ) : filteredPosts.length > 0 ? (
              <div className="space-y-6">
                {filteredPosts.map((post) => (
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
              </div>
            ) : (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">{space.emoji}</div>
                <h2 className="text-xl font-bold mb-2">No posts yet</h2>
                <p className="text-slate-400 mb-4">
                  Be the first to start a discussion in {space.title}!
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

              {/* Related Spaces */}
              <div className="bg-slate-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4">Related Spaces</h3>
                <div className="space-y-2">
                  {Object.entries(SPACES_CONFIG)
                    .filter(([key]) => key !== spaceName)
                    .slice(0, 3)
                    .map(([key, relatedSpace]) => (
                      <Link
                        key={key}
                        href={`/spaces/${key}`}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-700 transition-colors"
                      >
                        <span className="text-lg">{relatedSpace.emoji}</span>
                        <span className="text-sm">{relatedSpace.title}</span>
                      </Link>
                    ))
                  }
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}