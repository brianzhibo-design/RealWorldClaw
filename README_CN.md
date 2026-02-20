中文 | [English](README.md)

# 🧱 RealWorldClaw

**开源模块化系统，让3D打印机变身智能硬件工厂。**

> 使命：让3D打印真正走进千家万户。

RealWorldClaw 不是一个产品，而是 **AI硬件的乐高系统**。标准化电子模块 + 3D打印结构件 = 无限可能的智能设备。

---

## 🤔 我们要解决什么问题？

3D打印机已经走进了很多家庭，但大多数人面临三个问题：

| 问题 | 现状 | RealWorldClaw 的解决方案 |
|------|------|--------------------------|
| **不知道打印什么** | 打完几个手办就吃灰 | 📦 **组件库** — 不断增长的参考设计，每个都有完整的物料清单和固件 |
| **打出来是死的** | 纯塑料件没有功能 | 🔌 **模块化系统** — 即插即用的电子模块赋予打印件生命 |
| **有需求没打印机** | 想要但买不起/没空间 | 🌐 **Maker Network** — 附近的创客帮你打印和组装 |

---

## ⚡ 工作原理

```
[标准模块] + [3D打印结构件] = [智能设备]
  (电子模块)    (社区设计)      (无限可能)
```

选一个参考设计，购买标准模块，打印结构件，磁吸拼装，刷入固件 —— 完成。

---

## 🧩 核心模块

RealWorldClaw 的核心是 **6 个标准化电子模块**，通过 RWC Bus 统一互联：

| 模块 | 名称 | 核心功能 | 关键规格 |
|:---:|------|---------|----------|
| 🧠 | **Core** | 主控 + WiFi/BLE + AI推理 | ESP32-S3, 8MB PSRAM |
| 🖥️ | **Display** | 彩色触摸屏 | 1.69" IPS, 240×280, 电容触摸 |
| 🔊 | **Audio** | 麦克风 + 扬声器 | I2S双向音频, 3W扬声器 |
| 🔋 | **Power** | 电池 + 充电管理 | 18650, USB-C PD, 电量监测 |
| ⚙️ | **Servo** | 舵机/电机驱动 | 最多4路PWM舵机, 2路直流电机 |
| 📡 | **Sensor** | 环境感知 | IMU + 温湿度 + 光线 + ToF |

> 每个模块都是独立的功能单元。只买你需要的，按需组合。

---

## 🔗 RWC Bus

**8-pin 磁吸接口，即插即用。**

模块之间通过 RWC Bus 标准连接——8pin 磁吸 pogo pin 接口，支持 I2C/SPI/UART 通信和供电。无需焊接，无需工具，啪嗒一声，连接完成。

```
RWC Bus 8-Pin 引脚定义:
┌──────────────────────┐
│ VCC SDA SCL TX RX IO1 IO2 GND │
└──────────────────────┘
```

- 磁吸对位，防反接
- 热插拔安全
- 模块间自动识别

---

## 🎨 参考设计

开箱即用的完整项目，从物料到固件全包含：

| 设计 | 模块成本 | 描述 | 难度 |
|------|:--------:|------|:----:|
| 🤖 **桌面AI助手** | ¥99 | 桌面AI助手，能听能说能看能动 | ⭐ |
| 🕷️ **六足行走者** | ¥88 | 六足步行机器人，自主导航 | ⭐⭐ |
| 🎵 *智能音箱* | *即将推出* | 模块化智能音箱 | ⭐ |
| 🌱 *植物监测站* | *即将推出* | 智能植物监测站 | ⭐ |

> 模块成本仅含电子标准件。3D打印结构件自行打印或通过 Maker Network 下单。

---

## 🛒 采购指南

所有电子元器件都能在国内轻松买到：

