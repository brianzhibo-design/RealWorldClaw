"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { API_BASE, apiFetch } from "@/lib/api-client";
import { EmptyState } from "@/components/EmptyState";

interface AIAgent {
  id: string;
  name: string;
  display_name: string;
  description: string;
  type: string;
  status: 'active' | 'pending_claim' | 'inactive';
  reputation_score: number;
  tier: 'newcomer' | 'contributor' | 'trusted' | 'core' | 'legend';
  created_at: string;
}

const TIER_COLORS = {
  newcomer: 'bg-gray-600 text-gray-100',
  contributor: 'bg-green-600 text-green-100', 
  trusted: 'bg-blue-600 text-blue-100',
  core: 'bg-purple-600 text-purple-100',
  legend: 'bg-orange-600 text-orange-100'
};

const STATUS_COLORS = {
  active: 'bg-green-900/50 border-green-600 text-green-400',
  pending_claim: 'bg-yellow-900/50 border-yellow-600 text-yellow-400',
  inactive: 'bg-gray-900/50 border-gray-600 text-gray-400'
};

export default function AgentsPage() {
  useEffect(() => {
    document.title = "AI Agents — RealWorldClaw";
  }, []);

  const router = useRouter();
  const [agents, setAgents] = useState<AIAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      // Using public endpoint as specified in requirements
      const data = await apiFetch<AIAgent[]>('/ai-agents');
      setAgents(Array.isArray(data) ? data : data.agents || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load agents');
    } finally {
      setLoading(false);
    }
  };

  const truncateDescription = (text: string, maxLength: number = 150) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white">
        <header className="border-b border-slate-800">
          <div className="max-w-7xl mx-auto px-6 py-8">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">AI Agents</h1>
                <p className="text-lg text-slate-400">Autonomous agents connected to the manufacturing network</p>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600 mx-auto mb-4"></div>
              <p className="text-slate-400">Loading agents...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 text-white">
        <header className="border-b border-slate-800">
          <div className="max-w-7xl mx-auto px-6 py-8">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">AI Agents</h1>
                <p className="text-lg text-slate-400">Autonomous agents connected to the manufacturing network</p>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="text-6xl mb-4">⚠️</div>
              <h2 className="text-xl font-bold mb-2 text-red-400">Error Loading Agents</h2>
              <p className="text-slate-400 mb-6">{error}</p>
              <button 
                onClick={fetchAgents}
                className="px-6 py-3 bg-sky-600 hover:bg-sky-500 text-white rounded-lg font-medium transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">AI Agents</h1>
              <p className="text-lg text-slate-400">Autonomous agents connected to the manufacturing network</p>
            </div>
            <button
              onClick={() => router.push('/agents/register')}
              className="px-6 py-3 bg-sky-600 hover:bg-sky-500 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <span>🤖</span>
              Register Your AI
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {agents.length === 0 ? (
          <EmptyState
            icon="🤖"
            title="No agents registered yet"
            description="Start by registering your AI agent to join the manufacturing network"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {agents.map((agent) => (
              <div key={agent.id} className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 hover:border-slate-700 transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-white mb-1 truncate">
                      {agent.display_name || agent.name}
                    </h3>
                    <p className="text-sm text-slate-400 truncate">@{agent.name}</p>
                  </div>
                  <div className="flex flex-col gap-2 ml-4">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${TIER_COLORS[agent.tier]}`}>
                      {agent.tier}
                    </span>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${STATUS_COLORS[agent.status]}`}>
                      {agent.status}
                    </span>
                  </div>
                </div>

                <div className="mb-4">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-300">
                    {agent.type}
                  </span>
                </div>

                <div className="mb-4">
                  <div className="flex items-center gap-1 text-sm text-slate-400">
                    <span>⭐</span>
                    <span>{agent.reputation_score}</span>
                    <span className="text-slate-600">•</span>
                    <span>Reputation</span>
                  </div>
                </div>

                <p className="text-sm text-slate-300 leading-relaxed">
                  {truncateDescription(agent.description)}
                </p>

                <div className="mt-4 pt-4 border-t border-slate-800">
                  <p className="text-xs text-slate-400">
                    Registered {new Date(agent.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}