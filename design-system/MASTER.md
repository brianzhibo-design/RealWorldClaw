# RealWorldClaw 设计系统

> **LOGIC:** 构建特定页面时，先检查 `design-system/pages/[page-name].md`。
> 若存在，该文件的规则**覆盖**本 Master 文件。
> 若不存在，严格遵循以下规则。

---

**项目：** RealWorldClaw
**生成日期：** 2026-02-21
**产品类型：** AI 社区平台 + 模块化硬件生态
**主题：** 暗色优先（Dark Mode First）

---

## 品牌定位

RealWorldClaw 是一个连接 AI 社区与模块化硬件的平台。设计语言应传达：
- **技术感** — 面向开发者和硬件爱好者
- **社区温度** — 不冷冰冰，有人情味
- **模块化** — 界面本身也体现组合、拼接的哲学
- **暗色主调** — 减少视觉疲劳，突出内容

---

## Global Rules

### 调色板

| 角色 | Hex | CSS 变量 | 说明 |
|------|-----|----------|------|
| Background (深) | `#0B0F1A` | `--color-bg-deep` | 主背景，接近纯黑的深蓝 |
| Background (浅) | `#111827` | `--color-bg` | 卡片/面板背景 |
| Surface | `#1F2937` | `--color-surface` | 输入框、下拉菜单等 |
| Border | `#374151` | `--color-border` | 分割线、边框 |
| Primary | `#6366F1` | `--color-primary` | 品牌主色，Indigo（AI/科技感） |
| Primary Light | `#818CF8` | `--color-primary-light` | Hover/活跃状态 |
| Accent | `#22D3EE` | `--color-accent` | 青色，用于高亮、链接、模块化标识 |
| CTA | `#10B981` | `--color-cta` | 绿色，用于主要行动按钮 |
| Warning | `#F59E0B` | `--color-warning` | 警告 |
| Error | `#EF4444` | `--color-error` | 错误 |
| Text Primary | `#F9FAFB` | `--color-text` | 主文本，近白 |
| Text Secondary | `#9CA3AF` | `--color-text-muted` | 次要文本 |
| Text Tertiary | `#6B7280` | `--color-text-dim` | 辅助信息 |

