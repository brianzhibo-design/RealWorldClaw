/** Header — RealWorldClaw navigation */
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Globe, Package, Settings, PlusCircle, LogOut, MessageSquare, LayoutDashboard } from "lucide-react";
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
  { href: "/map", label: "Map", icon: Globe },
  { href: "/orders", label: "Orders", icon: Package },
];

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

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-12 md:h-14 max-w-6xl items-center justify-between px-3 md:px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-1.5 shrink-0">
          <svg viewBox="0 0 130 130" className="w-5 h-5 md:w-6 md:h-6">
            <defs>
              <linearGradient id="hdrGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#38bdf8"/>
                <stop offset="100%" stopColor="#818cf8"/>
              </linearGradient>
            </defs>
            <path d="M 22 100 V 30 H 44 A 17.5 17.5 0 0 1 44 65 H 22 M 38 65 L 56 100" fill="none" stroke="url(#hdrGrad)" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M 64 30 L 74 100 L 89 58 L 104 100 L 114 30" fill="none" stroke="url(#hdrGrad)" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="22" cy="30" r="3.5" fill="#fff"/><circle cx="89" cy="58" r="3.5" fill="#fff"/>
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
              
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-1.5 rounded-lg px-2 md:px-3 py-1.5 text-xs md:text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors">
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
