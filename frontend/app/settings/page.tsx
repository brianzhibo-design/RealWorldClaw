"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

export default function SettingsPage() {
  const [theme, setTheme] = useState<"dark" | "light" | "system">("dark");

  const [notifications, setNotifications] = useState({
    orderUpdates: true,
    printComplete: true,
    communityMessages: false,
  });

  const mockKeys = [
    { id: "k1", name: "Production Key", key: "rwc_sk_****...3f8a", created: "2026-01-15" },
    { id: "k2", name: "Test Key", key: "rwc_sk_****...9b2c", created: "2026-02-01" },
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-bold mb-10">
        <span className="bg-gradient-to-r from-orange-500 to-amber-400 bg-clip-text text-transparent">
          Settings
        </span>
      </h1>

      <div className="space-y-6">
        {/* Profile */}
        <Card className="bg-zinc-900/60 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-lg">Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-zinc-800 flex items-center justify-center text-2xl shrink-0">
                🧑‍💻
              </div>
              <Button variant="outline" size="sm" className="border-zinc-700 text-zinc-400 hover:text-white">
                Change Avatar
              </Button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs text-zinc-500 mb-1 block">Username</label>
                <Input
                  defaultValue="maker_brian"
                  className="bg-zinc-800/50 border-zinc-700 focus:border-orange-500"
                />
              </div>
              <div>
                <label className="text-xs text-zinc-500 mb-1 block">Email</label>
                <Input
                  defaultValue="brian@example.com"
                  className="bg-zinc-800/50 border-zinc-700 focus:border-orange-500"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-zinc-500 mb-1 block">Bio</label>
              <textarea
                defaultValue="3D printing enthusiast & hardware hacker"
                rows={3}
                className="w-full rounded-md bg-zinc-800/50 border border-zinc-700 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 resize-none"
              />
            </div>
            <div className="flex justify-end">
              <Button className="bg-orange-500 hover:bg-orange-600 text-white">Save Profile</Button>
            </div>
          </CardContent>
        </Card>

        {/* API Keys */}
        <Card className="bg-zinc-900/60 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">API Keys</CardTitle>
            <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white">
              Generate New Key
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockKeys.map((k) => (
                <div
                  key={k.id}
                  className="flex items-center justify-between rounded-lg bg-zinc-800/50 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium">{k.name}</p>
                    <p className="text-xs text-zinc-500 font-mono">{k.key}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-zinc-600">{k.created}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                    >
                      Revoke
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="bg-zinc-900/60 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-lg">Notifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {([
              { key: "orderUpdates" as const, label: "Order Updates", desc: "Get notified when order status changes" },
              { key: "printComplete" as const, label: "Print Complete", desc: "Alert when a print job finishes" },
              { key: "communityMessages" as const, label: "Community Messages", desc: "Messages from other makers and designers" },
            ]).map((n) => (
              <div key={n.key} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{n.label}</p>
                  <p className="text-xs text-zinc-500">{n.desc}</p>
                </div>
                <Switch
                  checked={notifications[n.key]}
                  onCheckedChange={(v) =>
                    setNotifications((prev) => ({ ...prev, [n.key]: v }))
                  }
                />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card className="bg-zinc-900/60 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-lg">Appearance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              {(["dark", "light", "system"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  className={`rounded-xl border-2 p-4 text-center transition-all ${
                    theme === t
                      ? "border-orange-500 bg-orange-500/5"
                      : "border-zinc-800 hover:border-zinc-700"
                  }`}
                >
                  <div className="text-xl mb-1">
                    {t === "dark" ? "🌙" : t === "light" ? "☀️" : "💻"}
                  </div>
                  <p className="text-sm capitalize">{t}</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
