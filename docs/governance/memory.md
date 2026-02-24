# memory

## 2026-02-24 23:xx 持续推进
- 执行门禁：frontend `npm run build` 通过；仓库 `python3 -m pytest tests/ -x -q` 通过（2 passed, 1 skipped）。
- 修复 E2E 用户主链路：
  - 发帖鉴权从用户 JWT 调整为 agent API key。
  - 增加 agent claim 激活步骤，解决 `Agent must be active to post`。
- 设备链路在当前后端 profile 缺失 `/devices/register`，改为自动 skip，防止错误阻断发布。
- 已按流程触发慢羊羊复审（slowyang-review），复审通过前不 push / 不 deploy。
