"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

interface Order {
  id: string;
  status: string;
  material: string;
  quantity: number;
  description: string;
  title?: string;
  created_at: string;
  updated_at?: string;
}

type TabType = 'all' | 'submitted' | 'in_progress' | 'completed';

const statusMapping: Record<string, string> = {
  pending: 'submitted',
  submitted: 'submitted', 
  accepted: 'in_progress',
  printing: 'in_progress',
  manufacturing: 'in_progress',
  shipped: 'in_progress',
  completed: 'completed',
  delivered: 'completed',
  cancelled: 'cancelled'
};

const statusDisplayNames: Record<string, string> = {
  pending: 'Submitted',
  submitted: 'Submitted',
  accepted: 'Accepted',
  printing: 'Printing',
  manufacturing: 'Manufacturing', 
  shipped: 'Shipped',
  completed: 'Completed',
  delivered: 'Delivered',
  cancelled: 'Cancelled'
};

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('all');

  // Check auth
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  useEffect(() => {
    if (!token) {
      router.push('/auth/login');
      return;
    }

    const fetchOrders = async () => {
      try {
        const response = await fetch(`${API_URL}/orders`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (response.ok) {
          const data = await response.json();
          setOrders(Array.isArray(data) ? data : data.orders || []);
        } else if (response.status === 401) {
          localStorage.removeItem('token');
          router.push('/auth/login');
        } else {
          setError('Failed to load orders');
        }
      } catch (err) {
        setError('Network error. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [token, router]);

  // Filter orders based on active tab
  const filteredOrders = orders.filter(order => {
    if (activeTab === 'all') return true;
    const mappedStatus = statusMapping[order.status.toLowerCase()] || order.status.toLowerCase();
    return mappedStatus === activeTab;
  });

  // Get counts for each tab
  const counts = {
    all: orders.length,
    submitted: orders.filter(o => statusMapping[o.status.toLowerCase()] === 'submitted').length,
    in_progress: orders.filter(o => statusMapping[o.status.toLowerCase()] === 'in_progress').length,
    completed: orders.filter(o => statusMapping[o.status.toLowerCase()] === 'completed').length
  };

  const getStatusColor = (status: string) => {
    const mapped = statusMapping[status.toLowerCase()] || status.toLowerCase();
    switch (mapped) {
      case 'submitted': return 'bg-yellow-900/50 text-yellow-400 border-yellow-800';
      case 'in_progress': return 'bg-sky-900/50 text-sky-400 border-sky-800';
      case 'completed': return 'bg-green-900/50 text-green-400 border-green-800';
      case 'cancelled': return 'bg-red-900/50 text-red-400 border-red-800';
      default: return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <span>📦</span> My Orders
              </h1>
              <p className="text-slate-400 text-sm mt-1">
                Track your manufacturing requests
              </p>
            </div>
            <a
              href="/submit"
              className="px-4 py-2 bg-sky-600 hover:bg-sky-500 rounded-lg text-sm font-medium transition-colors"
            >
              + Submit Design
            </a>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-900/50 border border-red-800 rounded-lg text-red-200">
            {error}
          </div>
        )}

        {/* Tabs */}
        <div className="flex space-x-1 mb-8 bg-slate-900 p-1 rounded-lg w-fit">
          {[
            { key: 'all', label: 'All', count: counts.all },
            { key: 'submitted', label: 'Submitted', count: counts.submitted },
            { key: 'in_progress', label: 'In Progress', count: counts.in_progress },
            { key: 'completed', label: 'Completed', count: counts.completed }
          ].map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as TabType)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === key
                  ? 'bg-sky-600 text-white'
                  : 'text-slate-400 hover:text-slate-300 hover:bg-slate-800'
              }`}
            >
              {label} {count > 0 && (
                <span className={`ml-1 px-2 py-0.5 text-xs rounded-full ${
                  activeTab === key ? 'bg-sky-700' : 'bg-slate-700'
                }`}>
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>

        {filteredOrders.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">
              {activeTab === 'all' ? '📦' : 
               activeTab === 'submitted' ? '📤' :
               activeTab === 'in_progress' ? '⚙️' : '✅'}
            </div>
            <h2 className="text-xl font-bold mb-2">
              {activeTab === 'all' ? 'No orders yet' :
               activeTab === 'submitted' ? 'No submitted orders' :
               activeTab === 'in_progress' ? 'No orders in progress' : 
               'No completed orders'}
            </h2>
            <p className="text-slate-400 mb-6">
              {activeTab === 'all' 
                ? "Submit a design file to start manufacturing"
                : `Switch to other tabs to view orders, or submit a new design`
              }
            </p>
            <a
              href="/submit"
              className="inline-flex items-center gap-2 px-6 py-3 bg-sky-600 hover:bg-sky-500 text-white rounded-lg font-medium transition-colors"
            >
              <span>🚀</span>
              Submit Your First Design
            </a>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredOrders.map((order) => (
              <a
                key={order.id}
                href={`/orders/${order.id}`}
                className="block p-6 bg-slate-900/80 border border-slate-800 rounded-xl hover:border-slate-700 hover:bg-slate-900 transition-all duration-200"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg text-white truncate">
                        {order.title || order.description || `Order ${order.id.slice(0, 8)}`}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                        {statusDisplayNames[order.status.toLowerCase()] || order.status}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-slate-400">
                      <div className="flex items-center gap-1">
                        <span>🧱</span>
                        <span>{order.material?.toUpperCase() || 'Unknown'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span>📦</span>
                        <span>Qty {order.quantity}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span>📅</span>
                        <span>{formatDate(order.created_at)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center text-slate-400 ml-4">
                    <span>→</span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
