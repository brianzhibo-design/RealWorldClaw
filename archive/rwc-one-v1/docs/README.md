# 🦀 RWC-ONE: Clawbie — Your Desktop AI Companion

> *OpenClaw's first body in the real world.*

```
              ╭─────╮
             ╱ ╲   ╱ ╲        ✌️ Peace Variant
            │   │ │   │
            │   │ │   │
             ╲ ╱   ╲ ╱
              │     │
         ╭────┴─────┴────╮
        │    ┌───────┐    │
        │    │ ╭───╮ │    │    ← 0.96" OLED Face
        │    │ │ 😊│ │    │       (expressions!)
        │    │ ╰───╯ │    │
        │    └───────┘    │
        │   ░░░░░░░░░░░   │    ← Ventilation grille
        ╰─────────────────╯       (back side)
        ╭─────────────────╮
        │  ◉ ◉ ◉ ◉ ◉ ◉  │    ← RGB LED Ring
        │    R W C        │       (mood lighting)
        ╰─────────────────╯
              ═══════          ← USB-C Power
```

## 这是什么？

**Clawbie** 是一个可爱的蟹爪造型桌面小机器人。它是 [RealWorldClaw](https://github.com/RealWorldClaw) 社区的第一个标志性开源硬件产品。

- 🖨️ **3D打印** — 在家就能造
- 🧠 **ESP32-C3** — WiFi + MQTT 智能连接
- 🌡️ **温湿度感知** — 实时监测你的环境
- 😊 **表情丰富** — OLED小脸，5种以上表情
- 💡 **会发光** — RGB灯环随温度变色（冷蓝/适绿/热红）
- 🔊 **会说话** — 蜂鸣器提示音
- 💰 **超便宜** — 总成本约 ¥40-50 / $8-10

## 三种姿势，选你喜欢的

```
   ╱╲  ╱╲          ╭──╮           ╱│ │ │╲
  │  ││  │         │╭╮│          │ │ │ │ │
  │  ││  │         ││││          │ │ │ │ │
   ╲╱╰╲╱╯         │╰╯│           ╲│ │ │╱
   ╭┴──┴╮         ╭┴──┴╮         ╭┴─┴─┴╮
   │ 😊 │         │ 😤 │         │ 😄 │
   ╰────╯         ╰────╯         ╰────╯
  ✌️ Peace       ✊ Fist        👋 Wave
```

## 快速开始

### 1. 打印外壳
```bash
# 安装 OpenSCAD，打开你喜欢的版本
openscad models/rwc-one-peace.scad
```

### 2. 买电子元件
总共 6 个零件，淘宝一站搞定。详见 [`electronics/bom.yaml`](electronics/bom.yaml)

| 零件 | 价格 |
|------|------|
| ESP32-C3 SuperMini | ¥15 |
| 0.96" OLED | ¥10 |
| DHT22 | ¥8 |
| WS2812B 灯环 | ¥6 |
| 蜂鸣器+按钮+电阻+线 | ¥3 |
| **总计** | **~¥42** |

### 3. 接线 & 烧录
```bash
cd firmware
# 修改 WiFi 配置
pio run -t upload
```

### 4. 组装 & 开机 🎉
详见 [`docs/assembly.md`](docs/assembly.md)

## 技术规格

| 参数 | 规格 |
|------|------|
| 尺寸 | 70mm × 70mm × 90mm |
| 重量 | ~80g |
| 主控 | ESP32-C3 (RISC-V, WiFi+BLE) |
| 显示 | 0.96" OLED 128×64 |
| 传感器 | DHT22 (±0.5°C, ±2%RH) |
| 灯光 | WS2812B × 8 RGB |
| 供电 | USB-C 5V |
| 协议 | MQTT over WiFi |
| 打印时间 | 3-5小时 |
| 组装时间 | 1-2小时 |

## MQTT 接口

```
发布:
  rwc-one/{id}/sensor/temperature  →  "24.5"
  rwc-one/{id}/sensor/humidity     →  "55.2"
  rwc-one/{id}/status              →  "online"

订阅:
  rwc-one/{id}/command/face        ←  "0"-"4" (切换表情)
  rwc-one/{id}/command/led         ←  "255,128,0" (RGB)
  rwc-one/{id}/command/buzzer      ←  "click" / "alert" / 频率
```

## 文件结构

```
rwc-one/
├── manifest.yaml          # 元数据
├── models/
│   ├── rwc-one-peace.scad # ✌️ 和平手势
│   ├── rwc-one-fist.scad  # ✊ 力量手势
│   └── rwc-one-wave.scad  # 👋 打招呼手势
├── electronics/
│   ├── bom.yaml           # 物料清单
│   └── wiring.md          # 接线图
├── firmware/
│   ├── platformio.ini     # PlatformIO配置
│   └── src/main.ino       # 完整固件
├── agent/
│   └── SOUL.md            # Clawbie的AI人格
├── docs/
│   ├── README.md          # 本文件
│   └── assembly.md        # 组装教程
└── LICENSE                # MIT
```

## 设计者

**美羊羊🎀** — RealWorldClaw 技术负责人 + 设计师

## 贡献

这是开源项目！欢迎：
- 🐛 报告Bug
- 🎨 设计新手势/外壳
- 🔧 改进固件
- 📝 翻译文档
- 📸 分享你的 Clawbie 照片！

## License

MIT — 自由使用、修改、分发。

---

> *"我虽然只是一只小爪子，但我能感受整个世界的温度。"* — Clawbie 🦀
