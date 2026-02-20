/** 首页 — 全新模块化愿景 */
"use client";

import Link from "next/link";
import { useLocale, t } from "@/lib/i18n";
import { texts } from "@/lib/i18n-texts";
import { modules } from "@/lib/modules-data";
import { designs } from "@/lib/designs-data";

export default function HomePage() {
  const { locale } = useLocale();

  return (
    <div className="mx-auto max-w-6xl px-4">
      {/* Hero */}
      <section className="relative py-28 text-center">
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-neon-blue/5 blur-3xl" />
          <div className="absolute left-1/3 top-1/3 h-[300px] w-[300px] rounded-full bg-neon-purple/5 blur-3xl" />
        </div>
        <h1 className="text-5xl font-extrabold leading-tight md:text-7xl">
          {t(texts.hero.title1, locale)}{" "}
          <span className="bg-gradient-to-r from-neon-blue via-neon-purple to-neon-pink bg-clip-text text-transparent text-glow-blue">
            {t(texts.hero.title2, locale)}
          </span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-400 leading-relaxed">
          {t(texts.hero.subtitle, locale)}
        </p>
        <div className="mt-10 flex justify-center gap-4">
          <Link
            href="/modules"
            className="rounded-xl bg-gradient-to-r from-neon-blue to-neon-purple px-8 py-3.5 font-semibold text-white transition-all hover:shadow-glow-neon hover:scale-105"
          >
            {t(texts.hero.cta1, locale)}
          </Link>
          <Link
            href="/designs"
            className="rounded-xl border border-neon-blue/40 px-8 py-3.5 font-semibold text-neon-blue transition-all hover:bg-neon-blue/10 hover:border-neon-blue"
          >
            {t(texts.hero.cta2, locale)}
          </Link>
        </div>
      </section>

      {/* 三大问题 → 三大解决方案 */}
      <section className="pb-20">
        <h2 className="mb-12 text-center text-3xl font-bold">{t(texts.problems.title, locale)}</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {texts.problems.items.map((item, i) => (
            <div
              key={i}
              className="group rounded-2xl border border-cyber-border bg-cyber-card p-8 card-hover"
            >
              <div className="text-4xl mb-4">{item.icon}</div>
              <p className="text-sm text-red-400/80 line-through mb-2">
                {t(item.problem, locale)}
              </p>
              <p className="text-lg font-semibold text-neon-blue">
                {t(item.solution, locale)}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works - 三步 */}
      <section className="pb-20">
        <h2 className="mb-12 text-center text-3xl font-bold">{t(texts.howItWorks.title, locale)}</h2>
        <div className="grid gap-8 md:grid-cols-3">
          {texts.howItWorks.steps.map((step, i) => (
            <div key={i} className="text-center">
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-neon-blue/20 to-neon-purple/20 text-4xl animate-float" style={{ animationDelay: `${i * 0.5}s` }}>
                {step.icon}
              </div>
              <div className="mb-2 font-mono text-xs text-neon-purple">STEP {i + 1}</div>
              <h3 className="text-xl font-bold mb-2">{t(step.title, locale)}</h3>
              <p className="text-sm text-slate-400">{t(step.desc, locale)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* AI 成长故事预览 */}
      <section className="pb-20">
        <div className="rounded-2xl border border-neon-purple/20 bg-gradient-to-br from-cyber-card to-cyber-dark p-10 text-center">
          <h2 className="mb-4 text-3xl font-bold">
            {locale === "zh" ? "🧬 AI成长之旅" : "🧬 AI Growth Journey"}
          </h2>
          <p className="mb-6 text-slate-400 max-w-xl mx-auto">
            {locale === "zh"
              ? "从一颗\"脊髓\"开始，一步步长出眼睛、耳朵、手脚——看你的AI从植物人变成完整的生命体。"
              : "Start from a \"spine\", grow eyes, ears, hands, legs step by step — watch your AI evolve from a vegetative state to a complete life form."}
          </p>
          <div className="flex justify-center items-center gap-3 mb-8 text-3xl">
            {modules.map((m, i) => (
              <span key={m.id} className="transition-all hover:scale-125 cursor-default" style={{ opacity: 0.3 + i * 0.14 }}>
                {m.icon}
              </span>
            ))}
          </div>
          <Link
            href="/grow"
            className="inline-block rounded-xl bg-gradient-to-r from-neon-purple to-neon-pink px-8 py-3 font-semibold text-white transition-all hover:shadow-glow-purple hover:scale-105"
          >
            {locale === "zh" ? "开始AI成长之旅 →" : "Start AI Growth Journey →"}
          </Link>
        </div>
      </section>

      {/* 统计数据 */}
      <section className="pb-24">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            { value: modules.length, label: texts.stats.modules },
            { value: designs.length, label: texts.stats.designs },
            { value: "12+", label: texts.stats.makers },
          ].map((stat, i) => (
            <div key={i} className="rounded-2xl border border-cyber-border bg-cyber-card p-8 text-center">
              <div className="text-5xl font-extrabold font-mono bg-gradient-to-r from-neon-blue to-neon-purple bg-clip-text text-transparent">
                {stat.value}
              </div>
              <div className="mt-2 text-sm text-slate-400">{t(stat.label, locale)}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
