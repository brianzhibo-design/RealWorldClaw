"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  MessageSquare,
  Globe,
  Layers,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";

export function MobileNav() {
  const pathname = usePathname();
  const { isAuthenticated } = useAuthStore();

  const items = [
    { href: "/", label: "Home", icon: Home },
    { href: "/community", label: "Community", icon: MessageSquare },
    { href: "/spaces", label: "Spaces", icon: Layers },
    { href: "/map", label: "Map", icon: Globe },
    { href: isAuthenticated ? "/dashboard" : "/auth/login", label: isAuthenticated ? "Me" : "Sign In", icon: User },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 h-16 border-t border-slate-800 bg-slate-950/95 backdrop-blur-sm flex items-center justify-around px-2">
      {items.map((item) => {
        const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center gap-1 py-1 px-3 text-xs transition-colors",
              active ? "text-sky-400" : "text-slate-500"
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
