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
  - 补强 `platform/api/routers/ws.py`：新增首帧 auth 等待超时、非法 payload 防护与 `_safe_close`，避免异常连接悬挂。
  - 增加 WS 频道级最小权限校验（notifications/orders/printer），阻断跨用户越权订阅。
  - 补齐回归矩阵 5 条负向用例（超时、非 dict payload、空 dict、提前断连、跨用户订阅拒绝）。
- 验证结果：
  - `python3 -m pytest platform/tests/test_regression_matrix.py -q` ✅（14 passed）
  - `python3 -m pytest tests/ -x -q` ✅（2 passed, 1 skipped）
  - `npm --prefix frontend run build` ✅（成功，warning 不阻断）
  - Merge Checklist grep 项（`as any` / `mock|fake|dummy` / `alert(` / `window.location.reload`）零命中
  - 首页保护：`frontend/app/page.tsx` 无改动
- 慢羊羊复审：待触发（通过前不 push / 不 deploy）。
- 发布状态：进入复审阶段后再执行 push + deploy。
