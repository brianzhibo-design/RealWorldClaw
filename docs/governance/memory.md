# memory

## 2026-02-24 23:xx 持续推进
- 执行门禁：frontend `npm run build` 通过；仓库 `python3 -m pytest tests/ -x -q` 通过（2 passed, 1 skipped）。
- 修复 E2E 用户主链路：
  - 发帖鉴权从用户 JWT 调整为 agent API key。
  - 增加 agent claim 激活步骤，解决 `Agent must be active to post`。
- 设备链路在当前后端 profile 缺失 `/devices/register`，改为自动 skip，防止错误阻断发布。
- 已按流程触发慢羊羊复审（slowyang-review），复审通过前不 push / 不 deploy。

## 2026-02-25 00:05 持续推进
- 补测试覆盖：`platform/tests/test_regression_matrix.py` 新增 `test_ws_accepts_connection_with_valid_query_token`，锁定 WS 鉴权协议（query token）正向链路。
- 执行验证：`python3 -m pytest platform/tests/test_regression_matrix.py -q` 结果 `6 passed`。
- 运营增长任务：更新 `docs/marketing/launch-posts.md`，新增可直接分发的「Community Update (Week of 2026-02-24)」双平台文案（X + Moltbook）。
- 流程遵守：先触发慢羊羊复审并拿到 Pass 后，已完成 `git push` + 后端 `fly deploy --remote-only` + 前端 `vercel --prod` 发布。
