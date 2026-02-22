"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";

const materials = [
  { value: "PLA", label: "PLA - 最常用，环保" },
  { value: "PETG", label: "PETG - 强韧，透明度好" },
  { value: "ABS", label: "ABS - 耐高温，韧性强" },
  { value: "TPU", label: "TPU - 弹性材料" },
];

const colors = [
  "白色", "黑色", "红色", "蓝色", "绿色", "黄色", "橙色", "紫色", "灰色", "透明"
];

const fillRates = [
  { value: "10", label: "10% - 节省材料" },
  { value: "20", label: "20% - 标准强度" },
  { value: "30", label: "30% - 高强度" },
  { value: "50", label: "50% - 超高强度" },
  { value: "100", label: "100% - 实心" },
];

export default function NewOrderPage() {
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    material: "PLA",
    color: "白色",
    quantity: "1",
    fillRate: "20",
    notes: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleFileSelect = (file: File) => {
    if (file && (file.name.endsWith('.stl') || file.name.endsWith('.3mf'))) {
      setSelectedFile(file);
      if (!formData.title) {
        setFormData(prev => ({ ...prev, title: file.name.replace(/\.[^/.]+$/, "") }));
      }
    } else {
      alert("请上传 STL 或 3MF 文件");
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      alert("请先上传 STL 文件");
      return;
    }

    setIsSubmitting(true);

    try {
      // Mock API call - replace with actual API when ready
      const orderData = {
        ...formData,
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        createdAt: new Date().toISOString(),
      };

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      console.log("Submitting order:", orderData);
      
      // Redirect to orders list
      router.push("/orders");
    } catch (error) {
      console.error("Failed to submit order:", error);
      alert("提交失败，请重试");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-16">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">
          <span className="bg-gradient-to-r from-orange-500 to-amber-400 bg-clip-text text-transparent">
            提交制造订单
          </span>
        </h1>
        <p className="text-zinc-400 mt-2">上传你的 3D 设计文件，找到附近的制造者</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* File Upload */}
        <Card className="bg-zinc-900/60 border-zinc-800">
          <CardContent className="p-6">
            <h3 className="text-lg font-medium mb-4">📁 上传文件</h3>
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors cursor-pointer ${
                dragOver
                  ? "border-orange-500 bg-orange-500/5"
                  : selectedFile
                  ? "border-green-500 bg-green-500/5"
                  : "border-zinc-700 hover:border-zinc-600"
              }`}
              onClick={() => document.getElementById('file-input')?.click()}
            >
              <input
                id="file-input"
                type="file"
                accept=".stl,.3mf"
                onChange={handleFileInput}
                className="hidden"
              />
              
              {selectedFile ? (
                <>
                  <div className="text-3xl mb-2">✅</div>
                  <p className="text-green-400 font-medium">{selectedFile.name}</p>
                  <p className="text-xs text-zinc-500 mt-1">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </>
              ) : (
                <>
                  <div className="text-3xl mb-2">📁</div>
                  <p className="text-sm text-zinc-400">
                    拖拽 STL / 3MF 文件到此处
                  </p>
                  <p className="text-xs text-zinc-600 mt-1">或点击选择文件</p>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Order Details */}
        <Card className="bg-zinc-900/60 border-zinc-800">
          <CardContent className="p-6 space-y-4">
            <h3 className="text-lg font-medium">⚙️ 订单详情</h3>

            <div>
              <label className="block text-sm text-zinc-300 mb-2">标题</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="给你的订单起个名字"
                className="bg-zinc-800/50 border-zinc-700 focus:border-orange-500"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-zinc-300 mb-2">材料</label>
                <select
                  value={formData.material}
                  onChange={(e) => setFormData(prev => ({ ...prev, material: e.target.value }))}
                  className="w-full rounded-md bg-zinc-800/50 border border-zinc-700 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                >
                  {materials.map(material => (
                    <option key={material.value} value={material.value}>
                      {material.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-zinc-300 mb-2">颜色</label>
                <select
                  value={formData.color}
                  onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                  className="w-full rounded-md bg-zinc-800/50 border border-zinc-700 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                >
                  {colors.map(color => (
                    <option key={color} value={color}>{color}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-zinc-300 mb-2">数量</label>
                <Input
                  type="number"
                  min="1"
                  max="100"
                  value={formData.quantity}
                  onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                  className="bg-zinc-800/50 border-zinc-700 focus:border-orange-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-zinc-300 mb-2">填充率</label>
                <select
                  value={formData.fillRate}
                  onChange={(e) => setFormData(prev => ({ ...prev, fillRate: e.target.value }))}
                  className="w-full rounded-md bg-zinc-800/50 border border-zinc-700 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                >
                  {fillRates.map(rate => (
                    <option key={rate.value} value={rate.value}>
                      {rate.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm text-zinc-300 mb-2">备注 (可选)</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="特殊要求、尺寸说明等..."
                rows={3}
                className="w-full rounded-md bg-zinc-800/50 border border-zinc-700 px-3 py-2 text-sm placeholder:text-zinc-600 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 resize-none"
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            className="border-zinc-700 hover:bg-zinc-800"
          >
            取消
          </Button>
          <Button
            type="submit"
            disabled={!selectedFile || isSubmitting}
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            {isSubmitting ? "提交中..." : "提交订单"}
          </Button>
        </div>
      </form>
    </div>
  );
}