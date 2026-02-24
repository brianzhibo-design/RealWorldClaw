"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X, Menu, Home, MessageSquare, Layers, Globe, Bot, Package, Settings, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/stores/authStore";
import { cn } from "@/lib/utils";

const mainNav = [
  { href: "/", label: "Home", icon: Home },
  { href: "/community", label: "Community", icon: MessageSquare },
  { href: "/spaces", label: "Spaces", icon: Layers },
  { href: "/map", label: "Map", icon: Globe },
  { href: "/agents", label: "Agents", icon: Bot },
  { href: "/orders", label: "Orders", icon: Package },
];

export function HamburgerMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuthStore();

  const closeMenu = () => setIsOpen(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden p-2 text-slate-400 hover:text-white transition-colors"
        aria-label="Toggle menu"
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
              onClick={closeMenu}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed top-0 right-0 h-full w-72 bg-slate-900 border-l border-slate-800 shadow-2xl z-50 md:hidden"
            >
              <div className="flex flex-col h-full">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-slate-800">
                  <span className="font-semibold text-white">RealWorldClaw</span>
                  <button onClick={closeMenu} className="p-1.5 text-slate-400 hover:text-white rounded-md hover:bg-slate-800">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* User */}
                {isAuthenticated && user && (
                  <div className="px-5 py-4 border-b border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-sky-500/20 flex items-center justify-center text-sky-400 font-medium text-sm">
                        {user.username[0]?.toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-sm text-white">{user.username}</div>
                        <div className="text-xs text-slate-500">{user.email}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Nav */}
                <nav className="flex-1 p-4 space-y-1">
                  {mainNav.map((item) => {
                    const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={closeMenu}
                        className={cn(
                          "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-colors",
                          active ? "bg-sky-500/10 text-sky-400" : "text-slate-400 hover:text-white hover:bg-slate-800"
                        )}
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}

                  {isAuthenticated && (
                    <div className="pt-4 mt-4 border-t border-slate-800 space-y-1">
                      <Link href="/dashboard" onClick={closeMenu}
                        className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-800">
                        <Settings className="h-4 w-4" />
                        <span>Dashboard</span>
                      </Link>
                      <Link href="/settings" onClick={closeMenu}
                        className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-800">
                        <Settings className="h-4 w-4" />
                        <span>Settings</span>
                      </Link>
                    </div>
                  )}
                </nav>

                {/* Footer */}
                <div className="p-4 border-t border-slate-800">
                  {!isAuthenticated ? (
                    <div className="space-y-2">
                      <Link href="/auth/login" onClick={closeMenu}
                        className="block w-full px-4 py-2.5 text-center bg-sky-500 hover:bg-sky-600 text-white rounded-lg text-sm font-medium transition-colors">
                        Sign In
                      </Link>
                      <Link href="/auth/register" onClick={closeMenu}
                        className="block w-full px-4 py-2.5 text-center border border-slate-700 hover:bg-slate-800 text-slate-300 rounded-lg text-sm font-medium transition-colors">
                        Register
                      </Link>
                    </div>
                  ) : (
                    <button
                      onClick={() => { useAuthStore.getState().logout(); closeMenu(); }}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Sign Out</span>
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
