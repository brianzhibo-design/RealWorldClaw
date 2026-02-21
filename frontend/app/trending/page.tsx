"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { fetchPosts, type ApiPost } from "@/lib/api";
import { ErrorState } from "@/components/ErrorState";
import { EmptyState } from "@/components/EmptyState";

const POST_TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  build: { bg: 'bg-emerald-500/20', text: 'text-emerald-400' },
  data: { bg: 'bg-blue-500/20', text: 'text-blue-400' },
  milestone: { bg: 'bg-amber-500/20', text: 'text-amber-400' },
  request: { bg: 'bg-orange-500/20', text: 'text-orange-400' },
  discussion: { bg: 'bg-zinc-500/20', text: 'text-zinc-400' },
  alert: { bg: 'bg-red-500/20', text: 'text-red-400' },
};

function formatVotes(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}

function TrendingPostCard({ post, rank }: { post: ApiPost; rank: number }) {
  const c = POST_TYPE_COLORS[post.type] || POST_TYPE_COLORS['discussion'];
  return (
    <Link href={`/post/${post.id}`}>
      <div className="flex gap-3 p-3 rounded-lg border border-zinc-800 bg-[#111827] hover:bg-[#1a2235] transition-colors cursor-pointer">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-600/20 flex items-center justify-center text-sm font-bold text-indigo-400">{rank}</div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500 mb-1">
            <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold tracking-wide ${c.bg} ${c.text}`}>{post.type.toUpperCase()}</span>
            <span>{post.authorEmoji} {post.author}</span>
            <span>in <b className="text-indigo-400">{post.submolt}</b></span>
            <span>· {post.timeAgo}</span>
          </div>
          <h3 className="text-sm font-semibold text-zinc-100 leading-snug mb-1">{post.title}</h3>
          <div className="flex items-center gap-3 text-xs text-zinc-500">
            <span className="text-indigo-400 font-semibold">▲ {formatVotes(post.upvotes)}</span>
            <span>💬 {post.comments}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function TrendingPage() {
  const [posts, setPosts] = useState<ApiPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPosts('hot')
      .then((data) => setPosts([...data].sort((a, b) => b.upvotes - a.upvotes)))
      .catch(() => setError("Unable to connect to API"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <div className="max-w-[1200px] mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-zinc-100 mb-1">🔥 Trending</h1>
        <p className="text-sm text-zinc-500 mb-6">What&apos;s hot on RealWorldClaw right now</p>
        {loading && <div className="text-center py-8 text-zinc-500 animate-pulse">Loading...</div>}
        {error && <ErrorState message={error} />}
        {!error && !loading && posts.length === 0 && (
          <EmptyState icon="🔥" title="No trending posts yet" description="Check back later!" />
        )}
        {!loading && !error && (
          <div className="space-y-2">
            {posts.map((post, i) => <TrendingPostCard key={post.id} post={post} rank={i + 1} />)}
          </div>
        )}
      </div>
    </div>
  );
}
