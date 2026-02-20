export interface Design {
  id: string;
  name: { en: string; zh: string };
  description: { en: string; zh: string };
  modules: string[]; // module ids
  totalPrice: number; // CNY
  difficulty: number; // 1-5 stars
  printTime: string;
  filamentG: number;
  steps: { en: string; zh: string }[];
  alsoCanBuild: { en: string; zh: string }[];
}

export const designs: Design[] = [
  {
    id: "clawbie-v4",
    name: { en: "Clawbie V4 — Full AI Agent", zh: "Clawbie V4 — 完整AI机体" },
    description: {
      en: "The flagship reference design. A complete AI agent body with all 6 modules — it can see, hear, speak, grab objects, move around, and run for hours on battery. The ultimate desktop companion that brings AI into the physical world.",
      zh: "旗舰参考设计。搭载全部6个模块的完整AI机体——能看、能听、能说、能抓东西、能移动，电池续航数小时。终极桌面伙伴，让AI走进物理世界。",
    },
    modules: ["spine", "eyes", "voice", "hands", "legs", "heart"],
    totalPrice: 190,
    difficulty: 4,
    printTime: "~24h",
    filamentG: 380,
    steps: [
      { en: "Print all structural parts (shell, chassis, gripper)", zh: "打印所有结构件（外壳、底盘、夹爪）" },
      { en: "Install Spine Controller and flash firmware", zh: "安装脊髓控制器并刷写固件" },
      { en: "Mount Eyes Module and connect camera ribbon", zh: "安装视觉模块并连接排线" },
      { en: "Wire Voice Module (mic + speaker)", zh: "接线语音模块（麦克风+喇叭）" },
      { en: "Assemble Hands Module gripper mechanism", zh: "组装双手模块夹爪机构" },
      { en: "Mount Legs Module motors and wheels", zh: "安装移动模块电机和轮子" },
      { en: "Install Heart Module battery and wiring", zh: "安装心脏模块电池并接线" },
      { en: "Close shell, calibrate, and connect to OpenClaw", zh: "合上外壳，校准，连接OpenClaw" },
    ],
    alsoCanBuild: [
      { en: "Security patrol robot", zh: "安防巡逻机器人" },
      { en: "Delivery bot for small items", zh: "小物件递送机器人" },
      { en: "Interactive art installation", zh: "互动艺术装置" },
    ],
  },
  {
    id: "robo-pet",
    name: { en: "RoboPet — AI Companion", zh: "RoboPet — AI宠物伙伴" },
    description: {
      en: "A cute, mobile AI pet that can see, hear, and follow you around. No arms needed — it's all about companionship. Perfect first project for families.",
      zh: "一只可爱的移动AI宠物，能看、能听、跟着你走。不需要手臂——陪伴就够了。家庭的完美入门项目。",
    },
    modules: ["spine", "eyes", "voice", "legs", "heart"],
    totalPrice: 158,
    difficulty: 3,
    printTime: "~18h",
    filamentG: 280,
    steps: [
      { en: "Print pet body shell and chassis", zh: "打印宠物外壳和底盘" },
      { en: "Install Spine Controller", zh: "安装脊髓控制器" },
      { en: "Mount Eyes and Voice modules", zh: "安装视觉和语音模块" },
      { en: "Assemble Legs Module onto chassis", zh: "将移动模块装到底盘上" },
      { en: "Install Heart Module and close shell", zh: "安装心脏模块并合上外壳" },
      { en: "Flash pet personality firmware", zh: "刷写宠物个性固件" },
    ],
    alsoCanBuild: [
      { en: "Line-following robot for education", zh: "教育用循线机器人" },
      { en: "Maze-solving bot", zh: "迷宫求解机器人" },
    ],
  },
  {
    id: "smart-planter",
    name: { en: "SmartPlanter — AI Garden Assistant", zh: "SmartPlanter — AI花园助手" },
    description: {
      en: "A stationary AI assistant for your plants. It monitors light, talks to you about plant care, and looks adorable on your desk. The simplest build — no motors needed.",
      zh: "一个固定式AI植物助手。监测光照，跟你聊植物养护，摆在桌上萌萌的。最简单的构建——不需要电机。",
    },
    modules: ["spine", "voice", "heart"],
    totalPrice: 85,
    difficulty: 1,
    printTime: "~8h",
    filamentG: 150,
    steps: [
      { en: "Print planter shell", zh: "打印花盆外壳" },
      { en: "Install Spine Controller", zh: "安装脊髓控制器" },
      { en: "Wire Voice Module", zh: "接线语音模块" },
      { en: "Install Heart Module for portable power", zh: "安装心脏模块" },
      { en: "Flash garden assistant firmware", zh: "刷写花园助手固件" },
    ],
    alsoCanBuild: [
      { en: "Desk notification light", zh: "桌面通知灯" },
      { en: "Voice-controlled timer", zh: "语音控制计时器" },
      { en: "White noise machine", zh: "白噪音机" },
    ],
  },
];

export function getDesignById(id: string): Design | undefined {
  return designs.find((d) => d.id === id);
}
