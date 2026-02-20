# 组装指南 🔧

## 准备工作

### 所需零件
参见 `electronics/bom.yaml`，核心零件：
- ESP32-C3 SuperMini × 1
- DHT22 传感器模块 × 1
- 10kΩ 电阻 × 1
- 3mm 绿色LED × 1
- 220Ω 电阻 × 1
- 杜邦线母对母 × 6根
- M3×8mm 螺丝 × 4 + M3螺母 × 4

### 3D打印件
用 `models/enclosure.scad` 生成并打印：
```bash
openscad -D 'render_part="bottom"' -o enclosure-bottom.stl enclosure.scad
openscad -D 'render_part="lid"' -o enclosure-lid.stl enclosure.scad
```
打印设置：PLA，0.2mm层高，20%填充，无支撑

### 工具
- 十字螺丝刀
- 电脑（烧录固件）
- USB-C数据线

---

## 步骤

### 第1步：接线（5分钟）

参考 `electronics/wiring.md` 中的接线图。

1. **DHT22 → ESP32-C3**
   - DHT22 VCC (pin 1) → ESP32 3V3 🔴
   - DHT22 DATA (pin 2) → ESP32 GPIO4 🟢
   - DHT22 GND (pin 4) → ESP32 GND ⚫
   - 10kΩ电阻跨接在 VCC 和 DATA 之间

2. **LED → ESP32-C3**
   - LED 阳极（长脚）→ 220Ω电阻 → ESP32 GPIO8
   - LED 阴极（短脚）→ ESP32 GND

> 💡 DHT22的pin 3不接（NC）

### 第2步：烧录固件（3分钟）

1. 安装 PlatformIO（VS Code插件或CLI）
2. 编辑 `firmware/src/main.ino`，修改WiFi和MQTT配置：
   ```c
   #define DEFAULT_WIFI_SSID  "你的WiFi名"
   #define DEFAULT_WIFI_PASS  "你的WiFi密码"
   #define DEFAULT_MQTT_SERVER "你的MQTT服务器IP"
   ```
3. USB线连接ESP32到电脑
4. 烧录：
   ```bash
   cd firmware
   pio run -e esp32c3 -t upload
   ```
5. 打开串口监控验证：
   ```bash
   pio device monitor -b 115200
   ```
   应看到WiFi连接和温湿度读数

### 第3步：组装外壳（5分钟）

1. 将ESP32-C3放入底壳，USB-C口对准前面板开孔
2. 将DHT22传感器放在侧面通风格栅内侧
3. LED插入前面板LED孔
4. 整理杜邦线，避免挤压
5. 盖上盖板，按压四角直到卡扣"咔"一声扣上
6. 使用M3螺丝固定底部安装孔（桌面放置可跳过此步）

### 第4步：测试（2分钟）

1. USB-C线连接供电
2. 观察LED状态：
   - 快闪 → WiFi连接中
   - 慢闪 → MQTT连接中
   - 常亮 → 一切正常 ✅
3. 检查MQTT客户端是否收到数据

---

## 安装方式

### 桌面放置
直接放桌上即可，底部可贴防滑垫

### 壁挂安装
用M3螺丝通过底部安装孔固定到墙面

### 磁吸安装
底部粘贴强力磁铁片，可吸附在冰箱等金属面

---

## 故障排查

| 现象 | 可能原因 | 解决 |
|------|---------|------|
| LED不亮 | USB线不通/ESP32没启动 | 换数据线(非充电线) |
| LED快闪不停 | WiFi连不上 | 检查SSID和密码 |
| 温度读数NaN | DHT22接线错误 | 检查上拉电阻和数据线 |
| MQTT无数据 | 服务器地址错误 | 检查IP和端口 |
