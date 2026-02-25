# WORK-QUEUE（持续推进）

## 当前优先级
1. P2-9 回归测试矩阵修复（进行中）
2. 第一批已完成项发布后复核（持续观察线上稳定性）
3. 运营增长任务（社区真实进展内容 + 反馈修复 + 补测试）
4. 文档与目录债清理（防旧路由回流）
   - [x] 修复 E2E 默认协议：HTTPS -> HTTP
   - [x] 修复 agent 注册接口路径：`/agents` -> `/agents/register`
   - [x] 修复 agent 返回结构解析（兼容 `agent.id`）
   - [x] 修复帖子创建鉴权流程（401 Invalid API key -> agent api_key + claim）
   - [x] 设备流在后端未启用 `/devices/register` 时自动 skip，避免误阻断
   - [x] 新增 WS 正向鉴权用例（query token）并通过

## 当前状态（17:49 更新）
- 本轮动作（1-2项已完成）：
  - 第二批 P2-9 回归矩阵补强：`platform/tests/test_regression_matrix.py` 新增 `test_community_feed_prioritizes_followed_author_posts`，锁定 `/community/feed` 的 follow-priority 契约（关注作者内容需进入推荐前列）。
  - 运营增长补充：`docs/community/seed-posts.md` 新增 Post 41（个性化 feed 关注权重回归闭环复盘）。
- 验证结果：
  - `JWT_SECRET_KEY=test-secret python3 -m pytest platform/tests/test_regression_matrix.py -q` ✅（24 passed）
  - 首页保护：`frontend/app/page.tsx` 无改动
  - 约束复核：本轮未引入 `as any` / `Coming Soon` / `mock|fake|dummy`
- 发布状态：`git status --short --branch` 当前为 `## main...origin/main`（无未发布本地 commit）；按流程本轮不触发慢羊羊复审，不 push / 不 deploy。

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

## 当前状态（13:30 更新）
- 本轮动作（1-2项已完成）：
  - 第一批 P0/P1-6 收尾：删除已废弃且为空的历史路由目录 `frontend/app/devices`、`frontend/app/maker-orders`，防止后续误加页面造成迁移回流。
  - 运营增长补充：`docs/community/seed-posts.md` 新增 Post 25（“Migration debt cleanup”真实工程进展）。
- 验证结果：
  - `git status --short --branch` -> `## main...origin/main`（无 ahead 本地提交）
  - 目标目录已清理（`find frontend/app -maxdepth 2 -type d | grep -E 'devices|maker-orders'` 无命中）
  - 首页保护：`frontend/app/page.tsx` 无改动
- 发布状态：本轮仅工作树改动、无未发布本地 commit；按流程暂不触发慢羊羊复审，不 push / 不 deploy。

## 当前状态（13:40 更新）
- 本轮动作（1-2项已完成）：
  - 第二批 P2-9 回归矩阵补强：`platform/tests/test_regression_matrix.py` 新增 `test_ws_rejects_cross_user_orders_subscription`，覆盖订单频道跨用户订阅拒绝（4003）边界，确保 WS 权限校验在 notifications/orders 两条主通道一致。
  - 运营增长补充：`docs/community/seed-posts.md` 新增 Post 26（WS 订单频道权限回归闭环复盘）。
- 验证结果：
  - `python3 -m pytest platform/tests/test_regression_matrix.py -q` ✅（16 passed）
  - 首页保护：本轮未改动 `frontend/app/page.tsx`
  - 约束复核：未引入 `mock/coming soon/as any`
- 发布状态：当前仅工作树改动，`main...origin/main` 无 ahead commit；按流程本轮不触发慢羊羊复审，不 push / 不 deploy。

## 当前状态（13:50 更新）
- 本轮动作（1-2项已完成）：
  - 第二批 P2-9 回归矩阵补强：`platform/tests/test_regression_matrix.py` 新增 `test_ws_rejects_cross_user_printer_subscription`，覆盖 printer 频道跨用户订阅拒绝（4003）边界，完成 notifications/orders/printer 权限拒绝用例对齐。
  - 运营增长补充：`docs/community/seed-posts.md` 新增 Post 27（打印机频道权限回归闭环复盘）。
- 验证结果：
  - `python3 -m pytest platform/tests/test_regression_matrix.py -q` ✅（17 passed）
  - 首页保护：`frontend/app/page.tsx` 无改动
  - 约束复核：本轮变更文件未引入 `mock/coming soon/as any`
