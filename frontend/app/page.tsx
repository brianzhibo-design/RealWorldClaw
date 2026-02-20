/** 首页 — Hero + 特色组件 + Maker Network入口 + 标准概览 */
import Link from "next/link";
import ComponentCard from "@/components/ComponentCard";
import { mockComponents, mockMakers } from "@/lib/mock-data";
import { fetchComponents, fetchMakers } from "@/lib/api";

export default async function HomePage() {
  let components = mockComponents;
  let makers = mockMakers;

  try {
    [components, makers] = await Promise.all([fetchComponents(), fetchMakers()]);
  } catch {
    // API 不可用，使用 mock 数据
  }

  const onlineMakers = makers.filter((m) => m.availability === "open");

  return (
    <div className="mx-auto max-w-6xl px-4">
      {/* Hero */}
      <section className="py-24 text-center">
        <h1 className="text-5xl font-bold leading-tight md:text-6xl">
          Build Your Own{" "}
          <span className="text-cyber-cyan">AI Agent Body</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-400">
          开源 AI Agent 机体制造平台。浏览社区设计、找到附近的 Maker，让你的 Agent 拥有物理形态。
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Link
            href="/components"
            className="rounded-lg bg-cyber-cyan px-6 py-3 font-semibold text-cyber-dark transition-all hover:shadow-glow-lg"
          >
            Browse Components
          </Link>
          <Link
            href="/makers"
            className="rounded-lg border border-cyber-cyan/40 px-6 py-3 font-semibold text-cyber-cyan transition-all hover:bg-cyber-cyan/10"
          >
            Find Makers
          </Link>
        </div>
      </section>

      {/* 特色组件 */}
      <section className="pb-16">
        <h2 className="mb-8 text-2xl font-bold">Featured Components</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {components.map((c) => (
            <ComponentCard key={c.id} component={c} />
          ))}
        </div>
      </section>

      {/* Maker Network 入口 */}
      <section className="pb-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold">🔧 Maker Network</h2>
          <Link href="/makers" className="text-sm text-cyber-cyan hover:underline">
            View all →
          </Link>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {onlineMakers.slice(0, 3).map((maker) => {
            const isBuilder = maker.maker_type === "builder";
            return (
              <div
                key={maker.id}
                className={`rounded-xl border bg-cyber-card p-5 transition-all ${
                  isBuilder
                    ? "border-amber-500/30 hover:border-amber-500/50 hover:shadow-[0_0_15px_rgba(245,158,11,0.15)]"
                    : "border-green-500/30 hover:border-green-500/50 hover:shadow-[0_0_15px_rgba(34,197,94,0.15)]"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white">{maker.region}</span>
                    <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${
                      isBuilder
                        ? "bg-amber-500/20 text-amber-400 border-amber-500/40"
                        : "bg-green-500/20 text-green-400 border-green-500/40"
                    }`}>
                      {isBuilder ? "Builder" : "Maker"}
                    </span>
                  </div>
                  <span className="flex items-center gap-1.5 text-xs text-green-400">
                    <span className="inline-block h-2 w-2 rounded-full bg-green-400 shadow-[0_0_6px_rgba(34,197,94,0.6)]" />
                    在线
                  </span>
                </div>
                <p className="text-sm text-slate-400">
                  {maker.printer_brand} {maker.printer_model}
                </p>
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="text-cyber-cyan">¥{maker.pricing_per_hour_cny}/h</span>
                  <span className="text-slate-500">⭐ {maker.rating}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 标准概览 */}
      <section className="pb-24">
        <h2 className="mb-8 text-2xl font-bold">The RealWorldClaw Standard</h2>
        <div className="grid gap-6 sm:grid-cols-3">
          {[
            { icon: "🤖", title: "Agent-First", desc: "为 AI Agent 物理形态而生的制造标准" },
            { icon: "🖨️", title: "3D Printable", desc: "所有结构件均可 FDM 打印，全球可制造" },
            { icon: "🌍", title: "Open Source", desc: "CC BY-SA 4.0，自由使用和修改" },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-xl border border-cyber-border bg-cyber-card p-6 text-center"
            >
              <div className="text-4xl">{item.icon}</div>
              <h3 className="mt-4 text-lg font-semibold text-white">{item.title}</h3>
              <p className="mt-2 text-sm text-slate-400">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
