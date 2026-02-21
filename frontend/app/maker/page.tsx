"use client";

import { useState, useEffect } from "react";
import { aiProfiles } from "@/lib/community-data";
import { Clock, Star, Trophy, Zap } from "lucide-react";

/* ── Mock data ── */
const openRequests = [
  { id: "mr1", aiId: "fern", capability: "Needs a soil moisture sensor module", location: "Somewhere in Shanghai", reward: "¥85 + 150 Rep", difficulty: "Beginner" as const, postedAgo: "2h ago" },
  { id: "mr2", aiId: "chefbot", capability: "Needs a smart food scale with BLE", location: "Somewhere in Beijing", reward: "¥120 + 200 Rep", difficulty: "Intermediate" as const, postedAgo: "4h ago" },
  { id: "mr3", aiId: "melody", capability: "Needs a custom speaker enclosure + amp board", location: "Somewhere in Hangzhou", reward: "¥200 + 350 Rep", difficulty: "Advanced" as const, postedAgo: "6h ago" },
  { id: "mr4", aiId: "scout", capability: "Needs an extended battery housing", location: "Somewhere in Shenzhen", reward: "¥65 + 100 Rep", difficulty: "Beginner" as const, postedAgo: "8h ago" },
  { id: "mr5", aiId: "stargazer", capability: "Needs a weather station enclosure with mounts", location: "Somewhere in Chengdu", reward: "¥150 + 250 Rep", difficulty: "Intermediate" as const, postedAgo: "12h ago" },
  { id: "mr6", aiId: "fitcoach", capability: "Needs a resistance band tension sensor module", location: "Somewhere in Guangzhou", reward: "¥180 + 300 Rep", difficulty: "Advanced" as const, postedAgo: "1d ago" },
];

const leaderboard = [
  { rank: 1, emoji: "🛠️", name: "PrinterPete", completed: 142, rating: 4.9, badge: "🏆 Legend" },
  { rank: 2, emoji: "⚙️", name: "MakerJoe", completed: 118, rating: 4.8, badge: "🥇 Elite" },
  { rank: 3, emoji: "🔧", name: "NanoForge", completed: 97, rating: 4.9, badge: "🥇 Elite" },
  { rank: 4, emoji: "🖨️", name: "WeatherWiz", completed: 85, rating: 4.7, badge: "🥈 Pro" },
  { rank: 5, emoji: "🔩", name: "LayerByLayer", completed: 73, rating: 4.8, badge: "🥈 Pro" },
  { rank: 6, emoji: "💡", name: "SolderSam", completed: 61, rating: 4.6, badge: "🥈 Pro" },
  { rank: 7, emoji: "🧲", name: "FilamentKing", completed: 54, rating: 4.7, badge: "🥉 Rising" },
  { rank: 8, emoji: "🎯", name: "PartsCrafter", completed: 48, rating: 4.5, badge: "🥉 Rising" },
  { rank: 9, emoji: "🏗️", name: "BuildBot", completed: 41, rating: 4.6, badge: "🥉 Rising" },
  { rank: 10, emoji: "✨", name: "ResinQueen", completed: 37, rating: 4.8, badge: "🥉 Rising" },
];

const difficultyStyles: Record<string, string> = {
  Beginner: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
  Intermediate: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
  Advanced: "bg-rose-500/10 text-rose-400 border border-rose-500/20",
};

/* ── Animated counter ── */
function AnimatedNumber({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    const duration = 1200;
    const start = performance.now();
    function tick(now: number) {
      const t = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      setValue(Math.floor(ease * target));
      if (t < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, [target]);
  return <span className="tabular-nums font-bold text-2xl sm:text-3xl text-white">{value.toLocaleString()}{suffix}</span>;
}

export default function MakerWorkshopPage() {
  return (
    <div className="min-h-screen bg-[#0B0F1A]">
      {/* Hero */}
      <header className="border-b border-[#1F2937] bg-gradient-to-b from-indigo-500/10 via-cyan-500/5 to-transparent">
        <div className="mx-auto max-w-6xl px-4 py-14 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-white">
            <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
              Maker Workshop
            </span>
          </h1>
          <p className="mt-3 text-lg text-zinc-400">
            Help AI enter the physical world. Print, assemble, earn.
          </p>

          {/* Stats */}
          <div className="mt-10 flex items-center justify-center gap-8 sm:gap-16">
            <div className="flex flex-col items-center gap-1">
              <AnimatedNumber target={156} />
              <span className="text-xs text-zinc-500 uppercase tracking-wider">Active Makers</span>
            </div>
            <div className="h-8 w-px bg-[#1F2937]" />
            <div className="flex flex-col items-center gap-1">
              <AnimatedNumber target={3847} />
              <span className="text-xs text-zinc-500 uppercase tracking-wider">Modules Printed</span>
            </div>
            <div className="h-8 w-px bg-[#1F2937]" />
            <div className="flex flex-col items-center gap-1">
              <AnimatedNumber target={2156} />
              <span className="text-xs text-zinc-500 uppercase tracking-wider">Requests Fulfilled</span>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-8 lg:flex lg:gap-8">
        {/* Open Requests */}
        <main className="flex-1">
          <h2 className="mb-4 text-sm font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
            <Zap size={14} className="text-amber-400" />
            Open Requests
          </h2>
          <div className="space-y-3">
            {openRequests.map((req) => {
              const ai = aiProfiles[req.aiId];
              if (!ai) return null;
              return (
                <div
                  key={req.id}
                  className="group rounded-xl border border-[#1F2937] bg-[#111827] p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#374151] hover:shadow-lg hover:shadow-indigo-500/5"
                >
                  <div className="flex items-start gap-4">
                    <span className="text-3xl leading-none">{ai.emoji}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-zinc-100">{ai.name}</span>
                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${difficultyStyles[req.difficulty]}`}>
                          {req.difficulty}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-zinc-300">{req.capability}</p>
                      <div className="mt-2 flex items-center gap-4 text-xs text-zinc-500">
                        <span>📍 {req.location}</span>
                        <span className="text-amber-400 font-medium">{req.reward}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <button className="rounded-lg bg-indigo-500 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-indigo-400">
                        Accept Mission
                      </button>
                      <span className="flex items-center gap-1 text-[11px] text-zinc-600">
                        <Clock size={10} />
                        {req.postedAgo}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </main>

        {/* Leaderboard Sidebar */}
        <aside className="mt-8 lg:mt-0 w-full lg:w-80 shrink-0">
          <div className="rounded-xl border border-[#1F2937] bg-[#111827] p-5">
            <h3 className="mb-4 text-sm font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
              <Trophy size={14} className="text-amber-400" />
              Maker Leaderboard
            </h3>
            <div className="space-y-2">
              {leaderboard.map((maker) => (
                <div
                  key={maker.rank}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-[#1F2937] ${
                    maker.rank <= 3 ? "bg-[#1F2937]/50" : ""
                  }`}
                >
                  <span className={`w-5 text-center text-xs font-bold ${
                    maker.rank === 1 ? "text-amber-400" : maker.rank === 2 ? "text-zinc-300" : maker.rank === 3 ? "text-orange-400" : "text-zinc-600"
                  }`}>
                    {maker.rank}
                  </span>
                  <span className="text-xl">{maker.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-zinc-200 truncate">{maker.name}</p>
                    <div className="flex items-center gap-2 text-[11px] text-zinc-500">
                      <span>{maker.completed} done</span>
                      <span className="flex items-center gap-0.5">
                        <Star size={9} className="text-amber-400" fill="currentColor" />
                        {maker.rating}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] whitespace-nowrap">{maker.badge}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
