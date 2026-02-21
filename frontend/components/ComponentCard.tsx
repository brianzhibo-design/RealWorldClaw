/** ComponentCard — 组件卡片，用于浏览页网格展示 */
import Link from "next/link";
import type { ClawComponent } from "@/lib/api";

export default function ComponentCard({ component }: { component: ClawComponent }) {
  return (
    <Link
      href={`/components/${component.id}`}
      className="group block rounded-xl border border-cyber-border bg-cyber-card p-4 transition-all hover:border-cyber-cyan/40 hover:shadow-glow"
    >
      <div className="mb-4 flex h-48 items-center justify-center rounded-lg bg-cyber-dark text-4xl">
        {component.id.includes("egg") ? "🥚" : component.id.includes("walker") ? "🦿" : "🦾"}
      </div>
      <div className="mb-2 flex flex-wrap gap-1.5">
        {component.tags.map((tag) => (
          <span key={tag} className="rounded-full bg-cyber-cyan/10 px-2 py-0.5 text-xs text-cyber-cyan">{tag}</span>
        ))}
      </div>
      <h3 className="text-lg font-semibold text-white group-hover:text-cyber-cyan transition-colors">
        {component.display_name.zh}
      </h3>
      <p className="mt-1 text-sm text-slate-400 line-clamp-2">{component.description.zh}</p>
      <div className="mt-4 flex items-center justify-between text-sm">
        <span className="text-cyber-cyan font-medium">~¥{component.estimated_cost_cny}</span>
        <span className="text-slate-500">🖨️ {component.estimated_print_time} · {component.estimated_filament_g}g</span>
      </div>
    </Link>
  );
}
