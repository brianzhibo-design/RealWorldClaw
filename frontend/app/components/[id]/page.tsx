/** 组件详情页 — 展示名称、描述、3D 预览占位、参数、下载按钮 */
import { notFound } from "next/navigation";
import Link from "next/link";
import { getComponentById, mockComponents } from "@/lib/mock-data";

export function generateStaticParams() {
  return mockComponents.map((c) => ({ id: c.id }));
}

export default async function ComponentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const component = getComponentById(id);
  if (!component) notFound();

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      {/* 返回链接 */}
      <Link href="/components" className="text-sm text-slate-500 hover:text-cyber-cyan">
        ← Back to Components
      </Link>

      <h1 className="mt-4 text-3xl font-bold text-white">{component.display_name.zh}</h1>
      <p className="mt-1 text-sm text-slate-500">{component.display_name.en}</p>

      <div className="mt-2 flex flex-wrap gap-2">
        {component.tags.map((tag) => (
          <span key={tag} className="rounded-full bg-cyber-cyan/10 px-3 py-1 text-xs text-cyber-cyan">
            {tag}
          </span>
        ))}
      </div>

      {/* 3D 预览占位 */}
      <div className="mt-8 flex h-64 items-center justify-center rounded-xl border border-cyber-border bg-cyber-card text-slate-500">
        <div className="text-center">
          <div className="text-5xl">{component.id.includes("egg") ? "🥚" : "🦾"}</div>
          <p className="mt-2 text-sm">3D Preview — Coming Soon</p>
        </div>
      </div>

      {/* 描述 */}
      <section className="mt-8">
        <h2 className="text-xl font-semibold text-white">Description</h2>
        <p className="mt-2 leading-relaxed text-slate-400">{component.description.zh}</p>
        <p className="mt-2 leading-relaxed text-slate-500 text-sm">{component.description.en}</p>
      </section>

      {/* 信息栏 */}
      <div className="mt-8 grid gap-4 sm:grid-cols-4">
        {[
          { label: "Author", value: component.author },
          { label: "Compute", value: component.compute },
          { label: "Material", value: component.material },
          { label: "Version", value: `v${component.version}` },
        ].map((item) => (
          <div key={item.label} className="rounded-lg border border-cyber-border bg-cyber-card p-4">
            <div className="text-xs text-slate-500">{item.label}</div>
            <div className="mt-1 font-semibold text-white">{item.value}</div>
          </div>
        ))}
      </div>

      {/* 打印参数 */}
      <section className="mt-8">
        <h2 className="text-xl font-semibold text-white">Print Estimates</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {[
            { label: "Estimated Cost", value: `¥${component.estimated_cost_cny}` },
            { label: "Print Time", value: component.estimated_print_time },
            { label: "Filament", value: `${component.estimated_filament_g}g` },
          ].map((item) => (
            <div key={item.label} className="rounded-lg border border-cyber-border bg-cyber-card p-4">
              <div className="text-xs text-slate-500">{item.label}</div>
              <div className="mt-1 font-mono text-sm text-white">{item.value}</div>
            </div>
          ))}
        </div>
      </section>

      {/* 下载按钮 */}
      <div className="mt-12 flex gap-4">
        <button className="rounded-lg bg-cyber-cyan px-8 py-3 font-semibold text-cyber-dark transition-all hover:shadow-glow-lg">
          ⬇ Download Files
        </button>
        <Link
          href="/orders/new"
          className="rounded-lg border border-cyber-cyan/40 px-8 py-3 font-semibold text-cyber-cyan transition-all hover:bg-cyber-cyan/10"
        >
          🖨️ Order Print
        </Link>
      </div>
    </div>
  );
}