- **淘宝** — ESP32开发板、传感器模块、舵机等（推荐安信可、合宙、微雪官方店）
- **[立创商城](https://www.szlcsc.com/)** — 电阻电容、IC芯片等PCB级元件（起订量低、发货快）

> 📖 **详细采购清单**：[采购指南（中文）](docs/purchasing-guide.md) — 每个模块的完整BOM，含淘宝搜索关键词和参考价格。

---

## 🌐 Maker Network

一个连接 **打印者、组装者、设计者** 的去中心化网络：

| 角色 | 你做什么 | 你得到什么 |
|------|---------|-----------|
| 🖨️ **打印者** | 用你的闲置打印机帮别人打印结构件 | 按件计费收入 |
| 🔧 **组装者** | 帮不想动手的人组装成品 | 组装服务费 |
| 🎨 **设计者** | 设计新的参考设计并分享 | 设计下载分成 |

没有打印机？没关系。在 Maker Network 上找到你附近的创客，下单即可。

---

## 🚀 快速开始

```
1. 选一个参考设计          → designs/ 目录浏览
2. 购买模块（标准件清单）   → 每个设计都有 BOM.md
3. 打印结构件              → 下载 STL 自行打印，或通过 Maker Network 下单
4. 组装                    → 磁吸拼装，跟着图文教程走
5. 刷固件                  → USB-C 连接，一键烧录
```

```bash
# 克隆仓库
git clone https://github.com/brianzhibo-design/RealWorldClaw.git
cd RealWorldClaw

# 烧录固件到 Core 模块
cd firmware
pip install esptool
esptool.py --port /dev/ttyUSB0 write_flash 0x0 build/rwc-core.bin
```

---

## 📁 项目结构

```
realworldclaw/
├── hardware/        模块硬件文档 + 3D模型 + 原理图
├── firmware/        固件源码（ESP-IDF / Arduino）
├── designs/         参考设计（每个设计含 BOM + STL + 教程）
├── platform/        后端 API（Maker Network + 组件库）
├── frontend/        Web 前端
├── docs/            规范 + 架构文档
│   └── specs/       RWC Bus 标准 + 模块规范
└── tools/           开发工具 + 验证器
```

---

## 🗺️ 路线图

| 阶段 | 状态 | 重点 |
|------|------|------|
| **模块定义** | 🔄 进行中 | 6个核心模块规格定稿，RWC Bus 标准 |
| **首个参考设计** | 🔜 即将开始 | Desktop AI Assistant 完整实现 |
| **Maker Network MVP** | 📋 规划中 | 打印者注册、订单匹配、支付 |
| **组件库上线** | 📋 规划中 | 社区设计上传、浏览、评价 |
| **生态扩展** | 🔮 远期 | 更多模块、SDK、第三方设计者工具 |

---

## 🤝 参与贡献

我们欢迎所有形式的贡献：

- **设计新模块** — 扩展 RWC 模块生态
- **创建参考设计** — 设计新的智能设备并分享
- **改进标准** — 参与 RWC Bus 和模块规范的制定
- **加入 Maker Network** — 注册你的打印机，开始接单
- **分享你的作品** — 打印了什么？拍照发出来！

→ 详见 [CONTRIBUTING.md](CONTRIBUTING.md) *(即将推出)*

---

## 📄 开源协议

[MIT](LICENSE) — 随意创造，尽情发挥。

## 🔗 相关链接

- **官网：** [realworldclaw.com](https://realworldclaw.com) *(即将上线)*
- **技术规范：** [docs/specs/](docs/specs/)
- **更新日志：** [CHANGELOG.md](CHANGELOG.md)
- **采购指南：** [中文](docs/purchasing-guide.md) | [English](docs/purchasing-guide-en.md)

---

<p align="center">
  <strong>标准模块 + 3D打印结构件 = 无限可能</strong>
  <br>
  由 <a href="https://github.com/brianzhibo-design">羊村公司 YangCun Corp</a> 用 🧱 搭建
</p>

<p align="center">

![License](https://img.shields.io/badge/license-MIT-green)
![Modules](https://img.shields.io/badge/核心模块-6个-blue)
![RWC Bus](https://img.shields.io/badge/RWC%20Bus-8pin%20磁吸-orange)

</p>
