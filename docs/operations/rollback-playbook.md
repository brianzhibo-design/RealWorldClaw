# Rollback Playbook

> 当部署出问题时，快速回滚到上一个稳定版本。

## 1. 前端回滚（Vercel）

1. 打开 [Vercel Dashboard](https://vercel.com) → 选择 RealWorldClaw 项目
2. 进入 **Deployments** 页面
3. 找到上一个正常工作的 deployment（绿色 ✓）
4. 点击该 deployment 右侧 **⋮** → **Promote to Production**
5. 确认后等待约 30 秒生效

## 2. 后端回滚（Fly.io）

```bash
# 查看历史发布
fly releases -a realworldclaw-api

# 找到上一个正常的 image（VERSION 列）
# 回滚到指定 image
fly deploy --image <previous-image> -a realworldclaw-api

# 验证
curl https://realworldclaw-api.fly.dev/health
```

## 3. 数据库回滚

### 原则
- Migration 必须**向前兼容**：新代码能跑旧 schema，旧代码也能跑新 schema
- 只加列，不删列（至少保留一个版本周期）

### 手动回滚步骤
```bash
# SSH 进 Fly 实例
fly ssh console -a realworldclaw-api

# 备份当前数据库
cp /data/realworldclaw.db /data/realworldclaw.db.bak.$(date +%s)

# 如果有 Alembic:
# alembic downgrade -1

# 如果是手动 migration，参考 platform/api/migrations/ 中的 down 脚本
```

## 4. 紧急联系人

| 角色 | 负责人 | 联系方式 |
|------|--------|----------|
| 项目负责人 | 懒羊羊大人 (Brian) | Feishu |
| 后端 | 沸羊羊 | Feishu |
| 前端 | 美羊羊 | Feishu |
| SRE/发布 | 红太狼 | Feishu |

## 5. 回滚后 Checklist

- [ ] 确认 `/health` 返回 `"status": "ok"`
- [ ] 确认 `/api/v1/health/detailed` 数据库连接正常
- [ ] 确认 `/api/v1/readiness` 返回 `"ready": true`
- [ ] 检查前端首页能正常加载
- [ ] 检查核心功能：登录、社区帖子列表、组件搜索
- [ ] 在 Feishu 群通知团队回滚已完成
- [ ] 创建 incident 记录（原因、影响范围、回滚时间）
- [ ] 安排 postmortem（24小时内）
