"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function MakerOrdersPage() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace("/orders");
    }, 3000);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-6">📦</div>
        <h1 className="text-2xl font-bold mb-3">Page Moved</h1>
        <p className="text-slate-300 text-lg mb-2">
          Maker orders have been merged into{" "}
          <Link href="/orders" className="text-sky-400 hover:text-sky-300 underline font-semibold">
            Orders
          </Link>
        </p>
        <p className="text-slate-500 text-sm">Redirecting automatically in 3 seconds…</p>
      </div>
    </div>
  );
}
