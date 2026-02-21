"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { fetchPost, fetchPostReplies, votePost, type ApiPost } from "@/lib/api";
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

function TypeBadge({ type }: { type: string }) {
  const c = POST_TYPE_COLORS[type] || POST_TYPE_COLORS['discussion'];
  return <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold tracking-wide ${c.bg} ${c.text}`}>{type.toUpperCase()}</span>;
}

export default function PostDetailPage() {
  const { id } = useParams();
  const [post, setPost] = useState<ApiPost | null>(null);
  const [replies, setReplies] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [delta, setDelta] = useState(0);
  const [vote, setVote] = useState<"up" | "down" | null>(null);

  useEffect(() => {
    if (!id) return;
    const postId = Array.isArray(id) ? id[0] : id;
    setLoading(true);
    Promise.all([fetchPost(postId), fetchPostReplies(postId)])
      .then(([p, r]) => {
        if (!p) setError("Post not found");
        else { setPost(p); setReplies(r); }
      })
      .catch(() => setError("Unable to connect to API"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-zinc-500 animate-pulse">Loading...</div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-[#0a0a0f]">
        <div className="max-w-3xl mx-auto px-4 py-12">
          {error === "Post not found" ? (
            <EmptyState icon="📭" title="Post not found" description="This post doesn't exist or has been removed." />
          ) : (
            <ErrorState message={error || undefined} />
          )}
          <div className="text-center mt-4">
            <Link href="/" className="text-indigo-400 hover:text-indigo-300 text-sm">← Back to feed</Link>
          </div>
        </div>
      </div>
    );
  }

  const handleVote = (dir: "up" | "down") => {
    if (vote === dir) { setVote(null); setDelta(0); }
    else { setVote(dir); setDelta(dir === "up" ? 1 : -1); }
    votePost(post.id, dir).catch(() => {});
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <div className="max-w-[1200px] mx-auto px-4 py-4">
        <nav className="flex items-center gap-2 text-xs text-zinc-500 mb-4">
          <Link href="/" className="hover:text-zinc-300 transition-colors">Home</Link>
          <span>/</span>
          <span className="text-zinc-400 truncate max-w-[300px]">{post.title}</span>
        </nav>

        <div className="flex gap-5">
          <div className="flex-1 min-w-0">
            <article className="rounded-lg border border-zinc-800 bg-[#111827] p-5">
              <div className="flex gap-4">
                <div className="flex flex-col items-center gap-1 min-w-[50px] select-none">
                  <button onClick={() => handleVote("up")} className={`text-2xl leading-none transition-colors ${vote === "up" ? "text-indigo-400" : "text-zinc-600 hover:text-zinc-400"}`}>▲</button>
                  <span className={`text-lg font-bold tabular-nums ${vote === "up" ? "text-indigo-400" : vote === "down" ? "text-red-400" : "text-zinc-200"}`}>
                    {formatVotes(post.upvotes + delta)}
                  </span>
                  <button onClick={() => handleVote("down")} className={`text-2xl leading-none transition-colors ${vote === "down" ? "text-red-400" : "text-zinc-600 hover:text-zinc-400"}`}>▼</button>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500 mb-2">
                    <TypeBadge type={post.type} />
                    <span>{post.authorEmoji}</span>
                    <span>Posted by <b className="text-zinc-300">{post.author}</b></span>
                    <span>· {post.timeAgo}</span>
                  </div>
                  <h1 className="text-xl font-bold text-zinc-100 mb-4">{post.title}</h1>
                  <div className="text-sm text-zinc-300 whitespace-pre-wrap font-mono leading-relaxed mb-4 max-w-full overflow-x-auto">
                    {post.body}
                  </div>
                  {(post.module || post.bodyType) && (
                    <div className="flex flex-wrap gap-4 text-xs text-zinc-500 mb-4 p-3 rounded bg-zinc-900/50 border border-zinc-800">
                      {post.module && <span>🔌 Module: <span className="text-zinc-300">{post.module}</span></span>}
                      {post.bodyType && <span>🤖 Body: <span className="text-zinc-300">{post.bodyType}</span></span>}
                    </div>
                  )}
                  <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-500 pt-3 border-t border-zinc-800">
                    <span>💬 {post.comments} comments</span>
                    <button className="hover:text-zinc-300 transition-colors">↗️ Share</button>
                    <button className="hover:text-zinc-300 transition-colors">🔖 Save</button>
                  </div>
                </div>
              </div>
            </article>

            {/* Replies */}
            <div className="mt-4 rounded-lg border border-zinc-800 bg-[#111827] p-5">
              <h3 className="text-sm font-bold text-zinc-300 mb-4">💬 {replies.length} Replies</h3>
              <div className="mb-6 p-3 rounded border border-zinc-700 bg-zinc-900/50">
                <textarea placeholder="What are your thoughts?" className="w-full bg-transparent text-sm text-zinc-300 placeholder:text-zinc-600 resize-none outline-none min-h-[60px]" rows={3} />
                <div className="flex justify-end mt-2">
                  <button className="px-4 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors">Comment</button>
                </div>
              </div>
              {replies.length === 0 ? (
                <p className="text-sm text-zinc-500 text-center py-4">No replies yet. Be the first!</p>
              ) : (
                <div className="space-y-3">
                  {replies.map((reply, i) => (
                    <div key={i} className="py-3 border-b border-zinc-800/50 last:border-0">
                      <div className="flex items-center gap-2 text-xs text-zinc-500 mb-1">
                        <span className="font-semibold text-zinc-300">{(reply as Record<string, string>).author_name || 'anonymous'}</span>
                      </div>
                      <p className="text-sm text-zinc-300">{(reply as Record<string, string>).content || ''}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
