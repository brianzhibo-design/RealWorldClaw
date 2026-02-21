# RealWorldClaw 前端UI库调研与设计系统

> 调研日期：2026-02-21
> 调研范围：12个UI库/产品，分三个层级

---

## 一、UI库深度分析

### Tier 1：必须深度学习

#### 1. Aceternity UI (ui.aceternity.com)

**设计哲学：** "Ship landing pages at lightning speed" — 视觉冲击优先，强调微交互和动画让页面"活"起来。暗色主题为主，科技感/未来感。

**技术栈：** React + Next.js + Tailwind CSS + Framer Motion。组件以copy-paste方式使用，非npm安装。

**核心组件清单（与RealWorldClaw相关的）：**

| 组件 | 效果 | 适用场景 |
|------|------|----------|
| **3D Card Effect** | 鼠标跟随的3D倾斜卡片 | AI Profile卡片、产品展示 |
| **Spotlight** | 鼠标跟随的聚光灯效果 | Hero区域、重要CTA |
| **Meteors** | 流星雨背景 | Landing Page背景装饰 |
| **Background Beams** | 光束背景动画 | Hero section、等待页面 |
| **Sparkles** | 闪烁粒子效果 | 标题装饰、高亮内容 |
| **Floating Dock** | macOS风格底部导航栏 | 移动端导航、快捷操作栏 |
| **Card Spotlight** | 卡片上的聚光灯跟随效果 | Feed卡片hover效果 |
| **Evervault Card** | 加密风格动态文字卡片 | AI能力展示 |
| **Aurora Background** | 极光背景 | Landing Page |
| **Tracing Beam** | 滚动跟踪光束 | 长页面滚动指示 |
| **Lamp Effect** | 灯光照射文字效果 | 标题、Slogan |
| **Wobble Card** | 弹性晃动卡片 | 趣味交互元素 |
| **Expandable Card** | 展开式卡片详情 | Feed内容预览→展开 |
| **Infinite Moving Cards** | 无限滚动卡片轮播 | 用户评价、AI作品展示 |
| **Glare Card** | 玻璃反光卡片 | 高级会员/VIP展示 |
| **Background Gradient** | 动态渐变背景 | 页面section分隔 |
| **Wavy Background** | 波浪背景 | 区域装饰 |
| **Google Gemini Effect** | Gemini风格的SVG线条动画 | AI能力展示页 |

