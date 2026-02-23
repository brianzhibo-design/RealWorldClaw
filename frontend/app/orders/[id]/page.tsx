"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiFetch, API_BASE } from "@/lib/api-client";
import { useAuthStore } from "@/stores/authStore";

interface Order {
  id: string;
  title?: string;
  description?: string;
  material: string;
  quantity: number;
  color?: string;
  notes?: string;
  status: string;
  urgency?: string;
  delivery_address?: string;
  created_at: string;
  updated_at?: string;
  file_id?: string;
  file_name?: string;
  node_id?: string;
  buyer_id?: string;
  maker_id?: string;
  maker?: { id: string; name: string; rating?: number; avatar?: string };
}

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
}

const TIMELINE_STEPS = [
  { key: "pending", label: "Pending", icon: "📤" },
  { key: "accepted", label: "Accepted", icon: "✅" },
  { key: "printing", label: "Printing", icon: "🖨️" },
  { key: "completed", label: "Completed", icon: "📦" },
  { key: "delivered", label: "Delivered", icon: "🎉" },
];

function getStepIndex(status: string): number {
  const map: Record<string, number> = {
    pending: 0,
    accepted: 1,
    printing: 2, assembling: 2,
    quality_check: 3,
    shipping: 3,
    delivered: 4,
    completed: 5,
    cancelled: -1,
  };
  return map[status.toLowerCase()] ?? 0;
}

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [messages, setMessages] = useState<Message[] | null>(null);
  const [msgError, setMsgError] = useState(false);
  
  // Review system state
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  useEffect(() => {
    if (!token) { router.push("/auth/login"); return; }
    if (!params.id) return;

    apiFetch<{ role: string; order: Order } | Order>(`/orders/${params.id}`)
      .then((res: any) => setOrder(res.order || res))
      .catch((err) => {
        if (err.message?.includes("401")) router.push("/auth/login");
        else setError("Failed to load order");
      })
      .finally(() => setLoading(false));

    // Try loading messages
    apiFetch<Message[]>(`/orders/${params.id}/messages`)
      .then(setMessages)
      .catch(() => setMsgError(true));
  }, [params.id, token, router]);

  const doAction = async (url: string, method: string, body?: unknown) => {
    setActionLoading(true);
    try {
      const opts: RequestInit = { method };
      if (body) opts.body = JSON.stringify(body);
      await apiFetch(url, opts);
      // Refresh order
      const raw = await apiFetch<{ role: string; order: Order } | Order>(`/orders/${params.id}`);
      const updated = (raw as any).order || raw;
      setOrder(updated);
    } catch (err) {
      alert((err as Error).message || "Action failed");
    } finally {
      setActionLoading(false);
    }
  };

  const submitReview = async () => {
    if (reviewRating === 0) {
      alert("Please select a rating");
      return;
    }

    setReviewSubmitting(true);
    try {
      await apiFetch(`/orders/${params.id}/review`, {
        method: 'POST',
        body: JSON.stringify({
          rating: reviewRating,
          comment: reviewComment
        })
      });
      
      setReviewSubmitted(true);
      setReviewRating(0);
      setReviewComment("");
    } catch (err) {
      alert((err as Error).message || "Failed to submit review");
    } finally {
      setReviewSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😔</div>
          <h2 className="text-xl font-bold mb-2">Order Not Found</h2>
          <p className="text-slate-400 mb-6">{error}</p>
          <button onClick={() => router.push("/orders")} className="px-6 py-3 bg-sky-600 hover:bg-sky-500 text-white rounded-lg font-medium transition-colors">
            ← Back to Orders
          </button>
        </div>
      </div>
    );
  }

  const currentStep = getStepIndex(order.status);
  const isCancelled = order.status.toLowerCase() === "cancelled";
  const isBuyer = user?.id === order.buyer_id;
  const isMaker = user?.id === order.maker_id || user?.role === "maker";
  const status = order.status.toLowerCase();

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", {
      year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
    });

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <button onClick={() => router.back()} className="text-slate-400 hover:text-slate-300 mb-3 flex items-center gap-2 transition-colors">
            ← Back
          </button>
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold">{order.order_number || `Order #${order.id.slice(0, 8)}`}</h1>
              <div className="flex items-center gap-3 mt-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${
                  isCancelled
                    ? "bg-red-900/50 text-red-400 border-red-800"
                    : "bg-sky-900/50 text-sky-400 border-sky-800"
                }`}>
                  {order.status}
                </span>
                <span className="text-slate-400 text-sm">{formatDate(order.created_at)}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order details */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4">📋 Order Details</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-slate-400">Material</div>
                <div className="font-medium">{order.material?.toUpperCase() || "—"}</div>
              </div>
              <div>
                <div className="text-sm text-slate-400">Quantity</div>
                <div className="font-medium">×{order.quantity}</div>
              </div>
              {order.urgency && (
                <div>
                  <div className="text-sm text-slate-400">Urgency</div>
                  <div className={`font-medium ${order.urgency === "express" ? "text-orange-400" : ""}`}>
                    {order.urgency}
                  </div>
                </div>
              )}
              {(order as any).color && (
                <div>
                  <div className="text-sm text-slate-400">Color</div>
                  <div className="font-medium">{(order as any).color}</div>
                </div>
              )}
            </div>
            {order.delivery_address && (
              <div className="mt-4 pt-4 border-t border-slate-800">
                <div className="text-sm text-slate-400 mb-1">Delivery Address</div>
                <div className="text-slate-300">{order.delivery_address}</div>
              </div>
            )}
            {order.notes && (
              <div className="mt-4 pt-4 border-t border-slate-800">
                <div className="text-sm text-slate-400 mb-1">Notes</div>
                <div className="text-slate-300">{order.notes}</div>
              </div>
            )}
          </div>

          {/* Messages */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4">💬 Messages</h2>
            {msgError ? (
              <p className="text-slate-400 text-sm italic">Messages coming soon</p>
            ) : messages && messages.length > 0 ? (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {messages.map((m) => (
                  <div key={m.id} className="p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                    <p className="text-slate-300 text-sm">{m.content}</p>
                    <p className="text-slate-400 text-xs mt-1">{formatDate(m.created_at)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 text-sm">No messages yet</p>
            )}
          </div>

          {/* Review System - Show for completed/delivered orders */}
          {(status === "completed" || status === "delivered") && isBuyer && (
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6">
              <h2 className="text-lg font-semibold mb-4">⭐ Rate Your Order</h2>
              
              {reviewSubmitted ? (
                <div className="text-center py-6">
                  <div className="text-4xl mb-3">✅</div>
                  <p className="text-green-400 font-semibold text-lg">Review submitted!</p>
                  <p className="text-slate-400 text-sm mt-2">Thank you for your feedback</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Star Rating */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-3">Rating</label>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setReviewRating(star)}
                          className={`text-3xl transition-all duration-200 hover:scale-110 ${
                            star <= reviewRating 
                              ? "text-sky-400 drop-shadow-[0_0_8px_rgba(56,189,248,0.5)]" 
                              : "text-slate-600 hover:text-slate-500"
                          }`}
                        >
                          ⭐
                        </button>
                      ))}
                    </div>
                    {reviewRating > 0 && (
                      <p className="text-sm text-slate-400 mt-2">
                        {reviewRating === 1 && "Poor"}
                        {reviewRating === 2 && "Fair"}
                        {reviewRating === 3 && "Good"}
                        {reviewRating === 4 && "Very Good"}
                        {reviewRating === 5 && "Excellent"}
                      </p>
                    )}
                  </div>

                  {/* Comment */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-3">Comment (optional)</label>
                    <textarea
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="Tell us about your experience..."
                      rows={4}
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent resize-none"
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    onClick={submitReview}
                    disabled={reviewSubmitting || reviewRating === 0}
                    className="w-full py-3 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                  >
                    {reviewSubmitting ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                        Submitting...
                      </span>
                    ) : (
                      "Submit Review"
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Timeline */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-6">📈 Progress</h2>
            {isCancelled ? (
              <div className="text-center py-4">
                <div className="text-4xl mb-2">❌</div>
                <p className="text-red-400 font-medium">Order Cancelled</p>
              </div>
            ) : (
              <div className="space-y-4">
                {TIMELINE_STEPS.map((s, i) => (
                  <div key={s.key} className="flex items-center gap-4">
                    <div
                      className={`w-10 h-10 rounded-full border-2 flex items-center justify-center text-sm transition-colors ${
                        i <= currentStep
                          ? "bg-sky-600 border-sky-500 text-white"
                          : "bg-slate-800 border-slate-700 text-slate-400"
                      }`}
                    >
                      {s.icon}
                    </div>
                    <div className="flex-1">
                      <div className={`font-medium ${i <= currentStep ? "text-white" : "text-slate-400"}`}>
                        {s.label}
                      </div>
                      {i === currentStep && (
                        <div className="text-xs text-sky-400 mt-0.5">Current</div>
                      )}
                    </div>
                    {i <= currentStep && <span className="text-sky-400 text-sm">✓</span>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4">⚡ Actions</h2>
            <div className="space-y-3">
              {/* Buyer: cancel pending */}
              {isBuyer && status === "pending" && (
                <button
                  onClick={() => doAction(`/orders/${order.id}/cancel`, "POST", {})}
                  disabled={actionLoading}
                  className="w-full py-3 bg-red-900 hover:bg-red-800 disabled:opacity-50 text-red-200 rounded-lg font-medium transition-colors"
                >
                  ❌ Cancel Order
                </button>
              )}

              {/* Buyer: confirm delivery */}
              {isBuyer && (status === "completed" || status === "delivered") && (
                <button
                  onClick={() => doAction(`/orders/${order.id}/confirm`, "POST")}
                  disabled={actionLoading}
                  className="w-full py-3 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
                >
                  ✅ Confirm Delivery
                </button>
              )}

              {/* Maker: accept pending */}
              {isMaker && status === "pending" && (
                <button
                  onClick={() => doAction(`/orders/${order.id}/accept`, "PUT")}
                  disabled={actionLoading}
                  className="w-full py-3 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
                >
                  ✅ Accept Order
                </button>
              )}

              {/* Maker: mark printing */}
              {isMaker && status === "accepted" && (
                <button
                  onClick={() => doAction(`/orders/${order.id}/status`, "PUT", { status: "printing" })}
                  disabled={actionLoading}
                  className="w-full py-3 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
                >
                  🖨️ Mark Printing
                </button>
              )}

              {/* Maker: mark complete */}
              {isMaker && status === "printing" && (
                <button
                  onClick={() => doAction(`/orders/${order.id}/status`, "PUT", { status: "completed" })}
                  disabled={actionLoading}
                  className="w-full py-3 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
                >
                  📦 Mark Complete
                </button>
              )}

              <button
                onClick={() => router.push("/orders")}
                className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors"
              >
                ← Back to Orders
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
