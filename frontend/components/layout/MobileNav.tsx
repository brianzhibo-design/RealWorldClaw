"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Map,
  MessageSquare,
  LayoutDashboard,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/map", label: "Map", icon: Map },
  { href: "/community", label: "Community", icon: MessageSquare },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/auth/login", label: "Login", icon: User },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 h-16 border-t border-border bg-background/95 backdrop-blur-sm flex items-center justify-around px-2">
      {items.map((item) => {
        const active = pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center gap-1 py-1 px-2 text-xs transition-colors",
              active ? "text-primary" : "text-muted-foreground"
            )}
          >
            <item.icon className="h-5 w-5" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
