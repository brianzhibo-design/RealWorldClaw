/** Maker Network 浏览页 */
import { mockMakers } from "@/lib/mock-data";
import { fetchMakers } from "@/lib/api";
import Link from "next/link";

const statusConfig = {
  open: { label: "在线", color: "text-green-400", dot: "bg-green-400 shadow-[0_0_6px_rgba(34,197,94,0.6)]" },
  busy: { label: "忙碌", color: "text-yellow-400", dot: "bg-yellow-400 shadow-[0_0_6px_rgba(234,179,8,0.6)]" },
  offline: { label: "离线", color: "text-slate-500", dot: "bg-slate-500" },
};

const typeConfig = {
  maker: { label: "Maker", badge: "bg-green-500/20 text-green-400 border-green-500/40", border: "border-green-500/30 hover:border-green-500/60 hover:shadow-[0_0_20px_rgba(34,197,94,0.15)]" },
  builder: { label: "Builder", badge: "bg-amber-500/20 text-amber-400 border-amber-500/40", border: "border-amber-500/30 hover:border-amber-500/60 hover:shadow-[0_0_20px_rgba(245,158,11,0.15)]" },
};

export default async function MakersPage() {
  let makers = mockMakers;
  try {
    makers = await fetchMakers();
  } catch {
    // API 不可用，使用 mock 数据
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">🔧 Maker Network</h1>
          <p className="mt-2 text-slate-400">找到你附近的Maker或Builder，将设计变为实体</p>
        </div>
        <Link
          href="/orders/new"
          className="rounded-lg bg-cyber-cyan px-5 py-2.5 font-semibold text-cyber-dark transition-all hover:shadow-glow-lg"
        >
          下单制造
        </Link>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {makers.map((maker) => {
          const status = statusConfig[maker.availability];
          const type = typeConfig[maker.maker_type];
          const isOnline = maker.availability === "open";
          return (
            <div
              key={maker.id}
              className={`rounded-xl border bg-cyber-card p-5 transition-all ${
                isOnline
                  ? type.border
                  : maker.availability === "busy"
                  ? "border-yellow-500/20 hover:border-yellow-500/40"
                  : "border-cyber-border opacity-60"
              }`}
            >
              {/* 头部：区域 + 类型标签 + 状态 */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold text-white">{maker.region}</h3>
                  <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${type.badge}`}>
                    {type.label}
                  </span>
                </div>
                <span className={`flex items-center gap-1.5 text-xs ${status.color}`}>
                  <span className={`inline-block h-2 w-2 rounded-full ${status.dot}`} />
                  {status.label}
                </span>
              </div>

              {/* 打印机 */}
              <p className="text-sm text-slate-300">
                {maker.printer_brand} <span className="text-slate-500">{maker.printer_model}</span>
              </p>

              {/* 支持材料 */}
              <div className="mt-3 flex flex-wrap gap-1.5">
                {maker.materials.map((m) => (
                  <span
                    key={m}
                    className="rounded-full bg-cyber-cyan/10 px-2 py-0.5 text-xs text-cyber-cyan"
                  >
                    {m}
                  </span>
                ))}
              </div>

              {/* 底部 */}
              <div className="mt-4 flex items-center justify-between text-sm">
                <span className="text-cyber-cyan font-medium">¥{maker.pricing_per_hour_cny}/h</span>
                <span className="text-slate-500">
                  ⭐ {maker.rating} · {maker.total_orders} 单
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
