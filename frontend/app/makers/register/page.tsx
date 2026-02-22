"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";

const printerBrands = [
  "Bambu Lab", "Prusa", "Ultimaker", "Creality", "Anycubic", 
  "Artillery", "FLSUN", "Qidi Tech", "Raise3D", "其他"
];

const materials = [
  { id: "PLA", name: "PLA", color: "green" },
  { id: "PETG", name: "PETG", color: "blue" },
  { id: "ABS", name: "ABS", color: "orange" },
  { id: "TPU", name: "TPU", color: "purple" },
  { id: "WOOD", name: "木质材料", color: "amber" },
  { id: "METAL", name: "金属材料", color: "gray" },
];

const countries = [
  "中国", "美国", "日本", "德国", "英国", "法国", "加拿大", "澳大利亚", "其他"
];

export default function MakerRegisterPage() {
  const [formData, setFormData] = useState({
    // Basic info
    name: "",
    email: "",
    
    // Location
    city: "",
    country: "中国",
    
    // Printer info
    printerBrand: "",
    printerModel: "",
    printerCount: "1",
    
    // Capabilities
    buildVolumeX: "",
    buildVolumeY: "",
    buildVolumeZ: "",
    supportedMaterials: [] as string[],
    
    // Business
    hourlyRate: "",
    bio: "",
    
    // Contact
    phone: "",
    wechat: "",
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
      // Mock API call - replace with actual API when ready
      const registrationData = {
        ...formData,
        buildVolume: `${formData.buildVolumeX}×${formData.buildVolumeY}×${formData.buildVolumeZ}mm`,
        createdAt: new Date().toISOString(),
      };

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      console.log("Registering maker:", registrationData);
      
      alert("注册成功！我们将在 1-2 个工作日内审核您的申请。");
      router.push("/makers");
    } catch (error) {
      console.error("Failed to register maker:", error);
      alert("注册失败，请重试");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-16">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">
          <span className="bg-gradient-to-r from-orange-500 to-amber-400 bg-clip-text text-transparent">
            成为制造者
          </span>
        </h1>
        <p className="text-zinc-400 mt-2">加入我们的制造者网络，让你的3D打印机为他人服务</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card className="bg-zinc-900/60 border-zinc-800">
          <CardContent className="p-6">
            <h3 className="text-lg font-medium mb-4">👤 基本信息</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-zinc-300 mb-2">姓名 *</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="您的真实姓名"
                  className="bg-zinc-800/50 border-zinc-700 focus:border-orange-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-zinc-300 mb-2">邮箱 *</label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="your@email.com"
                  className="bg-zinc-800/50 border-zinc-700 focus:border-orange-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-zinc-300 mb-2">手机号</label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="用于订单联系"
                  className="bg-zinc-800/50 border-zinc-700 focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm text-zinc-300 mb-2">微信号</label>
                <Input
                  value={formData.wechat}
                  onChange={(e) => setFormData(prev => ({ ...prev, wechat: e.target.value }))}
                  placeholder="便于沟通联系"
                  className="bg-zinc-800/50 border-zinc-700 focus:border-orange-500"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Location */}
        <Card className="bg-zinc-900/60 border-zinc-800">
          <CardContent className="p-6">
            <h3 className="text-lg font-medium mb-4">📍 地理位置</h3>
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

        {/* Printer Information */}
        <Card className="bg-zinc-900/60 border-zinc-800">
          <CardContent className="p-6">
            <h3 className="text-lg font-medium mb-4">🖨️ 打印机信息</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-zinc-300 mb-2">品牌 *</label>
                <select
                  value={formData.printerBrand}
                  onChange={(e) => setFormData(prev => ({ ...prev, printerBrand: e.target.value }))}
                  className="w-full rounded-md bg-zinc-800/50 border border-zinc-700 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  required
                >
                  <option value="">选择品牌</option>
                  {printerBrands.map(brand => (
                    <option key={brand} value={brand}>{brand}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-zinc-300 mb-2">型号 *</label>
                <Input
                  value={formData.printerModel}
                  onChange={(e) => setFormData(prev => ({ ...prev, printerModel: e.target.value }))}
                  placeholder="P2S Pro"
                  className="bg-zinc-800/50 border-zinc-700 focus:border-orange-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-zinc-300 mb-2">数量 *</label>
                <Input
                  type="number"
                  min="1"
                  max="20"
                  value={formData.printerCount}
                  onChange={(e) => setFormData(prev => ({ ...prev, printerCount: e.target.value }))}
                  className="bg-zinc-800/50 border-zinc-700 focus:border-orange-500"
                  required
                />
              </div>
            </div>
            
            <div className="mt-4">
              <label className="block text-sm text-zinc-300 mb-2">打印体积 (mm) *</label>
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
            <h3 className="text-lg font-medium mb-4">🧪 支持的材料</h3>
            <p className="text-sm text-zinc-500 mb-4">选择您的打印机可以使用的材料</p>
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

        {/* Business Information */}
        <Card className="bg-zinc-900/60 border-zinc-800">
          <CardContent className="p-6">
            <h3 className="text-lg font-medium mb-4">💰 商务信息</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-zinc-300 mb-2">小时费率 (¥/小时) *</label>
                <Input
                  type="number"
                  min="1"
                  step="0.01"
                  value={formData.hourlyRate}
                  onChange={(e) => setFormData(prev => ({ ...prev, hourlyRate: e.target.value }))}
                  placeholder="15.00"
                  className="bg-zinc-800/50 border-zinc-700 focus:border-orange-500"
                  required
                />
                <p className="text-xs text-zinc-500 mt-1">
                  建议定价：PLA 10-20元/小时，特殊材料可适当提高
                </p>
              </div>
              
              <div>
                <label className="block text-sm text-zinc-300 mb-2">个人简介</label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder="介绍您的经验、专长和服务特色..."
                  rows={4}
                  className="w-full rounded-md bg-zinc-800/50 border border-zinc-700 px-3 py-2 text-sm placeholder:text-zinc-600 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 resize-none"
                />
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
            disabled={isSubmitting || formData.supportedMaterials.length === 0}
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            {isSubmitting ? "提交中..." : "提交申请"}
          </Button>
        </div>
      </form>
    </div>
  );
}