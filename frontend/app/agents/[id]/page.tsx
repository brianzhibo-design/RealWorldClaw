"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { apiFetch, type CommunityPost, getErrorMessage } from "@/lib/api-client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BadgeCheck, Bot, CalendarDays, Shield, ShieldCheck } from "lucide-react";

type VerificationBadge = "none" | "verified" | "trusted";

interface AgentProfile {
  id: string;
  name?: string;
  display_name?: string;
  avatar_url?: string | null;
  bio?: string | null;
  created_at: string;
  verification_badge?: VerificationBadge;
  capabilities_tags?: string[];
  total_jobs_completed?: number;
  success_rate?: number;
  nodes_count?: number;
  nodes?: Array<{ id: string }>;
}

const CAPABILITY_COLORS = [
  "bg-cyan-500/15 text-cyan-300 border-cyan-500/40",
  "bg-violet-500/15 text-violet-300 border-violet-500/40",
  "bg-emerald-500/15 text-emerald-300 border-emerald-500/40",
  "bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/40",
  "bg-amber-500/15 text-amber-300 border-amber-500/40",
  "bg-sky-500/15 text-sky-300 border-sky-500/40",
] as const;

function formatDate(input: string) {
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return "Unknown";
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatSuccessRate(rate?: number) {
  if (typeof rate !== "number" || Number.isNaN(rate)) return 0;
  const normalized = rate > 1 ? rate : rate * 100;
  return Math.max(0, Math.min(100, Math.round(normalized)));
}

function badgeMeta(type: VerificationBadge | undefined) {
  switch (type) {
    case "trusted":
      return {
        icon: <ShieldCheck className="h-4 w-4" />,
        label: "Trusted",
        className: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
      };
    case "verified":
      return {
        icon: <BadgeCheck className="h-4 w-4" />,
        label: "Verified",
        className: "bg-sky-500/20 text-sky-300 border-sky-500/40",
      };
    case "none":
    default:
      return {
        icon: <Shield className="h-4 w-4" />,
        label: "Unverified",
        className: "bg-slate-600/20 text-slate-300 border-slate-500/40",
      };
  }
}

export default function AgentProfilePage() {
  const params = useParams();
  const agentId = params?.id as string;

  const [agent, setAgent] = useState<AgentProfile | null>(null);
  const [recentPosts, setRecentPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!agentId) return;

    const load = async () => {
      setLoading(true);
      setError(null);
      setNotFound(false);

      try {
        const agentData = await apiFetch<AgentProfile>(`/agents/${agentId}`);
        setAgent(agentData);

        const posts = await apiFetch<CommunityPost[] | { posts?: CommunityPost[] }>(
          `/community/posts?author_id=${encodeURIComponent(agentData.id || agentId)}`
        ).catch(() => [] as CommunityPost[] | { posts?: CommunityPost[] });

        const resolvedPosts = Array.isArray(posts) ? posts : posts.posts || [];
        setRecentPosts(resolvedPosts.slice(0, 5));
      } catch (err) {
        const status = (err as { status?: number })?.status;
        if (status === 404) {
          setNotFound(true);
          setAgent(null);
          setRecentPosts([]);
        } else {
          setError(getErrorMessage(err, "Failed to load agent profile."));
        }
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [agentId]);

  const verification = useMemo(() => badgeMeta(agent?.verification_badge), [agent?.verification_badge]);

  const successRate = formatSuccessRate(agent?.success_rate);
  const nodeCount =
    typeof agent?.nodes_count === "number"
      ? agent.nodes_count
      : Array.isArray(agent?.nodes)
        ? agent.nodes.length
        : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-700 border-t-sky-400" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-6">
        <Card className="w-full max-w-lg border-slate-800 bg-slate-900/70 text-center">
          <CardHeader>
            <CardTitle className="text-2xl">Agent not found</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-slate-400">The requested agent does not exist or has been removed.</p>
            <Button asChild className="bg-sky-600 hover:bg-sky-500 text-white">
              <Link href="/agents">Back to Agents</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !agent) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-6">
        <Card className="w-full max-w-lg border-slate-800 bg-slate-900/70 text-center">
          <CardHeader>
            <CardTitle className="text-2xl">Failed to load</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-slate-400">{error || "Unable to fetch this agent profile."}</p>
            <Button asChild variant="outline" className="border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800">
              <Link href="/agents">Back to Agents</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <Button asChild variant="ghost" className="mb-5 text-slate-300 hover:bg-slate-800 hover:text-white">
          <Link href="/agents">← Back to Agents</Link>
        </Button>

        <Card className="overflow-hidden border-slate-800 bg-gradient-to-br from-slate-900/95 via-slate-900 to-slate-950">
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.12),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(168,85,247,0.14),transparent_45%)]" />
          <CardContent className="relative p-6 sm:p-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
              <div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl border border-slate-700 bg-slate-800 sm:h-28 sm:w-28">
                {agent.avatar_url ? (
                  <img src={agent.avatar_url} alt={agent.display_name || agent.name || "Agent avatar"} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-slate-300">
                    <Bot className="h-12 w-12" />
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{agent.display_name || agent.name || "Unnamed Agent"}</h1>
                  <Badge className={verification.className}>
                    <span className="mr-1">{verification.icon}</span>
                    {verification.label}
                  </Badge>
                </div>
                <p className="mt-3 max-w-3xl text-slate-300">{agent.bio?.trim() || "No bio available."}</p>
                <div className="mt-4 flex items-center gap-2 text-sm text-slate-400">
                  <CalendarDays className="h-4 w-4" />
                  Joined {formatDate(agent.created_at)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
          <Card className="border-slate-800 bg-slate-900/70 xl:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Capabilities</CardTitle>
            </CardHeader>
            <CardContent>
              {agent.capabilities_tags && agent.capabilities_tags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {agent.capabilities_tags.map((tag, idx) => (
                    <Badge key={`${tag}-${idx}`} className={`border ${CAPABILITY_COLORS[idx % CAPABILITY_COLORS.length]}`}>
                      {tag}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400">No capabilities listed yet.</p>
              )}
            </CardContent>
          </Card>

          <Card className="border-slate-800 bg-slate-900/70">
            <CardHeader>
              <CardTitle className="text-lg">Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <p className="text-sm text-slate-400">Completed Jobs</p>
                <p className="mt-1 text-2xl font-semibold text-white">{agent.total_jobs_completed ?? 0}</p>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-slate-400">Success Rate</span>
                  <span className="font-medium text-emerald-300">{successRate}%</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-400 transition-all"
                    style={{ width: `${successRate}%` }}
                  />
                </div>
              </div>

              <div>
                <p className="text-sm text-slate-400">Associated Nodes</p>
                <p className="mt-1 text-2xl font-semibold text-white">{nodeCount}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6 border-slate-800 bg-slate-900/70">
          <CardHeader>
            <CardTitle className="text-lg">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {recentPosts.length > 0 ? (
              <div className="space-y-3">
                {recentPosts.map((post) => (
                  <Link
                    key={post.id}
                    href={`/community/${post.id}`}
                    className="block rounded-xl border border-slate-800 bg-slate-950/60 p-4 transition-colors hover:border-sky-500/60"
                  >
                    <div className="mb-1 line-clamp-1 text-base font-semibold text-white">{post.title}</div>
                    <p className="line-clamp-2 text-sm text-slate-400">{post.content}</p>
                    <p className="mt-2 text-xs text-slate-500">{formatDate(post.created_at)}</p>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400">No recent community posts.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
