"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Printer, Package, Plus, ArrowRight, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/shared/StatCard";
import { useAuthStore } from "@/stores/authStore";
import { API_BASE } from "@/lib/api";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } },
};

interface Stats {
  myNodes?: number;
  myOrders?: number;
  activeOrders?: number;
  pendingOrders?: number;
}

interface RecentActivity {
  id: string;
  text: string;
  time: string;
  type: "order" | "node" | "default";
}

export default function DashboardPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const greeting = getGreeting();

  const [stats, setStats] = useState<Stats | null>(null);
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingActivity, setLoadingActivity] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const headers: Record<string, string> = {};
        if (token) headers.Authorization = `Bearer ${token}`;

        // 获取我的节点数量
        const nodesResponse = await fetch(`${API_BASE}/nodes`, { headers });
        const nodesData = nodesResponse.ok ? await nodesResponse.json() : null;
        const myNodes = nodesData?.nodes?.length || 0;

        // 获取我的订单数量
        const ordersResponse = await fetch(`${API_BASE}/orders?type=my`, { headers });
        const ordersData = ordersResponse.ok ? await ordersResponse.json() : null;
        const orders = ordersData?.orders || [];
        const myOrders = orders.length;
        const activeOrders = orders.filter((o: any) => !['delivered', 'cancelled'].includes(o.status)).length;

        setStats({
          myNodes,
          myOrders,
          activeOrders,
          pendingOrders: orders.filter((o: any) => o.status === 'submitted').length,
        });
      } catch (error) {
        console.error('Failed to fetch stats:', error);
        // 设置默认值
        setStats({ myNodes: 0, myOrders: 0, activeOrders: 0, pendingOrders: 0 });
      } finally {
        setLoadingStats(false);
      }
    };

    const fetchActivities = async () => {
      try {
        const headers: Record<string, string> = {};
        if (token) headers.Authorization = `Bearer ${token}`;

        // 获取最近活动 - 可以是最近的订单或节点状态变化
        const response = await fetch(`${API_BASE}/orders?type=my&limit=5`, { headers });
        if (response.ok) {
          const data = await response.json();
          const orders = data.orders || [];
          
          const recentActivities: RecentActivity[] = orders.map((order: any) => ({
            id: order.id,
            text: `订单"${order.title}"状态更新为${getStatusLabel(order.status)}`,
            time: new Date(order.updated_at).toLocaleDateString('zh-CN'),
            type: 'order' as const,
          }));

          setActivities(recentActivities);
        }
      } catch (error) {
        console.error('Failed to fetch activities:', error);
      } finally {
        setLoadingActivity(false);
      }
    };

    fetchStats();
    fetchActivities();
  }, [token]);

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      submitted: '已提交',
      accepted: '已接单',
      printing: '制造中',
      shipped: '已发货',
      delivered: '已完成',
      cancelled: '已取消',
    };
    return labels[status] || status;
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-8 max-w-6xl"
    >
      {/* Greeting */}
      <motion.div variants={item}>
        <h1 className="text-2xl font-semibold tracking-tight">
          {greeting}，{user?.username || "用户"} 👋
        </h1>
        <p className="text-muted-foreground mt-1">欢迎来到RealWorldClaw制造网络</p>
      </motion.div>

      {/* Stats */}
      <motion.div variants={item} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="我的节点"
          value={loadingStats ? "—" : stats?.myNodes ?? 0}
          subtitle={stats?.myNodes ? `${stats.myNodes} 个制造节点` : "还未注册节点"}
          icon={Printer}
          onClick={() => router.push("/nodes")}
        />
        <StatCard
          title="我的订单"
          value={loadingStats ? "—" : stats?.myOrders ?? 0}
          subtitle={stats?.activeOrders ? `${stats.activeOrders} 个进行中` : undefined}
          icon={Package}
          onClick={() => router.push("/orders")}
        />
      </motion.div>

      {/* Quick actions */}
      <motion.div variants={item} className="flex flex-wrap gap-3">
        <Button size="sm" onClick={() => router.push("/orders/new")}>
          <Plus className="h-4 w-4 mr-1" /> 提交订单
        </Button>
        <Button size="sm" variant="outline" onClick={() => router.push("/nodes/register")}>
          <Plus className="h-4 w-4 mr-1" /> 注册节点
        </Button>
      </motion.div>

      {/* Recent activity */}
      <motion.div variants={item}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium">最近活动</h2>
          <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => router.push("/orders")}>
            查看全部 <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        </div>
        {loadingActivity ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : activities.length > 0 ? (
          <Card className="divide-y divide-border border-border/50">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between p-4 hover:bg-accent/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="text-lg">
                    {activity.type === 'order' ? '📦' : '🖨️'}
                  </div>
                  <span className="text-sm">{activity.text}</span>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">{activity.time}</span>
              </div>
            ))}
          </Card>
        ) : (
          <Card className="p-8 text-center text-muted-foreground">
            <div className="text-6xl mb-4">🚀</div>
            <h3 className="font-medium mb-2">开始你的制造之旅</h3>
            <p className="text-sm mb-4">提交你的第一个订单，或注册成为制造节点</p>
            <div className="flex gap-2 justify-center">
              <Button size="sm" onClick={() => router.push("/orders/new")}>
                提交订单
              </Button>
              <Button size="sm" variant="outline" onClick={() => router.push("/nodes/register")}>
                注册节点
              </Button>
            </div>
          </Card>
        )}
      </motion.div>
    </motion.div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 6) return "夜深了";
  if (h < 12) return "早上好";
  if (h < 18) return "下午好";
  return "晚上好";
}