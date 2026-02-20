# RWC Display Module (2U)

## 概述
0.96" OLED显示模块，用于显示表情、文字和动画。通过RWC Bus的I2C接口通信。

## 规格
| 参数 | 值 |
|------|------|
| 尺寸 | 40×20×10mm (2U) |
| 显示屏 | 0.96" OLED 128×64 I2C (SSD1306) |
| 模块识别 | DS28E05 1-Wire EEPROM |
| 接口 | RWC Bus 8pin磁吸Pogo Pin |
| 成本 | ~¥9.5 |

## RWC Bus引脚映射
| Bus Pin | 功能 |
|---------|------|
| 5V | 未使用 |
| 3V3 | OLED/EEPROM供电 |
| GND | 地 |
| SDA | I2C数据 (SSD1306 addr 0x3C) |
| SCL | I2C时钟 |
| TX-MOSI | 未使用 |
| RX-MISO | 未使用 |
| ID | DS28E05 1-Wire |

## 原理图连接
```
SSD1306 OLED:
  VCC → 3V3
  GND → GND
  SDA → SDA (Bus Pin 4)
  SCL → SCL (Bus Pin 5)

DS28E05:
  VDD → 3V3
  GND → GND
  IO  → ID (Bus Pin 8)
```

## 固件
- `firmware/modules/display_ssd1306.h/cpp`
- I2C地址: 0x3C
- 预设8种表情: happy/sad/angry/surprised/thinking/sleeping/love/neutral

## 外壳
- `models/display-case.scad` → 3D打印
- 正面OLED开窗
- 底部Pogo Pad开口
- 四角5×2mm磁铁孔

## BOM
| 元件 | 型号 | 价格 |
|------|------|------|
| OLED | 0.96" SSD1306 I2C | ¥8 |
| EEPROM | DS28E05 | ¥1.5 |
| 磁铁 | 5×2mm 圆形 ×4 | ¥1 |
