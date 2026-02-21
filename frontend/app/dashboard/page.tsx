"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Printer, Package, ShoppingBag, Users, Plus, ArrowRight, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  devices?: number;
  devicesOnline?: number;
  activeOrders?: number;
  pendingAmount?: string;
  ordersTrend?: string;
  ordersTrendPositive?: boolean;
  modules?: number;
  communityMembers?: string;
}

interface Activity {
  id: string;
  text: string;
  time: string;
  type: "success" | "info" | "default";
}

const badgeVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  success: "default",
  info: "secondary",
  default: "outline",
};

export default function DashboardPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const greeting = getGreeting();

  const [stats, setStats] = useState<Stats | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingActivity, setLoadingActivity] = useState(true);

  useEffect(() => {
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;

    fetch(`${API_BASE}/stats`, { headers })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (data) setStats(data); })
      .catch(() => {})
      .finally(() => setLoadingStats(false));

    fetch(`${API_BASE}/posts?per_page=5`, { headers })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          const posts = Array.isArray(data) ? data : data.posts ?? [];
          setActivities(
            posts.map((p: Record<string, unknown>) => ({
              id: String(p.id ?? ""),
              text: String(p.title ?? p.text ?? ""),
              time: typeof p.timeAgo === "string" ? p.timeAgo : typeof p.created_at === "string" ? p.created_at : "",
              type: "default" as const,
            }))
          );
        }
      })
      .catch(() => {})
      .finally(() => setLoadingActivity(false));
  }, [token]);

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
          {greeting}，{user?.username || "Maker"} 👋
        </h1>
        <p className="text-muted-foreground mt-1">这是你的工作台概览。</p>
      </motion.div>

      {/* Stats */}
      <motion.div variants={item} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="设备"
          value={stats?.devices ?? "—"}
          subtitle={stats?.devicesOnline != null ? `${stats.devicesOnline} 在线` : undefined}
          icon={Printer}
          onClick={() => router.push("/devices")}
        />
        <StatCard
          title="活动订单"
          value={stats?.activeOrders ?? "—"}
          subtitle={stats?.pendingAmount ? `${stats.pendingAmount} 待结算` : undefined}
          icon={Package}
          trend={stats?.ordersTrend ? { value: stats.ordersTrend, positive: stats.ordersTrendPositive ?? true } : undefined}
          onClick={() => router.push("/orders")}
        />
        <StatCard
          title="模块"
          value={stats?.modules ?? "—"}
          icon={ShoppingBag}
          onClick={() => router.push("/marketplace")}
        />
        <StatCard
          title="社区"
          value={stats?.communityMembers ?? "—"}
          subtitle={stats?.communityMembers ? "成员" : undefined}
          icon={Users}
        />
      </motion.div>

      {/* Quick actions */}
      <motion.div variants={item} className="flex flex-wrap gap-3">
        <Button size="sm" onClick={() => router.push("/orders/new")}>
          <Plus className="h-4 w-4 mr-1" /> 创建订单
        </Button>
        <Button size="sm" variant="outline" onClick={() => router.push("/studio/upload")}>
          <Plus className="h-4 w-4 mr-1" /> 上传设计
        </Button>
        <Button size="sm" variant="outline" onClick={() => router.push("/devices")}>
          管理设备
        </Button>
      </motion.div>

      {/* Recent activity */}
      <motion.div variants={item}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium">最近活动</h2>
          <Button variant="ghost" size="sm" className="text-muted-foreground">
            查看全部 <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        </div>
        {loadingActivity ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : activities.length > 0 ? (
          <Card className="divide-y divide-border border-border/50">
            {activities.map((a) => (
              <div key={a.id} className="flex items-center justify-between p-4 hover:bg-accent/50 transition-colors">
                <div className="flex items-center gap-3">
                  <Badge variant={badgeVariant[a.type] || "outline"} className="text-xs">
                    {a.type === "success" ? "✅" : a.type === "info" ? "📦" : "🖨️"}
                  </Badge>
                  <span className="text-sm">{a.text}</span>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">{a.time}</span>
              </div>
            ))}
          </Card>
        ) : (
          <Card className="p-8 text-center text-muted-foreground">
            暂无活动记录
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
