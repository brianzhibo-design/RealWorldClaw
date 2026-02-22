/** Header — RealWorldClaw navigation */
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Globe, Package, Settings, PlusCircle } from "lucide-react";

const navItems = [
  { href: "/", label: "Map", icon: Globe },
  { href: "/orders", label: "Orders", icon: Package },
  { href: "/orders/new", label: "New Order", icon: PlusCircle },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function Header() {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  // Hide header on map page (it has its own header)
  if (pathname === "/") return null;

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
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

        <nav className="flex items-center gap-1">
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
      </div>
    </header>
  );
}
