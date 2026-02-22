# Bambu Lab P2S 技术规格（学习笔记）

> 来源: wiki.bambulab.com/en/p2s + GitHub bambulab

## 核心规格
- **打印体积**: 256×256×256 mm³
- **整机尺寸**: 392×406×478mm³
- **重量**: 14.9 kg
- **架构**: Core-XY（与P1S相同架构但全面重新设计）
- **最大移动速度**: 600 mm/s
- **最大加速度**: 20,000 mm/s²
- **最高喷嘴温度**: 300°C
- **最高热床温度**: 110°C
- **默认喷嘴**: 硬化钢
- **摄像头**: 1920×1080, 30fps

## 与P1S的关系
- P2S是P1S的**全面迭代**（不是小改款）
- 框架结构、主板、喷头、屏幕、风循环系统全部重新设计
- P1S **无法**通过换零件升级为P2S
- 打印体积、热床规格相同（兼容同规格打印板）
- **皮带和张紧器不兼容**P1S
- **屏幕不兼容**P1S（错装可能损坏主板）
- **喷嘴兼容H2D**，不兼容A1

## P2S新增特性（相比P1S）
- 触摸屏
- 高帧率摄像头（1080p 30fps）
- 更便捷的网络连接
- 永磁同步伺服电机（挤出机）
- 接触式喷嘴堆积检测
- 支持左侧辅助冷却风扇（选配）
- 支持高流量热端（选配）

## 速度模式
- **Ludicrous**: 166%速度和加速度
- **Sport**: 124%
- **Standard**: 100%（默认）
- **Silent**: 50%（<50dB@1m）

## 风扇系统
- **零件冷却风扇**: 喷头上，冷却打印层
- **右侧辅助风扇**: 腔体右侧，高速打印辅助冷却
- **冷却模式**: PLA等低温材料，外部冷空气进入腔体
- **加热模式**: 热空气内循环+过滤

## 耗材支持
PLA, PETG, ABS, ASA, TPU, PET, PA, PC, PVA, PLA-CF, PETG-CF, ABS-GF, ASA-CF, PA6-CF, PA6-GF, PAHT-CF, PPA-CF, PET-CF, PC+ABS

## 电源
- 100-120 VAC / 200-240 VAC, 50/60 Hz
- 最大功率: 1200W@220V / 1000W@110V
- 稳态功率(PLA): 200W@220V / 100W@110V
- 待机: ~8W

## AMS兼容
- 支持AMS 2 Pro（6pin线缆连接）
- 最多8个AMS（4×AMS 2 Pro + 4×AMS HT）= 20色
- 需要Buffer（Combo版自带，单机版需另购）
- Buffer有两个进料口（双AMS或AMS+外置料架）

## WiFi
- 支持双频 5G + 2.4G

## LAN模式
- 设置 → WLAN → LAN Only Mode → ON
- 需要记下Access Code
- Bambu Studio中设备页发现打印机 → 输入Access Code
- LAN模式限制：无远程打印、无Bambu Handy、无打印历史
- X1系列LAN需SD卡，P2S待确认
- Developer Mode: 允许第三方软件控制打印机

## 软件兼容
- **Bambu Studio**: 官方软件，完整支持P2S（v2.3.0.70+）
- **OrcaSlicer**: 无原生P2S配置（用P1S近似）；新认证系统后LAN发送需要Bambu Connect
- **Bambu Connect**: Beta版，P2S支持状态待确认
- **Bambu Handy**: 手机App，v3.8.0+支持P2S新功能

## GitHub资源 (github.com/bambulab)
- **BambuStudio**: 开源切片软件（C++, 4k stars）
- **Bambu-Handy**: 手机App
- 还有wxWidgets fork, ffmpeg prebuilts, gmp, boost

## 对RealWorldClaw的启示
1. **打印机适配层应直接支持P2S**而非只用P1S代替
2. **Bambu Studio是P2S的最佳发送方式**（CLI或API待研究）
3. **MQTT通信可能受新认证系统限制**，需开启Developer Mode
4. **600mm/s + 20000mm/s²的能力意味着我们的Energy Core前壳可能只需20-30分钟**
5. **摄像头1080p 30fps可用于远程打印监控**
