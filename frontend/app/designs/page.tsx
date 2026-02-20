/** 参考设计列表 */
"use client";

import Link from "next/link";
import { useLocale, t } from "@/lib/i18n";
import { texts } from "@/lib/i18n-texts";
import { designs } from "@/lib/designs-data";
import { modules } from "@/lib/modules-data";

export default function DesignsPage() {
  const { locale } = useLocale();

  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold mb-4">
          <span className="bg-gradient-to-r from-neon-blue to-neon-purple bg-clip-text text-transparent">
            {t(texts.designs.title, locale)}
          </span>
        </h1>
        <p className="text-slate-400 max-w-lg mx-auto">{t(texts.designs.subtitle, locale)}</p>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        {designs.map((d) => {
          const designModules = modules.filter((m) => d.modules.includes(m.id));
          return (
            <Link
              key={d.id}
              href={`/designs/${d.id}`}
              className="group rounded-2xl border border-cyber-border bg-cyber-card overflow-hidden card-hover block"
            >
              {/* Render placeholder */}
              <div className="h-48 bg-gradient-to-br from-neon-blue/10 to-neon-purple/10 flex items-center justify-center">
                <div className="flex gap-2 text-3xl">
                  {designModules.map((m) => (
                    <span key={m.id} className="group-hover:animate-float">{m.icon}</span>
                  ))}
                </div>
              </div>

              <div className="p-6">
                <h3 className="text-lg font-bold mb-2">{t(d.name, locale)}</h3>
                <div className="flex items-center gap-3 mb-3 text-sm">
                  <span className="text-neon-blue font-bold">¥{d.totalPrice}</span>
                  <span className="text-yellow-400">{"★".repeat(d.difficulty)}{"☆".repeat(5 - d.difficulty)}</span>
                </div>
                <div className="flex items-center gap-2 mb-3 text-xs text-slate-400">
                  <span>🖨️ {d.printTime}</span>
                  <span>·</span>
                  <span>{d.filamentG}g filament</span>
                </div>

                {/* Module pills */}
                <div className="flex flex-wrap gap-1.5">
                  {designModules.map((m) => (
                    <span key={m.id} className="rounded-full bg-cyber-dark px-2 py-0.5 text-xs text-slate-400">
                      {m.icon} {t(m.name, locale)}
                    </span>
                  ))}
                </div>

                {/* Also can build */}
                <div className="mt-4 pt-3 border-t border-cyber-border">
                  <p className="text-xs text-neon-purple/70">
                    💡 {t(texts.designs.alsoCanBuild, locale)}:
                    {" "}{d.alsoCanBuild.map((a) => t(a, locale)).join(", ")}
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
