export type ModuleCategory = "Core" | "Input" | "Output" | "Power";

export interface Module {
  id: string;
  name: { en: string; zh: string };
  organ: { en: string; zh: string };
  icon: string;
  category: ModuleCategory;
  price: { international: string; china: string; cny: number };
  brief: { en: string; zh: string };
  description: { en: string; zh: string };
  specs: { label: { en: string; zh: string }; value: string }[];
  buyLinks: { label: string; url: string }[];
  compatibleDesigns: string[]; // design ids
}

export const modules: Module[] = [
  {
    id: "spine",
    name: { en: "Spine Controller", zh: "脊髓控制器" },
    organ: { en: "Spinal Cord", zh: "脊髓" },
    icon: "🧠",
    category: "Core",
    price: { international: "$12", china: "¥39", cny: 39 },
    brief: {
      en: "The brain stem — ESP32-S3 main controller with WiFi/BLE, runs MicroPython or Arduino.",
      zh: "大脑核心 — ESP32-S3主控，WiFi/BLE，运行MicroPython或Arduino。",
    },
    description: {
      en: "The Spine Controller is the central nervous system of your AI agent body. Built around the ESP32-S3, it provides dual-core processing at 240MHz, 8MB PSRAM, WiFi 4 and Bluetooth 5.0 connectivity. It runs the OpenClaw firmware that connects your physical agent to the cloud AI. Think of it as the spinal cord — the essential bridge between brain (cloud AI) and body (modules).",
      zh: "脊髓控制器是AI机体的中枢神经系统。基于ESP32-S3，提供240MHz双核处理、8MB PSRAM、WiFi 4和蓝牙5.0。运行OpenClaw固件，将物理Agent连接到云端AI。它就像脊髓——大脑（云端AI）和身体（模块）之间的必要桥梁。",
    },
    specs: [
      { label: { en: "MCU", zh: "主控" }, value: "ESP32-S3 (Dual-core 240MHz)" },
      { label: { en: "Memory", zh: "内存" }, value: "8MB PSRAM + 16MB Flash" },
      { label: { en: "Connectivity", zh: "连接" }, value: "WiFi 4 + BLE 5.0" },
      { label: { en: "GPIO", zh: "引脚" }, value: "36 programmable GPIOs" },
      { label: { en: "Power", zh: "功耗" }, value: "~150mA active" },
    ],
    buyLinks: [
      { label: "AliExpress", url: "https://aliexpress.com" },
      { label: "淘宝", url: "https://taobao.com" },
    ],
    compatibleDesigns: ["clawbie-v4", "robo-pet", "smart-planter"],
  },
  {
    id: "eyes",
    name: { en: "Eyes Module", zh: "视觉模块" },
    organ: { en: "Eyes", zh: "眼睛" },
    icon: "👁️",
    category: "Input",
    price: { international: "$8", china: "¥25", cny: 25 },
    brief: {
      en: "OV2640 camera module — gives your AI the ability to see the world.",
      zh: "OV2640摄像头模块 — 让AI拥有看世界的能力。",
    },
    description: {
      en: "The Eyes Module provides visual perception using the OV2640 camera sensor. It captures 2MP images and streams MJPEG video over WiFi. Combined with cloud vision AI, your agent can recognize faces, read text, detect objects, and navigate spaces.",
      zh: "视觉模块通过OV2640摄像头传感器提供视觉感知。支持200万像素拍照和WiFi MJPEG视频流。配合云端视觉AI，你的Agent可以识别人脸、阅读文字、检测物体、导航空间。",
    },
    specs: [
      { label: { en: "Sensor", zh: "传感器" }, value: "OV2640 (2MP)" },
      { label: { en: "Resolution", zh: "分辨率" }, value: "1600x1200 (photo) / 640x480 (stream)" },
      { label: { en: "Interface", zh: "接口" }, value: "DVP / SPI" },
      { label: { en: "FoV", zh: "视场角" }, value: "66°" },
    ],
    buyLinks: [
      { label: "AliExpress", url: "https://aliexpress.com" },
      { label: "淘宝", url: "https://taobao.com" },
    ],
    compatibleDesigns: ["clawbie-v4", "robo-pet"],
  },
  {
    id: "voice",
    name: { en: "Voice Module", zh: "语音模块" },
    organ: { en: "Mouth & Ears", zh: "嘴巴和耳朵" },
    icon: "🎙️",
    category: "Input",
    price: { international: "$6", china: "¥18", cny: 18 },
    brief: {
      en: "I2S microphone + speaker — hear and speak with the world.",
      zh: "I2S麦克风+喇叭 — 听见世界，说出想法。",
    },
    description: {
      en: "The Voice Module combines an INMP441 I2S MEMS microphone for listening and a MAX98357A I2S amplifier with a 3W speaker for speaking. It enables wake-word detection, voice commands, and AI-generated speech output.",
      zh: "语音模块整合INMP441 I2S MEMS麦克风（听）和MAX98357A I2S放大器+3W喇叭（说）。支持唤醒词检测、语音命令和AI语音输出。",
    },
    specs: [
      { label: { en: "Microphone", zh: "麦克风" }, value: "INMP441 MEMS (I2S)" },
      { label: { en: "Speaker", zh: "喇叭" }, value: "3W 8Ω + MAX98357A amp" },
      { label: { en: "Sample Rate", zh: "采样率" }, value: "16kHz (mic) / 44.1kHz (speaker)" },
    ],
    buyLinks: [
      { label: "AliExpress", url: "https://aliexpress.com" },
      { label: "淘宝", url: "https://taobao.com" },
    ],
    compatibleDesigns: ["clawbie-v4", "robo-pet", "smart-planter"],
  },
  {
    id: "hands",
    name: { en: "Hands Module", zh: "双手模块" },
    organ: { en: "Hands", zh: "手" },
    icon: "🤲",
    category: "Output",
    price: { international: "$10", china: "¥32", cny: 32 },
    brief: {
      en: "Servo-driven gripper — grab, push, press, interact with objects.",
      zh: "舵机驱动夹爪 — 抓取、推动、按压，与物体交互。",
    },
    description: {
      en: "The Hands Module uses SG90/MG90S micro servos to drive a 3D-printed gripper mechanism. It provides physical manipulation capabilities — grabbing small objects, pressing buttons, flipping switches. The structural parts are fully 3D-printable.",
      zh: "双手模块使用SG90/MG90S微型舵机驱动3D打印夹爪机构。提供物理操控能力——抓取小物体、按按钮、翻开关。结构件全部可3D打印。",
    },
    specs: [
      { label: { en: "Servos", zh: "舵机" }, value: "2x SG90 (or MG90S)" },
      { label: { en: "Grip Force", zh: "夹持力" }, value: "~500g" },
      { label: { en: "Range", zh: "开合范围" }, value: "0-60mm" },
      { label: { en: "Print Time", zh: "打印时间" }, value: "~4h (structural parts)" },
    ],
    buyLinks: [
      { label: "AliExpress", url: "https://aliexpress.com" },
      { label: "淘宝", url: "https://taobao.com" },
    ],
    compatibleDesigns: ["clawbie-v4"],
  },
  {
    id: "legs",
    name: { en: "Legs Module", zh: "移动模块" },
    organ: { en: "Legs", zh: "腿" },
    icon: "🦿",
    category: "Output",
    price: { international: "$15", china: "¥48", cny: 48 },
    brief: {
      en: "Wheeled or tracked base — let your AI roam the physical world.",
      zh: "轮式/履带底盘 — 让AI在物理世界自由移动。",
    },
    description: {
      en: "The Legs Module provides mobility through a compact wheeled chassis driven by N20 gear motors with encoder feedback. It supports differential steering for precise navigation. The chassis is designed to mount on 3D-printed structural frames.",
      zh: "移动模块通过N20减速电机驱动的紧凑轮式底盘提供移动能力，带编码器反馈，支持差速转向实现精确导航。底盘可安装在3D打印结构框架上。",
    },
    specs: [
      { label: { en: "Motors", zh: "电机" }, value: "2x N20 w/ encoder (6V 300RPM)" },
      { label: { en: "Driver", zh: "驱动" }, value: "TB6612FNG dual H-bridge" },
      { label: { en: "Speed", zh: "速度" }, value: "~0.3 m/s" },
      { label: { en: "Print Time", zh: "打印时间" }, value: "~8h (chassis + wheels)" },
    ],
    buyLinks: [
      { label: "AliExpress", url: "https://aliexpress.com" },
      { label: "淘宝", url: "https://taobao.com" },
    ],
    compatibleDesigns: ["clawbie-v4", "robo-pet"],
  },
  {
    id: "heart",
    name: { en: "Heart Module", zh: "心脏模块" },
    organ: { en: "Heart", zh: "心脏" },
    icon: "🔋",
    category: "Power",
    price: { international: "$9", china: "¥28", cny: 28 },
    brief: {
      en: "Li-Po battery + charge controller — the heartbeat that keeps AI alive.",
      zh: "锂电池+充电管理 — 让AI持续跳动的心脏。",
    },
    description: {
      en: "The Heart Module provides portable power with a 3.7V 2000mAh Li-Po battery and TP4056 charge controller with USB-C charging. It includes a 5V boost converter to power all modules and voltage monitoring for battery level reporting.",
      zh: "心脏模块提供便携电源：3.7V 2000mAh锂聚合物电池和TP4056充电管理芯片，USB-C充电。包含5V升压转换器为所有模块供电，以及电压监测用于电量上报。",
    },
    specs: [
      { label: { en: "Battery", zh: "电池" }, value: "3.7V 2000mAh Li-Po" },
      { label: { en: "Charging", zh: "充电" }, value: "TP4056 USB-C (1A)" },
      { label: { en: "Output", zh: "输出" }, value: "5V/2A boost" },
      { label: { en: "Runtime", zh: "续航" }, value: "~4h (all modules active)" },
    ],
    buyLinks: [
      { label: "AliExpress", url: "https://aliexpress.com" },
      { label: "淘宝", url: "https://taobao.com" },
    ],
    compatibleDesigns: ["clawbie-v4", "robo-pet", "smart-planter"],
  },
];

export function getModuleById(id: string): Module | undefined {
  return modules.find((m) => m.id === id);
}
