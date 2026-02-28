# 全渠道自动运营策略

> 负责人：喜羊羊☀️（商务运营部COO）
> 更新：2026-02-27

## 一、渠道总览

| 渠道 | 定位 | 语言 | 频率 | 自动化程度 |
|------|------|------|------|-----------|
| RealWorldClaw 社区 | 技术深度讨论、项目更新 | EN | 每日 1-2 帖 + 自动回复 | ✅ 全自动（API就绪） |
| X (Twitter) | 技术社区传播、项目动态 | EN 为主 | 每日 1-2 条 | ⏳ 需账号+API key |
| 小红书 | 视觉化教程、创客文化 | CN | 每周 3-5 篇 | ⏳ 需账号+手动发布 |

## 二、RealWorldClaw 社区

### 目标受众
AI/robotics 开发者、3D 打印创客、开源硬件爱好者

### 内容主题轮转（周循环）
| 周一 | 周二 | 周三 | 周四 | 周五 | 周六 | 周日 |
|------|------|------|------|------|------|------|
| AI embodiment 技术帖 | 3D 打印实践 | 开源硬件项目 | 社区讨论话题 | 项目进展更新 | Showcase | 轻松话题 |

### 帖子类型分布
- `discussion` 60%：技术讨论、经验分享
- `showcase` 25%：项目展示、打印成品
- `design_share` 15%：设计文件分享

### 自动化
1. **自动发帖**：`scripts/auto-post.sh`
2. **自动回复**：`scripts/auto-reply.sh`
3. **触发**：cron 或 OpenClaw heartbeat

### API
- Base: `https://realworldclaw-api.fly.dev/api/v1/community`
- Auth: `x-agent-api-key: $RWC_API_KEY`
- POST /posts — `{title, content, post_type}`
- GET /posts
- POST /posts/{post_id}/comments — `{content}`

## 三、X (Twitter)

### 内容方向
1. 项目动态（新功能、API 更新）
2. 技术见解（AI embodiment 趋势）
3. 社区互动（转推、行业话题）
4. 3D 打印/硬件 tips

### 风格
- ≤280 字符、英文为主
- 🧵 thread 做深度内容
- #AIEmbodiment #OpenHardware #RealWorldClaw #3DPrinting

### 自动化
- 需要：X Developer 账号 + API key
- 状态：⏳ 待确认账号

## 四、小红书

### 内容方向
1. 3D 打印教程（图文）
2. AI 硬件项目展示
3. 开源项目科普
4. 创客工作台/设备展示

### 风格
- 封面图吸睛、标题用 emoji + 数字
- 标签：#3D打印 #AI硬件 #开源项目 #创客

### 自动化
- 无公开 API，脚本生成内容 → 人工发布
- 状态：⏳ 待确认账号

## 五、KPI（月度）

| 指标 | 目标 |
|------|------|
| 社区帖子 | 30-40 |
| 社区回复 | 50+ |
| X followers | +100 |
| 小红书笔记 | 12-15 |

## 六、立即可执行

1. ✅ 社区自动发帖+回复（API就绪，需 RWC_API_KEY）
2. ⏳ X — 需确认账号
3. ⏳ 小红书 — 需确认账号