- 发布状态：当前仍为工作树改动，`main...origin/main` 无 ahead commit；按流程本轮不触发慢羊羊复审，不 push / 不 deploy。

## 当前状态（14:00 更新）
- 本轮动作（1-2项已完成）：
  - 第二批 P2-9 回归矩阵补强：`platform/tests/test_regression_matrix.py` 新增 `test_social_follow_lifecycle_updates_is_following_state`，覆盖 social 关注状态完整流转（初始未关注 → follow → 已关注 → unfollow → 未关注）。
  - 运营增长补充：`docs/community/seed-posts.md` 新增 Post 28（社交链路状态契约回归复盘）。
- 验证结果：
  - `python3 -m pytest platform/tests/test_regression_matrix.py -q` ✅（18 passed）
  - 首页保护：`frontend/app/page.tsx` 无改动
  - 约束复核：本轮新增代码未引入 `as any`，未改动首页文件
- 发布状态：当前为工作树改动，`main...origin/main` 无 ahead commit；按流程本轮不触发慢羊羊复审，不 push / 不 deploy。

## 当前状态（14:10 更新）
- 本轮动作（1-2项已完成）：
  - 第二批 P2-9 回归矩阵补强：`platform/tests/test_regression_matrix.py` 新增 `test_search_type_node_only_excludes_posts_and_users`，锁定 `GET /search?type=node` 的窄过滤契约（仅 spaces，posts/users 为空，`total == len(spaces)`）。
  - 运营增长补充：`docs/community/seed-posts.md` 新增 Post 29（Search filter contract 回归闭环复盘）。
- 验证结果：
  - `python3 -m pytest platform/tests/test_regression_matrix.py -q` ✅（19 passed）
  - 首页保护：`frontend/app/page.tsx` 无改动
  - 约束复核：本轮新增代码未引入 `as any`，未引入 mock/coming soon
- 发布状态：当前为工作树改动，`main...origin/main` 无 ahead commit；按流程本轮不触发慢羊羊复审，不 push / 不 deploy。

## 当前状态（14:20 更新）
- 本轮动作（1-2项已完成）：
  - 第二批 P2-9 回归矩阵补强：`platform/tests/test_regression_matrix.py` 新增 `test_ws_accepts_notifications_subscription_for_token_owner`，补齐 notifications 频道正向鉴权（token owner 可订阅）覆盖，与既有 4003 拒绝用例形成“允许+拒绝”双向契约。
  - 运营增长补充：`docs/community/seed-posts.md` 新增 Post 30（Notifications 正向鉴权回归闭环复盘）。
- 验证结果：
  - `python3 -m pytest platform/tests/test_regression_matrix.py -q` ✅（20 passed）
  - 首页保护：`frontend/app/page.tsx` 无改动
  - 约束复核：本轮新增代码未引入 `as any`，未引入 mock/coming soon
- 发布状态：当前为工作树改动，`main...origin/main` 无 ahead commit；按流程本轮不触发慢羊羊复审，不 push / 不 deploy。

## 当前状态（14:30 更新）
- 本轮动作（1-2项已完成）：
  - 第二批 P2-9 回归矩阵补强：`platform/tests/test_regression_matrix.py` 新增 `test_ws_accepts_printer_subscription_for_token_owner`，补齐 printer 频道正向鉴权覆盖，与既有跨用户拒绝(4003)用例形成双向契约。
  - 运营增长补充：`docs/community/seed-posts.md` 新增 Post 31（Printer 频道鉴权“允许+拒绝”闭环复盘）。
- 验证结果：
  - `JWT_SECRET_KEY=test-secret python3 -m pytest platform/tests/test_regression_matrix.py -q` ✅（21 passed）
  - 首页保护：`frontend/app/page.tsx` 无改动
  - 约束复核：本轮新增代码未引入 `as any`/`Coming Soon`
- 发布状态：`main...origin/main` 无 ahead commit；按流程本轮不触发慢羊羊复审，不 push / 不 deploy。

## 当前状态（14:40 更新）
- 本轮动作（1-2项已完成）：
  - 第二批 P2-9 安全回归补强：完成 agent key 存储与校验链路复核（哈希存储 + 兼容旧明文回退），并验证 `platform/tests/test_agents.py`、`platform/tests/test_ws_manager.py` 与回归矩阵联测。
  - 运营增长补充：`docs/community/seed-posts.md` 新增 Post 32（Agent API key 哈希化与 rotation 权限闭环复盘）。
