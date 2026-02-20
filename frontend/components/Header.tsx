/** Header — 顶部导航栏，包含 logo、页面链接和 GitHub 外链 */
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/components", label: "Components" },
  { href: "/upload", label: "Upload" },
];

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-cyber-border bg-cyber-dark/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 text-xl font-bold text-cyber-cyan">
          <span>🏗️</span>
          <span>RealWorldClaw</span>
        </Link>

        {/* Nav */}
        <nav className="flex items-center gap-6">
          {navItems.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`text-sm transition-colors hover:text-cyber-cyan ${
                pathname === href ? "text-cyber-cyan" : "text-slate-400"
              }`}
            >
              {label}
            </Link>
          ))}
          <a
            href="https://github.com/realworldclaw"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-slate-400 transition-colors hover:text-cyber-cyan"
          >
            GitHub ↗
          </a>
        </nav>
      </div>
    </header>
  );
}
