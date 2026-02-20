/** 组件详情页 — 展示名称、描述、3D 预览占位、BOM、打印参数、下载按钮 */
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

      <h1 className="mt-4 text-3xl font-bold text-white">{component.name}</h1>

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
        <p className="mt-2 leading-relaxed text-slate-400">{component.longDescription}</p>
      </section>

      {/* 信息栏 */}
      <div className="mt-8 grid gap-4 sm:grid-cols-4">
        {[
          { label: "Author", value: component.author },
          { label: "Rating", value: `⭐ ${component.rating} (${component.reviewCount})` },
          { label: "Downloads", value: component.downloads.toLocaleString() },
          { label: "Price", value: component.price === 0 ? "Free" : `$${component.price}` },
        ].map((item) => (
          <div key={item.label} className="rounded-lg border border-cyber-border bg-cyber-card p-4">
            <div className="text-xs text-slate-500">{item.label}</div>
            <div className="mt-1 font-semibold text-white">{item.value}</div>
          </div>
        ))}
      </div>

      {/* BOM */}
      <section className="mt-8">
        <h2 className="text-xl font-semibold text-white">Bill of Materials</h2>
        <div className="mt-4 overflow-hidden rounded-lg border border-cyber-border">
          <table className="w-full text-sm">
            <thead className="bg-cyber-card text-left text-slate-400">
              <tr>
                <th className="px-4 py-3">Part</th>
                <th className="px-4 py-3">Qty</th>
                <th className="px-4 py-3">Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cyber-border">
              {component.bom.map((item, i) => (
                <tr key={i} className="text-slate-300">
                  <td className="px-4 py-3">{item.name}</td>
                  <td className="px-4 py-3">{item.qty}</td>
                  <td className="px-4 py-3 text-slate-500">{item.note ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 打印参数 */}
      <section className="mt-8">
        <h2 className="text-xl font-semibold text-white">Print Parameters</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {Object.entries(component.printParams).map(([key, value]) => (
            <div key={key} className="rounded-lg border border-cyber-border bg-cyber-card p-4">
              <div className="text-xs capitalize text-slate-500">{key}</div>
              <div className="mt-1 font-mono text-sm text-white">
                {typeof value === "boolean" ? (value ? "Yes" : "No") : value}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 下载按钮 */}
      <div className="mt-12">
        <button className="rounded-lg bg-cyber-cyan px-8 py-3 font-semibold text-cyber-dark transition-all hover:shadow-glow-lg">
          ⬇ Download Files
        </button>
      </div>
    </div>
  );
}
