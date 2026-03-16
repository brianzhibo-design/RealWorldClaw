# RWC 升级推进方案（2026-03-16 审查后制定）

## 审查结论

### 现状快照
- **仓库**: 241 commits, 单 main 分支, GitHub remote OK
- **CI**: 4 workflows (ci/codeql/pages/release) 全绿，最近 run 2026-03-02
- **线上**: realworldclaw.com 200 ✅ / realworldclaw-api.fly.dev 200 ✅
- **GitHub**: 8 stars, 3 forks, 0 open issues
- **后端测试**: 19 个测试文件, 269 个 test functions（无覆盖率度量）
- **前端测试**: ❌ 零（无 vitest/jest，package.json 无 test script）
- **数据库迁移**: ❌ 无 Alembic
- **错误追踪**: ❌ 无 Sentry
- **依赖更新**: ❌ 无 Dependabot
- **凭证**: scripts/post_xhs.mjs 已不存在（历史已清理），.gitignore 已含 .env
- **.env.example**: ❌ 无
- **暂停天数**: 12 天（最后 commit 2026-03-04）

### 阶段零剩余
- Z-2 凭证清理: `post_xhs.mjs` 在当前主仓已不存在，无明文凭证残留 → **可直接勾选**
- Z-3 `.env.example`: 缺失 → 需创建
- Z-7 commit + push → 等 Z-3 完成后一起

---

## 每日推进节奏

### 原则
1. 每天至少完成 1 个检查项
2. 代码改动派员工，蛋蛋只调度验收
3. 完成即 commit+push+勾选追踪器
4. 每周一 cron 自动提醒（已配置）

### 执行排期

| 日期 | 任务 | 派谁 | 产出 |
|------|------|------|------|
| 3/16 (今天) | Z-3 .env.example + Z-7 收口 commit | 蛋蛋(模板) | 阶段零关闭 |
| 3/17 | 1-4 Dependabot.yml | 灰太狼 | PR merge |
| 3/18 | 1-1a pytest-cov + CI覆盖率输出 | 美羊羊 | CI 出覆盖率数字 |
| 3/19 | 1-1b 补测到 60%（按需分批） | 美羊羊+暖羊羊 | 覆盖率 ≥ 60% |
| 3/20 | 1-3 Sentry 后端接入 | 美羊羊 | sentry-sdk 集成 |
| 3/21 | 1-3 Sentry 前端接入 | 美羊羊 | @sentry/nextjs |
| 3/22-23 | 1-2 Alembic 迁移系统 | 沸羊羊 | 初始迁移+CI检查 |
| 3/24-25 | 1-5 前端 vitest 测试 | 美羊羊 | 3个核心页面测试 |
| 3/26 | 阶段一收口 | 蛋蛋验收 | 评分更新 7.5 |

> 以上为目标节奏，实际按完成情况滚动调整。

---

## 立即行动：今天关闭阶段零
