export default function Loading() {
  return (
    <div className="min-h-[60vh] animate-pulse px-4 py-8 md:px-8">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <div className="h-8 w-48 rounded bg-slate-800" />
        <div className="grid gap-4 md:grid-cols-3">
          <div className="h-24 rounded-xl bg-slate-900" />
          <div className="h-24 rounded-xl bg-slate-900" />
          <div className="h-24 rounded-xl bg-slate-900" />
        </div>
        <div className="space-y-3">
          <div className="h-4 w-full rounded bg-slate-800" />
          <div className="h-4 w-5/6 rounded bg-slate-800" />
          <div className="h-4 w-2/3 rounded bg-slate-800" />
        </div>
      </div>
    </div>
  );
}
