# RealWorldClaw Core Module — 技术方案

> RealWorldClaw Team | 2026-02-21

## 概述

Core模块是RealWorldClaw系统的主控单元，负责：
- 管理3个RWC Bus端口，自动识别和驱动外设模块
- Wi-Fi/BLE无线连接
- MQTT上报到RealWorldClaw平台
- Web配置界面（AP模式）

## 主控选型

| 项目 | 规格 |
|------|------|
| 芯片 | ESP32-S3-WROOM-1 (N16R8) |
| CPU | 双核Xtensa LX7 @ 240MHz |
| SRAM | 512KB |
| Flash | 16MB |
| PSRAM | 8MB |
| 无线 | Wi-Fi 802.11 b/g/n + BLE 5.0 |
| USB | 原生USB-OTG (CDC) |
| 成本 | ¥15-20（模组）/ ¥25-30（DevKitC-1开发板） |

## 硬件方案：载板 + 开发板

**不自己画PCB**，用现成的ESP32-S3-DevKitC-1开发板 + 3D打印载板。

### 载板规格

- 尺寸：40×40mm（RWC 4U标准）
- 材料：3D打印 PLA/PETG
- 开发板通过2×20排针插入载板
- 载板上接口：
  - 3× JST-XH 8pin母座（RWC Bus Port 1/2/3）
  - 1× JST-PH 2pin（电池接口，接开发板5V/GND）
  - 4× M3螺丝孔（底部固定）

### 接线方案

载板内部用杜邦线/排线从开发板排针引出到JST-XH座：

```
DevKitC-1 排针 ──杜邦线──▶ 载板PCB/万能板 ──▶ JST-XH 8pin母座
```

实际上载板底部可以用一块40×40mm万能板（洞洞板），焊接JST-XH座和排针座，成本<¥5。

### 优势

- 零PCB设计成本
- 零SMD焊接
- 开发板可随时拔下更换
- 快速出原型，验证后再做集成PCB

## RWC Bus 标准

8pin JST-XH接口：

| Pin | 信号 | 说明 |
|-----|------|------|
| 1 | 5V | 电源 5V |
| 2 | 3V3 | 电源 3.3V |
| 3 | GND | 地 |
| 4 | SDA | I2C数据 / GPIO |
| 5 | SCL | I2C时钟 / GPIO |
| 6 | TX-MOSI | UART TX / SPI MOSI / GPIO |
| 7 | RX-MISO | UART RX / SPI MISO / GPIO |
| 8 | ID | 1-Wire模块识别线 |

## GPIO分配

详见 [pinout.md](pinout.md)

## 固件框架

- 框架：Arduino (PlatformIO)
- 协议栈：WiFi + MQTT + mDNS + WebServer
- 模块识别：1-Wire (DS18B20风格ROM码)

### 架构

```
main.cpp          → 初始化、主循环
rwc_bus.h/cpp     → RWC Bus端口驱动、1-Wire扫描
module_registry.h → 模块注册表（ID→驱动映射）
wifi_manager.h    → Wi-Fi连接管理（STA+AP）
mqtt_client.h     → MQTT客户端
```

### 启动流程

1. 初始化Serial (USB CDC)
2. 初始化3个RWC Bus端口
3. 扫描每个端口的ID线（1-Wire）
4. 根据模块ID加载驱动
5. 连接Wi-Fi（已配置→STA，未配置→AP模式）
6. 连接MQTT
7. 主循环：轮询模块数据 + 处理MQTT消息

## BOM（原型阶段）

| 物料 | 数量 | 单价 | 小计 |
|------|------|------|------|
| ESP32-S3-DevKitC-1 | 1 | ¥28 | ¥28 |
| JST-XH 8pin母座（弯针） | 3 | ¥0.5 | ¥1.5 |
| JST-PH 2pin母座 | 1 | ¥0.3 | ¥0.3 |
| 40×40mm万能板 | 1 | ¥2 | ¥2 |
| 2×20排母座 | 1 | ¥1 | ¥1 |
| M3×6螺丝+螺母 | 4 | ¥0.1 | ¥0.4 |
| 3D打印外壳 | 1 | ¥2 | ¥2 |
| **合计** | | | **¥35.2** |