- 验证结果：
  - `JWT_SECRET_KEY=test-secret python3 -m pytest platform/tests/test_ws_manager.py platform/tests/test_agents.py platform/tests/test_regression_matrix.py -q` ✅（38 passed）
  - `npm --prefix frontend run build` ✅（成功）
  - Merge Checklist grep + 首页保护 ✅（零命中，`frontend/app/page.tsx` 无改动）
- 发布状态：`main...origin/main` 无 ahead commit；按流程本轮不触发慢羊羊复审，不 push / 不 deploy。

## 当前状态（15:36 更新）
- 本轮动作（1-2项已完成）：
  - 代码质量补强（地图链路）：`frontend/lib/nodes.ts` 为 `ManufacturingNode` 增补 `country/country_code` 可选字段，`frontend/app/map/page.tsx` 去除临时类型断言，国家统计逻辑改为基于显式类型字段推导。
  - 稳定性补强（地图动效）：`frontend/components/WorldMap.tsx` 新增 `requestAnimationFrame` 卸载清理，避免页面离开后残留动画句柄。
  - 运营增长补充：`docs/community/seed-posts.md` 新增 Post 33（地图 UX + 类型契约 + 动画清理复盘）。
- 验证结果：
  - `npm --prefix frontend run build` ✅（成功）
  - `python3 -m pytest tests/ -x -q` ✅（2 passed, 1 skipped）
  - 约束复核：未引入 `as any` / `Coming Soon` / `mock|MOCK|fake|dummy`；首页保护满足（`frontend/app/page.tsx` 无改动）
- 发布状态：当前仅工作树改动，`main...origin/main` 无 ahead commit；按流程本轮不触发慢羊羊复审，不 push / 不 deploy。

## 当前状态（16:39 更新）
- 本轮动作（1-2项已完成）：
  - 第二批 P2-9 回归矩阵补强：`platform/tests/test_regression_matrix.py` 新增 `test_ws_accepts_notifications_subscription_with_first_auth_message_token`，补齐 notifications 频道“query token / 首帧 auth / 跨用户拒绝”三角契约覆盖。
  - 运营增长补充：`docs/community/seed-posts.md` 新增 Post 34（notifications 首帧鉴权契约闭环复盘）。
- 验证结果：
  - `JWT_SECRET_KEY=test-secret python3 -m pytest platform/tests/test_regression_matrix.py -q` ✅（22 passed）
  - 首页保护：`frontend/app/page.tsx` 无改动
  - 约束复核：本轮新增代码未引入 `as any` / `Coming Soon` / `mock|MOCK|fake|dummy`
- 发布状态：当前为工作树改动，`main...origin/main` 无 ahead commit；按流程本轮不触发慢羊羊复审，不 push / 不 deploy。

## 当前状态（17:19 更新）
- 本轮动作（1-2项已完成）：
  - 节点国家元数据闭环：`platform/api/routers/nodes.py` 在节点注册时推断并写入 `country_code`，并新增回填迁移 `platform/alembic/versions/20260225_171500_backfill_node_country_code.py` 补齐历史数据。
  - 社区契约补强：`platform/api/routers/community.py` 新增个性化 feed 与按 post 维度设置最佳答案接口；同步持久化 `best_comment_id/resolved_at`，避免详情页字段漂移。
- 验证结果：
  - `JWT_SECRET_KEY=test-secret python3 -m pytest platform/tests/test_nodes.py platform/tests/test_community.py -q` ✅（36 passed）
  - `python3 -m pytest tests/ -x -q` ✅（2 passed, 1 skipped）
  - `npm --prefix frontend run build` ✅（成功）
  - Merge Checklist grep + 首页保护 ✅（零命中，`frontend/app/page.tsx` 无改动）
- 发布状态：已提交 `c661e83`，当前 `main...origin/main [ahead 1]`；已按流程触发慢羊羊复审 `agent:main:subagent:2d4d1fa8-1802-484a-8811-f98742f20472`，结论返回前不 push / 不 deploy。

