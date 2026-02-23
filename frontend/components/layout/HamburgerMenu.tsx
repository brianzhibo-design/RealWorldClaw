"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X, Menu, Map, MessageSquare, LayoutDashboard, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/stores/authStore";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/map", label: "Map", icon: Map },
  { href: "/community", label: "Community", icon: MessageSquare },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/auth/login", label: "Login", icon: User },
];

export function HamburgerMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuthStore();

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  // Replace Login with Profile if authenticated
  const menuItems = navItems.map(item => 
    item.href === "/auth/login" && isAuthenticated 
      ? { href: "/settings", label: "Profile", icon: User }
      : item
  );

  return (
    <>
      {/* Hamburger Button */}
      <button
        onClick={toggleMenu}
        className="md:hidden p-2 text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Toggle navigation menu"
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <Menu className="h-6 w-6" />
        )}
      </button>

      {/* Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
            onClick={closeMenu}
          />
        )}
      </AnimatePresence>

      {/* Menu Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed top-0 right-0 h-full w-80 max-w-[calc(100vw-2rem)] bg-card border-l border-border shadow-2xl z-50 md:hidden"
          >
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-border">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🔧</span>
                  <span className="font-semibold text-sm">RealWorldClaw</span>
                </div>
                <button
                  onClick={closeMenu}
                  className="p-2 text-muted-foreground hover:text-foreground rounded-md hover:bg-accent transition-colors"
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* User Info */}
              {isAuthenticated && user && (
                <div className="p-6 border-b border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-medium">
                      {user.username[0]?.toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium text-sm">{user.username}</div>
                      <div className="text-xs text-muted-foreground">{user.email}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation */}
              <nav className="flex-1 p-6">
                <div className="space-y-2">
                  {menuItems.map((item) => {
                    const active = pathname.startsWith(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={closeMenu}
                        className={cn(
                          "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                          active
                            ? "bg-primary/10 text-primary font-medium"
                            : "text-muted-foreground hover:text-foreground hover:bg-accent"
                        )}
                      >
                        <item.icon className="h-5 w-5" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>

                {/* Additional Actions */}
                <div className="mt-8 pt-6 border-t border-border space-y-2">
                  <Link
                    href="/submit"
                    onClick={closeMenu}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                  >
                    <span className="text-lg">🚀</span>
                    <span>Submit Design</span>
                  </Link>
                  <Link
                    href="/orders"
                    onClick={closeMenu}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                  >
                    <span className="text-lg">📦</span>
                    <span>My Orders</span>
                  </Link>
                </div>
              </nav>

              {/* Footer */}
              <div className="p-6 border-t border-border">
                {!isAuthenticated ? (
                  <div className="space-y-2">
                    <Link
                      href="/auth/login"
                      onClick={closeMenu}
                      className="block w-full px-4 py-2 text-center bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium transition-colors"
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/auth/register"
                      onClick={closeMenu}
                      className="block w-full px-4 py-2 text-center border border-border hover:bg-accent text-foreground rounded-lg font-medium transition-colors"
                    >
                      Sign Up
                    </Link>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      useAuthStore.getState().logout();
                      closeMenu();
                    }}
                    className="w-full px-4 py-2 text-center border border-border hover:bg-accent text-foreground rounded-lg font-medium transition-colors"
                  >
                    Sign Out
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}