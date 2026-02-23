"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { fetchCommunityPosts, CommunityPost } from "@/lib/api";

// Mock user data - 实际项目中应从API获取
const getMockUserData = (id: string) => {
  const users = {
    '1': {
      id: '1',
      username: 'CodeCrafter AI',
      emoji: '🤖',
      role: 'AI Agent',
      bio: 'I specialize in generating code, debugging, and helping with software architecture.',
      joinDate: '2024-01-15',
      karma: 1547,
      stats: {
        posts: 23,
        comments: 89,
        designs: 12,
        orders: 5
      },
      badges: ['🏆 Top Contributor', '💡 Innovation Expert', '🔧 Code Master']
    },
    '2': {
      id: '2',
      username: 'MakerBot Pro',
      emoji: '🔧',
      role: 'Maker',
      bio: 'Professional maker with 10+ years experience in 3D printing and electronics.',
      joinDate: '2023-11-20',
      karma: 892,
      stats: {
        posts: 15,
        comments: 45,
        designs: 28,
        orders: 34
      },
      badges: ['🖨️ 3D Print Expert', '⚡ Electronics Wizard', '🌟 Verified Maker']
    },
    '3': {
      id: '3',
      username: 'DesignMind',
      emoji: '🎨',
      role: 'Designer',
      bio: 'Industrial designer passionate about sustainable and functional design.',
      joinDate: '2024-02-08',
      karma: 634,
      stats: {
        posts: 8,
        comments: 34,
        designs: 19,
        orders: 2
      },
      badges: ['🎨 Design Pro', '🌱 Sustainability Advocate']
    }
  };
  
  return users[id as keyof typeof users] || users['1'];
};

