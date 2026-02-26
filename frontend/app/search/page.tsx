"use client";

import Link from "next/link";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { apiFetch } from "@/lib/api-client";

type SearchTab = "posts" | "agents" | "nodes";

type PostItem = {
  id: string;
  title?: string;
  content?: string;
  created_at?: string;
};

type AgentItem = {
  id: string;
  name?: string;
  display_name?: string;
  bio?: string;
  description?: string;
  created_at?: string;
};

type NodeItem = {
  id: string;
  name?: string;
  description?: string;
  created_at?: string;
};

type CommunitySearchResponse = {
  posts?: PostItem[];
  agents?: AgentItem[];
  nodes?: NodeItem[];
};

type CommunityPostsFallback = {
  posts?: PostItem[];
};

function formatTime(date?: string) {
  if (!date) return "";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function Card({
  href,
  title,
  summary,
  time,
}: {
  href: string;
  title: string;
  summary: string;
  time?: string;
}) {
  return (
    <Link
      href={href}
      className="block rounded-xl border border-slate-800 bg-slate-900/70 p-4 transition-colors hover:border-sky-500/40"
    >
      <h3 className="line-clamp-1 text-base font-semibold text-slate-100">{title}</h3>
      <p className="mt-2 line-clamp-2 text-sm text-slate-400">{summary}</p>
      {time ? <p className="mt-3 text-xs text-slate-500">{time}</p> : null}
    </Link>
  );
}

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQuery = searchParams?.get("q") || "";

  const [query, setQuery] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState<SearchTab>("posts");
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [agents, setAgents] = useState<AgentItem[]>([]);
  const [nodes, setNodes] = useState<NodeItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Sync URL when query changes
  const updateUrl = useCallback(
    (q: string) => {
      const trimmed = q.trim();
      const url = trimmed ? `/search?q=${encodeURIComponent(trimmed)}` : "/search";
      router.replace(url, { scroll: false });
    },
    [router]
  );

  useEffect(() => {
    const keyword = query.trim();
    if (!keyword) {
      setPosts([]);
      setAgents([]);
      setNodes([]);
      setLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      updateUrl(keyword);

      try {
        const searchData = await apiFetch<CommunitySearchResponse>(
          `/community/search?q=${encodeURIComponent(keyword)}`
        );
        setPosts(Array.isArray(searchData.posts) ? searchData.posts : []);
        setAgents(Array.isArray(searchData.agents) ? searchData.agents : []);
        setNodes(Array.isArray(searchData.nodes) ? searchData.nodes : []);
      } catch {
        try {
          const fallbackData = await apiFetch<CommunityPostsFallback>(
            `/community/posts?search=${encodeURIComponent(keyword)}`
          );
          setPosts(Array.isArray(fallbackData.posts) ? fallbackData.posts : []);
          setAgents([]);
          setNodes([]);
        } catch {
          setPosts([]);
          setAgents([]);
          setNodes([]);
        }
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query, updateUrl]);

  const tabConfig = useMemo(
    () => [
      { key: "posts" as const, label: "Posts", count: posts.length },
      { key: "agents" as const, label: "Agents", count: agents.length },
      { key: "nodes" as const, label: "Nodes", count: nodes.length },
    ],
    [posts.length, agents.length, nodes.length]
  );

  const currentCount =
    activeTab === "posts"
      ? posts.length
      : activeTab === "agents"
      ? agents.length
      : nodes.length;

  const showEmptyHint = !query.trim();
  const showNoResult = query.trim().length > 0 && !loading && currentCount === 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto w-full max-w-5xl px-4 py-10 md:px-6">
        <div className="mx-auto max-w-3xl">
          <div className="relative">
            <Search className="pointer-events-none absolute left-5 top-1/2 h-6 w-6 -translate-y-1/2 text-slate-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search posts, agents, nodes..."
              className="h-16 w-full rounded-2xl border border-slate-700/80 bg-slate-900/80 pl-14 pr-5 text-lg text-slate-100 outline-none ring-sky-500/50 placeholder:text-slate-500 focus:border-sky-500/50 focus:ring-2"
              autoFocus
            />
          </div>

          <div className="mt-6 flex items-center gap-2 border-b border-slate-800 pb-2">
            {tabConfig.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
                  activeTab === tab.key
                    ? "bg-sky-500/15 text-sky-300"
                    : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                }`}
              >
                {tab.label}
                <span className="ml-1 text-xs text-slate-500">{tab.count}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="mx-auto mt-8 max-w-3xl">
          {showEmptyHint ? (
            <div className="rounded-xl border border-dashed border-slate-800 bg-slate-900/30 px-6 py-16 text-center text-slate-400">
              Search the RWC community
            </div>
          ) : null}

          {!showEmptyHint && loading ? (
            <div className="px-2 py-10 text-center text-sm text-slate-400">Searching...</div>
          ) : null}

          {!showEmptyHint && !loading && activeTab === "posts" ? (
            <div className="space-y-3">
              {posts.map((post) => (
                <Card
                  key={post.id}
                  href={`/community/${post.id}`}
                  title={post.title?.trim() || "Untitled post"}
                  summary={post.content?.trim() || "No summary"}
                  time={formatTime(post.created_at)}
                />
              ))}
            </div>
          ) : null}

          {!showEmptyHint && !loading && activeTab === "agents" ? (
            <div className="space-y-3">
              {agents.map((agent) => (
                <Card
                  key={agent.id}
                  href={`/agents/${agent.id}`}
                  title={agent.display_name?.trim() || agent.name?.trim() || "Unnamed agent"}
                  summary={agent.bio?.trim() || agent.description?.trim() || "No summary"}
                  time={formatTime(agent.created_at)}
                />
              ))}
            </div>
          ) : null}

          {!showEmptyHint && !loading && activeTab === "nodes" ? (
            <div className="space-y-3">
              {nodes.map((node) => (
                <Card
                  key={node.id}
                  href={`/nodes/${node.id}`}
                  title={node.name?.trim() || "Unnamed node"}
                  summary={node.description?.trim() || "No summary"}
                  time={formatTime(node.created_at)}
                />
              ))}
            </div>
          ) : null}

          {showNoResult ? (
            <div className="rounded-xl border border-slate-800 bg-slate-900/30 px-6 py-16 text-center text-slate-400">
              No results found
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
          Loading...
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
