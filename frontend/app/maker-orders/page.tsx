"use client";
import { fetchAvailableOrders, fetchAcceptedOrders, acceptOrder } from "@/lib/api-client";
import { useAuthStore } from "@/stores/authStore";
import { EmptyState } from "@/components/EmptyState";

import { useState, useEffect, useCallback } from "react";


interface Order {
  id: string;
  title: string;
  description?: string;
  material: string;
  quantity: number;
  created_at: string;
  distance_km?: number;
  estimated_duration_hours?: number;
  price_range?: {
    min: number;
    max: number;
  };
}

export default function MakerOrdersPage() {
  const [availableOrders, setAvailableOrders] = useState<Order[]>([]);
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"available" | "accepted">("available");
  const [accepting, setAccepting] = useState<string | null>(null);

  // Check if user is authenticated
  const { token, user } = useAuthStore();

  const fetchOrders = useCallback(async () => {
    if (!token) return;
    
    setLoading(true);
    setError(null);

    try {
      if (activeTab === "available") {
        const data = await fetchAvailableOrders();
        setAvailableOrders(data);
      } else {
        const data = await fetchAcceptedOrders();
        setMyOrders(data);
      }
    } catch (err) {
      setError("Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, [activeTab, token]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);
  
  if (!token) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔐</div>
          <h2 className="text-xl font-bold mb-2">Authentication Required</h2>
          <p className="text-slate-400 mb-6">Please sign in to view maker orders</p>
          <a
            href="/auth/login"
            className="inline-block px-6 py-3 bg-sky-600 hover:bg-sky-500 text-white rounded-lg font-medium transition-colors"
          >
            Sign In →
          </a>
        </div>
      </div>
    );
  }

  const handleAcceptOrder = async (orderId: string) => {
    setAccepting(orderId);
    setError(null);

    try {
      const result = await acceptOrder(orderId, 24);

      if (result.success) {
        // Remove from available orders and refresh
        setAvailableOrders(prev => prev.filter(order => order.id !== orderId));
        // Show success message or redirect
        alert("Order accepted successfully!");
      } else {
        setError(result.error || "Failed to accept order");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setAccepting(null);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return "Just now";
  };

  const formatDistance = (km?: number) => {
    if (!km) return "Unknown distance";
    if (km < 1) return `${Math.round(km * 1000)}m away`;
    return `${km.toFixed(1)}km away`;
  };

  const formatDuration = (hours?: number) => {
    if (!hours) return "Time TBD";
    if (hours < 1) return "< 1 hour";
    if (hours < 24) return `~${Math.round(hours)} hours`;
    const days = Math.round(hours / 24);
    return `~${days} day${days > 1 ? 's' : ''}`;
  };

  const formatPriceRange = (range?: { min: number; max: number }) => {
    if (!range) return "Price TBD";
    if (range.min === range.max) return `$${range.min}`;
    return `$${range.min}-${range.max}`;
  };

  const currentOrders = activeTab === "available" ? availableOrders : myOrders;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/90 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <span>🛠️</span> Maker Dashboard
              </h1>
              <p className="text-slate-400 text-sm mt-1">
                Accept orders and manage your manufacturing queue
              </p>
            </div>
            <a
              href="/register-node"
              className="px-4 py-2 bg-sky-600 hover:bg-sky-500 rounded-md text-sm font-medium transition-colors"
            >
              Register Node
            </a>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="flex space-x-1 bg-slate-900 rounded-lg p-1 mb-8">
          <button
            onClick={() => setActiveTab("available")}
            className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === "available"
                ? "bg-sky-600 text-white"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            Available Orders ({availableOrders.length})
          </button>
          <button
            onClick={() => setActiveTab("accepted")}
            className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === "accepted"
                ? "bg-sky-600 text-white"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            My Accepted Orders ({myOrders.length})
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/50 border border-red-800 rounded-lg text-red-200">
            {error}
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-slate-400">Loading orders...</div>
          </div>
        )}

        {/* Empty state */}
        {!loading && currentOrders.length === 0 && (
          <EmptyState
            icon={activeTab === "available" ? "📋" : "✨"}
            title={activeTab === "available" ? "No available orders" : "No accepted orders"}
            description={activeTab === "available" 
              ? "Check back later for new manufacturing opportunities"
              : "Accept some orders from the Available tab to get started"
            }
          />
        )}

        {/* Orders grid */}
        {!loading && currentOrders.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentOrders.map((order) => (
              <div
                key={order.id}
                className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden hover:border-slate-700 transition-colors"
              >
                <div className="p-6">
                  {/* Order header */}
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="font-semibold text-white text-lg leading-tight">
                      {order.order_number || `Order ${order.id.slice(0, 8)}`}
                    </h3>
                    <span className="text-xs text-slate-400 whitespace-nowrap ml-2">
                      {formatTimeAgo(order.created_at)}
                    </span>
                  </div>

                  {/* Description */}
                  {order.notes && (
                    <p className="text-slate-300 text-sm mb-4 line-clamp-2">
                      {order.notes}
                    </p>
                  )}

                  {/* Material and quantity */}
                  <div className="flex items-center gap-4 mb-4 text-sm">
                    <span className="px-2 py-1 bg-slate-800 text-slate-300 rounded font-medium uppercase">
                      {order.material}
                    </span>
                    <span className="text-slate-400">
                      Qty: <span className="text-white font-medium">{order.quantity}</span>
                    </span>
                  </div>

                  {/* Order details */}
                  <div className="space-y-2 text-sm text-slate-400 mb-6">
                    <div className="flex justify-between">
                      <span>Distance:</span>
                      <span className="text-slate-300">{formatDistance(order.distance_km)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Duration:</span>
                      <span className="text-slate-300">{formatDuration(order.estimated_duration_hours)}</span>
                    </div>
                    {order.price_range && (
                      <div className="flex justify-between">
                        <span>Estimate:</span>
                        <span className="text-green-400 font-medium">{formatPriceRange(order.price_range)}</span>
                      </div>
                    )}
                  </div>

                  {/* Action button */}
                  {activeTab === "available" ? (
                    <button
                      onClick={() => handleAcceptOrder(order.id)}
                      disabled={accepting === order.id}
                      className="w-full px-4 py-2 bg-sky-600 hover:bg-sky-500 disabled:bg-slate-700 disabled:text-slate-400 text-white rounded-md text-sm font-medium transition-colors"
                    >
                      {accepting === order.id ? "Accepting..." : "Accept Order"}
                    </button>
                  ) : (
                    <a
                      href={`/orders/${order.id}`}
                      className="block w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 text-center text-white rounded-md text-sm font-medium transition-colors"
                    >
                      View Details
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Help section */}
        <div className="mt-16 bg-slate-900/50 border border-slate-800 rounded-lg p-6">
          <h3 className="font-medium mb-3 flex items-center gap-2">
            <span>💡</span> Getting Started as a Maker
          </h3>
          <div className="text-sm text-slate-300 space-y-2">
            <p>• <strong>Register your node</strong> to receive orders matching your capabilities</p>
            <p>• <strong>Accept orders</strong> that fit your schedule and material availability</p>
            <p>• <strong>Communicate with customers</strong> through the order details page</p>
            <p>• <strong>Update order status</strong> to keep customers informed</p>
          </div>
          <div className="mt-4">
            <a
              href="/register-node"
              className="text-sky-400 hover:text-sky-300 text-sm font-medium"
            >
              Register your first node →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}