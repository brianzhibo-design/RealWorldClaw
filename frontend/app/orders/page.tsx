/** 订单页 — Orders */
"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Package } from "lucide-react";

type OrderStatus = "pending" | "matched" | "printing" | "shipped" | "completed";

interface Order {
  id: string;
  componentName: string;
  status: OrderStatus;
  createdAt: string;
  progress: number; // 0-100
}

const mockOrders: Order[] = [
  { id: "ORD-20250221-001", componentName: "Clawbie V4 Cyber Egg", status: "printing", createdAt: "2025-02-21T09:00:00Z", progress: 62 },
  { id: "ORD-20250220-003", componentName: "Spine Controller Mount", status: "completed", createdAt: "2025-02-20T14:20:00Z", progress: 100 },
  { id: "ORD-20250220-002", componentName: "Eyes Module Bracket", status: "shipped", createdAt: "2025-02-20T11:00:00Z", progress: 90 },
  { id: "ORD-20250219-001", componentName: "Battery Cradle", status: "matched", createdAt: "2025-02-19T16:45:00Z", progress: 15 },
  { id: "ORD-20250218-002", componentName: "Speaker Housing", status: "pending", createdAt: "2025-02-18T20:30:00Z", progress: 0 },
  { id: "ORD-20250217-001", componentName: "Servo Arm L/R", status: "completed", createdAt: "2025-02-17T08:00:00Z", progress: 100 },
];

const statusConfig: Record<OrderStatus, { label: string; className: string }> = {
  pending:   { label: "Pending",   className: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20" },
  matched:   { label: "Matched",   className: "bg-blue-500/15 text-blue-400 border-blue-500/20" },
  printing:  { label: "Printing",  className: "bg-cyan-500/15 text-cyan-400 border-cyan-500/20" },
  shipped:   { label: "Shipped",   className: "bg-purple-500/15 text-purple-400 border-purple-500/20" },
  completed: { label: "Completed", className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20" },
};

const activeStatuses = new Set<OrderStatus>(["pending", "matched", "printing", "shipped"]);

export default function OrdersPage() {
  const [tab, setTab] = useState("all");

  const filtered = useMemo(() => {
    if (tab === "active") return mockOrders.filter((o) => activeStatuses.has(o.status));
    if (tab === "completed") return mockOrders.filter((o) => o.status === "completed");
    return mockOrders;
  }, [tab]);

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-10 sm:py-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Orders</h1>
          <p className="mt-2 text-muted-foreground">Track your print orders and shipments.</p>
        </div>
        <Button size="sm" asChild>
          <Link href="/orders/new">
            <Plus className="mr-2 h-4 w-4" />
            New Order
          </Link>
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab} className="mb-6">
        <TabsList className="bg-muted">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Table */}
      {filtered.length > 0 ? (
        <div className="rounded-xl border border-border bg-card overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">Order ID</TableHead>
                <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">Component</TableHead>
                <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">Status</TableHead>
                <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">Created</TableHead>
                <TableHead className="text-xs uppercase tracking-wider text-muted-foreground text-right">Progress</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((order) => {
                const sc = statusConfig[order.status];
                return (
                  <TableRow key={order.id} className="hover:bg-muted/50">
                    <TableCell className="font-mono text-sm">{order.id}</TableCell>
                    <TableCell className="font-medium">{order.componentName}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={sc.className}>
                        {sc.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(order.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="h-1.5 w-20 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full bg-primary transition-all"
                            style={{ width: `${order.progress}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground font-mono w-8 text-right">
                          {order.progress}%
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="text-center py-24">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
            <Package className="h-7 w-7 text-muted-foreground" />
          </div>
          <p className="text-lg font-medium text-muted-foreground">No orders yet</p>
          <p className="mt-1 text-sm text-muted-foreground/70">
            Create your first order to start printing.
          </p>
        </div>
      )}
    </div>
  );
}