## 当前状态（17:29 更新）
- 本轮动作（1-2项已完成）：
  - 第二批 P2-9 数据一致性回归补强：`platform/tests/test_nodes.py` 新增 `test_get_map_backfills_country_code_for_legacy_nodes`，覆盖历史节点 `country_code` 为空时的“读取即修复 + 持久化回填”契约。
  - 运营增长补充：`docs/community/seed-posts.md` 新增 Post 35（Legacy 节点国家码自愈链路复盘）。
  - 质量债清理：移除归档页面中的 `coming soon` 表述注释（`frontend/app/_archived/components/page.tsx`），保持“零 coming soon”硬约束持续满足。
- 验证结果：
  - `JWT_SECRET_KEY=test-secret python3 -m pytest platform/tests/test_nodes.py -q` ✅（25 passed）
  - `python3 -m pytest tests/ -x -q` ✅（2 passed, 1 skipped）
  - `npm --prefix frontend run build` ✅（成功）
  - Merge Checklist grep + 首页保护 ✅（`as any`/`mock|fake|dummy`/`coming soon`/`alert(`/`window.location.reload` 零命中；`frontend/app/page.tsx` 无改动）
- 发布状态：当前为工作树改动，`main...origin/main` 无 ahead commit；按流程本轮不触发慢羊羊复审，不 push / 不 deploy。

## 当前状态（17:42 更新）
- 本轮动作（1-2项已完成）：
  - 第二批 P2-9 社区契约回归补强：`platform/tests/test_regression_matrix.py` 新增 `test_community_post_best_answer_contract_persists_post_and_comment_fields`，覆盖 `POST /community/posts/{id}/best-answer` 后帖子详情字段与评论最佳答案标记的一致性。
  - 运营增长补充：`docs/community/seed-posts.md` 新增 Post 36（Best-answer 契约闭环复盘）。
- 验证结果：
  - `JWT_SECRET_KEY=test-secret python3 -m pytest platform/tests/test_regression_matrix.py -q` ✅（23 passed）
  - `python3 -m pytest tests/ -x -q` ✅（2 passed, 1 skipped）
  - `npm --prefix frontend run build` ✅（成功）
  - 首页保护：`frontend/app/page.tsx` 无改动
- 发布状态：当前仅工作树改动，`main...origin/main` 无 ahead commit；按流程本轮不触发慢羊羊复审，不 push / 不 deploy。

## 当前状态（18:00 更新）
- 本轮动作（1-2项已完成）：
  - 第二批 P2-9 回归矩阵补强：`platform/tests/test_regression_matrix.py` 新增 `test_community_post_best_answer_rejects_non_author_and_keeps_fields_unset`，覆盖非作者越权设最佳答案时的 403 拒绝与字段不变性（`best_answer_comment_id/best_comment_id/resolved_at` 维持 `null`、评论 `is_best_answer=false`）。
  - 运营增长补充：`docs/community/seed-posts.md` 新增 Post 42（best-answer 权限边界回归闭环复盘）。
- 验证结果：
  - `JWT_SECRET_KEY=test-secret python3 -m pytest platform/tests/test_regression_matrix.py -q` ✅（25 passed）
  - 首页保护：`frontend/app/page.tsx` 无改动
  - 约束复核：本轮代码改动未引入 `as any` / `Coming Soon` / `mock|fake|dummy`
- 发布状态：`git status --short --branch` 当前为 `## main...origin/main`（无未发布本地 commit）；按流程本轮不触发慢羊羊复审，不 push / 不 deploy。

## 当前状态（18:09 更新）
- 本轮动作（1-2项已完成）：
  - 第二批 P2-9 回归矩阵补强：`platform/tests/test_regression_matrix.py` 新增 `test_community_post_best_answer_switch_clears_previous_flag`，覆盖“最佳答案二次改选”状态一致性（A→B 改选后，帖子字段指向 B，A 的 `is_best_answer` 回落为 `false`）。
  - 运营增长补充：`docs/community/seed-posts.md` 新增 Post 43（best-answer 改选状态一致性复盘）。
- 验证结果：
  - `JWT_SECRET_KEY=test-secret python3 -m pytest platform/tests/test_regression_matrix.py -q` ✅（26 passed）
  - Merge Checklist grep（`as any` / `mock|MOCK|fake|dummy` / `alert(` / `window.location.reload`）在 `frontend/app` 零命中
  - 首页保护：`frontend/app/page.tsx` 无改动
- 发布状态：当前仅工作树改动，`main...origin/main` 无 ahead commit；按流程本轮不触发慢羊羊复审，不 push / 不 deploy。

