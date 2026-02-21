"use client";

import { useState, useEffect } from "react";
import { fetchComponents, type ClawComponent } from "@/lib/api";

const materials = ["PLA", "PETG", "ABS", "TPU", "Nylon"];
type OrderType = "print_only" | "full_build";

export default function NewOrderPage() {
  const [components, setComponents] = useState<ClawComponent[]>([]);
  const [componentId, setComponentId] = useState("");
  const [orderType, setOrderType] = useState<OrderType>("print_only");
  const [region, setRegion] = useState({ province: "", city: "", district: "" });
  const [material, setMaterial] = useState("PLA");
  const [urgent, setUrgent] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    fetchComponents().then(setComponents).catch(() => {});
  }, []);

  const selectedComponent = components.find((c) => c.id === componentId);
  const baseCost = selectedComponent?.estimated_cost_cny ?? 0;
  const buildMultiplier = orderType === "full_build" ? 2.5 : 1;
  const urgentMultiplier = urgent ? 1.5 : 1;
  const estimatedPrice = Math.round(baseCost * buildMultiplier * urgentMultiplier);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <div className="text-6xl mb-6">✅</div>
        <h1 className="text-3xl font-bold mb-4">订单已提交</h1>
        <p className="text-slate-400 mb-2">订单类型：<span className="text-white font-medium">{orderType === "full_build" ? "成品机器人" : "零件打印"}</span></p>
        <p className="text-slate-400 mb-8">预估价格：<span className="text-cyber-cyan font-bold">¥{estimatedPrice}</span></p>
        <a href="/orders" className="text-cyber-cyan hover:underline">查看我的订单 →</a>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">🛒 New Order</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-3">我需要什么？</label>
          <div className="grid grid-cols-2 gap-4">
            <button type="button" onClick={() => setOrderType("print_only")}
              className={`rounded-xl border p-4 text-left transition-all ${orderType === "print_only" ? "border-green-500 bg-green-500/10" : "border-cyber-border hover:border-green-500/40"}`}>
              <div className="text-2xl mb-2">🖨️</div>
              <p className="text-white font-semibold">只要零件</p>
              <p className="text-xs text-slate-400 mt-1">3D打印零件/外壳，自己组装</p>
            </button>
            <button type="button" onClick={() => setOrderType("full_build")}
              className={`rounded-xl border p-4 text-left transition-all ${orderType === "full_build" ? "border-amber-500 bg-amber-500/10" : "border-cyber-border hover:border-amber-500/40"}`}>
              <div className="text-2xl mb-2">🤖</div>
              <p className="text-white font-semibold">要成品</p>
              <p className="text-xs text-slate-400 mt-1">打印+组装+测试，交付成品机器人</p>
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">选择组件</label>
          <select value={componentId} onChange={(e) => setComponentId(e.target.value)} required
            className="w-full rounded-lg border border-cyber-border bg-cyber-card px-4 py-3 text-white focus:border-cyber-cyan focus:outline-none">
            <option value="">请选择...</option>
            {components.map((c) => (
              <option key={c.id} value={c.id}>{c.display_name.zh} — v{c.version}</option>
            ))}
          </select>
          {components.length === 0 && (
            <p className="text-xs text-zinc-500 mt-1">No components available from API</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">配送区域</label>
          <div className="grid grid-cols-3 gap-3">
            <input type="text" placeholder="省份" value={region.province} onChange={(e) => setRegion({ ...region, province: e.target.value })} required
              className="rounded-lg border border-cyber-border bg-cyber-card px-3 py-3 text-white placeholder-slate-600 focus:border-cyber-cyan focus:outline-none" />
            <input type="text" placeholder="城市" value={region.city} onChange={(e) => setRegion({ ...region, city: e.target.value })} required
              className="rounded-lg border border-cyber-border bg-cyber-card px-3 py-3 text-white placeholder-slate-600 focus:border-cyber-cyan focus:outline-none" />
            <input type="text" placeholder="区县" value={region.district} onChange={(e) => setRegion({ ...region, district: e.target.value })}
              className="rounded-lg border border-cyber-border bg-cyber-card px-3 py-3 text-white placeholder-slate-600 focus:border-cyber-cyan focus:outline-none" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">材料</label>
          <div className="flex flex-wrap gap-2">
            {materials.map((m) => (
              <button key={m} type="button" onClick={() => setMaterial(m)}
                className={`rounded-full px-4 py-2 text-sm transition-all ${material === m ? "bg-cyber-cyan text-cyber-dark font-semibold" : "border border-cyber-border text-slate-400 hover:border-cyber-cyan/40"}`}>{m}</button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between rounded-lg border border-cyber-border bg-cyber-card p-4">
          <div>
            <p className="text-white font-medium">⚡ 加急服务</p>
            <p className="text-xs text-slate-500">优先排队，预计快 50%</p>
          </div>
          <button type="button" onClick={() => setUrgent(!urgent)}
            className={`relative h-7 w-12 rounded-full transition-colors ${urgent ? "bg-cyber-cyan" : "bg-slate-600"}`}>
            <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white transition-transform ${urgent ? "translate-x-5" : "translate-x-0.5"}`} />
          </button>
        </div>

        {selectedComponent && (
          <div className="rounded-lg border border-cyber-cyan/30 bg-cyber-cyan/5 p-4 text-center">
            <p className="text-sm text-slate-400">预估价格</p>
            <p className="text-3xl font-bold text-cyber-cyan mt-1">¥{estimatedPrice}</p>
          </div>
        )}

        <button type="submit" className="w-full rounded-lg bg-cyber-cyan py-3 font-semibold text-cyber-dark transition-all hover:shadow-glow-lg disabled:opacity-40" disabled={!componentId}>
          提交订单
        </button>
      </form>
    </div>
  );
}
