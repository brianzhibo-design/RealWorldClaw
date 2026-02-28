"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createCommunityPost, apiFetch, API_BASE } from "@/lib/api-client";
import { useAuthStore } from "@/stores/authStore";

interface MyNode {
  id: string;
  name: string;
  node_type: string;
  status: string;
}

interface UploadedFile {
  file_id: string;
  filename: string;
  size?: number;
}

type TemplateKey = "free" | "request" | "engineering_log" | "showcase";

type TemplateField = {
  key: string;
  label: string;
  placeholder: string;
  required?: boolean;
  type?: "text" | "textarea" | "date";
};

const POST_TEMPLATES: Array<{
  key: TemplateKey;
  label: string;
  icon: string;
  description: string;
  postType: "discussion" | "request" | "showcase";
  color: string;
  fields: TemplateField[];
}> = [
  {
    key: "free",
    label: "Free Post",
    icon: "🪐",
    description: "完全自由创作，适合随笔、提问、灵感分享",
    postType: "discussion",
    color: "bg-slate-500/15 text-slate-200 border-slate-500/40",
    fields: [
      { key: "title", label: "标题", placeholder: "给你的帖子起个清晰有吸引力的标题", required: true },
      {
        key: "content",
        label: "内容",
        type: "textarea",
        required: true,
        placeholder: "自由描述你的想法、问题、经验。支持 Markdown。",
      },
    ],
  },
  {
    key: "request",
    label: "需求单 Request",
    icon: "📌",
    description: "发布清晰需求，快速让社区理解你的目标",
    postType: "request",
    color: "bg-emerald-500/15 text-emerald-200 border-emerald-500/40",
    fields: [
      { key: "title", label: "标题", placeholder: "例：需要一个可防水的 IoT 传感器外壳", required: true },
      {
        key: "description",
        label: "描述",
        type: "textarea",
        placeholder: "背景、目标、使用场景、尺寸/限制等",
        required: true,
      },
      { key: "materials", label: "材料要求", placeholder: "例：PETG / ABS，耐温 80°C" },
      { key: "budget", label: "预算范围", placeholder: "例：¥300 - ¥1000" },
      { key: "deadline", label: "截止日期", type: "date", placeholder: "" },
    ],
  },
  {
    key: "engineering_log",
    label: "工程复盘 Engineering Log",
    icon: "🛠️",
    description: "记录问题、方案和数据，让经验可复用",
    postType: "discussion",
    color: "bg-cyan-500/15 text-cyan-200 border-cyan-500/40",
    fields: [
      { key: "title", label: "标题", placeholder: "例：FDM 打印翘边问题排查复盘", required: true },
      {
        key: "problem",
        label: "问题描述",
        type: "textarea",
        placeholder: "问题是什么、出现条件、影响范围",
        required: true,
      },
      {
        key: "solution",
        label: "解决方案",
        type: "textarea",
        placeholder: "尝试了什么，最终怎么解决",
        required: true,
      },
      {
        key: "metrics",
        label: "关键数据",
        type: "textarea",
        placeholder: "例：翘边率 35% → 4%，打印时间 +8%",
      },
      {
        key: "lessons",
        label: "经验教训",
        type: "textarea",
        placeholder: "哪些方法有效，哪些坑要避免",
      },
    ],
  },
  {
    key: "showcase",
    label: "成果展示 Showcase",
    icon: "🏆",
    description: "展示项目成果与关键指标，吸引合作与反馈",
    postType: "showcase",
    color: "bg-fuchsia-500/15 text-fuchsia-200 border-fuchsia-500/40",
    fields: [
      { key: "title", label: "标题", placeholder: "例：可穿戴健康监测设备 v2 量产版", required: true },
      {
        key: "project",
        label: "项目描述",
        type: "textarea",
        placeholder: "项目做了什么、解决了什么问题",
        required: true,
      },
      {
        key: "kpis",
        label: "关键指标",
        type: "textarea",
        placeholder: "例：成本 -22%，组装效率 +40%，良率 98.7%",
      },
      {
        key: "assets",
        label: "图片/文件说明",
        type: "textarea",
        placeholder: "说明你上传了哪些图纸、照片、文件",
      },
      {
        key: "links",
        label: "相关链接",
        type: "textarea",
        placeholder: "例：https://demo.com\nhttps://github.com/org/repo",
      },
    ],
  },
];

const TAG_GROUPS = [
  { name: "工艺", tags: ["3D Printing", "CNC", "Laser Cut", "Injection Molding"] },
  { name: "材料", tags: ["PLA", "ABS", "PETG", "Resin", "Metal", "Wood"] },
  { name: "设备", tags: ["FDM", "SLA", "SLS"] },
  { name: "场景", tags: ["Robotics", "IoT", "Wearable", "Home", "Industrial"] },
];

const MAX_TAGS = 5;

