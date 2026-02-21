/** 模块详情页 */
"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useLocale, t } from "@/lib/i18n";
import { texts } from "@/lib/i18n-texts";
import { getModuleById } from "@/lib/modules-data";
import { designs } from "@/lib/designs-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ExternalLink } from "lucide-react";

export default function ModuleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { locale } = useLocale();
  const mod = getModuleById(id);

  if (!mod) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-20 text-center">
        <h1 className="text-2xl font-bold text-destructive">Module not found</h1>
        <Link href="/modules" className="mt-4 inline-block text-primary hover:underline">
          ← Back to modules
        </Link>
      </div>
    );
  }

  const compatDesigns = designs.filter((d) => mod.compatibleDesigns.includes(d.id));

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <Link
        href="/modules"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
      >
        <ArrowLeft className="h-4 w-4" />
        Module Library
      </Link>

      <div className="grid gap-10 md:grid-cols-2">
        {/* Left: Preview */}
        <div className="flex items-center justify-center rounded-2xl border border-border bg-card aspect-square">
          <div className="text-center">
            <span className="text-8xl block mb-4">{mod.icon}</span>
            <span className="text-xs text-muted-foreground font-mono">3D Preview</span>
          </div>
        </div>

        {/* Right: Info */}
        <div>
          <Badge variant="outline" className="font-mono text-xs">
            {mod.category}
          </Badge>
          <h1 className="mt-4 text-3xl font-bold tracking-tight">{t(mod.name, locale)}</h1>
          <p className="mt-1 text-sm text-muted-foreground font-mono">≈ {t(mod.organ, locale)}</p>
          <p className="mt-4 text-muted-foreground leading-relaxed">{t(mod.description, locale)}</p>

          <div className="mt-6 flex items-baseline gap-3">
            <span className="text-3xl font-bold text-primary">{mod.price.china}</span>
            <span className="text-sm text-muted-foreground">{mod.price.international}</span>
          </div>

          {/* Buy links */}
          <div className="mt-6">
            <h3 className="text-sm font-semibold mb-3">{t(texts.modules.buyLinks, locale)}</h3>
            <div className="flex gap-3">
              {mod.buyLinks.map((link) => (
                <Button key={link.label} variant="outline" size="sm" asChild>
                  <a href={link.url} target="_blank" rel="noopener noreferrer">
                    {link.label}
                    <ExternalLink className="ml-1.5 h-3 w-3" />
                  </a>
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Specs */}
      <section className="mt-16">
        <h2 className="text-xl font-bold mb-6">{t(texts.modules.specs, locale)}</h2>
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          {mod.specs.map((spec, i) => (
            <div
              key={i}
              className={`flex justify-between px-6 py-4 ${i > 0 ? "border-t border-border" : ""}`}
            >
              <span className="text-sm text-muted-foreground">{t(spec.label, locale)}</span>
              <span className="text-sm font-mono">{spec.value}</span>
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
                className="rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/20 block"
              >
                <h3 className="font-semibold">{t(d.name, locale)}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  ¥{d.totalPrice} · {"⭐".repeat(d.difficulty)}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
