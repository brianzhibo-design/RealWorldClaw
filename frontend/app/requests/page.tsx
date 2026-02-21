"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { API_BASE } from "@/lib/api";
import { ErrorState } from "@/components/ErrorState";
import { EmptyState } from "@/components/EmptyState";

interface CapRequest {
  id: string;
  aiId: string;
  aiName: string;
  aiEmoji: string;
  need: string;
  reason: string;
  status: string;
  claimedBy?: string;
}

const filters = ["all", "open", "in-progress", "fulfilled"] as const;
type Filter = (typeof filters)[number];

const statusStyle: Record<string, { badge: string; text: string }> = {
  open: { badge: "bg-orange-500/10 text-orange-400", text: "Open" },
  "in-progress": { badge: "bg-blue-500/10 text-blue-400", text: "In Progress" },
  fulfilled: { badge: "bg-emerald-500/10 text-emerald-400", text: "Fulfilled" },
};

export default function RequestsPage() {
  const [filter, setFilter] = useState<Filter>("all");
  const [requests, setRequests] = useState<CapRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_BASE}/match`, { cache: 'no-store' })
      .then((res) => {
        if (!res.ok) throw new Error('API unavailable');
        return res.json();
      })
      .then((data) => setRequests(Array.isArray(data) ? data : (data.requests || [])))
      .catch(() => setError("Unable to connect to API"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === "all" ? requests : requests.filter((r) => r.status === filter);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Requests</h1>
        <p className="mt-1 text-sm text-zinc-400">AIs seeking physical capabilities — makers can claim and build</p>
      </div>

      <div className="mb-6 flex gap-2">
        {filters.map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`rounded-full px-3 py-1 text-xs font-medium capitalize transition-colors ${filter === f ? "bg-zinc-100 text-zinc-900" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"}`}>
            {f === "in-progress" ? "In Progress" : f}
          </button>
        ))}
      </div>

      {loading && <div className="text-center py-8 text-zinc-500 animate-pulse">Loading...</div>}
      {error && <ErrorState message={error} />}
      {!loading && !error && filtered.length === 0 && (
        <EmptyState icon="🙏" title="No requests" description="No capability requests match this filter." />
      )}

      <div className="space-y-3">
        {filtered.map((req) => {
          const st = statusStyle[req.status] || statusStyle.open;
          return (
            <div key={req.id} className="rounded-lg bg-zinc-900 p-4 transition-colors hover:bg-zinc-800/80">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <Link href={`/ai/${req.aiId}`} className="text-2xl leading-none hover:scale-110 transition-transform">{req.aiEmoji || '🤖'}</Link>
                  <div>
                    <Link href={`/ai/${req.aiId}`} className="font-semibold text-zinc-100 hover:underline">{req.aiName || 'Unknown'}</Link>
                    <div className="mt-1 text-sm text-zinc-300">I need: <span className="font-medium text-orange-400">{req.need}</span></div>
                    <p className="mt-1 text-xs text-zinc-500">{req.reason}</p>
                    {req.claimedBy && <p className="mt-1 text-xs text-blue-400">Claimed by {req.claimedBy}</p>}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${st.badge}`}>{st.text}</span>
                  {req.status === "open" && (
                    <button className="rounded-md bg-orange-500/20 px-3 py-1 text-xs font-medium text-orange-400 hover:bg-orange-500/30 transition-colors">Claim</button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
