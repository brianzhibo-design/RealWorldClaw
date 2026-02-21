"use client";

import { Bell, Search, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/stores/authStore";
import Link from "next/link";

export function TopBar() {
  const user = useAuthStore((s) => s.user);

  return (
    <header className="sticky top-0 z-40 h-14 border-b border-border bg-background/80 backdrop-blur-sm flex items-center justify-between px-4 md:px-6">
      {/* Search */}
      <div className="flex items-center gap-2 flex-1 max-w-md">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索... (⌘K)"
            className="pl-9 h-9 bg-secondary border-none"
          />
        </div>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-primary" />
        </Button>

        {user ? (
          <Link href="/settings">
            <Button variant="ghost" size="icon">
              <div className="h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center text-xs text-primary font-medium">
                {user.username[0]?.toUpperCase()}
              </div>
            </Button>
          </Link>
        ) : (
          <Link href="/auth/login">
            <Button variant="ghost" size="icon">
              <User className="h-4 w-4" />
            </Button>
          </Link>
        )}
      </div>
    </header>
  );
}
