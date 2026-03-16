# ESP32-S3 开发指南 — RWC项目

> RealWorldClaw Hardware Team | 2026-02-21
> 面向 RealWorldClaw 项目的 ESP32-S3 硬件开发速查手册

---

## 1. ESP32-S3-WROOM-1 vs DevKitC-1

| | WROOM-1 (模组) | DevKitC-1 (开发板) |
|---|---|---|
| 本质 | 芯片+Flash+天线的最小系统模组 | WROOM-1 模组 + USB转串口 + 供电 + 按键 |
| 适用场景 | **量产/自定义PCB** | **原型开发/调试** |
| USB | 无（需外接 USB-Serial） | USB-to-UART + 原生USB-OTG 双口 |
| 供电 | 3.3V 需自行设计 | 5V USB 供电，板载 3.3V LDO |
| 价格 | ~¥15-25 | ~¥40-60 |
| Flash | 4/8/16MB 可选（N4/N8/N16 后缀） | 通常 N8R8（8MB Flash + 8MB PSRAM） |

### RWC项目建议

- **原型阶段**：用 DevKitC-1（N8R8版本），方便调试
- **量产PCB**：直接用 WROOM-1-N16R8 模组（16MB Flash 给 OTA 留空间）
- 注意后缀含义：N=Flash大小，R=PSRAM大小，如 N16R8 = 16MB Flash + 8MB PSRAM

---

## 2. GPIO引脚分配最佳实践

### ⚠️ Strapping Pins（启动时有特殊功能，慎用）

| GPIO | 功能 | 默认 | 注意 |
|------|------|------|------|
| GPIO0 | Boot模式选择 | 内部上拉 | **不要外接强下拉**，否则进下载模式 |
| GPIO3 | JTAG信号源 | 浮空 | 影响JTAG，一般可用 |
| GPIO45 | VDD_SPI电压 | 内部下拉(3.3V) | **不要拉高**，会切到1.8V烧模组 |
| GPIO46 | Boot模式/ROM日志 | 内部下拉 | **只能做输入**，无内部上拉 |

### 🚫 不可用/受限引脚

| GPIO | 限制 |
|------|------|
| GPIO26-32 | 连接到内置SPI Flash，**完全不可用** |
| GPIO33-37 | 连接到PSRAM（若使用Octal PSRAM则不可用） |
| GPIO19/20 | USB D-/D+，用了USB则不可用 |
| GPIO43/44 | 默认UART0 TX/RX（串口日志），可复用但要小心 |

### ✅ 推荐自由使用的GPIO

```
安全好用: GPIO1, 2, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14
稍有限制: GPIO15, 16, 17, 18, 21, 38, 39, 40, 41, 42, 47, 48
ADC可用:  GPIO1-10 (ADC1), GPIO11-20 (ADC2, WiFi时不可用!)
触摸感应: GPIO1-14
```

### RWC项目引脚分配参考

```
I2C Bus:     SDA=GPIO6,  SCL=GPIO7   (传感器总线)
SPI LCD:     MOSI=GPIO11, SCLK=GPIO12, CS=GPIO10, DC=GPIO13, RST=GPIO14
I2S MIC:     WS=GPIO4,   SCK=GPIO5,  SD=GPIO15
I2S SPK:     BCLK=GPIO16, LRC=GPIO17, DIN=GPIO18
状态LED:     GPIO48 (DevKitC-1 板载RGB LED)
电池ADC:     GPIO1 (通过分压电阻)
按键:        GPIO2, GPIO3
```

---

## 3. I2C多设备共享总线

### 基本接线

```
ESP32-S3 GPIO6 (SDA) ──┬── 设备1 SDA ──┬── 设备2 SDA ──┬── 设备3 SDA
                        │               │               │
ESP32-S3 GPIO7 (SCL) ──┼── 设备1 SCL ──┼── 设备2 SCL ──┼── 设备3 SCL
                        │               │               │
3.3V ──[4.7kΩ]─────────┤               │               │
3.3V ──[4.7kΩ]─────────┘  (SDA和SCL各一个上拉)
```

### 注意事项