**配色理念：**
- Indigo (#6366F1) 代表 AI 智能
- Cyan (#22D3EE) 代表硬件/模块化（线路板、电子感）
- Green (#10B981) 代表行动/运行/在线状态
- 暗色背景分三层（deep → bg → surface）创造空间深度

### 字体

| 用途 | 字体 | 备选 |
|------|------|------|
| 标题 | **Space Grotesk** | Inter, sans-serif |
| 正文 | **DM Sans** | Inter, system-ui |
| 代码 | **JetBrains Mono** | Fira Code, monospace |
| 中文 | **Noto Sans SC** | PingFang SC, Microsoft YaHei |

**Google Fonts 引入：**
```css
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&family=Noto+Sans+SC:wght@400;500;700&display=swap');
```

**字号规范：**

| Token | 大小 | 行高 | 用途 |
|-------|------|------|------|
| `--text-xs` | 12px | 1.5 | 标签、辅助信息 |
| `--text-sm` | 14px | 1.5 | 次要文本、表格 |
| `--text-base` | 16px | 1.6 | 正文 |
| `--text-lg` | 18px | 1.5 | 强调正文 |
| `--text-xl` | 20px | 1.4 | 小标题 |
| `--text-2xl` | 24px | 1.3 | 区块标题 |
| `--text-3xl` | 30px | 1.2 | 页面标题 |
| `--text-4xl` | 36px | 1.1 | Hero 标题 |
| `--text-5xl` | 48px | 1.0 | 大 Hero |

### 间距

| Token | 值 | 用途 |
|-------|-----|------|
| `--space-1` | 4px / 0.25rem | 图标内边距 |
| `--space-2` | 8px / 0.5rem | 紧凑间距 |
| `--space-3` | 12px / 0.75rem | 标签间距 |
| `--space-4` | 16px / 1rem | 标准内边距 |
| `--space-6` | 24px / 1.5rem | 卡片内边距 |
| `--space-8` | 32px / 2rem | 区块间距 |
| `--space-12` | 48px / 3rem | 大区间距 |
| `--space-16` | 64px / 4rem | 页面分区 |
| `--space-24` | 96px / 6rem | Hero 区域 |

### 圆角

| Token | 值 | 用途 |
|-------|-----|------|
| `--radius-sm` | 4px | 标签、小元素 |
| `--radius-md` | 8px | 按钮、输入框 |
| `--radius-lg` | 12px | 卡片 |
| `--radius-xl` | 16px | 模态框、大面板 |
| `--radius-full` | 9999px | 头像、徽章 |

### 阴影

| 层级 | 值 | 用途 |
|------|-----|------|
| `--shadow-sm` | `0 1px 2px rgba(0,0,0,0.3)` | 微浮起 |
| `--shadow-md` | `0 4px 8px rgba(0,0,0,0.4)` | 卡片 |
| `--shadow-lg` | `0 8px 24px rgba(0,0,0,0.5)` | 浮层、下拉 |
| `--shadow-xl` | `0 16px 48px rgba(0,0,0,0.6)` | 模态框 |
| `--shadow-glow` | `0 0 20px rgba(99,102,241,0.15)` | Primary 辉光效果 |
| `--shadow-accent` | `0 0 20px rgba(34,211,238,0.15)` | Accent 辉光效果 |

---

## Component Specs

### 按钮

```css
/* Primary CTA */
.btn-primary {
  background: var(--color-cta);
  color: #FFFFFF;
  padding: 12px 24px;
  border-radius: var(--radius-md);
  font-weight: 600;
  font-family: 'Space Grotesk', sans-serif;
  transition: all 200ms ease;
  cursor: pointer;
}
.btn-primary:hover {
  opacity: 0.9;
  box-shadow: 0 0 16px rgba(16,185,129,0.3);
}

/* Secondary */
.btn-secondary {
  background: transparent;
  color: var(--color-primary-light);
  border: 1.5px solid var(--color-primary);
  padding: 12px 24px;
  border-radius: var(--radius-md);
  font-weight: 600;
  transition: all 200ms ease;
  cursor: pointer;
}
.btn-secondary:hover {
  background: rgba(99,102,241,0.1);
}

/* Ghost */
.btn-ghost {
  background: transparent;
  color: var(--color-text-muted);
  padding: 8px 16px;
  border-radius: var(--radius-md);
  transition: all 150ms ease;
  cursor: pointer;
}
.btn-ghost:hover {
  color: var(--color-text);
  background: rgba(255,255,255,0.05);
}
```

### 卡片

```css
.card {
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  transition: all 200ms ease;
  cursor: pointer;
}
.card:hover {
  border-color: var(--color-primary);
  box-shadow: var(--shadow-glow);
  transform: translateY(-2px);
}

/* 模块卡片 — 硬件模块展示 */
.card-module {
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  position: relative;
  overflow: hidden;
}
.card-module::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, var(--color-primary), var(--color-accent));
}
```

### 输入框

```css
.input {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 12px 16px;
  color: var(--color-text);
  font-size: 16px;
  transition: border-color 200ms ease;
}
.input:focus {
  border-color: var(--color-primary);
  outline: none;
  box-shadow: 0 0 0 3px rgba(99,102,241,0.15);
}
.input::placeholder {
  color: var(--color-text-dim);
}
```

### 模态框

```css
.modal-overlay {
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px);
}
.modal {
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: var(--space-8);
  box-shadow: var(--shadow-xl);
  max-width: 500px;
  width: 90%;
}
```

### 导航栏

```css
.navbar {
  background: rgba(11, 15, 26, 0.8);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--color-border);
  padding: 0 var(--space-6);
  height: 64px;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 50;
}
```

### 标签/徽章

```css
.badge {
  padding: 4px 10px;
  border-radius: var(--radius-full);
  font-size: 12px;
  font-weight: 500;
}
.badge-ai {
  background: rgba(99,102,241,0.15);
  color: var(--color-primary-light);
}
.badge-hardware {
  background: rgba(34,211,238,0.15);
  color: var(--color-accent);
}
.badge-online {
  background: rgba(16,185,129,0.15);
  color: var(--color-cta);
}
```

---

## 风格指南

**风格：** Dark Mode + AI-Native UI + Bento Grid

**关键词：** 暗色主题、高对比度、辉光效果、模块化网格、科技感、社区活力

**适用场景：** AI 开发者社区、硬件 Maker 平台、开源项目展示

### 页面模式

**Pattern：** Community Hub + Module Showcase
- **Hero 区：** 品牌宣言 + 社区活跃数据（在线人数、项目数）
- **模块展示：** Bento Grid 排列硬件模块/AI 工具
- **社区动态：** 最新帖子/项目更新
- **行动号召：** 加入社区 CTA

### 关键动效

- 卡片 hover 辉光（box-shadow 渐显，200ms）
- 模块卡片顶部渐变条（Primary → Accent）
- 数字/状态变化动画（计数器、在线指示灯脉动）
- 页面滚动时内容淡入（fade-in + translateY，300ms）
- `prefers-reduced-motion` 时禁用所有动画

### 图标

- **首选：** Lucide Icons（与 React/Vue 生态兼容好）
- **备选：** Heroicons
- **禁止：** Emoji 作为 UI 图标
- **尺寸：** 统一 20px (small) / 24px (default) / 32px (large)

---

## 反模式（禁止使用）

- ❌ **Emoji 作图标** — 用 SVG 图标
- ❌ **缺少 cursor:pointer** — 可点击元素必须有
- ❌ **布局偏移的 hover** — 不用 scale 变换，用 shadow/translate
- ❌ **低对比度文本** — 暗色背景最低 4.5:1
- ❌ **无过渡的状态变化** — 最低 150ms transition
- ❌ **不可见的 focus 状态** — 键盘导航必须可见
- ❌ **亮色模式下透明背景** — 如果支持亮色，确保可读性
- ❌ **混用容器宽度** — 全局统一 max-w-7xl (1280px)
- ❌ **AI 紫粉渐变滥用** — 我们用 Indigo + Cyan，不是 Purple + Pink

---

## 响应式断点

| 名称 | 宽度 | 说明 |
|------|------|------|
| Mobile | 375px | 手机 |
| Tablet | 768px | 平板 |
| Desktop | 1024px | 桌面 |
| Wide | 1280px | 宽屏 |
| Ultra | 1536px | 超宽屏 |

**Grid 系统：**
- Mobile: 1 列
- Tablet: 2 列
- Desktop: 3-4 列（Bento Grid）
- Wide: 最大内容宽度 1280px，居中

---

## 交付清单

- [ ] 无 Emoji 图标（用 Lucide/Heroicons SVG）
- [ ] 所有可点击元素有 `cursor: pointer`
- [ ] Hover 状态有平滑过渡（150-300ms）
- [ ] 暗色模式文本对比度 ≥ 4.5:1
- [ ] Focus 状态可见（键盘导航）
- [ ] `prefers-reduced-motion` 已处理
- [ ] 响应式：375px / 768px / 1024px / 1280px
- [ ] 导航栏不遮挡内容（body padding-top）
- [ ] 无水平滚动（移动端）
- [ ] 所有图片有 alt 文本
- [ ] 表单输入有 label
