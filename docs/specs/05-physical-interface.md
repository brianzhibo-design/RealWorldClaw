# 05 — 标准五：物理接口规范（Physical Interface Spec）

> RealWorldClaw 标准规范 · 编号 05
> 版本：v1.1 | 来源：realworldclaw-spec-v1.md §7（不含§7.10，已独立为标准七）

---

## 1. 机械连接

```yaml
fasteners:
  primary: M3 (过孔3.2mm, 热熔螺母孔4.0mm)
  secondary: M2.5
connection_types:
  bolt: M3螺栓        # 结构件
  snap_fit: 卡扣       # 盖板、快拆
  magnetic: 6x3mm钕磁铁 # 可更换模块
```

## 2. 尺寸网格

```yaml
grid_unit: 20mm

module_sizes:
  1U: [20, 20]mm    # LED、按钮
  2U: [40, 20]mm    # 传感器
  3U: [60, 40]mm    # 主控+传感器
  4U: [80, 60]mm    # 带屏幕
  6U: [120, 80]mm   # 多功能基站

height_units:
  slim: 15mm        # 纯传感器
  standard: 30mm    # 有电路板
  tall: 50mm        # 有电池/屏幕

mounting_holes: 网格交叉点，最少2个
```

## 3. 电气接口

```yaml
connector: JST-XH 2.54mm
standard_interfaces:
  power:    [VCC, GND]               # 2pin
  i2c:      [VCC, GND, SDA, SCL]     # 4pin
  uart:     [VCC, GND, TX, RX]       # 4pin
  gpio:     [VCC, GND, SIG1, SIG2]   # 4pin
power_rails:
  logic: 3.3V
  peripheral: 5V
  motor: 12V (隔离)
cable_colors:
  red: VCC   black: GND   yellow: SDA/TX   white: SCL/RX   green: GPIO
```

## 4. 外壳设计

```yaml
wall_thickness: min 1.6mm, recommended 2.0mm, load-bearing 3.0mm
tolerances: press 0.1mm, sliding 0.3mm, loose 0.5mm, lid 0.25mm
fillets: internal ≥1.0mm, external ≥0.5mm
standard_cutouts:
  usb_c: [9.2, 3.4]mm
  led_3mm: Φ3.2mm
  led_5mm: Φ5.2mm
  button_6mm: Φ6.2mm
```

## 5. 防护等级

| 等级 | 代号 | 环境 | 材料 | 密封 |
|------|------|------|------|------|
| 室内基础 | CF-P0 | 15-35°C, <80%RH | PLA | 无 |
| 室内防溅 | CF-P1 | 5-40°C, <95%RH | PETG | 盖板密封圈 |
| 户外基础 | CF-P2 | -10~50°C | ASA/PETG | 全密封+排水孔 |
| 户外全天候 | CF-P3 | -20~60°C, IP65 | ASA | 双密封+灌封 |

## 6. 安装方式

| 方式 | 规格 |
|------|------|
| 桌面 | 4x硅胶脚垫 8mm |
| 壁挂 | 钥匙孔挂槽 10x5mm |
| DIN导轨 | DIN 35mm卡扣 |
| 磁吸 | 4x 6x3mm钕磁铁 |
| 夹持 | 适配Φ15-30mm |
| 通用板 | 4xM3 on 20mm grid, VESA 75兼容 |

## 7. 可打印性

```yaml
max_overhang: 45°
max_bridge: 30mm
min_detail: 0.8mm
avoid_supports: preferred
nozzle_compatible: [0.3~0.6]mm
max_parts: 6
single_plate: preferred
```

## 8. 模块组合

```yaml
stacking: 4x M3铜柱 at 20mm corners, max 5层
side_by_side: 燕尾槽导轨 5mm宽x3mm深

templates:
  weather_station: [sensor_top, compute_mid, power_bottom]
  security_cam: [camera_top, compute_bottom] + wall_mount
```

## 9. 通信

```yaml
mqtt:
  broker: 母机本地运行
  topic_format: "rwc/{agent_id}/{component_id}/{data_type}"
  payload: JSON
  qos: 1
  discovery_topic: "rwc/discovery"
```
