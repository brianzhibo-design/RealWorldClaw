# RealWorldClaw 基建规范补充 v1.0

> **打印机适配 · 质量审核 · 技术选型 深度方案**
> 补充 clawforge-spec-v1.md 标准二、标准四，新增技术选型章节

---

## 目录

1. [打印机适配深度方案](#1-打印机适配深度方案)
2. [质量审核深度方案](#2-质量审核深度方案)
3. [技术选型方案](#3-技术选型方案)

---

## 1. 打印机适配深度方案

### 1.1 Bambu Lab（拓竹）

**支持型号：** X1 Carbon, X1E, P1S, P1P, A1, A1 Mini

**协议与接入方式：**
- **局域网模式（推荐）：** MQTT over TLS (port 8883) + FTP (port 990)
  - 打印机在局域网广播 mDNS，服务名 `_bambu-mqtt._tcp`
  - 认证：设备序列号 + 访问码（在打印机LCD上获取）
  - MQTT Topic：`device/{serial}/report`（状态上报），`device/{serial}/request`（指令下发）
- **Bambu Cloud API：** 通过 `https://api.bambulab.com`，OAuth2认证
  - 适合远程打印场景，但延迟较高
- **文件传输：** FTPS上传3MF到打印机SD卡 `/model/` 目录

**关键API操作：**
```json
// 开始打印（MQTT publish to device/{serial}/request）
{
  "print": {
    "command": "project_file",
    "param": "Metadata/plate_1.gcode",
    "subtask_name": "clawforge_job_001",
    "url": "ftp://{printer_ip}/model/job.3mf",
    "timelapse": false,
    "bed_leveling": true,
    "flow_cali": true,
    "vibration_cali": true
  }
}

// 暂停/继续/取消
{ "print": { "command": "pause" } }
{ "print": { "command": "resume" } }
{ "print": { "command": "stop" } }
```

**状态监控字段：** `gcode_state`（IDLE/RUNNING/PAUSE/FINISH/FAILED），`mc_percent`（进度），`nozzle_temper`，`bed_temper`，`ams_status`（AMS耗材状态）

**AMS耗材管理：** 可通过MQTT读取每个AMS slot的耗材类型、颜色、剩余百分比。支持自动换料。

**开源参考项目：**
- `bambu-connect`（Python）: https://github.com/tfyre/bamern (社区逆向实现)
- `BambuStudio` 源码中的网络模块：https://github.com/bambulab/BambuStudio

---

### 1.2 Creality（创想三维）

**支持型号：** Ender-3 V3 系列, K1/K1 Max, CR-10 系列, Sermoon 系列

**接入方式（分代）：**

| 代次 | 型号 | 最佳接入方式 |
|------|------|-------------|
| 老款(Marlin) | Ender-3, CR-10 | OctoPrint（树莓派USB串口） |
| 新款(Klipper) | K1, K1 Max, Ender-3 V3 | Moonraker API（内置Klipper） |
| 云连接 | Sonic Pad设备 | Creality Cloud API |

**Creality Cloud API：** `https://model-api.creality.com`
- 官方文档有限，社区逆向为主
- 建议优先走Klipper/Moonraker路线（K1系列原生支持）

**K1/K1 Max 直接接入（推荐）：**
- SSH开启后（root@printer_ip），Moonraker运行在 port 7125
- 无需额外硬件，直接HTTP API控制
- 注意：需先通过 `creality-helper-script` 解锁完整Moonraker功能

**老款Ender-3接入：**
- 方案A：树莓派 + OctoPrint（USB串口连接）
- 方案B：ESP32刷Klipper + Moonraker（低成本方案）
- 方案C：Creality WiFi Box（官方方案，功能有限）

---

### 1.3 Prusa

**支持型号：** MK4/MK3.9, MINI+, XL (多头), Core One

**PrusaLink API：**
- 运行在打印机本机 HTTP port 80
- API文档：https://github.com/prusa3d/Prusa-Link-Web/blob/master/spec/openapi.yaml
- 认证：`X-Api-Key` header

**关键端点：**
```
GET  /api/v1/status          # 打印机状态
GET  /api/v1/job             # 当前任务
POST /api/v1/files/local     # 上传文件（multipart/form-data）
POST /api/v1/job/{id}/start  # 开始打印
DELETE /api/v1/job/{id}      # 取消任务
```

**PrusaConnect（云端）：**
- `https://connect.prusa3d.com` — 远程管理
- 支持摄像头监控、远程启动
- API: https://connect.prusa3d.com/docs/

**Prusa XL 多头特性：**
- 5个独立打印头，支持多材料/多颜色
- 可并行打印不同小零件（copy mode）
- 适合RealWorldClaw批量打印场景

---

### 1.4 Voron / 自组装Klipper机型

**协议：** 100% Moonraker API

**接入方式：** 标准Klipper/Moonraker栈，见 1.7 节详细说明

**Voron特有优势：**
- 全封闭腔体，适合ABS/ASA高温打印
- 社区活跃，固件/配置成熟
- 多数配备CANBUS工具头，扩展性强

---

### 1.5 Anycubic（纵维立方）

**支持型号：** Kobra 3, Kobra 2 系列, Photon 系列（光固化）

**FDM机型接入：**
- Kobra 3：自带WiFi，Anycubic Cloud API（文档有限）
- 老款Kobra/Mega：OctoPrint串口连接
- 社区Klipper固件可用于部分型号

**光固化（SLA/MSLA）机型：**
- Photon Mono系列：使用 `.pwma` 切片格式
- 切片器：Lychee Slicer 或 UVTools（开源）
- 接入方式：USB直传切片文件，暂无远程API
- **RealWorldClaw适配策略：** P2优先级，光固化主要用于精细外壳/精密零件场景

---

### 1.6 Elegoo

**支持型号：** Neptune 4 系列（FDM），Saturn/Mars 系列（光固化）

**FDM接入：**
- Neptune 4 系列：内置Klipper，Moonraker API直接可用（port 7125）
- 开箱即用，无需额外配置

**光固化接入：**
- Saturn/Mars：与Anycubic类似，USB传输切片文件
- 切片格式：`.ctb`（ChiTuBox）
- 远程控制：ChiTuBox Cloud（有限支持）

---

### 1.7 Klipper/Moonraker API 详细说明

Moonraker是Klipper的HTTP/WebSocket API网关，是最通用的3D打印机控制协议。

**API文档：** https://moonraker.readthedocs.io/en/latest/web_api/

**核心端点：**

```
# ─── 打印机状态 ───
GET  /printer/info                           # 打印机基本信息
GET  /printer/objects/query?heater_bed&extruder&print_stats&virtual_sdcard
                                             # 批量查询状态对象

# ─── 文件管理 ───
POST /server/files/upload                    # 上传G-code（multipart）
GET  /server/files/list?root=gcodes          # 列出文件
DELETE /server/files/gcodes/{filename}       # 删除文件

# ─── 打印控制 ───
POST /printer/print/start?filename=xxx.gcode # 开始打印
POST /printer/print/pause                    # 暂停
POST /printer/print/resume                   # 继续
POST /printer/print/cancel                   # 取消

# ─── G-code执行 ───
POST /printer/gcode/script?script=G28        # 发送任意G-code命令

# ─── 摄像头 ───
GET  /server/webcams/list                    # 列出摄像头
# 视频流通常在 /webcam/?action=stream

# ─── 历史记录 ───
GET  /server/history/list                    # 打印历史
GET  /server/history/totals                  # 累计统计

# ─── WebSocket实时推送 ───
ws://{host}/websocket
# 订阅状态变化，实时推送温度/进度/错误
```

**Moonraker状态对象关键字段：**
```json
{
  "print_stats": {
    "state": "printing|paused|standby|error|complete",
    "filename": "job.gcode",
    "total_duration": 3600.5,
    "print_duration": 3200.1,
    "filament_used": 1250.3
  },
  "virtual_sdcard": {
    "progress": 0.65,
    "file_position": 123456
  },
  "extruder": {
    "temperature": 210.5,
    "target": 215.0
  },
  "heater_bed": {
    "temperature": 59.8,
    "target": 60.0
  }
}
```

---

### 1.8 OctoPrint 插件生态

**API文档：** https://docs.octoprint.org/en/master/api/

**核心API：**
```
POST /api/files/local          # 上传文件
POST /api/job                  # 控制打印（start/cancel/pause）
GET  /api/job                  # 当前任务状态
GET  /api/printer              # 打印机状态
GET  /api/connection           # 连接状态
```

**RealWorldClaw可利用的插件：**

| 插件 | 用途 | 集成方式 |
|------|------|---------|
| **OctoPrint-MQTT** | 状态推送到MQTT broker | 直接对接RealWorldClaw MQTT |
| **Spaghetti Detective / Obico** | AI打印失败检测 | 利用其摄像头分析API |
| **PrintTimeGenius** | 精准时间预估 | 读取预估值用于调度 |
| **Filament Manager** | 耗材库存追踪 | API读取余量 |
| **Bed Visualizer** | 热床水平检测 | 质检参考 |
| **DisplayLayerProgress** | 层进度推送 | 精细进度监控 |
| **Telegram/Discord Notify** | 通知 | 可替换为RealWorldClaw通知 |
| **Octolapse** | 延时摄影 | 成品展示自动拍照 |
| **Cost Estimation** | 成本估算 | 打印定价参考 |

**OctoPrint适配器实现建议：**
- 通过OctoPrint REST API + MQTT Plugin双通道
- REST用于文件上传和指令下发
- MQTT用于实时状态订阅（低延迟）
- 兼容OctoPrint 1.9+

---

### 1.9 打印失败检测方案

#### 1.9.1 摄像头AI监控

**方案架构：**
```
摄像头视频流 → 帧采样(1fps) → AI推理 → 异常判定 → 暂停/通知
```

**检测目标：**
| 异常类型 | 检测方法 | 置信阈值 |
|----------|---------|---------|
| 意大利面（spaghetti） | YOLO目标检测 | >0.75 |
| 翘边（warping） | 边缘轮廓对比 | >0.80 |
| 层错位（layer shift） | 帧间差异分析 | >0.85 |
| 喷嘴堵塞（blob） | 异常堆积检测 | >0.70 |
| 脱离打印床（detach） | 目标消失检测 | >0.90 |
| 耗材断料 | 挤出机异常+视觉 | >0.80 |

**推荐实现方案：**

**方案A：本地推理（推荐家用）**
- 模型：YOLOv8n（nano版，适合边缘设备）
- 运行环境：树莓派4/5 + Coral TPU，或打印机自带SoC
- 推理速度：>10fps on Coral TPU
- 训练数据集：Obico开源数据集 + RealWorldClaw社区标注
- 开源参考：https://github.com/TheSpaghettiDetective/obico-server

**方案B：云端推理（打印农场）**
- 视频流上传到RealWorldClaw云端
- GPU集群批量推理，支持数百路并发
- 优势：模型持续更新，无需本地算力

**方案C：集成Obico（快速落地）**
- 对接Obico开源服务端（可自部署）
- 已有成熟的意大利面检测模型
- API：`POST /api/v1/p/{printer_id}/predict/` 上传帧图获取预测

**异常响应流程：**
```
检测到异常(confidence > threshold)
  → 连续3帧确认（避免误报）
  → 自动暂停打印
  → 拍摄当前状态照片
  → 通知Agent/用户
  → Agent决策：继续/取消/人工介入
```

#### 1.9.2 非视觉检测（补充）

- **温度异常：** 喷嘴/热床温度偏差>5°C持续30s → 告警
- **挤出机电流：** 电流异常波动 → 堵塞/断料预警
- **加速度传感器：** ADXL345检测异常振动 → 层错位预警
- **G-code对比：** 实际执行位置vs预期路径偏差 → 机械问题预警

---

### 1.10 多打印机调度算法（打印农场）

#### 1.10.1 调度架构

```
                    ┌──────────────┐
                    │  调度引擎     │
                    │  Scheduler   │
                    └──────┬───────┘
              ┌────────────┼────────────┐
        ┌─────┴─────┐ ┌───┴────┐ ┌────┴─────┐
        │ Printer 1  │ │ Ptr 2  │ │ Ptr N    │
        │ Bambu X1C  │ │ K1 Max │ │ Prusa XL │
        │ PLA白/黑   │ │ PLA白  │ │ PETG/ABS │
        └───────────┘ └────────┘ └──────────┘
```

#### 1.10.2 调度算法

**任务优先级队列：**
```python
priority_score = (
    urgency_weight * urgency          # 紧急度 (0-10)
  + wait_time_weight * wait_hours     # 等待时间衰减
  + user_rep_weight * user_reputation # 用户信誉
  + paid_weight * is_paid             # 付费任务加权
)
```

**打印机选择算法（匹配评分）：**
```python
def score_printer(job, printer):
    score = 0
    
    # 硬性条件（不满足则排除）
    if job.material not in printer.loaded_materials: return -1
    if job.bed_size > printer.bed_size: return -1
    if printer.state != 'idle': return -1
    
    # 软性评分
    score += material_match_score(job, printer)    # 材料完全匹配 +30
    score += bed_utilization(job, printer)          # 打印面积利用率 +20
    score += printer_reliability(printer)           # 历史成功率 +20
    score += queue_wait_time(printer)               # 队列等待时间 +15
    score += energy_efficiency(printer)             # 能耗效率 +10
    score += proximity_score(job, printer)          # 地理距离 +5
    
    return score
```

**批量优化（Bin Packing）：**
- 多个小零件可以拼盘打印（同材料/同参数）
- 算法：2D Bin Packing（First Fit Decreasing）
- 约束：同一盘的零件必须兼容（材料、层高、温度）

**负载均衡策略：**
- Round Robin（基础）→ Weighted Round Robin（按能力）→ Least Load（最少队列）
- 预测性调度：基于历史数据预测完成时间，提前安排下一任务

#### 1.10.3 故障转移

```
打印失败/打印机离线
  → 自动将任务重新入队
  → 标记失败打印机（临时降权）
  → 重新调度到下一个最佳打印机
  → 如连续失败3次 → 人工介入
```

---

### 1.11 耗材管理

#### 1.11.1 余量检测

| 方案 | 精度 | 适用场景 |
|------|------|---------|
| **AMS/MMU自带传感器** | ±5% | Bambu AMS, Prusa MMU3 |
| **称重法** | ±2% | 料盘下方放电子秤（HX711+压力传感器） |
| **编码器测量** | ±3% | 耗材经过编码器轮，计算消耗长度 |
| **G-code估算** | ±10% | 根据G-code计算理论耗材用量 |
| **视觉估算** | ±15% | 摄像头拍摄料盘，AI估算余量 |

#### 1.11.2 耗材数据库

```yaml
filament_inventory:
  - id: spool_001
    material: PLA
    color: white
    brand: eSUN
    weight_total: 1000g
    weight_remaining: 650g
    diameter: 1.75mm
    temp_nozzle: [200, 220]
    temp_bed: [50, 60]
    printer_id: bambu_x1c_01
    slot: AMS_1_slot_1
    purchase_date: 2026-01-15
    opened_date: 2026-01-20
    # 干燥状态
    dry_box: true
    last_dried: 2026-02-10
```

#### 1.11.3 自动换料

- **Bambu AMS：** 原生支持4色自动换料，通过MQTT监控slot状态
- **Prusa MMU3：** 支持5色，通过PrusaLink API监控
- **通用方案：** 打印前检查当前料量 ≥ 任务需求量 × 1.1（10%余量），不足则提前告警
- **智能调度：** 将需要相同颗粒的任务连续安排，减少换料次数

---

## 2. 质量审核深度方案

### 2.1 STL自动检测实现

#### 2.1.1 工具链

```
STL上传 → 格式验证 → 几何检测 → 可打印性分析 → 报告生成
```

**核心库选型：**

| 检测项 | 推荐工具/库 | 语言 | 说明 |
|--------|------------|------|------|
| STL解析 | `numpy-stl` / `trimesh` | Python | 读取和基础操作 |
| 网格修复 | `trimesh` + `manifold3d` | Python/C++ | 自动修复非流形 |
| 水密性检测 | `trimesh.is_watertight` | Python | 布尔值判断 |
| 壁厚分析 | `PrusaSlicer CLI --info` | CLI | 检测薄壁 |
| 悬垂分析 | 自研（法向量计算） | Python | 检测>45°悬垂面 |
| 尺寸验证 | `trimesh.bounds` | Python | 校验声明尺寸 |
| 切片验证 | `PrusaSlicer CLI --export-gcode` | CLI | 试切片验证可打印性 |
| 高级分析 | `OpenSCAD` + `ADMesh` | CLI | 补充检测 |

#### 2.1.2 具体检测流程

```python
import trimesh
import numpy as np

def auto_check_stl(stl_path, manifest):
    mesh = trimesh.load(stl_path)
    report = {}
    
    # 1. 基础格式
    report['valid_format'] = not mesh.is_empty
    report['face_count'] = len(mesh.faces)
    report['vertex_count'] = len(mesh.vertices)
    
    # 2. 水密性（可打印必须条件）
    report['is_watertight'] = mesh.is_watertight
    
    # 3. 非流形边/顶点
    report['non_manifold_edges'] = len(mesh.faces_unique_edges) - len(mesh.edges_unique)
    
    # 4. 法向量一致性
    report['normals_consistent'] = mesh.is_winding_consistent
    
    # 5. 尺寸校验（对比manifest声明）
    bounds = mesh.bounds
    actual_size = bounds[1] - bounds[0]  # [x, y, z] in mm
    declared_size = manifest['physical']['dimensions']
    report['size_match'] = np.allclose(sorted(actual_size), sorted(declared_size), atol=2.0)
    
    # 6. 打印床尺寸检查
    report['fits_common_bed'] = all(d <= 256 for d in actual_size[:2])  # 256mm常见打印床
    
    # 7. 悬垂面积占比
    face_normals = mesh.face_normals
    overhang_mask = face_normals[:, 2] < -np.cos(np.radians(45))
    report['overhang_ratio'] = float(overhang_mask.sum()) / len(face_normals)
    
    # 8. 最小壁厚（近似）—— 精确需用切片器
    # 使用 ray casting 采样检测
    
    # 9. 自动修复尝试
    if not mesh.is_watertight:
        repaired = trimesh.repair.fill_holes(mesh)
        report['auto_repair_success'] = repaired.is_watertight
    
    return report
```

#### 2.1.3 切片验证（深度检测）

```bash
# PrusaSlicer CLI 试切片
prusa-slicer --export-gcode \
  --load printer_profile.ini \
  --load print_profile.ini \
  --info \
  model.stl

# 检查输出：
# - 切片是否成功（exit code）
# - 预估时间/耗材是否与manifest匹配（±20%容差）
# - 是否产生了空层（模型问题）
# - 支撑体积占比（评估可打印性）
```

---

### 2.2 固件安全扫描

#### 2.2.1 扫描流程

```
固件源码上传 → 静态分析 → 依赖审计 → 编译沙箱测试 → 运行时检测
```

#### 2.2.2 静态分析

| 检测项 | 工具 | 说明 |
|--------|------|------|
| 恶意代码模式 | `semgrep` + 自定义规则 | 检测网络外连、文件系统访问等 |
| 硬编码凭据 | `trufflehog` / `gitleaks` | 检测嵌入的密码/密钥 |
| C/C++漏洞 | `cppcheck` + `flawfinder` | 缓冲区溢出等 |
| Arduino特有 | 自定义规则集 | 检测危险的GPIO操作、看门狗禁用等 |

**自定义Semgrep规则示例：**
```yaml
rules:
  - id: no-arbitrary-network
    pattern: WiFi.begin($SSID, $PASS)
    message: "固件不应硬编码WiFi凭据，应通过配置注入"
    severity: WARNING
    
  - id: no-raw-ota
    pattern: httpUpdate.update(...)
    message: "OTA更新必须使用签名验证"
    severity: ERROR
    
  - id: safe-gpio
    patterns:
      - pattern: pinMode($PIN, OUTPUT)
    metadata:
      note: "记录所有GPIO输出配置，对比manifest声明"
```

#### 2.2.3 依赖审计

```bash
# PlatformIO 依赖检查
pio pkg list --format json | python audit_deps.py

# 检查内容：
# - 所有依赖是否来自已知安全源（PlatformIO Registry, Arduino Library Manager）
# - 依赖版本是否有已知CVE
# - 是否有非必要的网络库（HTTP client等）
# - 许可证兼容性
```

#### 2.2.4 沙箱编译测试

- 使用Docker容器隔离编译环境
- `docker run --network=none realclaw/build-sandbox platformio run`
- 编译产物进行二进制分析（检查异常符号、网络调用）

#### 2.2.5 运行时检测（高级，Phase 2+）

- ESP32模拟器（QEMU + ESP32 fork）运行固件
- 监控网络行为（是否尝试外连未声明地址）
- 监控GPIO行为（是否操作未声明引脚）
- 超时检测（固件是否正常响应看门狗）

---

### 2.3 社区验证激励机制

#### 2.3.1 验证行为积分（计入统一信誉分）

> 以下积分直接累加到用户的信誉分（reputation），与平台规范 §2.4 的信誉加减分规则合并生效，受每日上限约束。

```yaml
point_rewards:
  # ─── 验证行为 ───
  print_verify:           50    # 实际打印并上传照片
  print_verify_detailed:  80    # 打印+详细测评（含参数/问题/建议）
  code_review:            30    # 代码审查并提交审查报告
  deploy_verify:          40    # 部署运行并上传日志
  bug_report_confirmed:   25    # 提交的bug被确认
  fix_pr_merged:         100    # 修复PR被合并
  
  # ─── 内容贡献 ───
  tutorial_post:          30    # 教程帖
  answer_help:            15    # 帮助回答问题
  
  # ─── 消费 ───
  upvote_given:            2    # 投票（防刷，低分值）
  
point_penalties:
  spam_review:           -100   # 灌水评测
  fake_photo:            -200   # 伪造打印照片
  sock_puppet:           -500   # 小号刷分（封号）
```

#### 2.3.2 等级与特权

> **注意：** 本节等级体系已与平台规范 §2.4 的信誉（reputation）体系统一。不再使用独立的积分等级，所有验证行为产生的积分直接计入用户信誉分。

| 信誉等级 | 信誉分 | 代号 | 验证权重 | 特权 |
|----------|--------|------|----------|------|
| 🌱 新人 | 0-19 | newcomer | ×1 | 基础上传/评论 |
| 🔧 贡献者 | 20-99 | contributor | ×1 | 组件上传免部分自动检查等待 |
| ⭐ 可信成员 | 100-499 | trusted | ×1.5 | 社区验证权重×1.5，可参与仲裁投票，快速通道上架 |
| 💎 核心成员 | 500-1999 | core | ×2 | 验证权重×2，可提名官方认证，审核内容 |
| 👑 传奇 | 2000+ | legend | ×3 | 最高权重×3，仲裁委员会成员，平台决策投票 |

#### 2.3.3 实物激励（Phase 2+）

- **月度Top验证者：** 免费耗材券（赞助商提供）
- **年度贡献者：** RealWorldClaw定制徽章/奖杯（自产3D打印）
- **打印农场分成：** 验证过的组件每次被打印，原作者+验证者获得小额分成

#### 2.3.4 反作弊

- 打印照片EXIF验证（时间、设备信息）
- 照片AI查重（检测重复使用/网图）
- 同一IP/设备的多账号检测
- 验证行为模式分析（速度异常快 → 人工审查）

---

### 2.4 争议仲裁流程

```
┌─ 发起争议 ─────────────────────────────────────────────┐
│  用户提交争议申请，附证据材料                             │
│  类型：质量问题 / 版权侵权 / 安全隐患 / 虚假信息         │
└──────────────┬──────────────────────────────────────────┘
               ▼
┌─ 自动预审（1小时内）────────────────────────────────────┐
│  • 检查争议是否重复                                      │
│  • 自动分类和严重度评估                                   │
│  • 安全隐患类 → 立即下架，同时通知组件作者               │
│  • 其他类 → 进入社区仲裁                                 │
└──────────────┬──────────────────────────────────────────┘
               ▼
┌─ 社区仲裁（72小时）────────────────────────────────────┐
│  • 随机抽选5名L3+仲裁员（排除利益相关方）                │
│  • 双方各提交1次陈述+证据                                │
│  • 仲裁员独立投票（同意/驳回/需更多信息）                │
│  • ≥3票一致 → 裁决生效                                   │
│  • 不够票 → 追加2名仲裁员，延长48小时                    │
└──────────────┬──────────────────────────────────────────┘
               ▼
┌─ 上诉（可选，7天内）───────────────────────────────────┐
│  • 任一方可上诉                                          │
│  • 上诉由平台管理团队终审                                 │
│  • 终审决定为最终裁决                                     │
└────────────────────────────────────────────────────────┘
```

---

### 2.5 组件下架和申诉流程

#### 2.5.1 下架触发条件

| 条件 | 动作 | 可申诉 |
|------|------|--------|
| 安全漏洞（confirmed） | 立即下架 | ✅ 修复后可申诉恢复 |
| 社区仲裁判定质量问题 | 48h后下架 | ✅ |
| 版权侵权（DMCA等） | 立即下架 | ✅ 反通知流程 |
| ≥3个独立负面打印验证 | 自动标记+通知作者 | ✅ 作者修复后重新验证 |
| 作者主动下架 | 立即下架 | N/A |
| 账号被封禁 | 所有组件冻结 | ✅ 账号申诉 |

#### 2.5.2 下架影响

- 已下载的组件包不受影响（本地副本）
- 组件页面标注 `⚠️ DELISTED` + 下架原因
- 引用该组件的方案收到通知
- 下架组件的打印统计保留（用于数据分析）

#### 2.5.3 申诉流程

```
作者提交申诉（附修复说明/反驳证据）
  → 平台审核（5个工作日内）
  → 通过 → 恢复上架（标注"已修复"）
  → 驳回 → 可再次申诉（仅1次），由高级管理团队终审
```

---

## 3. 技术选型方案

### 3.1 后端技术栈

```
┌─────────────────────────────────────────────┐
│  API Gateway: Traefik / Kong               │
├─────────────────────────────────────────────┤
│  核心服务                                    │
│  ┌──────────┐ ┌──────────┐ ┌────────────┐  │
│  │ 组件服务  │ │ 匹配引擎  │ │ 打印调度    │  │
│  │ Rust     │ │ Python   │ │ Rust/Go    │  │
│  └──────────┘ └──────────┘ └────────────┘  │
│  ┌──────────┐ ┌──────────┐ ┌────────────┐  │
│  │ 社区服务  │ │ 审核服务  │ │ 用户/认证   │  │
│  │ Rust     │ │ Python   │ │ Rust       │  │
│  └──────────┘ └──────────┘ └────────────┘  │
├─────────────────────────────────────────────┤
│  消息队列: NATS / Redis Streams             │
│  数据库:   PostgreSQL + Redis + Meilisearch │
│  对象存储: S3-compatible (MinIO / 云OSS)     │
└─────────────────────────────────────────────┘
```

**语言选择：**

| 服务 | 推荐语言 | 理由 |
|------|---------|------|
| 核心API | **Rust** (Axum框架) | 高性能、类型安全、适合长期维护 |
| 匹配引擎 | **Python** (FastAPI) | ML生态好、快速迭代 |
| 打印调度 | **Rust** 或 **Go** | 并发性能、可靠性 |
| 审核/AI | **Python** (FastAPI) | AI/ML库丰富 |
| CLI工具 | **Rust** | 单二进制分发、跨平台 |

**数据库选择：**

| 数据 | 存储 | 理由 |
|------|------|------|
| 结构化数据（用户/组件/订单） | **PostgreSQL 16** | 成熟可靠、JSON支持好 |
| 缓存/会话/实时状态 | **Redis 7** | 打印机状态缓存、任务队列 |
| 全文搜索 | **Meilisearch** | 开源、快速、中文支持好 |
| 时序数据（温度/打印日志） | **TimescaleDB** (PG扩展) | 打印过程监控数据 |
| 文件存储 | **S3/MinIO** | STL/3MF/固件包 |

**框架选择：**
- **Axum** (Rust): 异步、Tower中间件生态、tokio运行时
- **FastAPI** (Python): OpenAPI自动生成、async支持、AI服务首选
- **NATS**: 轻量级消息队列，适合打印机状态广播和任务调度

---

### 3.2 前端技术栈

```
┌─────────────────────────────────┐
│  Web App (主平台)                │
│  Next.js 14+ (App Router)      │
│  React + TypeScript             │
│  Tailwind CSS + shadcn/ui       │
│  3D预览: Three.js + React-Three │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│  3D模型预览器                    │
│  Three.js (STL/3MF渲染)        │
│  在线切片预览 (可选)             │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│  打印监控面板                    │
│  WebSocket实时更新               │
│  摄像头视频流 (WebRTC/HLS)      │
│  G-code可视化 (gcode-preview)   │
└─────────────────────────────────┘
```

**关键前端库：**
- `three.js` + `@react-three/fiber`：3D模型渲染预览
- `gcode-preview`：G-code路径可视化
- `zustand`：状态管理（轻量）
- `tanstack-query`：API数据获取/缓存
- `tiptap`：富文本编辑器（社区帖子）
- `recharts`：数据图表（打印统计）

---

### 3.3 可复用的开源项目

| 项目 | 用途 | 许可证 |
|------|------|--------|
| **OctoPrint** | 打印机控制参考实现 | AGPL-3.0 |
| **Moonraker** | Klipper API网关 | GPL-3.0 |
| **Obico** (原Spaghetti Detective) | AI打印监控 | AGPL-3.0 |
| **PrusaSlicer** | 切片引擎（CLI模式） | AGPL-3.0 |
| **trimesh** | 3D网格处理（Python） | MIT |
| **manifold** | 几何内核（CSG操作） | Apache-2.0 |
| **CadQuery** | 参数化CAD生成 | Apache-2.0 |
| **Three.js** | 3D渲染 | MIT |
| **Meilisearch** | 全文搜索引擎 | MIT |
| **MinIO** | S3兼容对象存储 | AGPL-3.0 |
| **NATS** | 消息队列 | Apache-2.0 |
| **Authentik** / **Keycloak** | 身份认证 | MIT / Apache-2.0 |
| **gcode-preview** | G-code可视化 | MIT |
| **ADMesh** | STL网格修复 | GPL-2.0 |

⚠️ **许可证注意：** AGPL项目用作独立服务（不链接到平台代码）可规避传染，但需在服务边界仔细隔离。

---

### 3.4 基础设施方案

#### 3.4.1 部署架构

```
┌─── 全球边缘 ───┐     ┌─── 核心区域 ───────────────────┐
│  Cloudflare    │     │  主集群 (AWS/阿里云)             │
│  CDN + WAF     │────▶│  Kubernetes (K3s精简版)          │
│  R2 (静态资源)  │     │  ┌────────────────────────┐     │
└────────────────┘     │  │ 服务 Pods               │     │
                       │  │ api / match / print /   │     │
                       │  │ review / community      │     │
                       │  └────────────────────────┘     │
                       │  ┌────────────────────────┐     │
                       │  │ 数据层                   │     │
                       │  │ PG / Redis / Meilisearch│     │
                       │  └────────────────────────┘     │
                       │  ┌────────────────────────┐     │
                       │  │ AI推理 (GPU节点，按需)    │     │
                       │  │ 匹配引擎 / 打印监控AI    │     │
                       │  └────────────────────────┘     │
                       └──────────────────────────────────┘
```

#### 3.4.2 推荐云服务

| 组件 | 国内方案 | 海外方案 |
|------|---------|---------|
| 计算 | 阿里云 ECS / ACK | AWS EKS / Fly.io |
| 数据库 | 阿里云 RDS PostgreSQL | AWS RDS / Supabase |
| 对象存储 | 阿里云 OSS | AWS S3 / Cloudflare R2 |
| CDN | 阿里云 CDN | Cloudflare |
| 消息队列 | 自建 NATS | 自建 NATS |
| 搜索 | 自建 Meilisearch | Meilisearch Cloud |
| GPU推理 | 阿里云 GPU实例 / AutoDL | AWS G5 / RunPod |
| 域名/DNS | Cloudflare | Cloudflare |
| 监控 | Grafana + Prometheus | Grafana Cloud |
| 日志 | Loki | Loki |

#### 3.4.3 成本估算（MVP阶段）

```
计算:  2x 4C8G 实例          ≈ ¥400/月
数据库: PG 2C4G + Redis 1G   ≈ ¥300/月
存储:  100GB OSS              ≈ ¥10/月
CDN:   1TB流量/月             ≈ ¥50/月
GPU:   按需（审核时启动）      ≈ ¥200/月
──────────────────────────────────
MVP总计                       ≈ ¥1000/月
```

#### 3.4.4 本地开发环境

```bash
# docker-compose.dev.yml 一键启动
docker compose -f docker-compose.dev.yml up

# 包含：
# - PostgreSQL 16
# - Redis 7
# - Meilisearch
# - MinIO (S3)
# - NATS
# - Mailhog (邮件测试)
```

---

*RealWorldClaw 基建规范补充 v1.0*
*起草：沸羊羊 💪 | 羊村调研部*
*日期：2026-02-20*
*状态：深化草案，补充标准二+标准四+技术选型*
