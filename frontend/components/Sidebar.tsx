"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const SPACES = [
  { name: 'ai-bodies', emoji: '🤖', title: 'AI Bodies' },
  { name: '3d-printing', emoji: '🖨️', title: '3D Printing' },
  { name: 'maker-lab', emoji: '🔧', title: 'Maker Lab' },
  { name: 'requests', emoji: '💡', title: 'Requests' },
  { name: 'showcase', emoji: '🏆', title: 'Showcase' },
  { name: 'nodes', emoji: '🌍', title: 'Nodes' }
];

interface SidebarProps {
  isOpen?: boolean;
  onToggle?: () => void;
}

export default function Sidebar({ isOpen = true, onToggle }: SidebarProps) {
  const pathname = usePathname();
  
  const isActiveLink = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname?.startsWith(href);
  };

  const linkClass = (href: string) =>
    `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
      isActiveLink(href)
        ? 'bg-sky-500/20 text-sky-400 font-medium'
        : 'text-slate-300 hover:text-white hover:bg-slate-800'
    }`;

  if (!isOpen) return null;

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-slate-900 border-r border-slate-800 z-40 overflow-y-auto">
      <div className="p-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 mb-8">
          <svg viewBox="0 0 130 130" className="w-8 h-8">
            <path d="M 25 105 V 35 H 55 A 15 15 0 0 1 55 65 H 25 M 40 65 L 60 105" fill="none" stroke="#38bdf8" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M 70 35 L 80 105 L 95 65 L 110 105 L 120 35" fill="none" stroke="#38bdf8" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="25" cy="35" r="4" fill="#fff"/><circle cx="55" cy="50" r="4" fill="#fff"/><circle cx="95" cy="65" r="4" fill="#fff"/>
          </svg>
          <span className="text-xl font-bold">
            RealWorld<span className="text-sky-400">Claw</span>
          </span>
        </Link>

        {/* Main Navigation */}
        <nav className="space-y-1 mb-8">
          <Link href="/" className={linkClass('/')}>
            <span className="text-lg">🏠</span>
            <span>Home</span>
          </Link>
          <Link href="/popular" className={linkClass('/popular')}>
            <span className="text-lg">🔥</span>
            <span>Popular</span>
          </Link>
          <Link href="/map" className={linkClass('/map')}>
            <span className="text-lg">📍</span>
            <span>Map</span>
          </Link>
          <Link href="/orders" className={linkClass('/orders')}>
            <span className="text-lg">📦</span>
            <span>Orders</span>
          </Link>
        </nav>

        {/* Divider */}
        <hr className="border-slate-700 mb-6" />

        {/* User Spaces */}
        <div className="mb-8">
          <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-3">
            Your Spaces
          </h3>
          <div className="space-y-1">
            <div className="text-slate-500 text-sm px-3 py-2">
              No joined spaces yet
            </div>
          </div>
        </div>

        {/* Divider */}
        <hr className="border-slate-700 mb-6" />

        {/* All Spaces */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider">
              Spaces
            </h3>
            <Link 
              href="/spaces" 
              className="text-xs text-sky-400 hover:text-sky-300 transition-colors"
            >
              View All
            </Link>
          </div>
          <div className="space-y-1">
            {SPACES.map((space) => (
              <Link
                key={space.name}
                href={`/spaces/${space.name}`}
                className={linkClass(`/spaces/${space.name}`)}
              >
                <span className="text-lg">{space.emoji}</span>
                <span className="text-sm">{space.title}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="mt-8 pt-6 border-t border-slate-700">
          <Link
            href="/community/new"
            className="flex items-center gap-3 px-3 py-2 bg-sky-600 hover:bg-sky-500 rounded-lg transition-colors text-white font-medium text-sm"
          >
            <span>✏️</span>
            <span>Create Post</span>
          </Link>
        </div>
      </div>
    </aside>
  );
}