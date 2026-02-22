# 🌡️ RealWorldClaw 温湿度监控器

> **RealWorldClaw 第一个种子组件** — 用25元和一台3D打印机，打造你的智能温湿度监控器！

![Status](https://img.shields.io/badge/status-seed_v1.0-brightgreen)
![Cost](https://img.shields.io/badge/cost-¥25-blue)
![Difficulty](https://img.shields.io/badge/difficulty-beginner-green)
![License](https://img.shields.io/badge/license-MIT-blue)

## ✨ 特性

- 🌡️ 温度监控（±0.5°C精度）
- 💧 湿度监控（±2%RH精度）
- 📡 WiFi连接 + MQTT数据上报
- 🔄 OTA无线固件更新
- 💡 LED状态指示（快闪/慢闪/常亮）
- 🏠 卡扣式3D打印外壳，无需胶水
- 🤖 OpenClaw AI人格集成（温湿度宝宝）
- ⚙️ MQTT远程配置（间隔、WiFi等）

## 📦 组件包内容

```
rwc-temp-monitor/
├── manifest.yaml           # 组件元数据（RealWorldClaw规范）
├── models/
│   └── enclosure.scad      # OpenSCAD外壳源文件（可生成STL）
├── electronics/
│   ├── bom.yaml            # 物料清单
│   └── wiring.md           # 接线图
├── firmware/
│   ├── platformio.ini      # PlatformIO编译配置
│   └── src/main.ino        # Arduino固件源码
├── agent/
│   ├── SOUL.md             # AI人格定义
│   └── skills/temp-monitor/
│       └── SKILL.md        # OpenClaw技能配置
├── docs/
│   ├── README.md           # 本文件
│   └── assembly.md         # 组装指南
└── LICENSE                 # MIT开源协议
```

## 🛒 你需要什么

| 零件 | 价格 | 备注 |
|------|------|------|
| ESP32-C3 SuperMini | ¥9.9 | 自带WiFi/BLE和USB-C |
| DHT22温湿度传感器 | ¥5.5 | 又称AM2302 |
| 10kΩ电阻 | ¥0.05 | 上拉电阻 |
| 3mm绿色LED + 220Ω电阻 | ¥0.15 | 状态指示 |
| 杜邦线、螺丝等 | ¥2 | 通用耗材 |
| **合计** | **~¥25** | |

另需：3D打印机（PLA材料）、电脑、USB-C数据线

## 🚀 快速开始

### 1. 打印外壳
```bash
# 安装OpenSCAD后
openscad -D 'render_part="bottom"' -o enclosure-bottom.stl models/enclosure.scad
openscad -D 'render_part="lid"' -o enclosure-lid.stl models/enclosure.scad
# 用切片软件打印：PLA, 0.2mm层高, 20%填充
```

### 2. 接线
参考 `electronics/wiring.md`，核心就3根线：
- DHT22 VCC → 3V3，DATA → GPIO4（加10kΩ上拉），GND → GND
- LED → GPIO8（经220Ω）→ GND

### 3. 烧录固件
```bash
# 修改WiFi和MQTT配置后
cd firmware
pio run -e esp32c3 -t upload
```

### 4. 组装
把元件放进外壳，盖上盖板，"咔嗒"一声，搞定！

详细步骤见 `docs/assembly.md`

## 📡 MQTT 数据格式

温度：`rwc/{agent_id}/temp-monitor/temperature`
```json
{"value": 25.3, "unit": "°C", "ts": 123456}
```

湿度：`rwc/{agent_id}/temp-monitor/humidity`
```json
{"value": 52.1, "unit": "%RH", "ts": 123456}
```

## 🤖 AI集成

温湿度宝宝会用自然语言告诉你环境状况：
- "现在25.3°C，湿度52%，超级舒适~ 🌿"
- "温度到29°C了！要不要开窗透透气？🥵"

详见 `agent/SOUL.md`

## 📐 硬件规格

- 尺寸：60 × 40 × 30 mm
- 重量：~45g
- 供电：USB-C 5V（<0.5W）
- 安装：桌面 / 壁挂 / 磁吸
- 防护：CF-P0（室内）

## 📄 许可证

MIT License — 自由使用、修改、分发。

## 🙏 致谢

由美羊羊🎀设计，作为 RealWorldClaw 项目的第一个种子组件。

> *"每一个伟大的生态，都从一颗小小的种子开始。"* 🌱
