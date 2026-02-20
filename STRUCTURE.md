# RealWorldClaw 文件结构标准

> 制定：沸羊羊 🐏 | 标准化工程师
> 版本：1.0 | 日期：2026-02-20
> 参考：Linux kernel、Kubernetes、Arduino 项目目录规范

---

## 1. 项目根目录

```
realworldclaw/
├── README.md                  项目总览，第一印象
├── LICENSE                    开源协议（MIT）
├── CONTRIBUTING.md            贡献指南
├── CODE_OF_CONDUCT.md         行为准则
├── CHANGELOG.md               更新日志
├── ROADMAP.md                 项目路线图、里程碑、技术栈
├── STRUCTURE.md               本文件——文件结构标准
├── Makefile                   开发快捷命令（make dev / make test）
│
├── docs/                      所有人类可读文档
│   ├── specs/                 标准规范（项目核心）
│   ├── guides/                使用指南
│   ├── architecture/          架构深化文档
│   └── marketing/             社媒文案、调研
│
├── specs/                     机器可读的标准定义（JSON Schema等）
├── components/                种子组件（每个子目录=一个组件包）
├── platform/                  平台后端代码
├── tools/                     开发/验证工具
├── website/                   官网落地页+演示页
├── archive/                   归档（淘汰方案、临时文件）
└── .github/                   GitHub CI/CD配置
    ├── workflows/             CI/CD workflows (lint, test, deploy)
    ├── ISSUE_TEMPLATE/        Bug report, feature request, new component
    └── pull_request_template.md  PR checklist
```

## 2. 命名规范

### 2.1 文件命名
- **全部小写**，单词间用**连字符** `-` 分隔
- 正确：`getting-started.md`、`clawbie-body.stl`
- 错误：`GettingStarted.md`、`clawbie_body.stl`

### 2.2 目录命名
- 同上：小写+连字符
- 组件目录包含版本号：`clawbie-v4/`

### 2.3 标准文档编号
标准规范文件统一编号 `NN-name.md`：
- `00-overview.md` — 标准索引，永远是00
- `01-component-package.md` — 组件包规范
- `02-printer-adapter.md` — 打印机适配规范
- `03-agent-protocol.md` — Agent交互协议
- `04-quality-gate.md` — 质量审核规范
- `05-physical-interface.md` — 物理接口规范
- `06-design-language.md` — 设计语言标准
- `07-fdm-printing.md` — FDM打印设计标准

编号规则：
- 两位数字前缀，保证排序
- 新增标准从08开始
- 编号一旦分配不变，即使标准废弃也不复用

## 3. 目录详解

### 3.1 `docs/specs/` — 标准规范（核心）
项目的灵魂。每个文件定义一个独立标准，可被单独引用。

### 3.2 `docs/guides/` — 使用指南
面向新手的入门教程，降低参与门槛。

### 3.3 `docs/architecture/` — 架构文档
平台架构、硬件架构、基础设施方案的深化文档。来源于规范的详细展开。

### 3.4 `specs/` — 机器可读定义
JSON Schema文件，用于自动验证 manifest.yaml 等格式。与 `docs/specs/` 的区别：`docs/specs/` 是人读的标准文档，`specs/` 是机器读的 Schema。

### 3.5 `components/` — 种子组件
每个子目录是一个符合标准一（组件包规范）的完整组件。详见下方§4。

### 3.6 `platform/` — 平台代码
FastAPI后端、打印机适配器、CLI工具。标准的 Python 项目结构。

### 3.7 `tools/` — 开发工具
manifest验证器、STL检查器等辅助工具。

### 3.8 `website/` — 官网
落地页 `index.html` + 演示页 `demo/`。

### 3.9 `archive/` — 归档
淘汰的旧版组件、临时文件、域名检查记录等。不删除，留备查。

## 4. 组件包标准目录结构

每个组件包（`components/{name}/`）必须遵循：

```
{component-id}/
├── manifest.yaml        ← 必须！核心元数据
├── models/              ← 3D打印文件（.stl + .scad源码）
├── electronics/         ← 电路：物料清单(bom.yaml)、接线说明
├── firmware/            ← 固件：src/ + platformio.ini
├── agent/               ← AI配置：SOUL.md + skills/
├── docs/                ← 文档：README.md + assembly.md
└── LICENSE              ← 组件级协议
```

最低上架要求：manifest.yaml + 至少一个STL或固件 + LICENSE。

## 5. 为什么打印标准独立成标准七

原始规范中，FDM打印设计标准放在标准五（物理接口）的 §7.10 节。我们将其独立为标准七，理由：

1. **硬件项目的核心**：RealWorldClaw 的核心能力是把数字设计变成物理实体，3D打印是这个转化的关键环节。打印设计标准的重要性不亚于组件包规范。

2. **内容体量**：FDM打印涉及壁厚、悬垂、桥接、公差、象脚效应、翘曲等大量工程细节，已远超物理接口的子章节容量。

3. **独立引用**：组件贡献者在设计外壳时需要频繁查阅打印标准，独立文件方便快速定位。

4. **实战驱动**：标准七的内容来自 Clawbie V4 赛博蛋的打印审查实战，是真正落地验证过的工程经验。

## 6. 版本控制

- 使用 Git 管理
- 主分支：`main`
- 标准文档改动必须经过 PR 审核
- CHANGELOG.md 记录所有重要变更

---

*本标准由沸羊羊🐏制定，经羊村公司标准化委员会审核。*
