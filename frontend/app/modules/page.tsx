/** 模块商城 */
"use client";

import Link from "next/link";
import { useState } from "react";
import { useLocale, t } from "@/lib/i18n";
import { texts } from "@/lib/i18n-texts";
import { modules, ModuleCategory } from "@/lib/modules-data";

const categories: (ModuleCategory | "All")[] = ["All", "Core", "Input", "Output", "Power"];

export default function ModulesPage() {
  const { locale } = useLocale();
  const [filter, setFilter] = useState<ModuleCategory | "All">("All");

  const filtered = filter === "All" ? modules : modules.filter((m) => m.category === filter);

  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold mb-4">
          <span className="bg-gradient-to-r from-neon-blue to-neon-purple bg-clip-text text-transparent">
            {t(texts.modules.title, locale)}
          </span>
        </h1>
        <p className="text-slate-400 max-w-lg mx-auto">{t(texts.modules.subtitle, locale)}</p>
      </div>

      {/* 分类筛选 */}
      <div className="flex justify-center gap-2 mb-10">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              filter === cat
                ? "bg-neon-blue/20 text-neon-blue border border-neon-blue/40"
                : "text-slate-400 border border-cyber-border hover:text-white hover:border-slate-500"
            }`}
          >
            {cat === "All" ? t(texts.modules.all, locale) : cat}
          </button>
        ))}
      </div>

      {/* 模块卡片 */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((mod) => (
          <Link
            key={mod.id}
            href={`/modules/${mod.id}`}
            className="group rounded-2xl border border-cyber-border bg-cyber-card p-6 card-hover block"
          >
            <div className="flex items-start justify-between mb-4">
              <span className="text-5xl group-hover:scale-110 transition-transform">{mod.icon}</span>
              <span className="rounded-full bg-neon-purple/10 border border-neon-purple/30 px-2.5 py-0.5 text-xs font-mono text-neon-purple">
                {mod.category}
              </span>
            </div>
            <h3 className="text-lg font-bold mb-1">{t(mod.name, locale)}</h3>
            <p className="text-xs text-neon-blue/70 font-mono mb-3">
              ≈ {t(mod.organ, locale)}
            </p>
            <p className="text-sm text-slate-400 mb-4 line-clamp-2">{t(mod.brief, locale)}</p>
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold text-neon-blue">{mod.price.china}</span>
              <span className="text-xs text-slate-500">{mod.price.international}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
