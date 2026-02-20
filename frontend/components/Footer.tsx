/** Footer */
"use client";
import { useLocale } from "@/lib/i18n";

export default function Footer() {
  const { locale } = useLocale();
  return (
    <footer className="border-t border-cyber-border py-8 text-center text-sm text-slate-500">
      <div className="mx-auto max-w-6xl px-4">
        <p>
          © {new Date().getFullYear()} RealWorldClaw —{" "}
          {locale === "zh"
            ? "让AI从网络走向物理世界"
            : "Bringing AI from the digital world to the physical world"}
        </p>
        <p className="mt-1 text-xs text-slate-600">
          Open Source · CC BY-SA 4.0 · Built with Next.js + Tailwind CSS
        </p>
      </div>
    </footer>
  );
}
