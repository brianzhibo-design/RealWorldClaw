/** Header — RealWorldClaw navigation with mobile bottom tabs */
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, Wrench, Settings, User } from "lucide-react";

const navItems = [
  { href: "/", label: "Feed", icon: Home },
  { href: "/explore", label: "Explore", icon: Compass },
  { href: "/maker", label: "Maker", icon: Wrench },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function Header() {
  const pathname = usePathname();

  function isActive(href: string) {
    return href === "/" ? pathname === "/" : pathname.startsWith(href);
  }

  return (
    <>
      {/* Desktop top nav */}
      <header className="sticky top-0 z-50 border-b border-[#1F2937] bg-[#0B0F1A]/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-lg">🦀</span>
            <span className="font-bold text-sm bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
              RealWorldClaw
            </span>
          </Link>

          {/* Desktop links */}
          <nav className="hidden sm:flex items-center gap-1">
            {navItems.map(({ href, label, icon: Icon }) => {
              const active = isActive(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                    active
                      ? "bg-indigo-500/10 text-indigo-400"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-[#1F2937]"
                  }`}
                >
                  <Icon size={15} />
                  {label}
                </Link>
              );
            })}
          </nav>

          {/* User avatar */}
          <div className="hidden sm:flex items-center">
            <div className="h-8 w-8 rounded-full bg-[#1F2937] flex items-center justify-center text-sm">
              <User size={14} className="text-zinc-400" />
            </div>
          </div>
        </div>
      </header>

      {/* Mobile bottom tab bar */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-[#1F2937] bg-[#0B0F1A]/95 backdrop-blur-md">
        <div className="flex items-center justify-around h-14">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex flex-col items-center gap-0.5 py-1 px-3 transition-colors ${
                  active ? "text-indigo-400" : "text-zinc-500"
                }`}
              >
                <Icon size={18} />
                <span className="text-[10px] font-medium">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
