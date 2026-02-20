# Core Module GPIO 分配表

## ESP32-S3-DevKitC-1 → RWC Bus 端口映射

### Port 1（默认I2C + UART）

| RWC Pin | 信号 | ESP32-S3 GPIO | 说明 |
|---------|------|---------------|------|
| 1 | 5V | 5V | 开发板5V输出 |
| 2 | 3V3 | 3V3 | 开发板3.3V输出 |
| 3 | GND | GND | |
| 4 | SDA | GPIO8 | I2C SDA（默认，硬件I2C0） |
| 5 | SCL | GPIO9 | I2C SCL（默认，硬件I2C0） |
| 6 | TX-MOSI | GPIO43 | UART0 TX |
| 7 | RX-MISO | GPIO44 | UART0 RX |
| 8 | ID | GPIO10 | 1-Wire模块识别 |

### Port 2（I2C共享 + GPIO）

| RWC Pin | 信号 | ESP32-S3 GPIO | 说明 |
|---------|------|---------------|------|
| 1 | 5V | 5V | |
| 2 | 3V3 | 3V3 | |
| 3 | GND | GND | |
| 4 | SDA | GPIO8 | I2C共享（同Port 1） |
| 5 | SCL | GPIO9 | I2C共享（同Port 1） |
| 6 | TX-MOSI | GPIO11 | GPIO / UART1 TX |
| 7 | RX-MISO | GPIO12 | GPIO / UART1 RX |
| 8 | ID | GPIO13 | 1-Wire模块识别 |

### Port 3（I2C共享 + SPI）

| RWC Pin | 信号 | ESP32-S3 GPIO | 说明 |
|---------|------|---------------|------|
| 1 | 5V | 5V | |
| 2 | 3V3 | 3V3 | |
| 3 | GND | GND | |
| 4 | SDA | GPIO8 | I2C共享（同Port 1） |
| 5 | SCL | GPIO9 | I2C共享（同Port 1） |
| 6 | TX-MOSI | GPIO35 | SPI MOSI |
| 7 | RX-MISO | GPIO37 | SPI MISO |
| 8 | ID | GPIO14 | 1-Wire模块识别 |

## 其他GPIO使用

| GPIO | 用途 | 说明 |
|------|------|------|
| GPIO0 | Boot按钮 | 开发板自带 |
| GPIO38 | SPI SCK | Port 3 SPI时钟（额外引出） |
| GPIO39 | SPI CS | Port 3 SPI片选（额外引出） |
| GPIO48 | RGB LED | 开发板自带WS2812（状态指示） |
| GPIO19/20 | USB D-/D+ | USB CDC（开发板自带USB-C） |

## 注意事项

1. I2C总线三个端口共享，每个模块需要不同I2C地址
2. Port 1的UART0也是USB CDC的调试串口，注意冲突——实际部署时可改用UART1
3. Port 3的SPI需要额外引出SCK(GPIO38)和CS(GPIO39)，载板上可预留
4. 所有ID线需要外部4.7kΩ上拉电阻到3V3
