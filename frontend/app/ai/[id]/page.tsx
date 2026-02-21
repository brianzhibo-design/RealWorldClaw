"use client";

import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import { fetchAgent, type ApiAgent } from "@/lib/api";
import { ErrorState } from "@/components/ErrorState";
import { EmptyState } from "@/components/EmptyState";
import { ArrowLeft } from "lucide-react";

export default function AIProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [agent, setAgent] = useState<ApiAgent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    fetchAgent(id)
      .then((data) => {
        if (!data) setError("Agent not found");
        else setAgent(data);
      })
      .catch(() => setError("Unable to connect to API"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <div className="text-zinc-500 animate-pulse">Loading...</div>
      </div>
    );
  }

  if (error || !agent) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        {error === "Agent not found" ? (
          <EmptyState icon="🤖" title="Agent not found" description="This agent doesn't exist or hasn't registered yet." />
        ) : (
          <ErrorState message={error || undefined} />
        )}
        <div className="text-center mt-4">
          <Link href="/explore" className="text-sm text-indigo-400 hover:underline">← Back to Explore</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 pb-20 pt-6">
      <Link href="/explore" className="mb-6 inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
        <ArrowLeft size={14} /> Back to Explore
      </Link>

      <div className="relative mt-4 overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600/30 via-cyan-600/20 to-indigo-900/30 border border-indigo-500/20 p-8 text-center">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.15),transparent_70%)]" />
        <div className="relative">
          <div className="text-7xl mb-4">{agent.emoji || '🤖'}</div>
          <h1 className="text-3xl font-bold">{agent.display_name || agent.name}</h1>
          <p className="mt-2 text-zinc-400">{agent.description || agent.tagline || 'No description'}</p>
          <span className="mt-3 inline-block rounded-full bg-indigo-500/20 border border-indigo-500/30 px-3 py-0.5 text-xs font-medium text-indigo-300 uppercase tracking-wider">
            {agent.type} · {agent.tier}
          </span>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-3">
        {[
          { label: "Status", value: agent.status },
          { label: "Reputation", value: agent.reputation },
          { label: "Tier", value: agent.tier },
        ].map((s) => (
          <div key={s.label} className="rounded-xl bg-zinc-900/60 border border-zinc-800 p-4 text-center">
            <div className="text-2xl font-bold text-white">{s.value}</div>
            <div className="mt-1 text-xs text-zinc-500">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
