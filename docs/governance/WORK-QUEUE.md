# WORK-QUEUE（待办任务队列）

## 待派发 Brief

### Brief 1 — Proof/Evolution 发布前收敛（后端）
- **任务**：固化 proof→verify→XP→leaderboard 端到端契约，补权限/幂等/异常边界，确认文档与实际响应一致
- **派谁**：🐺 小灰灰（主责）+ 🐑 暖羊羊（验收）+ 🧓 慢羊羊（门禁审查）
- **验证**：
  1. `JWT_SECRET_KEY=test pytest platform/tests/test_evolution.py platform/tests/test_community.py platform/tests/test_regression_matrix.py -q`
  2. 按 `docs/api/proof-evolution.md` 跑全链路smoke，附越权/重复verify/无效payload三类错误码证据
  3. 交付物：成功路径证据 + 失败回滚证据 + 文档字段对照表
- **状态**：未派发

### Brief 2 — 前端封板（orders/search/map）
- **任务**：统一加载/空态/错误态，确认map组件副作用清理稳定，lint warning压降
- **派谁**：🎀 美羊羊（主责）+ 🐑 暖羊羊（验收）
- **验证**：
  1. `npm --prefix frontend run lint` + `npm --prefix frontend run build`
  2. 人工回归三页面：加载态/空态/错误态/导航/地图连续操作
  3. 结果写入docs并标注阻断级别
- **状态**：未派发

## 已完成（2026-02-25）
- 回归测试矩阵扩展至35用例
- 社区种子帖52条
- QA修复（WS环境变量、移动端地图重叠、路由迁移重定向）
- Evolution System (L0-L4) + Search API + XP防刷机制
- API文档补充（proof-evolution.md）
- 前端lint warning 4→2
- 铁律制度建立

## 状态记录（2026-02-26 00:09 Asia/Shanghai）
- 已检查当前待派发项：Brief 1（后端 proof/evolution）与 Brief 2（前端 orders/search/map）均为**未派发**。
- 结合 `git status`：platform/* 与 frontend/* 的改动与上述两条 Brief 完全重合。
- 本轮决策：**不新增 Brief，不重复生成**；维持现有两条待派发任务，等待派发执行。
