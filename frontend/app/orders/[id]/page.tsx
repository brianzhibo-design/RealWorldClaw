"use client";
import { API_BASE as API_URL } from "@/lib/api-client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";


interface Order {
  id: string;
  title?: string;
  description?: string;
  material: string;
  quantity: number;
  color?: string;
  notes?: string;
  status: string;
  created_at: string;
  updated_at?: string;
  file_id?: string;
  file_name?: string;
  maker?: {
    id: string;
    name: string;
    rating?: number;
    avatar?: string;
  };
}

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

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-900/50 text-yellow-400 border-yellow-800',
  submitted: 'bg-yellow-900/50 text-yellow-400 border-yellow-800',
  accepted: 'bg-blue-900/50 text-blue-400 border-blue-800',
  printing: 'bg-orange-900/50 text-orange-400 border-orange-800',
  manufacturing: 'bg-orange-900/50 text-orange-400 border-orange-800',
  shipped: 'bg-purple-900/50 text-purple-400 border-purple-800',
  completed: 'bg-green-900/50 text-green-400 border-green-800',
  delivered: 'bg-green-900/50 text-green-400 border-green-800',
  cancelled: 'bg-red-900/50 text-red-400 border-red-800'
};

const timelineSteps = [
  { key: 'submitted', label: 'Submitted', icon: '📤' },
  { key: 'accepted', label: 'Accepted', icon: '✅' },
  { key: 'printing', label: 'Printing', icon: '🖨️' },
  { key: 'shipped', label: 'Shipped', icon: '📦' },
  { key: 'delivered', label: 'Delivered', icon: '🎉' }
];

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") || localStorage.getItem("token") : null;

  useEffect(() => {
    if (!token) {
      router.push('/auth/login');
      return;
    }

    const fetchOrder = async () => {
      try {
        const response = await fetch(`${API_URL}/orders/${params.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.ok) {
          const data = await response.json();
          setOrder(data);
        } else if (response.status === 401) {
          localStorage.removeItem('token');
          router.push('/auth/login');
        } else if (response.status === 404) {
          setError('Order not found');
        } else {
          setError('Failed to load order');
        }
      } catch (err) {
        setError('Network error. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchOrder();
    }
  }, [params.id, token, router]);

  const getStatusIndex = (status: string) => {
    const mapping: Record<string, number> = {
      pending: 0,
      submitted: 0,
      accepted: 1,
      printing: 2,
      manufacturing: 2,
      shipped: 3,
      completed: 4,
      delivered: 4
    };
    return mapping[status.toLowerCase()] ?? 0;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleCancelOrder = async () => {
    if (!order || !confirm('Are you sure you want to cancel this order?')) return;

    setActionLoading(true);
    try {
      const response = await fetch(`${API_URL}/orders/${order.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: 'cancelled' })
      });

      if (response.ok) {
        setOrder(prev => prev ? { ...prev, status: 'cancelled' } : null);
      } else {
        const errorData = await response.json();
        alert(errorData.detail || 'Failed to cancel order');
      }
    } catch (err) {
      alert('Network error. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmDelivery = async () => {
    if (!order || !confirm('Confirm that you have received this order?')) return;

    setActionLoading(true);
    try {
      const response = await fetch(`${API_URL}/orders/${order.id}/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        setOrder(prev => prev ? { ...prev, status: 'delivered' } : null);
      } else {
        const errorData = await response.json();
        alert(errorData.detail || 'Failed to confirm delivery');
      }
    } catch (err) {
      alert('Network error. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😔</div>
          <h2 className="text-xl font-bold mb-2">Order Not Found</h2>
          <p className="text-slate-400 mb-6">{error}</p>
          <button
            onClick={() => router.push('/orders')}
            className="px-6 py-3 bg-sky-600 hover:bg-sky-500 text-white rounded-lg font-medium transition-colors"
          >
            ← Back to Orders
          </button>
        </div>
      </div>
    );
  }

  if (!order) return null;

  const currentStepIndex = getStatusIndex(order.status);
  const displayStatus = statusDisplayNames[order.status.toLowerCase()] || order.status;
  const statusColorClass = statusColors[order.status.toLowerCase()] || 'bg-slate-800 text-slate-400 border-slate-700';

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <button
            onClick={() => router.back()}
            className="text-slate-400 hover:text-slate-300 mb-3 flex items-center gap-2 transition-colors"
          >
            <span>←</span> Back to Orders
          </button>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                {order.title || `Order ${order.id.slice(0, 8)}`}
              </h1>
              <div className="flex items-center gap-4">
                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${statusColorClass}`}>
                  {displayStatus}
                </span>
                <span className="text-slate-400 text-sm">
                  Order #{order.id.slice(0, 8)}
                </span>
                <span className="text-slate-400 text-sm">
                  Created {formatDate(order.created_at)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Order Details */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6">
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <span>📋</span> Order Details
              </h2>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 mb-6">
                <div>
                  <div className="text-sm text-slate-400 mb-1">Material</div>
                  <div className="font-medium text-white">{order.material?.toUpperCase()}</div>
                </div>
                <div>
                  <div className="text-sm text-slate-400 mb-1">Quantity</div>
                  <div className="font-medium text-white">×{order.quantity}</div>
                </div>
                {order.color && (
                  <div>
                    <div className="text-sm text-slate-400 mb-1">Color</div>
                    <div className="font-medium text-white">{order.color}</div>
                  </div>
                )}
              </div>

              {order.description && (
                <div className="mb-6">
                  <div className="text-sm text-slate-400 mb-2">Description</div>
                  <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                    <p className="text-slate-300">{order.description}</p>
                  </div>
                </div>
              )}

              {order.notes && (
                <div>
                  <div className="text-sm text-slate-400 mb-2">Special Instructions</div>
                  <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                    <p className="text-slate-300">{order.notes}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Maker Information */}
            {order.maker && (
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6">
                <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                  <span>👨‍🔧</span> Maker
                </h2>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center text-2xl">
                    {order.maker.avatar || '👤'}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-white">{order.maker.name}</div>
                    {order.maker.rating && (
                      <div className="text-sm text-slate-400">
                        ⭐ {order.maker.rating}/5.0
                      </div>
                    )}
                  </div>
                  <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded-lg transition-colors">
                    Contact Maker
                  </button>
                </div>
              </div>
            )}

            {/* File Information */}
            {order.file_name && (
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6">
                <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                  <span>📄</span> Design File
                </h2>
                <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">📄</div>
                    <div>
                      <div className="font-medium text-white">{order.file_name}</div>
                      <div className="text-sm text-slate-400">Design file</div>
                    </div>
                  </div>
                  <button className="px-3 py-1 text-sm bg-slate-700 hover:bg-slate-600 text-white rounded transition-colors">
                    Download
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Status Timeline */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6">
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <span>📈</span> Progress
              </h2>
              <div className="space-y-4">
                {timelineSteps.map((step, index) => (
                  <div key={step.key} className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center text-sm font-bold transition-colors ${
                      index <= currentStepIndex
                        ? 'bg-sky-600 border-sky-500 text-white'
                        : index === currentStepIndex + 1
                        ? 'bg-yellow-600 border-yellow-500 text-white animate-pulse'
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}>
                      {step.icon}
                    </div>
                    <div className="flex-1">
                      <div className={`font-medium ${
                        index <= currentStepIndex ? 'text-white' : 'text-slate-400'
                      }`}>
                        {step.label}
                      </div>
                      {index === currentStepIndex && (
                        <div className="text-xs text-sky-400 mt-1">Current step</div>
                      )}
                    </div>
                    {index <= currentStepIndex && (
                      <div className="text-sky-400">✓</div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6">
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <span>⚡</span> Actions
              </h2>
              <div className="space-y-3">
                {order.status === 'shipped' && (
                  <button
                    onClick={handleConfirmDelivery}
                    disabled={actionLoading}
                    className="w-full px-4 py-3 bg-green-600 hover:bg-green-500 disabled:bg-slate-700 disabled:text-slate-400 text-white rounded-lg font-medium transition-colors"
                  >
                    {actionLoading ? 'Processing...' : '✅ Confirm Delivery'}
                  </button>
                )}
                
                {!['completed', 'delivered', 'cancelled'].includes(order.status.toLowerCase()) && (
                  <button
                    onClick={handleCancelOrder}
                    disabled={actionLoading}
                    className="w-full px-4 py-3 bg-red-900 hover:bg-red-800 disabled:bg-slate-700 disabled:text-slate-400 text-red-200 rounded-lg font-medium transition-colors"
                  >
                    {actionLoading ? 'Processing...' : '❌ Cancel Order'}
                  </button>
                )}

                <button
                  onClick={() => router.push('/orders')}
                  className="w-full px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors"
                >
                  ← Back to Orders
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}