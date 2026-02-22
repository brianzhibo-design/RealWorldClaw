"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";

// Mock data - replace with actual API calls
const mockPublicOrders = [
  {
    id: "ord_1",
    title: "机械臂关节组件",
    material: "PLA",
    color: "黑色",
    quantity: 2,
    fillRate: 20,
    status: "pending",
    createdAt: "2024-01-15",
    location: "上海市",
    estimatedPrice: "¥45",
  },
  {
    id: "ord_2",
    title: "传感器外壳",
    material: "PETG",
    color: "透明",
    quantity: 1,
    fillRate: 30,
    status: "pending",
    createdAt: "2024-01-14",
    location: "北京市",
    estimatedPrice: "¥28",
  },
  {
    id: "ord_3",
    title: "定制手机支架",
    material: "TPU",
    color: "蓝色",
    quantity: 1,
    fillRate: 15,
    status: "pending",
    createdAt: "2024-01-13",
    location: "深圳市",
    estimatedPrice: "¥22",
  },
];

const mockMyOrders = [
  {
    id: "ord_4",
    title: "我的机械爪设计",
    material: "ABS",
    color: "红色",
    quantity: 1,
    fillRate: 25,
    status: "printing",
    createdAt: "2024-01-12",
    makerName: "上海制造者",
    estimatedPrice: "¥35",
  },
  {
    id: "ord_5",
    title: "齿轮组件",
    material: "PLA",
    color: "白色",
    quantity: 3,
    fillRate: 20,
    status: "delivered",
    createdAt: "2024-01-08",
    makerName: "北京精工",
    estimatedPrice: "¥60",
  },
];

const statusConfig: Record<string, { label: string; variant: "default" | "outline" | "secondary" | "destructive"; className: string }> = {
  pending: { 
    label: "待接单", 
    variant: "outline",
    className: "border-yellow-500/50 text-yellow-400 bg-yellow-500/10"
  },
  accepted: { 
    label: "已接单", 
    variant: "default",
    className: "border-blue-500/50 text-blue-400 bg-blue-500/10"
  },
  printing: { 
    label: "打印中", 
    variant: "default",
    className: "border-orange-500/50 text-orange-400 bg-orange-500/10"
  },
  shipped: { 
    label: "已发货", 
    variant: "default",
    className: "border-purple-500/50 text-purple-400 bg-purple-500/10"
  },
  delivered: { 
    label: "已完成", 
    variant: "default",
    className: "border-green-500/50 text-green-400 bg-green-500/10"
  },
};

function OrderCard({ order, showAcceptButton = false }: { order: any; showAcceptButton?: boolean }) {
  const status = statusConfig[order.status] || statusConfig.pending;
  
  const handleAcceptOrder = () => {
    // Mock API call - replace with actual API
    alert(`接单成功：${order.title}`);
  };

  return (
    <Card className="bg-zinc-900/60 border-zinc-800 hover:border-orange-500/30 transition-colors">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <Link 
              href={`/orders/${order.id}`}
              className="text-lg font-medium hover:text-orange-400 transition-colors"
            >
              {order.title}
            </Link>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className={status.className}>
                {status.label}
              </Badge>
              <span className="text-sm text-zinc-500">
                {new Date(order.createdAt).toLocaleDateString('zh-CN')}
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-semibold text-orange-400">{order.estimatedPrice}</div>
            {order.location && (
              <div className="text-xs text-zinc-500">{order.location}</div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm text-zinc-400 mb-4">
          <span>📦 {order.material}</span>
          <span>🎨 {order.color}</span>
          <span>📊 {order.fillRate}% 填充</span>
          <span>🔢 x{order.quantity}</span>
        </div>

        {order.makerName && (
          <div className="text-sm text-zinc-500 mb-4">
            制造者：<span className="text-zinc-300">{order.makerName}</span>
          </div>
        )}

        <div className="flex justify-between items-center">
          <Link 
            href={`/orders/${order.id}`}
            className="text-sm text-orange-400 hover:text-orange-300 transition-colors"
          >
            查看详情 →
          </Link>
          
          {showAcceptButton && order.status === 'pending' && (
            <Button 
              size="sm"
              onClick={handleAcceptOrder}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              接单
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function OrdersPage() {
  const [activeTab, setActiveTab] = useState("public");

  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">
            <span className="bg-gradient-to-r from-orange-500 to-amber-400 bg-clip-text text-transparent">
              制造订单
            </span>
          </h1>
          <p className="text-zinc-400 mt-2">管理你的订单，或接取他人的制造需求</p>
        </div>
        <Link href="/orders/new">
          <Button className="bg-orange-500 hover:bg-orange-600 text-white">
            + 新建订单
          </Button>
        </Link>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-zinc-800/50 border-zinc-700">
          <TabsTrigger 
            value="public"
            className="data-[state=active]:bg-orange-500 data-[state=active]:text-white"
          >
            待接订单 ({mockPublicOrders.length})
          </TabsTrigger>
          <TabsTrigger 
            value="my"
            className="data-[state=active]:bg-orange-500 data-[state=active]:text-white"
          >
            我的订单 ({mockMyOrders.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="public" className="mt-6">
          {mockPublicOrders.length === 0 ? (
            <Card className="bg-zinc-900/40 border-zinc-800 border-dashed">
              <CardContent className="py-20 text-center">
                <div className="text-4xl mb-4">📦</div>
                <h3 className="font-semibold text-lg mb-2">暂无待接订单</h3>
                <p className="text-sm text-zinc-500 mb-6">当前没有可接取的订单，稍后再来看看</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {mockPublicOrders.map((order) => (
                <OrderCard 
                  key={order.id} 
                  order={order} 
                  showAcceptButton={true}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="my" className="mt-6">
          {mockMyOrders.length === 0 ? (
            <Card className="bg-zinc-900/40 border-zinc-800 border-dashed">
              <CardContent className="py-20 text-center">
                <div className="text-4xl mb-4">📋</div>
                <h3 className="font-semibold text-lg mb-2">还没有订单</h3>
                <p className="text-sm text-zinc-500 mb-6">开始你的第一个3D打印订单吧</p>
                <Link href="/orders/new">
                  <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                    创建订单
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {mockMyOrders.map((order) => (
                <OrderCard 
                  key={order.id} 
                  order={order} 
                  showAcceptButton={false}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}