"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

/* ── mock data ── */
const mockStats = {
  totalEarnings: 12580,
  completedOrders: 47,
  rating: 4.8,
  responseTime: "< 2h",
};

const capabilities = ["FDM", "SLA", "Large Parts", "Small Parts", "Multi-color", "TPU Flex"];

const pendingOrders = [
  { id: "ORD-1024", part: "Robotic Arm Joint v3", material: "PLA+", estTime: "4h", price: 28 },
  { id: "ORD-1031", part: "Sensor Housing", material: "PETG", estTime: "2h", price: 15 },
  { id: "ORD-1038", part: "Gripper Finger Set (x4)", material: "TPU 95A", estTime: "6h", price: 42 },
];

const historyOrders = [
  { id: "ORD-0998", part: "Base Plate v2", material: "PLA+", date: "2026-02-18", status: "completed", earnings: 35 },
  { id: "ORD-0985", part: "Motor Mount", material: "ABS", date: "2026-02-15", status: "completed", earnings: 22 },
  { id: "ORD-0971", part: "Cable Guide", material: "PETG", date: "2026-02-12", status: "completed", earnings: 12 },
  { id: "ORD-0960", part: "Wheel Hub", material: "PLA+", date: "2026-02-09", status: "cancelled", earnings: 0 },
];

/* ── Unregistered state ── */
function BecomeAMaker({ onRegister }: { onRegister: () => void }) {
  const benefits = [
    {
      icon: "💰",
      title: "Earn Money",
      desc: "Turn your idle 3D printer into a revenue stream. Get paid for every order you fulfill.",
    },
    {
      icon: "⏰",
      title: "Flexible Schedule",
      desc: "Accept orders on your own terms. Print when it suits you, no commitments.",
    },
    {
      icon: "🤝",
      title: "Join the Community",
      desc: "Connect with designers and builders. Grow your reputation in the maker ecosystem.",
    },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-24 text-center">
      <h1 className="text-5xl font-extrabold tracking-tight mb-4">
        <span className="bg-gradient-to-r from-orange-500 to-amber-400 bg-clip-text text-transparent">
          Maker Center
        </span>
      </h1>
      <p className="text-zinc-400 text-lg mb-12 max-w-xl mx-auto">
        You have a 3D printer. We have orders. Let&apos;s make things happen.
      </p>

      <div className="grid gap-6 md:grid-cols-3 mb-16">
        {benefits.map((b) => (
          <Card
            key={b.title}
            className="bg-zinc-900/60 border-zinc-800 hover:border-orange-500/40 transition-colors"
          >
            <CardContent className="pt-8 pb-6 text-center">
              <div className="text-4xl mb-4">{b.icon}</div>
              <h3 className="font-semibold text-lg mb-2">{b.title}</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">{b.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Button
        size="lg"
        onClick={onRegister}
        className="bg-orange-500 hover:bg-orange-600 text-white text-lg px-10 py-6 rounded-xl shadow-lg shadow-orange-500/20 transition-all hover:shadow-orange-500/30 hover:scale-[1.02]"
      >
        Become a Maker →
      </Button>
    </div>
  );
}

/* ── Registered state ── */
function MakerDashboard() {
  const stats = [
    { label: "Total Earnings", value: `¥${mockStats.totalEarnings.toLocaleString()}`, icon: "💰" },
    { label: "Completed Orders", value: mockStats.completedOrders, icon: "📦" },
    { label: "Rating", value: `${mockStats.rating} ★`, icon: "⭐" },
    { label: "Avg Response", value: mockStats.responseTime, icon: "⚡" },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <h1 className="text-3xl font-bold mb-8">
        <span className="bg-gradient-to-r from-orange-500 to-amber-400 bg-clip-text text-transparent">
          Maker Center
        </span>
      </h1>

      {/* Stats */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-10">
        {stats.map((s) => (
          <Card key={s.label} className="bg-zinc-900/60 border-zinc-800">
            <CardContent className="pt-6 pb-5">
              <div className="text-2xl mb-1">{s.icon}</div>
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-xs text-zinc-500 mt-1">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Capabilities */}
      <div className="mb-10">
        <h2 className="text-sm font-medium text-zinc-500 uppercase tracking-wider mb-3">
          Your Capabilities
        </h2>
        <div className="flex flex-wrap gap-2">
          {capabilities.map((c) => (
            <Badge
              key={c}
              variant="secondary"
              className="bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700 transition-colors"
            >
              {c}
            </Badge>
          ))}
          <button className="inline-flex items-center rounded-md border border-dashed border-zinc-700 px-2.5 py-0.5 text-xs text-zinc-500 hover:border-orange-500/50 hover:text-orange-400 transition-colors">
            + Add
          </button>
        </div>
      </div>

      {/* Pending Orders */}
      <div className="mb-10">
        <h2 className="text-sm font-medium text-zinc-500 uppercase tracking-wider mb-4">
          Pending Orders
        </h2>
        {pendingOrders.length === 0 ? (
          <Card className="bg-zinc-900/40 border-zinc-800 border-dashed">
            <CardContent className="py-12 text-center text-zinc-500">
              No pending orders. New orders will appear here.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {pendingOrders.map((o) => (
              <Card
                key={o.id}
                className="bg-zinc-900/60 border-zinc-800 hover:border-orange-500/30 transition-colors group"
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-500 font-mono">{o.id}</span>
                    <span className="text-orange-400 font-semibold">¥{o.price}</span>
                  </div>
                  <CardTitle className="text-base">{o.part}</CardTitle>
                </CardHeader>
                <CardContent className="pb-4">
                  <div className="flex items-center gap-4 text-sm text-zinc-400 mb-4">
                    <span>{o.material}</span>
                    <span>~{o.estTime}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
                    >
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 border-zinc-700 text-zinc-400 hover:text-white"
                    >
                      Decline
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* History */}
      <div>
        <h2 className="text-sm font-medium text-zinc-500 uppercase tracking-wider mb-4">
          Order History
        </h2>
        <Card className="bg-zinc-900/60 border-zinc-800 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-800 hover:bg-transparent">
                <TableHead className="text-zinc-500">Order</TableHead>
                <TableHead className="text-zinc-500">Part</TableHead>
                <TableHead className="text-zinc-500">Material</TableHead>
                <TableHead className="text-zinc-500">Date</TableHead>
                <TableHead className="text-zinc-500">Status</TableHead>
                <TableHead className="text-zinc-500 text-right">Earnings</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {historyOrders.map((o) => (
                <TableRow key={o.id} className="border-zinc-800 hover:bg-zinc-800/50">
                  <TableCell className="font-mono text-xs">{o.id}</TableCell>
                  <TableCell>{o.part}</TableCell>
                  <TableCell className="text-zinc-400">{o.material}</TableCell>
                  <TableCell className="text-zinc-400">{o.date}</TableCell>
                  <TableCell>
                    <Badge
                      variant={o.status === "completed" ? "default" : "destructive"}
                      className={
                        o.status === "completed"
                          ? "bg-green-500/10 text-green-400 border-green-500/20"
                          : "bg-red-500/10 text-red-400 border-red-500/20"
                      }
                    >
                      {o.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {o.earnings > 0 ? `¥${o.earnings}` : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
}

export default function MakerCenterPage() {
  const [isRegistered, setIsRegistered] = useState(false);

  if (!isRegistered) {
    return <BecomeAMaker onRegister={() => setIsRegistered(true)} />;
  }

  return <MakerDashboard />;
}