1. **上拉电阻**：整条总线只需一对（SDA+SCL各一个），4.7kΩ 通用；设备多/线长时可降到 2.2kΩ
2. **地址冲突**：同一总线上每个设备地址必须唯一。常见地址：
   - MPU6050: 0x68 / 0x69 (AD0引脚切换)
   - BME280: 0x76 / 0x77
   - MAX30102: 0x57 (固定)
   - OLED SSD1306: 0x3C / 0x3D
3. **总线速率**：默认100kHz(Standard)，大多数传感器支持400kHz(Fast)。ESP32-S3最高支持1MHz
4. **线长限制**：I2C不适合长距离，建议 < 30cm；超过则降速或加总线缓冲器
5. **扫描调试**：

```cpp
#include <Wire.h>
void scanI2C() {
    for (uint8_t addr = 1; addr < 127; addr++) {
        Wire.beginTransmission(addr);
        if (Wire.endTransmission() == 0) {
            Serial.printf("Found device at 0x%02X\n", addr);
        }
    }
}
```

6. **多I2C总线**：ESP32-S3 有两个I2C控制器(Wire/Wire1)，地址冲突时可拆分到两条总线
7. **热插拔风险**：I2C不支持热插拔，插拔设备可能导致总线锁死，需要软件重置

---

## 4. SPI屏幕驱动（GC9A01圆形LCD）

### 接线

```
ESP32-S3          GC9A01 (240x240 圆形 1.28")
─────────         ────────
GPIO11 (MOSI) ──→ SDA (数据)
GPIO12 (SCLK) ──→ SCL (时钟)
GPIO10 (CS)   ──→ CS  (片选)
GPIO13 (DC)   ──→ DC  (数据/命令)
GPIO14 (RST)  ──→ RES (复位)
3.3V          ──→ VCC
GND           ──→ GND
GPIO9 (可选)  ──→ BLK (背光，PWM调光)
```

### 推荐库

| 库 | 特点 | 推荐度 |
|---|---|---|
| **TFT_eSPI** | 最成熟，性能好，通过`User_Setup.h`配置 | ⭐⭐⭐⭐⭐ |
| **LovyanGFX** | 日本开发者，DMA性能极佳，API现代 | ⭐⭐⭐⭐⭐ |
| **Arduino_GFX** | Adafruit风格，简单易上手 | ⭐⭐⭐ |
| **LVGL** | UI框架（搭配上述驱动层使用） | UI必备 |

### TFT_eSPI 配置 (User_Setup.h)

```cpp
#define GC9A01_DRIVER
#define TFT_WIDTH  240
#define TFT_HEIGHT 240

#define TFT_MOSI 11
#define TFT_SCLK 12
#define TFT_CS   10
#define TFT_DC   13
#define TFT_RST  14
#define TFT_BL   9

#define SPI_FREQUENCY  80000000  // 80MHz, GC9A01支持
#define SPI_READ_FREQUENCY 20000000
```

### LovyanGFX 配置示例

```cpp
class LGFX : public lgfx::LGFX_Device {
    lgfx::Panel_GC9A01 _panel;
    lgfx::Bus_SPI _bus;
    lgfx::Light_PWM _light;
public:
    LGFX() {
        auto cfg = _bus.config();
        cfg.spi_host = SPI2_HOST;
        cfg.freq_write = 80000000;
        cfg.pin_mosi = 11;
        cfg.pin_sclk = 12;
        cfg.pin_dc   = 13;
        _bus.config(cfg);
        _panel.setBus(&_bus);

        auto pcfg = _panel.config();
        pcfg.pin_cs  = 10;
        pcfg.pin_rst = 14;
        pcfg.panel_width  = 240;
        pcfg.panel_height = 240;
        _panel.config(pcfg);

        auto lcfg = _light.config();
        lcfg.pin_bl = 9;
        _light.config(lcfg);
        _panel.setLight(&_light);

        setPanel(&_panel);
    }
};
```

---

## 5. I2S音频（INMP441 + MAX98357A）

### INMP441 麦克风接线

