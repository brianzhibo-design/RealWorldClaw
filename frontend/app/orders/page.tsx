/** 我的订单页 */
import Link from "next/link";
import { mockOrders } from "@/lib/mock-data";

const statusStyles: Record<string, { label: string; cls: string }> = {
  pending: { label: "待处理", cls: "bg-yellow-500/20 text-yellow-400" },
  printing: { label: "打印中", cls: "bg-blue-500/20 text-blue-400" },
  shipping: { label: "配送中", cls: "bg-purple-500/20 text-purple-400" },
  completed: { label: "已完成", cls: "bg-green-500/20 text-green-400" },
  cancelled: { label: "已取消", cls: "bg-red-500/20 text-red-400" },
};

export default function OrdersPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">📦 My Orders</h1>
        <Link
          href="/orders/new"
          className="rounded-lg bg-cyber-cyan px-5 py-2.5 font-semibold text-cyber-dark transition-all hover:shadow-glow-lg"
        >
          新建订单
        </Link>
      </div>

      <div className="space-y-4">
        {mockOrders.map((order) => {
          const s = statusStyles[order.status];
          return (
            <div
              key={order.id}
              className="flex items-center justify-between rounded-xl border border-cyber-border bg-cyber-card p-5 transition-all hover:border-cyber-cyan/30"
            >
              <div>
                <p className="text-sm text-slate-500 font-mono">{order.id}</p>
                <p className="mt-1 text-white font-medium">{order.component_name}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {new Date(order.created_at).toLocaleDateString("zh-CN")}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-cyber-cyan font-semibold">¥{order.total_cny}</span>
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${s.cls}`}>
                  {s.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {mockOrders.length === 0 && (
        <div className="text-center py-20 text-slate-500">
          <p className="text-lg">暂无订单</p>
          <Link href="/orders/new" className="mt-2 text-cyber-cyan hover:underline">
            去下单 →
          </Link>
        </div>
      )}
    </div>
  );
}
