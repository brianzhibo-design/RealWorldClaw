/** 模块商城 — Module Library */
"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import { useLocale, t } from "@/lib/i18n";
import { modules, ModuleCategory } from "@/lib/modules-data";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Cpu,
  Eye,
  Speaker,
  Zap,
  MonitorSmartphone,
  Activity,
} from "lucide-react";

const categories: (ModuleCategory | "All")[] = ["All", "Core", "Input", "Output", "Power"];

const categoryIcons: Record<string, React.ReactNode> = {
  Core: <Cpu className="h-4 w-4" />,
  Input: <Eye className="h-4 w-4" />,
  Output: <Speaker className="h-4 w-4" />,
  Power: <Zap className="h-4 w-4" />,
};

export default function ModulesPage() {
  const { locale } = useLocale();
  const [filter, setFilter] = useState<ModuleCategory | "All">("All");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    let list = filter === "All" ? modules : modules.filter((m) => m.category === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (m) =>
          t(m.name, locale).toLowerCase().includes(q) ||
          t(m.brief, locale).toLowerCase().includes(q)
      );
    }
    return list;
  }, [filter, search, locale]);

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      {/* Header */}
      <div className="mb-12">
        <h1 className="text-3xl font-bold tracking-tight">Module Library</h1>
        <p className="mt-2 text-muted-foreground">
          Browse hardware modules to give your AI a physical body.
        </p>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search modules..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-zinc-900 border-border"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                filter === cat
                  ? "bg-primary/15 text-primary border border-primary/30"
                  : "text-muted-foreground border border-border hover:text-foreground hover:border-muted-foreground/40"
              }`}
            >
              {cat !== "All" && categoryIcons[cat]}
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((mod) => (
            <Link
              key={mod.id}
              href={`/modules/${mod.id}`}
              className="group rounded-xl border border-border bg-card p-6 transition-all duration-200 hover:border-primary/30 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/5 block"
            >
              <div className="flex items-start justify-between mb-4">
                <span className="text-4xl group-hover:scale-110 transition-transform duration-200">
                  {mod.icon}
                </span>
                <Badge variant="outline" className="text-xs font-mono">
                  {mod.category}
                </Badge>
              </div>
              <h3 className="text-base font-semibold mb-1 group-hover:text-primary transition-colors">
                {t(mod.name, locale)}
              </h3>
              <p className="text-xs text-muted-foreground font-mono mb-3">
                ≈ {t(mod.organ, locale)}
              </p>
              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                {t(mod.brief, locale)}
              </p>
              <div className="flex items-center justify-between pt-3 border-t border-border">
                <span className="text-lg font-bold text-primary">{mod.price.china}</span>
                <span className="text-xs text-muted-foreground">{mod.price.international}</span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-24">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
            <Search className="h-7 w-7 text-muted-foreground" />
          </div>
          <p className="text-lg font-medium text-muted-foreground">No modules found</p>
          <p className="mt-1 text-sm text-muted-foreground/70">
            Try adjusting your search or filter criteria.
          </p>
        </div>
      )}
    </div>
  );
}
