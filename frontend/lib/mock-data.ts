/** Mock 数据 — 用于开发阶段替代后端 API */

export interface LocalizedText {
  en: string;
  zh: string;
}

export interface ClawComponent {
  id: string;
  display_name: LocalizedText;
  description: LocalizedText;
  author: string;
  tags: string[];
  compute: string;
  material: string;
  estimated_cost_cny: number;
  estimated_print_time: string;
  estimated_filament_g: number;
  version: string;
  created_at: string;
}

export const mockComponents: ClawComponent[] = [
  {
    id: "clawbie-v4-cyber-egg",
    display_name: {
      en: "Clawbie V4 Cyber Egg",
      zh: "Clawbie V4 赛博蛋壳",
    },
    description: {
      en: "4th-gen egg-shell chassis with modular internals and RGB lighting. Flagship AI agent body design.",
      zh: "第四代蛋壳机体，模块化内部结构，RGB 灯效。旗舰 AI Agent 机体设计。",
    },
    author: "RealWorldClaw Team",
    tags: ["flagship", "RGB", "modular"],
    compute: "ESP32",
    material: "PLA / PETG",
    estimated_cost_cny: 85,
    estimated_print_time: "18h",
    estimated_filament_g: 320,
    version: "4.0.0",
    created_at: "2025-12-01T00:00:00Z",
  },
  {
    id: "clawbie-v3-mechanical-claw",
    display_name: {
      en: "Clawbie V3 Mechanical Claw",
      zh: "Clawbie V3 机械爪",
    },
    description: {
      en: "Classic 3-claw mechanism driven by a single servo. Beginner-friendly and battle-tested.",
      zh: "经典三爪联动机构，单舵机驱动，结构简洁可靠，适合入门。",
    },
    author: "RealWorldClaw Team",
    tags: ["beginner", "classic", "reliable"],
    compute: "Arduino Nano",
    material: "PLA",
    estimated_cost_cny: 35,
    estimated_print_time: "6h",
    estimated_filament_g: 120,
    version: "3.2.1",
    created_at: "2025-06-15T00:00:00Z",
  },
  {
    id: "w11-walker-chassis",
    display_name: {
      en: "W11 Walker Chassis",
      zh: "W11 步行底盘",
    },
    description: {
      en: "Bipedal walking chassis for AI agent bodies. Supports servo-driven gait control.",
      zh: "双足步行底盘，适配 AI Agent 机体，支持舵机步态控制。",
    },
    author: "Community",
    tags: ["locomotion", "bipedal", "experimental"],
    compute: "ESP32-S3",
    material: "PETG",
    estimated_cost_cny: 120,
    estimated_print_time: "24h",
    estimated_filament_g: 450,
    version: "1.0.0",
    created_at: "2026-01-20T00:00:00Z",
  },
];

/** 根据 ID 获取单个组件 */
export function getComponentById(id: string): ClawComponent | undefined {
  return mockComponents.find((c) => c.id === id);
}

/* ========== 打印农场 ========== */

export interface PrintFarm {
  id: string;
  region: string;
  printer_brand: string;
  printer_model: string;
  materials: string[];
  rating: number;
  total_orders: number;
  pricing_per_hour_cny: number;
  availability: "open" | "busy" | "offline";
}

export const mockFarms: PrintFarm[] = [
  {
    id: "farm-sh-pudong",
    region: "上海市 浦东新区",
    printer_brand: "Bambu Lab",
    printer_model: "X1 Carbon",
    materials: ["PLA", "PETG", "ABS", "TPU"],
    rating: 4.9,
    total_orders: 328,
    pricing_per_hour_cny: 8,
    availability: "open",
  },
  {
    id: "farm-sz-nanshan",
    region: "深圳市 南山区",
    printer_brand: "Bambu Lab",
    printer_model: "P1S",
    materials: ["PLA", "PETG"],
    rating: 4.7,
    total_orders: 156,
    pricing_per_hour_cny: 6,
    availability: "open",
  },
  {
    id: "farm-bj-haidian",
    region: "北京市 海淀区",
    printer_brand: "Creality",
    printer_model: "K1 Max",
    materials: ["PLA", "PETG", "ABS"],
    rating: 4.5,
    total_orders: 89,
    pricing_per_hour_cny: 7,
    availability: "busy",
  },
  {
    id: "farm-hz-xihu",
    region: "杭州市 西湖区",
    printer_brand: "Voron",
    printer_model: "2.4 r2",
    materials: ["PLA", "PETG", "ABS", "Nylon"],
    rating: 4.8,
    total_orders: 210,
    pricing_per_hour_cny: 10,
    availability: "offline",
  },
];

/* ========== 订单 ========== */

export interface Order {
  id: string;
  component_name: string;
  status: "pending" | "printing" | "shipping" | "completed" | "cancelled";
  total_cny: number;
  created_at: string;
}

export const mockOrders: Order[] = [
  {
    id: "ORD-20260218-001",
    component_name: "Clawbie V4 赛博蛋壳",
    status: "printing",
    total_cny: 95,
    created_at: "2026-02-18T14:30:00Z",
  },
  {
    id: "ORD-20260215-002",
    component_name: "Clawbie V3 机械爪",
    status: "completed",
    total_cny: 48,
    created_at: "2026-02-15T09:00:00Z",
  },
  {
    id: "ORD-20260210-003",
    component_name: "W11 步行底盘",
    status: "cancelled",
    total_cny: 140,
    created_at: "2026-02-10T16:20:00Z",
  },
];