```
ESP32-S3          INMP441
─────────         ───────
GPIO4  (WS)   ──→ WS  (字选择/左右声道)
GPIO5  (SCK)  ──→ SCK (时钟)
GPIO15 (SD)   ←── SD  (数据输出)
3.3V          ──→ VDD
GND           ──→ GND
GND           ──→ L/R (GND=左声道, VDD=右声道)
```

### MAX98357A 功放接线

```
ESP32-S3          MAX98357A
─────────         ─────────
GPIO16 (BCLK) ──→ BCLK (位时钟)
GPIO17 (LRC)  ──→ LRC  (左右时钟)
GPIO18 (DIN)  ──→ DIN  (数据输入)
5V            ──→ VIN  (注意：5V供电!)
GND           ──→ GND
不接          ──  GAIN (默认9dB; 接GND=12dB; 接VDD=15dB)
               ──→ 喇叭+/喇叭- (接4Ω/8Ω扬声器)
```

### 代码框架 (Arduino + ESP-IDF I2S)

```cpp
#include <driver/i2s.h>

// ===== 麦克风配置 =====
void setupMic() {
    i2s_config_t i2s_mic_cfg = {
        .mode = (i2s_mode_t)(I2S_MODE_MASTER | I2S_MODE_RX),
        .sample_rate = 16000,
        .bits_per_sample = I2S_BITS_PER_SAMPLE_32BIT, // INMP441输出32bit
        .channel_format = I2S_CHANNEL_FMT_ONLY_LEFT,
        .communication_format = I2S_COMM_FORMAT_STAND_I2S,
        .intr_alloc_flags = ESP_INTR_FLAG_LEVEL1,
        .dma_buf_count = 4,
        .dma_buf_len = 1024,
        .use_apll = false,
    };
    i2s_pin_config_t mic_pins = {
        .bck_io_num = 5,    // SCK
        .ws_io_num = 4,     // WS
        .data_out_num = -1,
        .data_in_num = 15,  // SD
    };
    i2s_driver_install(I2S_NUM_0, &i2s_mic_cfg, 0, NULL);
    i2s_set_pin(I2S_NUM_0, &mic_pins);
}

// ===== 扬声器配置 =====
void setupSpeaker() {
    i2s_config_t i2s_spk_cfg = {
        .mode = (i2s_mode_t)(I2S_MODE_MASTER | I2S_MODE_TX),
        .sample_rate = 16000,
        .bits_per_sample = I2S_BITS_PER_SAMPLE_16BIT,
        .channel_format = I2S_CHANNEL_FMT_ONLY_LEFT,
        .communication_format = I2S_COMM_FORMAT_STAND_I2S,
        .intr_alloc_flags = ESP_INTR_FLAG_LEVEL1,
        .dma_buf_count = 8,
        .dma_buf_len = 1024,
        .use_apll = false,
    };
    i2s_pin_config_t spk_pins = {
        .bck_io_num = 16,   // BCLK
        .ws_io_num = 17,    // LRC
        .data_out_num = 18,  // DIN
        .data_in_num = -1,
    };
    i2s_driver_install(I2S_NUM_1, &i2s_spk_cfg, 0, NULL);
    i2s_set_pin(I2S_NUM_1, &spk_pins);
}

// ===== 录音 =====
void recordAudio(int16_t* buffer, size_t samples) {
    int32_t raw[samples];
    size_t bytes_read;
    i2s_read(I2S_NUM_0, raw, samples * 4, &bytes_read, portMAX_DELAY);
    // INMP441 数据在高18位，需要右移
    for (int i = 0; i < samples; i++) {
        buffer[i] = (int16_t)(raw[i] >> 14);
    }
}

// ===== 播放 =====
void playAudio(int16_t* buffer, size_t samples) {
    size_t bytes_written;
    i2s_write(I2S_NUM_1, buffer, samples * 2, &bytes_written, portMAX_DELAY);
}
```

### 注意事项
- INMP441 输出32bit但有效数据只有18bit（高位对齐），需右移处理
- ESP32-S3 有两个I2S控制器，麦克风和扬声器各用一个
- MAX98357A 用5V供电但信号是3.3V兼容的
- DMA缓冲区大小影响延迟：buf小=低延迟但CPU占用高

---

## 6. WiFi + BLE 同时使用

