# 01 — 标准一：组件包规范（Component Package Spec）

> RealWorldClaw 标准规范 · 编号 01
> 版本：v1.1 | 来源：realworldclaw-spec-v1.md §3

---

## 1. 目录结构

```
{component-id}/
├── manifest.yaml          ← 核心元数据（必须）
├── models/                ← 3D打印文件
│   ├── enclosure.stl
│   ├── lid.stl
│   └── ...
├── electronics/           ← 电路相关
│   ├── bom.yaml           ← 物料清单
│   ├── schematic.kicad    ← 电路图（可选）
│   └── wiring.md          ← 接线说明
├── firmware/              ← 固件代码
│   ├── src/
│   └── platformio.ini
├── agent/                 ← OpenClaw AI配置
│   ├── SOUL.md
│   └── skills/
├── docs/                  ← 文档
│   ├── assembly.md        ← 组装步骤
│   └── photos/            ← 实物照片
└── LICENSE
```

## 2. manifest.yaml 完整格式

```yaml
# ─── 基本信息 ───
id: temperature-monitor                    # 英文ID，全局唯一
version: 2.1.0                             # 语义化版本
display_name:
  en: "Temperature & Humidity Monitor"
  zh: "温湿度监控器"
description:
  en: "Indoor temperature and humidity monitoring robot"
  zh: "室内温湿度监控机器人"
author: contributor_name
license: MIT
tags: [sensor, temperature, humidity, indoor, esp32]

# ─── 能力声明 ───
capabilities:
  - temperature_sensing
  - humidity_sensing
  - data_reporting
  - led_status

# ─── 硬件需求 ───
hardware:
  compute: esp32-c3
  sensors:
    - model: DHT22
      interface: gpio
      pin: 4
  actuators: []
  power:
    type: usb-c
    voltage: 5V
    consumption: 0.3W
  estimated_cost:
    CNY: 35
    USD: 5

# ─── 打印信息 ───
printing:
  files:
    - path: models/enclosure.stl
      quantity: 1
    - path: models/lid.stl
      quantity: 1
  material: PLA
  layer_height: 0.2
  infill: 20
  supports: false
  estimated_time: "2h30m"
  estimated_filament: 45
  min_bed_size: [150, 150]
  print_orientation: "大平面朝下"

  printer_settings:
    nozzle_diameter: 0.4mm
    layer_height: 0.2mm
    first_layer_height: 0.3mm
    wall_loops: 3
    top_layers: 5
    bottom_layers: 4
    infill_pattern: gyroid
    print_speed: 80
    travel_speed: 150
    temperature:
      nozzle: 210
      bed: 60
    cooling:
      fan_speed: 100%
      min_layer_time: 10s

  support:
    needed: false
    type: "tree"
    interface_layers: 2
    support_angle: 45

  multi_part_assembly:
    - part: "body"
      file: "models/clawbie-body.stl"
      quantity: 1
      color: "任意"
      notes: "建议丝绸色PLA增加质感"

  quality_levels:
    draft:
      layer_height: 0.3mm
      infill: 10%
      time: "~1h"
    standard:
      layer_height: 0.2mm
      infill: 15%
      time: "~1.5h"
    fine:
      layer_height: 0.12mm
      infill: 20%
      time: "~3h"

# ─── 物理规格 ───
physical:
  module_size: 3U
  dimensions: [60, 40, 30]
  weight: 85
  mounting: m3-20mm-grid
  mounting_types: [desktop, wall_mount]
  protection: CF-P0

# ─── 电气接口 ───
electrical:
  logic_level: 3.3V
  interfaces:
    - type: i2c
      connector: JST-XH-4P
    - type: power
      connector: USB-C

# ─── 通信 ───
communication:
  protocol: mqtt
  topics:
    publish:
      - "rwc/{agent_id}/temperature-monitor/temperature"
    subscribe:
      - "rwc/{agent_id}/temperature-monitor/command"
  discovery: true

# ─── 软件 ───
software:
  firmware_platform: arduino
  dependencies:
    - name: DHT-sensor-library
      version: ">=1.4.0"
  openclaw_skill: temp-monitor-skill

# ─── 兼容性 ───
compatible_with:
  bases: [desktop-base-v1, wall-mount-v1]
  addons: [oled-display-module]

# ─── 完整度 ───
completeness:
  has_models: true
  has_wiring: true
  has_firmware: true
  has_agent: true
  has_docs: true
```

## 3. 版本管理

采用**语义化版本**（SemVer）：`主版本.次版本.补丁`
- 主版本变 = 不兼容的改动（物理尺寸变了、接口变了）
- 次版本变 = 新增功能，向下兼容
- 补丁变 = 修bug

## 4. 命名规范

- **ID**：小写英文+连字符 `temperature-monitor`
- **显示名**：支持多语言
- **ID全局唯一**，先到先得

## 5. 最低上架要求

- ✅ manifest.yaml 格式正确且必填字段完整
- ✅ 至少包含一个STL或固件
- ✅ LICENSE文件存在
- 完整度由星级自动标注：⭐(1-2项) ⭐⭐(3-4项) ⭐⭐⭐(5项全)
