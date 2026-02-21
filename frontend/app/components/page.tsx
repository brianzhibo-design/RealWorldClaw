import ComponentCard from "@/components/ComponentCard";
import { fetchComponents } from "@/lib/api";
import { EmptyState } from "@/components/EmptyState";

export default async function ComponentsPage() {
  const components = await fetchComponents();

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="mb-2 text-3xl font-bold">Components</h1>
      <p className="mb-8 text-slate-400">
        浏览社区贡献的娃娃机组件，找到你需要的部件。
      </p>

      {components.length === 0 ? (
        <EmptyState icon="🧩" title="No components yet" description="Components will appear here when available from the API." />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {components.map((c) => (
            <ComponentCard key={c.id} component={c} />
          ))}
        </div>
      )}
    </div>
  );
}