### 可行性
ESP32-S3 支持 WiFi + BLE 共存（共用同一个2.4GHz射频前端，时分复用）。

### 注意事项

1. **内存占用大**：WiFi+BLE同时约占 ~120KB RAM，确保使用PSRAM版本(R8)
2. **吞吐量下降**：共存模式下WiFi和BLE都会有性能损失（~20-30%）
3. **共存配置**：

```cpp
// 在 sdkconfig 或 menuconfig 中启用
CONFIG_BT_ENABLED=y
CONFIG_BT_NIMBLE_ENABLED=y       // NimBLE比Bluedroid省内存(~50KB)
CONFIG_ESP32S3_WIFI_SW_COEXIST=y  // 启用共存
CONFIG_SW_COEXIST_PREFERENCE_BALANCE=y  // 平衡模式
```

4. **推荐使用 NimBLE** 而非 Bluedroid：省约50KB RAM，API更简洁
5. **ADC2 在WiFi时不可用**：GPIO11-20的ADC功能会被WiFi占用
6. **天线选择**：PCB天线在金属外壳里信号差，考虑IPEX外接天线版本

### 典型使用模式（RWC）
```
WiFi: 连云端API、OTA更新、数据同步
BLE:  近场配网、与手机APP通信、低功耗beacon
```

---

## 7. 深度睡眠与低功耗

### 功耗参考

| 模式 | 电流 | 说明 |
|------|------|------|
| 正常运行(WiFi) | ~120-240mA | 发射时峰值更高 |
| Modem Sleep | ~20-30mA | CPU运行，WiFi/BLE关闭 |
| Light Sleep | ~1-2mA | CPU暂停，可快速唤醒 |
| Deep Sleep | ~7-10μA | 仅RTC运行 |
| Hibernation | ~2.5μA | 仅RTC Timer |

### 唤醒源

```cpp
#include <esp_sleep.h>

// 定时唤醒（如每30分钟同步一次）
esp_sleep_enable_timer_wakeup(30 * 60 * 1000000ULL); // 微秒

// GPIO唤醒（按键/传感器中断）
esp_sleep_enable_ext0_wakeup(GPIO_NUM_2, 0); // GPIO2低电平唤醒

// 触摸唤醒
esp_sleep_enable_touchpad_wakeup();

// 进入深度睡眠
esp_deep_sleep_start();

// 唤醒后判断原因
esp_sleep_wakeup_cause_t cause = esp_sleep_get_wakeup_cause();
switch (cause) {
    case ESP_SLEEP_WAKEUP_TIMER: /* 定时器 */ break;
    case ESP_SLEEP_WAKEUP_EXT0:  /* GPIO */   break;
    case ESP_SLEEP_WAKEUP_TOUCHPAD: /* 触摸 */ break;
    default: /* 首次上电 */ break;
}
```

### RWC低功耗策略
```
正常佩戴: Light Sleep为主，传感器定时采样，数据缓存后批量上传
充电中:   全速运行，WiFi常连，执行OTA检查
低电量:   仅保留基础传感器+RTC，关闭屏幕和音频
夜间:     Deep Sleep，加速度计唤醒（检测到运动就醒）
```

### 省电技巧
- 关闭不用的外设（`esp_wifi_stop()`, `esp_bt_controller_disable()`）
- SPI屏幕不显示时关背光（省 ~20mA）
- 传感器用低功耗模式/降低采样率
- 用 RTC 内存保存跨睡眠数据（8KB, `RTC_DATA_ATTR`）

---

## 8. OTA远程固件更新

### 分区表设计（16MB Flash 推荐）

```csv
# Name,   Type, SubType, Offset,  Size,    Flags
nvs,      data, nvs,     0x9000,  0x6000,
otadata,  data, ota,     0xf000,  0x2000,
app0,     app,  ota_0,   0x10000, 0x300000,  # 3MB
app1,     app,  ota_1,   0x310000,0x300000,  # 3MB
spiffs,   data, spiffs,  0x610000,0x1F0000,  # ~2MB 资源文件
```

### Arduino OTA 代码

