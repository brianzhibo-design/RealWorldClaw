/** Header — RealWorldClaw navigation */
"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Globe, Package, Settings, PlusCircle, User, LogOut, MessageSquare, LayoutDashboard, Menu, X } from "lucide-react";
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <svg viewBox="0 0 130 130" className="w-6 h-6">
            <path d="M 25 105 V 35 H 55 A 15 15 0 0 1 55 65 H 25 M 40 65 L 60 105" fill="none" stroke="#38bdf8" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M 70 35 L 80 105 L 95 65 L 110 105 L 120 35" fill="none" stroke="#38bdf8" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="25" cy="35" r="4" fill="#fff"/><circle cx="95" cy="65" r="4" fill="#fff"/>
          </svg>
          <span className="font-bold text-sm text-white">
            RealWorld<span className="text-sky-400">Claw</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                isActive(href)
                  ? "bg-sky-500/10 text-sky-400"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}>
              <Icon size={15} />
              {label}
            </Link>
          ))}
        </nav>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 text-slate-400 hover:text-white min-h-[44px] min-w-[44px] flex items-center justify-center"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        {/* User Menu */}
        <div className="hidden md:flex items-center gap-2">
          {isAuthenticated && user ? (
            <>
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <Link href="/community/new">
                  <PlusCircle size={15} className="mr-1.5" />
                  New Post
                </Link>
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors">
                  <div className="w-6 h-6 bg-gradient-to-br from-sky-400 to-blue-600 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                  <span>{user.username}</span>
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
            <div className="flex items-center gap-2">
              <Button asChild variant="ghost" size="sm">
                <Link href="/auth/login">Sign In</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/auth/register">Register</Link>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile menu panel */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800 bg-slate-950/95 backdrop-blur-md">
          <nav className="flex flex-col p-4 gap-1">
            {navItems.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-4 py-3 text-base font-medium transition-colors min-h-[44px] ${
                  isActive(href)
                    ? "bg-sky-500/10 text-sky-400"
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                }`}>
                <Icon size={18} />
                {label}
              </Link>
            ))}
            <hr className="border-slate-800 my-2" />
            {isAuthenticated && user ? (
              <>
                <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-4 py-3 text-base text-slate-400 hover:text-white hover:bg-slate-800 min-h-[44px]">
                  <LayoutDashboard size={18} /> Dashboard
                </Link>
                <Link href="/settings" onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-4 py-3 text-base text-slate-400 hover:text-white hover:bg-slate-800 min-h-[44px]">
                  <Settings size={18} /> Settings
                </Link>
                <button onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                  className="flex items-center gap-3 rounded-lg px-4 py-3 text-base text-red-400 hover:bg-slate-800 min-h-[44px] w-full text-left">
                  <LogOut size={18} /> Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/auth/login" onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center rounded-lg px-4 py-3 text-base font-medium text-slate-300 border border-slate-700 hover:bg-slate-800 min-h-[44px]">
                  Sign In
                </Link>
                <Link href="/auth/register" onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center rounded-lg px-4 py-3 text-base font-medium text-white bg-sky-600 hover:bg-sky-500 min-h-[44px]">
                  Register
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
