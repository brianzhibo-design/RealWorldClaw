# 02 — 标准二：打印机适配规范（Printer Adapter Spec）

> RealWorldClaw 标准规范 · 编号 02
> 版本：v1.1 | 来源：realworldclaw-spec-v1.md §4

---

## 1. 适配器插件格式

```yaml
adapter:
  id: bambu-lab
  version: 1.0.0
  display_name:
    en: "Bambu Lab"
    zh: "拓竹"
  supported_models:
    - id: x1c
      name: "X1 Carbon"
    - id: p1s
      name: "P1S"
    - id: a1
      name: "A1"
    - id: a1-mini
      name: "A1 Mini"
  protocol: bambu-lan
  discovery: mdns
  capabilities:
    upload: true
    start_print: true
    monitor_progress: true
    camera: true
    auto_slice: true
    multi_color: true
    pause_resume: true
    cancel: true
  input_formats: [3mf, gcode]
  slicing: builtin
```

## 2. 自动化等级

| 等级 | 条件 | 体验 |
|------|------|------|
| 🟢 全自动 | upload + start_print + monitor 全true | 说一句话搞定 |
| 🟡 半自动 | 能upload但需人工确认 | 多点一下 |
| 🔵 辅助 | 只能生成文件 | 用户手动导入 |

## 3. 发现机制

```
OpenClaw启动 → 自动扫描局域网
  ├── mDNS（Bambu Lab、PrusaLink）
  ├── OctoPrint API探测（端口5000）
  ├── Moonraker API探测（端口7125）
  └── 用户手动添加（IP+型号）
→ 保存到本地配置
```

## 4. 切片策略

```
收到打印任务
  ├── 打印机支持3MF直传？→ 发送3MF，机内切片
  ├── 只收G-code？→ PrusaSlicer CLI本地切片
  └── 完全封闭？→ 导出STL + 推荐参数文本
```

默认切片器：**PrusaSlicer CLI**

## 5. 适配优先级

| 优先级 | 品牌 | 协议 |
|--------|------|------|
| P0 | Bambu Lab 拓竹 | 局域网API |
| P0 | Creality 创想三维 | OctoPrint/Klipper |
| P1 | Prusa | PrusaLink API |
| P1 | Voron/自组装 | Klipper/Moonraker |
| P2 | Anycubic | OctoPrint |
| P2 | Elegoo | WiFi |
| P3 | 其他 | 通用STL导出 |