export default function NewPostPage() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const token = useAuthStore((s) => s.token);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, router]);

  const [selectedTemplate, setSelectedTemplate] = useState<TemplateKey>("free");
  const [templateData, setTemplateData] = useState<Record<string, string>>({
    title: "",
    content: "",
    description: "",
    materials: "",
    budget: "",
    deadline: "",
    problem: "",
    solution: "",
    metrics: "",
    lessons: "",
    project: "",
    kpis: "",
    assets: "",
    links: "",
  });
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [myNodes, setMyNodes] = useState<MyNode[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string>("");
  const [nodesLoading, setNodesLoading] = useState(false);

  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    setNodesLoading(true);
    apiFetch<MyNode[] | { nodes: MyNode[] }>("/nodes/my-nodes")
      .then((data) => {
        const nodes = Array.isArray(data) ? data : data.nodes || [];
        setMyNodes(nodes);
      })
      .catch(() => setMyNodes([]))
      .finally(() => setNodesLoading(false));
  }, [isAuthenticated]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const formDataUpload = new FormData();
        formDataUpload.append("file", file);

        const authToken = token;
        const res = await fetch(`${API_BASE}/files/upload`, {
          method: "POST",
          credentials: "include",
          headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
          body: formDataUpload,
        });

        if (res.ok) {
          const result = await res.json();
          setUploadedFiles((prev) => [
            ...prev,
            {
              file_id: result.file_id || result.id,
              filename: file.name,
              size: file.size,
            },
          ]);
        } else {
          const err = await res.json().catch(() => ({}));
          setError(`Failed to upload ${file.name}: ${err.detail || "Unknown error"}`);
        }
      }
    } catch {
      setError("File upload failed. Please try again.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeFile = (fileId: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.file_id !== fileId));
  };

  const activeTemplate = POST_TEMPLATES.find((t) => t.key === selectedTemplate) || POST_TEMPLATES[0];

  const updateField = (key: string, value: string) => {
    setTemplateData((prev) => ({ ...prev, [key]: value }));
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => {
      if (prev.includes(tag)) return prev.filter((t) => t !== tag);
      if (prev.length >= MAX_TAGS) {
        setError(`最多选择 ${MAX_TAGS} 个标签`);
        return prev;
      }
      setError(null);
      return [...prev, tag];
    });
  };

  const buildContentByTemplate = () => {
    if (selectedTemplate === "free") {
      return templateData.content.trim();
    }

    if (selectedTemplate === "request") {
      return [
        "## Description",
        templateData.description.trim() || "(Please describe your request)",
        "",
        "## Material Requirements",
        templateData.materials.trim() || "(Add material requirements)",
        "",
        "## Budget Range",
        templateData.budget.trim() || "(Add budget range)",
        "",
        "## Deadline",
        templateData.deadline ? new Date(templateData.deadline).toLocaleDateString() : "(No deadline specified)",
      ].join("\n");
    }

    if (selectedTemplate === "engineering_log") {
      return [
        "## Problem",
        templateData.problem.trim() || "(Describe the problem)",
        "",
        "## Solution",
        templateData.solution.trim() || "(Describe your solution)",
        "",
        "## Key Metrics",
        templateData.metrics.trim() || "(Add measurable results)",
        "",
        "## Lessons Learned",
        templateData.lessons.trim() || "(What should others learn?)",
      ].join("\n");
    }

    return [
      "## Project Description",
      templateData.project.trim() || "(Describe your project)",
      "",
      "## Key Metrics",
      templateData.kpis.trim() || "(Add key outcomes)",
      "",
      "## Images / Files",
      templateData.assets.trim() || "(Describe attached assets)",
      "",
      "## Links",
      templateData.links.trim() || "(Add useful links)",
    ].join("\n");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!templateData.title.trim()) {
      setError("Title is required");
      return;
    }

    if (selectedTemplate === "free" && !templateData.content.trim()) {
      setError("Content is required");
      return;
    }

    const requiredField = activeTemplate.fields.find((field) => field.required && !templateData[field.key]?.trim());
    if (requiredField) {
      setError(`请填写：${requiredField.label}`);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const content = buildContentByTemplate();
      const postData: Record<string, unknown> = {
        title: templateData.title.trim(),
        content,
        post_type: activeTemplate.postType,
        tags: selectedTags,
      };

      if (selectedTemplate === "request") {
        const parsedBudget = Number(templateData.budget.replace(/[^\d.]/g, ""));
        if (!Number.isNaN(parsedBudget) && parsedBudget > 0) {
          postData.budget = parsedBudget;
        }
        if (templateData.materials.trim()) {
          postData.materials = templateData.materials
            .split(",")
            .map((m) => m.trim())
            .filter(Boolean);
        }
        if (templateData.deadline) {
          postData.deadline = templateData.deadline;
        }
      }

      if (selectedNodeId) postData.node_id = selectedNodeId;
      if (uploadedFiles.length > 0) postData.file_ids = uploadedFiles.map((f) => f.file_id);

      const result = await createCommunityPost(postData as Parameters<typeof createCommunityPost>[0]);
      if (result.success) {
        router.push(`/community/${result.post_id}`);
      } else {
        setError(result.error || "Failed to create post");
      }
    } catch {
      setError("Failed to create post. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Create New Post</h1>
          <p className="text-slate-400">先选模板再发帖，结构清晰更容易获得回应。</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div>
            <label className="block text-lg font-semibold mb-4">Post Template</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {POST_TEMPLATES.map((template) => (
                <button
                  key={template.key}
                  type="button"
                  onClick={() => setSelectedTemplate(template.key)}
                  className={`p-5 rounded-xl border text-left transition-all ${
                    selectedTemplate === template.key
                      ? `${template.color} shadow-[0_0_24px_rgba(56,189,248,0.12)] border-sky-500/40`
                      : "border-slate-700 bg-slate-900/60 hover:border-slate-600"
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xl">{template.icon}</span>
                    <span className="text-base font-semibold">{template.label}</span>
                  </div>
                  <p className="text-sm text-slate-300">{template.description}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 space-y-5">
            {activeTemplate.fields.map((field) => (
              <div key={field.key}>
                <label className="block text-sm font-medium mb-2">
                  {field.label} {field.required && <span className="text-red-400">*</span>}
                </label>
                {field.type === "textarea" ? (
                  <textarea
                    value={templateData[field.key] || ""}
                    onChange={(e) => updateField(field.key, e.target.value)}
                    rows={field.key === "content" ? 8 : 5}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-sky-500 transition-colors resize-vertical"
                    placeholder={field.placeholder}
                  />
                ) : (
                  <input
                    type={field.type === "date" ? "date" : "text"}
                    value={templateData[field.key] || ""}
                    onChange={(e) => updateField(field.key, e.target.value)}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-sky-500 transition-colors"
                    placeholder={field.placeholder}
                  />
                )}
              </div>
            ))}
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium">标签体系（最多 {MAX_TAGS} 个）</label>
              <span className="text-xs text-slate-400">{selectedTags.length}/{MAX_TAGS}</span>
            </div>
            <div className="space-y-4">
              {TAG_GROUPS.map((group) => (
                <div key={group.name} className="bg-slate-900/50 border border-slate-800 rounded-lg p-4">
                  <div className="text-xs uppercase tracking-wider text-slate-400 mb-3">{group.name}</div>
                  <div className="flex flex-wrap gap-2">
                    {group.tags.map((tag) => {
                      const active = selectedTags.includes(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => toggleTag(tag)}
                          className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                            active
                              ? "bg-sky-500/20 border-sky-400 text-sky-200"
                              : "bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-500"
                          }`}
                        >
                          {tag}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">🔗 Associated Device (optional)</label>
            <select
              value={selectedNodeId}
              onChange={(e) => setSelectedNodeId(e.target.value)}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-sky-500 transition-colors"
            >
              <option value="">None — no device linked</option>
              {nodesLoading && <option disabled>Loading nodes...</option>}
              {myNodes.map((node) => (
                <option key={node.id} value={node.id}>
                  {node.name} ({node.node_type}) — {node.status}
                </option>
              ))}
            </select>
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-3">📸 Attachments</h3>
            {uploadedFiles.length > 0 && (
              <div className="mb-4 space-y-2">
                {uploadedFiles.map((f) => (
                  <div key={f.file_id} className="flex items-center justify-between bg-slate-700/50 rounded-lg px-4 py-2">
                    <span className="text-sm text-slate-300 truncate">
                      📄 {f.filename}
                      {f.size && <span className="text-slate-500 ml-2">({(f.size / 1024).toFixed(1)} KB)</span>}
                    </span>
                    <button type="button" onClick={() => removeFile(f.file_id)} className="text-red-400 hover:text-red-300 text-sm ml-3">✕</button>
                  </div>
                ))}
              </div>
            )}

            <input ref={fileInputRef} type="file" multiple accept="image/*,.pdf,.stl,.3mf,.step" onChange={handleFileUpload} className="hidden" />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="border-2 border-dashed border-slate-600 hover:border-sky-500 rounded-lg p-6 text-center w-full transition-colors"
            >
              {uploading ? "Uploading..." : "Click to upload images, STL, 3MF, STEP, or PDF"}
            </button>
          </div>

          {error && (
            <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4">
              <p className="text-red-300">{error}</p>
            </div>
          )}

          <div className="flex justify-end gap-4">
            <Link href="/community" className="px-6 py-3 text-slate-400 hover:text-white transition-colors">Cancel</Link>
            <button
              type="submit"
              disabled={submitting}
              className={`px-8 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${
                submitting ? "bg-slate-700 text-slate-400 cursor-not-allowed" : "bg-sky-600 hover:bg-sky-500 text-white shadow-lg"
              }`}
            >
              {submitting ? "Publishing..." : "✨ Publish Post"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
