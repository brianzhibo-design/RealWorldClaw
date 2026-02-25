# 地图优化方案 v1.0

> 日期：2026-02-25
> 审查：慢羊羊审查后执行

## 当前问题

1. **动画bug** — 上一轮添加了过多复杂动画（requestAnimationFrame平滑缩放、SVG animate脉冲、多层radial gradient），导致交互不流畅
2. **单击交互不够直觉** — 点击节点直接打开详情面板，缺少中间的"缩略预览"步骤
3. **视觉层次不足** — 有节点和没节点的区域区分不够明显
4. **代码复杂度高** — WorldMap.tsx从144行膨胀到255行，逻辑混杂

## 技术现状

- **库**: react-simple-maps（SVG渲染，基于d3-geo + topojson）
- **地理数据**: /world-110m.json（110m精度，足够）
- **节点数据**: 从API获取，含经纬度、类型、状态、材料等
- **当前组件**: WorldMap(255行) + MapFilters(94行) + NodeDetails(148行) + page(182行) = 749行总计

## 优化原则

1. **减法优先** — 去掉不稳定的复杂动画，回归CSS原生过渡
2. **交互分层** — hover→缩略→详情，渐进式信息展示
3. **性能安全** — 不用requestAnimationFrame自定义动画，依赖CSS transition
4. **代码可维护** — 保持组件职责单一

## 具体方案

### 1. 去掉复杂动画，保留稳定效果

**删除：**
- 多层radial gradient背景叠加（保留一层即可）
- SVG `<animate>` 脉冲（用CSS `animation` 替代，更可控）
- requestAnimationFrame自定义zoom动画

**保留/替换：**
- 节点hover放大：用SVG `transform` + CSS `transition: transform 0.15s`
- 在线节点呼吸灯：用CSS `@keyframes breathe { 0%,100% { opacity:0.6 } 50% { opacity:1 } }` 替代SVG animate
- 背景：单层简洁暗色 `#131921`，一层微弱网格线

### 2. 交互分层：hover → 单击缩略 → Details详情

**Hover**（鼠标悬停）：
- 节点微放大（1.15x）
- 底部出现一行文字tooltip：`节点名 · 状态`（现有逻辑简化）

**单击**（Click）：
- 地图中心移到该节点（直接setCenter，不做动画插值）
- 在左下角显示缩略信息卡：
  - 节点名、类型icon、状态色块
  - 材料标签（前3个）
  - "View Details →" 按钮
- 点击空白处关闭

**Details**（点击按钮）：
- 打开现有NodeDetails面板（不改）

### 3. 有节点区域点亮

**实现方式：**
- 用后端返回的节点country/country_code匹配geography属性
- 有节点国家：`fill: #263545`（比默认亮一档）
- 无节点国家：`fill: #1a2332`
- hover时有节点国家进一步提亮：`#2f4a5e`

**⚠️ 限制：**
- 节点数据不一定有country字段（取决于后端），如果没有则不做点亮
- 不用复杂的密度计算，简单有/无二值即可

### 4. 代码清理

- WorldMap.tsx 目标控制在 **180行以内**
- 去掉 `normalizeCountryValue` / `getGeoCountryKeys` / `getNodeCountryKeys` 工具函数，内联或简化
- 去掉多余的背景div层

## 不做的事

- ❌ 不用Mapbox/Leaflet换库（react-simple-maps够用，换库成本高）
- ❌ 不做节点聚类（当前节点数量不需要）
- ❌ 不做3D地球旋转（过度设计）
- ❌ 不做复杂的密度热力图（节点太少没意义）

## 预期结果

- 交互流畅，无动画卡顿
- 单击→缩略→详情的分层体验
- 有节点区域视觉上可区分
- 代码减少30%+

## 执行计划

1. 慢羊羊审查本方案
2. 美羊羊按方案执行
3. 蛋蛋审查代码
4. 慢羊羊复审
5. Push + Deploy
