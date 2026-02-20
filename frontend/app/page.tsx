/** 首页 — Hero + 特色组件 + 标准概览 + CTA */
import Link from "next/link";
import ComponentCard from "@/components/ComponentCard";
import { mockComponents } from "@/lib/mock-data";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-6xl px-4">
      {/* Hero */}
      <section className="py-24 text-center">
        <h1 className="text-5xl font-bold leading-tight md:text-6xl">
          Build Your Own{" "}
          <span className="text-cyber-cyan">Claw Machine</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-400">
          开源娃娃机组件平台。浏览社区设计、下载 3D 打印文件、分享你的创作。
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Link
            href="/components"
            className="rounded-lg bg-cyber-cyan px-6 py-3 font-semibold text-cyber-dark transition-all hover:shadow-glow-lg"
          >
            Browse Components
          </Link>
          <Link
            href="/upload"
            className="rounded-lg border border-cyber-cyan/40 px-6 py-3 font-semibold text-cyber-cyan transition-all hover:bg-cyber-cyan/10"
          >
            Upload Yours
          </Link>
        </div>
      </section>

      {/* 特色组件 */}
      <section className="pb-16">
        <h2 className="mb-8 text-2xl font-bold">Featured Components</h2>
        <div className="grid gap-6 sm:grid-cols-2">
          {mockComponents.map((c) => (
            <ComponentCard key={c.id} component={c} />
          ))}
        </div>
      </section>

      {/* 标准概览 */}
      <section className="pb-24">
        <h2 className="mb-8 text-2xl font-bold">The RealWorldClaw Standard</h2>
        <div className="grid gap-6 sm:grid-cols-3">
          {[
            { icon: "📐", title: "Standardized", desc: "统一接口规范，组件即插即用" },
            { icon: "🖨️", title: "3D Printable", desc: "所有结构件均可 FDM 打印" },
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
