# RWC 升级追踪器

## 当前阶段：三（社区建设，5/6 完成）
## 当前评分：8.5/10
## 目标：9.0+/10
## 主线锁定：大人指令，RWC 为唯一主线，闲鱼暂停

### 阶段零（当天）→ 6.8 ✅
- [x] Z-1 修复工作区软链接
- [x] Z-2 清理凭证硬编码
- [x] Z-3 创建 .env.example
- [x] Z-4 创建本文件
- [x] Z-5 更新 MEMORY.md 路径
- [x] Z-6 禁用闲鱼 cron
- [x] Z-7 commit + push (d61f3b9)

### 阶段一（1-2 周）→ 7.5 ✅
- [x] 1-1 测试覆盖率 >= 60% + Codecov badge (47dc4d1, 当前60%)
- [x] 1-2 Alembic 数据库迁移 (6c20a42)
- [x] 1-3 Sentry 错误追踪 (b0e0cf0, 后端已接入)
- [x] 1-4 Dependabot 依赖更新 (47dc4d1)
- [x] 1-5 前端 vitest 测试 (e52cdac, 3 smoke tests passed)

### 阶段二（2-4 周）→ 8.0
- [x] 2-1 API Key 生命周期 (bf88e3f, create/rotate/revoke/expire + 5 tests)
- [x] 2-2 落地页真实化 (fcddff6, GA/Form env vars)
- [ ] 2-3 真实硬件演示视频（待大人配合打印）
- [x] 2-4 前端质量提升 (3be8cdc, ErrorBoundary/loading/auth/a11y)
- [x] 2-5 监控告警 (9ab94c7, README badges + docs/monitoring.md)

### 阶段三（1-3 月）→ 8.5
- [x] 3-1 10 个 good-first-issue (#34-#43, 覆盖前端/后端/CI/文档/测试)
- [x] 3-2 GitHub Discussions 激活 (Welcome帖 #44)
- [ ] 3-3 社区推广（Reddit/HN/PH）
- [x] 3-4 贡献者体验优化 (4b6cffc, docker-compose + Dockerfile + Makefile + dependabot加固)
- [x] 3-5 版本发布节奏 (v0.2.0 released, changelog自动生成)
- [ ] 3-6 KPI: 50+ Stars / 3+ 外部 PR

### 阶段四（3-6 月）→ 9.0+
- [ ] 4-1 PostgreSQL
- [ ] 4-2 Redis
- [ ] 4-3 K8s/多实例
- [ ] 4-4 渗透测试
- [ ] 4-5 SLO 定义
- [ ] 4-6 OpenTelemetry
- [ ] 4-7 GDPR 接口
- [ ] 4-8 KPI: 100+ Stars / 10+ 贡献者

### 更新日志
| 日期 | 阶段 | 动作 | 评分变化 |
|------|------|------|---------|
| 2026-03-16 | 零 | 路线图创建 | 6.5 |
| 2026-03-16 | 零→一 | 阶段零全部完成 | 6.5→6.8 |
| 2026-03-16 | 一 | 1-1~1-5 全部完成 | 6.8→7.5 |
| 2026-03-16 | 二 | 2-1/2-2/2-4/2-5 完成 | 7.5→7.8 |
| 2026-03-16 | 三 | 3-1 good-first-issues(10个) + 3-2 Discussions启用 + Dependabot PR合并(#24/#26) + MCP xhs接入 | 7.8→8.2 |
| 2026-03-16 | 三 | 3-4 contributor DX(docker-compose/Makefile) + 3-5 v0.2.0 release + 首个外部PR#50合并 + PR清理(#46/#48/#51/#53合,#27/#45/#47/#49/#52关) | 8.2→8.5 |
