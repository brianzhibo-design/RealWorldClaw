# 🌡️ Environment Sentinel — 环境哨兵

**墙挂式智能环境监测站** | RealWorldClaw Reference Design #3

> 最便宜的参考设计，展示模块系统"不只是机器人"的灵活性。

![cost](https://img.shields.io/badge/BOM-¥57-brightgreen)
![modules](https://img.shields.io/badge/modules-4-blue)
![print](https://img.shields.io/badge/print-2h-orange)

## 概念

挂在墙上或放在桌上的环境监测站，实时显示温湿度和光照。通过 WiFi 连接 AI Agent，环境异常时自动推送告警。

**核心卖点：** 用和机器人完全相同的模块，做一个完全不同的产品——证明模块系统的灵活性。

## 模块组合

| 模块 | 功能 | 价格 |
|------|------|------|
| Core | ESP32-S3 主控 + WiFi | ¥25 |
| Power | USB-C 供电 + 锂电池 | ¥12 |
| Sensor | SHT40 温湿度 + BH1750 光照 | ¥10 |
| Display | 0.96" OLED 128×64 | ¥10 |
| **合计** | | **¥57** |

## 外壳设计

- **尺寸：** 100 × 80 × 25 mm（圆角方形）
- **正面：** OLED 显示窗口 + 传感器通风格栅
- **背面：** 墙挂钥匙孔 + 可折叠支架（桌面/墙挂两用）
- **侧面：** USB-C 充电口开孔
- **打印：** PLA, 无支撑, ~2h

### 两种使用姿态

```
 墙挂模式          桌面模式
┌──────────┐    ┌──────────┐
│  ┌────┐  │    │  ┌────┐  │
│  │OLED│  │    │  │OLED│  │ 
│  └────┘  │    │  └────┘  │ ╲
│ ░░░░░░░░ │    │ ░░░░░░░░ │  ╲ 支架
│  sensor  │    │  sensor  │   |
└──────────┘    └──────────┘───┘
    🔩 墙钉
```

## 功能

### 实时监测
- 温度（°C）、湿度（%RH）、光照（lux）
- OLED 实时显示，2 秒刷新

### AI Agent 集成
- WiFi 连接 → MQTT/HTTP 上报数据
- 异常阈值可通过 Agent 远程配置
- 告警推送（温度过高、湿度异常、光照突变等）

### 低功耗
- 支持深度睡眠模式（电池供电时）
- 可配置采样间隔（1s ~ 5min）

## 快速开始

```bash
# 1. 打印外壳
openscad -o enclosure.stl models/enclosure.scad

# 2. 组装模块（Core + Power + Sensor + Display 堆叠）

# 3. 烧录固件
cd ../../firmware
pio run -e env_sentinel -t upload
```

## 文件结构

```
environment-sentinel/
├── README.md           ← 本文件
├── manifest.yaml       ← 设计清单
└── models/
    ├── enclosure.scad  ← OpenSCAD 参数化外壳
    └── enclosure.stl   ← 可直接打印的 STL
```

## License

Apache-2.0 — 自由使用、修改、商用。
