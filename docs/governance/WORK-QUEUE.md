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
  - 清理第一批遗留迁移页问题（P0/P1-6 子项）：`frontend/app/makers/register/page.tsx` 注册成功跳转从 `/maker-orders` 统一为 `/orders`，避免历史路由污染 IA。
  - 运营增长补充：`docs/community/seed-posts.md` 新增 Post 22（路由债清理与转化一致性，真实工程进展素材）。
- 验证结果：
  - `python3 -m pytest platform/tests/test_regression_matrix.py -q` ✅（14 passed）
  - `npm --prefix frontend run build` ✅（成功，warning 不阻断）
  - Merge Checklist grep 项（`as any` / `mock|fake|dummy` / `alert(` / `window.location.reload`）零命中
  - 首页保护：`frontend/app/page.tsx` 无改动
- 慢羊羊复审：当前仅工作树改动，尚未形成“未发布本地 commit”，暂不触发复审。
- 发布状态：待下一轮形成 commit 后按流程执行“蛋蛋审查 → 慢羊羊复审 → push → deploy”。

## 当前状态（13:10 更新）
- 本轮动作（1-2项已完成）：
  - 第一批 P0/P1-6 路由治理补齐：`frontend/next.config.mjs` 新增永久重定向 `/devices/:path* -> /map/:path*`、`/maker-orders/:path* -> /orders/:path*`，确保历史深链与根路径一致迁移。
  - 运营增长补充：`docs/community/seed-posts.md` 新增 Post 23（整族路由迁移复盘与验证数据）。
- 验证结果：
  - `python3 -m pytest tests/ -x -q` ✅（2 passed, 1 skipped）
  - `npm --prefix frontend run build` ✅（成功）
  - Merge Checklist grep + 首页保护 ✅（均通过，`frontend/app/page.tsx` 无改动）
- 发布状态：当前仅工作树改动，`main...origin/main` 无 ahead commit；按流程本轮不触发慢羊羊复审，不 push / 不 deploy。

## 当前状态（13:20 更新）
- 本轮动作（1-2项已完成）：
  - 第一批 P0/P1-3 安全闭环推进：`platform/api/routers/files.py` 下载接口新增上传者作用域校验，非上传者访问返回 `403 Forbidden`，从“仅认证”升级为“认证 + 最小权限”。
  - 运营增长补充：`docs/community/seed-posts.md` 新增 Post 24（文件下载所有权鉴权修复复盘，附验证数据）。
- 验证结果：
  - `python3 -m pytest platform/tests/test_regression_matrix.py -q` ✅（15 passed）
  - `python3 -m pytest tests/ -x -q` ✅（2 passed, 1 skipped）
  - `npm --prefix frontend run build` ✅（成功）
  - Merge Checklist grep + 首页保护 ✅（均通过，`frontend/app/page.tsx` 无diff）
- 发布状态：当前仍为工作树改动，`main...origin/main` 无 ahead commit；按流程本轮不触发慢羊羊复审，不 push / 不 deploy。
