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
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-md shadow-sm">
      <div className="mx-auto flex h-14 md:h-16 max-w-6xl items-center justify-between px-4 md:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 bg-gradient-to-br from-sky-400 to-blue-600 rounded-lg flex items-center justify-center">
            <svg viewBox="0 0 130 130" className="w-4 h-4 text-white">
              <path d="M 25 105 V 35 H 55 A 15 15 0 0 1 55 65 H 25 M 40 65 L 60 105" fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M 70 35 L 80 105 L 95 65 L 110 105 L 120 35" fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="font-bold text-sm md:text-base text-slate-800 hidden sm:inline">
            RealWorld<span className="text-sky-400">Claw</span>
          </span>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-1 overflow-x-auto">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href}
              className={`flex items-center gap-1.5 rounded-xl px-3 md:px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
                isActive(href)
                  ? "bg-sky-500/10 text-sky-400"
                  : "text-slate-600 hover:text-slate-800 hover:bg-slate-100"
              }`}>
              <Icon size={16} className="shrink-0" />
              {label}
            </Link>
          ))}
        </nav>

        {/* User Menu */}
        <div className="flex items-center gap-2 shrink-0">
          {isAuthenticated && user ? (
            <>
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="text-slate-600 hover:text-slate-800 hover:bg-slate-100 hidden sm:inline-flex"
              >
                <Link href="/community/new">
                  <PlusCircle size={16} className="mr-1.5" />
                  New Post
                </Link>
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 transition-colors">
                  <div className="w-6 h-6 bg-gradient-to-br from-sky-400 to-blue-600 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0">
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
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-700">
                    <LogOut size={16} className="mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Button asChild variant="ghost" size="sm" className="text-sm px-3 py-2">
                <Link href="/auth/login">Sign In</Link>
              </Button>
              <Button asChild size="sm" className="text-sm px-4 py-2 bg-sky-600 hover:bg-sky-500">
                <Link href="/auth/register">Register</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
