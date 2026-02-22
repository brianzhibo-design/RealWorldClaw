# RWC-ONE 接线图

## 引脚分配

| 组件 | 信号 | ESP32-C3 引脚 | 备注 |
|------|------|---------------|------|
| OLED SDA | I2C Data | GPIO4 | |
| OLED SCL | I2C Clock | GPIO5 | |
| DHT22 Data | 1-Wire | GPIO6 | 需10kΩ上拉到3.3V |
| LED Ring DIN | NeoPixel | GPIO7 | |
| Buzzer | PWM | GPIO8 | 可选 |
| Button | Digital In | GPIO9 | 内部上拉 |

## 电源

| 组件 | VCC | GND |
|------|-----|-----|
| OLED | 3.3V | GND |
| DHT22 | 3.3V | GND |
| LED Ring | 5V (VBUS) | GND |
| Buzzer | 3.3V | GPIO8 |
| Button | GPIO9 | GND |

## 详细接线图 (ASCII Art)

```
                    ┌─────────────────────┐
                    │   ESP32-C3 SuperMini │
                    │                     │
     USB-C ════════►│ 5V              GND │◄══╗
     (Power)        │ 3V3             GND │   ║
                    │                     │   ║
                    │ GPIO4 (SDA)    GPIO9│───╫──── [Button] ──── GND
                    │ GPIO5 (SCL)    GPIO8│───╫──── [Buzzer+] 
                    │ GPIO6 (DHT)    GPIO7│───╫──── [LED DIN]
                    │                     │   ║
                    └──┬──┬──┬────────────┘   ║
                       │  │  │                ║
              3V3 ─────┘  │  │                ║
               │          │  │                ║
               │          │  │                ║
    ┌──────────┼──────────┼──┼────────────────╫─── GND Bus ───┐
    │          │          │  │                ║                │
    │          │          │  │                ║                │
    │    ┌─────┴─────┐    │  │          ┌─────╨─────┐         │
    │    │  SSD1306  │    │  │          │ WS2812B   │         │
    │    │  OLED     │    │  │          │ LED Ring  │         │
    │    │           │    │  │          │ (8 LEDs)  │         │
    │    │ VCC ← 3V3 │    │  │          │           │         │
    │    │ GND ← GND │    │  │          │ VCC ← 5V  │ (VBUS) │
    │    │ SDA ← GP4 │◄───┘  │          │ GND ← GND │         │
    │    │ SCL ← GP5 │◄──────┘          │ DIN ← GP7 │         │
    │    └───────────┘                   └───────────┘         │
    │                                                          │
    │    ┌───────────┐         ┌───────────┐                   │
    │    │  DHT22    │         │  Buzzer   │                   │
    │    │           │         │  (被动)    │                   │
    │    │ VCC ← 3V3 │         │           │                   │
    │    │ GND ← GND─│─────────│── GND ────│───────────────────┘
    │    │ DAT ← GP6 │         │  + ← GP8  │
    │    │   ┌─[10k]─┤ ← 3V3  └───────────┘
    │    └───┘       │
    │                │
    │    ┌───────────┐
    │    │  Button   │
    │    │           │
    │    │  A ← GP9  │ (内部上拉，按下接地)
    │    │  B ← GND──│─────────────────────────────────────────┘
    │    └───────────┘
    │
    └──────────────────────────────────────────────────────────┘
```

## 接线注意事项

1. **DHT22 上拉电阻**：数据线(GPIO6)和3.3V之间必须接一个10kΩ电阻
2. **LED 供电**：WS2812B 用5V (USB VBUS)，不要用3.3V，亮度不够
3. **按钮**：使用ESP32内部上拉，一端接GPIO9，一端接GND
4. **蜂鸣器**：用无源蜂鸣器，正极接GPIO8，负极接GND
5. **走线建议**：先焊/接好测试，确认工作后再装入外壳
6. **OLED固定**：用热熔胶固定在正面开孔位置

## 简化版（给懒人看的）

```
OLED:   VCC→3V3  GND→GND  SDA→GP4  SCL→GP5
DHT22:  VCC→3V3  GND→GND  DAT→GP6  (DAT和3V3之间接10kΩ)
LED环:  VCC→5V   GND→GND  DIN→GP7
蜂鸣器: +→GP8    -→GND
按钮:   A→GP9    B→GND
```

就这么简单！🦀✨
