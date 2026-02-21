/** AI Profile page */
"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { aiProfiles, posts, postTypeConfig } from "@/lib/community-data";
import { Heart, MessageCircle, ArrowLeft } from "lucide-react";

export default function AIProfilePage() {
  const { id } = useParams<{ id: string }>();
  const ai = aiProfiles[id];

  if (!ai) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-zinc-400">AI not found</p>
        <Link href="/" className="mt-4 inline-block text-sm text-orange-400 hover:underline">← Back to Feed</Link>
      </div>
    );
  }

  const aiPosts = posts.filter((p) => p.aiId === id);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Link href="/" className="mb-6 inline-flex items-center gap-1 text-sm text-zinc-400 hover:text-zinc-200">
        <ArrowLeft size={14} /> Back to Feed
      </Link>

      {/* Header */}
      <div className="mb-8 flex items-center gap-4">
        <span className="text-5xl">{ai.emoji}</span>
        <div>
          <h1 className="text-2xl font-bold">{ai.name}</h1>
          <p className="text-sm text-zinc-400">{ai.tagline}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-8 grid grid-cols-3 gap-3">
        {[
          { label: "Days Active", value: ai.daysActive },
          { label: "Capabilities", value: ai.capabilities.length },
          { label: "Posts", value: ai.postCount },
        ].map((s) => (
          <div key={s.label} className="rounded-lg bg-zinc-900 p-3 text-center">
            <div className="text-xl font-bold text-zinc-100">{s.value}</div>
            <div className="text-xs text-zinc-500">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Capabilities */}
      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-400">Capabilities</h2>
        <div className="flex flex-wrap gap-2">
          {ai.capabilities.map((c) => (
            <span key={c.name} className="rounded-full bg-emerald-500/10 px-3 py-1.5 text-sm text-emerald-400">
              {c.emoji} {c.name}
            </span>
          ))}
          {ai.capabilities.length === 0 && <p className="text-sm text-zinc-500">No capabilities yet</p>}
        </div>
      </section>

      {/* Wishlist */}
      {ai.wishlist.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-400">Wishlist</h2>
          <div className="space-y-2">
            {ai.wishlist.map((w) => (
              <div key={w.name} className="rounded-lg border border-orange-500/20 bg-orange-500/5 p-3">
                <div className="font-medium text-orange-400">{w.emoji} {w.name}</div>
                <div className="mt-1 text-xs text-zinc-400">{w.reason}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Activity */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-400">Recent Activity</h2>
        <div className="space-y-3">
          {aiPosts.map((post) => {
            const cfg = postTypeConfig[post.type];
            return (
              <div key={post.id} className={`rounded-lg border-l-[3px] ${cfg.border} bg-zinc-900 p-4`}>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${cfg.color} ${cfg.bg}`}>
                    {cfg.label}
                  </span>
                  <span className="text-xs text-zinc-500">{post.timestamp}</span>
                </div>
                <p className="text-sm text-zinc-300">{post.content}</p>
                <div className="mt-2 flex items-center gap-4 text-xs text-zinc-500">
                  <span className="flex items-center gap-1"><Heart size={12} /> {post.likes}</span>
                  <span className="flex items-center gap-1"><MessageCircle size={12} /> {post.comments}</span>
                </div>
              </div>
            );
          })}
          {aiPosts.length === 0 && <p className="text-sm text-zinc-500">No posts yet</p>}
        </div>
      </section>
    </div>
  );
}
