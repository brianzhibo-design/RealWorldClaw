# RWC Audio Module (2U)

## 概述
集成I2S数字麦克风和I2S功放喇叭的音频模块，支持录音和播放。

## 规格
| 参数 | 值 |
|------|------|
| 尺寸 | 40×20×12mm (2U) |
| 麦克风 | INMP441 I2S MEMS |
| 功放 | MAX98357A I2S 3W D类 |
| 喇叭 | 3W 小型扬声器 |
| 模块识别 | DS28E05 1-Wire EEPROM |
| 成本 | ~¥19 |

## RWC Bus引脚映射
| Bus Pin | 功能 |
|---------|------|
| 5V | MAX98357A供电 |
| 3V3 | INMP441/EEPROM供电 |
| GND | 地 |
| SDA | I2S_BCK (共享时钟) |
| SCL | I2S_LRCK (左右声道时钟) |
| TX-MOSI (GP_A) | I2S_WS (字选择) |
| RX-MISO (GP_B) | I2S_SD (串行数据) |
| ID | DS28E05 1-Wire |

## 原理图连接
```
INMP441 麦克风:
  VDD → 3V3
  GND → GND
  WS  → GP_A (I2S_WS)
  SCK → SDA (I2S_BCK)
  SD  → GP_B (I2S_SD) [麦克风输出]
  L/R → GND (左声道)

MAX98357A 功放:
  VIN → 5V
  GND → GND
  BCLK → SDA (I2S_BCK)
  LRC  → GP_A (I2S_WS)
  DIN  → GP_B (I2S_SD) [功放输入]
  GAIN → 未连接 (默认9dB)
  SD   → 3V3 (使能)

注意: 麦克风和喇叭分时复用I2S总线，
固件需管理方向切换。

DS28E05:
  VDD → 3V3
  GND → GND
  IO  → ID (Bus Pin 8)
```

## 固件
- `firmware/modules/audio_i2s.h/cpp`
- 支持录音(16bit 16kHz)和播放(16bit 44.1kHz)
- WAV格式播放
- 音量控制

## 外壳
- `models/audio-case.scad` → 3D打印
- 侧面圆形出音孔阵列
- 顶部拾音孔
- 底部Pogo Pad开口

## BOM
| 元件 | 型号 | 价格 |
|------|------|------|
| 麦克风 | INMP441 | ¥6 |
| 功放+喇叭 | MAX98357A + 3W | ¥10 |
| EEPROM | DS28E05 | ¥1.5 |
| 磁铁 | 5×2mm 圆形 ×4 | ¥1 |
