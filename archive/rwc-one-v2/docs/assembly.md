# 🔧 Clawbie V2 组装指南

> 总用时：5分钟以内。不是开玩笑。

## 准备

- M5StickC Plus2 × 1
- 3D打印好的蟹爪外壳 × 1
- USB-C 数据线 × 1
- 电脑（装好PlatformIO）

## 第一步：烧录固件（3分钟）

1. USB-C连接M5StickC Plus2和电脑
2. 打开终端，进入 `firmware/` 目录
3. 运行：
   ```bash
   pio run -t upload
   ```
4. 等待上传完成（约1-2分钟）
5. 屏幕显示 "Clawbie V2 Starting up..." 表示成功

### WiFi配置

编辑 `firmware/src/main.cpp` 顶部：
```cpp
#define WIFI_SSID  "你的WiFi名"
#define WIFI_PASS  "你的WiFi密码"
#define MQTT_SERVER "你的MQTT服务器"
```

> 没有WiFi/MQTT？没关系，离线模式一样玩。表情、温度、时钟都能用。

## 第二步：套外壳（1分钟）

1. 拿起蟹爪外壳，正面朝你（有屏幕开孔的一面）
2. 从顶部把M5StickC Plus2滑入外壳
3. 轻轻按压两侧，听到「咔哒」声，卡扣到位
4. 确认：
   - ✅ 屏幕从正面开孔露出
   - ✅ USB-C口从底部露出
   - ✅ 按钮A（正面）和按钮B（侧面）可以正常按压
   - ✅ 蟹爪朝上，底座平放稳定

### 拆卸

两侧同时向外掰开卡扣，向上取出即可。可反复拆装。

## 第三步：开机使用（10秒）

按一下侧面电源键，Clawbie启动！

### 操作方式

| 操作 | 效果 |
|------|------|
| 按A键 | 切换页面：表情 → 温度 → 时钟 |
| 按B键 | 表情页：切换表情 |
| 摇一摇 | 随机换表情（附带音效） |

## （可选）接DHT22

详见 [wiring.md](../electronics/wiring.md)。三根杜邦线，即插即用。

---

**恭喜！你的蟹爪宝宝已经活了 🦀✨**
