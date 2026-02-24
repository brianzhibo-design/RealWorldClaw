"use client";
import { useEffect } from "react";

export default function DocsPage() {
  useEffect(() => {
    window.location.href = "https://dist-beige-two-95.vercel.app";
  }, []);
  
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="text-slate-400">Redirecting to documentation...</div>
    </div>
  );
}
