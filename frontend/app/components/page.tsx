/** 组件浏览页 — 卡片网格展示所有组件 */
import ComponentCard from "@/components/ComponentCard";
import { mockComponents } from "@/lib/mock-data";
import { fetchComponents } from "@/lib/api";

export default async function ComponentsPage() {
  let components = mockComponents;
  try {
    components = await fetchComponents();
  } catch {
    // API 不可用，使用 mock 数据
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="mb-2 text-3xl font-bold">Components</h1>
      <p className="mb-8 text-slate-400">
        浏览社区贡献的娃娃机组件，找到你需要的部件。
      </p>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {components.map((c) => (
          <ComponentCard key={c.id} component={c} />
        ))}
      </div>
    </div>
  );
}