## 当前状态（18:29 更新）
- 本轮动作（1-2项已完成）：
  - 第二批 P2-9 回归矩阵补强：`platform/tests/test_regression_matrix.py` 新增 `test_community_posts_following_sort_requires_auth`，锁定 `GET /community/posts?sort=following` 在未认证场景下必须返回 401 的鉴权契约。
  - 运营增长补充：`docs/community/seed-posts.md` 新增 Post 45（following 视图鉴权门禁回归闭环复盘）。
- 验证结果：
  - `JWT_SECRET_KEY=test-secret python3 -m pytest platform/tests/test_regression_matrix.py -q` ✅（28 passed）
  - `python3 -m pytest tests/ -x -q` ✅（2 passed, 1 skipped）
  - `npm --prefix frontend run build` ✅（成功）
  - Merge Checklist grep + 首页保护 ✅（`frontend/app/page.tsx` 无改动）
- 发布状态：当前为工作树改动，`main...origin/main` 无 ahead commit；按流程本轮不触发慢羊羊复审，不 push / 不 deploy。

## 当前状态（18:19 更新）
- 本轮动作（1-2项已完成）：
  - 第二批 P2-9 回归矩阵补强：`platform/tests/test_regression_matrix.py` 新增 `test_community_post_best_answer_rejects_comment_from_another_post`，覆盖“comment_id 属于其他帖子”时 `POST /community/posts/{id}/best-answer` 返回 404 且目标帖子 `best_answer_comment_id/best_comment_id/resolved_at` 保持未设置的契约。
  - 运营增长补充：`docs/community/seed-posts.md` 新增 Post 44（跨帖子 best-answer 防污染复盘）。
- 验证结果：
  - `JWT_SECRET_KEY=test-secret python3 -m pytest platform/tests/test_regression_matrix.py -q` ✅（27 passed）
  - 首页保护：`frontend/app/page.tsx` 无改动
  - 约束复核：本轮未引入 `as any` / `Coming Soon` / `mock|fake|dummy`
- 发布状态：`git rev-list --left-right --count origin/main...HEAD` 为 `0 0`（无未发布本地 commit）；按流程本轮不触发慢羊羊复审，不 push / 不 deploy。

## 当前状态（18:39 更新）
- 本轮动作（1-2项已完成）：
  - 第二批 P2-9 回归矩阵补强：`platform/tests/test_regression_matrix.py` 新增 `test_community_posts_following_sort_prioritizes_followed_author`，锁定 `GET /community/posts?sort=following` 已认证场景下“关注作者内容优先出现”的正向排序契约。
  - 运营增长补充：`docs/community/seed-posts.md` 新增 Post 46（following 视图正向排序契约回归闭环复盘）。
- 验证结果：
  - `JWT_SECRET_KEY=test-secret python3 -m pytest platform/tests/test_regression_matrix.py -q` ✅（29 passed）
  - 首页保护：`frontend/app/page.tsx` 无改动
  - 约束复核：本轮未引入 `as any` / `Coming Soon` / `mock|fake|dummy`
- 发布状态：当前为工作树改动，`main...origin/main` 无 ahead commit；按流程本轮不触发慢羊羊复审，不 push / 不 deploy。

## 当前状态（18:49 更新）
- 本轮动作（1-2项已完成）：
  - 第二批 P2-9 回归矩阵补强：`platform/tests/test_regression_matrix.py` 新增 `test_community_posts_following_sort_returns_empty_when_no_follows`，锁定 `GET /community/posts?sort=following` 在“已认证但无关注关系”场景下的空态契约（`posts=[]/total=0/has_next=false`）。
  - 运营增长补充：`docs/community/seed-posts.md` 新增 Post 47（following 视图空态契约回归闭环复盘）。
- 验证结果：
  - `JWT_SECRET_KEY=test-secret python3 -m pytest platform/tests/test_regression_matrix.py -q` ✅（30 passed）
  - `python3 -m pytest tests/ -x -q` ✅（2 passed, 1 skipped）
  - `npm --prefix frontend run build` ✅（成功）
  - 首页保护：`frontend/app/page.tsx` 无改动
  - 约束复核：本轮未引入 `as any` / `Coming Soon` / `mock|fake|dummy`
- 发布状态：`git status --short --branch` 当前为 `## main...origin/main`（无未发布本地 commit）；按流程本轮不触发慢羊羊复审，不 push / 不 deploy。

