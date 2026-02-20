/** 上传页 — 组件上传表单骨架 */
"use client";

import { useState } from "react";

export default function UploadPage() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-3xl font-bold">Upload Component</h1>
      <p className="mt-2 text-slate-400">分享你的娃娃机组件设计，让社区一起使用和改进。</p>

      <form
        className="mt-8 space-y-6"
        onSubmit={(e) => {
          e.preventDefault();
          alert("Upload functionality coming soon!");
        }}
      >
        {/* 名称 */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-slate-300">
            Component Name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Clawbie V5 Mini"
            className="mt-2 w-full rounded-lg border border-cyber-border bg-cyber-card px-4 py-3 text-white placeholder-slate-500 outline-none transition-colors focus:border-cyber-cyan"
          />
        </div>

        {/* 描述 */}
        <div>
          <label htmlFor="desc" className="block text-sm font-medium text-slate-300">
            Description
          </label>
          <textarea
            id="desc"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe your component — what it does, materials needed, etc."
            className="mt-2 w-full rounded-lg border border-cyber-border bg-cyber-card px-4 py-3 text-white placeholder-slate-500 outline-none transition-colors focus:border-cyber-cyan"
          />
        </div>

        {/* 文件上传区域 */}
        <div>
          <label className="block text-sm font-medium text-slate-300">Files</label>
          <div className="mt-2 flex h-40 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-cyber-border transition-colors hover:border-cyber-cyan/40">
            <div className="text-center text-slate-500">
              <div className="text-3xl">📁</div>
              <p className="mt-2 text-sm">Drag & drop STL / STEP / 3MF files here</p>
              <p className="text-xs text-slate-600">or click to browse</p>
            </div>
          </div>
        </div>

        {/* 提交 */}
        <button
          type="submit"
          className="w-full rounded-lg bg-cyber-cyan py-3 font-semibold text-cyber-dark transition-all hover:shadow-glow-lg"
        >
          Submit Component
        </button>
      </form>
    </div>
  );
}
