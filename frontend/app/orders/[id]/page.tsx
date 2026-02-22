"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useParams, useRouter } from "next/navigation";
import { API_BASE } from "@/lib/api";

// API interfaces
interface Order {
  id: string;
  title: string;
  description?: string;
  material: string;
  color: string;
  quantity: number;
  fill_rate: number;
  status: string;
  created_at: string;
  updated_at: string;
  file_name: string;
  file_size: string;
  notes?: string;
  maker?: {
    id: string;
    name: string;
    rating: number;
    completed_orders: number;
    avatar: string;
  };
}

const statusConfig: Record<string, { label: string; className: string; color: string }> = {
  submitted: { label: "已提交", className: "bg-gray-500/10 text-gray-400 border-gray-500/20", color: "gray" },
  accepted: { label: "已接单", className: "bg-blue-500/10 text-blue-400 border-blue-500/20", color: "blue" },
  printing: { label: "制造中", className: "bg-orange-500/10 text-orange-400 border-orange-500/20", color: "orange" },
  shipped: { label: "已发货", className: "bg-purple-500/10 text-purple-400 border-purple-500/20", color: "purple" },
  delivered: { label: "已完成", className: "bg-green-500/10 text-green-400 border-green-500/20", color: "green" },
};

function ProgressTimeline({ status }: { status: string }) {
  const statuses = [
    { key: "submitted", label: "已提交" },
    { key: "accepted", label: "已接单" },
    { key: "printing", label: "制造中" },
    { key: "shipped", label: "已发货" },
    { key: "delivered", label: "已完成" },
  ];

  const currentIndex = statuses.findIndex(s => s.key === status);

  return (
    <div className="space-y-4">
      {statuses.map((item, index) => (
        <div key={item.key} className="flex items-center gap-4">
          <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold ${
            index <= currentIndex
              ? "bg-green-500 border-green-500 text-white" 
              : index === currentIndex + 1
              ? "bg-orange-500 border-orange-500 text-white animate-pulse"
              : "bg-zinc-700 border-zinc-600 text-zinc-400"
          }`}>
            {index + 1}
          </div>
          <div className="flex-1">
            <div className={`font-medium ${index <= currentIndex ? "text-white" : "text-zinc-400"}`}>
              {item.label}
            </div>
          </div>
          {index <= currentIndex && (
            <div className="text-green-400">
              ✅
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function STLPreview({ fileName }: { fileName: string }) {
  return (
    <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-6 text-center">
      <div className="text-6xl mb-4">🎯</div>
      <h4 className="font-medium mb-2">3D 文件预览</h4>
      <p className="text-sm text-zinc-400 mb-4">{fileName}</p>
      <p className="text-xs text-zinc-500">
        STL 在线预览功能开发中...
        <br />
        可下载文件到本地查看
      </p>
      <Button variant="outline" size="sm" className="mt-4 border-zinc-600 hover:bg-zinc-700">
        下载文件
      </Button>
    </div>
  );
}

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('auth_token');
        const headers: Record<string, string> = {
          'Content-Type': 'application/json'
        };
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`${API_BASE}/orders/${params.id}`, { headers });
        if (!response.ok) {
          throw new Error(`Failed to fetch order: ${response.status}`);
        }
        const orderData = await response.json();
        setOrder(orderData);
      } catch (err) {
        console.error('Failed to fetch order:', err);
        setError(err instanceof Error ? err.message : 'Failed to load order');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchOrder();
    }
  }, [params.id]);

  const handleStatusUpdate = async (newStatus: string) => {
    if (!order) return;

    setIsUpdating(true);
    try {
      const token = localStorage.getItem('auth_token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE}/orders/${order.id}/status`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      // Refresh order data
      setOrder(prev => prev ? { ...prev, status: newStatus } : null);
    } catch (error) {
      console.error("Failed to update status:", error);
      alert("更新失败，请重试");
    } finally {
      setIsUpdating(false);
    }
  };

  const canUpdateStatus = () => {
    return order && order.maker && order.status !== "delivered";
  };

  const getNextStatus = () => {
    const statusOrder = ["submitted", "accepted", "printing", "shipped", "delivered"];
    const currentIndex = statusOrder.indexOf(order?.status || '');
    return currentIndex < statusOrder.length - 1 ? statusOrder[currentIndex + 1] : null;
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16">
        <div className="flex justify-center items-center h-64">
          <div className="text-zinc-400">加载中...</div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16">
        <div className="text-center">
          <div className="text-red-400 mb-4">
            {error || '订单未找到'}
          </div>
          <Button 
            variant="outline" 
            onClick={() => router.push('/orders')}
            className="border-zinc-700 hover:bg-zinc-800"
          >
            返回订单列表
          </Button>
        </div>
      </div>
    );
  }

  const status = statusConfig[order.status] || { label: order.status, className: "bg-gray-500/10 text-gray-400 border-gray-500/20", color: "gray" };
  const nextStatus = getNextStatus();

  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      {/* Header */}
      <div className="mb-8">
        <Button 
          variant="outline" 
          onClick={() => router.back()}
          className="mb-4 border-zinc-700 hover:bg-zinc-800"
        >
          ← 返回
        </Button>
        
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">{order.title}</h1>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className={status.className}>
                {status.label}
              </Badge>
              <span className="text-sm text-zinc-500">
                订单号：{order.id}
              </span>
              <span className="text-sm text-zinc-500">
                创建于 {new Date(order.created_at).toLocaleDateString('zh-CN')}
              </span>
            </div>
          </div>
          
          <div className="text-right">
            {canUpdateStatus() && nextStatus && (
              <Button
                onClick={() => handleStatusUpdate(nextStatus)}
                disabled={isUpdating}
                className="bg-orange-500 hover:bg-orange-600 text-white"
                size="sm"
              >
                {isUpdating ? "更新中..." : `标记为${statusConfig[nextStatus].label}`}
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Info */}
          <Card className="bg-zinc-900/60 border-zinc-800">
            <CardContent className="p-6">
              <h3 className="text-lg font-medium mb-4">📋 订单信息</h3>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                <div>
                  <div className="text-sm text-zinc-500">材料</div>
                  <div className="font-medium">{order.material}</div>
                </div>
                <div>
                  <div className="text-sm text-zinc-500">颜色</div>
                  <div className="font-medium">{order.color}</div>
                </div>
                <div>
                  <div className="text-sm text-zinc-500">数量</div>
                  <div className="font-medium">×{order.quantity}</div>
                </div>
                <div>
                  <div className="text-sm text-zinc-500">填充率</div>
                  <div className="font-medium">{order.fill_rate}%</div>
                </div>
              </div>

              {order.description && (
                <div className="mb-6">
                  <div className="text-sm text-zinc-500 mb-2">描述</div>
                  <p className="text-sm text-zinc-300">{order.description}</p>
                </div>
              )}

              {order.notes && (
                <div>
                  <div className="text-sm text-zinc-500 mb-2">备注</div>
                  <p className="text-sm text-zinc-300 bg-zinc-800/50 rounded-lg p-3 border border-zinc-700">
                    {order.notes}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 3D Preview */}
          <Card className="bg-zinc-900/60 border-zinc-800">
            <CardContent className="p-6">
              <h3 className="text-lg font-medium mb-4">🎯 文件信息</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <STLPreview fileName={order.file_name} />
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-zinc-500">文件名</div>
                    <div className="font-medium">{order.file_name}</div>
                  </div>
                  <div>
                    <div className="text-sm text-zinc-500">文件大小</div>
                    <div className="font-medium">{order.file_size}</div>
                  </div>
                  <div>
                    <div className="text-sm text-zinc-500">上传时间</div>
                    <div className="font-medium">{new Date(order.created_at).toLocaleString('zh-CN')}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Maker Info */}
          {order.maker && (
            <Card className="bg-zinc-900/60 border-zinc-800">
              <CardContent className="p-6">
                <h3 className="text-lg font-medium mb-4">👨‍🔧 制造者信息</h3>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center text-2xl">
                    {order.maker.avatar}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{order.maker.name}</div>
                    <div className="text-sm text-zinc-500">
                      ⭐ {order.maker.rating} · 完成 {order.maker.completed_orders} 单
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="border-zinc-600 hover:bg-zinc-700">
                    联系制造者
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Progress Timeline */}
          <Card className="bg-zinc-900/60 border-zinc-800">
            <CardContent className="p-6">
              <h3 className="text-lg font-medium mb-4">📈 订单进度</h3>
              <ProgressTimeline status={order.status} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}