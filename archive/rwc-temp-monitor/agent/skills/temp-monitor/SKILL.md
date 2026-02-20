# temp-monitor — OpenClaw 技能配置

## 概述

温湿度监控技能，通过MQTT订阅ESP32-C3上报的温湿度数据，提供实时查询、历史趋势、异常告警等功能。

## MQTT 主题

### 订阅（接收传感器数据）
- `rwc/{agent_id}/temp-monitor/temperature` — 温度数据
- `rwc/{agent_id}/temp-monitor/humidity` — 湿度数据  
- `rwc/{agent_id}/temp-monitor/status` — 设备状态

### 发布（下发命令）
- `rwc/{agent_id}/temp-monitor/command` — 控制命令
- `rwc/{agent_id}/temp-monitor/config` — 配置更新

## 数据格式

### 温度消息
```json
{"value": 25.3, "unit": "°C", "ts": 123456}
```

### 湿度消息
```json
{"value": 52.1, "unit": "%RH", "ts": 123456}
```

### 状态消息
```json
{
  "state": "online",
  "ip": "192.168.1.50",
  "rssi": -45,
  "uptime_s": 3600,
  "version": "1.0.0",
  "interval_s": 30
}
```

## 命令

### 立即读取
```json
{"cmd": "read_now"}
```

### 重启设备
```json
{"cmd": "restart"}
```

### 修改上报间隔
```json
{"interval_s": 60}
```
发送到 config 主题。

## 告警规则

```yaml
alerts:
  high_temp:
    condition: temperature > 30
    message: "🔴 温度过高：{value}°C"
    cooldown: 300  # 5分钟内不重复告警

  low_temp:
    condition: temperature < 16
    message: "🔴 温度过低：{value}°C"
    cooldown: 300

  high_humidity:
    condition: humidity > 70
    message: "🟡 湿度偏高：{value}%RH"
    cooldown: 600

  low_humidity:
    condition: humidity < 30
    message: "🟡 湿度偏低：{value}%RH，建议开加湿器"
    cooldown: 600

  device_offline:
    condition: "no_data_for > 120"
    message: "⚠️ 温湿度监控器离线超过2分钟"
```

## 自然语言查询示例

| 用户说 | 技能动作 |
|--------|---------|
| "现在温度多少" | 返回最新温度 |
| "湿度怎么样" | 返回最新湿度 + 舒适度评价 |
| "今天温度趋势" | 返回当日温度变化摘要 |
| "设备状态" | 返回在线状态、信号强度等 |
| "把上报间隔改成1分钟" | 下发config命令 |

## 依赖

- MQTT Broker（如Mosquitto）需预先部署
- OpenClaw主agent需配置MQTT连接信息
