"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { API_BASE } from "@/lib/api-client";
import { fetchMapNodes } from "@/lib/nodes";
import { useAuthStore } from "@/stores/authStore";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ProofType = "photo" | "video" | "log" | "sensor";
type VerificationStatus = "pending" | "verified" | "rejected";

type ProofItem = {
  id: string;
  proof_type: string;
  description: string;
  submitted_at: string;
  verification_status: string;
  node_id: string;
  node_name: string;
};

type RawProof = {
  id?: string;
  proof_id?: string;
  proof_type?: string;
  type?: string;
  description?: string;
  submitted_at?: string;
  created_at?: string;
  verification_status?: string;
  status?: string;
  node_id?: string;
};

const PROOF_ICON: Record<ProofType, string> = {
  photo: "📷",
  video: "🎬",
  log: "📋",
  sensor: "📊",
};

const STATUS_STYLE: Record<VerificationStatus, string> = {
  pending: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  verified: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  rejected: "bg-rose-500/15 text-rose-300 border-rose-500/30",
};

function normalizeProofType(value?: string): ProofType {
  if (!value) return "log";
  const v = value.toLowerCase();
  if (v === "photo" || v === "video" || v === "log" || v === "sensor") return v;
  return "log";
}

function normalizeStatus(value?: string): VerificationStatus {
  if (!value) return "pending";
  const v = value.toLowerCase();
  if (v === "pending" || v === "verified" || v === "rejected") return v;
  return "pending";
}

function formatTime(value: string): string {
  if (!value) return "Unknown time";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown time";
  return date.toLocaleString();
}

export default function ProofPage() {
  const { isAuthenticated } = useAuthStore();
  const [proofs, setProofs] = useState<ProofItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Proof of Physical — RealWorldClaw";
  }, []);

  useEffect(() => {
    const loadProofs = async () => {
      setLoading(true);
      setError(null);

      try {
        const nodes = await fetchMapNodes();

        if (!nodes.length) {
          setProofs([]);
          setLoading(false);
          return;
        }

        const responses = await Promise.all(
          nodes.map(async (node) => {
            try {
              const res = await fetch(`${API_BASE}/proof/node/${node.id}`, {
                cache: "no-store",
                credentials: "include",
              });

              if (!res.ok) return [] as ProofItem[];

              const data = (await res.json()) as RawProof[] | { proofs?: RawProof[] };
              const list = Array.isArray(data) ? data : Array.isArray(data?.proofs) ? data.proofs : [];

              return list.map((item, index) => ({
                id: item.id || item.proof_id || `${node.id}-${index}`,
                proof_type: normalizeProofType(item.proof_type || item.type),
                description: item.description || "No description provided",
                submitted_at: item.submitted_at || item.created_at || "",
                verification_status: normalizeStatus(item.verification_status || item.status),
                node_id: item.node_id || node.id,
                node_name: node.name || `Node ${node.id.slice(0, 8)}`,
              }));
            } catch {
              return [] as ProofItem[];
            }
          })
        );

        const merged = responses
          .flat()
          .sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime());

        setProofs(merged);
      } catch {
        setError("Unable to load manufacturing proofs right now. Please try again.");
        setProofs([]);
      } finally {
        setLoading(false);
      }
    };

    loadProofs();
  }, []);

  const submitHref = useMemo(
    () => (isAuthenticated ? "/dashboard" : "/auth/login?next=%2Fproof"),
    [isAuthenticated]
  );

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <section className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
        <div className="mb-8 flex flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-900/40 p-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Proof of Physical</h1>
            <p className="mt-2 text-sm text-slate-300 sm:text-base">
              Verified manufacturing evidence from the RWC network
            </p>
          </div>

          <Button asChild className="bg-sky-500 text-white hover:bg-sky-400">
            <Link href={submitHref}>Submit Proof</Link>
          </Button>
        </div>

        {loading && (
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 px-6 py-10 text-center text-slate-400">
            Loading manufacturing proofs...
          </div>
        )}

        {!loading && error && (
          <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-6 py-10 text-center text-rose-200">
            {error}
          </div>
        )}

        {!loading && !error && proofs.length === 0 && (
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 px-6 py-12 text-center">
            <p className="text-lg font-medium text-slate-100">No manufacturing proofs submitted yet.</p>
            <p className="mt-2 text-sm text-slate-400">
              Nodes can submit evidence of their work.
            </p>
          </div>
        )}

        {!loading && !error && proofs.length > 0 && (
          <div className="grid gap-4">
            {proofs.map((proof) => {
              const type = normalizeProofType(proof.proof_type);
              const status = normalizeStatus(proof.verification_status);

              return (
                <Card
                  key={proof.id}
                  className="border-slate-800 bg-slate-900/60 shadow-none"
                >
                  <CardHeader className="pb-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <CardTitle className="flex items-center gap-2 text-base text-slate-100">
                        <span aria-hidden="true" className="text-lg leading-none">
                          {PROOF_ICON[type]}
                        </span>
                        <span className="capitalize">{type} proof</span>
                      </CardTitle>
                      <Badge className={STATUS_STYLE[status]}>{status}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm leading-relaxed text-slate-200">{proof.description}</p>
                    <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-400">
                      <span>Submitted: {formatTime(proof.submitted_at)}</span>
                      <span>Node: {proof.node_name}</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
