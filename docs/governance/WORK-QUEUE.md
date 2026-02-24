# WORK-QUEUE（持续推进）

## 当前优先级
1. P0/P1 已完成项复核（等待慢羊羊复审结果，未通过前不push/deploy）
2. P2-9 回归测试矩阵修复（进行中）
   - [x] 修复 E2E 默认协议：HTTPS -> HTTP
   - [x] 修复 agent 注册接口路径：`/agents` -> `/agents/register`
   - [x] 修复 agent 返回结构解析（兼容 `agent.id`）
   - [x] 修复帖子创建鉴权流程（401 Invalid API key -> agent api_key + claim）
   - [x] 设备流在后端未启用 `/devices/register` 时自动 skip，避免误阻断

## 当前状态
- 门禁结果：`npm run build`（frontend）✅；`python3 -m pytest tests/ -x -q` ✅（2 passed, 1 skipped）。
- 本地有未发布 commit（ahead 2）+ 本轮新改动未提交，已触发慢羊羊复审，等待结论后再 push/deploy。
