# UI UX Pro Max 分析报告

> 调研日期：2026-02-21
> 仓库：https://github.com/nextlevelbuilder/ui-ux-pro-max-skill
> 版本：v2.0

## 一、概述

UI UX Pro Max 是一个面向 AI 编码助手的**设计智能 Skill**，通过 BM25 搜索引擎 + 推理规则，为任何项目自动生成完整的设计系统（颜色、字体、间距、组件、反模式）。

**核心定位：** 不是一个设计工具，而是给 AI（Claude Code / Cursor / Copilot 等）注入设计决策能力的知识库。

## 二、架构

```
┌─────────────────────────────────┐
│  CSV 数据库（知识层）             │
│  styles.csv (67种样式)          │
│  colors.csv (96个配色方案)       │
│  typography.csv (57个字体配对)    │
│  products.csv (100个行业分类)    │
│  ui-reasoning.csv (100条推理规则) │
│  ux-guidelines.csv (99条UX规范)  │
│  landing.csv (24种着陆页模式)    │
│  charts.csv (25种图表类型)       │
│  stacks/*.csv (13个技术栈指南)   │
└─────────────┬───────────────────┘
              │
┌─────────────▼───────────────────┐
│  core.py - BM25 搜索引擎        │
│  - 文本分词 + IDF 计算           │
│  - 多域搜索（style/color/typo等）│
│  - 自动域检测                    │
└─────────────┬───────────────────┘
              │
┌─────────────▼───────────────────┐
│  design_system.py - 推理引擎     │
│  1. 搜索 product → 识别行业分类  │
│  2. 加载 ui-reasoning 规则       │
│  3. 5域并行搜索（带优先级提示）   │
│  4. BM25 + 优先级匹配选最佳结果  │
│  5. 输出完整设计系统              │
└─────────────┬───────────────────┘
              │
┌─────────────▼───────────────────┐
│  search.py - CLI 入口            │
│  --design-system  生成设计系统   │
│  --persist        持久化到文件   │
│  --page           页面级覆盖     │
│  --domain         单域搜索       │
│  --stack          技术栈指南     │
└─────────────────────────────────┘
```

## 三、核心机制详解

### 3.1 search.py — 搜索入口

- 基于 Python 3，无外部依赖
- 支持三种模式：
  1. `--design-system`：完整设计系统生成（5 域搜索 + 推理）
  2. `--domain <name>`：单域搜索（style/color/typography/ux 等）
  3. `--stack <name>`：技术栈特定指南
- `--persist` 将结果写入 `design-system/MASTER.md`
- `--page` 生成页面级覆盖文件（Master + Overrides 模式）

### 3.2 BM25 搜索算法

- 经典信息检索算法，参数 k1=1.5, b=0.75
- 对每个 CSV 的指定搜索列建索引
- 查询时计算 TF-IDF 加权分数，返回 top-N 结果
- 自动域检测：通过关键词匹配判断最相关的搜索域

### 3.3 推理规则（ui-reasoning.csv）

100 条行业特定规则，每条包含：
- `UI_Category`：行业分类（SaaS、Fintech、Healthcare...）
- `Recommended_Pattern`：推荐的页面结构
- `Style_Priority`：优先推荐的 UI 风格（如 "Glassmorphism + Dark Mode"）
- `Color_Mood`：配色情绪
- `Typography_Mood`：字体性格
- `Key_Effects`：关键动效
- `Decision_Rules`：JSON 条件规则（if_xxx → 执行什么）
- `Anti_Patterns`：避免的反模式
- `Severity`：规则严重程度

### 3.4 设计系统生成流程

1. **Product 搜索** → 识别行业（如 "AI/Chatbot Platform"）
2. **加载推理规则** → 匹配行业规则，获取 style_priority
3. **5 域并行搜索** → product / style / color / landing / typography
4. **优先级匹配** → 用推理规则的 style_priority 在 style 搜索结果中选最佳
5. **组装输出** → Pattern + Style + Colors + Typography + Effects + Anti-patterns + Checklist

### 3.5 Master + Overrides 模式

```
design-system/
├── MASTER.md           # 全局设计规范（颜色、字体、间距、组件 CSS）
└── pages/
    └── dashboard.md    # 页面级覆盖（仅记录与 Master 的差异）
```

构建页面时：先查 pages/xxx.md，有则覆盖 Master；没有则纯用 Master。

## 四、设计系统模板（MASTER.md）包含的设计变量

| 类别 | 变量 |
|------|------|
| **颜色** | Primary, Secondary, CTA/Accent, Background, Text（含 CSS 变量名） |
| **字体** | Heading Font, Body Font, Mood, Google Fonts URL, CSS Import |
| **间距** | 7 级 token（xs=4px 到 3xl=64px） |
| **阴影** | 4 级（sm/md/lg/xl，含具体 CSS 值） |
| **组件** | Button (Primary/Secondary), Card, Input, Modal（完整 CSS 代码） |
| **风格** | Style 名称 + Keywords + Best For + Key Effects |
| **页面模式** | Pattern Name + Sections + CTA Placement + Conversion Strategy |
| **反模式** | 行业特定 + 通用禁止项（emoji 图标、缺少 cursor-pointer 等） |
| **交付清单** | 10 项检查（无障碍、响应式、对比度等） |

## 五、支持的平台/技术栈

| 类别 | 技术栈 |
|------|--------|
| **Web (HTML)** | HTML + Tailwind（默认） |
| **React 生态** | React, Next.js, shadcn/ui |
| **Vue 生态** | Vue, Nuxt.js, Nuxt UI |
| **其他 Web** | Svelte, Astro |
| **iOS** | SwiftUI |
| **Android** | Jetpack Compose |
| **跨平台** | React Native, Flutter |

## 六、设计原则

1. **无 Emoji 图标** — 一律用 SVG（Heroicons / Lucide / Simple Icons）
2. **cursor:pointer** — 所有可点击元素必须有
3. **过渡动画 150-300ms** — 不能有突兀的状态变化
4. **对比度 4.5:1** — 文本必须清晰可读
5. **响应式断点** — 375px / 768px / 1024px / 1440px
6. **prefers-reduced-motion** — 尊重用户减弱动画偏好
7. **行业匹配** — 风格选择必须匹配产品类型
8. **反模式回避** — 每个行业有特定禁忌（如银行业禁用 AI 紫粉渐变）

## 七、为 RealWorldClaw 的适配价值

### 直接可用
- **设计系统生成**：一条命令生成完整设计规范
- **暗色主题**：内置 Dark Mode (OLED) 风格，完美匹配
- **AI 原生 UI**：有 AI-Native UI 风格（适合 AI 社区）
- **React/Next.js 指南**：若用 React 技术栈，有具体实现建议

### 需要扩展
- 品牌色需要自定义（生成的是通用推荐）
- 模块化硬件的产品展示需要自定义组件
- 中文字体配对不在库中（库以 Google Fonts 英文为主）

## 八、仓库位置

已克隆到：`/Volumes/T7 Shield/realworldclaw/tools/ui-ux-pro-max/`

使用方式：
```bash
cd /Volumes/T7 Shield/realworldclaw/tools/ui-ux-pro-max/src/ui-ux-pro-max
python3 scripts/search.py "AI community dark mode" --design-system -p "RealWorldClaw"
```
