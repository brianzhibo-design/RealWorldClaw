# Awesome 3D Printing — RealWorldClaw 精选资源

> 基于 [awesome-3d-printing](https://github.com/ad-si/awesome-3d-printing) 整理，补充额外调研。
> 整理日期：2026-02-21

---

## A. 3D打印机控制软件

| 名称 | 链接 | 特点 | API接口 | RWC价值 |
|------|------|------|---------|---------|
| **OctoPrint** | https://octoprint.org | 最流行的Web控制界面，插件生态丰富 | REST API + WebSocket | ⭐⭐⭐⭐⭐ 必须支持 |
| **Klipper + Moonraker** | https://github.com/Klipper3d/klipper / https://github.com/Arksine/moonraker | 高性能固件，Moonraker提供完整Web API | Moonraker REST/WebSocket API（打印控制、文件管理、状态监控） | ⭐⭐⭐⭐⭐ 必须支持 |
| **Mainsail** | https://mainsail.xyz | Klipper的现代Web前端 | 通过Moonraker API | Klipper生态一部分 |
| **Fluidd** | https://fluidd.xyz | 另一个Klipper Web前端，轻量 | 通过Moonraker API | Klipper生态一部分 |
| **Repetier** | https://www.repetier.com | 一体化：放置、切片、预览、打印 | Repetier Server API | ⭐⭐⭐ 可选支持 |
| **PrintRun** | https://github.com/kliment/Printrun | 纯Python主机软件 | Python接口 | 参考实现 |
| **Bambu Lab Cloud** | Bambu Lab内置 | 拓竹自有云控制 | MQTT + 局域网API | ⭐⭐⭐⭐⭐ 大人有P2S，必须支持 |

### 🔥 重要发现：MCP 3D Printer Server
- **[mcp-3D-printer-server](https://github.com/DMontgomery40/mcp-3D-printer-server)** — 连接MCP到主流3D打印机API（OctoPrint, Klipper/Moonraker, Duet, Repetier, Bambu, Prusa, Creality），支持打印控制、状态监控、STL操作、切片
- **[OctoEverywhere MCP](https://github.com/OctoEverywhere/mcp)** — 免费3D打印MCP server，支持OctoPrint/Klipper/Bambu Lab/Elegoo

**→ RWC Maker Network 应优先支持：Klipper/Moonraker、OctoPrint、Bambu Lab MQTT 三大协议栈**

---

## B. 切片软件/引擎

| 名称 | 链接 | CLI/自动化 | RWC价值 |
|------|------|-----------|---------|
| **PrusaSlicer** | https://www.prusa3d.com/page/prusaslicer_424/ | ✅ 完整CLI：`prusa-slicer --export-gcode model.stl` | ⭐⭐⭐⭐⭐ AI自动切片首选 |
| **OrcaSlicer** | https://github.com/SoftFever/OrcaSlicer | ✅ 继承PrusaSlicer CLI，支持更多打印机 | ⭐⭐⭐⭐⭐ 最佳通用选择 |
| **Cura / CuraEngine** | https://ultimaker.com/software/ultimaker-cura/ | ✅ CuraEngine CLI可独立调用 | ⭐⭐⭐⭐ 备选引擎 |
| **BambuStudio** | https://bambulab.com/en/download/studio | ✅ CLI模式（基于PrusaSlicer） | ⭐⭐⭐⭐ 拓竹打印机适配 |
| **Slic3r** | https://slic3r.org | ✅ 最早的开源CLI slicer | 已被PrusaSlicer取代 |
| **Kiri:Moto** | https://grid.space/kiri/ | Web-based，有API | ⭐⭐⭐ 在线切片参考 |
| **Strecs3D** | https://github.com/tomohiron907/Strecs3D | 基于结构分析优化填充 | 技术参考 |

**→ "AI自动打印"路径：模型 → OrcaSlicer/PrusaSlicer CLI自动切片 → Moonraker/OctoPrint API自动上传并开始打印**

---

## C. 3D模型仓库/平台

| 名称 | 链接 | API支持 | RWC价值 |
|------|------|---------|---------|
| **Thingiverse** | https://www.thingiverse.com | ✅ 公开REST API（需账号） | ⭐⭐⭐⭐ 最大模型库 |
| **Printables** | https://www.printables.com | 有限API | ⭐⭐⭐⭐ Prusa官方，质量高 |
| **MakerWorld** | https://makerworld.com | 有限（可爬取） | ⭐⭐⭐⭐ Bambu Lab官方 |
| **MyMiniFactory** | https://www.myminifactory.com | ✅ 有API | ⭐⭐⭐ 桌游/玩具模型 |
| **Cults** | https://cults3d.com | 有限 | ⭐⭐⭐ 设计师社区 |
| **GrabCAD** | https://grabcad.com | ✅ 有API | ⭐⭐⭐ 工程模型 |
| **Manyfold** | https://github.com/manyfold3d/manyfold | ✅ 自托管，完全可控 | ⭐⭐⭐⭐⭐ RWC模块图鉴自建参考！ |

**→ 对RWC模块图鉴的启发：Manyfold（自托管3D模型管理）是最佳参考，可以fork或集成作为模块图鉴后端**

---

## D. 3D打印设计工具

### 参数化设计（代码驱动，适合AI生成）
| 名称 | 链接 | 说明 |
|------|------|------|
| **OpenSCAD** | https://openscad.org | 代码驱动CSG建模，脚本化 → AI可直接生成代码 |
| **build123d** | https://github.com/gumyr/build123d | Python参数化CAD，AI友好 |
| **CadQuery** | https://github.com/CadQuery/cadquery | Python参数化CAD库（awesome列表外补充） |
| **FreeCAD** | https://www.freecad.org | 开源全功能CAD，有Python API |
| **SolveSpace** | https://solvespace.com | 极简CAD |

### 在线/可视化
| 名称 | 链接 | 说明 |
|------|------|------|
| **Tinkercad** | https://www.tinkercad.com | 浏览器端入门3D设计 |
| **Vectary** | https://www.vectary.com | 浏览器3D建模 |
| **Clara.io** | https://clara.io | 云端3D建模 |

### 🔥 AI辅助3D建模（awesome列表外补充）
| 名称 | 链接 | 说明 | RWC价值 |
|------|------|------|---------|
| **Meshy** | https://www.meshy.ai | Text/Image-to-3D，可导出STL | ⭐⭐⭐⭐⭐ AI生成可打印模型 |
| **Tripo AI** | https://www.tripo3d.ai | Text/Image-to-3D，秒级生成，有API | ⭐⭐⭐⭐⭐ 有API接口，可集成 |
| **Rodin AI (Hyper3D)** | https://hyperhuman.deemos.com | 高质量AI 3D生成 | ⭐⭐⭐⭐ |
| **OpenAI Shap-E** | https://github.com/openai/shap-e | 开源text-to-3D | ⭐⭐⭐ 可自部署 |

**→ AI自动设计路径：用户描述需求 → AI生成OpenSCAD代码或调用Meshy/Tripo API → 生成STL → 自动切片打印**

---

## E. 3D打印材料数据库

awesome-3d-printing列表中材料相关资源有限，以下为补充：

| 名称 | 链接 | 说明 |
|------|------|------|
| **列表中的耗材品牌** | eSun, Hatchbox, Protopasta等 | 品牌参考 |
| **Filameter** | https://filameter.com | 耗材库存管理工具 |

**补充推荐：**
- **[filament.directory](https://filament.directory)** — 社区耗材数据库
- **各Slicer内置材料Profile** — PrusaSlicer/OrcaSlicer的材料参数是最实用的数据库

---

## F. 3D打印社区和市场

### 按需打印服务（对标Maker Network！）
| 名称 | 链接 | 模式 | RWC参考 |
|------|------|------|---------|
| **3D Hubs (Hubs)** | https://www.hubs.com | 全球制造商网络，按需报价 | ⭐⭐⭐⭐⭐ Maker Network直接对标 |
| **Craftcloud** | https://craftcloud3d.com | 3D打印价格聚合 | ⭐⭐⭐⭐ 参考其报价模型 |
| **Shapeways** | https://www.shapeways.com | 打印服务+市场 | ⭐⭐⭐⭐ |
| **Sculpteo** | https://www.sculpteo.com | 在线3D打印 | ⭐⭐⭐ |
| **Beamler** | https://www.beamler.com | 工业级打印网络 | ⭐⭐⭐ 参考企业级模式 |
| **Jiga** | https://jiga.io | 制造即服务 | ⭐⭐⭐ |
| **PrintPal** | https://printpal.io | 模型分享+市场+AI+制造 | ⭐⭐⭐⭐ 最接近RWC愿景 |

### 价格比较
- **3yourmind** — https://www.3yourmind.com

**→ Hubs和PrintPal是RWC Maker Network最值得研究的对标产品**

---

## G. 开源硬件项目

| 名称 | 链接 | 说明 | RWC价值 |
|------|------|------|---------|
| **VoronDesign** | https://github.com/VoronDesign | 开源高性能3D打印机，模块化设计 | ⭐⭐⭐⭐⭐ 模块化设计理念参考 |
| **RepRap** | https://reprap.org | 自我复制3D打印机始祖 | ⭐⭐⭐⭐ 开源硬件运动基础 |
| **HevORT** | https://hevort.com | 高级DIY 3D打印机 | ⭐⭐⭐ |
| **BoxTurtle** | https://github.com/ArmoredTurtle/BoxTurtle | 开源多色耗材系统 | ⭐⭐⭐ 模块化附件参考 |
| **EnragedRabbitProject** | https://github.com/EtteGit/EnragedRabbitProject | Voron多色插件 | ⭐⭐⭐ |
| **Awesome-Extruders** | https://github.com/SartorialGrunt0/Awesome-Extruders | 可3D打印的挤出机设计列表 | ⭐⭐⭐ |
| **Truck** | https://github.com/ricosjp/truck | Rust CAD内核 | ⭐⭐⭐ 技术参考 |

---

## 🏆 Top 20 最有价值资源

| # | 资源 | 为什么对RWC有价值 |
|---|------|-------------------|
| 1 | **[mcp-3D-printer-server](https://github.com/DMontgomery40/mcp-3D-printer-server)** | 🔥 MCP协议连接所有主流打印机API，RWC可直接用于AI控制打印机 |
| 2 | **[Moonraker](https://github.com/Arksine/moonraker)** | Klipper的Web API层，RWC Maker Network必须适配的协议 |
| 3 | **[OrcaSlicer](https://github.com/SoftFever/OrcaSlicer)** | 最佳通用CLI slicer，AI自动切片的核心工具 |
| 4 | **[OctoPrint](https://octoprint.org)** | 最广泛的打印机控制平台，REST API完善，Maker Network必须支持 |
| 5 | **[Manyfold](https://github.com/manyfold3d/manyfold)** | 自托管3D模型管理，RWC模块图鉴的最佳技术参考/可直接集成 |
| 6 | **[Hubs](https://www.hubs.com)** | Maker Network的直接对标产品，研究其商业模式和UX |
| 7 | **[Meshy](https://www.meshy.ai)** | AI Text-to-3D，实现"描述即打印"愿景的关键工具 |
| 8 | **[Tripo AI](https://www.tripo3d.ai)** | 有API的AI 3D生成器，可程序化集成到RWC流程 |
| 9 | **[build123d](https://github.com/gumyr/build123d)** | Python参数化CAD，AI可直接生成代码创建模型 |
| 10 | **[OpenSCAD](https://openscad.org)** | 代码驱动建模，LLM可直接生成OpenSCAD脚本 |
| 11 | **[VoronDesign](https://github.com/VoronDesign)** | 模块化开源打印机设计理念，对RWC硬件模块化思路有启发 |
| 12 | **[OctoEverywhere MCP](https://github.com/OctoEverywhere/mcp)** | 另一个3D打印MCP实现，支持远程监控和AI故障检测 |
| 13 | **[PrusaSlicer](https://www.prusa3d.com/page/prusaslicer_424/)** | 最成熟的CLI slicer，OrcaSlicer的上游 |
| 14 | **[Thingiverse API](https://www.thingiverse.com/developers)** | 公开REST API，RWC可搜索/推荐现有可打印模型 |
| 15 | **[PrintPal](https://printpal.io)** | 模型分享+市场+AI+制造平台，最接近RWC完整愿景 |
| 16 | **[Klipper](https://github.com/Klipper3d/klipper)** | 高性能打印固件，Maker中高端打印机标配 |
| 17 | **[BotQueue](https://github.com/Hoektronics/BotQueue)** | 互联网3D打印机控制，分布式打印参考 |
| 18 | **[FreeCAD](https://www.freecad.org)** | 开源全功能CAD，有Python API可自动化 |
| 19 | **[Printables](https://www.printables.com)** | 高质量模型库，Prusa官方，社区活跃 |
| 20 | **[Filameter](https://filameter.com)** | 耗材管理工具，Maker Network需要耗材库存追踪 |

---

## 📋 建议RealWorldClaw应集成/适配的工具清单

### 🔴 必须集成（Phase 1）
1. **Klipper/Moonraker API** — Maker Network打印机控制协议
2. **OctoPrint API** — 第二大打印机控制协议
3. **Bambu Lab MQTT/LAN API** — 大人自有P2S必须适配
4. **OrcaSlicer CLI** — AI自动切片核心
5. **mcp-3D-printer-server** — 直接使用或参考，一套MCP连接所有打印机

### 🟡 应该集成（Phase 2）
6. **Manyfold** — 作为模块图鉴的3D模型管理后端
7. **Thingiverse API** — 搜索推荐现有可打印方案
8. **Meshy / Tripo AI API** — AI生成3D模型
9. **OpenSCAD / build123d** — AI代码生成参数化模型
10. **Filameter** — 耗材库存管理

### 🟢 可以参考（Phase 3+）
11. **Hubs商业模式** — Maker Network的定价/匹配逻辑
12. **PrintPal** — 全栈参考
13. **VoronDesign** — 模块化硬件设计理念
14. **OctoEverywhere** — 远程监控和AI故障检测
15. **CuraEngine** — 备选切片引擎

---

## 🔗 完整的"AI自动打印"Pipeline

```
用户需求描述
    ↓
AI理解需求 → 搜索Thingiverse/Printables现有模型
    ↓（无合适模型）
AI生成3D模型：OpenSCAD代码 / Meshy API / Tripo API
    ↓
OrcaSlicer CLI 自动切片（选择材料、参数）
    ↓
通过 Moonraker/OctoPrint/Bambu API 上传G-code
    ↓
自动开始打印 + 实时监控（OctoEverywhere AI故障检测）
    ↓
完成通知 → 物流/取件
```

**这就是RealWorldClaw的终极愿景：从需求描述到实物，全AI驱动。**
