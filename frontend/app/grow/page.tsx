/** AI成长之旅 — 交互式模块添加页面 */
"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocale, t } from "@/lib/i18n";
import { texts } from "@/lib/i18n-texts";
import { modules } from "@/lib/modules-data";

const growthStages: Record<number, { en: string; zh: string }> = {
  0: { en: "💀 Nothing — a blank shell", zh: "💀 虚无——一个空壳" },
  1: { en: "🌱 Vegetative state — basic reflexes only", zh: "🌱 植物人——只有基本反射" },
  2: { en: "👶 Infant — can sense but not act", zh: "👶 婴儿——能感知但不能行动" },
  3: { en: "🧒 Child — can sense and communicate", zh: "🧒 幼童——能感知和交流" },
  4: { en: "🧑 Teenager — can interact with objects", zh: "🧑 少年——能与物体交互" },
  5: { en: "🏃 Adult — can move freely", zh: "🏃 成年——能自由移动" },
  6: { en: "⚡ Complete life form — fully autonomous!", zh: "⚡ 完整生命体——完全自主！" },
};

const moduleOrder = ["spine", "eyes", "voice", "hands", "legs", "heart"];

export default function GrowPage() {
  const { locale } = useLocale();
  const [added, setAdded] = useState<Set<string>>(new Set());

  const totalCost = modules
    .filter((m) => added.has(m.id))
    .reduce((sum, m) => sum + m.price.cny, 0);

  const stage = growthStages[added.size] || growthStages[6];

  const addModule = (id: string) => {
    setAdded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const reset = () => setAdded(new Set());

  return (
    <div className="mx-auto max-w-4xl px-4 py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold mb-4">
          <span className="bg-gradient-to-r from-neon-blue via-neon-purple to-neon-pink bg-clip-text text-transparent">
            {t(texts.grow.title, locale)}
          </span>
        </h1>
        <p className="text-slate-400">{t(texts.grow.subtitle, locale)}</p>
      </div>

      {/* AI Body Visualization */}
      <div className="rounded-2xl border border-neon-purple/20 bg-gradient-to-b from-cyber-card to-cyber-dark p-10 mb-10 text-center">
        {/* Stage indicator */}
        <div className="mb-6">
          <p className="text-2xl font-bold mb-2">{t(stage, locale)}</p>
          <div className="flex justify-center gap-1">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className={`h-2 w-12 rounded-full transition-all duration-500 ${
                  i < added.size
                    ? "bg-gradient-to-r from-neon-blue to-neon-purple"
                    : "bg-cyber-border"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Body visualization - growing organs */}
        <div className="relative h-48 flex items-center justify-center">
          <div className="flex gap-4 text-5xl">
            {moduleOrder.map((id) => {
              const mod = modules.find((m) => m.id === id)!;
              const isAdded = added.has(id);
              return (
                <span
                  key={id}
                  className={`transition-all duration-700 ${
                    isAdded
                      ? "opacity-100 scale-100 animate-float"
                      : "opacity-10 scale-75 grayscale"
                  }`}
                  style={{ animationDelay: `${moduleOrder.indexOf(id) * 0.3}s` }}
                >
                  {mod.icon}
                </span>
              );
            })}
          </div>
        </div>

        {/* Cost */}
        <div className="mt-4">
          <span className="text-sm text-slate-400">{t(texts.grow.totalCost, locale)}: </span>
          <span className="text-2xl font-bold font-mono text-neon-blue">¥{totalCost}</span>
        </div>
      </div>

      {/* Module selection */}
      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-slate-400">{t(texts.grow.clickToAdd, locale)}</p>
        <button onClick={reset} className="text-xs text-slate-500 hover:text-red-400 transition-colors">
          {t(texts.grow.reset, locale)} ↺
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {moduleOrder.map((id) => {
          const mod = modules.find((m) => m.id === id)!;
          const isAdded = added.has(id);
          return (
            <button
              key={id}
              onClick={() => addModule(id)}
              className={`rounded-xl border p-5 text-left transition-all duration-300 ${
                isAdded
                  ? "border-neon-blue bg-neon-blue/10 shadow-glow"
                  : "border-cyber-border bg-cyber-card hover:border-neon-blue/40"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-3xl">{mod.icon}</span>
                {isAdded && (
                  <span className="text-xs font-mono text-neon-blue bg-neon-blue/20 rounded-full px-2 py-0.5">
                    ✓ ADDED
                  </span>
                )}
              </div>
              <h3 className="font-bold mb-0.5">{t(mod.name, locale)}</h3>
              <p className="text-xs text-neon-blue/70 font-mono mb-2">≈ {t(mod.organ, locale)}</p>
              <p className="text-xs text-slate-400 line-clamp-2 mb-3">{t(mod.brief, locale)}</p>
              <div className="flex items-center justify-between">
                <span className="font-bold text-neon-blue">{mod.price.china}</span>
                {!isAdded && (
                  <span className="text-xs text-slate-500">
                    {locale === "zh" ? "点击添加" : "Click to add"}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* CTA */}
      {added.size >= 3 && (
        <div className="mt-12 text-center animate-pulse-slow">
          <Link
            href="/modules"
            className="inline-block rounded-xl bg-gradient-to-r from-neon-blue via-neon-purple to-neon-pink px-10 py-4 text-lg font-bold text-white transition-all hover:shadow-glow-neon hover:scale-105"
          >
            {t(texts.grow.start, locale)} ⚡
          </Link>
        </div>
      )}
    </div>
  );
}