```cpp
#include <HTTPUpdate.h>
#include <WiFiClientSecure.h>

void checkOTA() {
    WiFiClientSecure client;
    client.setInsecure(); // 或设置CA证书

    String url = "https://ota.rwc.example.com/firmware.bin";
    t_httpUpdate_return ret = httpUpdate.update(client, url);

    switch (ret) {
        case HTTP_UPDATE_FAILED:
            Serial.printf("OTA Failed: %s\n",
                httpUpdate.getLastErrorString().c_str());
            break;
        case HTTP_UPDATE_NO_UPDATES:
            Serial.println("No update available");
            break;
        case HTTP_UPDATE_OK:
            Serial.println("OTA Success! Rebooting...");
            break;
    }
}
```

### 进阶方案
- **版本管理**：固件带版本号，服务端比较后决定是否推送
- **回滚机制**：OTA失败自动回滚到上一分区（`esp_ota_mark_app_valid_cancel_rollback()`）
- **差分更新**：用 `esp_delta_ota` 组件，只传差异部分，省流量
- **安全签名**：启用 Secure Boot + 固件签名验证

---

## 9. PlatformIO 项目配置模板

### platformio.ini

```ini
[env:esp32s3]
platform = espressif32
board = esp32-s3-devkitc-1
framework = arduino
board_build.mcu = esp32s3

; Flash配置 (16MB)
board_build.flash_size = 16MB
board_build.partitions = partitions_16MB.csv
board_upload.flash_size = 16MB

; PSRAM
board_build.arduino.memory_type = qio_opi  ; Quad Flash + Octal PSRAM
build_flags =
    -DBOARD_HAS_PSRAM
    -DARDUINO_USB_MODE=1        ; 原生USB
    -DARDUINO_USB_CDC_ON_BOOT=1 ; USB串口
    ; I2C
    -DWIRE_SDA=6
    -DWIRE_SCL=7
    ; TFT_eSPI
    -DUSER_SETUP_LOADED
    -DGC9A01_DRIVER
    -DTFT_WIDTH=240
    -DTFT_HEIGHT=240
    -DTFT_MOSI=11
    -DTFT_SCLK=12
    -DTFT_CS=10
    -DTFT_DC=13
    -DTFT_RST=14
    -DSPI_FREQUENCY=80000000

; 串口
monitor_speed = 115200
upload_speed = 921600

; OTA
; upload_protocol = espota
; upload_port = 192.168.x.x

; 依赖库
lib_deps =
    bodmer/TFT_eSPI@^2.5.0
    ; lovyan03/LovyanGFX@^1.1.0
    lvgl/lvgl@^8.3.0
    adafruit/Adafruit BME280 Library@^2.2.0
    sparkfun/SparkFun MAX3010x Sensor Library@^1.1.2

; 额外编译选项
build_type = debug  ; release for production
```

### 项目结构

```
rwc-firmware/
├── platformio.ini
├── partitions_16MB.csv
├── src/
│   ├── main.cpp
│   ├── config.h          # 引脚定义、常量
│   ├── display/           # 屏幕驱动和UI
│   │   ├── display.h
│   │   └── display.cpp
│   ├── audio/             # I2S音频
│   │   ├── audio.h
│   │   └── audio.cpp
│   ├── sensors/           # I2C传感器
│   │   ├── sensors.h
│   │   └── sensors.cpp
│   ├── network/           # WiFi/BLE/OTA
│   │   ├── wifi_manager.h
│   │   └── ble_service.h
│   └── power/             # 电源管理
│       └── sleep.h
├── data/                  # SPIFFS资源文件
│   ├── index.html
│   └── config.json
├── include/
└── test/
```

---

## 附录：常用调试命令

```bash
# PlatformIO
pio run                     # 编译
pio run -t upload           # 上传
pio device monitor          # 串口监视
pio run -t menuconfig       # ESP-IDF配置

# 查看Flash信息
esptool.py --port /dev/cu.usbmodem* flash_id

# 擦除Flash（救砖）
esptool.py --port /dev/cu.usbmodem* erase_flash

# 查看分区表
esptool.py --port /dev/cu.usbmodem* read_flash 0x8000 0x1000 ptable.bin
gen_esp32part.py ptable.bin
```

---

*Continuous updates by RealWorldClaw Hardware Team*
