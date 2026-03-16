# RWC Desktop Assistant（RWC桌面助手）

> RealWorldClaw 参考设计 #001

**最简AI桌面伴侣——能看、能听、能说。**

用 3 个 RWC 标准模块 + 一个 3D 打印外壳，组装出联网、显示表情、语音对话的桌面 AI 助手。

---

## 📐 概念

一颗放在桌面的"智能鹅卵石"。正面倾斜的 OLED 屏显示表情和状态，侧面透出声音，顶部拾取你的语音。通过 Wi-Fi 连接云端大模型，实现语音问答、天气播报、闹钟提醒等功能。

## 🧩 所需模块

| 模块 | 型号 | 说明 |
|------|------|------|
| **Core** | RWC-Core (ESP32-S3) | 主控，Wi-Fi/BLE，运行固件 |
| **Display** | RWC-Display-096 (0.96" OLED SSD1306) | 128×64 单色屏，I²C |
| **Audio** | RWC-Audio (INMP441 麦克风 + MAX98357A 功放 + 3W喇叭) | I²S 音频输入输出 |

## 💰 BOM 清单

| 物料 | 数量 | 参考价格 (CNY) |
|------|------|----------------|
| RWC-Core 模块 | 1 | ¥45 |
| RWC-Display-096 模块 | 1 | ¥12 |
| RWC-Audio 模块 | 1 | ¥25 |
| RWC 模块互联排线 (6P) | 2 | ¥3 |
| 3D 打印外壳 (PLA) | 1 | ¥8（自打印） |
| 硅胶防滑垫 (10mm) | 3 | ¥1 |
| USB-C 数据线 | 1 | ¥5 |
| **合计** | | **≈ ¥99** |

## 🔧 组装步骤

### Step 1 — 打印外壳
用 `models/enclosure.scad` 生成 STL，PLA 材料，0.2mm 层高，15% 填充，无需支撑。预计 3 小时。

### Step 2 — 安装 Core 模块
将 Core 模块放入外壳底部腔体，USB-C 口对准背面开孔。

### Step 3 — 连接 Display 模块
用 6P 排线将 Display 模块连接到 Core 的 I²C 端口，将 OLED 屏对准正面窗口。

### Step 4 — 连接 Audio 模块
用 6P 排线将 Audio 模块连接到 Core 的 I²S 端口，喇叭朝向侧面出音孔，麦克风朝向顶部拾音孔。

### Step 5 — 合盖 & 贴防滑垫
模块就位后合上外壳，在底部三个圆形凹槽贴上硅胶防滑垫。

### Step 6 — 刷入固件
USB-C 连接电脑，使用 `rwc flash desktop-assistant` 刷入固件。

## ✨ 功能说明

| 功能 | 描述 |
|------|------|
| 🗣️ 语音对话 | 唤醒词激活，语音识别 → LLM → TTS 语音回答 |
| 😊 表情显示 | OLED 显示像素表情，随对话状态变化（思考、说话、待机） |
| 🌤️ 信息展示 | 时间、天气、提醒等文字滚动显示 |
| 🔔 闹钟提醒 | 语音设定闹钟，到时语音+屏幕提醒 |
| 🔌 OTA 更新 | Wi-Fi 在线固件升级 |

## 📁 文件结构

```
desktop-assistant/
├── README.md           ← 本文件
├── manifest.yaml       ← 组件清单
└── models/
    ├── enclosure.scad  ← OpenSCAD 源文件
    └── enclosure.stl   ← 可直接打印的 STL
```

## 📜 许可证

MIT — 自由使用、修改、分享。
