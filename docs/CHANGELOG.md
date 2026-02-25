# CHANGELOG

> 近期变更（基于 `git log`，按时间倒序整理）

## 2026-02-25

- **security(P0):** JWT 强制密钥、API Key 哈希、WS pong 超时、前端 token 加固（`5925f7e`）
- **chore:** 企业审查与竞争审查文档更新，回归测试 20 项通过，seed posts 批量补充（`3b95e8b`）
- **chore:** cron 批量改进（文件鉴权、路由跳转、OAuth 清理、测试）（`cf96e71`）
- **style:** 全站 section 背景提亮，提升可读性（`a5828fc`）
- **style(homepage):** 提升对比度与亮度，增加浮动光效（`903b6e4`）
- **feat(frontend):** 首页重设计并统一 landing（`a84920f`）
- **feat:** Agent 一行接入（skill、landing 卡片、README 快速开始）（`813a7f7`）
- **feat:** 社区规范、种子帖子、演示脚本与 agent-loop 规范（`98c5270`）
- **security(ws):** 强化 WS 鉴权边界与频道授权（`cf3146b`）
- **test:** 对齐 e2e 全链路与 auth/community 契约（`056ce45`）
- **fix(ws):** 鉴权协议统一，补齐首消息 fallback（`bc6338d`）
- **governance/docs:** 评审节奏、行动模板与队列状态更新（`e3fd09f`, `b220890`, `803876f`, `e3e11e6`）
- **test(regression):** 新增下载 404 边界回归覆盖并更新运维文档（`4bacd46`）
- **fix(community):** 修复 create_post DB 作用域问题（`cbc77f4`）
- **test(ws):** 增加 query-token 有效性回归测试（`328843a`）
- **test:** 稳定 e2e auth 流程与环境感知设备跳过策略（`7e4d07b`）

## 2026-02-24

- **feat:** 前端错误模型清理、metadata 清理、质量门禁脚本（`aec5a73`）

---

更多历史提交请执行：`git log --oneline --decorate --graph`
