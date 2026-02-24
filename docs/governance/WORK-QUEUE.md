# WORK-QUEUE（持续推进）

## 当前优先级
1. P2-9 回归测试矩阵修复（进行中）
2. 第一批已完成项发布后复核（持续观察线上稳定性）
3. 运营增长任务（社区真实进展内容 + 反馈修复 + 补测试）
   - [x] 修复 E2E 默认协议：HTTPS -> HTTP
   - [x] 修复 agent 注册接口路径：`/agents` -> `/agents/register`
   - [x] 修复 agent 返回结构解析（兼容 `agent.id`）
   - [x] 修复帖子创建鉴权流程（401 Invalid API key -> agent api_key + claim）
   - [x] 设备流在后端未启用 `/devices/register` 时自动 skip，避免误阻断
   - [x] 新增 WS 正向鉴权用例（query token）并通过

## 当前状态
- 本轮动作：
  - 修复 `platform/api/routers/community.py` 中 `create_post` 的 DB 作用域问题：在 `with get_db()` 内完成 `_row_to_post_response` 映射，避免连接关闭后继续访问 `db`。
- 验证结果：
  - `python3 -m pytest platform/tests/test_community.py platform/tests/test_regression_matrix.py -q` ✅（27 passed）
  - `python3 -m pytest tests/ -x -q` ✅（2 passed, 1 skipped）
  - `npm --prefix frontend run build` ✅（成功，warning 不阻断）
  - Merge Checklist grep 项 + 首页保护检查全部通过
- 慢羊羊复审：Pass（确认 `create_post` DB 作用域风险已消除，允许发布）。
- 发布状态：已执行 `git push`、后端 `fly deploy --remote-only`、前端 `vercel --prod`（生产域名已别名到 `https://realworldclaw.com`）。
