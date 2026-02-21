# RWC 总线标准

8针磁吸接口，连接所有RealWorldClaw模块。

| 针脚 | 信号 | 描述 |
|:----:|------|------|
| 1 | VCC | 5V电源 |
| 2 | 3V3 | 3.3V稳压 |
| 3 | GND | 地线 |
| 4 | SDA | I²C数据 |
| 5 | SCL | I²C时钟 |
| 6 | TX/MOSI | UART/SPI |
| 7 | RX/MISO | UART/SPI |
| 8 | ID | 1-Wire模块识别 |

- 🧲 磁吸对齐 — 盲插自动居中
- 🔥 热插拔 — 无需重启
- 🔍 自动发现 — 1-Wire EEPROM即时识别

*完整规格见 [RWC Module Standard v1.0](https://github.com/brianzhibo-design/RealWorldClaw/blob/main/docs/specs/rwc-module-standard-v1.md)。*
