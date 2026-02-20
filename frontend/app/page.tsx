/** 首页 — Hero + 特色组件 + 打印农场入口 + 标准概览 */
import Link from "next/link";
import ComponentCard from "@/components/ComponentCard";
import { mockComponents, mockFarms } from "@/lib/mock-data";

export default function HomePage() {
  const openFarms = mockFarms.filter((f) => f.availability === "open");

  return (
    <div className="mx-auto max-w-6xl px-4">
      {/* Hero */}
      <section className="py-24 text-center">
        <h1 className="text-5xl font-bold leading-tight md:text-6xl">
          Build Your Own{" "}
          <span className="text-cyber-cyan">AI Agent Body</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-400">
          开源 AI Agent 机体制造平台。浏览社区设计、找到附近的打印农场、让你的 Agent 拥有物理形态。
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Link
            href="/components"
            className="rounded-lg bg-cyber-cyan px-6 py-3 font-semibold text-cyber-dark transition-all hover:shadow-glow-lg"
          >
            Browse Components
          </Link>
          <Link
            href="/farms"
            className="rounded-lg border border-cyber-cyan/40 px-6 py-3 font-semibold text-cyber-cyan transition-all hover:bg-cyber-cyan/10"
          >
            Find Print Farms
          </Link>
        </div>
      </section>

      {/* 特色组件 */}
      <section className="pb-16">
        <h2 className="mb-8 text-2xl font-bold">Featured Components</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {mockComponents.map((c) => (
            <ComponentCard key={c.id} component={c} />
          ))}
        </div>
      </section>

      {/* 打印农场入口 */}
      <section className="pb-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold">🏭 Print Farms</h2>
          <Link href="/farms" className="text-sm text-cyber-cyan hover:underline">
            View all →
          </Link>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {openFarms.slice(0, 3).map((farm) => (
            <div
              key={farm.id}
              className="rounded-xl border border-cyber-border bg-cyber-card p-5 transition-all hover:border-green-500/40 hover:shadow-[0_0_15px_rgba(34,197,94,0.15)]"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-white">{farm.region}</span>
                <span className="flex items-center gap-1.5 text-xs text-green-400">
                  <span className="inline-block h-2 w-2 rounded-full bg-green-400 shadow-[0_0_6px_rgba(34,197,94,0.6)]" />
                  在线
                </span>
              </div>
              <p className="text-sm text-slate-400">
                {farm.printer_brand} {farm.printer_model}
              </p>
              <div className="mt-3 flex items-center justify-between text-sm">
                <span className="text-cyber-cyan">¥{farm.pricing_per_hour_cny}/h</span>
                <span className="text-slate-500">⭐ {farm.rating}</span>
              </div>
            </div>
          ))}
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
