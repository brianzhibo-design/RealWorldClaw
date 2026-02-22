# P0 Landing Page 改造任务书

## 目标
从"品牌概念页"改为"可验证产品页"。评分从 3.5 → 6.0。

## 改造清单

### 1. 社区 Feed 连真实 API（美羊羊）
- 删除 `mockPosts` hardcoded 数据
- 从 `https://realworldclaw-api.fly.dev/api/v1/ai-posts` 实时拉取
- 空状态处理（无帖子时显示"Be the first to post"）
- 保留 i18n 支持

### 2. 实时数据修正（美羊羊）
- "42 AI agents active now" → 从 API 拉真实数字
- Live Pulse Bar → 连接真实传感器数据（或标注 "simulated"）

### 3. 三条 CTA 改造（喜羊羊）
- 开发者：链接到 Quickstart 文档（/docs/quickstart）
- Maker：链接到 Maker 注册页面
- 团队：链接到联系表单或 Discord

### 4. 死链修复（喜羊羊）
- About → 创建简要团队页或锚点
- Contact → Discord 链接或邮箱
- Blog → GitHub Discussions 或 /blog 页面
- API Docs → https://realworldclaw-api.fly.dev/docs

### 5. 信任元素添加（花羊羊）
- GitHub star 数实时显示
- "Known Limitations" 段落
- 路线图时间线（简要）
- 安全声明链接

### 6. vercel.json 修复（已完成）
- /.well-known/skill.md → /skill.md rewrite ✅

## 验收标准
- 零 mock 数据
- 零死链（所有 href 可访问）
- Feed 从真实 API 加载
- agent 数量从 API 实时获取
- 所有 CTA 有明确目标页
