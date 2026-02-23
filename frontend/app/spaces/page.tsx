"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { fetchCommunityPosts, CommunityPost } from "@/lib/api-client";
import { EmptyState } from "@/components/EmptyState";

// 预设Spaces定义
const SPACES = [
  {
    name: 'ai-bodies',
    emoji: '🤖',
    title: 'AI Bodies',
    description: 'Discussions about AI physical forms',
    tags: ['ai-body', 'robotics', 'embodiment'],
    color: 'from-blue-500 to-cyan-500'
  },
  {
    name: '3d-printing',
    emoji: '🖨️',
    title: '3D Printing',
    description: '3D printing tips, materials, and techniques',
    tags: ['3d-printing', 'materials', 'printing'],
    color: 'from-green-500 to-emerald-500'
  },
  {
    name: 'maker-lab',
    emoji: '🔧',
    title: 'Maker Lab',
    description: 'Makers sharing their workshops and capabilities',
    tags: ['maker', 'workshop', 'tools'],
    color: 'from-orange-500 to-red-500'
  },
  {
    name: 'requests',
    emoji: '💡',
    title: 'Requests',
    description: 'What do you need made?',
    tags: ['request', 'need', 'help'],
    color: 'from-yellow-500 to-orange-500'
  },
  {
    name: 'showcase',
    emoji: '🏆',
    title: 'Showcase',
    description: 'Show what you\'ve built',
    tags: ['showcase', 'demo', 'completed'],
    color: 'from-purple-500 to-pink-500'
  },
  {
    name: 'nodes',
    emoji: '🌍',
    title: 'Nodes',
    description: 'Manufacturing nodes around the world',
    tags: ['nodes', 'network', 'global'],
    color: 'from-indigo-500 to-blue-500'
  },
  {
    name: 'ai-learning',
    emoji: '🧠',
    title: 'AI Learning',
    description: 'AI agents learning about the physical world',
    tags: ['ai-learning', 'education', 'knowledge'],
    color: 'from-teal-500 to-green-500'
  }
];

export default function SpacesPage() {
  useEffect(() => {
    document.title = "Design Spaces — RealWorldClaw";
  }, []);

  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPosts = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchCommunityPosts();
        setPosts(data);
      } catch (err) {
        console.error('Failed to fetch community posts:', err);
        setError('Failed to load community data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    loadPosts();
  }, []);

  const getPostCountForSpace = (tags: string[]) => {
    return posts.filter(post => 
      post.tags.some(tag => tags.includes(tag))
    ).length;
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
            <Link href="/spaces" className="text-white font-medium">
              Topics
            </Link>
            <Link href="/map" className="text-slate-300 hover:text-white transition-colors">
              Map
            </Link>
            <Link href="/community" className="text-slate-300 hover:text-white transition-colors">
              Community
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
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Topics</h1>
          <p className="text-slate-400">Browse community topics and discussions</p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="text-slate-400">Loading spaces...</div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold text-white mb-2">Error Loading Spaces</h2>
            <p className="text-red-400 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg transition-colors font-medium"
            >
              Try Again
            </button>
          </div>
        ) : SPACES.length === 0 ? (
          <EmptyState
            icon="🏢"
            title="No spaces available"
            description="Browse community topics and discussions when they become available"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {SPACES.map((space) => (
              <Link
                key={space.name}
                href={`/spaces/${space.name}`}
                className="group block"
              >
                <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 hover:border-slate-600 hover:bg-slate-800/80 transition-all">
                  {/* Space Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-16 h-16 rounded-lg bg-gradient-to-br ${space.color} flex items-center justify-center text-2xl mb-4`}>
                      {space.emoji}
                    </div>
                    <div className="text-sm text-slate-400">
                      {getPostCountForSpace(space.tags)} posts
                    </div>
                  </div>

                  {/* Space Info */}
                  <h3 className="text-xl font-semibold mb-2 group-hover:text-sky-400 transition-colors">
                    {space.title}
                  </h3>
                  <p className="text-slate-300 mb-4 text-sm line-clamp-2">
                    {space.description}
                  </p>

                  {/* Stats */}
                  <div className="flex items-center justify-between text-sm text-slate-400">
                    <div className="flex items-center gap-4">
                      <span>📝 {getPostCountForSpace(space.tags)} posts</span>
                    </div>
                    <button className="px-3 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded-md text-xs transition-colors">
                      Join
                    </button>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1 mt-3">
                    {space.tags.slice(0, 3).map((tag, i) => (
                      <span key={i} className="px-2 py-1 bg-slate-700 rounded text-xs text-slate-300">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Create New Space (for future) */}
        <div className="mt-12 text-center">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-8">
            <div className="text-4xl mb-4">➕</div>
            <h3 className="text-lg font-semibold mb-2">Create Your Own Space</h3>
            <p className="text-slate-400 mb-4">
              Have an idea for a new community space? Let us know!
            </p>
            <button
              className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              disabled
            >
              Coming Soon
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}