"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useParams, useRouter } from "next/navigation";

// Mock data - replace with actual API calls
const mockOrder = {
  id: "ord_1",
  title: "机械臂关节组件",
  description: "为机器人手臂设计的精密关节组件，需要高精度打印",
  material: "PLA",
  color: "黑色",
  quantity: 2,
  fillRate: 20,
  status: "printing",
  createdAt: "2024-01-15",
  updatedAt: "2024-01-16",
  fileName: "robot_joint.stl",
  fileSize: "2.3 MB",
  estimatedPrice: "¥45",
  notes: "请确保表面光滑，关节部分需要高精度",
  maker: {
    id: "maker_1",
    name: "上海精密制造",
    rating: 4.8,
    completedOrders: 156,
    avatar: "🔧",
  },
  timeline: [
    { status: "submitted", label: "已提交", time: "2024-01-15 14:30", completed: true },
    { status: "accepted", label: "已接单", time: "2024-01-15 16:45", completed: true },
    { status: "printing", label: "打印中", time: "2024-01-16 09:00", completed: true },
    { status: "shipped", label: "已发货", time: "", completed: false },
    { status: "delivered", label: "已完成", time: "", completed: false },
  ]
};

const statusConfig: Record<string, { label: string; className: string; color: string }> = {
  submitted: { label: "已提交", className: "bg-gray-500/10 text-gray-400 border-gray-500/20", color: "gray" },
  accepted: { label: "已接单", className: "bg-blue-500/10 text-blue-400 border-blue-500/20", color: "blue" },
  printing: { label: "打印中", className: "bg-orange-500/10 text-orange-400 border-orange-500/20", color: "orange" },
  shipped: { label: "已发货", className: "bg-purple-500/10 text-purple-400 border-purple-500/20", color: "purple" },
  delivered: { label: "已完成", className: "bg-green-500/10 text-green-400 border-green-500/20", color: "green" },
};

function ProgressTimeline({ timeline }: { timeline: typeof mockOrder.timeline }) {
  return (
    <div className="space-y-4">
      {timeline.map((item, index) => (
        <div key={item.status} className="flex items-center gap-4">
          <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold ${
            item.completed 
              ? "bg-green-500 border-green-500 text-white" 
              : index === timeline.findIndex(t => !t.completed)
              ? "bg-orange-500 border-orange-500 text-white animate-pulse"
              : "bg-zinc-700 border-zinc-600 text-zinc-400"
          }`}>
            {index + 1}
          </div>
          <div className="flex-1">
            <div className={`font-medium ${item.completed ? "text-white" : "text-zinc-400"}`}>
              {item.label}
            </div>
            {item.time && (
              <div className="text-sm text-zinc-500">{item.time}</div>
            )}
          </div>
          {item.completed && (
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
  const [isUpdating, setIsUpdating] = useState(false);

  const order = mockOrder; // Replace with actual API call using params.id
  const status = statusConfig[order.status];

  const handleStatusUpdate = async (newStatus: string) => {
    setIsUpdating(true);
    try {
      // Mock API call - replace with actual API
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log(`Updating order ${order.id} to status: ${newStatus}`);
      // Refresh data or update local state
    } catch (error) {
      console.error("Failed to update status:", error);
      alert("更新失败，请重试");
    } finally {
      setIsUpdating(false);
    }
  };

  const canUpdateStatus = () => {
    // Only maker or order owner can update status
    return order.maker && order.status !== "delivered";
  };

  const getNextStatus = () => {
    const statusOrder = ["submitted", "accepted", "printing", "shipped", "delivered"];
    const currentIndex = statusOrder.indexOf(order.status);
    return currentIndex < statusOrder.length - 1 ? statusOrder[currentIndex + 1] : null;
  };

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
                创建于 {new Date(order.createdAt).toLocaleDateString('zh-CN')}
              </span>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-2xl font-bold text-orange-400">{order.estimatedPrice}</div>
            {canUpdateStatus() && nextStatus && (
              <Button
                onClick={() => handleStatusUpdate(nextStatus)}
                disabled={isUpdating}
                className="mt-2 bg-orange-500 hover:bg-orange-600 text-white"
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
                  <div className="font-medium">{order.fillRate}%</div>
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
                <STLPreview fileName={order.fileName} />
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-zinc-500">文件名</div>
                    <div className="font-medium">{order.fileName}</div>
                  </div>
                  <div>
                    <div className="text-sm text-zinc-500">文件大小</div>
                    <div className="font-medium">{order.fileSize}</div>
                  </div>
                  <div>
                    <div className="text-sm text-zinc-500">上传时间</div>
                    <div className="font-medium">{new Date(order.createdAt).toLocaleString('zh-CN')}</div>
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
                      ⭐ {order.maker.rating} · 完成 {order.maker.completedOrders} 单
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
              <ProgressTimeline timeline={order.timeline} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}