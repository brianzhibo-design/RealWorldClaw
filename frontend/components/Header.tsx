/** Header — 顶部导航栏 + 中英切换 */
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale, t } from "@/lib/i18n";
import { texts } from "@/lib/i18n-texts";

const navItems = [
  { href: "/", label: texts.nav.home },
  { href: "/modules", label: texts.nav.modules },
  { href: "/designs", label: texts.nav.designs },
  { href: "/grow", label: texts.nav.grow },
  { href: "/makers", label: texts.nav.makers },
  { href: "/orders", label: texts.nav.orders },
];

export default function Header() {
  const pathname = usePathname();
  const { locale, toggle } = useLocale();

  return (
    <header className="sticky top-0 z-50 border-b border-cyber-border bg-cyber-dark/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold text-neon-blue">
          <span>⚡</span>
          <span className="font-mono">RealWorldClaw</span>
        </Link>

        <nav className="flex items-center gap-5">
          {navItems.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`text-sm font-medium transition-colors hover:text-neon-blue ${
                pathname === href ? "text-neon-blue" : "text-slate-400"
              }`}
            >
              {t(label, locale)}
            </Link>
          ))}
          <button
            onClick={toggle}
            className="ml-2 rounded-md border border-neon-purple/40 px-2.5 py-1 text-xs font-mono text-neon-purple transition-all hover:bg-neon-purple/10 hover:border-neon-purple"
          >
            {locale === "zh" ? "EN" : "中文"}
          </button>
          <a
            href="https://github.com/realworldclaw"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-slate-400 transition-colors hover:text-neon-blue"
          >
            GitHub ↗
          </a>
        </nav>
      </div>
    </header>
  );
}