## 当前状态（18:59 更新）
- 本轮动作（1-2项已完成）：
  - 第二批 P2-9 回归矩阵补强：`platform/tests/test_regression_matrix.py` 新增 `test_community_posts_following_sort_pagination_contract`，锁定 `GET /community/posts?sort=following` 在 `limit=1` 条件下 `page=1/2` 的分页元数据契约（`total` 稳定、`has_next` 边界准确）。
  - 运营增长补充：`docs/community/seed-posts.md` 新增 Post 48（following 视图分页契约回归闭环复盘）。
- 验证结果：
  - `JWT_SECRET_KEY=test-secret python3 -m pytest platform/tests/test_regression_matrix.py -q` ✅（31 passed）
  - `python3 -m pytest tests/ -x -q` ✅（2 passed, 1 skipped）
  - `npm --prefix frontend run build` ✅（成功）
  - Merge Checklist grep + 首页保护 ✅（`frontend/app/page.tsx` 无改动）
- 发布状态：`git status --short --branch` 当前为 `## main...origin/main`（无未发布本地 commit）；按流程本轮不触发慢羊羊复审，不 push / 不 deploy。

## 当前状态（19:10 更新）
- 本轮动作（1-2项已完成）：
  - 第二批 P2-9 回归矩阵补强：`platform/tests/test_regression_matrix.py` 新增 `test_community_posts_following_sort_unfollow_excludes_previous_author`，覆盖 follow->unfollow 后 `sort=following` 结果即时剔除的契约。
  - 运营增长补充：`docs/community/seed-posts.md` 新增 Post 49（unfollow 即时生效回归闭环复盘）。
- 验证结果：
  - `JWT_SECRET_KEY=test-secret python3 -m pytest platform/tests/test_regression_matrix.py -q` ✅（32 passed）
  - `python3 -m pytest tests/ -x -q` ✅（2 passed, 1 skipped）
  - Merge Checklist grep + 首页保护 ✅（`frontend/app/page.tsx` 无改动）
- 发布状态：当前仅工作树改动，`main...origin/main` 无 ahead commit；按流程本轮不触发慢羊羊复审，不 push / 不 deploy。

## 当前状态（19:19 更新）
- 本轮动作（1-2项已完成）：
  - 第二批 P2-9 回归矩阵补强：`platform/tests/test_regression_matrix.py` 新增 `test_community_posts_following_sort_page_overflow_returns_empty_with_consistent_total`，锁定 `GET /community/posts?sort=following` 在越界分页场景（`limit=1,page=3`）必须返回空数组且保持 `total` 一致。
  - 运营增长补充：`docs/community/seed-posts.md` 新增 Post 50（following 越界分页契约回归闭环复盘）。
- 验证结果：
  - `JWT_SECRET_KEY=test-secret python3 -m pytest platform/tests/test_regression_matrix.py -q` ✅（33 passed）
  - `python3 -m pytest tests/ -x -q` ✅（2 passed, 1 skipped）
  - `npm --prefix frontend run build` ✅（成功）
  - Merge Checklist grep + 首页保护 ✅（`frontend/app/page.tsx` 无改动）
- 发布状态：当前仅工作树改动，`main...origin/main` 无 ahead commit；按流程本轮不触发慢羊羊复审，不 push / 不 deploy。

## 当前状态（19:29 更新）
- 本轮动作（1-2项已完成）：
  - 第二批 P2-9 回归矩阵补强：`platform/tests/test_regression_matrix.py` 新增 `test_community_posts_following_sort_author_filter_excludes_non_followed_author`，锁定 `sort=following` 与 `author_id` 组合场景下“过滤只能收窄、不能扩大权限范围”的契约。
  - 运营增长补充：`docs/community/seed-posts.md` 新增 Post 51（following + author 组合过滤边界回归复盘）。
- 验证结果：
  - `JWT_SECRET_KEY=test-secret python3 -m pytest platform/tests/test_regression_matrix.py -q` ✅（34 passed）
  - `python3 -m pytest tests/ -x -q` ✅（2 passed, 1 skipped）
  - `npm --prefix frontend run build` ✅（成功）
  - Merge Checklist grep + 首页保护 ✅（`frontend/app/page.tsx` 无改动）
- 发布状态：当前仅工作树改动，`main...origin/main` 无 ahead commit；按流程本轮不触发慢羊羊复审，不 push / 不 deploy。
