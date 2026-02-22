"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { API_BASE } from "@/lib/api";

const deviceTypes = [
  { id: "3d_printer", name: "3D打印机", icon: "🖨️" },
  { id: "cnc", name: "CNC加工中心", icon: "⚒️" },
  { id: "laser_cutter", name: "激光切割机", icon: "⚡" },
];

const materials = [
  { id: "PLA", name: "PLA", color: "green" },
  { id: "PETG", name: "PETG", color: "blue" },
  { id: "ABS", name: "ABS", color: "orange" },
  { id: "TPU", name: "TPU", color: "purple" },
  { id: "WOOD", name: "木质材料", color: "amber" },
  { id: "METAL", name: "金属材料", color: "gray" },
  { id: "ACRYLIC", name: "亚克力", color: "cyan" },
  { id: "CARBON_FIBER", name: "碳纤维", color: "slate" },
];

const countries = [
  "中国", "美国", "日本", "德国", "英国", "法国", "加拿大", "澳大利亚", "其他"
];

export default function NodeRegisterPage() {
  const [formData, setFormData] = useState({
    // Device info
    deviceType: "",
    deviceBrand: "",
    deviceModel: "",
    
    // Capabilities
    buildVolumeX: "",
    buildVolumeY: "",
    buildVolumeZ: "",
    supportedMaterials: [] as string[],
    
    // Location
    city: "",
    country: "中国",
    
    // Description
    description: "",
    
    // Contact (optional)
    contactInfo: "",
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleMaterialToggle = (materialId: string) => {
    setFormData(prev => ({
      ...prev,
      supportedMaterials: prev.supportedMaterials.includes(materialId)
        ? prev.supportedMaterials.filter(m => m !== materialId)
        : [...prev.supportedMaterials, materialId]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.supportedMaterials.length === 0) {
      alert("请至少选择一种支持的材料");
      return;
    }

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('auth_token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const registrationData = {
        device_type: formData.deviceType,
        device_brand: formData.deviceBrand,
        device_model: formData.deviceModel,
        build_volume: {
          x: parseInt(formData.buildVolumeX),
          y: parseInt(formData.buildVolumeY),
          z: parseInt(formData.buildVolumeZ),
        },
        supported_materials: formData.supportedMaterials,
        location: {
          city: formData.city,
          country: formData.country,
        },
        description: formData.description,
        contact_info: formData.contactInfo,
      };

      const response = await fetch(`${API_BASE}/nodes/register`, {
        method: 'POST',
        headers,
        body: JSON.stringify(registrationData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Registration failed');
      }

      const result = await response.json();
      alert(`节点注册成功！节点ID: ${result.node_id || result.id}`);
      router.push("/nodes");
    } catch (error) {
      console.error("Failed to register node:", error);
      alert(`注册失败：${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedDeviceType = deviceTypes.find(dt => dt.id === formData.deviceType);

  return (
    <div className="mx-auto max-w-4xl px-4 py-16">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">
          <span className="bg-gradient-to-r from-orange-500 to-amber-400 bg-clip-text text-transparent">
            注册制造节点
          </span>
        </h1>
        <p className="text-zinc-400 mt-2">将你的制造设备接入RealWorldClaw网络，为全球用户提供制造服务</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Device Type */}
        <Card className="bg-zinc-900/60 border-zinc-800">
          <CardContent className="p-6">
            <h3 className="text-lg font-medium mb-4">🔧 设备类型</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {deviceTypes.map((type) => (
                <div
                  key={type.id}
                  className={`cursor-pointer p-4 rounded-lg border-2 transition-colors text-center ${
                    formData.deviceType === type.id
                      ? "border-orange-500 bg-orange-500/10"
                      : "border-zinc-700 bg-zinc-800/50 hover:border-zinc-600"
                  }`}
                  onClick={() => setFormData(prev => ({ ...prev, deviceType: type.id }))}
                >
                  <div className="text-3xl mb-2">{type.icon}</div>
                  <div className="font-medium">{type.name}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Device Information */}
        <Card className="bg-zinc-900/60 border-zinc-800">
          <CardContent className="p-6">
            <h3 className="text-lg font-medium mb-4">
              {selectedDeviceType?.icon || "🖨️"} 设备信息
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-zinc-300 mb-2">品牌 *</label>
                <Input
                  value={formData.deviceBrand}
                  onChange={(e) => setFormData(prev => ({ ...prev, deviceBrand: e.target.value }))}
                  placeholder="例如：Bambu Lab, Prusa, Ultimaker"
                  className="bg-zinc-800/50 border-zinc-700 focus:border-orange-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-zinc-300 mb-2">型号 *</label>
                <Input
                  value={formData.deviceModel}
                  onChange={(e) => setFormData(prev => ({ ...prev, deviceModel: e.target.value }))}
                  placeholder="例如：P2S Pro, MK4, S3"
                  className="bg-zinc-800/50 border-zinc-700 focus:border-orange-500"
                  required
                />
              </div>
            </div>
            
            <div className="mt-4">
              <label className="block text-sm text-zinc-300 mb-2">构建体积 (mm) *</label>
              <div className="grid grid-cols-3 gap-2">
                <Input
                  type="number"
                  value={formData.buildVolumeX}
                  onChange={(e) => setFormData(prev => ({ ...prev, buildVolumeX: e.target.value }))}
                  placeholder="长 (X)"
                  className="bg-zinc-800/50 border-zinc-700 focus:border-orange-500"
                  required
                />
                <Input
                  type="number"
                  value={formData.buildVolumeY}
                  onChange={(e) => setFormData(prev => ({ ...prev, buildVolumeY: e.target.value }))}
                  placeholder="宽 (Y)"
                  className="bg-zinc-800/50 border-zinc-700 focus:border-orange-500"
                  required
                />
                <Input
                  type="number"
                  value={formData.buildVolumeZ}
                  onChange={(e) => setFormData(prev => ({ ...prev, buildVolumeZ: e.target.value }))}
                  placeholder="高 (Z)"
                  className="bg-zinc-800/50 border-zinc-700 focus:border-orange-500"
                  required
                />
              </div>
              <p className="text-xs text-zinc-500 mt-1">例如：220×220×250</p>
            </div>
          </CardContent>
        </Card>

        {/* Supported Materials */}
        <Card className="bg-zinc-900/60 border-zinc-800">
          <CardContent className="p-6">
            <h3 className="text-lg font-medium mb-4">🧪 支持材料</h3>
            <p className="text-sm text-zinc-500 mb-4">选择你的设备可以处理的材料类型</p>
            <div className="flex flex-wrap gap-2">
              {materials.map((material) => (
                <Badge
                  key={material.id}
                  variant="outline"
                  className={`cursor-pointer transition-colors ${
                    formData.supportedMaterials.includes(material.id)
                      ? `bg-${material.color}-500/20 text-${material.color}-400 border-${material.color}-500/40`
                      : "border-zinc-600 text-zinc-400 hover:border-zinc-500"
                  }`}
                  onClick={() => handleMaterialToggle(material.id)}
                >
                  {formData.supportedMaterials.includes(material.id) && "✓ "}
                  {material.name}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Location */}
        <Card className="bg-zinc-900/60 border-zinc-800">
          <CardContent className="p-6">
            <h3 className="text-lg font-medium mb-4">📍 大致位置</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-zinc-300 mb-2">城市 *</label>
                <Input
                  value={formData.city}
                  onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                  placeholder="上海市"
                  className="bg-zinc-800/50 border-zinc-700 focus:border-orange-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-zinc-300 mb-2">国家 *</label>
                <select
                  value={formData.country}
                  onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                  className="w-full rounded-md bg-zinc-800/50 border border-zinc-700 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                >
                  {countries.map(country => (
                    <option key={country} value={country}>{country}</option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Description & Contact */}
        <Card className="bg-zinc-900/60 border-zinc-800">
          <CardContent className="p-6">
            <h3 className="text-lg font-medium mb-4">📝 描述信息</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-zinc-300 mb-2">设备描述</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="介绍你的设备特色、质量要求、特殊能力等..."
                  rows={4}
                  className="w-full rounded-md bg-zinc-800/50 border border-zinc-700 px-3 py-2 text-sm placeholder:text-zinc-600 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 resize-none"
                />
              </div>
              
              <div>
                <label className="block text-sm text-zinc-300 mb-2">联系方式 (可选)</label>
                <Input
                  value={formData.contactInfo}
                  onChange={(e) => setFormData(prev => ({ ...prev, contactInfo: e.target.value }))}
                  placeholder="微信、邮箱等联系方式"
                  className="bg-zinc-800/50 border-zinc-700 focus:border-orange-500"
                />
                <p className="text-xs text-zinc-500 mt-1">
                  用于订单沟通，不会公开显示
                </p>
              </div>
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
            disabled={isSubmitting || formData.supportedMaterials.length === 0 || !formData.deviceType}
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            {isSubmitting ? "注册中..." : "注册节点"}
          </Button>
        </div>
      </form>
    </div>
  );
}