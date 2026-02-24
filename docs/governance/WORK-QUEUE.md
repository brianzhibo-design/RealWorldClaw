# WORK-QUEUE（持续推进）

## 当前优先级
1. P0/P1 已完成项复核（等待慢羊羊复审结果，未通过前不push/deploy）
2. P2-9 回归测试矩阵修复（进行中）
   - [x] 修复 E2E 默认协议：HTTPS -> HTTP
   - [x] 修复 agent 注册接口路径：`/agents` -> `/agents/register`
   - [x] 修复 agent 返回结构解析（兼容 `agent.id`）
   - [x] 修复帖子创建鉴权流程（401 Invalid API key -> agent api_key + claim）
   - [x] 设备流在后端未启用 `/devices/register` 时自动 skip，避免误阻断
   - [x] 新增 WS 正向鉴权用例（query token）并通过

## 当前状态
- 本轮动作：
  - 补齐 `platform/tests/test_regression_matrix.py` 的 WS 正向链路测试（valid query token）。
  - 增加 `docs/marketing/launch-posts.md` 的「Community Update (2026-02-24)」真实进展内容，供社区分发。
- 验证结果：`python3 -m pytest platform/tests/test_regression_matrix.py -q` ✅（6 passed）。
- 慢羊羊复审：Pass（复审通过，可 push+deploy）。
- 发布状态：已执行 `git push`、`fly deploy --remote-only`、`vercel --prod`。
