/** 参考设计详情页 */
"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useLocale, t } from "@/lib/i18n";
import { texts } from "@/lib/i18n-texts";
import { getDesignById } from "@/lib/designs-data";
import { modules } from "@/lib/modules-data";

export default function DesignDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { locale } = useLocale();
  const design = getDesignById(id);

  if (!design) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-red-400">Design not found</h1>
        <Link href="/designs" className="mt-4 inline-block text-neon-blue hover:underline">← Back</Link>
      </div>
    );
  }

  const designModules = modules.filter((m) => design.modules.includes(m.id));

  return (
    <div className="mx-auto max-w-4xl px-4 py-16">
      <Link href="/designs" className="text-sm text-slate-400 hover:text-neon-blue mb-8 inline-block">
        ← {t(texts.designs.title, locale)}
      </Link>

      <h1 className="text-4xl font-extrabold mb-4">{t(design.name, locale)}</h1>
      <div className="flex items-center gap-4 mb-6 text-sm">
        <span className="text-2xl font-bold text-neon-blue">¥{design.totalPrice}</span>
        <span className="text-yellow-400">{"★".repeat(design.difficulty)}{"☆".repeat(5 - design.difficulty)}</span>
        <span className="text-slate-400">🖨️ {design.printTime}</span>
        <span className="text-slate-400">{design.filamentG}g</span>
      </div>

      <p className="text-slate-300 leading-relaxed mb-10">{t(design.description, locale)}</p>

      {/* BOM */}
      <section className="mb-12">
        <h2 className="text-xl font-bold mb-4">{t(texts.designs.bom, locale)}</h2>
        <div className="rounded-xl border border-cyber-border bg-cyber-card overflow-hidden">
          {designModules.map((m, i) => (
            <Link
              key={m.id}
              href={`/modules/${m.id}`}
              className={`flex items-center justify-between px-6 py-4 hover:bg-neon-blue/5 transition-colors ${i > 0 ? "border-t border-cyber-border" : ""}`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{m.icon}</span>
                <div>
                  <span className="font-medium">{t(m.name, locale)}</span>
                  <span className="text-xs text-slate-500 ml-2">({t(m.organ, locale)})</span>
                </div>
              </div>
              <span className="font-mono text-neon-blue">{m.price.china}</span>
            </Link>
          ))}
          <div className="flex items-center justify-between px-6 py-4 border-t border-neon-blue/20 bg-neon-blue/5">
            <span className="font-bold">{locale === "zh" ? "结构件（3D打印）" : "Structural Parts (3D Print)"}</span>
            <span className="font-mono text-slate-400">~¥{Math.round(design.filamentG * 0.1)}</span>
          </div>
          <div className="flex items-center justify-between px-6 py-4 border-t border-neon-purple/20 bg-neon-purple/5">
            <span className="font-extrabold text-lg">{locale === "zh" ? "总计" : "Total"}</span>
            <span className="font-mono font-extrabold text-lg text-neon-blue">
              ¥{design.totalPrice + Math.round(design.filamentG * 0.1)}
            </span>
          </div>
        </div>
      </section>

      {/* Assembly Steps */}
      <section className="mb-12">
        <h2 className="text-xl font-bold mb-4">{t(texts.designs.assemblySteps, locale)}</h2>
        <div className="space-y-3">
          {design.steps.map((step, i) => (
            <div key={i} className="flex items-start gap-4 rounded-xl border border-cyber-border bg-cyber-card p-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neon-blue/20 text-sm font-bold text-neon-blue font-mono">
                {i + 1}
              </span>
              <span className="text-sm text-slate-300 pt-1">{t(step, locale)}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Also can build */}
      <section className="mb-12">
        <h2 className="text-xl font-bold mb-4">{t(texts.designs.alsoCanBuild, locale)}</h2>
        <div className="flex flex-wrap gap-3">
          {design.alsoCanBuild.map((item, i) => (
            <span key={i} className="rounded-full border border-neon-purple/30 bg-neon-purple/10 px-4 py-2 text-sm text-neon-purple">
              💡 {t(item, locale)}
            </span>
          ))}
        </div>
      </section>

      {/* CTAs */}
      <div className="flex gap-4">
        <button className="rounded-xl bg-gradient-to-r from-neon-blue to-neon-purple px-8 py-3.5 font-semibold text-white transition-all hover:shadow-glow-neon hover:scale-105">
          📥 {t(texts.designs.downloadSTL, locale)}
        </button>
        <Link
          href="/makers"
          className="rounded-xl border border-neon-blue/40 px-8 py-3.5 font-semibold text-neon-blue transition-all hover:bg-neon-blue/10"
        >
          🖨️ {t(texts.designs.orderPrint, locale)}
        </Link>
      </div>
    </div>
  );
}
