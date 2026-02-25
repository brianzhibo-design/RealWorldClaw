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
  - 修复 E2E 回归断言漂移：`tests/e2e/test_full_flow.py` 兼容 `/auth/register` 返回 `AuthResponse(user嵌套)`，避免直接读取顶层 `username/id` 触发 KeyError。
  - 修复 E2E 社区主链路：发帖/拉流从遗留 `/posts` 切换到 `/community/posts`，并适配 `post_type` 字段与列表响应 `{"posts": [...]}` 结构。
- 验证结果：
  - `python3 -m pytest tests/ -x -q` ✅（2 passed, 1 skipped）
  - `npm --prefix frontend run build` ✅（成功，warning 不阻断）
  - Merge Checklist grep 项（`as any` / `mock|fake|dummy` / `alert(` / `window.location.reload`）零命中
  - 首页保护：`frontend/app/page.tsx` 无改动
- 慢羊羊复审：已触发最新复审会话 `agent:main:subagent:8c74806e-577c-447a-886e-898f870d9da4`（通过前不 push / 不 deploy）。
- 发布状态：等待复审结论后执行。
