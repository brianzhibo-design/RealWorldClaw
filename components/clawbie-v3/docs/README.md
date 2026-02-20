# 🦀 Clawbie V3 — Desktop Mechanical Crab Claw

**它能真的夹东西。**

Clawbie V3 是一只 AI 控制的桌面机械蟹爪。3D 打印外壳，SG90 舵机驱动，M5StickC Plus2 做大脑。放在桌上，它会自己动——缓慢呼吸、好奇张望、猛然夹住你的笔。

## ✨ 特性

- 🦀 **真·机械爪** — 连杆机构驱动，张开 40-50mm，能夹笔/零食/手指
- 🧠 **AI 控制** — MQTT 远程指令，5 种动作模式
- 📱 **彩色表情屏** — 135×240 屏幕显示心情和状态
- 🎮 **体感互动** — 摇一摇触发随机动作
- ⚡ **10 分钟组装** — 5 个打印件 + 3 根线 + 1 个舵机

## 💰 成本

| 版本 | 价格 |
|------|------|
| 基础版 (1舵机) | ¥92 |
| 完整版 (2舵机+旋转) | ¥95 |

## 🏗️ 快速开始

1. **打印** 5 个零件 (~2.5h, PLA)
2. **装舵机** 卡入底座
3. **插 M5** StickC Plus2 竖直插入
4. **接 3 根线** 信号+电源+地
5. **烧固件** `pio run -t upload`
6. **夹东西！** 🦀

详见 [assembly.md](assembly.md)

## 🎮 操作

| 按钮 | 功能 |
|------|------|
| A (正面) | 切换模式: 待机→抓取→打招呼→睡眠→兴奋 |
| B (侧面) | 立即抓取 |
| 摇晃 | 随机动作 |

### MQTT 指令

发送到 `clawbie/v3/cmd`:
- `open` / `close` / `grab` / `wave` / `sleep` / `excited`
- `angle:90` — 指定角度
- `mode:0-4` — 切换模式

## 📁 项目结构

```
rwc-one-v3/
├── manifest.yaml          # 规格
├── models/
│   ├── clawbie-v3-base.scad   # 底座
│   └── clawbie-v3-claw.scad   # 蟹爪+连杆
├── electronics/
│   ├── bom.yaml           # 物料清单
│   └── wiring.md          # 接线
├── firmware/
│   ├── platformio.ini
│   └── src/main.cpp       # 固件
├── agent/SOUL.md          # 人格
└── docs/
    ├── README.md          # 本文件
    └── assembly.md        # 组装指南
```

## License

MIT
