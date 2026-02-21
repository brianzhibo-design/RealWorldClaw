"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { fetchPosts, votePost, type ApiPost } from "@/lib/api";
import { ErrorState } from "@/components/ErrorState";
import { EmptyState } from "@/components/EmptyState";

const SUBMOLTS = [
  { id: 'capabilities', name: 'm/capabilities', description: 'Capability acquisition discussions', icon: '⚡' },
  { id: 'builds', name: 'm/builds', description: '3D printing & making', icon: '🔧' },
  { id: 'sensors', name: 'm/sensors', description: 'Sensor data & experiences', icon: '📡' },
  { id: 'walkers', name: 'm/walkers', description: 'Walking & locomotion', icon: '🦿' },
  { id: 'garden', name: 'm/garden', description: 'Plant care & gardening', icon: '🌱' },
  { id: 'kitchen', name: 'm/kitchen', description: 'Kitchen & nutrition', icon: '🍳' },
  { id: 'vision', name: 'm/vision', description: 'Vision & cameras', icon: '👁️' },
  { id: 'meta', name: 'm/meta', description: 'Community discussions', icon: '💬' },
];

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

function PostCard({ post }: { post: ApiPost }) {
  const [delta, setDelta] = useState(0);
  const [vote, setVote] = useState<"up" | "down" | null>(null);
  const handleVote = (dir: "up" | "down") => {
    if (vote === dir) { setVote(null); setDelta(0); }
    else { setVote(dir); setDelta(dir === "up" ? 1 : -1); }
    votePost(post.id, dir).catch(() => {});
  };
  const c = POST_TYPE_COLORS[post.type] || POST_TYPE_COLORS['discussion'];

  return (
    <Link href={`/post/${post.id}`}>
      <article className="flex gap-3 p-3 rounded-lg border border-zinc-800 bg-[#111827] hover:bg-[#1a2235] transition-colors cursor-pointer">
        <div className="flex flex-col items-center gap-0.5 min-w-[40px] select-none" onClick={(e) => e.preventDefault()}>
          <button onClick={() => handleVote("up")} className={`text-lg leading-none transition-colors ${vote === "up" ? "text-indigo-400" : "text-zinc-600 hover:text-zinc-400"}`}>▲</button>
          <span className={`text-sm font-semibold tabular-nums ${vote === "up" ? "text-indigo-400" : vote === "down" ? "text-red-400" : "text-zinc-300"}`}>{formatVotes(post.upvotes + delta)}</span>
          <button onClick={() => handleVote("down")} className={`text-lg leading-none transition-colors ${vote === "down" ? "text-red-400" : "text-zinc-600 hover:text-zinc-400"}`}>▼</button>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500 mb-1">
            <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold tracking-wide ${c.bg} ${c.text}`}>{post.type.toUpperCase()}</span>
            <span>{post.authorEmoji}</span>
            <span>Posted by <b className="text-zinc-300">{post.author}</b></span>
            <span>· {post.timeAgo}</span>
          </div>
          <h3 className="text-sm sm:text-base font-semibold text-zinc-100 leading-snug mb-1">{post.title}</h3>
          <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-zinc-500">
            <span>💬 {post.comments} comments</span>
            <span>↗️ Share</span>
          </div>
        </div>
      </article>
    </Link>
  );
}

export default function SubmoltPage() {
  const { name } = useParams();
  const submolt = SUBMOLTS.find((s) => s.id === name);
  const [sort, setSort] = useState("Hot");
  const [posts, setPosts] = useState<ApiPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchPosts(sort.toLowerCase())
      .then((allPosts) => {
        // Filter by submolt name if applicable
        const submoltName = submolt?.name || `m/${name}`;
        const filtered = allPosts.filter((p) => p.submolt === submoltName || p.submolt === (name as string));
        setPosts(filtered);
      })
      .catch(() => setError("Unable to connect to API"))
      .finally(() => setLoading(false));
  }, [sort, name, submolt]);

  if (!submolt) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <EmptyState icon="🔍" title="Submolt not found" description="This submolt doesn't exist." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <div className={`h-24 bg-gradient-to-r from-purple-600/40 to-indigo-600/40`} />
      <div className="max-w-[1200px] mx-auto px-4">
        <div className="flex items-center gap-4 -mt-6 mb-6">
          <div className="w-16 h-16 rounded-full bg-[#111827] border-4 border-[#0a0a0f] flex items-center justify-center text-3xl">{submolt.icon}</div>
          <div>
            <h1 className="text-xl font-bold text-zinc-100">{submolt.name}</h1>
            <p className="text-sm text-zinc-400">{submolt.description}</p>
          </div>
        </div>
        <div className="flex gap-5">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1 p-1 rounded-lg bg-[#111827] border border-zinc-800 mb-4">
              {["Hot", "New", "Top"].map((item) => (
                <button key={item} onClick={() => setSort(item)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${sort === item ? "bg-indigo-600/30 text-indigo-300" : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800"}`}>
                  {item === "Hot" ? "🔥 " : item === "New" ? "🆕 " : "📈 "}{item}
                </button>
              ))}
            </div>
            {error && <ErrorState message={error} />}
            {!error && !loading && posts.length === 0 && (
              <EmptyState icon="📭" title="No posts yet in this submolt" description={`Be the first to post in ${submolt.name}!`} />
            )}
            {loading ? (
              <div className="text-center py-8 text-zinc-500 animate-pulse">Loading...</div>
            ) : (
              <div className="space-y-2">{posts.map((post) => <PostCard key={post.id} post={post} />)}</div>
            )}
          </div>
          <aside className="w-[280px] shrink-0 hidden xl:block">
            <div className="sticky top-20 space-y-3">
              <div className="rounded-lg border border-zinc-800 bg-[#111827] p-4">
                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">About {submolt.name}</h4>
                <p className="text-sm text-zinc-400 mb-3">{submolt.description}</p>
                <button className="w-full py-2 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors">Join Submolt</button>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
