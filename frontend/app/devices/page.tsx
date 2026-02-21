/** 设备管理 — My Devices */
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Printer, Plus, Wifi, WifiOff, Circle } from "lucide-react";

interface PrinterDevice {
  id: string;
  name: string;
  model: string;
  status: "online" | "offline" | "printing";
  lastPrint: string;
}

const mockPrinters: PrinterDevice[] = [
  {
    id: "p1",
    name: "Workshop P2S",
    model: "Bambu Lab P2S",
    status: "online",
    lastPrint: "2025-02-20T14:30:00Z",
  },
  {
    id: "p2",
    name: "Desk A1 Mini",
    model: "Bambu Lab A1 Mini",
    status: "printing",
    lastPrint: "2025-02-21T09:15:00Z",
  },
  {
    id: "p3",
    name: "Backup Ender",
    model: "Creality Ender-3 V3",
    status: "offline",
    lastPrint: "2025-02-10T22:00:00Z",
  },
];

const statusConfig = {
  online: {
    label: "Online",
    dotClass: "bg-emerald-500",
    badgeClass: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  },
  offline: {
    label: "Offline",
    dotClass: "bg-zinc-500",
    badgeClass: "bg-zinc-500/15 text-zinc-400 border-zinc-500/20",
  },
  printing: {
    label: "Printing",
    dotClass: "bg-blue-500 animate-pulse",
    badgeClass: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  },
};

function EmptyState() {
  return (
    <div className="text-center py-24">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
        <Printer className="h-7 w-7 text-muted-foreground" />
      </div>
      <p className="text-lg font-medium text-muted-foreground">No printers connected</p>
      <p className="mt-1 text-sm text-muted-foreground/70">
        Add your first printer to get started.
      </p>
      <Button className="mt-6" size="sm">
        <Plus className="mr-2 h-4 w-4" />
        Add Printer
      </Button>
    </div>
  );
}

export default function DevicesPage() {
  const [printers] = useState<PrinterDevice[]>(mockPrinters);
  const showEmpty = printers.length === 0;

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Devices</h1>
          <p className="mt-2 text-muted-foreground">
            Manage your connected 3D printers.
          </p>
        </div>
        {!showEmpty && (
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Add Printer
          </Button>
        )}
      </div>

      {showEmpty ? (
        <EmptyState />
      ) : (
        <div className="space-y-3">
          {printers.map((p) => {
            const sc = statusConfig[p.status];
            return (
              <div
                key={p.id}
                className="flex items-center justify-between rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/20"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-muted">
                    <Printer className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">{p.name}</p>
                    <p className="text-sm text-muted-foreground">{p.model}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <p className="text-xs text-muted-foreground hidden sm:block">
                    Last print:{" "}
                    {new Date(p.lastPrint).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  <Badge variant="outline" className={sc.badgeClass}>
                    <span className={`mr-1.5 inline-block h-2 w-2 rounded-full ${sc.dotClass}`} />
                    {sc.label}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
