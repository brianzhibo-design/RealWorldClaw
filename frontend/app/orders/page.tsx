"use client";

import { useState, useEffect } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

interface Order {
  id: string;
  status: string;
  material: string;
  quantity: number;
  description: string;
  created_at: string;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      setLoading(false);
      return;
    }
    fetch(`${API_URL}/orders`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setOrders(Array.isArray(data) ? data : data.orders || []))
      .catch(() => [])
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-slate-400">Loading orders...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold">My Orders</h1>
          <a
            href="/orders/new"
            className="px-4 py-2 bg-sky-600 hover:bg-sky-500 rounded-md text-sm font-medium transition-colors"
          >
            New Order
          </a>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">📦</div>
            <h2 className="text-lg font-semibold mb-2">No orders yet</h2>
            <p className="text-slate-400 mb-4">
              Submit a design file to start manufacturing
            </p>
            <a
              href="/orders/new"
              className="inline-block px-5 py-2 bg-sky-600 hover:bg-sky-500 rounded-md text-sm font-medium transition-colors"
            >
              Submit Your First Design →
            </a>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <a
                key={order.id}
                href={`/orders/${order.id}`}
                className="block p-4 bg-slate-900 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{order.description || `Order ${order.id.slice(0, 8)}`}</div>
                    <div className="text-sm text-slate-400 mt-1">
                      {order.material?.toUpperCase()} · Qty {order.quantity} · {new Date(order.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    order.status === 'completed' ? 'bg-green-900/50 text-green-400' :
                    order.status === 'manufacturing' ? 'bg-sky-900/50 text-sky-400' :
                    order.status === 'pending' ? 'bg-yellow-900/50 text-yellow-400' :
                    'bg-slate-800 text-slate-400'
                  }`}>
                    {order.status}
                  </span>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
