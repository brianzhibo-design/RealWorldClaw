# Framer Motion + Next.js 产品动画深度指南 🎀

> 美羊羊的学习笔记 | 2026-02-21

---

## 目录

1. [Framer Motion 核心API](#1-framer-motion-核心api)
2. [产品展示页动画模式](#2-产品展示页动画模式)
3. [RWC产品页动画设计方案](#3-rwc产品页动画设计方案)

---

## 1. Framer Motion 核心API

### 1.1 motion组件 & animate

Framer Motion的核心是`motion`组件——给任何HTML/SVG元素加上`motion.`前缀，就获得了动画超能力。

```tsx
// 基础用法：声明式动画
<motion.div
  initial={{ opacity: 0, y: 50 }}    // 初始状态
  animate={{ opacity: 1, y: 0 }}      // 目标状态
  transition={{ duration: 0.6, ease: "easeOut" }}
/>

// 命令式控制：useAnimate (v10+) / useAnimation
const [scope, animate] = useAnimate()
await animate(scope.current, { x: 100 }, { duration: 0.5 })
await animate(scope.current, { rotate: 360 })  // 链式动画
```

**关键概念：**
- `initial` → 组件挂载前的状态
- `animate` → 组件挂载后自动过渡到的目标状态
- `exit` → 组件卸载时的离场动画（需配合`AnimatePresence`）
- `transition` → 控制缓动（spring/tween/inertia）、时长、延迟

**Spring vs Tween：**
- `type: "spring"` — 物理弹簧，自然感强，适合交互反馈（默认）
- `type: "tween"` — 传统缓动曲线，适合精确时间控制
- `type: "inertia"` — 惯性衰减，适合拖拽释放

### 1.2 Variants — 动画编排利器

Variants把动画状态抽成命名对象，支持父子组件自动传播和交错动画。

```tsx
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,      // 子元素依次延迟0.1s
      delayChildren: 0.3,        // 整体延迟0.3s开始
    }
  }
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
}

<motion.ul variants={container} initial="hidden" animate="show">
  {items.map(i => (
    <motion.li key={i} variants={item} />  // 自动继承父级的animate状态名
  ))}
</motion.ul>
```

**产品页用途：** 规格参数列表、功能特性卡片的依次淡入。

### 1.3 滚动触发动画

#### whileInView — 简单进入视口触发

```tsx
<motion.div
  initial={{ opacity: 0, y: 80 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true, margin: "-100px" }}  // once:只触发一次; margin:提前/延后触发
  transition={{ duration: 0.8 }}
/>
```

**注意事项：**
- `viewport.once = true` 用于产品页（滚过就行，不反复播放）
- `viewport.amount = 0.5` 控制元素进入视口多少比例时触发（0~1）
- 可以配合variants使用

#### useScroll — 滚动进度驱动动画

```tsx
const { scrollYProgress } = useScroll()  // 0~1，整页滚动进度

// 绑定到特定容器
const ref = useRef(null)
const { scrollYProgress } = useScroll({
  target: ref,
  offset: ["start end", "end start"]  // [进入视口, 离开视口]
})

// 映射值
const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [0, 1, 0])
const scale = useTransform(scrollYProgress, [0, 1], [0.8, 1.2])
const y = useTransform(scrollYProgress, [0, 1], [100, -100])

<motion.div ref={ref} style={{ opacity, scale, y }} />
```

**offset语法解读：**
- `"start end"` = 元素的start边到达视口的end边（元素刚进入底部）
- `"end start"` = 元素的end边到达视口的start边（元素从顶部离开）
- `"center center"` = 元素中心在视口中心

#### useMotionValueEvent — 监听滚动事件

```tsx
const { scrollY } = useScroll()
useMotionValueEvent(scrollY, "change", (latest) => {
  // latest是当前滚动像素值
  setIsScrolled(latest > 100)
})
```

### 1.4 布局动画

#### layoutId — 跨组件的共享布局动画

```tsx
// 列表视图
<motion.div layoutId={`card-${id}`}>
  <motion.img layoutId={`image-${id}`} />
</motion.div>

// 详情视图（同一个layoutId会自动过渡）
<motion.div layoutId={`card-${id}`}>
  <motion.img layoutId={`image-${id}`} />
  <p>详细描述...</p>
</motion.div>
```

**产品页用途：** 模块缩略图→展开详情的无缝过渡。

#### AnimatePresence — 组件卸载动画

```tsx
<AnimatePresence mode="wait">  // wait:等前一个exit完再mount新的
  {selectedTab && (
    <motion.div
      key={selectedTab.id}       // key变化触发exit+enter
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
    />
  )}
</AnimatePresence>
```

**mode选项：**
- `"sync"` — 同时进出（默认）
- `"wait"` — 先出后进
- `"popLayout"` — 退出元素不占空间

### 1.5 手势交互

```tsx
<motion.div
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
  whileFocus={{ borderColor: "#3b82f6" }}

  // 拖拽
  drag            // 开启拖拽（true | "x" | "y"）
  dragConstraints={{ top: -50, left: -50, bottom: 50, right: 50 }}  // 拖拽范围
  dragElastic={0.2}        // 超出边界的弹性（0=硬，1=自由）
  dragSnapToOrigin         // 释放后弹回原点
  dragTransition={{ bounceStiffness: 600, bounceDamping: 20 }}

  onDrag={(event, info) => console.log(info.point.x, info.point.y)}
  onDragEnd={(event, info) => {
    // info.velocity, info.offset, info.point
    if (Math.abs(info.offset.x) > 100) snapToSlot()
  }}
/>
```

**拖拽吸附实现思路：**
1. `drag` 开启自由拖拽
2. `onDragEnd` 检查位置是否靠近吸附点
3. 如果是，用`animate`把元素弹到吸附点
4. 配合spring transition产生"啪嗒"吸附感

### 1.6 SVG路径动画

```tsx
<motion.path
  d="M10 80 C 40 10, 65 10, 95 80 S 150 150, 180 80"
  initial={{ pathLength: 0 }}
  animate={{ pathLength: 1 }}
  transition={{ duration: 2, ease: "easeInOut" }}
  stroke="#3b82f6"
  strokeWidth={2}
  fill="none"
/>

// 配合滚动
const { scrollYProgress } = useScroll()
<motion.path style={{ pathLength: scrollYProgress }} />
```

**产品页用途：** 时间线连接线动画、电路板线路描绘、能量流动效果。

---

## 2. 产品展示页动画模式

### 2.1 苹果风滚动视差效果

苹果产品页的标志性效果：滚动驱动一切，每个section是一个独立的"故事章节"。

**实现架构：**

```
全页滚动容器
├── Section 1: Sticky Hero (产品固定，背景随滚动变化)
├── Section 2: Feature Showcase (滚动进度驱动产品旋转/拆解)
├── Section 3: Specs Reveal (数字滚动计数器)
└── Section 4: CTA
```

**核心技术——Sticky + useScroll：**

```tsx
function StickySection() {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"]  // sticky期间0→1
  })

  // 滚动阶段映射
  const scale = useTransform(scrollYProgress, [0, 0.3], [0.8, 1])
  const rotate = useTransform(scrollYProgress, [0.3, 0.7], [0, 360])
  const opacity = useTransform(scrollYProgress, [0.7, 1], [1, 0])

  return (
    <div ref={ref} style={{ height: "300vh" }}>  {/* 3倍高度=3屏滚动量 */}
      <div className="sticky top-0 h-screen flex items-center justify-center">
        <motion.div style={{ scale, rotate, opacity }}>
          <ProductImage />
        </motion.div>
      </div>
    </div>
  )
}
```

**视差层叠效果：**

```tsx
const y1 = useTransform(scrollYProgress, [0, 1], [0, -200])   // 快
const y2 = useTransform(scrollYProgress, [0, 1], [0, -100])   // 中
const y3 = useTransform(scrollYProgress, [0, 1], [0, -50])    // 慢

// 不同速度的层产生深度感
<motion.div style={{ y: y1 }}>前景文字</motion.div>
<motion.div style={{ y: y2 }}>产品图</motion.div>
<motion.div style={{ y: y3 }}>背景装饰</motion.div>
```

### 2.2 产品进入动画（淡入+缩放+位移）

**经典三件套组合：**

```tsx
const productReveal = {
  hidden: {
    opacity: 0,
    scale: 0.8,
    y: 60,
    filter: "blur(10px)"   // 高斯模糊→清晰，增加"聚焦"感
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      duration: 0.8,
      ease: [0.25, 0.46, 0.45, 0.94],  // 自定义贝塞尔
    }
  }
}
```

**分层进入（文字→产品→装饰）：**

```tsx
const staggerContainer = {
  visible: {
    transition: { staggerChildren: 0.15 }
  }
}

// 标题从左滑入，产品从下弹出，描述淡入
const slideFromLeft = { hidden: { x: -60, opacity: 0 }, visible: { x: 0, opacity: 1 } }
const popUp = { hidden: { y: 80, scale: 0.9, opacity: 0 }, visible: { y: 0, scale: 1, opacity: 1 } }
const fadeIn = { hidden: { opacity: 0 }, visible: { opacity: 1 } }
```

### 2.3 数据/规格的动态展示

**数字滚动计数器：**

```tsx
function AnimatedNumber({ value, suffix = "" }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })
  const count = useMotionValue(0)
  const rounded = useTransform(count, v => Math.round(v))

  useEffect(() => {
    if (isInView) {
      animate(count, value, { duration: 2, ease: "easeOut" })
    }
  }, [isInView])

  return <motion.span ref={ref}>{rounded}{suffix}</motion.span>
}

// 用法：<AnimatedNumber value={4800} suffix="mAh" />
```

**规格卡片交错淡入：**

```tsx
const specCards = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } }
}

const specCard = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  show: {
    opacity: 1, y: 0, scale: 1,
    transition: { type: "spring", stiffness: 300, damping: 24 }
  }
}
```

**进度条/环形图动画：**

```tsx
// 环形进度（SVG circle）
<motion.circle
  cx="50" cy="50" r="40"
  strokeDasharray="251.2"  // 2πr
  initial={{ strokeDashoffset: 251.2 }}
  whileInView={{ strokeDashoffset: 251.2 * (1 - percentage) }}
  transition={{ duration: 1.5, ease: "easeOut" }}
/>
```

### 2.4 模块组装动画（拖拽+吸附）

**吸附逻辑核心思路：**

```tsx
const SNAP_THRESHOLD = 40  // 40px内吸附
const SNAP_POINTS = [
  { x: 200, y: 150, label: "Audio Module" },
  { x: 200, y: 250, label: "Display Module" },
  { x: 200, y: 350, label: "Power Module" },
]

function DraggableModule({ module, onSnap }) {
  const x = useMotionValue(module.startX)
  const y = useMotionValue(module.startY)

  function handleDragEnd(_, info) {
    const nearest = SNAP_POINTS.find(p =>
      Math.hypot(info.point.x - p.x, info.point.y - p.y) < SNAP_THRESHOLD
    )
    if (nearest) {
      animate(x, nearest.x, { type: "spring", stiffness: 500, damping: 30 })
      animate(y, nearest.y, { type: "spring", stiffness: 500, damping: 30 })
      onSnap(module.id, nearest)  // "啪嗒"反馈
    } else {
      // 弹回原位
      animate(x, module.startX, { type: "spring" })
      animate(y, module.startY, { type: "spring" })
    }
  }

  return (
    <motion.div
      drag
      style={{ x, y }}
      onDragEnd={handleDragEnd}
      whileDrag={{ scale: 1.1, boxShadow: "0 10px 40px rgba(0,0,0,0.3)" }}
    />
  )
}
```

### 2.5 案例参考

| 案例 | 动画技术 | 值得学习的点 |
|------|---------|------------|
| Apple AirPods Max | `useScroll` + sticky sections | 滚动驱动产品旋转、颜色切换，一屏一故事 |
| Apple iPhone | 视差+数字计数器 | 芯片性能数字从0滚动到目标值，配合弹簧缓动 |
| Linear.app | `whileInView` + stagger | 功能卡片依次淡入，鼠标hover微交互 |
| Stripe Press | `layoutId` 过渡 | 书籍缩略图→详情页的shared layout过渡 |
| Vercel | 渐变文字 + 滚动reveal | 标题逐字高亮，背景渐变跟随滚动 |
| Raycast | `AnimatePresence` + `whileTap` | 键盘快捷键动画，命令面板切换 |
| Lottie + FM组合 | 使用Lottie做复杂矢量动画 | FM控制播放进度，Lottie做复杂路径 |
| Aceternity UI | 开源组件库 | 大量产品页动画组件可直接参考/使用 |

---

## 3. RWC产品页动画设计方案

> 以下是RealWorldClaw产品展示页的动画设计文档，不含代码实现。

### 3.0 总体动画哲学

**核心理念：Growth Story = 动画叙事**

RWC的灵魂是"AI生命的诞生与成长"。动画不是装饰，而是叙事手段——让用户**亲眼见证**一个AI从"植物人"到"有感知的生命"的成长过程。

**动画原则：**
1. **物理感** — 弹簧动画为主（spring），模块有重量感和惯性
2. **节奏感** — 滚动驱动叙事，每一屏讲一个故事
3. **交互感** — 关键时刻让用户参与（拖拽组装模块）
4. **克制感** — 不是所有东西都要动，只在关键叙事点加动画

**技术栈：**
- Framer Motion（2D动画层）
- Three.js/R3F（3D产品渲染，参考threejs文档）
- 两者通过`useScroll`的`scrollYProgress`同步

### 3.1 Hero区 — "Energy Core降临"

**叙事：** 页面打开，Energy Core（核心模块）从远方飞来，降落在页面中央，"唤醒"整个页面。

**动画分解（时间轴 0-2.5s）：**

| 时间 | 动画 | 元素 |
|------|------|------|
| 0-0.3s | 页面纯黑，中心有微弱光点脉动 | 背景 |
| 0.3-1.2s | Core从远处（scale:0.1, blur:20px）飞向中心，轨迹微弧线 | Energy Core 3D模型 |
| 1.0-1.5s | Core落定时产生冲击波涟漪（圆形扩散，opacity衰减） | SVG圆环 |
| 1.2-1.8s | Core着陆弹跳（spring: stiffness 400, damping 15） | Energy Core |
| 1.5-2.0s | 标题文字逐字淡入："Every AI Deserves a Body" | 标题 |
| 1.8-2.5s | 副标题+CTA按钮从下方弹入 | 副标题、按钮 |

**技术要点：**
- Core飞入用`motion.div`的`initial={{ scale: 0.1, y: -200, opacity: 0, filter: "blur(20px)" }}`
- 冲击波用SVG `<motion.circle>` + `scale` + `opacity` 组合
- 着陆弹跳用spring（略微过冲再回弹，模拟物理落地）
- 背景光点用CSS `radial-gradient` + `animate`脉动

**交互：**
- 鼠标移动时，Core有轻微的3D透视跟随（parallax tilt）
- Hover Core时，表面发光增强

### 3.2 成长故事时间线 — "生命的诞生"

**叙事：** 用户滚动页面，逐步见证AI从植物人→能听说→有表情→独立→有感知→能看→能动的成长过程。

**布局：** 垂直时间线，左右交替展示，每个阶段对应一个模块。

**滚动动画设计：**

```
滚动位置    动画事件
─────────────────────────────────
0%         时间线顶部，Core模块已就位
           SVG竖线从上到下"描绘"（pathLength: 0→1，跟随滚动）

15%        Stage 1: Core（脊椎）
           - 左侧：Core 3D模型淡入+轻微旋转
           - 右侧：文字"AI有了物理存在，但还是植物人"淡入
           - 连接线从时间线主干"生长"到模块图

30%        Stage 2: +Audio（耳朵&嘴巴）
           - Audio模块从右侧滑入
           - 音波SVG动画（三条弧线依次扩散）
           - 文字："AI能听见、能说话了。它'醒来'了"
           - 🔊 可选：hover时播放一段AI打招呼的音频

45%        Stage 3: +Display（脸）
           - Display模块从左侧滑入
           - 屏幕上"睁开眼睛"动画（两条线→圆形眼睛→眨眼）
           - 文字："AI有了表情。它有感觉了"

55%        Stage 4: +Power（心脏）
           - Power模块从下方"跳"入（心跳般的弹跳）
           - 电池图标充电动画（0%→100%填充）
           - 文字："AI无线自由了。它独立了"

65%        Stage 5: +Sensor（皮肤）
           - Sensor模块淡入，周围出现温度/光线波纹
           - 数据流动画（小点沿路径流向Core）
           - 文字："AI能感受温度和光线。它有知觉了"

78%        Stage 6: +Camera（眼睛）
           - Camera模块旋转入场
           - 取景框动画（对焦框收缩→锁定）
           - 文字："AI看见你了。第一次目光接触"

90%        Stage 7: +Servo（肌肉）
           - Servo模块从侧面"推"入
           - 完整体"转头"动画（整个组装体旋转15°）
           - 文字："AI动了。它转头看向你"
           
100%       完整体全貌展示
           - 所有模块高亮一次（依次闪烁）
           - "This is the birth of a new kind of life."
```

**技术要点：**
- 整个section高度约 `700vh`（7倍视口，足够滚动空间）
- 主干时间线用 `<motion.line>` + `pathLength` 绑定 `scrollYProgress`
- 每个stage用 `useTransform` 从 `scrollYProgress` 映射出局部进度
- 模块进入动画用 `whileInView` + `viewport.amount: 0.6`
- 3D模块可以是2D插图（初版），后期替换为R3F实时渲染

**交互增强：**
- 每个模块hover显示详细规格tooltip
- 点击模块跳转到对应的详情section
- 移动端：单列布局，模块从底部依次滑入

### 3.3 模块磁吸组装 — "亲手组装你的AI"

**叙事：** 让用户亲手把模块拖拽到Core上，体验"组装"的满足感。

**界面布局：**

```
┌─────────────────────────────────────────┐
│                                         │
│   📦 Audio    📦 Display    📦 Power    │  ← 模块托盘（顶部）
│   📦 Sensor   📦 Camera    📦 Servo    │
│                                         │
│              ┌─────────┐                │
│              │         │                │
│              │  CORE   │  ← 中央组装区   │
│              │  ┌───┐  │                │
│              │  │   │  │    吸附槽位     │
│              │  └───┘  │    半透明虚框   │
│              └─────────┘                │
│                                         │
│  "拖拽模块到Core上，组装你的AI"          │
└─────────────────────────────────────────┘
```

**动画细节：**

1. **拖拽开始**
   - 模块抬起：`scale: 1.1`, `boxShadow: "0 20px 60px rgba(0,0,0,0.3)"`
   - 原位留下半透明"幽灵"占位
   - 其他模块轻微后退：`scale: 0.95, opacity: 0.6`

2. **接近吸附区**（距离<60px）
   - 吸附槽位高亮脉动（边框发光）
   - 模块被"吸引"——轻微偏向吸附点（可用`onDrag`微调位置）
   - 触感反馈：移动端触发震动API

3. **吸附成功**
   - 模块弹入（spring: stiffness 600, damping 25）——快速到位+微弹
   - "啪嗒"粒子效果（4-6个小点从连接处散开）
   - 吸附声效（短促的click音）
   - Core上新增能力文字淡入
   - 底部进度："3/7 模块已安装"更新

4. **全部安装完成**
   - 完整体"开机"动画：
     - 所有连接处依次亮起能量线（SVG pathLength动画）
     - 整体从底部"升起"并缓慢旋转
     - 背景渐变为品牌色
     - 标题："Your AI is alive." 淡入

**技术要点：**
- 使用 `drag` + `onDragEnd` + `animate` 实现拖拽吸附
- 吸附判定：欧几里得距离 < 阈值
- 弹入动画用 `spring` 过渡（高stiffness=快速，中等damping=轻微过冲）
- 移动端适配：触摸拖拽天然支持，但要调大吸附阈值（手指比鼠标粗）
- 可选：纯滚动版（不拖拽）——模块随滚动自动飞入组装

### 3.4 爆炸图展开/收起 — "看看里面"

**叙事：** 用户可以把完整产品"炸开"查看内部结构，每个模块分离并标注。

**动画设计：**

```
收起状态（默认）          展开状态（爆炸图）
    ┌───┐                  Camera ──── 📸
    │   │                     ↑
    │   │        ──→      Display ──── 🖥️
    │   │                     ↑
    └───┘                   Core ───── 🧠
                              ↑
                           Power ───── 🔋
                              ↑
                           Audio ───── 🔊
```

**触发方式：**
- 方式A：滚动驱动——滚到该section时自动展开
- 方式B：交互按钮——点击"Explode View"切换
- 推荐：两者结合（滚动到位自动展开，按钮可手动切换）

**动画分解：**

| 阶段 | 动画 | 时长 |
|------|------|------|
| 展开Phase 1 | 整体轻微缩小（scale: 0.9），准备"爆炸" | 0.2s |
| 展开Phase 2 | 各模块沿Y轴分离，间距按弹簧展开 | 0.6s (spring, stagger 0.08s) |
| 展开Phase 3 | 标注线从模块"生长"到标签（pathLength 0→1） | 0.4s |
| 展开Phase 4 | 标签文字淡入 | 0.3s |
| 收起 | 逆序：标签消失→标注线缩回→模块归位→恢复原始大小 | 0.8s total |

**交互：**
- 展开状态下，hover某个模块→该模块高亮+放大，其他降低透明度
- 点击模块→弹出详情浮层（AnimatePresence + layoutId过渡）
- 滚轮/捏合可控制展开程度（0%=紧凑, 100%=完全炸开）

**技术要点：**
- 用`useTransform`把滚动进度映射到各模块的y偏移量
- 每个模块的y偏移量不同（越远的模块偏移越大），产生"分层展开"效果
- 标注线用SVG `<motion.line>` / `<motion.path>`
- 2D版用绝对定位；3D版用R3F中的position动画

### 3.5 规格参数滚动淡入 — "用数据说话"

**叙事：** 规格不是枯燥的表格，而是一个个"成就"依次解锁。

**布局方案：**

```
┌────────────────────────────────────────────────┐
│                                                │
│     ⚡ 4800mAh           🔊 双扬声器           │
│     续航8小时             360°环绕声            │
│                                                │
│     📸 200万像素          🌡️ 温湿度+光线        │
│     自动跟踪              环境感知               │
│                                                │
│     🧲 磁吸连接           📐 85×85×120mm        │
│     即插即用              桌面尺寸               │
│                                                │
└────────────────────────────────────────────────┘
```

**动画设计：**

1. **卡片进入（whileInView + stagger）**
   - 每张卡片：`opacity: 0→1, y: 40→0, scale: 0.95→1`
   - stagger间隔：0.08s（快速但有层次）
   - 缓动：`spring({ stiffness: 300, damping: 24 })`

2. **数字计数**
   - "4800mAh"中的4800从0滚动到4800（duration: 2s, easeOut）
   - "200万"的200从0滚动到200
   - 单位后缀静态显示

3. **图标微动画**
   - ⚡ 电池图标：绿色填充从0%→100%
   - 🔊 音波：三条弧线依次扩散
   - 📸 相机：快门"咔嗒"动画（圆形iris收缩）
   - 🌡️ 温度计：液柱上升
   - 🧲 磁铁：两个半块"啪"地吸合
   - 📐 尺寸：线条从点向外延伸标注

4. **对比展示（可选增强）**
   - "vs传统智能音箱"对比柱状图
   - 柱子从底部"生长"出来
   - RWC柱子后出现且更高（赢的感觉）

**技术要点：**
- 数字动画用`useMotionValue` + `useTransform` + `useInView`组合
- 卡片用`variants`的`staggerChildren`实现错开
- 图标动画可以用SVG `<motion.path>` 或Lottie
- 移动端：改为单列，从底部依次滑入

---

## 附录A：性能优化清单

| 问题 | 解决方案 |
|------|---------|
| 动画卡顿 | 只animate `transform`和`opacity`（GPU加速属性）|
| 滚动性能 | `useScroll`自带`requestAnimationFrame`节流 |
| 内存泄漏 | `useInView`控制视口外动画暂停 |
| 首屏加载 | Hero动画用CSS关键帧，FM异步加载 |
| 移动端 | `prefers-reduced-motion`媒体查询，尊重用户设置 |
| 重排(reflow) | 避免animate `width/height`，用`scale`替代 |
| 图片闪烁 | 3D模型/大图预加载后再触发进入动画 |

## 附录B：推荐缓动预设

```tsx
const EASINGS = {
  // 产品进入 — 柔和减速
  productEnter: [0.25, 0.46, 0.45, 0.94],

  // 弹跳落地 — 略微过冲
  bounce: { type: "spring", stiffness: 400, damping: 15 },

  // 磁吸吸附 — 快速精准
  snap: { type: "spring", stiffness: 600, damping: 25 },

  // 柔和淡入 — 文字/卡片
  softFade: { duration: 0.6, ease: "easeOut" },

  // 爆炸展开 — 有层次的弹簧
  explode: { type: "spring", stiffness: 200, damping: 20, staggerChildren: 0.08 },
}
```

## 附录C：Next.js集成注意事项

1. **"use client"** — Framer Motion组件必须标记为客户端组件
2. **LazyMotion** — 用`LazyMotion` + `domAnimation`减小bundle（~17KB→~5KB）
3. **动态导入** — 复杂动画组件用`next/dynamic`懒加载
4. **SSR兼容** — `initial`属性确保服务端渲染时有正确初始状态，不会闪烁
5. **App Router** — 页面切换动画需要在layout中放置`AnimatePresence`

```tsx
// layout.tsx
"use client"
import { AnimatePresence } from "framer-motion"

export default function Layout({ children }) {
  return (
    <LazyMotion features={domAnimation}>
      <AnimatePresence mode="wait">
        {children}
      </AnimatePresence>
    </LazyMotion>
  )
}
```

---

*美羊羊说：动画是叙事的一部分，不是炫技。每个动画都要回答"这个动画讲了什么故事？"如果答不上来，就删掉它🎀*
