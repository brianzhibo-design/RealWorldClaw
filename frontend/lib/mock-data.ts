/** Mock 数据 — 用于开发阶段替代后端 API */

export interface BomItem {
  name: string;
  qty: number;
  note?: string;
}

export interface PrintParams {
  material: string;
  nozzle: string;
  layerHeight: string;
  infill: string;
  supports: boolean;
  estimatedTime: string;
}

export interface ClawComponent {
  id: string;
  name: string;
  description: string;
  longDescription: string;
  thumbnail: string;
  price: number;
  rating: number;
  reviewCount: number;
  author: string;
  tags: string[];
  bom: BomItem[];
  printParams: PrintParams;
  downloads: number;
  createdAt: string;
}

export const mockComponents: ClawComponent[] = [
  {
    id: "clawbie-v4-cyber-egg",
    name: "Clawbie V4 Cyber Egg",
    description: "第四代赛博蛋壳机，流线型外观，RGB 灯效，模块化内部结构。",
    longDescription:
      "Clawbie V4 Cyber Egg 是 RealWorldClaw 的旗舰娃娃机设计。采用蛋形流线外壳，内置 WS2812B RGB 灯带，支持多种灯效模式。模块化设计让维护和升级变得极为简单——只需拧下四颗螺丝即可拆卸核心机构。兼容标准 SG90 舵机和 42 步进电机。",
    thumbnail: "/placeholder-egg.svg",
    price: 0,
    rating: 4.8,
    reviewCount: 42,
    author: "RealWorldClaw Team",
    tags: ["flagship", "RGB", "modular"],
    bom: [
      { name: "PLA 外壳（上）", qty: 1 },
      { name: "PLA 外壳（下）", qty: 1 },
      { name: "SG90 舵机", qty: 3, note: "爪臂驱动" },
      { name: "42 步进电机", qty: 2, note: "X/Y 轴" },
      { name: "WS2812B 灯带", qty: 1, note: "60灯/米, 0.5米" },
      { name: "ESP32 主控", qty: 1 },
      { name: "M3x8 螺丝", qty: 16 },
    ],
    printParams: {
      material: "PLA / PETG",
      nozzle: "0.4mm",
      layerHeight: "0.2mm",
      infill: "20%",
      supports: true,
      estimatedTime: "18h",
    },
    downloads: 1283,
    createdAt: "2025-12-01",
  },
  {
    id: "clawbie-v3-mechanical-claw",
    name: "Clawbie V3 Mechanical Claw",
    description: "经典三爪机械臂设计，结构简单可靠，适合入门玩家。",
    longDescription:
      "Clawbie V3 Mechanical Claw 是经过社区验证的经典设计。三爪联动机构通过单个舵机驱动，结构简洁、故障率低。所有零件均可在 200x200mm 打印平台上完成，无需拼接。附带详细的组装视频教程链接。",
    thumbnail: "/placeholder-claw.svg",
    price: 0,
    rating: 4.5,
    reviewCount: 89,
    author: "RealWorldClaw Team",
    tags: ["beginner", "classic", "reliable"],
    bom: [
      { name: "PLA 爪臂", qty: 3 },
      { name: "PLA 连杆", qty: 3 },
      { name: "PLA 中心座", qty: 1 },
      { name: "SG90 舵机", qty: 1, note: "爪臂开合" },
      { name: "M2x6 螺丝", qty: 6 },
      { name: "弹簧（小）", qty: 3, note: "复位用" },
    ],
    printParams: {
      material: "PLA",
      nozzle: "0.4mm",
      layerHeight: "0.2mm",
      infill: "30%",
      supports: false,
      estimatedTime: "6h",
    },
    downloads: 3412,
    createdAt: "2025-06-15",
  },
];

/** 根据 ID 获取单个组件 */
export function getComponentById(id: string): ClawComponent | undefined {
  return mockComponents.find((c) => c.id === id);
}
