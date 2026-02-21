"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Printer, Package, ShoppingBag, Users, Plus, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/shared/StatCard";
import { useAuthStore } from "@/stores/authStore";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
};

// Mock data — will be replaced with SWR calls
const recentActivity = [
  { id: "1", text: "打印完成：robot-arm-v3.stl", time: "12 分钟前", type: "success" as const },
  { id: "2", text: "新订单 #1234 已创建", time: "1 小时前", type: "info" as const },
  { id: "3", text: "P2S-01 开始打印", time: "2 小时前", type: "default" as const },
  { id: "4", text: "模块 Gripper Pro 已发布", time: "5 小时前", type: "default" as const },
];

const badgeVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  success: "default",
  info: "secondary",
  default: "outline",
};

export default function DashboardPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const greeting = getGreeting();

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
          value={3}
          subtitle="2 在线"
          icon={Printer}
          onClick={() => router.push("/devices")}
        />
        <StatCard
          title="活动订单"
          value={2}
          subtitle="¥128 待结算"
          icon={Package}
          trend={{ value: "12%", positive: true }}
          onClick={() => router.push("/orders")}
        />
        <StatCard
          title="模块"
          value={8}
          icon={ShoppingBag}
          onClick={() => router.push("/marketplace")}
        />
        <StatCard
          title="社区"
          value="1.2k"
          subtitle="成员"
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
        <Card className="divide-y divide-border border-border/50">
          {recentActivity.map((a) => (
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
