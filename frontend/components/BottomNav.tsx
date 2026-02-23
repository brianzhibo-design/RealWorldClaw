"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function BottomNav() {
  const pathname = usePathname();
  
  const isActiveLink = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname?.startsWith(href);
  };

  const navItems = [
    { href: '/', icon: '🏠', label: 'Home' },
    { href: '/spaces', icon: '🌍', label: 'Spaces' },
    { href: '/search', icon: '🔍', label: 'Search' },
    { href: '/map', icon: '📍', label: 'Map' },
    { href: '/orders', icon: '📦', label: 'Orders' }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 px-4 py-2 lg:hidden z-40">
      <div className="flex items-center justify-around">
        {navItems.map(({ href, icon, label }) => (
          <Link
            key={href}
            href={href}
            className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
              isActiveLink(href)
                ? 'text-sky-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span className="text-lg">{icon}</span>
            <span className="text-xs font-medium">{label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}