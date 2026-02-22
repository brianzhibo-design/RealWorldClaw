# RealWorldClaw 硬件规范深化文档 v1.0

> **组件包规范 + 物理接口规范 — 工程实施细则**
> 本文档是 clawforge-spec-v1.md 标准一、标准五的深化补充

---

## 目录

1. [manifest.yaml JSON Schema](#1-manifestyaml-json-schema)
2. [标准开孔尺寸大全](#2-标准开孔尺寸大全)
3. [线缆管理规范](#3-线缆管理规范)
4. [热管理方案](#4-热管理方案)
5. [防水密封实施方案](#5-防水密封实施方案)
6. [电磁兼容（EMC）注意事项](#6-电磁兼容emc注意事项)
7. [3D打印材料选型对比表](#7-3d打印材料选型对比表)
8. [模块组合模板](#8-模块组合模板)
9. [种子组件包 manifest.yaml 示例](#9-种子组件包-manifestyaml-示例)

---

## 1. manifest.yaml JSON Schema

以下为完整的 JSON Schema（Draft 2020-12），用于自动校验所有上传的 manifest.yaml。

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://realworldclaw.com/schemas/manifest/v1.0.0",
  "title": "RealWorldClaw Component Manifest",
  "description": "RealWorldClaw 组件包元数据规范 v1.0",
  "type": "object",
  "required": ["id", "version", "display_name", "description", "author", "license", "hardware", "printing", "physical"],
  "additionalProperties": false,

  "properties": {
    "id": {
      "type": "string",
      "pattern": "^[a-z][a-z0-9-]{2,63}$",
      "description": "全局唯一ID，小写英文+连字符，3-64字符，字母开头"
    },
    "version": {
      "type": "string",
      "pattern": "^(0|[1-9]\\d*)\\.(0|[1-9]\\d*)\\.(0|[1-9]\\d*)(-[a-zA-Z0-9.]+)?(\\+[a-zA-Z0-9.]+)?$",
      "description": "语义化版本号 SemVer 2.0"
    },
    "display_name": {
      "type": "object",
      "required": ["en"],
      "properties": {
        "en": { "type": "string", "minLength": 3, "maxLength": 100 },
        "zh": { "type": "string", "minLength": 2, "maxLength": 100 }
      },
      "additionalProperties": { "type": "string" }
    },
    "description": {
      "type": "object",
      "required": ["en"],
      "properties": {
        "en": { "type": "string", "minLength": 50, "maxLength": 2000 },
        "zh": { "type": "string", "minLength": 10, "maxLength": 2000 }
      },
      "additionalProperties": { "type": "string" }
    },
    "author": {
      "type": "string",
      "minLength": 1,
      "maxLength": 64
    },
    "license": {
      "type": "string",
      "enum": ["MIT", "Apache-2.0", "GPL-3.0", "LGPL-3.0", "BSD-2-Clause", "BSD-3-Clause", "CC-BY-4.0", "CC-BY-SA-4.0", "CC0-1.0", "CERN-OHL-S-2.0", "CERN-OHL-W-2.0", "CERN-OHL-P-2.0"]
    },
    "tags": {
      "type": "array",
      "items": { "type": "string", "pattern": "^[a-z0-9-]+$" },
      "minItems": 1,
      "maxItems": 20,
      "uniqueItems": true
    },

    "capabilities": {
      "type": "array",
      "items": { "type": "string", "pattern": "^[a-z_]+$" },
      "minItems": 1,
      "uniqueItems": true
    },

    "hardware": {
      "type": "object",
      "required": ["compute", "power"],
      "properties": {
        "compute": {
          "type": "string",
          "enum": ["esp32", "esp32-s3", "esp32-c3", "esp32-c6", "esp8266", "rpi-zero-2w", "rpi-4b", "rpi-5", "rpi-pico", "rpi-pico-w", "arduino-nano", "arduino-uno", "stm32f103", "nrf52840", "custom"],
          "description": "主控板型号"
        },
        "sensors": {
          "type": "array",
          "items": {
            "type": "object",
            "required": ["model", "interface"],
            "properties": {
              "model": { "type": "string" },
              "interface": { "type": "string", "enum": ["gpio", "i2c", "spi", "uart", "adc", "one-wire", "usb", "csi", "mipi"] },
              "pin": { "oneOf": [{ "type": "integer" }, { "type": "string" }, { "type": "array", "items": { "type": "integer" } }] },
              "address": { "type": "string", "pattern": "^0x[0-9a-fA-F]{2}$", "description": "I2C地址" },
              "bus": { "type": "integer", "description": "I2C/SPI总线号" },
              "voltage": { "type": "string" },
              "datasheet_url": { "type": "string", "format": "uri" }
            }
          }
        },
        "actuators": {
          "type": "array",
          "items": {
            "type": "object",
            "required": ["model", "type"],
            "properties": {
              "model": { "type": "string" },
              "type": { "type": "string", "enum": ["servo", "stepper", "dc-motor", "relay", "solenoid", "led-strip", "buzzer", "pump", "fan", "heater", "valve", "display", "speaker"] },
              "interface": { "type": "string" },
              "pin": { "oneOf": [{ "type": "integer" }, { "type": "string" }] },
              "voltage": { "type": "string" },
              "max_current": { "type": "string" }
            }
          }
        },
        "power": {
          "type": "object",
          "required": ["type", "voltage"],
          "properties": {
            "type": { "type": "string", "enum": ["usb-c", "usb-micro", "dc-barrel", "battery-lipo", "battery-18650", "battery-aa", "solar", "poe", "screw-terminal"] },
            "voltage": { "type": "string", "pattern": "^[0-9.]+(V|v)$" },
            "consumption": { "type": "string", "description": "典型功耗，如 0.3W" },
            "peak_consumption": { "type": "string", "description": "峰值功耗" },
            "battery_capacity": { "type": "string", "description": "电池容量 mAh" },
            "battery_life": { "type": "string", "description": "预计续航时间" },
            "sleep_consumption": { "type": "string", "description": "深度睡眠功耗" }
          }
        },
        "estimated_cost": {
          "type": "object",
          "properties": {
            "CNY": { "type": "number", "minimum": 0 },
            "USD": { "type": "number", "minimum": 0 }
          }
        }
      }
    },

    "printing": {
      "type": "object",
      "required": ["files", "material"],
      "properties": {
        "files": {
          "type": "array",
          "items": {
            "type": "object",
            "required": ["path", "quantity"],
            "properties": {
              "path": { "type": "string", "pattern": "^models/.+\\.(stl|3mf|step)$" },
              "quantity": { "type": "integer", "minimum": 1, "maximum": 20 },
              "material_override": { "type": "string" },
              "color": { "type": "string" },
              "notes": { "type": "string" }
            }
          },
          "minItems": 1
        },
        "material": {
          "type": "string",
          "enum": ["PLA", "PLA+", "PETG", "ASA", "ABS", "TPU", "Nylon", "PC", "PETG-CF", "PLA-CF", "Nylon-CF"]
        },
        "layer_height": { "type": "string", "pattern": "^[0-9.]+mm$" },
        "infill": { "type": "string", "pattern": "^[0-9]+%$" },
        "supports": { "type": "boolean" },
        "estimated_time": { "type": "string", "pattern": "^[0-9]+h([0-9]+m)?$" },
        "estimated_filament": { "type": "string", "pattern": "^[0-9]+g$" },
        "min_bed_size": {
          "type": "array",
          "items": { "type": "integer", "minimum": 50, "maximum": 500 },
          "minItems": 2, "maxItems": 2,
          "description": "[宽, 深] mm"
        },
        "print_orientation": { "type": "string" },
        "nozzle_size": { "type": "string", "default": "0.4mm" },
        "print_speed": { "type": "string", "description": "推荐打印速度" },
        "bed_temp": { "type": "string" },
        "nozzle_temp": { "type": "string" }
      }
    },

    "physical": {
      "type": "object",
      "required": ["module_size", "dimensions"],
      "properties": {
        "module_size": { "type": "string", "enum": ["1U", "2U", "3U", "4U", "6U", "8U", "custom"] },
        "dimensions": {
          "type": "array",
          "items": { "type": "number", "minimum": 5, "maximum": 500 },
          "minItems": 3, "maxItems": 3,
          "description": "[长, 宽, 高] mm"
        },
        "weight": { "type": "string", "pattern": "^[0-9]+g$" },
        "mounting": { "type": "string" },
        "mounting_types": {
          "type": "array",
          "items": { "type": "string", "enum": ["desktop", "wall_mount", "din_rail", "magnetic", "clamp", "pole_mount", "ceiling", "vesa_75", "adhesive", "screw_plate"] }
        },
        "protection": { "type": "string", "enum": ["CF-P0", "CF-P1", "CF-P2", "CF-P3"] }
      }
    },

    "electrical": {
      "type": "object",
      "properties": {
        "logic_level": { "type": "string", "enum": ["3.3V", "5V"] },
        "interfaces": {
          "type": "array",
          "items": {
            "type": "object",
            "required": ["type", "connector"],
            "properties": {
              "type": { "type": "string", "enum": ["i2c", "spi", "uart", "gpio", "power", "usb", "can", "rs485", "one-wire", "analog"] },
              "connector": { "type": "string" },
              "pinout": { "type": "array", "items": { "type": "string" } },
              "direction": { "type": "string", "enum": ["in", "out", "bidirectional"] }
            }
          }
        }
      }
    },

    "communication": {
      "type": "object",
      "properties": {
        "protocol": { "type": "string", "enum": ["mqtt", "http", "websocket", "ble", "zigbee", "lorawan", "espnow", "matter"] },
        "topics": {
          "type": "object",
          "properties": {
            "publish": { "type": "array", "items": { "type": "string" } },
            "subscribe": { "type": "array", "items": { "type": "string" } }
          }
        },
        "discovery": { "type": "boolean" },
        "ota_update": { "type": "boolean", "description": "是否支持OTA远程更新" }
      }
    },

    "software": {
      "type": "object",
      "properties": {
        "firmware_platform": { "type": "string", "enum": ["arduino", "espidf", "micropython", "circuitpython", "zephyr", "platformio", "esphome", "tasmota", "linux"] },
        "dependencies": {
          "type": "array",
          "items": {
            "type": "object",
            "required": ["name", "version"],
            "properties": {
              "name": { "type": "string" },
              "version": { "type": "string" }
            },
            "additionalProperties": false
          }
        },
        "openclaw_skill": { "type": "string" },
        "build_command": { "type": "string", "description": "编译命令" },
        "flash_command": { "type": "string", "description": "烧录命令" }
      }
    },

    "compatible_with": {
      "type": "object",
      "properties": {
        "bases": { "type": "array", "items": { "type": "string" } },
        "addons": { "type": "array", "items": { "type": "string" } },
        "incompatible": { "type": "array", "items": { "type": "string" }, "description": "已知不兼容的组件" }
      }
    },

    "completeness": {
      "type": "object",
      "properties": {
        "has_models": { "type": "boolean" },
        "has_wiring": { "type": "boolean" },
        "has_firmware": { "type": "boolean" },
        "has_agent": { "type": "boolean" },
        "has_docs": { "type": "boolean" }
      }
    },

    "thermal": {
      "type": "object",
      "description": "热管理信息（功耗>1W时建议填写）",
      "properties": {
        "class": { "type": "string", "enum": ["passive-none", "passive-fins", "passive-heatsink", "active-fan", "active-heatpipe"] },
        "max_ambient": { "type": "string", "description": "最高环境温度" },
        "vent_area": { "type": "string", "description": "通风孔总面积" }
      }
    },

    "waterproof": {
      "type": "object",
      "description": "防水信息（CF-P1及以上时填写）",
      "properties": {
        "seal_type": { "type": "string", "enum": ["none", "gasket", "oring", "potting", "conformal-coating"] },
        "cable_gland": { "type": "string" },
        "drain_holes": { "type": "boolean" }
      }
    }
  }
}
```

### 1.1 Schema 验证规则说明

| 字段 | 验证规则 | 说明 |
|------|----------|------|
| `id` | `^[a-z][a-z0-9-]{2,63}$` | 字母开头，小写+数字+连字符，3-64字符 |
| `version` | SemVer 2.0 正则 | 必须是语义化版本，支持预发布和构建元数据 |
| `display_name.en` | 必填，3-100字符 | 英文名必须有 |
| `description.en` | 必填，≥50字符 | 防止空描述，保证描述质量 |
| `license` | 枚举白名单 | 只允许常见开源协议 + CERN硬件协议 |
| `tags` | 1-20个，小写+数字 | 统一tag格式 |
| `hardware.compute` | 枚举白名单 | 主流开发板型号 |
| `printing.files[].path` | `^models/.+\.(stl\|3mf\|step)$` | 必须在models/目录下 |
| `physical.dimensions` | 3元素数组，5-500mm | 防止不合理尺寸 |
| `physical.protection` | CF-P0 ~ CF-P3 | RealWorldClaw防护等级 |

### 1.2 验证命令

```bash
# 安装验证工具
pip install check-jsonschema pyyaml

# 验证单个manifest
check-jsonschema --schemafile clawforge-manifest-schema.json manifest.yaml

# CI自动验证（GitHub Actions示例）
- name: Validate manifest
  run: |
    pip install check-jsonschema pyyaml
    python -c "import yaml,json; json.dump(yaml.safe_load(open('manifest.yaml')),open('/tmp/m.json','w'))"
    check-jsonschema --schemafile schemas/manifest-v1.json /tmp/m.json
```

---

## 2. 标准开孔尺寸大全

### 2.1 USB及电源接口

| 接口 | 开孔尺寸 (W×H) | 倒角 | 备注 |
|------|----------------|------|------|
| USB-C | 9.2 × 3.4 mm | R0.5 | 最常用，推荐默认电源 |
| Micro-USB | 8.0 × 2.8 mm | R0.3 | 旧版ESP32常见 |
| USB-A 母座 | 13.2 × 5.8 mm | R0.5 | RPi等主机端 |
| DC Barrel 5.5/2.1 | Φ8.2 mm | - | 12V设备常用 |
| DC Barrel 5.5/2.5 | Φ8.2 mm | - | 同上，注意内径 |
| XT30 | 10.0 × 8.0 mm | R1.0 | 大电流应用 |
| XT60 | 16.0 × 12.0 mm | R1.0 | 电动工具级 |
| 5.08mm接线端子(2P) | 12.0 × 9.0 mm | - | 工业电源 |

### 2.2 传感器开孔

| 传感器类型 | 开孔尺寸 | 安装方式 | 常见型号 |
|-----------|----------|----------|---------|
| 温湿度探头 (通风) | 8.0 × 8.0 mm 通风格栅 | 内嵌卡扣 | DHT22, SHT30/31, AHT20 |
| 气压传感器 | Φ3.0 mm 透气孔 | PCB板载 | BMP280, BME280 |
| 空气质量 (PM2.5) | 28.0 × 20.0 mm | M3螺钉固定 | PMS5003, PMS7003 |
| 空气质量 (VOC) | 10.0 × 10.0 mm 通风格栅 | PCB板载 | SGP30, CCS811, ENS160 |
| CO2传感器 (NDIR) | 35.0 × 22.0 mm | M2.5螺钉 | SCD40/41, MH-Z19B |
| PIR人体感应 | Φ24.0 mm (大), Φ12.0 mm (小) | 卡扣/螺纹 | HC-SR501, AM312 |
| 超声波测距 | 2×Φ16.5 mm, 中心距26mm | 卡扣 | HC-SR04, US-100 |
| 毫米波雷达 | 25.0 × 20.0 mm | 前面板开窗（无金属遮挡） | LD2410, HLK-LD2450 |
| 光照度传感器 | Φ5.0 mm 透光窗 | PCB板载 | BH1750, TSL2561 |
| 土壤湿度探针线出口 | Φ6.0 mm + 线缆密封 | 外接探针 | 电容式土壤湿度 |
| 水位传感器 | Φ6.0 mm 线缆出口 | 外接探头 | 浮球/电极式 |
| 烟雾传感器 | 15.0 × 10.0 mm 通风格栅 | 内嵌 | MQ-2, MQ-135 |
| 噪声/声音 | Φ4.0 mm 拾音孔 | PCB板载 | INMP441, MAX9814 |

### 2.3 摄像头模块

| 摄像头 | 开孔尺寸 | 安装方式 | 分辨率 | 适用主控 |
|--------|----------|----------|--------|---------|
| OV2640 (裸板) | Φ8.0 mm 镜头孔 + 22×18mm PCB窗 | 双面胶/M2螺钉 | 2MP | ESP32-CAM |
| ESP32-CAM 整板 | 27.5 × 40.5 mm | 排针插槽 | 2MP | 自带ESP32 |
| OV5640 (CSI) | Φ8.5 mm 镜头孔 | M2螺钉 | 5MP | RPi |
| RPi Camera V2 | 25.0 × 24.0 mm + Φ8.5mm镜头孔 | 4×M2, 21mm间距 | 8MP | RPi |
| RPi Camera V3 | 25.0 × 24.0 mm + Φ9.0mm镜头孔 | 4×M2, 21mm间距 | 12MP | RPi |
| RPi HQ Camera | Φ38.0 mm 镜头通孔 | 4×M2.5 | 12MP | RPi |
| USB 摄像头 (通用) | Φ16.0~20.0 mm | 夹持/螺纹 | 各种 | 任意USB主机 |

### 2.4 显示屏

| 显示屏 | 开孔/窗口尺寸 | 安装方式 | 接口 |
|--------|--------------|----------|------|
| 0.96" OLED (SSD1306) | 26.0 × 16.0 mm 可视窗 | 4pin排针 + 热熔螺母 | I2C |
| 1.3" OLED | 34.0 × 20.0 mm 可视窗 | 同上 | I2C/SPI |
| 1.44" TFT (ST7735) | 32.0 × 28.0 mm 可视窗 | M2螺钉 | SPI |
| 1.8" TFT | 38.0 × 32.0 mm 可视窗 | M2螺钉 | SPI |
| 2.4" TFT (ILI9341) | 54.0 × 40.0 mm 可视窗 | 排针 + M3侧固定 | SPI |
| 2.8" TFT 带触摸 | 62.0 × 46.0 mm 可视窗 | M3四角固定 | SPI |
| 3.5" TFT (RPi) | 78.0 × 56.0 mm 可视窗 | GPIO排针直插 | SPI/DPI |
| E-Ink 2.9" | 72.0 × 32.0 mm 可视窗 | 卡槽 + 双面胶 | SPI |
| E-Ink 4.2" | 92.0 × 68.0 mm 可视窗 | M2.5四角 | SPI |
| LED矩阵 8×8 | 33.0 × 33.0 mm | 排针 | I2C(HT16K33) |
| 7段数码管 4位 | 42.0 × 24.0 mm | 排针 | I2C(TM1637) |

### 2.5 按钮/开关/LED

| 元件 | 开孔尺寸 | 备注 |
|------|----------|------|
| 3mm LED | Φ3.2 mm | 指示灯 |
| 5mm LED | Φ5.2 mm | 状态灯 |
| WS2812B (单颗) | 5.5 × 5.5 mm 嵌入槽 | RGB |
| 6mm 轻触按钮 | Φ6.2 mm | 复位/配置 |
| 12mm 轻触按钮 | Φ12.5 mm | 主按钮 |
| 16mm 金属按钮 | Φ16.2 mm | 防水按钮 |
| 19mm 金属按钮 | Φ19.2 mm | 带灯按钮 |
| 拨动开关 (小) | 8.0 × 4.0 mm | 电源 |
| 船型开关 | 21.0 × 15.0 mm | 大电流电源 |
| 电位器 Φ6mm | Φ7.0 mm 轴孔 | 调节旋钮 |

### 2.6 通信模块

| 模块 | 开孔/安装尺寸 | 备注 |
|------|--------------|------|
| SMA天线座 | Φ6.5 mm | WiFi/LoRa外置天线 |
| IPEX转SMA尾线出口 | Φ6.5 mm | 同上 |
| RJ45网口 | 16.5 × 14.0 mm | 有线以太网 |
| SIM卡槽 (nano) | 13.0 × 9.0 mm 内嵌 | 4G模块 |
| LoRa模块 (Ra-01/SX1278) | 17.0 × 16.0 mm PCB窗 | 安装孔M2 |
| GPS天线 (陶瓷) | 25.0 × 25.0 mm 顶面窗 | 需朝天 |

### 2.7 通风格栅标准

```yaml
ventilation_grilles:
  small:                          # 传感器通风
    pattern: 直线栅格
    slot_width: 1.5mm
    slot_spacing: 2.0mm
    total_area: ≥50mm²
    
  medium:                         # 主动散热进风
    pattern: 蜂窝六角
    cell_size: 5.0mm
    wall_width: 1.2mm
    total_area: ≥200mm²
    
  large:                          # 风扇安装口
    size: 按风扇尺寸 (25/30/40mm)
    pattern: 同心圆/蜂窝
    screw_holes: 对应风扇规格
    
  防虫网:
    mesh_size: 1.0mm
    material: 不锈钢网或尼龙网
    固定方式: 压入槽或胶粘
```

---

## 3. 线缆管理规范

### 3.1 束线方式

| 方式 | 适用场景 | 规格 | 优缺点 |
|------|----------|------|--------|
| 尼龙扎带 | 固定整束线缆 | 2.5×100mm / 3.6×150mm | 简单可靠，一次性 |
| 可重复扎带 | 需频繁调整 | 同上，带释放扣 | 贵但可复用 |
| 线缆槽（打印） | 外壳内走线 | 5×5mm / 8×8mm 截面 | 整洁，需设计到外壳 |
| 线夹（打印） | 固定在壁面 | 适配Φ3~8mm线缆 | 可打印一体化 |
| 螺旋缠绕管 | 多根线束 | Φ6/8/10mm | 灵活，可后加 |
| 热缩管 | 接头保护 | Φ3/5/8mm, 2:1收缩 | 绝缘+固定 |
| 编织网管 | 美观+保护 | Φ4/6/8mm | 高颜值 |
| 3D打印线卡 | 内部走线固定 | 一体成型 | 推荐首选方案 |

### 3.2 最小弯曲半径

| 线缆类型 | 最小弯曲半径 | 说明 |
|----------|-------------|------|
| 杜邦线 (单根) | 5mm | 柔软，但反复弯折易断 |
| JST-XH连接线 | 10mm | 线径0.5mm² |
| 排线 (FPC/FFC) | 3mm (动态), 1mm (静态) | 不可折死 |
| USB线 | 15mm | 较粗，注意预留空间 |
| 硅胶线 16AWG | 8mm | 耐弯折，推荐电源线 |
| 硅胶线 22AWG | 5mm | 信号线 |
| 硅胶线 26AWG | 3mm | 细信号线 |
| 同轴线 (SMA) | 15mm | 天线馈线，不可压扁 |
| CAT5e网线 | 25mm | 较硬 |
| CSI排线 (RPi摄像头) | 5mm (静态) | 极脆弱，不可折叠 |

### 3.3 线缆管理设计规则

```yaml
cable_management_rules:
  # 外壳设计
  internal_routing:
    - 所有线缆路径需在CAD阶段规划
    - 预留线槽或夹持点，间距≤50mm
    - 线缆不得接触发热元件（保持≥5mm间距）
    - 为后续维护预留可拆卸路径
    
  # 线长管理
  cable_lengths:
    - 内部连线预留10-15%冗余（便于装配和维护）
    - 外部探针线最短300mm，推荐500mm
    - 不允许线缆承受拉力（必须有应力释放）
    
  # 接口位置
  connector_placement:
    - USB/电源口统一放置在底部或背面
    - 传感器线缆出口就近传感器位置
    - 同类接口并排排列，间距≥10mm
    - 必须有防呆设计（不同接口用不同型号/颜色）
    
  # 应力释放
  strain_relief:
    - 所有外部线缆出口必须有应力释放
    - 方案A：线缆夹（打印或购买）
    - 方案B：线缆打结（简单但不专业）
    - 方案C：热缩管+热熔胶（防水场景推荐）
    - 方案D：防水电缆头（户外必须）
```

### 3.4 标准线缆颜色（扩展）

```yaml
wire_colors_extended:
  # 电源
  red:      VCC / V+
  black:    GND / V-
  orange:   12V (区分于5V/3.3V)
  
  # I2C
  yellow:   SDA
  white:    SCL
  
  # UART
  green:    TX
  blue:     RX
  
  # SPI
  yellow:   MOSI
  white:    MISO
  purple:   SCK
  gray:     CS
  
  # GPIO
  green:    通用信号线
  brown:    模拟信号/ADC
```

---

## 4. 热管理方案

### 4.1 功耗等级与散热策略

| 功耗等级 | 功耗范围 | 散热方案 | 典型设备 | 通风要求 |
|----------|---------|---------|---------|---------|
| L0 超低功耗 | <0.5W | 无需散热 | ESP32深度睡眠, 纯传感器 | 无 |
| L1 低功耗 | 0.5-2W | 被动散热，自然对流 | ESP32持续运行, 小型OLED | 外壳顶部2-4个Φ3mm通气孔 |
| L2 中等功耗 | 2-5W | 散热片 + 通风设计 | RPi Zero 2W, ESP32-CAM视频流 | 底部+顶部格栅对流 |
| L3 较高功耗 | 5-10W | 散热片 + 25/30mm风扇 | RPi 4B空载, LED灯带驱动 | 进风+出风口，强制对流 |
| L4 高功耗 | 10-20W | 大面积散热片 + 40mm风扇 | RPi 4B满载, 多路舵机 | 全通风设计 + 温控风扇 |
| L5 超高功耗 | >20W | 热管/均热板 + 双风扇 | RPi 5 + 外设, 电机驱动板 | 独立风道 |

### 4.2 散热元件选型

```yaml
heatsinks:
  esp32_passive:
    size: 14×14×6mm
    material: 铝
    thermal_tape: 导热硅胶垫 0.5mm
    max_dissipation: ~1.5W
    
  rpi_standard:
    size: 按SoC尺寸 (15×15mm 或定制)
    material: 铝/铜
    thermal_tape: 导热硅脂
    max_dissipation: ~3W (被动), ~8W (加风扇)
    
  rpi_armor_case:
    type: 全金属外壳散热
    material: 铝合金 CNC
    max_dissipation: ~10W (被动)
    note: 非3D打印方案，采购件

fans:
  25mm:
    voltage: 5V
    current: ~0.1A
    noise: ~20dB
    airflow: ~2 CFM
    mounting: 2×M2, 20mm间距
    use: ESP32-CAM长时间视频流
    
  30mm:
    voltage: 5V
    current: ~0.15A
    noise: ~25dB
    airflow: ~4 CFM
    mounting: 4×M3, 24mm间距
    use: RPi Zero 2W 高负载
    
  40mm:
    voltage: 5V/12V
    current: ~0.2A
    noise: ~28dB
    airflow: ~7 CFM
    mounting: 4×M3, 32mm间距
    use: RPi 4B/5
```

### 4.3 热设计规则

```yaml
thermal_design_rules:
  # 通风口设计
  ventilation:
    - 进风口面积 ≥ 出风口面积（正压设计，防灰尘）
    - 热空气上升：进风口在底部/侧面，出风口在顶部
    - 通风口总面积 ≥ 风扇截面积的80%
    - 添加防虫网（户外场景）
    
  # 热隔离
  thermal_isolation:
    - 发热元件与PLA外壳间隔 ≥ 3mm（PLA玻璃转化温度~60°C）
    - 使用PETG/ASA外壳时可缩短到 ≥ 1.5mm
    - 在散热片和塑料壁之间添加隔热垫（高功耗场景）
    
  # 温控风扇
  fan_control:
    - 建议用PWM控制风扇转速
    - 阈值：<40°C停转, 40-60°C线性调速, >60°C全速
    - ESP32 GPIO + MOSFET驱动
    - 固件中实现温度读取 + PID控制

  # 打印材料温度限制
  material_temp_limits:
    PLA:  "持续<50°C, 峰值<60°C"
    PLA+: "持续<55°C, 峰值<65°C"
    PETG: "持续<70°C, 峰值<80°C"
    ASA:  "持续<85°C, 峰值<95°C"
    ABS:  "持续<90°C, 峰值<100°C"
    Nylon: "持续<100°C, 峰值<120°C"
    PC:   "持续<120°C, 峰值<140°C"
```

---

## 5. 防水密封实施方案

### 5.1 密封等级对应方案

| 防护等级 | 密封方案 | 适用场景 | 成本 |
|---------|---------|---------|------|
| CF-P0 | 无密封 | 室内干燥环境 | ¥0 |
| CF-P1 | TPU密封圈 + 盖板压紧 | 室内潮湿（厨房/浴室附近） | ¥2-5 |
| CF-P2 | 硅胶O型圈 + 电缆防水头 + 排水孔 | 半户外（有遮挡的阳台） | ¥10-20 |
| CF-P3 | 双道密封 + 灌封胶 + IP65防水头 | 全户外 | ¥30-50 |

### 5.2 TPU密封圈规格（3D打印）

```yaml
tpu_gasket:
  material: TPU 95A（Shore A 95）
  print_settings:
    nozzle_temp: 220-230°C
    bed_temp: 50°C
    speed: 20-30mm/s
    retraction: 最小化
    layer_height: 0.2mm
    
  # 标准截面规格（矩形截面密封条）
  profiles:
    small:
      width: 2.0mm
      height: 1.5mm
      compression: 20-30%       # 安装后压缩率
      use: 小型传感器盖板
      
    medium:
      width: 3.0mm
      height: 2.0mm
      compression: 20-30%
      use: 标准模块盖板
      
    large:
      width: 4.0mm
      height: 3.0mm
      compression: 20-30%
      use: 大型模块、户外外壳
      
  # 密封槽设计
  groove_design:
    # 槽宽 = 密封条宽度 + 0.2mm（装入间隙）
    # 槽深 = 密封条高度 × 70%（保证30%压缩）
    small_groove:  "宽2.2mm × 深1.05mm"
    medium_groove: "宽3.2mm × 深1.4mm"
    large_groove:  "宽4.2mm × 深2.1mm"
    
    # 转角设计
    corner_radius: "≥ 密封条宽度的2倍"
    small_corner: "R4.0mm"
    medium_corner: "R6.0mm"
    large_corner: "R8.0mm"
```

### 5.3 O型圈规格（采购标准件）

```yaml
o_rings:
  # 线径（截面直径）
  cord_diameters: [1.5, 2.0, 2.5, 3.0]mm
  
  # 常用内径（按外壳尺寸选择）
  standard_sizes:
    - id: 20mm, cord: 1.5mm    # 1U模块
    - id: 30mm, cord: 2.0mm    # 2U模块
    - id: 45mm, cord: 2.0mm    # 3U模块
    - id: 60mm, cord: 2.5mm    # 4U模块
    - id: 80mm, cord: 3.0mm    # 6U模块
    
  material:
    silicone: "耐温-60~200°C, 食品级可选, 推荐首选"
    nbr: "耐油, 耐温-30~120°C, 适合有油污场景"
    epdm: "耐候, 耐温-50~150°C, 户外推荐"
    
  groove_design:
    # 沟槽宽度 = 线径 × 1.4
    # 沟槽深度 = 线径 × 0.75（径向密封）
    # 压缩率 15-25%
    example_2mm:
      groove_width: 2.8mm
      groove_depth: 1.5mm
```

### 5.4 电缆防水头型号

| 型号 | 螺纹 | 适配线径 | IP等级 | 适用场景 | 参考价 |
|------|------|---------|--------|---------|--------|
| PG7 | M12×1.5 | Φ3-6.5mm | IP68 | 传感器细线 | ¥0.5 |
| PG9 | M15×1.5 | Φ4-8mm | IP68 | USB线, 普通线缆 | ¥0.6 |
| PG11 | M18×1.5 | Φ5-10mm | IP68 | 粗电源线 | ¥0.8 |
| PG13.5 | M20×1.5 | Φ6-12mm | IP68 | 多芯线束 | ¥1.0 |
| PG16 | M22×1.5 | Φ10-14mm | IP68 | 大线束/网线 | ¥1.2 |
| M12圆形连接器 | M12 | 4/5/8pin | IP67 | 工业级传感器即插即拔 | ¥5-15 |
| SP13 航空插头 | - | 2-9pin | IP68 | 快速插拔防水 | ¥3-8 |

```yaml
# 外壳开孔设计
cable_gland_holes:
  PG7:   Φ12.5mm
  PG9:   Φ15.5mm
  PG11:  Φ18.5mm
  PG13.5: Φ20.5mm
  PG16:  Φ22.5mm
```

### 5.5 排水与透气

```yaml
drainage:
  drain_holes:
    diameter: 3.0mm
    position: 最低点
    quantity: 2个（防堵塞冗余）
    防虫: 不锈钢网覆盖
    
  breather_valve:
    purpose: 平衡内外气压（防止温差导致吸水）
    type: PTFE透气膜（Gore-Tex型）
    diameter: Φ8-12mm（M8/M12螺纹）
    features: 透气不透水
    use: CF-P2/P3等级户外设备
    reference: "淘宝搜'防水透气阀 M12'"
```

---

## 6. 电磁兼容（EMC）注意事项

### 6.1 模块间干扰源分析

| 干扰源 | 频段 | 影响 | 常见于 |
|--------|------|------|--------|
| WiFi模块 | 2.4GHz / 5GHz | 干扰BLE/ZigBee | ESP32, RPi |
| 开关电源 | 50kHz-2MHz | 传感器ADC噪声 | DC-DC降压模块 |
| PWM驱动 | 1-100kHz | 传感器读数漂移 | 舵机/电机/LED调光 |
| SPI高速时钟 | 1-40MHz | 辐射发射 | 屏幕/SD卡 |
| LED灯带 (WS2812) | 800kHz数据 | I2C干扰 | 灯光模块 |

### 6.2 PCB/布线级措施

```yaml
emc_wiring_rules:
  # 分离原则
  separation:
    - 电源线和信号线分开走线，间距≥10mm
    - 强电（12V电机）和弱电（3.3V传感器）物理隔离
    - WiFi天线区域（距天线20mm内）不走其他线缆
    
  # 接地
  grounding:
    - 模块间共地线尽量短粗（≤50mm, ≥22AWG）
    - 模拟传感器单独接地（星型接地）
    - 金属外壳（如果有）连接到GND
    
  # 滤波
  filtering:
    - ADC输入端加100nF去耦电容
    - 电源输入加100μF电解 + 100nF陶瓷
    - I2C长线（>20cm）加端接电阻（2.2kΩ上拉）
    - UART长线（>30cm）考虑RS485转换
    
  # 屏蔽
  shielding:
    - 敏感模拟传感器用铜箔胶带包裹（接GND）
    - WiFi/BLE模块避免被金属件遮挡
    - 摄像头排线用带屏蔽层的FPC
```

### 6.3 3D打印外壳EMC设计

```yaml
enclosure_emc:
  # PLA/PETG 塑料外壳（无屏蔽能力）
  plastic_enclosure:
    - 不阻挡WiFi/BLE/LoRa信号（优点）
    - 不提供EMI屏蔽（缺点）
    - 内部加铜箔屏蔽贴片做局部屏蔽
    
  # 导电涂料方案（如需全屏蔽）
  conductive_coating:
    product: "镍基导电喷漆"
    application: 外壳内壁均匀喷涂
    thickness: 20-50μm
    effectiveness: 20-40dB@1GHz
    cost: "¥50/罐, 够喷10-20个外壳"
    
  # 实用建议
  practical_tips:
    - 大多数RealWorldClaw场景不需要严格EMC（非CE认证产品）
    - 优先通过布线和滤波解决干扰问题
    - 如果WiFi信号差，检查天线附近是否有金属件遮挡
    - 舵机/电机加续流二极管（1N4007）抑制反电动势
    - DC-DC模块选择屏蔽型（带金属罩），远离传感器
```

### 6.4 常见问题与解决

| 现象 | 可能原因 | 解决方案 |
|------|---------|---------|
| 温度传感器读数跳变 | DC-DC开关噪声 | 传感器供电加LC滤波，或用LDO |
| WiFi频繁断连 | 天线被遮挡/干扰 | 天线朝外，远离金属和电机线 |
| I2C通信失败 | 线缆过长/干扰 | 加上拉电阻，缩短线缆，加屏蔽 |
| ADC读数不稳定 | 电源纹波大 | 参考电压加滤波，多次采样取平均 |
| 舵机抖动 | 电源不足/干扰 | 舵机独立供电+大电容(470μF) |
| 屏幕花屏 | SPI信号干扰 | 缩短SPI线缆，降速，加去耦电容 |

---

## 7. 3D打印材料选型对比表

### 7.1 综合对比

| 属性 | PLA | PLA+ | PETG | ASA | ABS | TPU 95A | Nylon | PC | PETG-CF | PLA-CF |
|------|-----|------|------|-----|-----|---------|-------|-----|---------|--------|
| **打印难度** | ⭐ | ⭐ | ⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐ |
| **喷嘴温度** | 190-220°C | 200-230°C | 230-250°C | 240-260°C | 240-260°C | 220-240°C | 250-270°C | 270-310°C | 240-260°C | 200-230°C |
| **热床温度** | 0-60°C | 0-60°C | 70-80°C | 90-110°C | 90-110°C | 40-60°C | 70-90°C | 100-120°C | 70-80°C | 0-60°C |
| **需要全包围** | ❌ | ❌ | ❌ | ✅推荐 | ✅必须 | ❌ | ✅推荐 | ✅必须 | ❌ | ❌ |
| **耐温(持续)** | ~50°C | ~55°C | ~70°C | ~85°C | ~90°C | ~60°C | ~100°C | ~120°C | ~75°C | ~55°C |
| **强度(拉伸)** | 中 | 中高 | 高 | 高 | 高 | 低(弹性) | 很高 | 很高 | 很高 | 高 |
| **韧性(抗冲击)** | 低(脆) | 中 | 高 | 高 | 中高 | 很高 | 很高 | 高 | 中高 | 中 |
| **抗UV/耐候** | ❌差 | ❌差 | ⚠️中 | ✅优秀 | ⚠️中 | ⚠️中 | ⚠️中 | ✅良好 | ✅良好 | ❌差 |
| **耐化学品** | 差 | 差 | 良好 | 良好 | 良好 | 良好 | 优秀 | 优秀 | 良好 | 差 |
| **精度** | 优秀 | 优秀 | 良好 | 良好 | 中(翘曲) | 差(弹性) | 中(吸潮) | 中(翘曲) | 优秀 | 优秀 |
| **层间附着** | 中 | 良好 | 优秀 | 良好 | 良好 | 优秀 | 优秀 | 优秀 | 优秀 | 良好 |
| **价格(¥/kg)** | 50-80 | 60-100 | 80-120 | 100-150 | 70-100 | 120-200 | 200-400 | 200-350 | 150-250 | 100-180 |
| **硬化喷嘴** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅必须 | ✅必须 |

### 7.2 RealWorldClaw 防护等级 → 材料推荐

| 防护等级 | 首选材料 | 备选 | 禁用 |
|---------|---------|------|------|
| CF-P0 (室内基础) | **PLA** | PLA+, PETG | - |
| CF-P1 (室内防溅) | **PETG** | PLA+ | PLA(不耐湿热) |
| CF-P2 (户外基础) | **ASA** | PETG(短期) | PLA, PLA+ |
| CF-P3 (户外全天候) | **ASA** | Nylon(高强度需求) | PLA, PETG |
| 弹性件/密封圈 | **TPU 95A** | TPU 85A(更软) | 硬质材料 |
| 高温环境(>80°C) | **PC** | Nylon | PLA, PLA+, PETG |
| 结构承重件 | **PETG-CF** | Nylon, PC | PLA |

### 7.3 特殊用途材料说明

```yaml
special_materials:
  tpu_for_gaskets:
    shore_hardness: 95A
    purpose: 密封圈、减震垫、柔性卡扣
    print_tips:
      - 直驱挤出机强烈推荐（远程送料极难打印TPU）
      - 速度20-30mm/s
      - 回抽距离最小化（0.5mm或关闭）
      - 首层速度10mm/s
      
  carbon_fiber_composites:
    purpose: 高刚度结构件（机械臂、底座）
    hardened_nozzle: 必须（碳纤维磨损普通铜嘴）
    layer_adhesion: 注意XY方向远强于Z方向
    
  translucent_petg:
    purpose: LED导光罩、状态灯窗口
    print_tips:
      - 100%填充可获得更好透光
      - 温度偏高（+5°C）减少气泡
```

---

## 8. 模块组合模板

### 8.1 模板总览

| # | 模板名称 | 模块组合 | 预估成本 | 适用场景 |
|---|---------|---------|---------|---------|
| 1 | 室内气象站 | 温湿度+气压+OLED+ESP32 | ¥45 | 家庭/办公室 |
| 2 | 空气质量监控 | PM2.5+CO2+VOC+OLED+ESP32 | ¥120 | 新装修/学校 |
| 3 | 安防摄像头 | ESP32-CAM+PIR+LED+蜂鸣器 | ¥35 | 门口/走廊 |
| 4 | 智能灯控 | WS2812B灯带+人感+光照+ESP32 | ¥55 | 走廊/卧室 |
| 5 | 土壤监测 | 土壤湿度+温度+光照+ESP32+太阳能 | ¥80 | 花园/阳台 |
| 6 | 宠物喂食器 | 舵机+称重+ESP32-CAM+蜂鸣器 | ¥60 | 家庭 |
| 7 | 门窗报警器 | 磁簧开关+蜂鸣器+ESP32-C3 | ¥20 | 家庭安防 |
| 8 | 智能浇水 | 土壤湿度+水泵+继电器+ESP32 | ¥50 | 阳台种菜 |
| 9 | 噪音监测 | INMP441+OLED+ESP32+LED指示 | ¥35 | 办公室/图书馆 |
| 10 | 能耗监测 | SCT013电流互感器+OLED+ESP32 | ¥40 | 家庭配电箱 |
| 11 | 车库/仓库环境 | 温湿度+烟雾+水位+蜂鸣器+ESP32 | ¥55 | 车库/仓库 |
| 12 | 桌面番茄钟 | OLED+旋钮+WS2812B环+蜂鸣器+ESP32 | ¥40 | 办公桌 |

### 8.2 详细组合模板

```yaml
# ── 模板 1：室内气象站 ──
template_weather_station:
  name: "室内气象站"
  modules:
    top: sensor-board          # SHT31 + BMP280, 3U
    middle: compute-board      # ESP32-C3 + OLED 0.96", 3U
    bottom: power-base         # USB-C供电, 3U
  stacking: M3铜柱×4, 15mm间距
  total_size: [60, 40, 60]mm   # 3U × 3层
  protection: CF-P0
  material: PLA
  print_time: 3h
  mounting: desktop

# ── 模板 2：空气质量监控 ──
template_air_quality:
  name: "空气质量监控"
  modules:
    top: air-intake            # PMS5003, 通风设计, 4U
    middle: sensor-array       # SCD41(CO2) + SGP30(VOC) + SHT31, 4U
    bottom: compute-display    # ESP32-S3 + 2.4" TFT, 4U
    base: power-base           # USB-C 5V/2A, 3U
  stacking: M3铜柱×4, 20mm间距
  total_size: [80, 60, 100]mm
  protection: CF-P0
  material: PETG（耐温，传感器发热）
  print_time: 6h
  mounting: desktop / wall_mount

# ── 模板 3：安防摄像头 ──
template_security_cam:
  name: "安防摄像头"
  modules:
    front: camera-module       # ESP32-CAM, 3U
    rear: compute-pir          # PIR + LED + 蜂鸣器, 3U
  side_by_side: 燕尾槽
  total_size: [60, 40, 50]mm
  protection: CF-P1
  material: PETG（白色/黑色）
  print_time: 3h30m
  mounting: wall_mount / ceiling / magnetic

# ── 模板 4：智能灯控 ──
template_smart_light:
  name: "智能灯控中枢"
  modules:
    top: sensor-lid            # AM312(PIR) + BH1750(光照), 2U
    middle: controller         # ESP32-C3 + MOSFET驱动, 3U
    bottom: power-base         # 12V DC输入 + 5V降压, 3U
  external: WS2812B灯带（1-5米）
  total_size: [60, 40, 55]mm
  protection: CF-P0
  material: PLA（白色，不显眼）
  print_time: 2h30m
  mounting: adhesive / magnetic

# ── 模板 5：土壤监测站 ──
template_soil_monitor:
  name: "太阳能土壤监测站"
  modules:
    top: solar-panel-mount     # 5V/1W太阳能板支架, 6U
    middle: compute-board      # ESP32-C3 + 18650电池, 4U
    bottom: sensor-interface   # 土壤探针+温度+光照接口, 3U
  external: 电容式土壤探针（500mm线缆）
  total_size: [120, 80, 80]mm
  protection: CF-P2（户外）
  material: ASA（抗UV）
  print_time: 8h
  mounting: clamp (Φ15-30mm支架) / pole_mount

# ── 模板 6：宠物喂食器 ──
template_pet_feeder:
  name: "智能宠物喂食器"
  modules:
    top: hopper               # 粮仓, 8U, 带可拆卸盖
    middle: dispenser          # 舵机转盘出粮机构, 4U
    bottom: base-scale         # HX711称重 + 食盆, 6U
    controller: compute-cam    # ESP32-CAM + 蜂鸣器, 3U（侧挂）
  total_size: [120, 80, 200]mm
  protection: CF-P0
  material: PETG（食品级安全性较好）
  print_time: 12h
  mounting: desktop

# ── 模板 7：门窗报警器 ──
template_door_alarm:
  name: "门窗报警器"
  modules:
    main: controller-alarm     # ESP32-C3 + 蜂鸣器 + LED, 2U
    remote: magnet-unit        # 磁铁+簧片开关, 1U
  connection: 无线（ESPNow配对）
  total_size: main [40, 20, 15]mm / remote [20, 20, 10]mm
  protection: CF-P0
  material: PLA
  print_time: 1h
  mounting: adhesive（3M VHB双面胶）
  power: CR2032纽扣电池 / 18650（深度睡眠可用1年）

# ── 模板 8：智能浇水 ──
template_auto_watering:
  name: "智能浇水系统"
  modules:
    controller: compute-relay  # ESP32 + 继电器模块, 3U
    sensor: soil-probe-mount   # 土壤湿度探针接口, 2U
    pump: pump-mount           # 12V水泵固定座, 3U
  external: 土壤探针 + 12V微型水泵 + 硅胶水管
  total_size: [60, 40, 80]mm
  protection: CF-P1（防溅）
  material: PETG
  print_time: 4h
  mounting: clamp / desktop

# ── 模板 9：噪音监测 ──
template_noise_monitor:
  name: "噪音监测器"
  modules:
    top: mic-module            # INMP441 MEMS麦克风, 2U
    middle: compute-display    # ESP32-S3 + OLED 1.3", 3U
    bottom: power-base         # USB-C, 2U
  total_size: [60, 40, 45]mm
  protection: CF-P0
  material: PLA
  print_time: 2h30m
  mounting: desktop / wall_mount
  notes: 拾音孔朝外，内部做隔音腔体

# ── 模板 10：能耗监测 ──
template_energy_monitor:
  name: "家庭能耗监测"
  modules:
    main: compute-adc          # ESP32 + ADS1115(16bit ADC), 3U
    display: oled-module       # OLED 0.96" 状态显示, 2U
  external: SCT-013-030 开合式电流互感器（30A）
  total_size: [60, 40, 45]mm
  protection: CF-P0
  material: PLA（阻燃PLA+更佳）
  print_time: 2h30m
  mounting: din_rail（配电箱内）
  safety_note: "⚠️ 电流互感器仅套在火线外部，不接触裸线，安装需断电"

# ── 模板 11：车库仓库环境 ──
template_garage_monitor:
  name: "车库/仓库环境监测"
  modules:
    top: multi-sensor          # SHT31 + MQ-2(烟雾) + 水位传感器接口, 4U
    bottom: compute-alarm      # ESP32 + 蜂鸣器 + LED, 3U
  external: 浮球水位探头
  total_size: [80, 60, 55]mm
  protection: CF-P1
  material: PETG
  print_time: 5h
  mounting: wall_mount

# ── 模板 12：桌面番茄钟 ──
template_pomodoro:
  name: "桌面番茄钟"
  modules:
    top: display-ring          # OLED 0.96" + WS2812B环(12颗), 3U
    middle: input-module       # 旋转编码器 + 按钮, 2U
    bottom: compute-buzzer     # ESP32-C3 + 蜂鸣器, 2U
  total_size: [60, 40, 50]mm
  protection: CF-P0
  material: PLA（透光白色用于LED）
  print_time: 3h
  mounting: desktop（加配重硅胶垫）
```

---

## 9. 种子组件包 manifest.yaml 示例

### 9.1 温湿度监控器

```yaml
# ─── RealWorldClaw Component Manifest ───
# 种子组件包 #1：温湿度监控器

id: temp-humidity-monitor
version: 1.0.0
display_name:
  en: "Temperature & Humidity Monitor"
  zh: "温湿度监控器"
description:
  en: "Indoor temperature and humidity monitoring device with OLED display and MQTT reporting. Uses SHT31 for high-accuracy sensing. Simple desktop design, perfect first RealWorldClaw project."
  zh: "室内温湿度监控器，配备OLED显示屏和MQTT上报。使用SHT31高精度传感器。简洁桌面设计，适合作为第一个RealWorldClaw项目。"
author: meiyangyang
license: MIT
tags: [sensor, temperature, humidity, indoor, esp32, oled, beginner]

capabilities:
  - temperature_sensing
  - humidity_sensing
  - data_reporting
  - led_status
  - display_output

hardware:
  compute: esp32-c3
  sensors:
    - model: SHT31
      interface: i2c
      address: "0x44"
      voltage: "3.3V"
      datasheet_url: "https://sensirion.com/products/catalog/SHT31-DIS-B"
  actuators:
    - model: SSD1306
      type: display
      interface: i2c
      pin: [21, 22]
  power:
    type: usb-c
    voltage: "5V"
    consumption: "0.25W"
    peak_consumption: "0.4W"
    sleep_consumption: "0.01W"
  estimated_cost:
    CNY: 35
    USD: 5

printing:
  files:
    - path: models/enclosure-bottom.stl
      quantity: 1
      color: white
    - path: models/enclosure-lid.stl
      quantity: 1
      color: white
  material: PLA
  layer_height: "0.2mm"
  infill: "20%"
  supports: false
  estimated_time: "2h15m"
  estimated_filament: "38g"
  min_bed_size: [120, 120]
  print_orientation: "大平面朝下，两件可同盘打印"
  nozzle_temp: "210°C"
  bed_temp: "60°C"

physical:
  module_size: 3U
  dimensions: [60, 40, 30]
  weight: "72g"
  mounting: m3-20mm-grid
  mounting_types: [desktop, wall_mount, magnetic]
  protection: CF-P0

electrical:
  logic_level: "3.3V"
  interfaces:
    - type: i2c
      connector: JST-XH-4P
      pinout: [VCC, GND, SDA, SCL]
      direction: bidirectional
    - type: power
      connector: USB-C
      pinout: [VBUS, GND]
      direction: in

communication:
  protocol: mqtt
  topics:
    publish:
      - "rwc/{agent_id}/temp-humidity-monitor/temperature"
      - "rwc/{agent_id}/temp-humidity-monitor/humidity"
      - "rwc/{agent_id}/temp-humidity-monitor/status"
    subscribe:
      - "rwc/{agent_id}/temp-humidity-monitor/command"
      - "rwc/{agent_id}/temp-humidity-monitor/config"
  discovery: true
  ota_update: true

software:
  firmware_platform: arduino
  dependencies:
    - name: SHT31
      version: ">=1.0.0"
    - name: Adafruit_SSD1306
      version: ">=2.5.0"
    - name: PubSubClient
      version: ">=2.8.0"
    - name: ArduinoJson
      version: ">=6.0.0"
  openclaw_skill: temp-humidity-skill
  build_command: "pio run -e esp32c3"
  flash_command: "pio run -e esp32c3 -t upload"

compatible_with:
  bases: [desktop-base-v1, wall-mount-v1, magnetic-base-v1]
  addons: [solar-panel-addon, battery-18650-addon, e-ink-display-addon]

completeness:
  has_models: true
  has_wiring: true
  has_firmware: true
  has_agent: true
  has_docs: true

thermal:
  class: passive-none
  max_ambient: "50°C"

waterproof:
  seal_type: none
```

### 9.2 空气质量监控站

```yaml
id: air-quality-station
version: 1.0.0
display_name:
  en: "Air Quality Monitoring Station"
  zh: "空气质量监控站"
description:
  en: "Comprehensive air quality monitor with PM2.5, CO2, VOC, temperature and humidity sensors. Features a 2.4-inch color display and MQTT reporting. Modular design with replaceable sensor cartridges."
  zh: "综合空气质量监控站，集成PM2.5、CO2、VOC、温湿度传感器。配备2.4寸彩色显示屏和MQTT上报。模块化设计，传感器模块可独立更换。"
author: meiyangyang
license: MIT
tags: [sensor, air-quality, pm25, co2, voc, indoor, esp32, display, intermediate]

capabilities:
  - pm25_sensing
  - co2_sensing
  - voc_sensing
  - temperature_sensing
  - humidity_sensing
  - data_reporting
  - display_output
  - air_quality_index

hardware:
  compute: esp32-s3
  sensors:
    - model: PMS5003
      interface: uart
      pin: [16, 17]
      voltage: "5V"
    - model: SCD41
      interface: i2c
      address: "0x62"
      voltage: "3.3V"
    - model: SGP30
      interface: i2c
      address: "0x58"
      voltage: "3.3V"
    - model: SHT31
      interface: i2c
      address: "0x44"
      voltage: "3.3V"
  actuators:
    - model: ILI9341
      type: display
      interface: spi
      pin: [18, 23, 5, 14]
  power:
    type: usb-c
    voltage: "5V"
    consumption: "1.8W"
    peak_consumption: "2.5W"
  estimated_cost:
    CNY: 120
    USD: 17

printing:
  files:
    - path: models/main-body.stl
      quantity: 1
      color: white
    - path: models/top-grille.stl
      quantity: 1
      color: white
      notes: "通风格栅，需要精细打印"
    - path: models/display-bezel.stl
      quantity: 1
      color: black
    - path: models/back-panel.stl
      quantity: 1
      color: white
  material: PETG
  layer_height: "0.2mm"
  infill: "25%"
  supports: true
  estimated_time: "6h30m"
  estimated_filament: "95g"
  min_bed_size: [180, 180]
  print_orientation: "主体底面朝下，格栅和面板分盘打印"
  nozzle_temp: "240°C"
  bed_temp: "75°C"

physical:
  module_size: 4U
  dimensions: [80, 60, 100]
  weight: "185g"
  mounting: m3-20mm-grid
  mounting_types: [desktop, wall_mount]
  protection: CF-P0

electrical:
  logic_level: "3.3V"
  interfaces:
    - type: i2c
      connector: JST-XH-4P
      pinout: [VCC, GND, SDA, SCL]
      direction: bidirectional
    - type: uart
      connector: JST-XH-4P
      pinout: [VCC, GND, TX, RX]
      direction: bidirectional
    - type: spi
      connector: JST-XH-6P
      pinout: [VCC, GND, MOSI, MISO, SCK, CS]
      direction: bidirectional
    - type: power
      connector: USB-C
      pinout: [VBUS, GND]
      direction: in

communication:
  protocol: mqtt
  topics:
    publish:
      - "rwc/{agent_id}/air-quality-station/pm25"
      - "rwc/{agent_id}/air-quality-station/co2"
      - "rwc/{agent_id}/air-quality-station/voc"
      - "rwc/{agent_id}/air-quality-station/temperature"
      - "rwc/{agent_id}/air-quality-station/humidity"
      - "rwc/{agent_id}/air-quality-station/aqi"
    subscribe:
      - "rwc/{agent_id}/air-quality-station/command"
      - "rwc/{agent_id}/air-quality-station/config"
  discovery: true
  ota_update: true

software:
  firmware_platform: arduino
  dependencies:
    - name: PMS_Library
      version: ">=1.1.0"
    - name: SparkFun_SCD4x
      version: ">=1.0.0"
    - name: Adafruit_SGP30
      version: ">=2.0.0"
    - name: SHT31
      version: ">=1.0.0"
    - name: TFT_eSPI
      version: ">=2.5.0"
    - name: PubSubClient
      version: ">=2.8.0"
    - name: ArduinoJson
      version: ">=6.0.0"
  openclaw_skill: air-quality-skill
  build_command: "pio run -e esp32s3"
  flash_command: "pio run -e esp32s3 -t upload"

compatible_with:
  bases: [desktop-base-v1, wall-mount-v1]
  addons: [buzzer-alarm-addon, battery-18650-addon]

completeness:
  has_models: true
  has_wiring: true
  has_firmware: true
  has_agent: true
  has_docs: true

thermal:
  class: passive-fins
  max_ambient: "45°C"
  vent_area: "≥300mm² 顶部通风格栅"

waterproof:
  seal_type: none
```

### 9.3 安防摄像头

```yaml
id: security-camera-pir
version: 1.0.0
display_name:
  en: "PIR Security Camera"
  zh: "人体感应安防摄像头"
description:
  en: "Motion-triggered security camera with PIR sensor, IR LED night vision, and local/cloud image capture. ESP32-CAM based with MQTT alerts. Supports wall and ceiling mounting."
  zh: "人体感应触发安防摄像头，配备PIR传感器和红外夜视LED，支持本地/云端图片抓拍。基于ESP32-CAM，MQTT告警推送。支持壁挂和吸顶安装。"
author: meiyangyang
license: MIT
tags: [camera, security, pir, motion, esp32-cam, night-vision, intermediate]

capabilities:
  - image_capture
  - motion_detection
  - night_vision
  - alert_notification
  - video_stream

hardware:
  compute: esp32
  sensors:
    - model: OV2640
      interface: csi
      voltage: "3.3V"
    - model: AM312
      interface: gpio
      pin: 13
      voltage: "3.3V"
  actuators:
    - model: IR-LED-850nm
      type: led-strip
      interface: gpio
      pin: 4
      voltage: "3.3V"
      max_current: "300mA"
    - model: Active-Buzzer
      type: buzzer
      interface: gpio
      pin: 2
      voltage: "3.3V"
  power:
    type: usb-c
    voltage: "5V"
    consumption: "1.2W"
    peak_consumption: "2.0W"
    sleep_consumption: "0.02W"
  estimated_cost:
    CNY: 35
    USD: 5

printing:
  files:
    - path: models/camera-body.stl
      quantity: 1
      color: white
    - path: models/camera-lens-ring.stl
      quantity: 1
      color: black
    - path: models/wall-mount-bracket.stl
      quantity: 1
      color: white
    - path: models/ball-joint-socket.stl
      quantity: 1
      notes: "万向球头底座，角度调节"
  material: PETG
  layer_height: "0.2mm"
  infill: "30%"
  supports: true
  estimated_time: "3h45m"
  estimated_filament: "52g"
  min_bed_size: [150, 150]
  print_orientation: "主体侧放打印，支架平放"
  nozzle_temp: "240°C"
  bed_temp: "70°C"

physical:
  module_size: 3U
  dimensions: [60, 40, 50]
  weight: "95g"
  mounting: custom-ball-joint
  mounting_types: [wall_mount, ceiling, magnetic]
  protection: CF-P1

electrical:
  logic_level: "3.3V"
  interfaces:
    - type: gpio
      connector: JST-XH-4P
      pinout: [VCC, GND, PIR_OUT, BUZZER]
      direction: in
    - type: power
      connector: USB-C
      pinout: [VBUS, GND]
      direction: in

communication:
  protocol: mqtt
  topics:
    publish:
      - "rwc/{agent_id}/security-camera-pir/motion"
      - "rwc/{agent_id}/security-camera-pir/image"
      - "rwc/{agent_id}/security-camera-pir/status"
    subscribe:
      - "rwc/{agent_id}/security-camera-pir/command"
      - "rwc/{agent_id}/security-camera-pir/config"
  discovery: true
  ota_update: true

software:
  firmware_platform: arduino
  dependencies:
    - name: esp32-camera
      version: ">=2.0.0"
    - name: PubSubClient
      version: ">=2.8.0"
    - name: ArduinoJson
      version: ">=6.0.0"
    - name: ESP32_FTPClient
      version: ">=1.0.0"
  openclaw_skill: security-cam-skill
  build_command: "pio run -e esp32cam"
  flash_command: "pio run -e esp32cam -t upload"

compatible_with:
  bases: [wall-mount-v1, ceiling-mount-v1]
  addons: [solar-panel-addon, battery-18650-addon, microsd-addon]

completeness:
  has_models: true
  has_wiring: true
  has_firmware: true
  has_agent: true
  has_docs: true

thermal:
  class: passive-fins
  max_ambient: "45°C"
  vent_area: "背部散热孔 ≥100mm²"

waterproof:
  seal_type: gasket
  cable_gland: "PG9 (USB线出口)"
```

### 9.4 智能灯控中枢

```yaml
id: smart-light-controller
version: 1.0.0
display_name:
  en: "Smart Light Controller"
  zh: "智能灯控中枢"
description:
  en: "Smart lighting controller with PIR motion detection, ambient light sensing, and WS2812B LED strip driver. Supports automated lighting scenes, schedules, and MQTT control. Drives up to 5 meters of addressable LED strip."
  zh: "智能灯控中枢，集成PIR人体感应和环境光检测，驱动WS2812B灯带。支持自动化灯光场景、定时计划和MQTT控制。最大驱动5米可寻址灯带。"
author: meiyangyang
license: MIT
tags: [lighting, led, ws2812b, pir, automation, esp32, smart-home, beginner]

capabilities:
  - motion_detection
  - ambient_light_sensing
  - led_control
  - scene_management
  - schedule_control
  - data_reporting

hardware:
  compute: esp32-c3
  sensors:
    - model: AM312
      interface: gpio
      pin: 2
      voltage: "3.3V"
    - model: BH1750
      interface: i2c
      address: "0x23"
      voltage: "3.3V"
  actuators:
    - model: WS2812B-strip
      type: led-strip
      interface: gpio
      pin: 8
      voltage: "5V"
      max_current: "3A (60LED/m × 5m)"
  power:
    type: dc-barrel
    voltage: "12V"
    consumption: "2W"
    peak_consumption: "18W"
  estimated_cost:
    CNY: 55
    USD: 8

printing:
  files:
    - path: models/controller-body.stl
      quantity: 1
      color: white
    - path: models/controller-lid.stl
      quantity: 1
      color: white
    - path: models/diffuser-clip.stl
      quantity: 4
      material_override: "半透明PETG"
      notes: "灯带扩散夹，可选"
  material: PLA
  layer_height: "0.2mm"
  infill: "20%"
  supports: false
  estimated_time: "2h30m"
  estimated_filament: "35g"
  min_bed_size: [120, 120]
  print_orientation: "底面朝下"
  nozzle_temp: "210°C"
  bed_temp: "60°C"

physical:
  module_size: 3U
  dimensions: [60, 40, 30]
  weight: "65g"
  mounting: m3-20mm-grid
  mounting_types: [adhesive, magnetic, screw_plate]
  protection: CF-P0

electrical:
  logic_level: "3.3V"
  interfaces:
    - type: gpio
      connector: JST-XH-3P
      pinout: [5V, GND, DATA]
      direction: out
    - type: i2c
      connector: JST-XH-4P
      pinout: [VCC, GND, SDA, SCL]
      direction: bidirectional
    - type: power
      connector: DC-Barrel-5521
      pinout: [12V, GND]
      direction: in

communication:
  protocol: mqtt
  topics:
    publish:
      - "rwc/{agent_id}/smart-light-controller/motion"
      - "rwc/{agent_id}/smart-light-controller/lux"
      - "rwc/{agent_id}/smart-light-controller/status"
    subscribe:
      - "rwc/{agent_id}/smart-light-controller/command"
      - "rwc/{agent_id}/smart-light-controller/scene"
      - "rwc/{agent_id}/smart-light-controller/config"
  discovery: true
  ota_update: true

software:
  firmware_platform: arduino
  dependencies:
    - name: FastLED
      version: ">=3.6.0"
    - name: BH1750
      version: ">=1.3.0"
    - name: PubSubClient
      version: ">=2.8.0"
    - name: ArduinoJson
      version: ">=6.0.0"
  openclaw_skill: smart-light-skill
  build_command: "pio run -e esp32c3"
  flash_command: "pio run -e esp32c3 -t upload"

compatible_with:
  bases: [wall-mount-v1, adhesive-base-v1]
  addons: [rotary-encoder-addon, oled-display-module, ir-remote-addon]

completeness:
  has_models: true
  has_wiring: true
  has_firmware: true
  has_agent: true
  has_docs: true

thermal:
  class: passive-none
  max_ambient: "50°C"

waterproof:
  seal_type: none
```

### 9.5 太阳能土壤监测站

```yaml
id: solar-soil-monitor
version: 1.0.0
display_name:
  en: "Solar-Powered Soil Monitoring Station"
  zh: "太阳能土壤监测站"
description:
  en: "Solar-powered outdoor soil monitoring station with capacitive soil moisture sensor, DS18B20 waterproof temperature probe, and BH1750 light sensor. Runs on 18650 battery with solar charging. Deep sleep for months of autonomous operation. ASA enclosure for full outdoor use."
  zh: "太阳能户外土壤监测站，配备电容式土壤湿度传感器、DS18B20防水温度探头和BH1750光照传感器。18650锂电池+太阳能充电。深度睡眠模式可自主运行数月。ASA外壳全户外使用。"
author: meiyangyang
license: MIT
tags: [sensor, soil, moisture, temperature, solar, outdoor, garden, esp32, battery, advanced]

capabilities:
  - soil_moisture_sensing
  - soil_temperature_sensing
  - light_sensing
  - battery_monitoring
  - solar_charging
  - data_reporting
  - deep_sleep

hardware:
  compute: esp32-c3
  sensors:
    - model: Capacitive-Soil-Moisture-v2
      interface: adc
      pin: 0
      voltage: "3.3V"
    - model: DS18B20-waterproof
      interface: one-wire
      pin: 4
      voltage: "3.3V"
      datasheet_url: "https://www.analog.com/media/en/technical-documentation/data-sheets/DS18B20.pdf"
    - model: BH1750
      interface: i2c
      address: "0x23"
      voltage: "3.3V"
  actuators:
    - model: LED-status
      type: led-strip
      interface: gpio
      pin: 8
  power:
    type: solar
    voltage: "3.7V"
    consumption: "0.15W"
    peak_consumption: "0.5W"
    sleep_consumption: "0.005W"
    battery_capacity: "3000mAh"
    battery_life: "深度睡眠15分钟间隔采集，阴天可运行30天，晴天无限续航"
  estimated_cost:
    CNY: 80
    USD: 12

printing:
  files:
    - path: models/main-enclosure.stl
      quantity: 1
      color: green
      notes: "ASA材料，抗UV"
    - path: models/solar-panel-tilt-mount.stl
      quantity: 1
      color: green
      notes: "30°倾斜太阳能板支架"
    - path: models/battery-compartment.stl
      quantity: 1
      color: green
    - path: models/probe-cable-gland-adapter.stl
      quantity: 1
      notes: "传感器线缆密封过渡件"
    - path: models/stake-mount.stl
      quantity: 1
      notes: "土壤插入式支架"
  material: ASA
  layer_height: "0.2mm"
  infill: "30%"
  supports: true
  estimated_time: "8h"
  estimated_filament: "120g"
  min_bed_size: [200, 200]
  print_orientation: "主体底面朝下，支架单独打印"
  nozzle_temp: "250°C"
  bed_temp: "100°C"

physical:
  module_size: 6U
  dimensions: [120, 80, 80]
  weight: "280g"
  mounting: custom-stake
  mounting_types: [pole_mount, clamp, screw_plate]
  protection: CF-P2

electrical:
  logic_level: "3.3V"
  interfaces:
    - type: analog
      connector: JST-XH-3P
      pinout: [VCC, GND, ADC]
      direction: in
    - type: one-wire
      connector: JST-XH-3P
      pinout: [VCC, GND, DATA]
      direction: bidirectional
    - type: i2c
      connector: JST-XH-4P
      pinout: [VCC, GND, SDA, SCL]
      direction: bidirectional
    - type: power
      connector: USB-C
      pinout: [VBUS, GND]
      direction: in

communication:
  protocol: mqtt
  topics:
    publish:
      - "rwc/{agent_id}/solar-soil-monitor/soil_moisture"
      - "rwc/{agent_id}/solar-soil-monitor/soil_temperature"
      - "rwc/{agent_id}/solar-soil-monitor/light"
      - "rwc/{agent_id}/solar-soil-monitor/battery"
      - "rwc/{agent_id}/solar-soil-monitor/status"
    subscribe:
      - "rwc/{agent_id}/solar-soil-monitor/command"
      - "rwc/{agent_id}/solar-soil-monitor/config"
  discovery: true
  ota_update: true

software:
  firmware_platform: arduino
  dependencies:
    - name: OneWire
      version: ">=2.3.0"
    - name: DallasTemperature
      version: ">=3.9.0"
    - name: BH1750
      version: ">=1.3.0"
    - name: PubSubClient
      version: ">=2.8.0"
    - name: ArduinoJson
      version: ">=6.0.0"
  openclaw_skill: soil-monitor-skill
  build_command: "pio run -e esp32c3"
  flash_command: "pio run -e esp32c3 -t upload"

compatible_with:
  bases: [pole-mount-v1, stake-mount-v1]
  addons: [rain-gauge-addon, wind-sensor-addon, camera-addon]
  incompatible: [indoor-base-v1]

completeness:
  has_models: true
  has_wiring: true
  has_firmware: true
  has_agent: true
  has_docs: true

thermal:
  class: passive-none
  max_ambient: "60°C"

waterproof:
  seal_type: oring
  cable_gland: "PG7 × 2 (传感器线缆出口)"
  drain_holes: true
```

---

## 附录 A：快速参考卡片

### 常用螺丝规格速查

| 螺丝 | 过孔 | 热熔螺母孔 | 沉头孔 | 扭矩 |
|------|------|-----------|--------|------|
| M2 | Φ2.2mm | Φ3.2mm | Φ4.0×2.0mm | 0.2 N·m |
| M2.5 | Φ2.7mm | Φ3.8mm | Φ5.0×2.5mm | 0.4 N·m |
| M3 | Φ3.2mm | Φ4.0mm | Φ6.0×3.0mm | 0.7 N·m |
| M4 | Φ4.3mm | Φ5.5mm | Φ8.0×4.0mm | 1.5 N·m |

### JST接口速查

| 接口 | Pin数 | 间距 | 用途 |
|------|-------|------|------|
| JST-XH | 2-6P | 2.54mm | 标准信号/电源 |
| JST-PH | 2-6P | 2.0mm | 紧凑空间 |
| JST-SH | 2-8P | 1.0mm | 微型模块(Qwiic/STEMMA QT) |

---

*RealWorldClaw 硬件规范深化文档 v1.0*
*起草：美羊羊 🎀 | 羊村技术负责人*
*日期：2026-02-20*
*基于 clawforge-spec-v1.md 标准一、标准五深化补充*
