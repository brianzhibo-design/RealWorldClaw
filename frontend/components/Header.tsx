/** Header — RealWorldClaw navigation */
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef, useCallback } from "react";
import { Globe, Package, Settings, PlusCircle, LogOut, MessageSquare, LayoutDashboard, Bot, ChevronDown, Compass, Bell } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

const navItems = [
  { href: "/", label: "Home", icon: Globe },
  { href: "/community", label: "Community", icon: MessageSquare },
  { href: "/spaces", label: "Spaces", icon: LayoutDashboard },
  { href: "/map", label: "Map", icon: Globe },
];

const exploreItems = [
  { href: "/orders", label: "Orders", icon: Package },
  { href: "/agents", label: "Agents", icon: Bot },
  { href: "/search", label: "Search", icon: Compass },
];

interface Notification {
  id: string;
  message: string;
  created_at: string;
  read: boolean;
}

function NotificationBell({ userId, token }: { userId: string; token: string }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    if (!userId || !token) return;

    const wsUrl = `wss://realworldclaw-api.fly.dev/api/v1/ws/notifications/${userId}?token=${token}`;
    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const notif: Notification = {
            id: data.id || crypto.randomUUID(),
            message: data.message || data.text || JSON.stringify(data),
            created_at: data.created_at || new Date().toISOString(),
            read: false,
          };
          setNotifications((prev) => [notif, ...prev].slice(0, 50));
        } catch {
          // ignore malformed messages
        }
      };

      ws.onerror = () => {
        // graceful degradation — bell still shows
      };

      ws.onclose = () => {
        wsRef.current = null;
      };

      return () => {
        ws.close();
      };
    } catch {
      // WebSocket not available — graceful degradation
    }
  }, [userId, token]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => { setOpen(!open); if (!open) markAllRead(); }}
        className="relative p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        aria-label="Notifications"
      >
        <Bell size={16} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden">
          <div className="px-4 py-2.5 border-b border-slate-700 flex items-center justify-between">
            <span className="text-sm font-semibold text-white">Notifications</span>
            {notifications.length > 0 && (
              <button onClick={markAllRead} className="text-xs text-sky-400 hover:text-sky-300">
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-64 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-6 text-center text-slate-500 text-sm">
                No notifications yet
              </div>
            ) : (
              notifications.map((n) => (
                <div key={n.id} className={`px-4 py-2.5 border-b border-slate-800 text-sm ${n.read ? "text-slate-400" : "text-slate-200 bg-slate-800/50"}`}>
                  <p className="line-clamp-2">{n.message}</p>
                  <p className="text-xs text-slate-500 mt-1">{new Date(n.created_at).toLocaleString()}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  // Map page has its own immersive header
  if (pathname === '/map') return null;

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-12 md:h-14 max-w-6xl items-center justify-between px-3 md:px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-1.5 shrink-0">
          <svg viewBox="0 0 130 130" className="w-5 h-5 md:w-6 md:h-6">
            <path d="M 25 105 V 35 H 55 A 15 15 0 0 1 55 65 H 25 M 40 65 L 60 105" fill="none" stroke="#38bdf8" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M 70 35 L 80 105 L 95 65 L 110 105 L 120 35" fill="none" stroke="#38bdf8" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="25" cy="35" r="4" fill="#fff"/><circle cx="95" cy="65" r="4" fill="#fff"/>
          </svg>
          <span className="font-bold text-xs md:text-sm text-white hidden sm:inline">
            RealWorld<span className="text-sky-400">Claw</span>
          </span>
        </Link>

        {/* Navigation — always visible */}
        <nav className="flex items-center gap-0.5 md:gap-1 overflow-x-auto">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href}
              className={`flex items-center gap-1 md:gap-1.5 rounded-lg px-2 md:px-3 py-1.5 text-xs md:text-sm font-medium transition-colors whitespace-nowrap ${
                isActive(href)
                  ? "bg-sky-500/10 text-sky-400"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}>
              <Icon size={14} className="shrink-0" />
              {label}
            </Link>
          ))}
          {/* Explore dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger
              className={`flex items-center gap-1 md:gap-1.5 rounded-lg px-2 md:px-3 py-1.5 text-xs md:text-sm font-medium transition-colors whitespace-nowrap ${
                ["/orders", "/agents", "/search"].some(p => pathname.startsWith(p))
                  ? "bg-sky-500/10 text-sky-400"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              <Compass size={14} className="shrink-0" />
              Explore
              <ChevronDown size={12} />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-40">
              {exploreItems.map(({ href, label, icon: Icon }) => (
                <DropdownMenuItem key={href} asChild>
                  <Link href={href} className="flex items-center gap-2">
                    <Icon size={14} />
                    {label}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>

        {/* User Menu */}
        <div className="flex items-center gap-1 md:gap-2 shrink-0">
          {isAuthenticated && user ? (
            <>
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="text-slate-400 hover:text-white hover:bg-slate-800 hidden sm:inline-flex"
              >
                <Link href="/community/new">
                  <PlusCircle size={15} className="mr-1.5" />
                  New Post
                </Link>
              </Button>
              
              <NotificationBell userId={user.id} token={useAuthStore.getState().token || ""} />

              <DropdownMenu>
                <DropdownMenuTrigger 
                  className="flex items-center gap-1.5 rounded-lg px-2 md:px-3 py-1.5 text-xs md:text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                  aria-label="User menu"
                >
                  <div className="w-5 h-5 md:w-6 md:h-6 bg-gradient-to-br from-sky-400 to-blue-600 rounded-full flex items-center justify-center text-white text-[10px] md:text-xs font-semibold shrink-0">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden sm:inline">{user.username}</span>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard" className="flex items-center gap-2">
                      <LayoutDashboard size={16} />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="flex items-center gap-2">
                      <Settings size={16} />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-400 focus:text-red-300">
                    <LogOut size={16} className="mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex items-center gap-1 md:gap-2">
              <Button asChild variant="ghost" size="sm" className="text-xs md:text-sm px-2 md:px-3 text-slate-400 hover:text-white">
                <Link href="/auth/login">Sign In</Link>
              </Button>
              <Button asChild size="sm" className="text-xs md:text-sm px-2 md:px-3">
                <Link href="/auth/register">Register</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
