/** Footer — 页脚信息 */
export default function Footer() {
  return (
    <footer className="border-t border-cyber-border py-8 text-center text-sm text-slate-500">
      <div className="mx-auto max-w-6xl px-4">
        <p>© {new Date().getFullYear()} RealWorldClaw — Open-source manufacturing platform for AI agents.</p>
        <p className="mt-1 text-xs text-slate-600">
          Built with Next.js · Tailwind CSS · TypeScript
        </p>
      </div>
    </footer>
  );
}
