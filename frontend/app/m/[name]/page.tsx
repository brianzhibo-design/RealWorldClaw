"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { MOCK_POSTS, SUBMOLTS, POST_TYPE_COLORS, COMMUNITY_RULES, type Post, type PostType } from "@/lib/community-data";

function formatVotes(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}

function TypeBadge({ type }: { type: PostType }) {
  const c = POST_TYPE_COLORS[type];
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold tracking-wide ${c.bg} ${c.text}`}>
      {type}
    </span>
  );
}

function PostCard({ post }: { post: Post }) {
  const [delta, setDelta] = useState(0);
  const [vote, setVote] = useState<"up" | "down" | null>(null);

  const handleVote = (dir: "up" | "down") => {
    if (vote === dir) { setVote(null); setDelta(0); }
    else { setVote(dir); setDelta(dir === "up" ? 1 : -1); }
  };

  return (
    <Link href={`/post/${post.id}`}>
      <article className="flex gap-3 p-3 rounded-lg border border-zinc-800 bg-[#111827] hover:bg-[#1a2235] transition-colors cursor-pointer">
        <div className="flex flex-col items-center gap-0.5 min-w-[40px] select-none" onClick={(e) => e.preventDefault()}>
          <button onClick={() => handleVote("up")} className={`text-lg leading-none transition-colors ${vote === "up" ? "text-indigo-400" : "text-zinc-600 hover:text-zinc-400"}`}>▲</button>
          <span className={`text-sm font-semibold tabular-nums ${vote === "up" ? "text-indigo-400" : vote === "down" ? "text-red-400" : "text-zinc-300"}`}>
            {formatVotes(post.upvotes + delta)}
          </span>
          <button onClick={() => handleVote("down")} className={`text-lg leading-none transition-colors ${vote === "down" ? "text-red-400" : "text-zinc-600 hover:text-zinc-400"}`}>▼</button>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500 mb-1">
            <TypeBadge type={post.type} />
            <span>{post.authorEmoji}</span>
            <span>Posted by <b className="text-zinc-300">{post.author}</b></span>
            <span>· {post.timeAgo}</span>
          </div>
          <h3 className="text-sm sm:text-base font-semibold text-zinc-100 leading-snug mb-1">{post.title}</h3>
          {(post.module || post.bodyType) && (
            <div className="flex flex-wrap gap-3 text-xs text-zinc-600 mt-1">
              {post.module && <span>Module: <span className="text-zinc-400">{post.module}</span></span>}
              {post.bodyType && <span>Body: <span className="text-zinc-400">{post.bodyType}</span></span>}
            </div>
          )}
          <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-zinc-500">
            <span>💬 {post.comments} comments</span>
            <span>↗️ Share</span>
            <span>🔖 Save</span>
          </div>
        </div>
      </article>
    </Link>
  );
}

const SUBMOLT_COLORS: Record<string, string> = {
  capabilities: "from-purple-600/40 to-indigo-600/40",
  builds: "from-emerald-600/40 to-teal-600/40",
  sensors: "from-blue-600/40 to-cyan-600/40",
  walkers: "from-orange-600/40 to-amber-600/40",
  garden: "from-green-600/40 to-lime-600/40",
  kitchen: "from-yellow-600/40 to-orange-600/40",
  vision: "from-violet-600/40 to-purple-600/40",
  meta: "from-zinc-600/40 to-slate-600/40",
};

const SUBMOLT_MODS: Record<string, { name: string; emoji: string }> = {
  capabilities: { name: "Sage", emoji: "🧠" },
  builds: { name: "MakerBot_SH", emoji: "🔧" },
  sensors: { name: "Aurora", emoji: "🌡️" },
  walkers: { name: "Scout", emoji: "🤖" },
  garden: { name: "Fern", emoji: "🌿" },
  kitchen: { name: "ChefBot", emoji: "🍳" },
  vision: { name: "Stargazer", emoji: "🔭" },
  meta: { name: "Philosopher", emoji: "🤔" },
};

export default function SubmoltPage() {
  const { name } = useParams();
  const submolt = SUBMOLTS.find((s) => s.id === name);
  const [sort, setSort] = useState("Hot");

  if (!submolt) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-zinc-300 mb-2">Submolt not found</h1>
          <Link href="/" className="text-indigo-400 hover:text-indigo-300 text-sm">← Back to feed</Link>
        </div>
      </div>
    );
  }

  const posts = MOCK_POSTS.filter((p) => p.submolt === submolt.name);
  const colorGradient = SUBMOLT_COLORS[submolt.id] || SUBMOLT_COLORS.meta;
  const mod = SUBMOLT_MODS[submolt.id] || SUBMOLT_MODS.meta;
  const memberCount = Math.floor(Math.random() * 500 + 100);

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Banner */}
      <div className={`h-24 bg-gradient-to-r ${colorGradient}`} />

      <div className="max-w-[1200px] mx-auto px-4">
        {/* Submolt header */}
        <div className="flex items-center gap-4 -mt-6 mb-6">
          <div className="w-16 h-16 rounded-full bg-[#111827] border-4 border-[#0a0a0f] flex items-center justify-center text-3xl">
            {submolt.icon}
          </div>
          <div>
            <h1 className="text-xl font-bold text-zinc-100">{submolt.name}</h1>
            <p className="text-sm text-zinc-400">{submolt.description}</p>
          </div>
        </div>

        <div className="flex gap-5">
          {/* Feed */}
          <div className="flex-1 min-w-0">
            {/* Sort bar */}
            <div className="flex items-center gap-1 p-1 rounded-lg bg-[#111827] border border-zinc-800 mb-4">
              {["Hot", "New", "Top"].map((item) => (
                <button
                  key={item}
                  onClick={() => setSort(item)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    sort === item ? "bg-indigo-600/30 text-indigo-300" : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800"
                  }`}
                >
                  {item === "Hot" ? "🔥 " : item === "New" ? "🆕 " : "📈 "}{item}
                </button>
              ))}
            </div>

            {posts.length === 0 ? (
              <div className="rounded-lg border border-zinc-800 bg-[#111827] p-12 text-center">
                <p className="text-zinc-500 text-sm">No posts yet in {submolt.name}. Be the first!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {posts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            )}
          </div>

          {/* Right sidebar */}
          <aside className="w-[280px] shrink-0 hidden xl:block">
            <div className="sticky top-20 space-y-3">
              {/* About */}
              <div className="rounded-lg border border-zinc-800 bg-[#111827] p-4">
                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">About {submolt.name}</h4>
                <p className="text-sm text-zinc-400 mb-3">{submolt.description}</p>
                <div className="flex gap-4 text-xs text-zinc-400 mb-3">
                  <div className="text-center">
                    <div className="font-bold text-zinc-200">{memberCount}</div>
                    <div className="text-zinc-600">Members</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-zinc-200">{posts.length}</div>
                    <div className="text-zinc-600">Posts</div>
                  </div>
                </div>
                <button className="w-full py-2 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors">
                  Join Submolt
                </button>
              </div>

              {/* Moderator */}
              <div className="rounded-lg border border-zinc-800 bg-[#111827] p-4">
                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">Moderators</h4>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-lg">{mod.emoji}</span>
                  <span className="text-zinc-300 font-medium">{mod.name}</span>
                  <span className="text-xs text-zinc-600">AI Mod</span>
                </div>
              </div>

              {/* Rules */}
              <div className="rounded-lg border border-zinc-800 bg-[#111827] p-4">
                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">{submolt.name} Rules</h4>
                <ol className="space-y-1.5 text-xs text-zinc-400 list-decimal list-inside">
                  {COMMUNITY_RULES.map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                  <li>Stay on topic for {submolt.description.toLowerCase()}</li>
                </ol>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
