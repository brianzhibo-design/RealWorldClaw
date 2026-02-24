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
  - 补充回归测试 `test_files_download_missing_file_returns_404_when_authenticated`，覆盖文件下载接口在“已鉴权 + 资源不存在”时的稳定错误语义（404）。
  - 产出一条新的社区进展播报文案（聚焦“回归矩阵边界补齐 + 发布门禁通过”），用于运营增长任务素材池。
- 验证结果：
  - `python3 -m pytest platform/tests/test_regression_matrix.py -q` ✅（7 passed）
  - `python3 -m pytest tests/ -x -q` ✅（2 passed, 1 skipped）
  - `npm --prefix frontend run build` ✅（成功，warning 不阻断）
  - Merge Checklist grep 项 + 首页保护检查全部通过
- 慢羊羊复审：已触发，待批（通过前不 push / 不 deploy）。
- 发布状态：等待复审结论后执行。
