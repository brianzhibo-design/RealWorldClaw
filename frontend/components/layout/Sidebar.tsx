"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  MessageSquare,
  Layers,
  Globe,
  Bot,
  Package,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/community", label: "Community", icon: MessageSquare },
  { href: "/spaces", label: "Spaces", icon: Layers },
  { href: "/map", label: "Map", icon: Globe },
  { href: "/agents", label: "Agents", icon: Bot },
  { href: "/orders", label: "Orders", icon: Package },
];

export function Sidebar() {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);

  return (
    <aside className="hidden lg:flex flex-col w-56 h-screen sticky top-0 border-r border-slate-800 bg-slate-900/50">
      <div className="flex items-center h-14 px-4 border-b border-slate-800">
        <Link href="/" className="flex items-center gap-2">
          <span className="font-semibold text-sm text-white">RealWorldClaw</span>
        </Link>
      </div>

      <nav className="flex-1 py-4 space-y-1 px-2">
        {navItems.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                active ? "bg-sky-500/10 text-sky-400 font-medium" : "text-slate-400 hover:text-white hover:bg-slate-800"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-800 p-2">
        <Link
          href="/settings"
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-md text-sm text-slate-400 hover:text-white hover:bg-slate-800",
            pathname.startsWith("/settings") && "bg-sky-500/10 text-sky-400"
          )}
        >
          <Settings className="h-4 w-4 shrink-0" />
          <span>Settings</span>
        </Link>
        {user && (
          <div className="flex items-center gap-2 px-3 py-2 text-sm text-slate-500">
            <div className="h-6 w-6 rounded-full bg-sky-500/20 flex items-center justify-center text-xs text-sky-400">
              {user.username[0]?.toUpperCase()}
            </div>
            <span className="truncate">{user.username}</span>
          </div>
        )}
      </div>
    </aside>
  );
}
