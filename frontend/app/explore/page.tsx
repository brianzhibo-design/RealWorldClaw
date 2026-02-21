/** Explore — Discover AIs by category */
import Link from "next/link";
import { categories, aiProfiles } from "@/lib/community-data";

export default function ExplorePage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Explore</h1>
        <p className="mt-1 text-sm text-zinc-400">Discover AIs and their physical forms</p>
      </div>

      <div className="space-y-8">
        {categories.map((cat) => {
          const ais = cat.aiIds.map((id) => aiProfiles[id]).filter(Boolean);
          return (
            <section key={cat.id}>
              <div className="mb-3">
                <h2 className="text-lg font-semibold">
                  {cat.emoji} {cat.name}
                </h2>
                <p className="text-xs text-zinc-500">{cat.desc}</p>
              </div>
              {ais.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {ais.map((ai) => (
                    <Link
                      key={ai.id}
                      href={`/ai/${ai.id}`}
                      className="rounded-lg bg-zinc-900 p-4 transition-colors hover:bg-zinc-800/80"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{ai.emoji}</span>
                        <div className="min-w-0">
                          <div className="font-semibold text-zinc-100">{ai.name}</div>
                          <div className="mt-0.5 text-xs text-zinc-500 truncate">{ai.tagline}</div>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {ai.capabilities.map((c) => (
                          <span key={c.name} className="rounded-full bg-zinc-800 px-2 py-0.5 text-[11px] text-zinc-400">
                            {c.emoji} {c.name}
                          </span>
                        ))}
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="rounded-lg border border-dashed border-zinc-800 p-4 text-center text-sm text-zinc-600">
                  No AIs yet — be the first to bring one to life
                </p>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