**暗色主题方案：**
- 背景：近黑（#0a0a0a ~ #111）
- 卡片：半透明深灰 + 微妙边框（border-white/10）
- 大量使用 gradient 和 glow 效果制造层次
- 文字：白色(#fff) + 灰色(#a1a1aa)层次

**动画方案：** Framer Motion 为核心，主要类型：
- 鼠标跟随交互（useMotionValue, useTransform）
- 入场动画（fade-in + slide-up）
- 持续背景动画（CSS keyframes + requestAnimationFrame）
- 滚动触发（useInView）

---

#### 2. Magic UI (magicui.design)

**设计哲学：** "UI library for Design Engineers" — 150+ 免费开源动画组件。shadcn/ui 的完美伴侣，专注于让普通UI组件变得有生命力。

**技术栈：** React + TypeScript + Tailwind CSS + Motion (Framer Motion)。shadcn CLI兼容，可直接 `npx shadcn add` 安装。

**核心组件清单：**

| 类别 | 组件 | 适用场景 |
|------|------|----------|
| **展示** | Marquee（滚动轮播） | 合作伙伴logo、用户评价 |
| **展示** | Bento Grid（网格布局） | 功能特性展示 |
| **展示** | Animated List（动画列表） | 实时通知、活动流 |
| **展示** | Dock（macOS dock） | 导航栏 |
| **展示** | Globe（3D地球） | 全球用户分布展示 |
| **展示** | Tweet Card（推文卡片） | 社交媒体内容嵌入 |
| **展示** | Orbiting Circles（轨道圆圈） | AI生态系统/技术栈展示 |
| **展示** | Icon Cloud（图标云） | 技术栈展示 |
| **展示** | Dotted Map（点阵地图） | 用户分布 |
| **特效** | Animated Beam（动画光束） | 连接线、流程图 |
| **特效** | Border Beam（边框光束） | 卡片高亮 |
| **特效** | Shine Border（闪光边框） | Premium内容标识 |
| **特效** | Magic Card（魔法卡片） | 产品卡片 |
| **特效** | Meteors（流星） | 背景装饰 |
| **特效** | Confetti（彩纸） | 成功/庆祝状态 |
| **特效** | Particles（粒子） | 背景 |
| **特效** | Cool Mode（酷炫模式） | 按钮点击彩蛋 |
| **文字** | Number Ticker（数字滚动） | 统计数据展示 |
| **文字** | Animated Shiny Text（闪光文字） | 标题、CTA |
| **文字** | Typing Animation（打字动画） | AI对话效果 |
| **文字** | Word Rotate（文字轮换） | Hero标题 |
| **交互** | Hero Video Dialog（视频弹窗） | 产品介绍视频 |
| **交互** | Lens（放大镜） | 图片预览 |
| **交互** | Pointer（指针跟随） | 协作功能展示 |
| **交互** | Smooth Cursor（平滑光标） | 打字效果 |
| **交互** | Progressive Blur（渐进模糊） | 内容预览/付费墙 |

**暗色主题方案：** 与shadcn/ui一致，使用CSS变量系统。

**动画方案：** Motion (Framer Motion) + CSS animations，组件级封装，开箱即用。

---

#### 3. shadcn/ui (ui.shadcn.com)

**设计哲学：** "The Foundation for your Design System" — 不是组件库，是组件集合。你拥有代码，完全可定制。Radix UI原语 + Tailwind CSS。

**技术栈：** React + Radix UI + Tailwind CSS + class-variance-authority (cva)

**深度使用要点：**

**主题定制最佳实践：**
```css
/* globals.css — CSS变量方案 */
:root {
  --background: 0 0% 100%;
  --foreground: 0 0% 3.9%;
  --card: 0 0% 100%;
  --card-foreground: 0 0% 3.9%;
  --primary: 0 0% 9%;
  --primary-foreground: 0 0% 98%;
  --secondary: 0 0% 96.1%;
  --muted: 0 0% 96.1%;
  --accent: 0 0% 96.1%;
  --border: 0 0% 89.8%;
  --ring: 0 0% 3.9%;
  --radius: 0.5rem;
}

.dark {
  --background: 0 0% 3.9%;
  --foreground: 0 0% 98%;
  --card: 0 0% 3.9%;
  --card-foreground: 0 0% 98%;
  --primary: 0 0% 98%;
  --primary-foreground: 0 0% 9%;
  --secondary: 0 0% 14.9%;
  --muted: 0 0% 14.9%;
  --accent: 0 0% 14.9%;
  --border: 0 0% 14.9%;
  --ring: 0 0% 83.1%;
}
```

**组件组合模式：**
- Card + CardHeader + CardContent + CardFooter 组合
- Command + Dialog = 命令面板（⌘K）
- Form + zodResolver + useForm = 类型安全表单
- DataTable = Table + 排序 + 筛选 + 分页

**暗色模式最佳实践：**
- 使用 `next-themes` 的 `ThemeProvider`
- CSS变量用HSL格式，便于调整透明度
- 所有颜色通过语义化变量引用（`--background`, `--foreground`等）

---

#### 4. Origin UI (originui.com)

> 注：originui.com 已重定向至 coss.com/ui，现为 Coss UI —— 基于 Base UI 的现代组件库。

**设计哲学：** 全面的UI组件库，覆盖从基础控件到复杂交互的所有需求。基于 Base UI（MUI团队的无样式组件库）。

**核心组件：** Accordion, Alert, Avatar, Badge, Button, Calendar, Card, Checkbox, Combobox, Command, Dialog, Form, Menu, Pagination, Popover, Select, Sheet, Table, Tabs, Toast, Tooltip 等完整组件集。

**适用场景：** 作为shadcn/ui的补充参考，提供更多组件变体和模式。

---

### Tier 2：重点参考

#### 5. Cult UI

**设计哲学：** 专注AI场景的UI blocks，为AI产品提供现成的界面模式。

**适用场景：** AI对话界面、AI生成内容展示、AI状态指示器。

**RealWorldClaw相关：** AI Profile页面的能力展示、AI交互界面模式。

---

#### 6. Luxe Components (luxeui.com)

**设计哲学：** "Illuminate your apps" — 超美学UI库，强调优雅、精致和独特风格。Copy-paste模式。

**技术栈：** React + Tailwind CSS + Framer Motion

**特点：** 高端动效，适合需要"奢侈感"的界面，如VIP/Premium功能展示。

---

#### 7. NextAdmin (nextadmin.co)

**设计哲学：** Next.js管理后台模板，实用为主。

**适用场景：** RealWorldClaw的管理后台（用户管理、内容审核、数据分析dashboard）。

---

#### 8. Tremor (tremor.so)

**设计哲学：** "Copy-and-Paste Tailwind CSS UI Components for Charts and Dashboards" — 专注数据可视化的组件库。

**技术栈：** React + Tailwind CSS + Recharts

**核心组件：** BarChart, LineChart, AreaChart, DonutChart, KPI Cards, Trackers, Sparklines

**暗色主题：** 内置dark mode支持。使用 `dark:` 前缀系统。
- 边框：`border-gray-200 dark:border-gray-800`
- 背景：`bg-white dark:bg-gray-950`
- 文字：`text-gray-700 dark:text-gray-300` / `text-gray-900 dark:text-gray-50`

**适用场景：** RealWorldClaw的数据统计面板 — 用户增长图表、AI使用次数、社区活跃度可视化。

---

### Tier 3：风格参考

#### 9. Linear.app
**设计要点：**
- 暗色主题标杆：极深背景(~#0A0A0B)、微妙边框、柔和阴影
- 紫色作为品牌色穿插在暗色界面中
- 极致的键盘快捷键体验
- 动画克制但精准：状态切换用spring动画，列表用stagger

#### 10. Vercel Dashboard
**设计要点：**
- 黑白极简：纯黑背景(#000)、白色文字、灰色层次
- 信息密度高但不拥挤
- 圆角统一（8px）
- 边框极淡（border-[#333]）

#### 11. Raycast
**设计要点：**
- 桌面应用级的Web UI质感
- 磨砂玻璃效果（backdrop-blur）
- 丰富的键盘交互
- 搜索为中心的导航模式

#### 12. Resend
**设计要点：**
- 极美的暗色UI + 彩色渐变accent
- 代码块展示风格优秀
- 简洁的信息架构

---

## 二、RealWorldClaw 前端设计系统 v1

### 2.1 调色板

#### 主色（Brand）
```
Primary:       #6366F1 (Indigo-500) — AI/科技感
Primary-light: #818CF8 (Indigo-400)
Primary-dark:  #4F46E5 (Indigo-600)
```

#### 语义色
```
Success:  #22C55E (Green-500)
Warning:  #F59E0B (Amber-500)
Error:    #EF4444 (Red-500)
Info:     #3B82F6 (Blue-500)
```

#### 中性色（暗色主题）
```
bg-base:      #09090B  (zinc-950)  — 页面背景
bg-elevated:  #18181B  (zinc-900)  — 卡片/面板
bg-surface:   #27272A  (zinc-800)  — 输入框/嵌套元素
border:       #3F3F46  (zinc-700)  — 默认边框
border-subtle:#27272A  (zinc-800)  — 微妙边框
text-primary: #FAFAFA  (zinc-50)   — 主要文字
text-secondary:#A1A1AA (zinc-400)  — 次要文字
text-muted:   #71717A  (zinc-500)  — 禁用/占位文字
```

#### 中性色（亮色主题）
```
bg-base:      #FFFFFF
bg-elevated:  #FAFAFA  (zinc-50)
bg-surface:   #F4F4F5  (zinc-100)
border:       #E4E4E7  (zinc-200)
border-subtle:#F4F4F5  (zinc-100)
text-primary: #09090B  (zinc-950)
text-secondary:#71717A (zinc-500)
text-muted:   #A1A1AA  (zinc-400)
```

#### 渐变色
```
gradient-brand:   from-indigo-500 via-purple-500 to-pink-500
gradient-ai:      from-cyan-400 via-blue-500 to-indigo-600
gradient-premium:  from-amber-400 via-orange-500 to-red-500
gradient-subtle:   from-zinc-900 to-zinc-800 （暗色卡片渐变）
```

### 2.2 字体系统

```css
/* 主字体：系统字体栈 + Inter */
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
/* 代码字体 */
--font-mono: 'JetBrains Mono', 'Fira Code', monospace;

/* 字号（基于 Tailwind 默认） */
text-xs:   12px / 16px   — 标签、辅助信息
text-sm:   14px / 20px   — 正文（次要）、表格
text-base: 16px / 24px   — 正文（主要）
text-lg:   18px / 28px   — 小标题
text-xl:   20px / 28px   — 区块标题
text-2xl:  24px / 32px   — 页面标题
text-3xl:  30px / 36px   — Hero副标题
text-4xl:  36px / 40px   — Hero标题
text-5xl:  48px / 1      — Landing大标题
text-6xl:  60px / 1      — Landing超大标题

/* 字重 */
font-normal:   400  — 正文
font-medium:   500  — 强调
font-semibold: 600  — 标题
font-bold:     700  — Hero标题
```

### 2.3 间距系统（8px网格）

```
space-0:   0px
space-0.5: 2px    — 极小间距（图标与文字间）
space-1:   4px    — 紧凑间距
space-2:   8px    ★ 基础单位
space-3:   12px   — 组件内部间距
space-4:   16px   ★ 组件间距
space-5:   20px
space-6:   24px   ★ section内部间距
space-8:   32px   ★ section之间
space-10:  40px
space-12:  48px   ★ 大区块间距
space-16:  64px   ★ 页面section间距
space-20:  80px
space-24:  96px   — Landing page section间距
```

### 2.4 阴影系统

```css
/* 暗色主题 — 阴影几乎不用，改用border + glow */
--shadow-sm:   0 1px 2px rgba(0,0,0,0.3);
--shadow-md:   0 4px 6px rgba(0,0,0,0.4);
--shadow-lg:   0 10px 15px rgba(0,0,0,0.5);
--shadow-glow:  0 0 20px rgba(99,102,241,0.15);  /* 品牌色glow */
--shadow-glow-lg: 0 0 40px rgba(99,102,241,0.25);

/* 亮色主题 */
--shadow-sm:   0 1px 2px rgba(0,0,0,0.05);
--shadow-md:   0 4px 6px rgba(0,0,0,0.07);
--shadow-lg:   0 10px 15px rgba(0,0,0,0.1);
--shadow-xl:   0 20px 25px rgba(0,0,0,0.1);
```

### 2.5 圆角系统

```
radius-none: 0px       — 无圆角
radius-sm:   6px       — 小元素（badge、tag）
radius-md:   8px    ★  — 默认（按钮、输入框）
radius-lg:   12px      — 卡片
radius-xl:   16px      — 大卡片、弹窗
radius-2xl:  20px      — 特殊容器
radius-full: 9999px    — 圆形（avatar、pill badge）
```

### 2.6 动画规范

```css
/* Duration */
--duration-instant:  75ms    — 颜色变化、opacity
--duration-fast:     150ms   — hover效果、微交互
--duration-normal:   200ms   — 大多数过渡
--duration-moderate: 300ms   — 展开/折叠
--duration-slow:     500ms   — 页面过渡、大型动画
--duration-slower:   700ms   — 入场动画stagger

/* Easing */
--ease-default:  cubic-bezier(0.4, 0, 0.2, 1)   — 通用
--ease-in:       cubic-bezier(0.4, 0, 1, 1)      — 退出
--ease-out:      cubic-bezier(0, 0, 0.2, 1)      — 进入
--ease-spring:   cubic-bezier(0.34, 1.56, 0.64, 1) — 弹性
--ease-bounce:   spring(1, 80, 10)                — Framer Motion弹跳

/* 动画类型标准 */
入场动画:     fade-in + slide-up (y: 20px → 0, opacity: 0 → 1), duration: 500ms
列表stagger:  每项延迟 50-100ms
hover效果:    scale(1.02-1.05), duration: 200ms, ease-spring
按钮点击:     scale(0.95), duration: 100ms
页面切换:     fade + slide, duration: 300ms
滚动触发:     useInView, threshold: 0.2, triggerOnce: true
背景动画:     持续循环, duration: 3-10s, CSS keyframes
数字变化:     Number Ticker, duration: 2s
加载状态:     pulse / skeleton shimmer, duration: 1.5s
```

---

## 三、推荐安装的组件库清单

### 基础层（必装）

```bash
# 1. shadcn/ui — 基础组件标准
npx shadcn@latest init
# 按需安装组件：
npx shadcn@latest add button card dialog input form table tabs toast avatar badge command dropdown-menu popover select separator sheet skeleton switch textarea tooltip

# 2. Framer Motion — 动画引擎
npm install motion

# 3. 主题切换
npm install next-themes

# 4. 图标库
npm install lucide-react

# 5. 类名工具
npm install clsx tailwind-merge class-variance-authority
```

### 动画增强层（推荐安装）

```bash
# Magic UI — shadcn CLI兼容，按需安装
npx shadcn@latest add "https://magicui.design/r/marquee"
npx shadcn@latest add "https://magicui.design/r/number-ticker"
npx shadcn@latest add "https://magicui.design/r/animated-list"
npx shadcn@latest add "https://magicui.design/r/bento-grid"
npx shadcn@latest add "https://magicui.design/r/globe"
npx shadcn@latest add "https://magicui.design/r/dock"
npx shadcn@latest add "https://magicui.design/r/particles"
npx shadcn@latest add "https://magicui.design/r/border-beam"
npx shadcn@latest add "https://magicui.design/r/animated-shiny-text"
npx shadcn@latest add "https://magicui.design/r/typing-animation"
npx shadcn@latest add "https://magicui.design/r/confetti"
npx shadcn@latest add "https://magicui.design/r/hero-video-dialog"
npx shadcn@latest add "https://magicui.design/r/orbiting-circles"
npx shadcn@latest add "https://magicui.design/r/icon-cloud"
npx shadcn@latest add "https://magicui.design/r/word-rotate"
npx shadcn@latest add "https://magicui.design/r/progressive-blur"
```

### Aceternity UI（手动copy-paste）

从 ui.aceternity.com 手动复制以下组件代码到 `components/aceternity/`：
- 3D Card Effect
- Spotlight
- Background Beams
- Aurora Background
- Lamp Effect
- Floating Dock
- Card Spotlight
- Expandable Card
- Sparkles
- Infinite Moving Cards
- Tracing Beam
- Meteors

### 数据可视化层

```bash
# Tremor — 图表和数据展示
npm install @tremor/react
# 或使用其Tailwind版本（copy-paste模式）
# 参考 tremor.so 的组件代码

# 底层图表库（Tremor依赖）
npm install recharts
```

### 完整 package.json dependencies 总览

```json
{
  "dependencies": {
    "next": "^15.x",
    "react": "^19.x",
    "tailwindcss": "^4.x",
    "motion": "^12.x",
    "next-themes": "^0.4.x",
    "lucide-react": "^0.4xx",
    "clsx": "^2.x",
    "tailwind-merge": "^2.x",
    "class-variance-authority": "^0.7.x",
    "@radix-ui/react-*": "各组件按需",
    "recharts": "^2.x",
    "zod": "^3.x",
    "react-hook-form": "^7.x",
    "@hookform/resolvers": "^3.x"
  }
}
```

---

## 四、各页面推荐使用的组件/效果

### 4.1 Landing Page（着陆页）

| 区域 | 推荐组件/效果 | 来源 |
|------|-------------|------|
| Hero 背景 | Aurora Background 或 Background Beams | Aceternity |
| Hero 标题 | Lamp Effect + Animated Shiny Text | Aceternity + Magic UI |
| Hero 副标题 | Word Rotate（轮换展示不同AI能力） | Magic UI |
| CTA按钮 | Shine Border 包裹的主按钮 | Magic UI |
| 特性展示 | Bento Grid（不规则网格布局） | Magic UI |
| 合作伙伴/用户 | Marquee（无限滚动logo） | Magic UI |
| 数据展示 | Number Ticker（用户数、AI数量等） | Magic UI |
| 技术生态 | Orbiting Circles 或 Icon Cloud | Magic UI |
| 用户评价 | Infinite Moving Cards | Aceternity |
| 全球用户 | Globe（3D地球）或 Dotted Map | Magic UI |
| 产品视频 | Hero Video Dialog | Magic UI |
| 页脚CTA | Spotlight效果 | Aceternity |

### 4.2 Feed页（社区动态流）

| 区域 | 推荐组件/效果 | 来源 |
|------|-------------|------|
| 帖子卡片 | Card + Card Spotlight hover效果 | shadcn + Aceternity |
| 帖子列表 | Animated List（新内容入场动画） | Magic UI |
| 加载状态 | Skeleton shimmer | shadcn |
| 点赞/互动 | Confetti（里程碑庆祝） | Magic UI |
| 导航栏 | Floating Dock（底部快捷导航） | Aceternity |
| 实时通知 | Animated List（右侧通知面板） | Magic UI |
| 无限滚动 | fade-in stagger入场 | Framer Motion |
| 搜索 | Command palette（⌘K） | shadcn |
| 筛选器 | Tabs + Badge 组合 | shadcn |
| 用户头像 | Avatar + Avatar Circles | shadcn + Magic UI |

### 4.3 AI Profile页

| 区域 | 推荐组件/效果 | 来源 |
|------|-------------|------|
| AI头像展示 | 3D Card Effect | Aceternity |
| AI名称 | Sparkles装饰 | Aceternity |
| 能力标签 | Badge + 渐变色 | shadcn |
| 统计数据 | Number Ticker（粉丝数、作品数） | Magic UI |
| 能力图谱 | Orbiting Circles | Magic UI |
| AI作品集 | Expandable Card grid | Aceternity |
| 使用记录 | AreaChart / BarChart | Tremor |
| API文档 | Terminal组件 + 代码高亮 | Magic UI |
| 评价 | Infinite Moving Cards | Aceternity |
| 关注按钮 | Border Beam效果 | Magic UI |
| 背景 | Particles（微妙粒子背景） | Magic UI |

### 4.4 核心产品展示页

| 区域 | 推荐组件/效果 | 来源 |
|------|-------------|------|
| 产品Hero | Google Gemini Effect 或 Aurora Background | Aceternity |
| 产品功能 | Bento Grid + Magic Card | Magic UI |
| 工作流演示 | Animated Beam（数据流连接线） | Magic UI |
| 价格方案 | Glare Card（高级感定价卡） | Aceternity |
| 对比表 | Table + 高亮行 | shadcn |
| Demo视频 | Hero Video Dialog | Magic UI |
| 技术栈 | Icon Cloud | Magic UI |
| 数据指标 | DonutChart + KPI Cards | Tremor |
| 时间线 | Tracing Beam | Aceternity |

### 4.5 Dashboard（管理后台）

| 区域 | 推荐组件/效果 | 来源 |
|------|-------------|------|
| 统计卡片 | KPI Cards + Number Ticker | Tremor + Magic UI |
| 图表 | BarChart, LineChart, AreaChart | Tremor / Recharts |
| 数据表格 | DataTable（排序+筛选+分页） | shadcn |
| 侧边导航 | Sheet + 折叠菜单 | shadcn |
| 命令面板 | Command（⌘K搜索） | shadcn |
| 表单 | Form + zod验证 | shadcn |
| 通知 | Toast | shadcn |
| 状态指示 | Badge + 颜色语义 | shadcn |

---

## 五、关键设计原则总结

### 5.1 暗色优先
RealWorldClaw 以暗色主题为默认，参考 Linear 和 Vercel：
- 背景层次：3层灰度（base → elevated → surface）
- 边框而非阴影来区分层级
- 品牌色(Indigo)用作accent和glow效果
- 支持亮色主题切换（通过CSS变量）

### 5.2 动画克制但有意义
- **有目的**：每个动画都要传达信息（入场、状态变化、引导注意力）
- **不过度**：Dashboard和工具页面动画要克制；Landing Page可以华丽
- **性能优先**：优先CSS动画 > Framer Motion > JS动画
- **可关闭**：尊重 `prefers-reduced-motion`

### 5.3 组件优先级
1. **shadcn/ui** — 所有基础UI组件的标准
2. **Magic UI** — 动画增强，与shadcn完美兼容
3. **Aceternity UI** — Landing Page和展示页面的视觉冲击
4. **Tremor** — 数据可视化
5. **自定义** — 以上不满足时才自己写

### 5.4 响应式策略
```
Mobile:  < 640px   — 单列，底部Dock导航
Tablet:  640-1024px — 双列，侧边栏可折叠
Desktop: > 1024px   — 三列（侧栏+主体+辅助面板）
Wide:    > 1440px   — 最大宽度1280px居中
```

### 5.5 设计系统CSS变量模板

```css
@layer base {
  :root {
    /* Colors — Light */
    --background: 0 0% 100%;
    --foreground: 240 10% 3.9%;
    --card: 0 0% 100%;
    --card-foreground: 240 10% 3.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 240 10% 3.9%;
    --primary: 239 84% 67%;        /* Indigo-500 */
    --primary-foreground: 0 0% 98%;
    --secondary: 240 5% 96%;
    --secondary-foreground: 240 6% 10%;
    --muted: 240 5% 96%;
    --muted-foreground: 240 4% 46%;
    --accent: 240 5% 96%;
    --accent-foreground: 240 6% 10%;
    --destructive: 0 84% 60%;
    --destructive-foreground: 0 0% 98%;
    --border: 240 6% 90%;
    --input: 240 6% 90%;
    --ring: 239 84% 67%;
    --radius: 0.5rem;
    
    /* Custom */
    --success: 142 71% 45%;
    --warning: 38 92% 50%;
    --info: 217 91% 60%;
    --gradient-brand: linear-gradient(135deg, #6366F1, #A855F7, #EC4899);
  }

  .dark {
    --background: 240 10% 3.9%;     /* #09090B */
    --foreground: 0 0% 98%;
    --card: 240 10% 3.9%;
    --card-foreground: 0 0% 98%;
    --popover: 240 10% 3.9%;
    --popover-foreground: 0 0% 98%;
    --primary: 239 84% 67%;
    --primary-foreground: 0 0% 98%;
    --secondary: 240 4% 16%;
    --secondary-foreground: 0 0% 98%;
    --muted: 240 4% 16%;
    --muted-foreground: 240 5% 65%;
    --accent: 240 4% 16%;
    --accent-foreground: 0 0% 98%;
    --destructive: 0 63% 31%;
    --destructive-foreground: 0 0% 98%;
    --border: 240 4% 16%;
    --input: 240 4% 16%;
    --ring: 239 84% 67%;
  }
}
```

---

## 六、参考资源链接

| 资源 | 链接 |
|------|------|
| Aceternity UI | https://ui.aceternity.com |
| Magic UI | https://magicui.design |
| shadcn/ui | https://ui.shadcn.com |
| Origin UI / Coss UI | https://coss.com/ui |
| Tremor | https://tremor.so |
| Luxe UI | https://luxeui.com |
| Linear | https://linear.app |
| Vercel | https://vercel.com/dashboard |
| Resend | https://resend.com |
| Raycast | https://raycast.com |
| UI UX Pro Max | https://github.com/nextlevelbuilder/ui-ux-pro-max-skill |

---

*本文档将随项目进展持续更新。下一步：根据此设计系统创建 Tailwind 配置文件和组件骨架。*
