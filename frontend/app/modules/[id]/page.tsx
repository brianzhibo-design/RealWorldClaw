/** 模块详情页 */
"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useLocale, t } from "@/lib/i18n";
import { texts } from "@/lib/i18n-texts";
import { getModuleById } from "@/lib/modules-data";
import { designs } from "@/lib/designs-data";

export default function ModuleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { locale } = useLocale();
  const mod = getModuleById(id);

  if (!mod) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-red-400">Module not found</h1>
        <Link href="/modules" className="mt-4 inline-block text-neon-blue hover:underline">← Back</Link>
      </div>
    );
  }

  const compatDesigns = designs.filter((d) => mod.compatibleDesigns.includes(d.id));

  return (
    <div className="mx-auto max-w-4xl px-4 py-16">
      <Link href="/modules" className="text-sm text-slate-400 hover:text-neon-blue mb-8 inline-block">
        ← {t(texts.modules.title, locale)}
      </Link>

      <div className="grid gap-10 md:grid-cols-2">
        {/* Left: 3D preview placeholder */}
        <div className="flex items-center justify-center rounded-2xl border border-cyber-border bg-cyber-card aspect-square">
          <div className="text-center">
            <span className="text-8xl block mb-4 animate-float">{mod.icon}</span>
            <span className="text-xs text-slate-500 font-mono">3D Preview</span>
          </div>
        </div>

        {/* Right: Info */}
        <div>
          <span className="rounded-full bg-neon-purple/10 border border-neon-purple/30 px-3 py-1 text-xs font-mono text-neon-purple">
            {mod.category}
          </span>
          <h1 className="mt-4 text-3xl font-extrabold">{t(mod.name, locale)}</h1>
          <p className="mt-1 text-sm text-neon-blue/70 font-mono">≈ {t(mod.organ, locale)}</p>
          <p className="mt-4 text-slate-300 leading-relaxed">{t(mod.description, locale)}</p>

          <div className="mt-6 flex items-baseline gap-3">
            <span className="text-3xl font-bold text-neon-blue">{mod.price.china}</span>
            <span className="text-sm text-slate-500">{mod.price.international}</span>
          </div>

          {/* Buy links */}
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-slate-300 mb-3">{t(texts.modules.buyLinks, locale)}</h3>
            <div className="flex gap-3">
              {mod.buyLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg border border-neon-blue/30 px-4 py-2 text-sm text-neon-blue hover:bg-neon-blue/10 transition-all"
                >
                  {link.label} ↗
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Specs */}
      <section className="mt-16">
        <h2 className="text-xl font-bold mb-6">{t(texts.modules.specs, locale)}</h2>
        <div className="rounded-xl border border-cyber-border bg-cyber-card overflow-hidden">
          {mod.specs.map((spec, i) => (
            <div key={i} className={`flex justify-between px-6 py-4 ${i > 0 ? "border-t border-cyber-border" : ""}`}>
              <span className="text-sm text-slate-400">{t(spec.label, locale)}</span>
              <span className="text-sm font-mono text-white">{spec.value}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Compatible designs */}
      {compatDesigns.length > 0 && (
        <section className="mt-16">
          <h2 className="text-xl font-bold mb-6">{t(texts.modules.compatible, locale)}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {compatDesigns.map((d) => (
              <Link
                key={d.id}
                href={`/designs/${d.id}`}
                className="rounded-xl border border-cyber-border bg-cyber-card p-5 card-hover block"
              >
                <h3 className="font-semibold">{t(d.name, locale)}</h3>
                <p className="text-sm text-slate-400 mt-1">¥{d.totalPrice} · {"⭐".repeat(d.difficulty)}</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
