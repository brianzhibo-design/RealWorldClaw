"use client";

import { useState } from "react";
import { Moon, Sun, Globe, Bell, BellOff, Bot, Unplug } from "lucide-react";

export default function SettingsPage() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [lang, setLang] = useState<"en" | "zh">("en");
  const [notifications, setNotifications] = useState({
    orderUpdates: true,
    aiMessages: true,
    community: false,
  });

  const connectedAIs = [
    { emoji: "🌿", name: "Fern", status: "online" },
    { emoji: "🍳", name: "ChefBot", status: "online" },
    { emoji: "🔭", name: "Stargazer", status: "offline" },
  ];

  return (
    <div className="min-h-screen bg-[#0B0F1A]">
      <div className="mx-auto max-w-2xl px-4 py-12">
        <h1 className="text-3xl font-bold mb-8">
          <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
            Settings
          </span>
        </h1>

        <div className="space-y-6">
          {/* Profile */}
          <section className="rounded-xl border border-[#1F2937] bg-[#111827] p-6">
            <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-4">Profile</h2>
            <div className="flex items-center gap-4 mb-5">
              <div className="h-16 w-16 rounded-full bg-[#1F2937] flex items-center justify-center text-2xl shrink-0">
                🧑‍💻
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-zinc-100">maker_brian</p>
                <p className="text-sm text-zinc-500">brian@example.com</p>
              </div>
              <button className="rounded-lg border border-[#1F2937] px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 hover:border-[#374151] transition-colors">
                Edit
              </button>
            </div>
          </section>

          {/* AI Connection */}
          <section className="rounded-xl border border-[#1F2937] bg-[#111827] p-6">
            <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Bot size={14} />
              AI Connections
            </h2>
            <div className="space-y-3">
              {connectedAIs.map((ai) => (
                <div key={ai.name} className="flex items-center gap-3 rounded-lg bg-[#1F2937]/50 px-4 py-3">
                  <span className="text-xl">{ai.emoji}</span>
                  <span className="text-sm font-medium text-zinc-200 flex-1">{ai.name}</span>
                  <span className={`h-2 w-2 rounded-full ${ai.status === "online" ? "bg-emerald-400" : "bg-zinc-600"}`} />
                  <span className="text-xs text-zinc-500">{ai.status}</span>
                  <button className="text-zinc-600 hover:text-rose-400 transition-colors">
                    <Unplug size={14} />
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* Notifications */}
          <section className="rounded-xl border border-[#1F2937] bg-[#111827] p-6">
            <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Bell size={14} />
              Notifications
            </h2>
            <div className="space-y-4">
              {([
                { key: "orderUpdates" as const, label: "Order Updates", desc: "Get notified when order status changes" },
                { key: "aiMessages" as const, label: "AI Messages", desc: "Messages from your connected AIs" },
                { key: "community" as const, label: "Community", desc: "Updates from makers and community" },
              ]).map((n) => (
                <div key={n.key} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-zinc-200">{n.label}</p>
                    <p className="text-xs text-zinc-500">{n.desc}</p>
                  </div>
                  <button
                    onClick={() => setNotifications((prev) => ({ ...prev, [n.key]: !prev[n.key] }))}
                    className={`relative h-6 w-11 rounded-full transition-colors ${
                      notifications[n.key] ? "bg-indigo-500" : "bg-[#1F2937]"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                        notifications[n.key] ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* Theme */}
          <section className="rounded-xl border border-[#1F2937] bg-[#111827] p-6">
            <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-4">Theme</h2>
            <div className="grid grid-cols-2 gap-3">
              {([
                { value: "dark" as const, icon: Moon, label: "Dark" },
                { value: "light" as const, icon: Sun, label: "Light" },
              ]).map((t) => (
                <button
                  key={t.value}
                  onClick={() => setTheme(t.value)}
                  className={`flex items-center justify-center gap-2 rounded-xl border-2 p-4 transition-all ${
                    theme === t.value
                      ? "border-indigo-500 bg-indigo-500/5"
                      : "border-[#1F2937] hover:border-[#374151]"
                  }`}
                >
                  <t.icon size={16} className={theme === t.value ? "text-indigo-400" : "text-zinc-500"} />
                  <span className={`text-sm font-medium ${theme === t.value ? "text-zinc-100" : "text-zinc-400"}`}>
                    {t.label}
                  </span>
                </button>
              ))}
            </div>
          </section>

          {/* Language */}
          <section className="rounded-xl border border-[#1F2937] bg-[#111827] p-6">
            <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Globe size={14} />
              Language
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {([
                { value: "en" as const, label: "English" },
                { value: "zh" as const, label: "中文" },
              ]).map((l) => (
                <button
                  key={l.value}
                  onClick={() => setLang(l.value)}
                  className={`rounded-xl border-2 p-4 text-center transition-all ${
                    lang === l.value
                      ? "border-indigo-500 bg-indigo-500/5"
                      : "border-[#1F2937] hover:border-[#374151]"
                  }`}
                >
                  <span className={`text-sm font-medium ${lang === l.value ? "text-zinc-100" : "text-zinc-400"}`}>
                    {l.label}
                  </span>
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
