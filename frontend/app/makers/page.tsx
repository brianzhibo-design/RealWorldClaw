import { fetchMakers } from "@/lib/api";
import { EmptyState } from "@/components/EmptyState";
import Link from "next/link";

const statusConfig: Record<string, { label: string; color: string; dot: string }> = {
  open: { label: "在线", color: "text-green-400", dot: "bg-green-400 shadow-[0_0_6px_rgba(34,197,94,0.6)]" },
  busy: { label: "忙碌", color: "text-yellow-400", dot: "bg-yellow-400 shadow-[0_0_6px_rgba(234,179,8,0.6)]" },
  offline: { label: "离线", color: "text-slate-500", dot: "bg-slate-500" },
};

const typeConfig: Record<string, { label: string; badge: string; border: string }> = {
  maker: { label: "Maker", badge: "bg-green-500/20 text-green-400 border-green-500/40", border: "border-green-500/30 hover:border-green-500/60" },
  builder: { label: "Builder", badge: "bg-amber-500/20 text-amber-400 border-amber-500/40", border: "border-amber-500/30 hover:border-amber-500/60" },
};

export default async function MakersPage() {
  const makers = await fetchMakers();

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">🔧 Maker Network</h1>
          <p className="mt-2 text-slate-400">找到你附近的Maker或Builder，将设计变为实体</p>
        </div>
        <Link href="/orders/new" className="rounded-lg bg-cyber-cyan px-5 py-2.5 font-semibold text-cyber-dark transition-all hover:shadow-glow-lg">下单制造</Link>
      </div>

      {makers.length === 0 ? (
        <EmptyState icon="🔧" title="No makers available" description="Maker network is empty. Check back later or register as a maker!" />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {makers.map((maker) => {
            const status = statusConfig[maker.availability] || statusConfig.offline;
            const type = typeConfig[maker.maker_type] || typeConfig.maker;
            const isOnline = maker.availability === "open";
            return (
              <div key={maker.id} className={`rounded-xl border bg-cyber-card p-5 transition-all ${isOnline ? type.border : "border-cyber-border opacity-60"}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-white">{maker.region}</h3>
                    <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${type.badge}`}>{type.label}</span>
                  </div>
                  <span className={`flex items-center gap-1.5 text-xs ${status.color}`}>
                    <span className={`inline-block h-2 w-2 rounded-full ${status.dot}`} />
                    {status.label}
                  </span>
                </div>
                <p className="text-sm text-slate-300">{maker.printer_brand} <span className="text-slate-500">{maker.printer_model}</span></p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {maker.materials.map((m) => (
                    <span key={m} className="rounded-full bg-cyber-cyan/10 px-2 py-0.5 text-xs text-cyber-cyan">{m}</span>
                  ))}
                </div>
                <div className="mt-4 flex items-center justify-between text-sm">
                  <span className="text-cyber-cyan font-medium">¥{maker.pricing_per_hour_cny}/h</span>
                  <span className="text-slate-500">⭐ {maker.rating} · {maker.total_orders} 单</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
