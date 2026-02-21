/** 订单页 — Orders */
"use client";

import { useState, useMemo, useEffect } from "react";
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
import { Plus, Package, Loader2 } from "lucide-react";
import { API_BASE } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";

type OrderStatus = "pending" | "matched" | "printing" | "shipped" | "completed";

interface Order {
  id: string;
  componentName: string;
  status: OrderStatus;
  createdAt: string;
  progress: number;
}

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
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const token = useAuthStore((s) => s.token);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/orders`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error(`Failed to fetch orders (${res.status})`);
        const data = await res.json();
        if (!cancelled) setOrders(Array.isArray(data) ? data : data.orders ?? []);
      } catch (e: unknown) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load orders");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [token]);

  const filtered = useMemo(() => {
    if (tab === "active") return orders.filter((o) => activeStatuses.has(o.status));
    if (tab === "completed") return orders.filter((o) => o.status === "completed");
    return orders;
  }, [tab, orders]);

  if (!token) {
    return (
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-10 sm:py-16 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
          <Package className="h-7 w-7 text-muted-foreground" />
        </div>
        <p className="text-lg font-medium text-muted-foreground">Please log in to view your orders</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-10 sm:py-16 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-10 sm:py-16 text-center">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

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
                const sc = statusConfig[order.status] ?? { label: order.status, className: "" };
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
