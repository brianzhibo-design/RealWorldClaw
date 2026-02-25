"use client";

import { usePathname } from "next/navigation";
import { MobileNav } from "./MobileNav";

export function MobileNavWrapper() {
  const pathname = usePathname();
  if (pathname === '/map') return null;
  return <MobileNav />;
}
