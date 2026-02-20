# 🦀 Clawbie V2 — 蟹爪宝宝

> 买一块板 + 打印一个壳 = 你的桌面蟹爪伙伴

## 什么是 Clawbie？

Clawbie 是一个基于 **M5StickC Plus2** 的桌面小伙伴。它有彩色表情、能感知摇晃、会发出声音，还能监测温度。

**套上3D打印的蟹爪外壳，它就变成一只活灵活现的小螃蟹。**

## 为什么是 V2？

| | V1 (散件版) | V2 (一体化) |
|---|---|---|
| 核心 | ESP32 + OLED + 传感器散件 | M5StickC Plus2 一块板 |
| 屏幕 | 0.96" 单色OLED | 1.14" 彩色TFT |
| 组装 | 接线+焊接，30分钟 | 套壳，5分钟 |
| 成本 | ¥50-80（散件） | ¥89（一块板） |
| 电池 | 需外接 | 内置390mAh |
| 互动 | 按钮 | 按钮 + 摇晃 + 蜂鸣器 |

## 快速开始

### 你需要什么

- **M5StickC Plus2** × 1（¥89，淘宝/M5Stack官方店）
- **3D打印蟹爪外壳** × 1（三款任选）
- （可选）**DHT22模块** × 1（¥8，精确温湿度）

### 三步完成

1. **烧固件** — USB-C 连电脑，PlatformIO 一键上传
2. **套外壳** — 掰开卡扣，套上去，咔哒一声
3. **开机** — 自动启动，蟹爪宝宝上线！

总用时：**< 5 分钟**

## 外壳款式

| 款式 | 文件 | 风格 |
|------|------|------|
| ✌️ Peace | `clawbie-shell-peace.scad` | 剪刀手，经典蟹爪 |
| ✊ Fist | `clawbie-shell-fist.scad` | 握拳，力量蟹 |
| 👋 Wave | `clawbie-shell-wave.scad` | 挥手，社交蟹 |

打印参数：PLA，0.2mm层高，15%填充，无支撑，约1.5小时。

## 功能

- 🎨 **5种彩色表情** — 开心/恋爱/墨镜/睡觉/愤怒
- 🌡️ **温度监测** — IMU内置（粗略）或DHT22（精确）
- ⏰ **时钟显示** — RTC实时时钟
- 📡 **WiFi + MQTT** — 远程监控和操控
- 🤸 **摇晃互动** — 摇一摇随机换表情
- 🔊 **蜂鸣器** — 操作提示音

## 项目结构

```
rwc-one-v2/
├── manifest.yaml          # 项目规格
├── models/                # 3D打印外壳 (OpenSCAD)
│   ├── clawbie-shell-peace.scad  ✌️
│   ├── clawbie-shell-fist.scad   ✊
│   └── clawbie-shell-wave.scad   👋
├── electronics/
│   ├── bom.yaml           # 物料清单
│   └── wiring.md          # 接线（几乎不需要）
├── firmware/
│   ├── platformio.ini     # 编译配置
│   └── src/main.cpp       # 固件源码
├── agent/
│   └── SOUL.md            # Clawbie人格
├── docs/
│   ├── README.md          # 本文件
│   └── assembly.md        # 组装指南
└── LICENSE                # MIT
```

## 开源协议

MIT — 随便用，随便改，记得也开源就好 🦀

---

*美羊羊🎀 设计 | RealWorldClaw Project | 2026*