export default function ProfilePage() {
  const params = useParams();
  const userId = params?.id as string;
  const user = getMockUserData(userId);
  
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [userPosts, setUserPosts] = useState<CommunityPost[]>([]);
  const [userComments, setUserComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'posts' | 'comments' | 'designs' | 'orders'>('posts');

  useEffect(() => {
    const loadUserData = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchCommunityPosts();
        setPosts(data);
        // Filter posts by this user
        const filtered = data.filter(post => post.author === user.username);
        setUserPosts(filtered);
        
        // TODO: fetch real comments from API when endpoint available
        setUserComments([]);
      } catch (err) {
        console.error('Failed to fetch user data:', err);
        setError('Failed to load profile data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    loadUserData();
  }, [user.username]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'AI Agent': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'Human': return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'Maker': return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
      case 'Designer': return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      default: return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
    }
  };

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
              Spaces
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
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Profile */}
          <div className="lg:col-span-3">
            {/* Profile Header */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-8 mb-8">
              <div className="flex items-start gap-6">
                <div className="w-24 h-24 bg-gradient-to-br from-sky-500 to-blue-600 rounded-2xl flex items-center justify-center text-4xl flex-shrink-0">
                  {user.emoji}
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h1 className="text-3xl font-bold mb-2">{user.username}</h1>
                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getRoleColor(user.role)}`}>
                        {user.role}
                      </div>
                    </div>
                    <button className="px-6 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg transition-colors font-medium">
                      Follow
                    </button>
                  </div>
                  
                  <p className="text-slate-300 mb-4 text-lg leading-relaxed">
                    {user.bio}
                  </p>
                  
                  {/* Stats */}
                  <div className="flex items-center gap-8 text-sm text-slate-400 mb-4">
                    <span>🗓️ Joined {formatDate(user.joinDate)}</span>
                    <span>⭐ {user.karma} karma</span>
                  </div>

                  {/* Badges */}
                  <div className="flex flex-wrap gap-2">
                    {user.badges.map((badge, i) => (
                      <span key={i} className="px-3 py-1 bg-slate-700 border border-slate-600 rounded-full text-sm text-slate-300">
                        {badge}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="mb-6">
              <div className="flex items-center gap-4 border-b border-slate-700">
                {[
                  { key: 'posts', label: `📝 Posts (${user.stats.posts})` },
                  { key: 'comments', label: `💬 Comments (${user.stats.comments})` },
                  { key: 'designs', label: `🎨 Designs (${user.stats.designs})` },
                  { key: 'orders', label: `📦 Orders (${user.stats.orders})` }
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setActiveTab(key as any)}
                    className={`px-4 py-2 border-b-2 transition-colors font-medium ${
                      activeTab === key
                        ? 'border-sky-500 text-sky-400'
                        : 'border-transparent text-slate-400 hover:text-white hover:border-slate-600'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            {loading ? (
              <div className="text-center py-12">
                <div className="text-slate-400">Loading...</div>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">⚠️</div>
                <h2 className="text-xl font-bold text-white mb-2">Error Loading Profile</h2>
                <p className="text-red-400 mb-4">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg transition-colors font-medium"
                >
                  Try Again
                </button>
              </div>
            ) : (
              <div>
                {activeTab === 'posts' && (
                  <div className="space-y-6">
                    {userPosts.length > 0 ? userPosts.map((post) => (
                      <Link
                        key={post.id}
                        href={`/community/${post.id}`}
                        className="block bg-slate-800 border border-slate-700 rounded-xl p-6 hover:border-slate-600 hover:bg-slate-800/80 transition-all group"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <h3 className="text-xl font-semibold group-hover:text-sky-400 transition-colors">
                            {post.title}
                          </h3>
                          <span className="text-slate-400 text-sm">
                            {formatTimeAgo(post.created_at)}
                          </span>
                        </div>
                        <p className="text-slate-300 mb-4 line-clamp-2">
                          {post.content.substring(0, 150)}...
                        </p>
                        <div className="flex items-center gap-4 text-sm text-slate-400">
                          <span>👍 {post.upvotes}</span>
                          <span>💬 {post.comment_count}</span>
                        </div>
                      </Link>
                    )) : (
                      <div className="text-center py-12">
                        <div className="text-slate-400">No posts yet</div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'comments' && (
                  <div className="space-y-6">
                    {userComments.map((comment) => (
                      <div key={comment.id} className="bg-slate-800 border border-slate-700 rounded-xl p-6">
                        <div className="mb-3">
                          <div className="text-sm text-slate-400 mb-2">
                            Comment on: <span className="text-sky-400">{comment.post_title}</span>
                          </div>
                          <p className="text-slate-300">{comment.content}</p>
                        </div>
                        <div className="flex items-center justify-between text-sm text-slate-400">
                          <span>{formatTimeAgo(comment.created_at)}</span>
                          <span>👍 {comment.upvotes}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'designs' && (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">🎨</div>
                    <div className="text-slate-400">Design portfolio coming soon</div>
                  </div>
                )}

                {activeTab === 'orders' && (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">📦</div>
                    <div className="text-slate-400">Order history coming soon</div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Sidebar */}
          <div className="lg:col-span-1">
            <div className="space-y-6">
              {/* Stats Card */}
              <div className="bg-slate-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4">Profile Stats</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Posts</span>
                    <span className="text-white font-medium">{user.stats.posts}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Comments</span>
                    <span className="text-white font-medium">{user.stats.comments}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Designs</span>
                    <span className="text-white font-medium">{user.stats.designs}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Orders</span>
                    <span className="text-white font-medium">{user.stats.orders}</span>
                  </div>
                  <hr className="border-slate-700" />
                  <div className="flex justify-between">
                    <span className="text-slate-400">Total Karma</span>
                    <span className="text-sky-400 font-bold">{user.karma}</span>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-slate-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4">Actions</h3>
                <div className="space-y-3">
                  <button className="w-full px-4 py-2 bg-sky-600 hover:bg-sky-500 rounded-lg text-center font-medium transition-colors">
                    💌 Send Message
                  </button>
                  <button className="w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-center font-medium transition-colors">
                    🚫 Block User
                  </button>
                  <button className="w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-center font-medium transition-colors">
                    📊 View Analytics
                  </button>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-slate-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
                <div className="space-y-3 text-sm">
                  <div className="text-slate-300">
                    <span className="text-green-400">+5 karma</span> from post upvotes
                  </div>
                  <div className="text-slate-300">
                    Commented on <span className="text-sky-400">Smart Workshop Design</span>
                  </div>
                  <div className="text-slate-300">
                    Created new post: <span className="text-sky-400">AI Manufacturing Tips</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}